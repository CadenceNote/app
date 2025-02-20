'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { userApi } from '@/services/userApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/ui/icons'
import { useToast } from '@/hooks/use-toast'
import { ImageCropper } from '@/components/ui/image-cropper'
import { Upload } from 'lucide-react'
import { UserAvatar } from '@/components/common/UserAvatar'

export default function AuthCallback() {
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [fullName, setFullName] = useState('')
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [cropFile, setCropFile] = useState<File | null>(null)
    const [showProfileForm, setShowProfileForm] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Get the current session
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()
                if (sessionError) throw sessionError

                if (!session) {
                    throw new Error('No session found')
                }

                // Check if user exists and has full_name
                const user = await userApi.getCurrentUser()

                if (!user || !user.full_name) {
                    setShowProfileForm(true)
                    setLoading(false)
                    return
                }

                // User exists and has full profile, redirect to dashboard
                router.push('/dashboard')
            } catch (error) {
                console.error('Error in auth callback:', error)
                toast({
                    title: "Error",
                    description: "There was a problem with your login. Please try again.",
                    variant: "destructive",
                })
                router.push('/login')
            }
        }

        handleCallback()
    }, [router, toast])

    const handleAvatarUpload = async (imageBlob: Blob) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Convert blob to file
            const file = new File([imageBlob], 'avatar.jpg', { type: 'image/jpeg' })

            // Upload new avatar
            const fileName = `${user.id}/${Date.now()}.jpg`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                })

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName)

            // Add cache-busting parameter
            const finalUrl = `${publicUrl}?v=${Date.now()}`
            setAvatarUrl(finalUrl)

            toast({
                title: "Success",
                description: "Avatar uploaded successfully"
            })
        } catch (error) {
            console.error('Error uploading avatar:', error)
            toast({
                title: "Error",
                description: "Failed to upload avatar. Please try again.",
                variant: "destructive"
            })
        }
    }

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No user found')

            // Update user profile in the users table
            const { error: updateError } = await supabase
                .from('users')
                .upsert({
                    supabase_uid: user.id,
                    email: user.email,
                    full_name: fullName,
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString()
                })

            if (updateError) throw updateError

            toast({
                title: "Success",
                description: "Your profile has been updated successfully!",
            })

            // Clear the user cache to ensure fresh data
            userApi.clearUserCache(user.id)

            router.push('/dashboard')
        } catch (error) {
            console.error('Error updating profile:', error)
            toast({
                title: "Error",
                description: "Failed to update your profile. Please try again.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    if (loading && !showProfileForm) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Icons.spinner className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (showProfileForm) {
        return (
            <div className="container flex min-h-screen flex-col items-center justify-center">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">Complete your profile</h1>
                        <p className="text-sm text-muted-foreground">
                            Please provide your full name to continue
                        </p>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                        <div className="flex flex-col items-center space-y-4">
                            <UserAvatar
                                name={fullName || 'User'}
                                imageUrl={avatarUrl}
                                className="h-20 w-20"
                            />
                            <div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => document.getElementById('avatar-upload')?.click()}
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Avatar
                                </Button>
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) setCropFile(file)
                                    }}
                                />
                            </div>
                        </div>

                        {cropFile && (
                            <ImageCropper
                                file={cropFile}
                                onCrop={(blob) => {
                                    handleAvatarUpload(blob)
                                    setCropFile(null)
                                }}
                                onCancel={() => setCropFile(null)}
                                aspect={1}
                            />
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                placeholder="John Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                            Complete Profile
                        </Button>
                    </form>
                </div>
            </div>
        )
    }

    return null
} 