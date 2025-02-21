"use client"

import { useEffect } from "react"
import Layout from "@/components/Layout"
import { ArrowRight, FileText, Users, Zap, Pencil, ArrowDown } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useUser } from "@/hooks/useUser"
import { Inter } from 'next/font/google'
import Logo from "@/components/common/Logo"
const inter = Inter({ subsets: ['latin'] })

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="space-y-2">
    <Icon className="h-8 w-8" />
    <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
    <p className="text-muted-foreground leading-relaxed">{description}</p>
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
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-[64rem] mx-auto">
            <div className="text-sm mb-2 font-medium mx-auto text-center py-4">
              <span className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-1 rounded-full">
                Team Collaboration and Management Tools
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-center max-w-[42rem] mx-auto mb-8 tracking-tight">
              Operating your Agile Team is a breeze
            </h1>
            <p className="text-xl text-center mb-12 max-w-[42rem] mx-auto text-muted-foreground leading-relaxed">
              Capture decisions, track actions, and streamline team workflow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isLoading ? null : !user ? (
                <>
                  <Button size="lg" className=" rounded-full">
                    Get Started
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-full">
                    Learn more
                  </Button>
                </>
              ) : (
                <Button size="lg" className="gap-2">
                  <Link href="/dashboard" className="">
                    Go to Dashboard
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 pb-24 ">
          <div className="max-w-[64rem] mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Fast-track your team's progress</h2>
              <p className="text-muted-foreground">
                Powerful features that help you track tasks, share notes and get things done
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {features.map((feature, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <FeatureCard
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="container mx-auto px-4 py-24 border-t">
          <div className="max-w-[64rem] mx-auto">
            <h2 className="text-3xl font-bold text-center mb-16">Why Agilee?</h2>
            <p className="mb-8  mx-auto">
              Having to juggle multiple tools to manage your team is a thing of the past.
              Agilee is a one-stop-shop for all your team management needs.
            </p>

            <p className="mb-8  mx-auto">
              Stop wasting time switching between tools to meet, track progress, and manage your team.
            </p>
            {/* The following is a list of tools that are used by teams, but should be slashed now */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-center">
              {[
                "Google docs",
                "Google Calendar",
                "Microsoft Teams",
                "Slack",
                "Notion",
                "Microsoft Todo",
              ].map((tech, i) => (
                <div key={i} className="p-4 rounded-lg border bg-card text-muted-foreground">
                  <div className="font-semibold">{tech}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-center py-8">
              <ArrowDown className="h-6 w-6 mx-auto" />
            </div>

            <div className="flex justify-center">
              <Logo showText={true} />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-24 border-t">
          <div className="max-w-[64rem] mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Start fast-tracking your team's progress today</h2>
            <p className="text-muted-foreground mb-8 max-w-[42rem] mx-auto">
              Join thousands of users who are already using our app to keep their team in sync and get things done.
            </p>
            <Button size="lg" className="gap-2">
              Get started for free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </div>
    </Layout>
  )
}

