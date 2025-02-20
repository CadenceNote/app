"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/ui/icons"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { OneTapComponent } from "@/components/auth/Google"
import { useToast } from "@/hooks/use-toast"

interface LoginFormProps extends React.ComponentPropsWithoutRef<"form"> {
  className?: string
}

export function LoginForm({ className, ...props }: LoginFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { toast } = useToast()
  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Success",
        description: "Successfully logged in!"
      })
      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Error",
        description: "Failed to login. Please check your credentials.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGitHubLogin() {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })

      if (error) throw error
    } catch (error) {
      console.error("GitHub login error:", error)
      toast({
        title: "Error",
        description: "Failed to login with GitHub",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAuthSuccess = () => {
    toast({
      title: "Success",
      description: "Successfully logged in!"
    })
  }

  const handleAuthError = (error: Error) => {
    console.error("Authentication error:", error)
    toast({
      title: "Error",
      description: "Authentication failed. Please try again.",
      variant: "destructive",
    })
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={onSubmit} className={cn("grid gap-4", className)} {...props}>
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <a
              href="/reset-password"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Forgot password?
            </a>
          </div>
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
          Sign In
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
      <div className="grid gap-2">
        <Button
          variant="outline"
          type="button"
          disabled={isLoading}
          onClick={handleGitHubLogin}
        >
          {isLoading ? (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.gitHub className="mr-2 h-4 w-4" />
          )}
          GitHub
        </Button>
        <OneTapComponent
          onSuccess={handleAuthSuccess}
          onError={handleAuthError}
        />
      </div>
      <div className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <a
          href="/signup"
          className="underline underline-offset-4 hover:text-primary"
        >
          Sign up
        </a>
      </div>
    </div>
  )
}
