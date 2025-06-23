
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Users, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface Conversation {
  id: string
  name?: string
  type: 'direct' | 'group'
  avatar_url?: string
  lastMessage?: {
    content: string
    created_at: string
    sender_name: string
  }
  unreadCount: number
  participants?: Array<{
    id: string
    name: string
    avatar_url?: string
  }>
  updated_at: string
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
  loading: boolean
}

export function ConversationList({ conversations, selectedId, onSelect, loading }: ConversationListProps) {
  if (loading) {
    return (
      <div className="p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-3 rounded-lg animate-pulse">
            <div className="w-12 h-12 bg-muted rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma conversa encontrada</p>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto">
      {conversations.map((conversation) => {
        const displayName = conversation.name || 
          (conversation.type === 'direct' 
            ? conversation.participants?.[0]?.name || 'Conversa'
            : 'Grupo')

        return (
          <div
            key={conversation.id}
            onClick={() => onSelect(conversation.id)}
            className={cn(
              "flex items-center space-x-3 p-3 hover:bg-accent cursor-pointer border-b border-border/50",
              selectedId === conversation.id && "bg-accent"
            )}
          >
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={conversation.avatar_url || conversation.participants?.[0]?.avatar_url} />
                <AvatarFallback>
                  {conversation.type === 'group' ? (
                    <Users className="h-6 w-6" />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                </AvatarFallback>
              </Avatar>
              {conversation.type === 'group' && (
                <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                  <Users className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-medium truncate">{displayName}</h3>
                <div className="flex items-center space-x-2">
                  {conversation.lastMessage && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conversation.lastMessage.created_at), { 
                        addSuffix: false, 
                        locale: ptBR 
                      })}
                    </span>
                  )}
                  {conversation.unreadCount > 0 && (
                    <Badge variant="default" className="h-5 min-w-5 text-xs px-1.5">
                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
              
              {conversation.lastMessage && (
                <p className="text-sm text-muted-foreground truncate">
                  <span className="font-medium">{conversation.lastMessage.sender_name}:</span>{' '}
                  {conversation.lastMessage.content}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
