import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, MessageCircle, Send, X, Settings } from "lucide-react"
import { ChatContactsSidebar } from "@/components/ChatContactsSidebar"
import { CreateChatRoomDialog } from "@/components/CreateChatRoomDialog"
import { DirectChatDialog } from "@/components/DirectChatDialog"
import { EditChatRoomDialog } from "@/components/EditChatRoomDialog"
import { ChatRoomAvatar } from "@/components/ChatRoomAvatar"
import { useAuth } from "@/hooks/useAuth"
import { useSupabase } from "@/hooks/useSupabase"
import { useToast } from "@/components/ui/use-toast"
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChatMessageAttachment } from "@/components/ChatMessageAttachment"
import { ChatAttachmentUpload } from "@/components/ChatAttachmentUpload"

interface ChatRoom {
  id: string
  created_at: string
  name: string
  type: 'group' | 'direct'
  owner_id: string
  members?: {
    id: string
    user_id: string
    room_id: string
    created_at: string
    profile: {
      id: string
      full_name: string
      email: string
      avatar_url: string
    }
  }[]
}

interface Message {
  id: string
  created_at: string
  content: string
  sender_id: string
  room_id: string
  attachment_url: string | null
  attachment_name: string | null
  attachment_size: number | null
  sender?: {
    id: string
    full_name: string
    email: string
    avatar_url: string
  }
}

