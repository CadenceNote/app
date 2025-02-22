"use client"

import { MousePointerClick } from 'lucide-react'
import { JetBrains_Mono } from 'next/font/google'
import Link from 'next/link'
import { useSidebar } from '@/components/ui/sidebar'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'] })

export function StaticLogo({ showText = true }: { showText?: boolean }) {
    const { theme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <Link href="/" className={`flex items-center gap-3 text-xl font-bold text-foreground hover:text-foreground/80 ${jetbrainsMono.className}`}>
            {showText ? (
                <Image
                    src={mounted && theme === 'dark' ? '/logo_white_text.svg' : '/logo_black_text.svg'}
                    width={90}
                    height={0}
                    alt="Agilee"
                    className="transition-opacity duration-300"
                />
            ) : (
                <Image
                    src={'/logo.svg'}
                    width={20}
                    height={20}
                    alt="Agilee"
                    className="transition-opacity duration-300"
                />
            )}
        </Link>
    )
}

export default function Logo({ showText = null }: { showText?: boolean | null }) {
    const { state } = useSidebar()
    const isCollapsed = state === 'collapsed'

    if (showText === null) {
        return <StaticLogo showText={!isCollapsed} />
    }
    return <StaticLogo showText={showText} />
}