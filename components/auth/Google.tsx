'use client'

import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { userApi } from '@/services/userApi'

interface CredentialResponse {
    credential: string
}

declare global {
    interface Window {
        google: {
            accounts: {
                id: {
                    initialize: (config: {
                        client_id: string
                        callback: (response: CredentialResponse) => void
                        nonce?: string
                        use_fedcm_for_prompt?: boolean
                        auto_select?: boolean
                        context?: string
                        ux_mode?: 'popup' | 'redirect'
                        itp_support?: boolean
                        prompt_parent_id?: string
                        state_cookie_domain?: string
                        cancel_on_tap_outside?: boolean
                    }) => void
                    prompt: () => void
                    renderButton?: (parent: HTMLElement, config: {
                        type?: 'standard' | 'icon'
                        theme?: 'outline' | 'filled_blue' | 'filled_black'
                        size?: 'large' | 'medium' | 'small'
                        text?: string
                        shape?: 'rectangular' | 'pill' | 'circle' | 'square'
                        logo_alignment?: 'left' | 'center'
                        width?: number
                        locale?: string
                    }) => void
                    cancel: () => void
                }
            }
        }
    }
}

interface OneTapComponentProps {
    onSuccess?: () => void
    onError?: (error: Error) => void
}

export const OneTapComponent: React.FC<OneTapComponentProps> = ({ onSuccess, onError }) => {
    const router = useRouter()

    // Generate nonce to use for google id token sign-in
    const generateNonce = async (): Promise<[string, string]> => {
        const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
        const encoder = new TextEncoder()
        const encodedNonce = encoder.encode(nonce)
        const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

        return [nonce, hashedNonce]
    }

    const initializeGoogleOneTap = useCallback(async () => {
        try {
            console.log('Initializing Google One Tap')

            // Generate nonce and hashed nonce
            const [nonce, hashedNonce] = await generateNonce()
            console.log('Nonce generated')

            // Check if there's already an existing session
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
            if (sessionError) throw sessionError
            if (sessionData.session) {
                const user = await userApi.getCurrentUser()
                if (!user || !user.full_name) {
                    router.push('/auth/callback')
                    return
                }
                router.push('/dashboard')
                return
            }

            if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
                throw new Error('Google Client ID is not configured')
            }

            window.google.accounts.id.initialize({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                callback: async (response: CredentialResponse) => {
                    try {
                        const { error } = await supabase.auth.signInWithIdToken({
                            provider: 'google',
                            token: response.credential,
                            nonce: nonce,
                        })

                        if (error) throw error

                        // Check if user has completed their profile
                        const user = await userApi.getCurrentUser()
                        if (!user || !user.full_name) {
                            router.push('/auth/callback')
                            return
                        }

                        onSuccess?.()
                        router.push('/dashboard')
                        router.refresh()
                    } catch (error) {
                        console.error('Error logging in with Google One Tap:', error)
                        onError?.(error as Error)
                    }
                },
                nonce: hashedNonce,
                use_fedcm_for_prompt: true, // Enable FedCM for Chrome's third-party cookie removal
            })

            // Display the One Tap UI
            window.google.accounts.id.prompt()
        } catch (error) {
            console.error('Error initializing Google One Tap:', error)
            onError?.(error as Error)
        }
    }, [router, onSuccess, onError])

    useEffect(() => {
        if (window.google?.accounts) {
            initializeGoogleOneTap()
        }

        return () => {
            if (window.google?.accounts?.id) {
                window.google.accounts.id.cancel()
            }
        }
    }, [initializeGoogleOneTap])

    return (
        <>
            <Script
                src="https://accounts.google.com/gsi/client"
                async
                defer
                onLoad={() => {
                    initializeGoogleOneTap()
                }}
                strategy="afterInteractive"
            />
            <div id="oneTap" className="fixed top-0 right-0 z-[100]" />
        </>
    )
}

export default OneTapComponent
