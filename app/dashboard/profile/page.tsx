'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { auth } from '@/services/api';
import { userApi } from '@/services/userApi';
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from '@/components/common/UserAvatar';

export default function ProfilePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [user, setUser] = useState<{ email: string; full_name: string } | null>(null);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const userData = await userApi.getCurrentUser();
            setUser(userData);
        } catch (error) {
            console.error('Error loading user data:', error);
            toast({
                title: "Error",
                description: "Failed to load user data",
                variant: "destructive"
            });
        }
    };

    const handleSignOut = async () => {
        setIsLoading(true);
        try {
            await auth.logout();
            router.push('/');
        } catch (error) {
            console.error('Error signing out:', error);
            toast({
                title: "Error",
                description: "Failed to sign out",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveChanges = async () => {
        if (!user) return;

        setIsSaving(true);
        try {
            const updatedUser = await userApi.updateUser({
                full_name: user.full_name
            });
            setUser(updatedUser);
            toast({
                title: "Success",
                description: "Profile updated successfully"
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            toast({
                title: "Error",
                description: "Failed to update profile",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-semibold">Profile Settings</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Manage your personal information and preferences
                </p>
            </div>

            <Card className="p-6 space-y-6">
                <div className="flex items-center space-x-4 justify-center py-4">
                    <UserAvatar name={user.full_name} />
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="full-name">Username</Label>
                        <Input
                            id="full-name"
                            value={user.full_name}
                            onChange={(e) => setUser({ ...user, full_name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={user.email}
                            disabled
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <Button
                        onClick={handleSaveChanges}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </Card>

            <Card className="p-6">
                <div className="space-y-4">
                    <div>
                        <h2 className="text-lg font-medium">Sign Out</h2>
                        <p className="text-sm text-gray-500">
                            Sign out from all devices
                        </p>
                    </div>
                    <Button
                        variant="destructive"
                        onClick={handleSignOut}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing out...' : 'Sign Out'}
                    </Button>
                </div>
            </Card>
        </div>
    );
} 