"use client"

import { MousePointerClick } from 'lucide-react'
import { JetBrains_Mono } from 'next/font/google'
import Link from 'next/link'
import { useSidebar } from '@/components/ui/sidebar'
import Image from 'next/image'
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'] })

export function StaticLogo({ showText = true }: { showText?: boolean }) {
    return (
        <Link href="/" className={`flex items-center gap-3 text-xl font-bold text-foreground hover:text-foreground/80 ${jetbrainsMono.className}`}>
            {showText && (
                <Image src={'/logo_text.svg'} width={100} height={0} alt="Agilee" />

                // <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                //     Agilee
                // </span>
            )}
            {!showText && (
                <Image src={'/logo.svg'} width={20} height={20} alt="Agilee" />
            )}
        </Link>
    )
}

export default function Logo() {
    const { state } = useSidebar()
    const isCollapsed = state === 'collapsed'

    return <StaticLogo showText={!isCollapsed} />
}