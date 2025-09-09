import { useState, useEffect, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Send, Paperclip, MoreVertical, Users, X } from 'lucide-react'
import { useChatMessages } from '@/hooks/useChatMessages'
import { MessageBubble } from '@/components/MessageBubble'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'

interface ChatWindowProps {
  conversationId: string
  onClose?: () => void
}

export function ChatWindow({ conversationId, onClose }: ChatWindowProps) {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { user } = useAuth()
  
  const { 
    messages, 
    loading, 
    sendMessage, 
    conversation,
    participants,
    typing
  } = useChatMessages(conversationId)

  // Auto scroll para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }
  }, [message])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    try {
      await sendMessage(message.trim())
      setMessage('')
      setIsTyping(false)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  const getConversationName = () => {
    if (!conversation) return 'Carregando...'
    
    if (conversation.name) return conversation.name
    
    if (conversation.type === 'direct') {
      const otherParticipant = participants.find(p => p.user_id !== user?.id)
      return otherParticipant?.user.name || 'Conversa Direta'
    }
    
    return `Grupo (${participants.length} membros)`
  }

  const getConversationAvatar = () => {
    if (!conversation) return undefined
    
    if (conversation.type === 'direct') {
      const otherParticipant = participants.find(p => p.user_id !== user?.id)
      return otherParticipant?.user.avatar_url
    }
    return conversation.avatar_url
  }

  const getConversationInitials = () => {
    const name = getConversationName()
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={getConversationAvatar()} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {conversation?.type === 'group' ? (
                <Users className="h-4 w-4" />
              ) : (
                getConversationInitials()
              )}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground truncate">
              {getConversationName()}
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {conversation?.type === 'group' && (
                <Badge variant="secondary" className="text-xs">
                  {participants.length} membros
                </Badge>
              )}
              {typing.length > 0 && (
                <span className="text-xs italic">
                  {typing.join(', ')} {typing.length === 1 ? 'está' : 'estão'} digitando...
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Ver participantes</DropdownMenuItem>
              <DropdownMenuItem>Configurações</DropdownMenuItem>
              <Separator />
              <DropdownMenuItem className="text-destructive">
                Sair da conversa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isCurrentUser={message.user_id === user?.id}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mb-2"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="min-h-[40px] max-h-[120px] resize-none"
              rows={1}
            />
          </div>
          
          <Button
            type="submit"
            disabled={!message.trim()}
            className="mb-2"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}