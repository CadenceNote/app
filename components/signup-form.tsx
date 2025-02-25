"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/ui/icons"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface SignUpFormProps extends React.ComponentPropsWithoutRef<"form"> {
    className?: string
}

export function SignUpForm({ className, ...props }: SignUpFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [fullName, setFullName] = useState("")
    const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({})
    const { toast } = useToast()

    // Clear errors when inputs change
    useEffect(() => {
        if (email && errors.email) {
            setErrors(prev => ({ ...prev, email: undefined }))
        }
        if (password && errors.password) {
            setErrors(prev => ({ ...prev, password: undefined }))
        }
        if (fullName && errors.fullName) {
            setErrors(prev => ({ ...prev, fullName: undefined }))
        }
    }, [email, password, fullName, errors.email, errors.password, errors.fullName])

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: { email?: string; password?: string; fullName?: string } = {}

        if (!fullName) {
            newErrors.fullName = "Full name is required"
        }

        if (!email) {
            newErrors.email = "Email is required"
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Please enter a valid email address"
        }

        if (!password) {
            newErrors.password = "Password is required"
        } else if (password.length < 6) {
            newErrors.password = "Password must be at least 6 characters"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    async function onSubmit(event: React.FormEvent) {
        event.preventDefault()

        if (!validateForm()) {
            return
        }

        setIsLoading(true)

        try {
            // First, sign up the user with Supabase Auth
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
                if (error.message.includes("already registered")) {
                    setErrors({
                        email: "This email is already registered. Please use a different email or sign in."
                    })
                }
                throw error
            }

            // Create an entry in the users table
            if (data?.user) {
                const { error: userError } = await supabase
                    .from('users')
                    .upsert({
                        supabase_uid: data.user.id,
                        email: data.user.email!,
                        full_name: fullName,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        is_active: true,
                        email_verified: false,
                        theme: 'light',
                        locale: 'en',
                    })

                if (userError) {
                    console.error("Failed to create user entry:", userError)
                    throw new Error("Failed to create user profile. Please try again.")
                }
            }

            toast({
                title: "Account created",
                description: "Your account has been created successfully!"
            })

            // Redirect to tutorial page instead of dashboard
            router.push("/tutorial")
            router.refresh()
        } catch (error) {
            console.error("Signup error:", error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create account. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    async function handleGitHubSignUp() {
        try {
            setIsLoading(true)
            // We don't use the data result but need to check for errors
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                }
            })

            if (error) throw error
            // Note: User creation for GitHub/OAuth will be handled in the callback page
        } catch (error) {
            console.error("GitHub signup error:", error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to sign up with GitHub",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
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
                        aria-invalid={!!errors.fullName}
                        aria-describedby={errors.fullName ? "fullName-error" : undefined}
                        className={errors.fullName ? "border-red-500" : ""}
                    />
                    {errors.fullName && (
                        <p id="fullName-error" className="text-sm text-red-500">
                            {errors.fullName}
                        </p>
                    )}
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
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? "email-error" : undefined}
                        className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                        <p id="email-error" className="text-sm text-red-500">
                            {errors.email}
                        </p>
                    )}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        disabled={isLoading}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        aria-invalid={!!errors.password}
                        aria-describedby={errors.password ? "password-error" : undefined}
                        className={errors.password ? "border-red-500" : ""}
                    />
                    {errors.password && (
                        <p id="password-error" className="text-sm text-red-500">
                            {errors.password}
                        </p>
                    )}
                </div>
                <Button type="submit" disabled={isLoading}>
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