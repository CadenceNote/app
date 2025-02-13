import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

export function NotificationBell() {
    return (
        <div className="relative">
            <Button variant="ghost" size="icon" className="relative">
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                    3
                </span>
                <Bell className="h-5 w-5 text-muted-foreground" />
            </Button>
        </div>
    )
} 