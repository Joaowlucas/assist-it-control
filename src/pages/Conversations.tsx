
import { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, MessageCircle } from "lucide-react"
import { ConversationList } from "@/components/chat/ConversationList"
import { ChatWindow } from "@/components/chat/ChatWindow"
import { CreateConversationDialog } from "@/components/chat/CreateConversationDialog"
import { useConversations } from "@/hooks/useConversations"
import { useAuth } from "@/hooks/useAuth"

export default function Conversations() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const { profile } = useAuth()
  const { conversations, loading } = useConversations()

  const filteredConversations = conversations.filter(conv => 
    conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participants?.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Sidebar com lista de conversas */}
      <div className="w-80 border-r border-border flex flex-col">
        {/* Header da sidebar */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageCircle className="h-6 w-6" />
              Conversas
            </h1>
            {(profile?.role === 'admin' || profile?.role === 'technician') && (
              <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Lista de conversas */}
        <div className="flex-1 overflow-hidden">
          <ConversationList
            conversations={filteredConversations}
            selectedId={selectedConversationId}
            onSelect={setSelectedConversationId}
            loading={loading}
          />
        </div>
      </div>

      {/* Área principal de chat */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <ChatWindow conversationId={selectedConversationId} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Card className="w-96">
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-semibold mb-2">Selecione uma conversa</h2>
                <p className="text-muted-foreground">
                  Escolha uma conversa da lista para começar a conversar
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Dialog para criar nova conversa */}
      <CreateConversationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  )
}
