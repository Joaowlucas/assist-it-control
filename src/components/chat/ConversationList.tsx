import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Users, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Conversation {
  id: string
  name?: string
  type: 'direct' | 'group'
  participants: Array<{
    user: {
      name: string
      avatar_url?: string
      role: string
    }
  }>
  last_message?: {
    content?: string
    created_at: string
    sender: {
      name: string
    }
    message_type: string
  }
  unread_count: number
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name
    
    if (conversation.type === 'direct') {
      // Para conversa direta, mostrar nome do outro participante
      const otherParticipant = conversation.participants.find(p => p.user.name !== 'Você')
      return otherParticipant?.user.name || 'Conversa Direta'
    }
    
    return `Grupo (${conversation.participants.length} membros)`
  }

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p.user.name !== 'Você')
      return otherParticipant?.user.avatar_url
    }
    return undefined
  }

  const getConversationInitials = (conversation: Conversation) => {
    const name = getConversationName(conversation)
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    
    if (isToday(date)) {
      return format(date, 'HH:mm')
    } else if (isYesterday(date)) {
      return 'Ontem'
    } else {
      return format(date, 'dd/MM', { locale: ptBR })
    }
  }

  const getLastMessagePreview = (message: any) => {
    if (!message) return 'Sem mensagens'
    
    if (message.message_type === 'image') return '📷 Imagem'
    if (message.message_type === 'file') return '📎 Arquivo'
    if (message.message_type === 'audio') return '🎵 Áudio'
    
    return message.content || 'Mensagem'
  }

  if (conversations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center p-4">
        <div>
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            Nenhuma conversa encontrada
          </p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        {conversations.map((conversation) => (
          <Button
            key={conversation.id}
            variant="ghost"
            onClick={() => onSelect(conversation.id)}
            className={cn(
              "w-full p-3 h-auto justify-start text-left hover:bg-muted/50 transition-colors",
              selectedId === conversation.id && "bg-muted"
            )}
          >
            <div className="flex items-start gap-3 w-full">
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={getConversationAvatar(conversation)} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {conversation.type === 'group' ? (
                      <Users className="h-5 w-5" />
                    ) : (
                      getConversationInitials(conversation)
                    )}
                  </AvatarFallback>
                </Avatar>
                {conversation.unread_count > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                  </Badge>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-sm truncate text-foreground">
                    {getConversationName(conversation)}
                  </h3>
                  {conversation.last_message && (
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {formatMessageTime(conversation.last_message.created_at)}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {conversation.type === 'direct' && (
                    <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  )}
                  {conversation.type === 'group' && (
                    <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  )}
                  
                  <p className="text-xs text-muted-foreground truncate">
                    {conversation.last_message && (
                      <span className="font-medium">
                        {conversation.last_message.sender.name}:{' '}
                      </span>
                    )}
                    {getLastMessagePreview(conversation.last_message)}
                  </p>
                </div>
              </div>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  )
}