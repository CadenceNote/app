'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { userApi } from '@/services/userApi'
import { Icons } from '@/components/ui/icons'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function checkAuth() {
            try {
                // Check for session
                const { data: { session } } = await supabase.auth.getSession()

                if (!session) {
                    router.push('/login')
                    return
                }

                // Check for user entry in database
                const user = await userApi.getCurrentUser()

                if (!user) {
                    router.push('/auth/callback')
                    return
                }

                setLoading(false)
            } catch (error) {
                console.error('Auth check error:', error)
                router.push('/login')
            }
        }

        checkAuth()
    }, [router])

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Icons.spinner className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return <>{children}</>
} 