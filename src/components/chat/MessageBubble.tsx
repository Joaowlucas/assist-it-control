
import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Reply, Edit, Trash, Download } from "lucide-react"
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from "@/lib/utils"
import { MessageAttachment } from "./MessageAttachment"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "@/hooks/use-toast"

interface MessageBubbleProps {
  message: {
    id: string
    content: string
    sender_id: string
    created_at: string
    edited_at?: string
    message_type: string
    attachments?: Array<{
      id: string
      file_name: string
      file_url: string
      attachment_type: string
      thumbnail_url?: string
    }>
    sender: {
      id: string
      name: string
      avatar_url?: string
    }
    reply_to?: {
      id: string
      content: string
      sender_name: string
    }
    read_by?: Array<{
      user_id: string
      read_at: string
      user_name: string
    }>
  }
  isCurrentUser: boolean
  showAvatar: boolean
  showName: boolean
  conversationId: string
}

export function MessageBubble({ 
  message, 
  isCurrentUser, 
  showAvatar, 
  showName,
  conversationId 
}: MessageBubbleProps) {
  const { profile } = useAuth()
  const [isHovered, setIsHovered] = useState(false)

  const canEdit = isCurrentUser && message.message_type === 'text'
  const canDelete = isCurrentUser || profile?.role === 'admin' || profile?.role === 'technician'

  const handleEdit = () => {
    // TODO: Implementar edição de mensagem
    toast({
      title: "Em desenvolvimento",
      description: "Funcionalidade de edição será implementada em breve."
    })
  }

  const handleDelete = () => {
    // TODO: Implementar exclusão de mensagem
    toast({
      title: "Em desenvolvimento", 
      description: "Funcionalidade de exclusão será implementada em breve."
    })
  }

  const handleReply = () => {
    // TODO: Implementar resposta a mensagem
    toast({
      title: "Em desenvolvimento",
      description: "Funcionalidade de resposta será implementada em breve."
    })
  }

  return (
    <div
      className={cn(
        "flex gap-3 group",
        isCurrentUser ? "justify-end" : "justify-start"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!isCurrentUser && showAvatar && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={message.sender.avatar_url} />
          <AvatarFallback>
            {message.sender.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      {!isCurrentUser && !showAvatar && (
        <div className="w-8 flex-shrink-0" />
      )}

      <div className={cn("max-w-[70%] space-y-1", isCurrentUser && "order-first")}>
        {showName && !isCurrentUser && (
          <div className="text-xs font-medium text-muted-foreground ml-3">
            {message.sender.name}
          </div>
        )}

        {message.reply_to && (
          <div className="text-xs text-muted-foreground ml-3 mb-1 p-2 bg-muted/50 rounded border-l-2 border-primary">
            <div className="font-medium">{message.reply_to.sender_name}</div>
            <div className="truncate">{message.reply_to.content}</div>
          </div>
        )}

        <div className="relative">
          <div
            className={cn(
              "rounded-lg p-3 max-w-full break-words",
              isCurrentUser
                ? "bg-primary text-primary-foreground ml-auto"
                : "bg-muted"
            )}
          >
            {message.content && (
              <div className="text-sm whitespace-pre-wrap">
                {message.content}
              </div>
            )}

            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.attachments.map((attachment) => (
                  <MessageAttachment
                    key={attachment.id}
                    attachment={attachment}
                    isCurrentUser={isCurrentUser}
                  />
                ))}
              </div>
            )}

            {message.edited_at && (
              <div className="text-xs opacity-70 mt-1">
                (editado)
              </div>
            )}
          </div>

          {/* Menu de ações da mensagem */}
          {(isHovered || false) && (
            <div className={cn(
              "absolute top-0 flex items-center space-x-1",
              isCurrentUser ? "-left-20" : "-right-20"
            )}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-background border">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isCurrentUser ? "end" : "start"}>
                  <DropdownMenuItem onClick={handleReply}>
                    <Reply className="h-4 w-4 mr-2" />
                    Responder
                  </DropdownMenuItem>
                  {canEdit && (
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                      <Trash className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <div className={cn(
          "text-xs text-muted-foreground flex items-center gap-2",
          isCurrentUser ? "justify-end" : "justify-start"
        )}>
          <span>
            {format(new Date(message.created_at), 'HH:mm', { locale: ptBR })}
          </span>
          
          {isCurrentUser && message.read_by && message.read_by.length > 0 && (
            <span className="text-primary">
              ✓✓
            </span>
          )}
        </div>
      </div>

      {isCurrentUser && showAvatar && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback>
            {profile?.name?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      )}

      {isCurrentUser && !showAvatar && (
        <div className="w-8 flex-shrink-0" />
      )}
    </div>
  )
}
