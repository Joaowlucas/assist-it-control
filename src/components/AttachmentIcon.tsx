
import { Paperclip } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface AttachmentIconProps {
  count: number
  onClick?: () => void
  className?: string
}

export function AttachmentIcon({ count, onClick, className }: AttachmentIconProps) {
  if (count === 0) return null

  return (
    <div 
      className={cn(
        "flex items-center gap-1 text-gray-600 hover:text-gray-800 cursor-pointer transition-colors",
        className
      )}
      onClick={onClick}
    >
      <Paperclip className="h-4 w-4" />
      <Badge variant="secondary" className="text-xs">
        {count}
      </Badge>
    </div>
  )
}
