
import { Paperclip } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface AttachmentIconProps {
  count: number
  onClick?: () => void
  className?: string
  showPreview?: boolean
}

export function AttachmentIcon({ count, onClick, className, showPreview = false }: AttachmentIconProps) {
  if (count === 0) return null

  return (
    <div 
      className={cn(
        "flex items-center gap-1 text-gray-600 hover:text-gray-800 transition-colors",
        onClick && "cursor-pointer hover:bg-gray-100 rounded px-2 py-1",
        className
      )}
      onClick={onClick}
      title={`${count} anexo${count > 1 ? 's' : ''}`}
    >
      <Paperclip className="h-4 w-4" />
      <Badge variant="secondary" className="text-xs">
        {count}
      </Badge>
      {showPreview && onClick && (
        <span className="text-xs text-gray-500 ml-1">Ver</span>
      )}
    </div>
  )
}
