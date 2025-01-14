'use client';

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-semibold">Workspace Settings</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Manage your workspace preferences and configuration
                </p>
            </div>

            <Card className="p-6 space-y-6">
                <div>
                    <h2 className="text-lg font-medium">General</h2>
                    <p className="text-sm text-gray-500">
                        Basic workspace settings and preferences
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="workspace-name">Workspace Name</Label>
                        <Input
                            id="workspace-name"
                            placeholder="My Workspace"
                            className="max-w-md"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="workspace-url">Workspace URL</Label>
                        <div className="flex items-center space-x-2 max-w-md">
                            <div className="text-sm text-gray-500">noteapp.com/</div>
                            <Input
                                id="workspace-url"
                                placeholder="my-workspace"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <Button>Save Changes</Button>
                </div>
            </Card>

            <Card className="p-6 space-y-6">
                <div>
                    <h2 className="text-lg font-medium">Danger Zone</h2>
                    <p className="text-sm text-gray-500">
                        Irreversible and destructive actions
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <h3 className="font-medium">Delete Workspace</h3>
                        <p className="text-sm text-gray-500">
                            Once you delete a workspace, there is no going back. Please be certain.
                        </p>
                        <Button variant="destructive">Delete Workspace</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
} 