'use client';

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import { useState } from "react";

interface UserAvatarProps {
    name: string;
    imageUrl?: string | null;
    className?: string;
    fallbackClassName?: string;
}

export function UserAvatar({
    name,
    imageUrl,
    className = "h-8 w-8",
    fallbackClassName
}: UserAvatarProps) {
    const [imageLoaded, setImageLoaded] = useState(false);

    // Generate initials from name
    const initials = name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    // Generate a deterministic color based on name
    const colors = [
        'bg-red-100 text-red-700',
        'bg-green-100 text-green-700',
        'bg-blue-100 text-blue-700',
        'bg-yellow-100 text-yellow-700',
        'bg-purple-100 text-purple-700',
        'bg-pink-100 text-pink-700',
    ];

    const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    const colorClass = colors[colorIndex];

    return (
        <Avatar className={className}>
            {imageUrl && (
                <div className="aspect-square h-full w-full relative">
                    <Image
                        src={imageUrl}
                        alt={name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className={`object-cover transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                        priority={true}
                        onLoad={() => setImageLoaded(true)}
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            setImageLoaded(false);
                        }}
                    />
                </div>
            )}
            <AvatarFallback
                className={`${fallbackClassName || colorClass} ${imageUrl && imageLoaded ? 'opacity-0' : 'opacity-100'
                    }`}
            >
                {initials}
            </AvatarFallback>
        </Avatar>
    );
}