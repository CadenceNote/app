import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { auth } from '@/services/api'
import { supabase } from '@/lib/supabase'
import { Moon, Sun, User } from 'lucide-react'
import { Inter } from 'next/font/google'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Logo from './common/Logo'
import { useTheme } from 'next-themes'

const inter = Inter({ subsets: ['latin'] })

const Layout = ({ children }) => {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const { theme, setTheme } = useTheme()

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
                <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-normal">{user?.email?.split('@')[0]}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <Link href="/profile">Profile Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                    Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )

    return (
        <div className={`min-h-screen flex flex-col w-full ${inter.className}`}>
            <header className="sticky top-0 z-50 w-full border-b backdrop-blur-sm bg-background/80 supports-[backdrop-filter]:bg-background/60">
                <div className="max-w-7xl mx-auto px-4 flex h-14 items-center justify-between">
                    <div className="flex items-center gap-12">
                        <Logo showText={true} />

                        <nav className="flex items-center gap-6">
                            <Link href="/tutorial" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                                Quick Start
                            </Link>

                            <Link href="/pricing" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                                Pricing
                            </Link>

                            <Link href="/documentation" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                                Documentation
                            </Link>

                            <Link href="/support" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                                Support
                            </Link>

                            <Link href="/contact" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                                Contact
                            </Link>

                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <UserMenu />
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Log in
                                </Link>
                                <Button size="sm" asChild className="rounded-full px-4 py-2 ">
                                    <Link href="/signup" className="text-sm font-normal">Sign up</Link>
                                </Button>
                            </>
                        )}
                        <Button size="sm" variant="ghost" className="gap-2" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-grow">{children}</main>

            <footer className="border-t py-6">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                        © 2024 NoteApp. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                            Privacy
                        </Link>
                        <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                            Terms
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Layout
