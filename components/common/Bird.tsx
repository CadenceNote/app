
export const Bird = ({ className }: { className?: string }) => {
    return (
        <div className={`absolute left-1 -top-50 w-24 h-24 transform -rotate-12 ${className}`}>
            {/* Bird Body */}

            <div className="relative w-16 h-16">
                {/* Bird Body */}

                <div className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-indigo-500"></div>
                {/* Bird Eye */}
                <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-white">
                    <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-black"></div>
                </div>
                {/* Bird Beak */}
                <div className="absolute top-6 -right-2 w-4 h-4 transform rotate-45 bg-yellow-400"></div>
                {/* Bird Wing */}
                <div className="absolute bottom-2 left-2 w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-indigo-600 transform -rotate-45"></div>
            </div>
        </div>
    )
}