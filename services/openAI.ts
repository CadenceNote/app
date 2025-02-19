import { OpenAI } from 'openai';
import { taskApi } from '@/services/taskApi';
import { meetingApi } from '@/services/meetingApi';
import { teamApi } from '@/services/teamApi';
import { Task } from '@/lib/types/task';
import { Meeting } from '@/lib/types/meeting';
import { Team } from '@/lib/types/team';

interface AIData {
    tasks: Array<{
        id: number | string;
        title: string;
        description?: string;
        status?: string;
        priority?: string;
        due_date?: string;
        team?: string;
    }>;
    meetings: Array<{
        id: number | string;
        title: string;
        description?: string;
        start_time: string;
        team?: string;
    }>;
    teams: Array<{
        id: number;
        name: string;
    }>;
}

interface NewTask {
    title: string;
    description?: string;
    due_date?: string;
    priority?: string;
    status?: string;
    team_id: number;
    created_by_id: string;
}

class AIError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AIError';
    }
}

interface DatabaseError {
    code: string;
    message: string;
    details?: string | null;
    hint?: string | null;
}

// This should only be used server-side
const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function summarizeUserData(userId: string, message: string, data: AIData) {
    try {
        if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
            throw new AIError('OpenAI API key is not configured');
        }

        // Create AI prompt
        const prompt = `
            User request: ${message}
            
            Current tasks: ${JSON.stringify(data.tasks)}
            
            Upcoming meetings: ${JSON.stringify(data.meetings)}
            
            Teams: ${JSON.stringify(data.teams.map(t => t.name))}
            
            Analyze the above information and provide a response in JSON format with the following structure:
            {
                "summary": "A concise summary of tasks and meetings",
                "insights": ["Key insight 1", "Key insight 2"],
                "recommendations": ["Recommendation 1", "Recommendation 2"],
                "newTasks": [] // Optional: Any suggested new tasks with team_id
            }
        `;

        // Get AI response using GPT-4
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'You are an intelligent task management assistant. Analyze tasks and meetings to provide actionable insights and recommendations. Be concise and practical.'
                },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
        });

        if (!completion.choices[0].message?.content) {
            throw new AIError('No response from AI');
        }

        const aiResponse = JSON.parse(completion.choices[0].message.content);
        return aiResponse;

    } catch (error) {
        console.error('AI Processing Error:', {
            error,
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            stack: error instanceof Error ? error.stack : undefined
        });

        if (error instanceof AIError) {
            throw error;
        }

        // If it's a database error, provide more specific error message
        if (error && typeof error === 'object' && 'code' in error) {
            const dbError = error as DatabaseError;
            throw new AIError(`Database error: ${dbError.message}`);
        }

        throw new AIError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
}
