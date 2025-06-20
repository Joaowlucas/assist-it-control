import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { CreateChatRoomDialog } from "@/components/CreateChatRoomDialog"
import { DirectChatDialog } from "@/components/DirectChatDialog"
import { EditChatRoomDialog } from "@/components/EditChatRoomDialog"
import { ChatAttachmentUpload } from "@/components/ChatAttachmentUpload"
import { ChatMessageAttachment } from "@/components/ChatMessageAttachment"
import {
  Plus,
  Search,
  Settings,
  LogOut,
  Users,
  UserPlus,
  Edit,
  MessageSquare,
} from "lucide-react"

import { supabase } from '@/integrations/supabase/client'
import { useChatRooms, useChatMessages, useSendMessage } from '@/hooks/useChat'

export default function Chat() {
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false)
  const [isDirectChatOpen, setIsDirectChatOpen] = useState(false)
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const { profile, signOut } = useAuth()
  const { toast } = useToast()
  const { data: rooms = [], isLoading: isLoadingRooms } = useChatRooms()
  const { data: messages = [] } = useChatMessages(selectedRoom?.id)
  const { mutate: sendMessage } = useSendMessage()

  const filteredRooms = rooms.filter(room => {
    if (selectedFilter === 'all') return true
    if (selectedFilter === 'groups') return room.type === 'group'
    if (selectedFilter === 'private') return room.type === 'private'
    return true
  })

  const handleRoomSelect = (room: any) => {
    setSelectedRoom(room)
  }

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const filteredAndSearchedRooms = filteredRooms.filter(room => {
    const searchStr = searchTerm.toLowerCase()
    return room.name.toLowerCase().includes(searchStr)
  })

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() && !selectedFile) return
    if (!selectedRoom || !profile) return

    try {
      let attachmentData = null
      
      if (selectedFile) {
        const fileName = `${Date.now()}-${selectedFile.name}`
        const filePath = `chat-attachments/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, selectedFile)
        
        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage
          .from('uploads')
          .getPublicUrl(filePath)
        
        attachmentData = {
          attachment_url: publicUrl,
          attachment_name: selectedFile.name,
          attachment_type: selectedFile.type,
          attachment_size: selectedFile.size,
        }
      }

      await sendMessage({
        room_id: selectedRoom.id,
        content: newMessage.trim() || '',
        sender_id: profile.id,
        ...attachmentData,
      })

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

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r border-border flex flex-col">
        {/* User Info */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src={`https://avatar.vercel.sh/${profile?.email}.png`} />
              <AvatarFallback>{profile?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{profile?.name}</span>
              <span className="text-sm text-muted-foreground">{profile?.email}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut()}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        {/* Search */}
        <div className="p-4">
          <Input
            type="search"
            placeholder="Buscar salas..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        {/* Filters */}
        <div className="p-4 space-y-2">
          <div className="text-sm font-medium">Filtros</div>
          <div className="flex items-center gap-2">
            <Badge
              variant={selectedFilter === "all" ? "default" : "secondary"}
              onClick={() => handleFilterChange("all")}
              className="cursor-pointer"
            >
              Todas
            </Badge>
            <Badge
              variant={selectedFilter === "groups" ? "default" : "secondary"}
              onClick={() => handleFilterChange("groups")}
              className="cursor-pointer"
            >
              Grupos
            </Badge>
            <Badge
              variant={selectedFilter === "private" ? "default" : "secondary"}
              onClick={() => handleFilterChange("private")}
              className="cursor-pointer"
            >
              Privadas
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Room List */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-sm font-medium mb-2">Salas</div>
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-2">
              {isLoadingRooms ? (
                <div className="text-muted-foreground">Carregando...</div>
              ) : (
                filteredAndSearchedRooms.map((room) => (
                  <Button
                    key={room.id}
                    variant="ghost"
                    className={`w-full justify-start ${selectedRoom?.id === room.id ? 'bg-accent' : ''}`}
                    onClick={() => handleRoomSelect(room)}
                  >
                    {room.name}
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* Actions */}
        <div className="p-4 flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" onClick={() => setIsCreateRoomOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Sala
            </Button>
          </div>
          <div>
            <Button variant="ghost" size="sm" onClick={() => setIsDirectChatOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Chat Direto
            </Button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 mr-2" />
                <span className="font-bold">{selectedRoom.name}</span>
                {selectedRoom.type === 'group' && (
                  <Badge variant="secondary">Grupo</Badge>
                )}
              </div>
              <div>
                <Button variant="ghost" size="sm" onClick={() => setIsEditRoomOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Sala
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender_id === profile?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-lg p-3 ${
                    message.sender_id === profile?.id 
                      ? 'bg-primary text-primary-foreground ml-4' 
                      : 'bg-muted mr-4'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {message.sender?.name || 'Usuário'}
                      </span>
                      <span className="text-xs opacity-70">
                        {format(new Date(message.created_at), 'HH:mm')}
                      </span>
                    </div>
                    {message.content && (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                    {message.attachment_url && (
                      <ChatMessageAttachment message={message} />
                    )}
                  </div>
                </div>
              ))}
            </ScrollArea>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border flex items-center gap-2">
              <ChatAttachmentUpload
                onFileSelect={(file) => setSelectedFile(file)}
                selectedFile={selectedFile}
              />
              <Input
                type="text"
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="rounded-full"
              />
              <Button type="submit" className="rounded-full">
                Enviar
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Selecione uma sala para começar a conversar.
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateChatRoomDialog
        isOpen={isCreateRoomOpen}
        onClose={() => setIsCreateRoomOpen(false)}
        onRoomCreated={(roomId) => {
          setIsCreateRoomOpen(false)
          // Auto-select the new room
        }}
      />

      <DirectChatDialog
        open={isDirectChatOpen}
        onOpenChange={setIsDirectChatOpen}
        targetUserId={null}
        onRoomCreated={(roomId) => {
          setIsDirectChatOpen(false)
          // Handle room creation
        }}
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
