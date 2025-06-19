
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MessageCircle, Plus, Search, Send, Users, Settings, Paperclip, X, Building2, UserPlus, MessageSquare } from "lucide-react"
import { useChatRooms, useChatMessages, useCreateChatRoom, useSendMessage, useDeleteChatRoom } from "@/hooks/useChat"
import { useAvailableChatUsers } from "@/hooks/useAvailableChatUsers"
import { useAuth } from "@/hooks/useAuth"
import { ChatRoomAvatar } from "@/components/ChatRoomAvatar"
import { CreateChatRoomDialog } from "@/components/CreateChatRoomDialog"
import { EditChatRoomDialog } from "@/components/EditChatRoomDialog"
import { StartChatDialog } from "@/components/StartChatDialog"
import { DirectChatDialog } from "@/components/DirectChatDialog"
import { ChatAttachmentUpload } from "@/components/ChatAttachmentUpload"
import { ChatMessageAttachment } from "@/components/ChatMessageAttachment"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

export default function Chat() {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [messageText, setMessageText] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [showContactsSidebar, setShowContactsSidebar] = useState(false)
  const [isCreateRoomDialogOpen, setIsCreateRoomDialogOpen] = useState(false)
  const [isEditRoomDialogOpen, setIsEditRoomDialogOpen] = useState(false)
  const [isStartChatDialogOpen, setIsStartChatDialogOpen] = useState(false)
  const [isDirectChatDialogOpen, setIsDirectChatDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<any>(null)
  const [attachments, setAttachments] = useState<File[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const { profile } = useAuth()
  const { data: rooms = [], isLoading: roomsLoading } = useChatRooms()
  const { data: messages = [] } = useChatMessages(selectedRoom || undefined)
  const { data: availableUsers = [] } = useAvailableChatUsers()
  const createRoom = useCreateChatRoom()
  const sendMessage = useSendMessage()
  const deleteRoom = useDeleteChatRoom()

  const currentRoom = rooms.find(room => room.id === selectedRoom)
  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSendMessage = async () => {
    if (!selectedRoom || (!messageText.trim() && attachments.length === 0)) return

    try {
      if (attachments.length > 0) {
        await sendMessage.mutateAsync({
          roomId: selectedRoom,
          content: messageText,
          attachmentFile: attachments[0]
        })
      } else {
        await sendMessage.mutateAsync({
          roomId: selectedRoom,
          content: messageText
        })
      }
      setMessageText("")
      setAttachments([])
    } catch (error) {
      toast.error("Erro ao enviar mensagem")
    }
  }

  const handleEditRoom = (room: any) => {
    setEditingRoom(room)
    setIsEditRoomDialogOpen(true)
  }

  const handleDeleteRoom = async (roomId: string) => {
    if (confirm("Tem certeza que deseja excluir esta sala?")) {
      try {
        await deleteRoom.mutateAsync(roomId)
        if (selectedRoom === roomId) {
          setSelectedRoom(null)
        }
        toast.success("Sala excluída com sucesso")
      } catch (error) {
        toast.error("Erro ao excluir sala")
      }
    }
  }

  const getRoomDisplayName = (room: any) => {
    if (room.type === 'private' && room.participants?.length === 2) {
      const otherParticipant = room.participants.find(p => p.user_id !== profile?.id)
      return otherParticipant?.profiles?.name || room.name
    }
    if (room.type === 'unit' && room.units) {
      return `${room.units.name} (Unidade)`
    }
    return room.name
  }

  const canManageRoom = (room: any) => {
    return profile?.role === 'admin' || room.created_by === profile?.id
  }

  const handleDirectChat = (user: any) => {
    setSelectedUser(user)
    setIsDirectChatDialogOpen(true)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar de Salas */}
      <div className={`${showContactsSidebar ? 'w-80' : 'w-80'} border-r bg-card transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Chat</h2>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowContactsSidebar(!showContactsSidebar)}
                className="text-muted-foreground"
              >
                <Users className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCreateRoomDialogOpen(true)}
                className="text-muted-foreground"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                  selectedRoom === room.id ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
                onClick={() => setSelectedRoom(room.id)}
              >
                <div className="flex items-center gap-3">
                  <ChatRoomAvatar room={room} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm truncate">
                        {getRoomDisplayName(room)}
                      </h3>
                      {room.last_message && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(room.last_message.created_at), 'HH:mm')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground truncate">
                        {room.last_message?.content || 'Sem mensagens'}
                      </p>
                      {room.unread_count > 0 && (
                        <Badge variant="default" className="ml-2 text-xs">
                          {room.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {canManageRoom(room) && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditRoom(room)
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Sidebar de Contatos */}
      {showContactsSidebar && (
        <div className="w-64 border-r bg-card">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Contatos</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsStartChatDialogOpen(true)}
                className="text-muted-foreground"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {availableUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => handleDirectChat(user)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.role}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {user.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Área Principal do Chat */}
      <div className="flex-1 flex flex-col">
        {selectedRoom && currentRoom ? (
          <>
            {/* Header da Conversa */}
            <div className="p-4 border-b bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ChatRoomAvatar room={currentRoom} size="md" />
                  <div>
                    <h3 className="font-semibold">{getRoomDisplayName(currentRoom)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {currentRoom.participants?.length || 0} participante(s)
                    </p>
                  </div>
                </div>
                {canManageRoom(currentRoom) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditRoom(currentRoom)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Mensagens */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.sender_id === profile?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.sender_id !== profile?.id && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={message.profiles?.avatar_url || undefined} />
                        <AvatarFallback>
                          {message.profiles?.name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[70%] ${
                        message.sender_id === profile?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      } rounded-lg p-3`}
                    >
                      {message.sender_id !== profile?.id && (
                        <p className="text-xs font-medium mb-1">
                          {message.profiles?.name}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      {message.attachment_url && (
                        <ChatMessageAttachment
                          attachmentUrl={message.attachment_url}
                          attachmentName={message.attachment_name || 'Anexo'}
                          attachmentType={message.attachment_type || 'file'}
                          attachmentSize={message.attachment_size}
                        />
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {format(new Date(message.created_at), 'HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Input de Mensagem */}
            <div className="p-4 border-t bg-card">
              {attachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded">
                      <Paperclip className="h-4 w-4" />
                      <span className="text-sm truncate max-w-32">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                        className="h-4 w-4 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <ChatAttachmentUpload
                  onFileSelect={(files) => setAttachments(files)}
                  maxFiles={5}
                  maxSizeInMB={10}
                />
                <Input
                  placeholder="Digite sua mensagem..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() && attachments.length === 0}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Selecione uma conversa</h3>
              <p className="text-muted-foreground">
                Escolha uma conversa para começar a conversar
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Diálogos */}
      <CreateChatRoomDialog
        isOpen={isCreateRoomDialogOpen}
        onClose={() => setIsCreateRoomDialogOpen(false)}
      />

      <EditChatRoomDialog
        room={editingRoom}
        isOpen={isEditRoomDialogOpen}
        onClose={() => setIsEditRoomDialogOpen(false)}
      />

      <StartChatDialog
        isOpen={isStartChatDialogOpen}
        onClose={() => setIsStartChatDialogOpen(false)}
      />

      <DirectChatDialog
        isOpen={isDirectChatDialogOpen}
        onClose={() => setIsDirectChatDialogOpen(false)}
        targetUserId={selectedUser?.id}
      />
    </div>
  )
}
