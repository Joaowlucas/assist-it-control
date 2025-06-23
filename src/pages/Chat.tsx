
import { useState, useEffect, useRef } from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from '@/components/ui/button'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { NewChatModal } from "@/components/NewChatModal"
import { ConversationList } from "@/components/ConversationList"
import { MessageBubble } from "@/components/MessageBubble"
import { ChatInput } from "@/components/ChatInput"
import { MessageCircle, MoreVertical, Trash2 } from "lucide-react"
import { useConversations, useMessages, useDeleteConversation } from '@/hooks/useConversations'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface Conversation {
  id: string
  name: string
  created_by: string
  created_at: string
  updated_at: string
  last_message_at: string
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

export default function Chat() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { profile, signOut } = useAuth()
  const { toast } = useToast()
  const { data: conversations = [], isLoading: isLoadingConversations } = useConversations()
  const { data: messages = [] } = useMessages(selectedConversation?.id)
  const deleteConversation = useDeleteConversation()

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Selecionar primeira conversa automaticamente quando carrega
  useEffect(() => {
    if (!selectedConversation && conversations.length > 0) {
      setSelectedConversation(conversations[0])
    }
  }, [conversations, selectedConversation])

  const handleConversationCreated = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId)
    if (conversation) {
      setSelectedConversation(conversation)
    }
  }

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return

    try {
      await deleteConversation.mutateAsync(selectedConversation.id)
      setSelectedConversation(null)
      toast({
        title: "Sucesso",
        description: "Conversa excluída com sucesso."
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a conversa.",
        variant: "destructive"
      })
    }
  }

  const getOtherParticipant = (conversation: Conversation) => {
    if (!conversation.participants) return null
    return conversation.participants.find(p => p.user_id !== profile?.id)?.profiles
  }

  const canDeleteConversation = selectedConversation?.created_by === profile?.id

  if (isLoadingConversations) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <MessageCircle className="h-16 w-16 mx-auto opacity-50" />
          <p>Carregando conversas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Conversas</h2>
            <Button variant="ghost" size="sm" onClick={signOut}>
              Sair
            </Button>
          </div>
          <NewChatModal onConversationCreated={handleConversationCreated} />
        </div>

        {/* Lista de conversas */}
        <ConversationList
          selectedConversation={selectedConversation}
          onConversationSelect={setSelectedConversation}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={getOtherParticipant(selectedConversation)?.avatar_url || undefined} />
                    <AvatarFallback>
                      {getOtherParticipant(selectedConversation)?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">
                        {getOtherParticipant(selectedConversation)?.name || 'Usuário Desconhecido'}
                      </h3>
                      {getOtherParticipant(selectedConversation)?.role === 'admin' && (
                        <Badge variant="destructive" className="text-xs">
                          Admin
                        </Badge>
                      )}
                      {getOtherParticipant(selectedConversation)?.role === 'technician' && (
                        <Badge variant="secondary" className="text-xs">
                          Técnico
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedConversation.participants?.length || 0} participantes
                    </p>
                  </div>
                </div>

                {canDeleteConversation && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleDeleteConversation} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir conversa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma mensagem ainda.</p>
                    <p className="text-sm">Seja o primeiro a enviar uma mensagem!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={message.sender_id === profile?.id}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <ChatInput conversationId={selectedConversation.id} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-4 max-w-md">
              <MessageCircle className="h-24 w-24 mx-auto mb-6 opacity-30" />
              <h3 className="text-xl font-medium mb-2">Bem-vindo ao Chat Interno</h3>
              <p className="text-sm mb-6 leading-relaxed">
                Converse com usuários disponíveis. Inicie uma nova conversa ou selecione uma conversa existente.
              </p>
              <div className="space-y-3">
                <NewChatModal onConversationCreated={handleConversationCreated} />
                {conversations.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Ou selecione uma conversa na barra lateral
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
