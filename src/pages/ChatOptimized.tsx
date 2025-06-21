
import { useState, useEffect } from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { ChatSidebar } from "@/components/ChatSidebar"
import { ChatRoomHeader } from "@/components/ChatRoomHeader"
import { ChatMessage } from "@/components/ChatMessage"
import { ChatAttachmentUpload } from "@/components/ChatAttachmentUpload"
import { MessageCircle, Send, ArrowLeft } from "lucide-react"
import { 
  useChatRoomsOptimized, 
  useChatMessagesOptimized, 
  useSendMessageOptimized,
  ChatRoom 
} from '@/hooks/useChatOptimized'
import { StartChatDialogOptimized } from '@/components/StartChatDialogOptimized'
import { 
  ChatRoomsSkeleton, 
  ChatMessagesSkeleton, 
  EmptyChatState,
  LoadingOverlay,
  ChatActionLoading 
} from '@/components/ChatLoadingStates'

export default function ChatOptimized() {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)

  const { profile, signOut } = useAuth()
  const { toast } = useToast()
  
  // Hooks otimizados
  const { data: rooms = [], isLoading: isLoadingRooms, error: roomsError } = useChatRoomsOptimized()
  const { data: messages = [], isLoading: isLoadingMessages } = useChatMessagesOptimized(selectedRoom?.id)
  const sendMessage = useSendMessageOptimized()

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      setShowSidebar(window.innerWidth >= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto-selecionar primeira conversa
  useEffect(() => {
    if (!selectedRoom && rooms.length > 0 && !isLoadingRooms) {
      console.log('🎯 Auto-selecting first room:', rooms[0].name)
      setSelectedRoom(rooms[0])
      if (isMobile) setShowSidebar(false)
    }
  }, [rooms, selectedRoom, isLoadingRooms, isMobile])

  // Tratar erros
  useEffect(() => {
    if (roomsError) {
      console.error('❌ Chat rooms error:', roomsError)
      toast({
        title: "Erro ao carregar conversas",
        description: "Tente recarregar a página",
        variant: "destructive",
      })
    }
  }, [roomsError, toast])

  const handleRoomSelect = (room: ChatRoom) => {
    console.log('📱 Selecting room:', room.name)
    setSelectedRoom(room)
    if (isMobile) setShowSidebar(false)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() && !selectedFile) return
    if (!selectedRoom || !profile) return

    const messageContent = newMessage.trim()
    
    // Limpar inputs imediatamente para UX
    setNewMessage('')
    setSelectedFile(null)

    try {
      console.log('📨 Sending optimized message...')
      
      await sendMessage.mutateAsync({
        roomId: selectedRoom.id,
        content: messageContent,
        attachmentFile: selectedFile || undefined,
      })
      
      console.log('✅ Message sent successfully')
    } catch (error) {
      console.error('❌ Error sending message:', error)
      // Restaurar conteúdo em caso de erro
      setNewMessage(messageContent)
      if (selectedFile) setSelectedFile(selectedFile)
      
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleChatCreated = (roomId: string) => {
    console.log('🎉 Chat created, finding room:', roomId)
    const room = rooms.find(r => r.id === roomId)
    if (room) {
      setSelectedRoom(room)
      if (isMobile) setShowSidebar(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e as any)
    }
  }

  const handleBackToSidebar = () => {
    if (isMobile) {
      setShowSidebar(true)
      setSelectedRoom(null)
    }
  }

  if (isLoadingRooms) {
    return (
      <div className="flex h-screen bg-background">
        <div className="w-80 border-r border-border">
          <div className="p-4 border-b">
            <div className="h-10 bg-muted rounded animate-pulse mb-4" />
            <div className="h-10 bg-muted rounded animate-pulse" />
          </div>
          <ChatRoomsSkeleton />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <MessageCircle className="h-16 w-16 mx-auto opacity-50" />
            <p>Carregando sistema de chat...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Loading overlay para ações críticas */}
      <LoadingOverlay 
        message="Processando..." 
        show={sendMessage.isPending && (!!selectedFile || newMessage.length > 100)} 
      />

      {/* Sidebar - Responsiva */}
      {(!isMobile || showSidebar) && (
        <div className={`${isMobile ? 'absolute inset-0 z-20' : 'w-80'} bg-background border-r border-border flex flex-col h-full`}>
          <ChatSidebar
            rooms={rooms}
            selectedRoom={selectedRoom}
            onRoomSelect={handleRoomSelect}
            onCreateRoom={() => {}} // Não usado mais
            onDirectChat={() => {}} // Não usado mais
            onSignOut={signOut}
          />
        </div>
      )}

      {/* Main Chat Area - Responsiva */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Header com botão de voltar no mobile */}
            <div className="flex items-center gap-2 p-4 border-b border-border bg-background/95 backdrop-blur">
              {isMobile && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBackToSidebar}
                  className="mr-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="flex-1">
                <ChatRoomHeader
                  room={selectedRoom}
                  participantCount={0} // Será implementado depois
                  onEditRoom={() => {}} // Será implementado depois
                />
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {isLoadingMessages ? (
                <ChatMessagesSkeleton />
              ) : messages.length === 0 ? (
                <EmptyChatState
                  title="Nenhuma mensagem ainda"
                  description="Seja o primeiro a enviar uma mensagem nesta conversa!"
                />
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isOwn={message.sender_id === profile?.id}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Input de mensagem */}
            <div className="p-4 border-t border-border bg-background/95 backdrop-blur">
              {/* Loading para envio */}
              <ChatActionLoading 
                action="Enviando mensagem" 
                show={sendMessage.isPending} 
              />
              
              <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                <ChatAttachmentUpload
                  onFileSelect={setSelectedFile}
                  selectedFile={selectedFile}
                />
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="min-h-[48px] resize-none"
                    disabled={sendMessage.isPending}
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={(!newMessage.trim() && !selectedFile) || sendMessage.isPending}
                  className="h-12 px-4"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              
              {selectedFile && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Anexo: {selectedFile.name}
                </div>
              )}
            </div>
          </>
        ) : (
          <EmptyChatState
            title="Bem-vindo ao Chat Interno"
            description={
              profile?.role === 'admin' ? 
                'Como administrador, você pode conversar com qualquer usuário e criar grupos.' :
                profile?.role === 'technician' ?
                'Você pode conversar com administradores e usuários das unidades que atende.' :
                'Você pode conversar com administradores, técnicos e usuários da sua unidade.'
            }
            action={
              <div className="space-y-3">
                <StartChatDialogOptimized onChatCreated={handleChatCreated} />
                {rooms.length > 0 && !isMobile && (
                  <p className="text-xs text-muted-foreground">
                    Ou selecione uma conversa na barra lateral
                  </p>
                )}
                {isMobile && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSidebar(true)}
                    className="mt-2"
                  >
                    Ver Conversas
                  </Button>
                )}
              </div>
            }
          />
        )}
      </div>
    </div>
  )
}
