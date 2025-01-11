import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserAvatarProps {
    name: string;
    className?: string;
}

export function UserAvatar({ name, className = "h-8 w-8" }: UserAvatarProps) {
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
            <AvatarFallback className={colorClass}>
                {initials}
            </AvatarFallback>
        </Avatar>
    );
}