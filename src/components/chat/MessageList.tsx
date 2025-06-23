
import { useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { ChevronUp } from "lucide-react"
import { MessageBubble } from "./MessageBubble"
import { useAuth } from "@/hooks/useAuth"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  updated_at: string
  edited_at?: string
  message_type: string
  reply_to_id?: string
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

interface MessageListProps {
  messages: Message[]
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
  conversationId: string
}

export function MessageList({ messages, loading, hasMore, onLoadMore, conversationId }: MessageListProps) {
  const { profile } = useAuth()
  const scrollRef = useRef<HTMLDivElement>(null)
  const { targetRef } = useInfiniteScroll({
    hasMore,
    loading,
    onLoadMore,
  })

  const groupedMessages = messages.reduce((groups: Message[][], message, index) => {
    const prevMessage = messages[index - 1]
    const isSameSender = prevMessage?.sender_id === message.sender_id
    const timeDiff = prevMessage ? 
      new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() : 
      Infinity
    const isWithinTimeWindow = timeDiff < 5 * 60 * 1000 // 5 minutos

    if (isSameSender && isWithinTimeWindow && groups.length > 0) {
      groups[groups.length - 1].push(message)
    } else {
      groups.push([message])
    }

    return groups
  }, [])

  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Botão de carregar mais mensagens */}
      {hasMore && (
        <div ref={targetRef} className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={onLoadMore} disabled={loading}>
            <ChevronUp className="h-4 w-4 mr-2" />
            {loading ? 'Carregando...' : 'Carregar mensagens anteriores'}
          </Button>
        </div>
      )}

      {/* Mensagens agrupadas */}
      {groupedMessages.map((group, groupIndex) => (
        <div key={group[0].id} className="space-y-1">
          {group.map((message, messageIndex) => (
            <MessageBubble
              key={message.id}
              message={message}
              isCurrentUser={message.sender_id === profile?.id}
              showAvatar={messageIndex === group.length - 1}
              showName={messageIndex === 0 && message.sender_id !== profile?.id}
              conversationId={conversationId}
            />
          ))}
        </div>
      ))}

      {messages.length === 0 && !loading && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="text-lg mb-2">Nenhuma mensagem ainda</p>
            <p className="text-sm">Seja o primeiro a enviar uma mensagem!</p>
          </div>
        </div>
      )}
    </div>
  )
}
