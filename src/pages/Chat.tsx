
import { useState, useEffect } from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { CreateChatRoomDialog } from "@/components/CreateChatRoomDialog"
import { DirectChatDialog } from "@/components/DirectChatDialog"
import { EditChatRoomDialog } from "@/components/EditChatRoomDialog"
import { StartChatDialog } from "@/components/StartChatDialog"
import { ChatAttachmentUpload } from "@/components/ChatAttachmentUpload"
import { ChatSidebar } from "@/components/ChatSidebar"
import { ChatRoomHeader } from "@/components/ChatRoomHeader"
import { ChatMessage } from "@/components/ChatMessage"
import { MessageCircle, Send, Smile } from "lucide-react"
import { useChatRooms, useChatMessages, useSendMessage, useChatParticipants } from '@/hooks/useChat'

export default function Chat() {
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false)
  const [isDirectChatOpen, setIsDirectChatOpen] = useState(false)
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [newMessage, setNewMessage] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const { profile, signOut } = useAuth()
  const { toast } = useToast()
  const { data: rooms = [], isLoading: isLoadingRooms } = useChatRooms()
  const { data: messages = [] } = useChatMessages(selectedRoom?.id)
  const { data: participants = [] } = useChatParticipants(selectedRoom?.id)
  const sendMessage = useSendMessage()

  // Selecionar primeira conversa automaticamente quando carrega
  useEffect(() => {
    if (!selectedRoom && rooms.length > 0) {
      setSelectedRoom(rooms[0])
    }
  }, [rooms, selectedRoom])

  const handleRoomSelect = (room: any) => {
    console.log('Selecting room:', room.name, room.id)
    setSelectedRoom(room)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() && !selectedFile) return
    if (!selectedRoom || !profile) return

    try {
      console.log('Sending message to room:', selectedRoom.id)
      
      const messageData: any = {
        roomId: selectedRoom.id,
        content: newMessage.trim() || '',
      }

      if (selectedFile) {
        messageData.attachmentFile = selectedFile
      }

      await sendMessage.mutateAsync(messageData)
      setNewMessage('')
      setSelectedFile(null)
      
      console.log('Message sent successfully')
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleCreateRoom = (roomId: string) => {
    setIsCreateRoomOpen(false)
    const newRoom = rooms.find(r => r.id === roomId)
    if (newRoom) {
      setSelectedRoom(newRoom)
    }
  }

  const handleDirectChat = (roomId: string) => {
    setIsDirectChatOpen(false)
    const room = rooms.find(r => r.id === roomId)
    if (room) {
      setSelectedRoom(room)
    }
  }

  const handleChatCreated = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId)
    if (room) {
      setSelectedRoom(room)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e as any)
    }
  }

  if (isLoadingRooms) {
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
      <ChatSidebar
        rooms={rooms}
        selectedRoom={selectedRoom}
        onRoomSelect={handleRoomSelect}
        onCreateRoom={() => setIsCreateRoomOpen(true)}
        onDirectChat={() => setIsDirectChatOpen(true)}
        onSignOut={signOut}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <ChatRoomHeader
              room={selectedRoom}
              participantCount={participants.length}
              onEditRoom={() => setIsEditRoomOpen(true)}
            />

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
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isOwn={message.sender_id === profile?.id}
                    />
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
                  Anexo selecionado: {selectedFile.name}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-4 max-w-md">
              <MessageCircle className="h-24 w-24 mx-auto mb-6 opacity-30" />
              <h3 className="text-xl font-medium mb-2">Bem-vindo ao Chat Interno</h3>
              <p className="text-sm mb-6 leading-relaxed">
                {profile?.role === 'admin' ? 
                  'Como administrador, você pode conversar com qualquer usuário e criar grupos.' :
                  profile?.role === 'technician' ?
                  'Você pode conversar com administradores e usuários das unidades que atende.' :
                  'Você pode conversar com administradores, técnicos e usuários da sua unidade.'
                }
              </p>
              <div className="space-y-3">
                <StartChatDialog onChatCreated={handleChatCreated} />
                {rooms.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Ou selecione uma conversa na barra lateral
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateChatRoomDialog onRoomCreated={handleCreateRoom} />

      <DirectChatDialog
        open={isDirectChatOpen}
        onOpenChange={setIsDirectChatOpen}
        targetUserId={null}
        onRoomCreated={handleDirectChat}
      />

      {selectedRoom && (
        <EditChatRoomDialog
          room={selectedRoom}
          isOpen={isEditRoomOpen}
          onOpenChange={setIsEditRoomOpen}
        />
      )}
    </div>
  )
}
