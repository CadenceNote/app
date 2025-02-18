'use client';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
import { TaskDetail } from '../tasks/TaskDetail';
import { UserDetailModal } from './UserDetailModal';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { MeetingDetail } from './MeetingDetail';
import { Button } from "@/components/ui/button";
import { Settings2, Calendar, Clock, Users, Target, ListOrdered, Link2 } from 'lucide-react';
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const COLORS = ['#f783ac', '#74b816', '#1098ad', '#d9480f', '#7048e8', '#e8590c'];
const SECTIONS = ['TODO', 'DONE', 'BLOCKERS'];

// Helper function to generate a shorter section ID
function generateSectionId(participantId: number, section: string) {
  // Create a shorter hash of the participant ID
  const shortId = participantId.toString().slice(-4);
  return `${shortId}-${section}`;
}

export function RealtimeNoteBoard({
  meetingId,
  participants,
  currentUserId,
  userRole,
  onReady,
  tasks: initialTasks,
  teamId,
  meeting,
  onTaskCreate: parentOnTaskCreate,
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
  meeting?: Meeting;
  onTaskCreate?: (task: Task) => void;
}) {
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>();
  const [ydoc] = useState(() => new Y.Doc());
  const isVisibleRef = useRef(true);
  const tasksRef = useRef(initialTasks || []);

  // Memoize state values
  const [selectedUser, setSelectedUser] = useState<{
    id: number;
    email: string;
    full_name: string;
  } | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showMeetingDetail, setShowMeetingDetail] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [commandRange, setCommandRange] = useState<Range | null>(null);

  // Update tasksRef when initialTasks changes
  useEffect(() => {
    if (initialTasks) {
      tasksRef.current = initialTasks;
    }
  }, [initialTasks]);

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

  // Memoize the provider setup function
  const setupProvider = useCallback(() => {
    if (!meetingId || !ydoc) return;

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
  }, [meetingId, ydoc, participants, currentUserId]);

  // Set up WebSocket provider
  useEffect(() => {
    const cleanup = setupProvider();
    return () => cleanup?.();
  }, [setupProvider]);

  // Memoize handlers
  const handleMentionClick = useCallback((type: 'user' | 'task', id: string) => {
    if (type === 'user') {
      const user = participants.find(p => p.id === Number(id));
      if (user) {
        setSelectedUser(user);
      }
    } else if (type === 'task') {
      const task = tasksRef.current?.find(t => t.id === Number(id));
      if (task) {
        const fullTask = {
          id: String(task.id),
          taskId: String(task.id),
          title: task.title,
          team_ref_number: task.team_ref_number,
          status: 'open',
          priority: 'medium',
          type: 'task',
          description: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          assignee_id: null,
          reporter_id: null,
          due_date: null,
          team_id: teamId
        };
        setSelectedTask(fullTask);
      }
    }
  }, [participants, teamId]);

  // Notify when board is ready
  useEffect(() => {
    if (isConnected && isSynced && showContent) {
      onReady?.();
    }
  }, [isConnected, isSynced, showContent, onReady]);

  // Memoize permission check
  const canEdit = useCallback((participantId: number) => {
    if (userRole === 'admin') return true;
    return participantId === currentUserId;
  }, [userRole, currentUserId]);

  // Handle task creation with optimistic updates
  const handleTaskCreate = useCallback((task: Task) => {
    // Update local tasks reference without triggering re-render
    const newTask = {
      id: Number(task.id),
      title: task.title,
      team_ref_number: task.team_ref_number || ''
    };

    tasksRef.current = [...(tasksRef.current || [])];
    const existingIndex = tasksRef.current.findIndex(t => t.id === newTask.id);
    if (existingIndex >= 0) {
      tasksRef.current[existingIndex] = newTask;
    } else {
      tasksRef.current.push(newTask);
    }

    // Call parent handler
    parentOnTaskCreate?.(task);
  }, [parentOnTaskCreate]);

  // Memoize sections
  const sections = useMemo(() => SECTIONS.map(section => ({
    id: section,
    title: section
  })), []);

  return (
    <ErrorBoundary>
      <div className="p-6 animate-fade-in">
        {/* Meeting Header Card */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold">{meeting?.title}</h1>
                {meeting?.description && (
                  <p className="text-muted-foreground">{meeting.description}</p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => setShowMeetingDetail(true)}
                className="ml-4"
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Meeting Settings
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Meeting Info Grid */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Date & Time</p>
                  <p className="text-sm text-muted-foreground">
                    {meeting?.start_time ? format(parseISO(meeting.start_time), 'PPP p') : 'Not set'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Duration</p>
                  <p className="text-sm text-muted-foreground">
                    {meeting?.duration_minutes} minutes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Participants</p>
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-2">
                      {participants.slice(0, 3).map((participant) => (
                        <UserAvatar
                          key={participant.id}
                          userId={String(participant.id)}
                          name={participant.full_name}
                          className="h-6 w-6"
                        />
                      ))}
                    </div>
                    {participants.length > 3 && (
                      <span className="text-sm text-muted-foreground ml-1">
                        +{participants.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Meeting Settings Summary */}
            {meeting?.settings && (
              <div className="grid grid-cols-3 gap-6 pt-6 border-t">
                {meeting.settings.goals?.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Target className="h-4 w-4" />
                      <h3 className="font-medium">Goals</h3>
                    </div>
                    <ul className="text-sm space-y-1 list-disc pl-5">
                      {meeting.settings.goals.map((goal, index) => (
                        <li key={index} className="text-muted-foreground">
                          {goal}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {meeting.settings.agenda?.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ListOrdered className="h-4 w-4" />
                      <h3 className="font-medium">Agenda</h3>
                    </div>
                    <ol className="text-sm space-y-1 list-decimal pl-5">
                      {meeting.settings.agenda.map((item, index) => (
                        <li key={index} className="text-muted-foreground">
                          {item}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {meeting.settings.resources?.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Link2 className="h-4 w-4" />
                      <h3 className="font-medium">Resources</h3>
                    </div>
                    <ul className="text-sm space-y-1">
                      {meeting.settings.resources.map((url, index) => (
                        <li key={index}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-all"
                          >
                            {url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Existing Note Board Content */}
        <div className="grid grid-cols-1 gap-6">
          {participants.map((participant) => (
            <div key={participant.id} className="bg-card rounded-lg border shadow-sm overflow-hidden">
              <div className="bg-muted/50 px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <UserAvatar
                      userId={String(participant.id)}
                      name={participant.full_name}
                      className="h-6 w-6"
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
                  {sections.map((section, index) => (
                    <div key={`${participant.id}-${section.id}`} className="flex flex-col">
                      <RealtimeNoteEditor
                        key={`${participant.id}-${section.id}-${currentUserId}`}
                        ydoc={ydoc}
                        provider={provider}
                        section={generateSectionId(participant.id, section.id)}
                        currentUserId={currentUserId}
                        meetingId={meetingId}
                        participants={participants}
                        editable={canEdit(participant.id)}
                        sectionTitle={section.title}
                        tasks={tasksRef.current}
                        onMentionClick={handleMentionClick}
                        teamId={teamId}
                        onTaskCreate={handleTaskCreate}
                      />
                      {index < sections.length - 1 && (
                        <Separator orientation="horizontal" className="lg:hidden my-4" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Meeting Detail Modal */}
        {meeting && (
          <MeetingDetail
            isOpen={showMeetingDetail}
            onClose={() => setShowMeetingDetail(false)}
            meeting={meeting}
            teamId={teamId}
            onMeetingUpdate={(updatedMeeting) => {
              // Handle meeting update if needed
              console.log('Meeting updated:', updatedMeeting);
            }}
          />
        )}

        {showTaskModal && (
          <TaskDetail
            isOpen={showTaskModal}
            onClose={() => {
              setShowTaskModal(false);
              setCommandRange(null);
            }}
            task={undefined}
            teamId={teamId}
            onTaskUpdate={handleTaskCreate}
          />
        )}

        {/* Add User Detail Modal */}
        {selectedUser && (
          <UserDetailModal
            open={!!selectedUser}
            onOpenChange={(open) => !open && setSelectedUser(null)}
            user={selectedUser}
          />
        )}

        {/* Add Task Detail Modal for clicked tasks */}
        {selectedTask && (
          <TaskDetail
            isOpen={!!selectedTask}
            onClose={() => setSelectedTask(null)}
            task={selectedTask}
            teamId={teamId}
            onTaskUpdate={handleTaskCreate}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
