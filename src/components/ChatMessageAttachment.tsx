
import React from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileText, Image as ImageIcon, File } from 'lucide-react'
import { ChatMessage } from '@/hooks/useChat'

interface ChatMessageAttachmentProps {
  message: ChatMessage
}

export function ChatMessageAttachment({ message }: ChatMessageAttachmentProps) {
  if (!message.attachment_url) return null

  const isImage = message.attachment_type?.startsWith('image/')
  const isPdf = message.attachment_type === 'application/pdf'
  
  const handleDownload = () => {
    if (message.attachment_url) {
      const link = document.createElement('a')
      link.href = message.attachment_url
      link.download = message.attachment_name || 'download'
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const mb = bytes / 1024 / 1024
    return mb < 1 ? `${(bytes / 1024).toFixed(0)}KB` : `${mb.toFixed(1)}MB`
  }

  if (isImage) {
    return (
      <div className="mt-2">
        <div className="relative group max-w-xs">
          <img
            src={message.attachment_url}
            alt={message.attachment_name || 'Imagem'}
            className="rounded-lg max-h-64 w-auto cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(message.attachment_url, '_blank')}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              className="bg-white/90 hover:bg-white text-black"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
        {message.attachment_name && (
          <p className="text-xs text-muted-foreground mt-1">
            {message.attachment_name} • {formatFileSize(message.attachment_size)}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border max-w-xs">
        <div className="flex-shrink-0">
          {isPdf ? (
            <FileText className="h-8 w-8 text-red-500" />
          ) : (
            <File className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {message.attachment_name || 'Arquivo'}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(message.attachment_size)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          className="h-8 w-8 p-0"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
