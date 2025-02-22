import { Bird } from "../common/Bird";
import { BirdAvatar } from "../common/BirdAvatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Send, Sparkles } from "lucide-react";
import { useState, useCallback } from "react";
import { useUser } from "@/hooks/useUser";
import { useTeams } from "@/hooks/useTeams";
import { useTask } from "@/hooks/useTask";
import { useMeeting } from "@/hooks/useMeeting";
import { Loader2 } from "lucide-react";
import { UserAvatar } from "../common/UserAvatar";

interface Message {
    type: 'user' | 'ai';
    content: string;
    isTyping?: boolean;
    data?: {
        summary?: string;
        insights?: string[];
        recommendations?: string[];
    };
}

interface APIError {
    error: string;
    message: string;
}

interface AIAssistantProps {
    teamId?: number;
}

export default function AIAssistant({ teamId = -1 }: AIAssistantProps) {
    const { user } = useUser();
    const { teams } = useTeams();
    const { tasks } = useTask(teamId === -1 ? undefined : teamId);
    const { meetings } = useMeeting(teamId === -1 ? undefined : teamId);

    const [messages, setMessages] = useState<Message[]>([
        {
            type: 'ai',
            content: "Hi! I'm your AI assistant. I can help you manage your tasks, analyze your schedule, and provide insights about your work. What would you like to know?"
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isAiResponding, setIsAiResponding] = useState(false);

    const simulateTyping = useCallback((text: string, data?: Message['data']) => {
        return new Promise<void>((resolve) => {
            setIsAiResponding(true);
            setMessages(prev => [...prev, { type: 'ai', content: '', isTyping: true, data }]);

            let currentText = '';
            const words = text.split(' ');
            let wordIndex = 0;

            const typeWord = () => {
                if (wordIndex < words.length) {
                    currentText += (wordIndex > 0 ? ' ' : '') + words[wordIndex];
                    setMessages(prev => [
                        ...prev.slice(0, -1),
                        { type: 'ai', content: currentText, isTyping: true, data }
                    ]);
                    wordIndex++;
                    setTimeout(typeWord, Math.random() * 50 + 50);
                } else {
                    setMessages(prev => [
                        ...prev.slice(0, -1),
                        { type: 'ai', content: currentText, isTyping: false, data }
                    ]);
                    setIsAiResponding(false);
                    resolve();
                }
            };

            setTimeout(typeWord, 500);
        });
    }, []);

    const handleSend = async () => {
        if (!inputValue.trim() || isAiResponding || !user?.id || !teams) return;

        const userMessage = inputValue.trim();
        setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
        setInputValue('');
        setIsAiResponding(true);

        try {
            // Get all tasks and meetings for the specified team or all teams
            const relevantTeams = teamId === -1 ? teams : teams.filter(t => t.id === teamId);

            console.log('Teams found:', {
                total: teams.length,
                relevant: relevantTeams.length,
                teamId: teamId === -1 ? 'all' : teamId
            });

            // Don't filter by date, include all tasks
            const filteredTasks = tasks?.map(task => ({
                id: task.id,
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                due_date: task.due_date,
                team: teams.find(t => t.id === task.team_id)?.name
            }));

            // Include all meetings, not just future ones
            const filteredMeetings = meetings?.map(meeting => ({
                id: meeting.id,
                title: meeting.title,
                description: meeting.description,
                start_time: meeting.start_time,
                team: teams.find(t => t.id === meeting.team_id)?.name
            }));

            console.log('Data prepared for AI:', {
                tasks: {
                    total: tasks?.length ?? 0,
                    filtered: filteredTasks?.length ?? 0,
                    teams: [...new Set(tasks?.map(t => t.team_id))]
                },
                meetings: {
                    total: meetings?.length ?? 0,
                    filtered: filteredMeetings?.length ?? 0,
                    teams: [...new Set(meetings?.map(m => m.team_id))]
                },
                teams: relevantTeams.map(t => t.name)
            });

            const response = await fetch('/api/openai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    message: userMessage,
                    data: {
                        tasks: filteredTasks || [],
                        meetings: filteredMeetings || [],
                        teams: relevantTeams
                    }
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                const error = data as APIError;
                throw new Error(error.message || 'Failed to get AI response');
            }

            // For structured responses, use a brief intro message
            let formattedResponse = "Here's my analysis:";

            // Pass the structured data separately
            await simulateTyping(formattedResponse, {
                summary: data.summary,
                insights: data.insights,
                recommendations: data.recommendations
            });

        } catch (error) {
            console.error('Error:', error);
            const errorMessage = error instanceof Error ? error.message : "I apologize, but I encountered an error while processing your request. Please try again.";
            await simulateTyping(errorMessage);
        } finally {
            setIsAiResponding(false);
        }
    };

    return (
        <Card className="">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    <CardTitle>AI Assistant</CardTitle>
                </div>
                <CardDescription>Get personalized insights and recommendations for your work.</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Chat Container */}
                <div className="space-y-4">
                    {/* Messages */}
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex items-start gap-2 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                {/* Avatar */}
                                {message.type === 'user' ? (
                                    <UserAvatar
                                        userId={user?.id}
                                        name={user?.full_name || user?.email || 'User'}
                                        imageUrl={user?.avatar_url}
                                        className="h-8 w-8 flex-shrink-0"
                                    />
                                ) : (
                                    <BirdAvatar />
                                )}

                                {/* Message Content */}
                                {message.type === 'ai' && message.data ? (
                                    <div className="flex-1 space-y-4">
                                        {/* Summary Card */}
                                        {message.data.summary && (
                                            <div className="bg-white rounded-lg shadow-sm p-4 border border-indigo-100">
                                                <h4 className="font-medium text-indigo-900 mb-2">Summary</h4>
                                                <p className="text-gray-700 text-sm">{message.data.summary}</p>
                                            </div>
                                        )}

                                        {/* Insights Card */}
                                        {message.data.insights && message.data.insights.length > 0 && (
                                            <div className="bg-white rounded-lg shadow-sm p-4 border border-indigo-100">
                                                <h4 className="font-medium text-indigo-900 mb-2">Key Insights</h4>
                                                <ul className="space-y-2">
                                                    {message.data.insights.map((insight, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                                            <span className="text-indigo-500 mt-1">•</span>
                                                            <span>{insight}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Recommendations Card */}
                                        {message.data.recommendations && message.data.recommendations.length > 0 && (
                                            <div className="bg-white rounded-lg shadow-sm p-4 border border-indigo-100">
                                                <h4 className="font-medium text-indigo-900 mb-2">Recommendations</h4>
                                                <ul className="space-y-2">
                                                    {message.data.recommendations.map((rec, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                                            <span className="text-indigo-500 mt-1">•</span>
                                                            <span>{rec}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        className={`rounded-2xl px-4 py-3 max-w-[80%] ${message.type === 'user'
                                            ? 'bg-primary dark:bg-secondary/90 text-white rounded-tr-none ml-auto'
                                            : 'bg-primary/90 dark:bg-secondary/80 text-white rounded-tl-none mr-auto'
                                            }`}
                                    >
                                        <p className={`text-sm 
                                            }`}>
                                            {message.content}
                                            {message.isTyping && (
                                                <span className="inline-block ml-1 animate-pulse text-indigo-500">▋</span>
                                            )}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Input Area */}
                    <div className="flex items-center gap-2 pt-4 border-t">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask me anything about your work..."
                            className="flex-1 px-4 py-2 rounded-full border border-gray-200 dark:border-primary/50 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-800 focus:border-transparent"
                            disabled={isAiResponding}
                        />
                        <Button
                            onClick={handleSend}
                            className="rounded-full"
                            disabled={!inputValue.trim() || isAiResponding}
                        >
                            {isAiResponding ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
