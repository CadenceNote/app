import * as React from "react"

const AvatarGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => <div ref={ref} className="flex -space-x-2 overflow-hidden" {...props} />,
)
AvatarGroup.displayName = "AvatarGroup"

export { AvatarGroup }
