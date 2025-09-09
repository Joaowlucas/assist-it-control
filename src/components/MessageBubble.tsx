
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Download, FileText, Image, Music, Video } from 'lucide-react'
import { MessageActions } from './chat/MessageActions'

interface MessageBubbleProps {
  message: {
    id: string
    content: string
    created_at: string
    updated_at: string
    edited_at?: string
    user_id: string
    message_type: string
    attachment_url?: string
    attachment_name?: string
    profiles: {
      name: string
      avatar_url?: string
    }
  }
  isCurrentUser: boolean
  onEdit?: (messageId: string, newContent: string) => Promise<void>
  onDelete?: (messageId: string) => Promise<void>
}

export function MessageBubble({ message, isCurrentUser, onEdit, onDelete }: MessageBubbleProps) {
  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getAttachmentIcon = (messageType: string) => {
    switch (messageType) {
      case 'image':
        return <Image className="h-4 w-4" />
      case 'audio':
        return <Music className="h-4 w-4" />
      case 'video':
        return <Video className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const renderAttachment = () => {
    if (!message.attachment_url || !message.attachment_name) return null

    if (message.message_type === 'image') {
      return (
        <div className="mt-2">
          <img 
            src={message.attachment_url} 
            alt={message.attachment_name}
            className="max-w-sm rounded-lg cursor-pointer hover:opacity-90 transition-opacity border"
            onClick={() => window.open(message.attachment_url, '_blank')}
            onError={(e) => {
              console.error('Erro ao carregar imagem:', message.attachment_url)
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      )
    }

    return (
      <div className="mt-2 p-3 bg-background/10 rounded-lg border">
        <div className="flex items-center gap-2">
          {getAttachmentIcon(message.message_type)}
          <span className="text-sm font-medium truncate flex-1">
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
      </div>
    )
  }

  return (
    <div className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} group`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={message.profiles.avatar_url} />
        <AvatarFallback>
          {message.profiles.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className={`flex flex-col max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        {!isCurrentUser && (
          <span className="text-xs text-muted-foreground mb-1">
            {message.profiles.name}
          </span>
        )}
        
        <div className="flex items-start gap-2">
          <div
            className={`px-3 py-2 rounded-lg ${
              isCurrentUser
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            {message.content && message.content.trim() && (
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
            
            {renderAttachment()}
            
            {/* Se for mensagem só de anexo sem texto, mostrar indicador */}
            {!message.content && message.attachment_url && (
              <div className="text-xs opacity-70 mb-2">
                {message.message_type === 'image' && '📷 Imagem'}
                {message.message_type === 'audio' && '🎵 Áudio'}  
                {message.message_type === 'video' && '🎥 Vídeo'}
                {message.message_type === 'document' && '📎 Documento'}
              </div>
            )}
            
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs opacity-70">
                {format(new Date(message.created_at), 'HH:mm')}
              </span>
              
              {message.edited_at && (
                <Badge variant="secondary" className="text-xs h-4 px-1">
                  editada
                </Badge>
              )}
            </div>
          </div>
          
          {isCurrentUser && onEdit && onDelete && (
            <MessageActions
              messageId={message.id}
              currentContent={message.content}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}
        </div>
      </div>
    </div>
  )
}
