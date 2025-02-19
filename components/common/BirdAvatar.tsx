
interface BirdAvatarProps {
    className?: string;
}

export function BirdAvatar({
}: BirdAvatarProps) {
    return (
        <div className="h-10 w-10 relative mr-4">
            {/* Bird Body */}
            <div className="absolute inset-0 scale-100 ">
                <div className="relative w-full h-full">
                    {/* Bird Body */}
                    <div className="absolute w-full h-full rounded-full bg-gradient-to-br from-green-500 to-indigo-500"></div>

                    {/* Bird Eye */}
                    <div className="absolute top-1/4 right-1/4 w-[20%] h-[20%] rounded-full bg-white">
                        <div className="absolute top-1/3 right-1/3 w-[30%] h-[30%] rounded-full bg-black"></div>
                    </div>

                    {/* Bird Beak */}
                    <div className="absolute top-[35%] -right-[10%] w-[25%] h-[25%] transform rotate-45 bg-yellow-400"></div>

                    {/* Bird Wing */}
                    <div className="absolute bottom-[15%] left-[15%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-green-600 to-indigo-600 transform -rotate-45"></div>
                </div>
            </div>
        </div>
    );
} 