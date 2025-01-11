'use client';

import { useEffect } from 'react';
import { TeamGrid } from '@/components/dashboard/TeamGrid';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">My Teams</h1>
            <TeamGrid />
        </div>
    );
}