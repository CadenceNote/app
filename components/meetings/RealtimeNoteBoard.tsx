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
import React from 'react';
import { MeetingHeader } from './MeetingHeader';
import { TaskDetail } from '../tasks/TaskDetail';
import { UserDetailModal } from './UserDetailModal';

const COLORS = ['#f783ac', '#74b816', '#1098ad', '#d9480f', '#7048e8', '#e8590c'];
const SECTIONS = ['TODO', 'DONE', 'BLOCKERS'];

export function RealtimeNoteBoard({
  meetingId,
  participants,
  currentUserId,
  userRole,
  onReady,
  tasks,
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


        // Create new provider with the existing doc
        const newProvider = new WebsocketProvider(
          process.env.NEXT_PUBLIC_YJS_SERVER_URL || 'wss://yjs-server-qot7.onrender.com',
          `meeting-${meetingId}`,
          ydoc,
          { connect: true }
        );

        // Set up connection status handlers
        newProvider.on('status', ({ status }: { status: 'connected' | 'disconnected' | 'connecting' }) => {
          if (isVisibleRef.current) {
            setIsConnected(status === 'connected');
            if (status !== 'connected') {
              setShowContent(false);
            }
          }
        });

        newProvider.on('sync', (isSynced: boolean) => {
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
          <h2 className="text-xl font-semibold text-foreground">Realtime Collaborative Meeting Notes (Beta) </h2>
          <div className={`flex items-center text-sm ${isConnected ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 dark:bg-green-400 animate-pulse' : 'bg-muted'}`}></div>
            {isConnected ? 'Connected' : 'Connecting...'}
          </div>
        </div>
      </div>
      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 mb-6">
        <div className="max-w-[2000px] mx-auto px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-800 rounded-full">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">Realtime Collaboration Mode (Beta)</h3>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                You're in realtime mode where changes sync instantly. Other participants can see your cursor and edits in real-time.
                Each participant has their own color for easy identification.
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  Live Cursors
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Instant Sync
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Multi-User Editing
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Auto-Saving
                </div>
              </div>
            </div>
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
                    <h3 className="text-base font-semibold text-foreground">{participant.full_name}</h3>
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
                      onMentionClick={handleMentionClick}
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
      {/* Modals */}
      {selectedUser && (
        <UserDetailModal
          open={!!selectedUser}
          onOpenChange={(open) => !open && setSelectedUser(null)}
          user={selectedUser}
        />
      )}

      {selectedTask && (
        <TaskDetail
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
          teamId={teamId}
          onTaskUpdate={() => { }}
        />
      )}
    </div>
  );
}
