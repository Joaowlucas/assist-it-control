
import { useState, useEffect, useMemo } from "react"
import { useChat } from "@/hooks/useChat"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { CreateChatRoomDialog } from "@/components/CreateChatRoomDialog"
import { DirectChatDialog } from "@/components/DirectChatDialog"
import { EditChatRoomDialog } from "@/components/EditChatRoomDialog"
import { ChatMessageAttachment } from "@/components/ChatMessageAttachment"
import { ChatAttachmentUpload } from "@/components/ChatAttachmentUpload"
import { 
  MessageSquare, 
  Plus, 
  Send, 
  Users, 
  Menu, 
  Settings, 
  Paperclip,
  Phone,
  Video,
  MoreVertical
} from "lucide-react"
import { format, isToday, isYesterday } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

export default function Chat() {
  const { profile } = useAuth()
  const { toast } = useToast()
  
  const {
    rooms,
    messages,
    selectedRoom,
    isLoadingRooms,
    isLoadingMessages,
    sendMessage,
    selectRoom,
    markAsRead,
    createRoom,
    updateRoom,
    deleteRoom,
    leaveRoom
  } = useChat()

  const [newMessage, setNewMessage] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDirectDialog, setShowDirectDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingRoom, setEditingRoom] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Filtrar salas baseado na busca
  const filteredRooms = useMemo(() => {
    if (!searchTerm) return rooms
    return rooms.filter(room => 
      room.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [rooms, searchTerm])

  // Agrupar mensagens por data
  const groupedMessages = useMemo(() => {
    if (!messages) return []
    
    const groups: { [key: string]: typeof messages } = {}
    
    messages.forEach(message => {
      const date = new Date(message.created_at)
      let dateKey: string
      
      if (isToday(date)) {
        dateKey = 'Hoje'
      } else if (isYesterday(date)) {
        dateKey = 'Ontem'
      } else {
        dateKey = format(date, 'dd/MM/yyyy', { locale: ptBR })
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(message)
    })
    
    return Object.entries(groups).map(([date, msgs]) => ({
      date,
      messages: msgs
    }))
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedRoom) return

    try {
      await sendMessage(selectedRoom.id, newMessage.trim())
      setNewMessage("")
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive"
      })
    }
  }

  const handleRoomSelect = (room: any) => {
    selectRoom(room.id)
    markAsRead(room.id)
    setIsMobileSidebarOpen(false)
  }

  const handleEditRoom = (room: any) => {
    setEditingRoom(room)
    setShowEditDialog(true)
  }

  const formatMessageTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm', { locale: ptBR })
  }

  const getRoomType = (room: any) => {
    if (room.type === 'private') return 'Privado'
    if (room.type === 'group') return 'Grupo'
    return 'Unidade'
  }

  const canManageRoom = (room: any) => {
    return profile?.role === 'admin' || room.created_by === profile?.id
  }

  const ChatSidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Conversas</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDirectDialog(true)}
              disabled={profile?.role === 'user'}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateDialog(true)}
              disabled={profile?.role === 'user'}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Input
          placeholder="Buscar conversas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoadingRooms ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center text-muted-foreground p-4">
              {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa disponível'}
            </div>
          ) : (
            filteredRooms.map((room) => (
              <div
                key={room.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                  selectedRoom?.id === room.id 
                    ? 'bg-primary/10 border border-primary/20' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => handleRoomSelect(room)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={room.image_url} />
                    <AvatarFallback>
                      {room.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{room.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {getRoomType(room)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {room.participant_count || 0} participantes
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )

  const ChatContent = () => {
    if (!selectedRoom) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
            <p className="text-muted-foreground">
              Escolha uma conversa da lista para começar a trocar mensagens
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="flex-1 flex flex-col">
        {/* Header da conversa */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>Conversas</SheetTitle>
                </SheetHeader>
                <ChatSidebar />
              </SheetContent>
            </Sheet>
            
            <Avatar className="h-8 w-8">
              <AvatarImage src={selectedRoom.image_url} />
              <AvatarFallback>
                {selectedRoom.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="font-medium">{selectedRoom.name}</h3>
              <p className="text-sm text-muted-foreground">
                {getRoomType(selectedRoom)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canManageRoom(selectedRoom) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditRoom(selectedRoom)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mensagens */}
        <ScrollArea className="flex-1 p-4">
          {isLoadingMessages ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : groupedMessages.length === 0 ? (
            <div className="text-center text-muted-foreground p-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma mensagem ainda</p>
              <p className="text-sm">Seja o primeiro a enviar uma mensagem!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedMessages.map((group) => (
                <div key={group.date}>
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                      {group.date}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {group.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_id === profile?.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.sender_id === profile?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {message.sender_id !== profile?.id && (
                            <p className="text-xs font-medium mb-1 opacity-70">
                              {message.sender?.name}
                            </p>
                          )}
                          
                          <p className="text-sm break-words">{message.content}</p>
                          
                          {message.attachment_url && (
                            <ChatMessageAttachment
                              url={message.attachment_url}
                              name={message.attachment_name}
                              size={message.attachment_size}
                            />
                          )}
                          
                          <p className="text-xs opacity-70 mt-1">
                            {formatMessageTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Input de mensagem */}
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <ChatAttachmentUpload
                  roomId={selectedRoom.id}
                  onUploadComplete={() => {
                    toast({
                      title: "Sucesso",
                      description: "Arquivo enviado com sucesso"
                    })
                  }}
                />
              </div>
              
              <Input
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="resize-none"
              />
            </div>
            
            <Button type="submit" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex">
      {/* Sidebar Desktop */}
      <div className="hidden md:block w-80 border-r bg-background">
        <ChatSidebar />
      </div>

      {/* Conteúdo Principal */}
      <ChatContent />

      {/* Diálogos */}
      <CreateChatRoomDialog
        isOpen={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onRoomCreated={(roomId) => {
          setShowCreateDialog(false)
          // Selecionar a nova sala
          const newRoom = rooms.find(r => r.id === roomId)
          if (newRoom) {
            selectRoom(roomId)
          }
        }}
      />

      <DirectChatDialog
        isOpen={showDirectDialog}
        onOpenChange={setShowDirectDialog}
        onDirectChatCreated={(room) => {
          setShowDirectDialog(false)
          selectRoom(room.id)
        }}
      />

      {editingRoom && (
        <EditChatRoomDialog
          room={editingRoom}
          isOpen={showEditDialog}
          onOpenChange={setShowEditDialog}
          onRoomUpdated={() => {
            setShowEditDialog(false)
            setEditingRoom(null)
          }}
        />
      )}
    </div>
  )
}
