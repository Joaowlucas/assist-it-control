
import React from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MessageCircle } from 'lucide-react'
import { useConversations } from '@/hooks/useConversations'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Conversation {
  id: string
  name: string
  created_by: string
  created_at: string
  updated_at: string
  last_message_at: string
  type?: string
  participants?: Array<{
    id: string
    user_id: string
    profiles: {
      id: string
      name: string
      avatar_url?: string
      role: string
    }
  }>
}

interface ConversationListProps {
  selectedConversation?: Conversation
  onConversationSelect: (conversation: Conversation) => void
}

export function ConversationList({ selectedConversation, onConversationSelect }: ConversationListProps) {
  const { profile } = useAuth()
  const { data: conversations = [], isLoading } = useConversations()

  const getOtherParticipant = (conversation: Conversation) => {
    if (!conversation.participants) return null
    return conversation.participants.find(p => p.user_id !== profile?.id)?.profiles
  }

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffInDays === 0) {
        return format(date, 'HH:mm')
      } else if (diffInDays === 1) {
        return 'Ontem'
      } else if (diffInDays < 7) {
        return format(date, 'eeee', { locale: ptBR })
      } else {
        return format(date, 'dd/MM')
      }
    } catch {
      return ''
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <MessageCircle className="h-8 w-8 mx-auto opacity-50" />
          <p className="text-sm text-muted-foreground">Carregando conversas...</p>
        </div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <MessageCircle className="h-12 w-12 mx-auto opacity-30" />
          <p className="text-sm text-muted-foreground">Nenhuma conversa ainda</p>
          <p className="text-xs text-muted-foreground">Inicie uma nova conversa</p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-1 p-2">
        {conversations.map((conversation) => {
          const otherParticipant = getOtherParticipant(conversation)
          const isSelected = selectedConversation?.id === conversation.id

          return (
            <div
              key={conversation.id}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                isSelected 
                  ? 'bg-accent/50 border border-accent' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => onConversationSelect(conversation)}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={otherParticipant?.avatar_url || undefined} />
                <AvatarFallback className="bg-muted">
                  {otherParticipant?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">
                      {otherParticipant?.name || 'Usuário Desconhecido'}
                    </p>
                    {otherParticipant?.role === 'admin' && (
                      <Badge variant="destructive" className="text-xs px-1 py-0">
                        Admin
                      </Badge>
                    )}
                    {otherParticipant?.role === 'technician' && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        Técnico
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(conversation.last_message_at)}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground italic">
                  Conversa iniciada
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
