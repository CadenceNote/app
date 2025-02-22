"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Clock, CheckSquare, Users, Bot, FileText, CheckCircle2, Moon, Sun } from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import Logo from "@/components/common/Logo"
import { useTheme } from "next-themes"

export default function TutorialPage() {
    const [activeTab, setActiveTab] = useState("getting-started")
    const [progress, setProgress] = useState(0)
    const [completedSections, setCompletedSections] = useState<string[]>([])
    const [showConfetti, setShowConfetti] = useState(false)
    const { theme, setTheme } = useTheme()

    // Track progress
    useEffect(() => {
        const newProgress = (completedSections.length / features.length) * 100
        setProgress(newProgress)
        if (newProgress === 100 && !showConfetti) {
            setShowConfetti(true)
            setTimeout(() => setShowConfetti(false), 3000)
        }
    }, [completedSections])

    const markAsComplete = (sectionId: string) => {
        if (!completedSections.includes(sectionId)) {
            setCompletedSections([...completedSections, sectionId])
        }
    }

    const features = [
        {
            id: "getting-started",
            title: "Getting Started",
            icon: ArrowRight,
            content: (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">Welcome to Agilee!</h2>
                        <Button variant="outline" size="sm" onClick={() => markAsComplete("getting-started")}
                            className={completedSections.includes("getting-started") ? "bg-green-100 text-green-700" : ""}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {completedSections.includes("getting-started") ? "Completed" : "Mark as Complete"}
                        </Button>
                    </div>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                        Let&apos;s walk through how to get started with Agilee in just a few minutes.
                    </p>
                    <div className="grid gap-6">
                        <Card className="group hover:shadow-lg transition-all duration-300">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                                        <ArrowRight className="h-5 w-5" />
                                    </span>
                                    Quick Tour
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="aspect-video relative bg-muted rounded-lg overflow-hidden group-hover:shadow-inner transition-all">
                                    {/* Placeholder for navigation tour GIF/video */}
                                    <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm group-hover:backdrop-blur-0 transition-all">
                                        <p className="text-muted-foreground">Navigation Tour Demo</p>
                                    </div>
                                </div>
                                <div className="bg-accent/50 rounded-lg p-4 border border-accent">
                                    <p className="font-medium mb-3">The sidebar is your command center:</p>
                                    <ul className="list-none space-y-3">
                                        {[
                                            "Access your personal dashboard",
                                            "Switch between team spaces",
                                            "Track time and manage tasks"
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 group/item">
                                                <span className="h-6 w-6 rounded-full bg-background flex items-center justify-center shrink-0 group-hover/item:bg-primary/20 transition-colors">
                                                    {i + 1}
                                                </span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )
        },
        {
            id: "tasks",
            title: "Task Management",
            icon: CheckSquare,
            content: (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">Task Management</h2>
                        <Button variant="outline" size="sm" onClick={() => markAsComplete("tasks")}
                            className={completedSections.includes("tasks") ? "bg-green-100 text-green-700" : ""}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {completedSections.includes("tasks") ? "Completed" : "Mark as Complete"}
                        </Button>
                    </div>
                    <p className="text-muted-foreground">
                        See how easy it is to manage your work with our task system.
                    </p>
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Creating Your First Task</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
                                    {/* Placeholder for task creation GIF/video */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <p className="text-muted-foreground">Task Creation Demo</p>
                                    </div>
                                </div>
                                <p>Follow these simple steps:</p>
                                <ul className="list-disc list-inside space-y-2">
                                    <li>Click the &quot;+&quot; button in the tasks section</li>
                                    <li>Fill in task details and assign team members</li>
                                    <li>Set priority and due date</li>
                                    <li>Your task is ready to track!</li>
                                </ul>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Task Workflow</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
                                    {/* Placeholder for task workflow GIF/video */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <p className="text-muted-foreground">Task Workflow Demo</p>
                                    </div>
                                </div>
                                <p>Managing tasks is intuitive:</p>
                                <ul className="list-disc list-inside space-y-2">
                                    <li>Drag and drop to change status</li>
                                    <li>Add comments and attachments inline</li>
                                    <li>Track time directly from the task view</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )
        },
        {
            id: "time-tracking",
            title: "Time Tracking",
            icon: Clock,
            content: (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">Tracking Your Time</h2>
                        <Button variant="outline" size="sm" onClick={() => markAsComplete("time-tracking")}
                            className={completedSections.includes("time-tracking") ? "bg-green-100 text-green-700" : ""}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {completedSections.includes("time-tracking") ? "Completed" : "Mark as Complete"}
                        </Button>
                    </div>
                    <p className="text-muted-foreground">
                        Time tracking made simple - start timing your work in seconds.
                    </p>
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Using the Timer</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
                                    {/* Placeholder for time tracking GIF/video */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <p className="text-muted-foreground">Time Tracking Demo</p>
                                    </div>
                                </div>
                                <p>Track time effortlessly:</p>
                                <ul className="list-disc list-inside space-y-2">
                                    <li>One-click timer start from any task</li>
                                    <li>Automatic time logging to tasks</li>
                                    <li>Edit and adjust time entries as needed</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )
        },
        {
            id: "teams",
            title: "Team Collaboration",
            icon: Users,
            content: (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">Working with Your Team</h2>
                        <Button variant="outline" size="sm" onClick={() => markAsComplete("teams")}
                            className={completedSections.includes("teams") ? "bg-green-100 text-green-700" : ""}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {completedSections.includes("teams") ? "Completed" : "Mark as Complete"}
                        </Button>
                    </div>
                    <p className="text-muted-foreground">
                        Collaborate seamlessly with your team members in dedicated spaces.
                    </p>
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Team Workspace</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
                                    {/* Placeholder for team collaboration GIF/video */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <p className="text-muted-foreground">Team Collaboration Demo</p>
                                    </div>
                                </div>
                                <p>Team features in action:</p>
                                <ul className="list-disc list-inside space-y-2">
                                    <li>Quick team switching</li>
                                    <li>Real-time task updates</li>
                                    <li>Shared team dashboard</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )
        },
        {
            id: "ai-assistant",
            title: "AI Assistant",
            icon: Bot,
            content: (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">Your AI Helper</h2>
                        <Button variant="outline" size="sm" onClick={() => markAsComplete("ai-assistant")}
                            className={completedSections.includes("ai-assistant") ? "bg-green-100 text-green-700" : ""}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {completedSections.includes("ai-assistant") ? "Completed" : "Mark as Complete"}
                        </Button>
                    </div>
                    <p className="text-muted-foreground">
                        Let our AI assistant help you work smarter, not harder.
                    </p>
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>AI in Action</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
                                    {/* Placeholder for AI assistant GIF/video */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <p className="text-muted-foreground">AI Assistant Demo</p>
                                    </div>
                                </div>
                                <p>Watch how AI helps you:</p>
                                <ul className="list-disc list-inside space-y-2">
                                    <li>Get smart task suggestions</li>
                                    <li>Automate meeting scheduling</li>
                                    <li>Generate instant progress reports</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )
        },
        {
            id: "meetings",
            title: "Meeting Notes",
            icon: FileText,
            content: (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">Real-time Meeting Notes</h2>
                        <Button variant="outline" size="sm" onClick={() => markAsComplete("meetings")}
                            className={completedSections.includes("meetings") ? "bg-green-100 text-green-700" : ""}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {completedSections.includes("meetings") ? "Completed" : "Mark as Complete"}
                        </Button>
                    </div>
                    <p className="text-muted-foreground">
                        Collaborate with your team in real-time during meetings with our powerful note-taking system.
                    </p>
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Collaborative Note Taking</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
                                    {/* Placeholder for collaborative note-taking GIF/video */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <p className="text-muted-foreground">Real-time Collaboration Demo</p>
                                    </div>
                                </div>
                                <p>Experience seamless collaboration:</p>
                                <ul className="list-disc list-inside space-y-2">
                                    <li>See everyone&apos;s cursors in real-time</li>
                                    <li>Create and assign tasks during meetings</li>
                                    <li>Track meeting duration and participants</li>
                                    <li>All changes sync instantly across all users</li>
                                </ul>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Meeting Management</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
                                    {/* Placeholder for meeting management GIF/video */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <p className="text-muted-foreground">Meeting Management Demo</p>
                                    </div>
                                </div>
                                <p>Powerful meeting tools:</p>
                                <ul className="list-disc list-inside space-y-2">
                                    <li>Set meeting agenda and duration</li>
                                    <li>Manage participant roles and permissions</li>
                                    <li>Link related tasks and documents</li>
                                    <li>Export meeting notes and action items</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )
        }
    ]

    return (
        <div className="min-h-screen bg-background w-full">
            {/* Progress Header */}

            <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b flex items-center justify-between px-20">
                <Logo showText={true} />

                <div className="container mx-auto py-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-sm font-medium">Tutorial Progress</h2>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>


                        </div>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                    {theme === "dark" ? (
                        <Sun className="h-4 w-4" />
                    ) : (
                        <Moon className="h-4 w-4" />
                    )}
                </Button>
                <Button asChild variant="ghost" size="lg" className="gap-2 group">
                    <Link href="/dashboard" className="inline-flex items-center">
                        Dashboard
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </Button>

            </div>

            {/* Confetti Effect */}
            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-50">
                    {/* Add confetti animation here */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-4xl animate-bounce">🎉</div>
                    </div>
                </div>
            )}

            <div className="container mx-auto py-8 max-w-5xl">
                <div className="space-y-8">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            Tutorial
                        </h1>
                        <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                            Learn how to use Agilee effectively with this comprehensive guide. Follow each section and mark them as complete to track your progress.
                        </p>
                    </div>

                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300"
                    >
                        <TabsList className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                            {features.map((feature) => (
                                <TabsTrigger
                                    key={feature.id}
                                    value={feature.id}
                                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground group relative"
                                >
                                    <feature.icon className="h-4 w-4" />
                                    <span className="hidden sm:inline">{feature.title}</span>
                                    {completedSections.includes(feature.id) && (
                                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                                            <CheckCircle2 className="h-3 w-3 text-white" />
                                        </span>
                                    )}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {features.map((feature) => (
                            <TabsContent
                                key={feature.id}
                                value={feature.id}
                                className="focus-visible:outline-none focus-visible:ring-0"
                            >
                                {feature.content}
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
