"use client"

import { useEffect } from "react"
import Layout from "@/components/Layout"
import { ArrowRight, FileText, Users, Zap, Pencil, ArrowDown } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useUser } from "@/hooks/useUser"
import { Inter } from 'next/font/google'
import Logo from "@/components/common/Logo"
import Image from "next/image"
const inter = Inter({ subsets: ['latin'] })

const FeatureCard = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
  <div className="group relative overflow-hidden rounded-xl border p-8 hover:border-foreground/50 transition-all duration-500">
    {/* Background effects */}
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100" />

    <div className="relative flex flex-col space-y-4">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-500">
        <Icon className="h-6 w-6 text-primary group-hover:text-primary/80 transition-colors" />
      </span>
      <h3 className="text-xl font-semibold tracking-tight group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>

    {/* Shine effect */}
    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
    </div>
  </div>
)

const features = [
  {
    icon: Pencil,
    title: "Realtime, Collaborative",
    description: "Capture your collaborative thoughts instantly with our intuitive editor. "
  },
  {
    icon: Users,
    title: "AI Agent, for you",
    description: "Communicate with our AI to get a concise summary of your day and create tasks and meetings for you."
  },
  {
    icon: Zap,
    title: "One Place, One Click",
    description: "Schedule meetings, create tasks, and track progress with one click."
  },
  {
    icon: FileText,
    title: "Integrate, Sync, and Notify",
    description: "Integrate with your calendars, and receive notifications on phone and email."
  }
]

export default function Home() {
  const { user, isLoading } = useUser()

  return (
    <Layout>
      <div className={inter.className}>
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b">
          {/* Animated background shapes */}
          <div className="absolute inset-0">
            <div className="absolute -left-4 top-0 h-72 w-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute right-0 bottom-0 h-72 w-72 bg-primary/10 rounded-full blur-3xl animate-pulse delay-700" />
            <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>
          <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[size:75px_75px] dark:bg-grid-slate-400/[0.05]" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-background" />
          {/* Radial gradient overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          <div className="container relative mx-auto px-4 py-32 md:py-48">
            <div className="mx-auto max-w-[64rem]">
              <div className="flex justify-center">
                <div className="inline-flex items-center rounded-full border bg-background/95 px-6 py-2 text-sm font-medium backdrop-blur-sm">
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    (Beta) Team Collaboration and Management Tools
                  </span>
                </div>
              </div>
              <h1 className="mt-8 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-center text-4xl font-bold tracking-tight text-transparent md:text-7xl">
                Operating your Agile Team is a breeze
              </h1>
              <p className="mt-6 text-center text-xl text-muted-foreground md:text-2xl">
                Capture decisions, track actions, and streamline team workflow.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                {isLoading ? null : !user ? (
                  <>
                    <Link href="/signup">
                      <Button size="lg" className="h-12 min-w-[200px] rounded-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary" >
                        Get Started
                      </Button>
                    </Link>
                    <Link href="/documentation">
                      <Button size="lg" variant="outline" className="h-12 min-w-[200px] rounded-full">
                        Learn more
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Button size="lg" className="h-12 min-w-[200px] rounded-full bg-gradient-to-r from-primary to-primary/90">
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
        {/* See it in action */}
        <section className="container mx-auto px-4 py-24">
          <div className="mx-auto max-w-[64rem]">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-5xl">See it in action</h2>
              <p className="mt-4 text-xl text-muted-foreground">
                Powerful features that help you track tasks, share notes and get things done
              </p>
              <div className="mt-12 relative w-full max-w-5xl mx-auto rounded-xl overflow-hidden shadow-2xl">
                <div className="aspect-video relative">
                  <video
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  >
                    <source src="/videos/demo.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Features Section */}
        <section className="container mx-auto px-4 py-24">
          <div className="mx-auto max-w-[64rem]">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-5xl">Fast-track your team&apos;s progress</h2>
              <p className="mt-4 text-xl text-muted-foreground">
                Powerful features that help you track tasks, share notes and get things done
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
              {features.map((feature, i) => (
                <FeatureCard key={i} {...feature} />
              ))}
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="relative overflow-hidden border-y bg-muted/50">
          <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[size:75px_75px] dark:bg-grid-slate-400/[0.05]" />
          <div className="container relative mx-auto px-4 py-24">
            <div className="mx-auto max-w-[64rem]">
              <h2 className="text-center text-3xl font-bold tracking-tight md:text-5xl">Why Agilee?</h2>
              <div className="mt-8 space-y-4 text-center text-lg">
                <p>
                  Having to juggle multiple tools to manage your team is a thing of the past.
                  Agilee is a one-stop-shop for all your team management needs.
                </p>
                <p>
                  Stop wasting time switching between tools to meet, track progress, and manage your team.
                </p>
              </div>
              <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-3">
                {[
                  "Google docs",
                  "Google Calendar",
                  "Microsoft Teams",
                  "Slack",
                  "Notion",
                  "Microsoft Todo",
                ].map((tech, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-xl border bg-background p-6">
                    <div className="relative z-10 font-medium">{tech}</div>
                    <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-500/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                ))}
              </div>
              <div className="mt-12 flex flex-col items-center gap-8">
                <ArrowDown className="h-8 w-8 animate-bounce text-primary" />
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-primary/10 to-primary/0 blur-lg" />
                  <Logo showText={true} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-24">
          <div className="relative mx-auto max-w-[64rem] overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-12 text-center">
            {/* Enhanced background effects */}
            <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[size:75px_75px] dark:bg-grid-slate-400/[0.05]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-primary/5 to-transparent animate-pulse" />

            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight md:text-5xl bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                Start fast-tracking your team&apos;s progress today
              </h2>
              <p className="mx-auto mt-4 max-w-[42rem] text-xl text-muted-foreground">
                Join thousands of users who are already using our app to keep their team in sync and get things done.
              </p>
              <Button size="lg" className="mt-8 h-12 min-w-[200px] rounded-full bg-gradient-to-r from-primary to-primary/90 hover:scale-105 transition-transform duration-500 hover:shadow-lg hover:shadow-primary/20">
                Get started for free
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  )
}

