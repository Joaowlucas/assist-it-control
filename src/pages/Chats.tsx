import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ConversationList } from '@/components/chat/ConversationList'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { StartChatDialog } from '@/components/chat/StartChatDialog'
import { Button } from '@/components/ui/button'
import { MessageSquare, Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useConversations } from '@/hooks/useConversations'

export default function Chats() {
  const { profile } = useAuth()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [isStartChatOpen, setIsStartChatOpen] = useState(false)
  const { conversations, loading } = useConversations()

  // Auto-select first conversation if available
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0].id)
    }
  }, [conversations, selectedConversationId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Chat</h1>
          <p className="text-muted-foreground mt-2">
            Converse com técnicos e administradores da sua unidade
          </p>
        </div>
        <Button onClick={() => setIsStartChatOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Conversa
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Lista de Conversas */}
        <Card className="lg:col-span-1 p-0 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b bg-muted/20">
              <h2 className="font-semibold text-foreground">Conversas</h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <ConversationList
                conversations={conversations}
                selectedId={selectedConversationId}
                onSelect={setSelectedConversationId}
              />
            </div>
          </div>
        </Card>

        {/* Janela do Chat */}
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          {selectedConversationId ? (
            <ChatWindow 
              conversationId={selectedConversationId}
              onClose={() => setSelectedConversationId(null)}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-muted/10">
              <div className="text-center p-8">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Selecione uma conversa
                </h3>
                <p className="text-muted-foreground mb-4">
                  Escolha uma conversa da lista ao lado para começar a conversar
                </p>
                <Button 
                  onClick={() => setIsStartChatOpen(true)}
                  variant="outline"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Iniciar Nova Conversa
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <StartChatDialog 
        open={isStartChatOpen}
        onOpenChange={setIsStartChatOpen}
        onConversationCreated={(conversationId) => {
          setSelectedConversationId(conversationId)
          setIsStartChatOpen(false)
        }}
      />
    </div>
  )
}