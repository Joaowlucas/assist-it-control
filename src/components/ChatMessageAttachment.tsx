
import React from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileText, Image as ImageIcon, File } from 'lucide-react'

interface ChatMessageAttachmentProps {
  url: string
  name?: string
  size?: number
}

export function ChatMessageAttachment({ url, name, size }: ChatMessageAttachmentProps) {
  if (!url) return null

  // Determine file type from URL or name
  const isImage = name?.match(/\.(jpg|jpeg|png|gif|webp)$/i) || url.includes('image')
  const isPdf = name?.endsWith('.pdf') || url.includes('.pdf')
  
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = url
    link.download = name || 'download'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
            src={url}
            alt={name || 'Imagem'}
            className="rounded-lg max-h-64 w-auto cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(url, '_blank')}
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
        {name && (
          <p className="text-xs text-muted-foreground mt-1">
            {name} • {formatFileSize(size)}
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
            {name || 'Arquivo'}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(size)}
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
