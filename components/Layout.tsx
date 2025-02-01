import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { auth } from '@/services/api'
import { supabase } from '@/lib/supabase'
import { User, LogOut, LayoutDashboard, MousePointerClick } from 'lucide-react'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'] })

const Layout = ({ children }) => {
    const router = useRouter()
    const [user, setUser] = useState(null)

    useEffect(() => {
        const checkUser = async () => {
            const session = await supabase.auth.getSession()
            setUser(session?.data?.session?.user || null)
        }

        checkUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null)
        })

        return () => subscription?.unsubscribe()
    }, [])

    const handleSignOut = async () => {
        try {
            await auth.logout()
            router.push('/')
        } catch (error) {
            console.error('Error signing out:', error)
        }
    }

    const UserMenu = () => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{user?.email?.split('@')[0]}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="">
                <DropdownMenuItem asChild>
                    <Link href="/profile">Profile Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                    <span>Sign Out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )

    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-background border-b">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className={`flex items-center gap-3 text-xl font-bold text-foreground hover:text-foreground/80 ${jetbrainsMono.className}`}>
                            <MousePointerClick className="w-5 h-5 text-blue-600" />
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                                Agilee
                            </span>

                        </Link>


                        <nav className="flex items-center space-x-4">
                            {user ? (
                                <>
                                    <Button variant="ghost" asChild>
                                        <Link href="/dashboard" className="flex items-center gap-2">
                                            <LayoutDashboard className="h-4 w-4" />
                                            Dashboard
                                        </Link>
                                    </Button>
                                    <UserMenu />
                                </>
                            ) : (
                                <>
                                    <Button variant="ghost" asChild>
                                        <Link href="/login">Log in</Link>
                                    </Button>
                                    <Button asChild>
                                        <Link href="/signup">Sign up</Link>
                                    </Button>
                                </>
                            )}
                        </nav>
                    </div>
                </div>
            </header>

            <main className="flex-grow bg-background">{children}</main>

            <footer className="bg-background border-t">
                <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <p className="text-muted-foreground text-sm">
                            © 2025 Agilee. All rights reserved.
                        </p>
                        <div className="flex space-x-6">
                            <Link href="#" className="text-muted-foreground hover:text-foreground text-sm">
                                Privacy Policy
                            </Link>
                            <Link href="#" className="text-muted-foreground hover:text-foreground text-sm">
                                Terms of Service
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Layout
