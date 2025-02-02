"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/ui/icons"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

interface SignUpFormProps extends React.ComponentPropsWithoutRef<"form"> {
    className?: string
}

export function SignUpForm({ className, ...props }: SignUpFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [fullName, setFullName] = useState("")

    async function onSubmit(event: React.FormEvent) {
        event.preventDefault()
        setIsLoading(true)

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            })

            if (error) {
                throw error
            }

            router.push("/dashboard")
            router.refresh()
        } catch (error) {
            console.error("Signup error:", error)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleGitHubSignUp() {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            })

            if (error) throw error
        } catch (error) {
            console.error("GitHub signup error:", error)
        }
    }

    return (
        <div className="grid gap-6">
            <form onSubmit={onSubmit} className={cn("grid gap-4", className)} {...props}>
                <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                        id="fullName"
                        placeholder="John Doe"
                        type="text"
                        autoCapitalize="words"
                        autoComplete="name"
                        autoCorrect="off"
                        disabled={isLoading}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        placeholder="name@example.com"
                        type="email"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect="off"
                        disabled={isLoading}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        disabled={isLoading}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <Button disabled={isLoading}>
                    {isLoading && (
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Account
                </Button>
            </form>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                    </span>
                </div>
            </div>
            <Button
                variant="outline"
                type="button"
                disabled={isLoading}
                onClick={handleGitHubSignUp}
            >
                {isLoading ? (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Icons.gitHub className="mr-2 h-4 w-4" />
                )}
                GitHub
            </Button>
            <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <a
                    href="/login"
                    className="underline underline-offset-4 hover:text-primary"
                >
                    Sign in
                </a>
            </div>
        </div>
    )
} 