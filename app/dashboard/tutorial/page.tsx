"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, Clock, CheckSquare, Users, Bot, FileText, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function TutorialPage() {
    const [activeTab, setActiveTab] = useState("getting-started")
    const [progress, setProgress] = useState(0)
    const [completedSections, setCompletedSections] = useState<string[]>([])
    const [showConfetti, setShowConfetti] = useState(false)

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

    const renderSectionHeader = (title: string, sectionId: string) => (
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{title}</h2>
            <Button
                variant="outline"
                size="sm"
                onClick={() => markAsComplete(sectionId)}
                className={completedSections.includes(sectionId) ? "bg-green-100 text-green-700" : ""}
            >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {completedSections.includes(sectionId) ? "Completed" : "Mark as Complete"}
            </Button>
        </div>
    )

    const features = [
        {
            id: "getting-started",
            title: "Getting Started",
            icon: ArrowRight,
            content: (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    {renderSectionHeader("Welcome to Agilee!", "getting-started")}
                    <p className="text-muted-foreground text-lg leading-relaxed">
                        Let&apos;s walk through how to get started with Agilee in just a few minutes.
                    </p>
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
            )
        },
        {
            id: "tasks",
            title: "Task Management",
            icon: CheckSquare,
            content: (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    {renderSectionHeader("Creating and Managing Tasks", "tasks")}
                    <p className="text-muted-foreground text-lg leading-relaxed">
                        See how easy it is to manage your work with our task system.
                    </p>
                    <Card className="group hover:shadow-lg transition-all duration-300">
                        <CardHeader>
                            <CardTitle>Task Creation & Management</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <p className="text-muted-foreground">Task Management Demo</p>
                                </div>
                            </div>
                            <div className="bg-accent/50 rounded-lg p-4 border border-accent">
                                <p className="font-medium mb-3">Key Features:</p>
                                <ul className="list-none space-y-3">
                                    {[
                                        "Create and assign tasks with one click",
                                        "Track progress with drag-and-drop kanban",
                                        "Set priorities and due dates",
                                        "Collaborate with team members"
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
            )
        },
        {
            id: "meetings",
            title: "Meeting Notes",
            icon: FileText,
            content: (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    {renderSectionHeader("Real-time Meeting Notes", "meetings")}
                    <p className="text-muted-foreground text-lg leading-relaxed">
                        Experience seamless real-time collaboration during meetings.
                    </p>
                    <div className="grid gap-6">
                        <Card className="group hover:shadow-lg transition-all duration-300">
                            <CardHeader>
                                <CardTitle>Collaborative Note Taking</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <p className="text-muted-foreground">Real-time Collaboration Demo</p>
                                    </div>
                                </div>
                                <div className="bg-accent/50 rounded-lg p-4 border border-accent">
                                    <p className="font-medium mb-3">Real-time Features:</p>
                                    <ul className="list-none space-y-3">
                                        {[
                                            "See everyone's cursors and edits in real-time",
                                            "Create tasks directly from meeting notes",
                                            "Track meeting duration and participants",
                                            "Auto-save and sync across all devices"
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
        // ... other features remain the same ...
    ]

    return (
        <div className="min-h-screen bg-background">
            {/* Progress Header */}
            <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
                <div className="container mx-auto py-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                            <h2 className="text-sm font-medium">Tutorial Progress</h2>
                            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
                        </div>
                        <Button asChild size="sm" variant="outline" className="group">
                            <Link href="/dashboard" className="gap-2 inline-flex items-center">
                                Go to Dashboard
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            </div>

            {/* Confetti Effect */}
            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-50">
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