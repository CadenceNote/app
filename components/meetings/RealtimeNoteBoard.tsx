'use client';
import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { RealtimeNoteEditor } from './RealtimeNoteEditor';
import { TeamRole } from '@/lib/types/team';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserAvatar } from '../common/UserAvatar';
import { Task } from '@/lib/types/task';

const COLORS = ['#f783ac', '#74b816', '#1098ad', '#d9480f', '#7048e8', '#e8590c'];
const SECTIONS = ['TODO', 'DONE', 'BLOCKERS'];

export function RealtimeNoteBoard({
  meetingId,
  participants,
  currentUserId,
  userRole,
  onReady,
  tasks,
  onMentionClick,
  onTaskCreate,
  teamId,
}: {
  meetingId: number;
  participants: Array<{
    id: number;
    email: string;
    full_name: string;
    role?: TeamRole;
  }>;
  currentUserId: number;
  userRole: string;
  onReady?: () => void;
  tasks?: Array<{ id: number; title: string; team_ref_number: string; }>;
  onMentionClick?: (type: 'user' | 'task', id: string) => void;
  onTaskCreate?: (task: any) => void;
  teamId: number;
}) {
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>();
  const [ydoc] = useState(() => new Y.Doc());  // Create doc immediately and keep it stable
  const isVisibleRef = useRef(true);


  const [selectedUser, setSelectedUser] = useState<{
    id: number;
    email: string;
    full_name: string;
  } | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      isVisibleRef.current = isVisible;

      if (isVisible && providerRef.current) {
        // If we're becoming visible and we have a provider, just check the connection
        if (!providerRef.current.wsconnected) {
          providerRef.current.connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Initialize shared types for each section
  useEffect(() => {
    if (!ydoc) return;

    participants.forEach(participant => {
      SECTIONS.forEach(section => {
        const sectionKey = `${participant.id}-${section}`;
        if (!ydoc.share.has(sectionKey)) {
          ydoc.get(sectionKey, Y.XmlFragment);
        }
      });
    });
  }, [ydoc, participants]);

  // Set up WebSocket provider
  useEffect(() => {
    if (!meetingId || !ydoc) return;

    const setupProvider = () => {
      try {
        // If we already have a provider and it's connected, don't recreate
        if (providerRef.current?.wsconnected) {
          return;
        }

        console.log('[YJS] Creating new provider for meeting:', meetingId);

        // Create new provider with the existing doc
        const newProvider = new WebsocketProvider(
          process.env.NEXT_PUBLIC_YJS_SERVER_URL || 'wss://yjs-server-qot7.onrender.com',
          `meeting-${meetingId}`,
          ydoc,
          { connect: true }
        );

        // Set up connection status handlers
        newProvider.on('status', ({ status }: { status: 'connected' | 'disconnected' | 'connecting' }) => {
          console.log('[WebSocket] Status changed:', status);
          if (isVisibleRef.current) {
            setIsConnected(status === 'connected');
            if (status !== 'connected') {
              setShowContent(false);
            }
          }
        });

        newProvider.on('sync', (isSynced: boolean) => {
          console.log('[YJS] Sync status:', isSynced);
          if (isVisibleRef.current) {
            setIsSynced(isSynced);
            if (!isSynced) {
              setShowContent(false);
            } else {
              setTimeout(() => {
                setShowContent(true);
              }, 300);
            }
          }
        });

        // Set up awareness
        const currentUser = participants.find(p => p.id === currentUserId);
        if (currentUser) {
          console.log('[YJS] Setting local user state:', currentUser.full_name);
          newProvider.awareness.setLocalState({
            user: {
              name: currentUser.full_name,
              color: COLORS[currentUser.id % COLORS.length],
            }
          });
        }

        // Store provider references
        providerRef.current = newProvider;
        setProvider(newProvider);

        return () => {
          console.log('[YJS] Cleaning up provider');
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          newProvider.destroy();
          providerRef.current = null;
        };
      } catch (error) {
        console.error('[YJS] Error setting up provider:', error);
        setIsConnected(false);
        setIsSynced(false);
        providerRef.current = null;
      }
    };

    const cleanup = setupProvider();
    return () => cleanup?.();
  }, [meetingId, currentUserId, participants, ydoc]);

  const handleMentionClick = (type: 'user' | 'task', id: string) => {
    if (type === 'user') {
      const user = participants.find(p => p.id === Number(id));
      if (user) {
        setSelectedUser(user);
      }
    } else if (type === 'task') {
      const task = tasks.find(t => t.id === Number(id));
      if (task) {
        setSelectedTask(task);
      }
    }
  };
  // Notify when board is ready
  useEffect(() => {
    if (isConnected && isSynced && showContent) {
      onReady?.();
    }
  }, [isConnected, isSynced, showContent, onReady]);


  // Check if user has edit permissions
  const canEdit = (participantId: number) => {
    if (userRole === 'admin') return true;
    return participantId === currentUserId;
  };

  return (
    <div className="p-6 animate-fade-in">
      <div className="sticky top-0 z-10 -mt-6 -mx-6 px-6 py-4 bg-background/95 backdrop-blur-sm border-b flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">Collaborative Notes</h2>
          <div className={`flex items-center text-sm ${isConnected ? 'text-green-600' : 'text-muted-foreground'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-muted'}`}></div>
            {isConnected ? 'Connected' : 'Connecting...'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {participants.map((participant) => (
          <div key={participant.id} className="bg-card rounded-lg border shadow-sm overflow-hidden">
            <div className="bg-muted/50 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <UserAvatar
                    name={participant.full_name}
                    email={participant.email}
                    color={COLORS[participant.id % COLORS.length]}
                  />
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold">{participant.full_name}</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">{participant.email}</p>
                      {participant.id === currentUserId && (
                        <Badge variant="default">You</Badge>
                      )}
                      {!canEdit(participant.id) && (
                        <Badge variant="outline">View Only</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {SECTIONS.map((section, index) => (
                  <div key={`${participant.id}-${section}`} className="flex flex-col">
                    <RealtimeNoteEditor
                      ydoc={ydoc}
                      provider={provider}
                      section={`${participant.id}-${section}`}
                      currentUserId={currentUserId}
                      meetingId={meetingId}
                      participants={participants}
                      editable={canEdit(participant.id)}
                      sectionTitle={section}
                      tasks={tasks}
                      onMentionClick={onMentionClick}
                      teamId={teamId}
                    />
                    {index < SECTIONS.length - 1 && (
                      <Separator orientation="horizontal" className="lg:hidden my-4" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
