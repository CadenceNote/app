'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, Clock, Calendar } from 'lucide-react';

export default function MyReportsPage() {
    // This is a placeholder since we don't have a reports API yet
    const reports = [
        {
            id: 1,
            title: 'My Task Summary',
            description: 'Overview of your tasks and completion rate',
            lastUpdated: new Date(),
            type: 'Task Report'
        },
        {
            id: 2,
            title: 'Meeting Analytics',
            description: 'Analysis of your meeting participation and contributions',
            lastUpdated: new Date(),
            type: 'Meeting Report'
        },
        {
            id: 3,
            title: 'Time Tracking',
            description: 'Summary of time spent on different activities',
            lastUpdated: new Date(),
            type: 'Time Report'
        }
    ];

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">My Reports</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reports.map((report) => (
                    <Card key={report.id} className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader className="p-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BarChart2 className="h-4 w-4 text-blue-500" />
                                {report.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className="text-sm text-gray-600 mb-4">
                                {report.description}
                            </p>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{report.type}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                        {report.lastUpdated.toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Placeholder for when we implement real reports */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-700 text-sm">
                    Note: This is a placeholder page. Real reporting functionality will be implemented soon.
                </p>
            </div>
        </div>
    );
} 