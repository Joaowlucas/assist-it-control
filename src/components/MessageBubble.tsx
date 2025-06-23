
import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Download, FileText, Image as ImageIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface MessageBubbleProps {
  message: {
    id: string
    content: string
    created_at: string
    user_id: string
    attachment_url?: string
    attachment_name?: string
    profiles: {
      name: string
      avatar_url?: string
    }
  }
  isCurrentUser: boolean
}

export function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const isImage = (filename: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename)
  }

  return (
    <div className={`flex gap-3 mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      {!isCurrentUser && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={message.profiles?.avatar_url || undefined} />
          <AvatarFallback>
            {message.profiles?.name?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-[70%] ${isCurrentUser ? 'order-first' : ''}`}>
        <div className={`rounded-lg p-3 ${
          isCurrentUser 
            ? 'bg-primary text-primary-foreground ml-auto' 
            : 'bg-muted'
        }`}>
          {!isCurrentUser && (
            <div className="text-xs font-medium mb-1 opacity-70">
              {message.profiles?.name || 'Usuário'}
            </div>
          )}
          
          {message.content && (
            <div className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </div>
          )}
          
          {message.attachment_url && message.attachment_name && (
            <div className="mt-2 p-2 bg-black/10 rounded border">
              <div className="flex items-center gap-2">
                {isImage(message.attachment_name) ? (
                  <ImageIcon className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 flex-shrink-0" />
                )}
                <span className="text-xs truncate flex-1">
                  {message.attachment_name}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDownload(message.attachment_url!, message.attachment_name!)}
                  className="h-6 w-6 p-0"
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
              
              {isImage(message.attachment_name) && (
                <img
                  src={message.attachment_url}
                  alt={message.attachment_name}
                  className="mt-2 max-w-full h-auto rounded cursor-pointer"
                  onClick={() => window.open(message.attachment_url, '_blank')}
                />
              )}
            </div>
          )}
        </div>
        
        <div className={`text-xs text-muted-foreground mt-1 ${
          isCurrentUser ? 'text-right' : 'text-left'
        }`}>
          {format(new Date(message.created_at), 'HH:mm', { locale: ptBR })}
        </div>
      </div>
      
      {isCurrentUser && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={message.profiles?.avatar_url || undefined} />
          <AvatarFallback>
            {message.profiles?.name?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
