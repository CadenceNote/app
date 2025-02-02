"use client"

import { MousePointerClick } from 'lucide-react'
import { JetBrains_Mono } from 'next/font/google'
import Link from 'next/link'
import { useSidebar } from '@/components/ui/sidebar'

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'] })

export function StaticLogo({ showText = true }: { showText?: boolean }) {
    return (
        <Link href="/" className={`flex items-center gap-3 text-xl font-bold text-foreground hover:text-foreground/80 ${jetbrainsMono.className}`}>
            <MousePointerClick className="w-5 h-5 text-blue-600" />
            {showText && (
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                    Agilee
                </span>
            )}
        </Link>
    )
}

export default function Logo() {
    const { state } = useSidebar()
    const isCollapsed = state === 'collapsed'

    return <StaticLogo showText={!isCollapsed} />
}