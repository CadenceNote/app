// File: components/meetings/RealtimeNoteBoard.tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { RealtimeNoteEditor } from './RealtimeNoteEditor';
import { TeamRole } from '@/lib/types/team';

const COLORS = ['#f783ac', '#74b816', '#1098ad', '#d9480f', '#7048e8', '#e8590c'];
const SECTIONS = ['TODO', 'DONE', 'BLOCKERS'];

export function RealtimeNoteBoard({
  meetingId,
  participants,
  currentUserId,
  userRole,
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
}) {
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const [ydoc, setYDoc] = useState<Y.Doc | null>(null);
  const isVisibleRef = useRef(true);

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

  useEffect(() => {
    if (!meetingId) return;

    const setupProvider = () => {
      try {
        // If we already have a provider and it's connected, don't recreate
        if (providerRef.current?.wsconnected) {
          return () => { };
        }

        console.log('[YJS] Creating new provider for meeting:', meetingId);

        // Create new doc and provider
        const doc = new Y.Doc();
        const newProvider = new WebsocketProvider(
          process.env.NEXT_PUBLIC_YJS_SERVER_URL || 'wss://yjs-server-qot7.onrender.com',
          `meeting-${meetingId}`,
          doc,
          { connect: true }
        );

        // Set up connection status handlers
        newProvider.on('status', ({ status }: { status: 'connected' | 'disconnected' | 'connecting' }) => {
          console.log('[WebSocket] Status changed:', status);
          // Only update states if the page is visible
          if (isVisibleRef.current) {
            setIsConnected(status === 'connected');
            if (status !== 'connected') {
              setShowContent(false);
            }
          }
        });

        newProvider.on('sync', (isSynced: boolean) => {
          console.log('[YJS] Sync status:', isSynced);
          // Only update states if the page is visible
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

        // Initialize shared types for each section
        participants.forEach(participant => {
          SECTIONS.forEach(section => {
            const sectionKey = `${participant.id}-${section}`;
            console.log('[YJS] Initializing shared type for section:', sectionKey);
            if (!doc.share.has(sectionKey)) {
              doc.get(sectionKey, Y.XmlFragment);
            }
          });
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

        newProvider.awareness.on('change', () => {
          const clients = Array.from(newProvider.awareness.getStates().values());
          console.log('[YJS] Connected clients:', clients);
        });

        // Store provider references
        providerRef.current = newProvider;
        setProvider(newProvider);
        setYDoc(doc);

        return () => {
          console.log('[YJS] Cleaning up provider');
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          newProvider.destroy();
        };
      } catch (error) {
        console.error('[YJS] Error setting up provider:', error);
        setIsConnected(false);
        setIsSynced(false);
      }
    };

    return setupProvider();
  }, [meetingId, currentUserId, participants]);

  if (!isConnected || !isSynced || !showContent) {
    return (
      <div className="flex-1 relative">
        <div className="absolute inset-0 flex items-center justify-center bg-[#F9FAFB]">
          <div className="text-center">
            <div className="mb-4">
              <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <div className="text-lg font-medium text-gray-900">Loading collaborative session...</div>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has edit permissions
  const canEdit = (participantId: number) => {
    if (userRole === 'admin') return true;
    return participantId === currentUserId;
  };

  return (
    <div className="p-6 animate-fade-in">
      <div className="sticky top-0 z-10 -mt-6 -mx-6 px-6 py-2 bg-white/80 backdrop-blur-sm border-b flex items-center justify-between mb-6">
        <h2 className="font-semibold text-gray-900">Collaborative Notes</h2>
        <div className="flex items-center space-x-2">
          <div className="flex items-center text-green-600 text-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
            Connected
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {participants.map((participant) => (
          <div key={participant.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex items-center px-6 py-4 bg-gray-50 border-b">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{participant.full_name}</h3>
                <p className="text-sm text-gray-500">{participant.email}</p>
              </div>
              <div className="flex items-center space-x-3">
                {participant.id === currentUserId && (
                  <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    You
                  </span>
                )}
                {!canEdit(participant.id) && (
                  <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                    View Only
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
              {SECTIONS.map((section) => (
                <RealtimeNoteEditor
                  key={`${participant.id}-${section}`}
                  ydoc={ydoc}
                  provider={provider}
                  section={`${participant.id}-${section}`}
                  currentUserId={currentUserId}
                  meetingId={meetingId}
                  participants={participants}
                  editable={canEdit(participant.id)}
                  sectionTitle={section}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}