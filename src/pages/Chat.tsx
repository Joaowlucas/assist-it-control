
import { useState, useEffect } from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { DirectChatDialog } from "@/components/DirectChatDialog"
import { EditChatRoomDialog } from "@/components/EditChatRoomDialog"
import { ChatAttachmentUpload } from "@/components/ChatAttachmentUpload"
import { ChatSidebarUnified } from "@/components/ChatSidebarUnified"
import { CreateGroupRoomDialog } from "@/components/CreateGroupRoomDialog"
import { CreateUnitRoomDialog } from "@/components/CreateUnitRoomDialog"
import { ChatRoomHeader } from "@/components/ChatRoomHeader"
import { ChatMessage } from "@/components/ChatMessage"
import { MessageCircle, Send } from "lucide-react"
import { useChatRooms, useChatMessages, useSendMessage, useChatParticipants } from '@/hooks/useChat'

export default function Chat() {
  const [isDirectChatOpen, setIsDirectChatOpen] = useState(false)
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false)
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [isCreateUnitRoomOpen, setIsCreateUnitRoomOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [newMessage, setNewMessage] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const { profile, signOut } = useAuth()
  const { toast } = useToast()
  const { data: rooms = [], isLoading: isLoadingRooms } = useChatRooms()
  const { data: messages = [] } = useChatMessages(selectedRoom?.id)
  const { data: participants = [] } = useChatParticipants(selectedRoom?.id)
  const sendMessage = useSendMessage()

  const handleRoomSelect = (room: any) => {
    setSelectedRoom(room)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() && !selectedFile) return
    if (!selectedRoom || !profile) return

    try {
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
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem.",
        variant: "destructive",
      })
    }
  }

  const handleDirectChat = (roomId: string) => {
    setIsDirectChatOpen(false)
    const room = rooms.find(r => r.id === roomId)
    if (room) {
      setSelectedRoom(room)
    }
  }

  const handleGroupCreated = (roomId: string) => {
    setIsCreateGroupOpen(false)
    const room = rooms.find(r => r.id === roomId)
    if (room) {
      setSelectedRoom(room)
    }
    toast({
      title: "Sucesso",
      description: "Grupo criado com sucesso!",
    })
  }

  const handleUnitRoomCreated = (roomId: string) => {
    setIsCreateUnitRoomOpen(false)
    const room = rooms.find(r => r.id === roomId)
    if (room) {
      setSelectedRoom(room)
    }
    toast({
      title: "Sucesso",
      description: "Sala de unidade criada com sucesso!",
    })
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Unificado */}
      <ChatSidebarUnified
        rooms={rooms}
        selectedRoom={selectedRoom}
        onRoomSelect={handleRoomSelect}
        onDirectChat={() => setIsDirectChatOpen(true)}
        onCreateGroup={() => setIsCreateGroupOpen(true)}
        onCreateUnitRoom={() => setIsCreateUnitRoomOpen(true)}
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
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isOwn={message.sender_id === profile?.id}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-end gap-2">
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
                    className="min-h-[40px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage(e)
                      }
                    }}
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={(!newMessage.trim() && !selectedFile) || sendMessage.isPending}
                  className="h-10"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
              <p className="text-sm mb-4">
                Escolha uma conversa da lista ou inicie uma nova
              </p>
              <Button 
                variant="outline" 
                onClick={() => setIsDirectChatOpen(true)}
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Iniciar Chat Direto
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <DirectChatDialog
        open={isDirectChatOpen}
        onOpenChange={setIsDirectChatOpen}
        targetUserId={null}
        onRoomCreated={handleDirectChat}
      />

      <CreateGroupRoomDialog
        open={isCreateGroupOpen}
        onOpenChange={setIsCreateGroupOpen}
        onRoomCreated={handleGroupCreated}
      />

      <CreateUnitRoomDialog
        open={isCreateUnitRoomOpen}
        onOpenChange={setIsCreateUnitRoomOpen}
        onRoomCreated={handleUnitRoomCreated}
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