export default function Chat() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [showCreateRoomDialog, setShowCreateRoomDialog] = useState(false)
  const [showDirectChatDialog, setShowDirectChatDialog] = useState(false)
  const [editingRoom, setEditingRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { user, profile } = useAuth()
  const { supabase } = useSupabase()
  const { toast } = useToast()

  useEffect(() => {
    if (!user) return

    const fetchRooms = async () => {
      try {
        const { data: roomsData, error: roomsError } = await supabase
          .from('chat_rooms')
          .select(`
            id,
            created_at,
            name,
            type,
            owner_id,
            members (
              id,
              user_id,
              room_id,
              created_at,
              profile:profiles (
                id,
                full_name,
                email,
                avatar_url
              )
            )
          `)
          .or(`type.eq.group,and(type.eq.direct,members.profile.id.eq.${user.id})`)

        if (roomsError) {
          throw roomsError
        }

        if (roomsData) {
          setRooms(roomsData as ChatRoom[])
        }
      } catch (error: any) {
        toast({
          title: "Erro ao carregar as conversas",
          description: error.message,
          variant: "destructive",
        })
      }
    }

    fetchRooms()

    // Subscrição para novas salas (apenas para salas de grupo)
    const roomSubscription = supabase
      .channel('public:chat_rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_rooms' }, async (payload) => {
        if (payload.new) {
          const newRoom = payload.new as ChatRoom
          if (newRoom.type === 'group') {
            setRooms(prevRooms => [...prevRooms, newRoom])
          }
        }
      })
      .subscribe()

    return () => {
      roomSubscription.unsubscribe()
    }
  }, [user, supabase, toast])

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id)
    }
  }, [selectedRoom])

  useEffect(() => {
    if (!selectedRoom) return

    const messageSubscription = supabase
      .channel(`public:chat_messages:room_id=eq.${selectedRoom.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, async (payload) => {
        if (payload.new) {
          const newMessage = payload.new as Message
          setMessages(prevMessages => [...prevMessages, newMessage])
        }
      })
      .subscribe()

    return () => {
      messageSubscription.unsubscribe()
    }
  }, [selectedRoom, supabase])

  useEffect(() => {
    // Scroll para a parte inferior sempre que novas mensagens são adicionadas
    scrollToBottom()
  }, [messages])

  const fetchMessages = async (roomId: string) => {
    setLoadingMessages(true)
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select(`
          id,
          created_at,
          content,
          sender_id,
          room_id,
          attachment_url,
          attachment_name,
          attachment_size,
          sender:profiles (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (messagesError) {
        throw messagesError
      }

      if (messagesData) {
        setMessages(messagesData as Message[])
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar as mensagens",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() && !attachedFile) return
    if (!selectedRoom) return

    setSendingMessage(true)

    try {
      let attachmentUrl = null
      let attachmentName = null
      let attachmentSize = null

      if (attachedFile) {
        const { data, error } = await supabase.storage
          .from('chat-attachments')
          .upload(`${user!.id}/${Date.now()}-${attachedFile.name}`, attachedFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          throw error
        }

        attachmentUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${data.fullPath}`
        attachmentName = attachedFile.name
        attachmentSize = attachedFile.size
      }

      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          content: newMessage,
          sender_id: user!.id,
          room_id: selectedRoom.id,
          attachment_url: attachmentUrl,
          attachment_name: attachmentName,
          attachment_size: attachmentSize,
        })

      if (messageError) {
        throw messageError
      }

      setNewMessage("")
      setAttachedFile(null)
    } catch (error: any) {
      toast({
        title: "Erro ao enviar a mensagem",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSendingMessage(false)
    }
  }

  const handleFileSelected = (file: File | null) => {
    setAttachedFile(file)
  }

  const handleCreateRoom = (newRoom: ChatRoom) => {
    setRooms([...rooms, newRoom])
  }

  const handleDirectChatCreated = (room: ChatRoom) => {
    setRooms([...rooms, room])
    setSelectedRoom(room)
  }

  const handleEditRoom = (room: ChatRoom) => {
    setEditingRoom(room)
  }

  const getDirectChatPartner = (room: ChatRoom) => {
    return room.members?.find(member => member.profile.id !== user?.id)?.profile
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex h-full">
      {/* Sidebar de contatos */}
      <div className="w-80 border-r border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Chat</h2>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowCreateRoomDialog(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDirectChatDialog(true)}
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar conversas..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <ChatContactsSidebar 
          rooms={filteredRooms}
          selectedRoom={selectedRoom}
          onRoomSelect={setSelectedRoom}
          onRoomEdit={handleEditRoom}
          currentUserId={user?.id || ''}
        />
      </div>

      {/* Área principal do chat */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Header da conversa */}
            <div className="p-4 border-b border-border/50 bg-background/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <ChatRoomAvatar room={selectedRoom} size="md" />
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedRoom.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedRoom.type === 'group' && `${selectedRoom.members?.length || 0} membros`}
                    {selectedRoom.type === 'direct' && getDirectChatPartner(selectedRoom)?.full_name}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditRoom(selectedRoom)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesEndRef}>
              {loadingMessages ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Não há mensagens ainda. Comece a conversa!
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${message.sender_id === user?.id ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          message.sender_id === user?.id
                            ? 'bg-primary text-primary-foreground ml-2'
                            : 'bg-muted mr-2'
                        }`}
                      >
                        {message.sender_id !== user?.id && selectedRoom.type === 'group' && (
                          <div className="text-xs font-medium mb-1 opacity-70">
                            {message.sender?.full_name}
                          </div>
                        )}
                        <div className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
                        {message.attachment_url && (
                          <ChatMessageAttachment 
                            attachmentUrl={message.attachment_url}
                            fileName={message.attachment_name || ''}
                            fileSize={message.attachment_size}
                          />
                        )}
                        <div className="text-xs opacity-70 mt-1">
                          {format(new Date(message.created_at), 'HH:mm', { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input de mensagem */}
            <div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-sm">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <ChatAttachmentUpload 
                  onFileSelected={handleFileSelected}
                  disabled={sendingMessage}
                />
                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    disabled={sendingMessage}
                    className="pr-10"
                  />
                  {attachedFile && (
                    <div className="absolute -top-16 left-0 right-0 bg-muted p-2 rounded-md text-sm flex items-center justify-between">
                      <span className="truncate">📎 {attachedFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAttachedFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <Button type="submit" disabled={sendingMessage || (!newMessage.trim() && !attachedFile)}>
                  {sendingMessage ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecione uma conversa para começar</p>
            </div>
          </div>
        )}
      </div>

      {/* Diálogos */}
      <CreateChatRoomDialog
        open={showCreateRoomDialog}
        onOpenChange={setShowCreateRoomDialog}
        onCreate={handleCreateRoom}
      />

      <DirectChatDialog
        open={showDirectChatDialog}
        onOpenChange={setShowDirectChatDialog}
        onChatCreated={handleDirectChatCreated}
      />

      {editingRoom && (
        <EditChatRoomDialog
          room={editingRoom}
          onClose={() => setEditingRoom(null)}
        />
      )}
    </div>
  )
}
