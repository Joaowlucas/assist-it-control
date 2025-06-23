
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageCircle, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"

interface Conversation {
  id: string
  name?: string
  type: 'direct' | 'group'
  participants?: Array<{
    id: string
    name: string
    avatar_url?: string
  }>
  last_message?: {
    content: string
    created_at: string
    sender_name: string
  }
  unread_count?: number
  updated_at: string
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
  loading: boolean
}

export function ConversationList({ conversations, selectedId, onSelect, loading }: ConversationListProps) {
  const { profile } = useAuth()

  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name
    
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants?.find(p => p.id !== profile?.id)
      return otherParticipant?.name || 'Conversa'
    }
    
    return 'Grupo'
  }

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants?.find(p => p.id !== profile?.id)
      return otherParticipant?.avatar_url
    }
    return null
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-2">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma conversa</h3>
            <p className="text-sm text-muted-foreground">
              Você ainda não possui conversas ativas
            </p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                "flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors",
                selectedId === conversation.id && "bg-accent border border-border"
              )}
              onClick={() => onSelect(conversation.id)}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={getConversationAvatar(conversation)} />
                <AvatarFallback>
                  {conversation.type === 'group' ? (
                    <Users className="h-5 w-5" />
                  ) : (
                    getConversationName(conversation).charAt(0).toUpperCase()
                  )}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium truncate">
                    {getConversationName(conversation)}
                  </h4>
                  {conversation.last_message && (
                    <span className="text-xs text-muted-foreground">
                      {formatTime(conversation.last_message.created_at)}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.last_message
                      ? `${conversation.last_message.sender_name}: ${conversation.last_message.content}`
                      : 'Nenhuma mensagem'
                    }
                  </p>
                  
                  {conversation.unread_count && conversation.unread_count > 0 && (
                    <Badge variant="default" className="ml-2 h-5 min-w-5 text-xs">
                      {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  )
}
