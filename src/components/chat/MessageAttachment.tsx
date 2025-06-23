
import { Button } from "@/components/ui/button"
import { Download, FileText, Image as ImageIcon, Video, Music } from "lucide-react"
import { cn } from "@/lib/utils"

interface MessageAttachmentProps {
  attachment: {
    id: string
    file_name: string
    file_url: string
    attachment_type: string
    thumbnail_url?: string
  }
  isCurrentUser: boolean
}

export function MessageAttachment({ attachment, isCurrentUser }: MessageAttachmentProps) {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = attachment.file_url
    link.download = attachment.file_name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getIcon = () => {
    switch (attachment.attachment_type) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />
      case 'video':
        return <Video className="h-4 w-4" />
      case 'audio':
        return <Music className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  if (attachment.attachment_type === 'image') {
    return (
      <div className="relative group">
        <img
          src={attachment.file_url}
          alt={attachment.file_name}
          className="max-w-sm max-h-64 rounded cursor-pointer"
          onClick={() => window.open(attachment.file_url, '_blank')}
        />
        <Button
          size="sm"
          variant="secondary"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleDownload}
        >
          <Download className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded border",
      isCurrentUser ? "bg-primary-foreground/10" : "bg-background"
    )}>
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {attachment.file_name}
        </div>
        <div className="text-xs text-muted-foreground">
          {attachment.attachment_type.toUpperCase()}
        </div>
      </div>
      
      <Button
        size="sm"
        variant="ghost"
        onClick={handleDownload}
        className="flex-shrink-0"
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  )
}
