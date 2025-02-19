import { NextApiRequest, NextApiResponse } from 'next';
import { summarizeUserData } from '@/services/openAI';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId, message, data } = req.body;

        if (!userId || !message || !data) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!data.tasks || !data.meetings || !data.teams) {
            return res.status(400).json({ error: 'Invalid data structure' });
        }

        const aiResponse = await summarizeUserData(userId, message, data);
        res.status(200).json(aiResponse);
    } catch (error) {
        console.error('API Error:', {
            error,
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            stack: error instanceof Error ? error.stack : undefined
        });

        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({
            error: 'AI processing failed',
            message
        });
    }
} 