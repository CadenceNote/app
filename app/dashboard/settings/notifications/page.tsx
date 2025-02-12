import { NotificationPreferences } from '@/components/notifications/NotificationPreferences';

export const metadata = {
    title: 'Notification Settings - Agilee',
    description: 'Manage your notification preferences',
};

export default function NotificationSettingsPage() {
    return (
        <div className="container max-w-4xl mx-auto py-8 px-4">
            <NotificationPreferences />
        </div>
    );
} 