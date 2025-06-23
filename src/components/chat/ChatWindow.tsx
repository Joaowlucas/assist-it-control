
import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MoreVertical, Users, Phone, Video } from "lucide-react"
import { MessageInput } from "./MessageInput"
import { MessageList } from "./MessageList"
import { TypingIndicator } from "./TypingIndicator"
import { useChatMessages } from "@/hooks/useChatMessages"
import { useConversationDetails } from "@/hooks/useConversationDetails"
import { useUserPresence } from "@/hooks/useUserPresence"
import { useAuth } from "@/hooks/useAuth"

interface ChatWindowProps {
  conversationId: string
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const { profile } = useAuth()
  const { conversation, loading: conversationLoading } = useConversationDetails(conversationId)
  const { messages, loading: messagesLoading, loadMore, hasMore } = useChatMessages(conversationId)
  const { updateTypingStatus } = useUserPresence()
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleStartTyping = () => {
    if (!isTyping) {
      setIsTyping(true)
      updateTypingStatus(conversationId, true)
    }
  }

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false)
      updateTypingStatus(conversationId, false)
    }
  }

  if (conversationLoading || !conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const displayName = conversation.name || 
    (conversation.type === 'direct' 
      ? conversation.participants?.find(p => p.id !== profile?.id)?.name || 'Conversa'
      : 'Grupo')

  return (
    <div className="flex flex-col h-full">
      {/* Header da conversa */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-background/95 backdrop-blur">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={
              conversation.avatar_url || 
              (conversation.type === 'direct' 
                ? conversation.participants?.find(p => p.id !== profile?.id)?.avatar_url
                : undefined)
            } />
            <AvatarFallback>
              {conversation.type === 'group' ? (
                <Users className="h-5 w-5" />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h2 className="font-semibold">{displayName}</h2>
            <div className="flex items-center space-x-2">
              {conversation.type === 'group' && (
                <Badge variant="secondary" className="text-xs">
                  {conversation.participants?.length || 0} membros
                </Badge>
              )}
              {conversation.type === 'direct' && (
                <span className="text-sm text-muted-foreground">
                  Online
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Lista de mensagens */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          loading={messagesLoading}
          hasMore={hasMore}
          onLoadMore={loadMore}
          conversationId={conversationId}
        />
        <TypingIndicator conversationId={conversationId} />
        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensagem */}
      <div className="border-t border-border">
        <MessageInput
          conversationId={conversationId}
          onStartTyping={handleStartTyping}
          onStopTyping={handleStopTyping}
        />
      </div>
    </div>
  )
}
