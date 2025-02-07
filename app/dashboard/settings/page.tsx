'use client';

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2, Upload } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ImageCropper } from '@/components/ui/image-cropper';
import { UserAvatar } from "@/components/common/UserAvatar";


interface UserSettings {
    full_name: string;
    email: string;
    avatar_url: string | null;
    timezone: string;
    locale: string;
    theme: 'light' | 'dark' | 'system';
    bio: string | null;
    position: string | null;
    phone: string | null;
    company: string | null;
    notification_preferences: {
        email: boolean;
        push: boolean;
        desktop: boolean;
    };
    two_factor_enabled: boolean;
}

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [cropFile, setCropFile] = useState<File | null>(null);

    useEffect(() => {
        fetchUserSettings();
    }, []);

    const fetchUserSettings = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('supabase_uid', user.id)
                .single();

            if (error) throw error;
            setSettings(data);
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast({
                title: "Error",
                description: "Failed to load user settings",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (imageBlob: Blob) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Convert blob to file
            const file = new File([imageBlob], 'avatar.jpg', { type: 'image/jpeg' });

            // First, delete old avatar if exists
            if (settings?.avatar_url) {
                try {
                    const oldPath = settings.avatar_url.split('avatars/')[1];
                    if (oldPath) {
                        await supabase.storage
                            .from('avatars')
                            .remove([oldPath]);
                    }
                } catch (error) {
                    console.error('Error removing old avatar:', error);
                }
            }

            // Upload new avatar
            const fileName = `${user.id}/${Date.now()}.jpg`;

            const { error: uploadError, data } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true // Changed to true to handle overwrites
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            // Add cache-busting parameter
            const finalUrl = `${publicUrl}?v=${Date.now()}`;

            console.log('Final URL:', finalUrl); // For debugging

            // Update user record
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    avatar_url: finalUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('supabase_uid', user.id);

            if (updateError) throw updateError;

            // Update local state
            setSettings(prev => prev ? { ...prev, avatar_url: finalUrl } : null);

            toast({
                title: "Success",
                description: "Avatar updated successfully"
            });
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to upload avatar",
                variant: "destructive"
            });
        }
    };

    const handleSave = async () => {
        if (!settings) return;

        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('users')
                .update({
                    full_name: settings.full_name,
                    timezone: settings.timezone,
                    locale: settings.locale,
                    theme: settings.theme,
                    bio: settings.bio,
                    position: settings.position,
                    phone: settings.phone,
                    company: settings.company,
                    notification_preferences: settings.notification_preferences,
                    updated_at: new Date().toISOString()
                })
                .eq('supabase_uid', user.id);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Settings updated successfully"
            });
        } catch (error) {
            console.error('Error saving settings:', error);
            toast({
                title: "Error",
                description: "Failed to save settings",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-semibold">Account Settings</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Manage your account settings and preferences
                </p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                    <Card className="p-6">
                        <div className="space-y-8">
                            <div className="flex items-center space-x-4">
                                <UserAvatar
                                    name={settings?.full_name || 'User'}
                                    imageUrl={settings?.avatar_url}
                                    className="h-20 w-20"
                                />
                                <div>
                                    <Button variant="outline" onClick={() => document.getElementById('avatar-upload')?.click()}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Change Avatar
                                    </Button>
                                    <input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) setCropFile(file);
                                        }}
                                    />
                                </div>
                            </div>
                            {cropFile && (
                                <ImageCropper
                                    file={cropFile}
                                    onCrop={(blob) => {
                                        handleAvatarUpload(blob);
                                        setCropFile(null);
                                    }}
                                    onCancel={() => setCropFile(null)}
                                    aspect={1}
                                />
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="full-name">Full Name</Label>
                                    <Input
                                        id="full-name"
                                        value={settings?.full_name || ''}
                                        onChange={(e) => setSettings(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        value={settings?.email || ''}
                                        disabled
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="position">Position</Label>
                                    <Input
                                        id="position"
                                        value={settings?.position || ''}
                                        onChange={(e) => setSettings(prev => prev ? { ...prev, position: e.target.value } : null)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="company">Company</Label>
                                    <Input
                                        id="company"
                                        value={settings?.company || ''}
                                        onChange={(e) => setSettings(prev => prev ? { ...prev, company: e.target.value } : null)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        value={settings?.phone || ''}
                                        onChange={(e) => setSettings(prev => prev ? { ...prev, phone: e.target.value } : null)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="timezone">Timezone</Label>
                                    <Select
                                        value={settings?.timezone}
                                        onValueChange={(value) => setSettings(prev => prev ? { ...prev, timezone: value } : null)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select timezone" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="UTC">UTC</SelectItem>
                                            <SelectItem value="America/New_York">Eastern Time</SelectItem>
                                            <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                                            {/* Add more timezones */}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                <Textarea
                                    id="bio"
                                    value={settings?.bio || ''}
                                    onChange={(e) => setSettings(prev => prev ? { ...prev, bio: e.target.value } : null)}
                                    rows={4}
                                />
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-6">
                    <Card className="p-6">
                        <h2 className="text-lg font-medium mb-4">Notification Preferences</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Email Notifications</Label>
                                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                                </div>
                                <Switch
                                    checked={settings?.notification_preferences.email}
                                    onCheckedChange={(checked) => setSettings(prev => prev ? {
                                        ...prev,
                                        notification_preferences: { ...prev.notification_preferences, email: checked }
                                    } : null)}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Push Notifications</Label>
                                    <p className="text-sm text-gray-500">Receive push notifications</p>
                                </div>
                                <Switch
                                    checked={settings?.notification_preferences.push}
                                    onCheckedChange={(checked) => setSettings(prev => prev ? {
                                        ...prev,
                                        notification_preferences: { ...prev.notification_preferences, push: checked }
                                    } : null)}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Desktop Notifications</Label>
                                    <p className="text-sm text-gray-500">Receive desktop notifications</p>
                                </div>
                                <Switch
                                    checked={settings?.notification_preferences.desktop}
                                    onCheckedChange={(checked) => setSettings(prev => prev ? {
                                        ...prev,
                                        notification_preferences: { ...prev.notification_preferences, desktop: checked }
                                    } : null)}
                                />
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-6">
                    <Card className="p-6">
                        <h2 className="text-lg font-medium mb-4">Security Settings</h2>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Two-Factor Authentication</Label>
                                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                                </div>
                                <Switch
                                    checked={settings?.two_factor_enabled}
                                    onCheckedChange={(checked) => setSettings(prev => prev ? {
                                        ...prev,
                                        two_factor_enabled: checked
                                    } : null)}
                                />
                            </div>
                            <Separator />
                            <div>
                                <Button variant="outline" className="w-full">Change Password</Button>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={() => fetchUserSettings()}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </div>
    );
} 