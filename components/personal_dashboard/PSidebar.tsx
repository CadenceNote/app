import { Button } from "@/components/ui/button"
import { CalendarIcon, CheckCircle, Settings, BarChart2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { UserAvatar } from "../common/UserAvatar";
import { useUser } from "@/hooks/useUser";
interface PSidebarProps {
    activeSection: string;
    setActiveSection: (section: string) => void;
}



export default function PSidebar({ activeSection, setActiveSection }: PSidebarProps) {
    const { user } = useUser()
    const router = useRouter()
    const navigateToSettings = () => {
        router.push('dashboard/settings')
    }

    return (
        <aside className="w-64 bg-card text-card-foreground border-r border-border/40 backdrop-blur-sm fixed h-screen overflow-y-auto">
            <div className="p-6">



                <div className="flex items-center gap-2 mb-8">

                    <h2 className="text-lg font-semibold bg-gradient-to-r from-green-600 to-indigo-600 bg-clip-text text-transparent">
                        Personal Dashboard
                    </h2>
                </div>
                <nav className="space-y-1">
                    <Button
                        variant={activeSection === 'summary-section' ? 'secondary' : 'ghost'}
                        className={cn(
                            "w-full justify-start",
                            activeSection === 'summary-section' && "bg-gradient-to-r from-green-50 to-indigo-50 text-indigo-900"
                        )}
                        onClick={() => {
                            const element = document.getElementById('summary-section')
                            element?.scrollIntoView({ behavior: 'smooth' })
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <BarChart2 className={cn(
                                "h-4 w-4",
                                activeSection === 'summary-section' ? "text-indigo-600" : "text-muted-foreground"
                            )} />
                            <span className={cn(
                                activeSection === 'summary-section' ? "font-medium" : "text-muted-foreground"
                            )}>Summary & Alerts</span>
                        </div>
                    </Button>
                    <Button
                        variant={activeSection === 'calendar-section' ? 'secondary' : 'ghost'}
                        className={cn(
                            "w-full justify-start",
                            activeSection === 'calendar-section' && "bg-gradient-to-r from-green-50 to-indigo-50 text-indigo-900"
                        )}
                        onClick={() => {
                            const element = document.getElementById('calendar-section')
                            element?.scrollIntoView({ behavior: 'smooth' })
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <CalendarIcon className={cn(
                                "h-4 w-4",
                                activeSection === 'calendar-section' ? "text-indigo-600" : "text-muted-foreground"
                            )} />
                            <span className={cn(
                                activeSection === 'calendar-section' ? "font-medium" : "text-muted-foreground"
                            )}>Calendar</span>
                        </div>
                    </Button>
                    <Button
                        variant={activeSection === 'tasks-section' ? 'secondary' : 'ghost'}
                        className={cn(
                            "w-full justify-start",
                            activeSection === 'tasks-section' && "bg-gradient-to-r from-green-50 to-indigo-50 text-indigo-900"
                        )}
                        onClick={() => {
                            const element = document.getElementById('tasks-section')
                            element?.scrollIntoView({ behavior: 'smooth' })
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <CheckCircle className={cn(
                                "h-4 w-4",
                                activeSection === 'tasks-section' ? "text-indigo-600" : "text-muted-foreground"
                            )} />
                            <span className={cn(
                                activeSection === 'tasks-section' ? "font-medium" : "text-muted-foreground"
                            )}>Tasks</span>
                        </div>
                    </Button>
                    <Button
                        variant={activeSection === 'meetings-section' ? 'secondary' : 'ghost'}
                        className={cn(
                            "w-full justify-start",
                            activeSection === 'meetings-section' && "bg-gradient-to-r from-green-50 to-indigo-50 text-indigo-900"
                        )}
                        onClick={() => {
                            const element = document.getElementById('meetings-section')
                            element?.scrollIntoView({ behavior: 'smooth' })
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <CalendarIcon className={cn(
                                "h-4 w-4",
                                activeSection === 'meetings-section' ? "text-indigo-600" : "text-muted-foreground"
                            )} />
                            <span className={cn(
                                activeSection === 'meetings-section' ? "font-medium" : "text-muted-foreground"
                            )}>Meetings</span>
                        </div>
                    </Button>
                    <div className="pt-4 mt-4 border-t border-border/60">
                        <Button variant="ghost" className="w-full justify-start opacity-70 hover:opacity-100">
                            <div className="flex items-center gap-3">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Time Tracking</span>
                            </div>
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-start opacity-70 hover:opacity-100"
                            onClick={navigateToSettings}
                        >
                            <div className="flex items-center gap-3">
                                <Settings className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Settings</span>
                            </div>
                        </Button>
                    </div>
                </nav>
            </div>
        </aside>
    )
}
