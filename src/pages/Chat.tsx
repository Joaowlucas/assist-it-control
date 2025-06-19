
import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Send, MessageCircle, Users, Paperclip, MoreVertical, Edit, Trash2, X, UserPlus, Building2, Search } from 'lucide-react'
import { useChatRooms, useChatMessages, useSendMessage, useEditMessage, useDeleteMessage, ChatRoom } from '@/hooks/useChat'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChatAttachmentUpload } from '@/components/ChatAttachmentUpload'
import { ChatMessageAttachment } from '@/components/ChatMessageAttachment'
import { ChatContactsSidebar } from '@/components/ChatContactsSidebar'

export default function Chat() {
  const { profile } = useAuth()
  const { data: rooms, isLoading: roomsLoading } = useChatRooms()
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [message, setMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showAttachmentUpload, setShowAttachmentUpload] = useState(false)
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null)
  const [showContactsSidebar, setShowContactsSidebar] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { data: messages, isLoading: messagesLoading } = useChatMessages(selectedRoom?.id || '')
  const sendMessage = useSendMessage()
  const editMessage = useEditMessage()
  const deleteMessage = useDeleteMessage()

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Filtrar salas por busca
  const filteredRooms = rooms?.filter(room =>
    room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.units?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!message.trim() && !selectedFile) || !selectedRoom) return

    await sendMessage.mutateAsync({
      roomId: selectedRoom.id,
      content: message.trim(),
      attachmentFile: selectedFile || undefined,
    })
    
    setMessage('')
    setSelectedFile(null)
    setShowAttachmentUpload(false)
  }

  const handleEditMessage = async () => {
    if (!editingMessage || !editingMessage.content.trim()) return

    await editMessage.mutateAsync({
      messageId: editingMessage.id,
      content: editingMessage.content,
    })
    
    setEditingMessage(null)
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (confirm('Tem certeza que deseja excluir esta mensagem?')) {
      await deleteMessage.mutateAsync(messageId)
    }
  }

  const handleRoomCreated = (roomId: string) => {
    // Encontrar a nova sala e selecioná-la
    const newRoom = rooms?.find(room => room.id === roomId)
    if (newRoom) {
      setSelectedRoom(newRoom)
    }
  }

  const canEditMessage = (senderId: string) => {
    return profile?.role === 'admin' || senderId === profile?.id
  }

  const getRoomDisplayName = (room: ChatRoom) => {
    // Para conversas privadas (2 participantes), mostrar nome do outro usuário
    if (!room.unit_id && room.participants && room.participants.length === 2) {
      const otherParticipant = room.participants.find(p => p.user_id !== profile?.id)
      if (otherParticipant) {
        return `${otherParticipant.profiles.name}`
      }
    }
    return room.name
  }

  const getRoomTypeIcon = (room: ChatRoom) => {
    if (room.unit_id) {
      return <Building2 className="h-4 w-4" />
    }
    return <MessageCircle className="h-4 w-4" />
  }

  const getRoomTypeColor = (room: ChatRoom) => {
    if (room.unit_id) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    }
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  }

  if (roomsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MessageCircle className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Carregando salas de chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex">
      {/* Lista de Salas */}
      <div className="w-80 border-r bg-muted/30">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Chat Interno
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowContactsSidebar(true)}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Nova Conversa
            </Button>
          </div>
          
          {/* Barra de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar salas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2">
            {filteredRooms.map((room) => (
              <Card
                key={room.id}
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  selectedRoom?.id === room.id ? 'bg-accent border-primary' : ''
                }`}
                onClick={() => setSelectedRoom(room)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getRoomTypeIcon(room)}
                        <h3 className="font-medium text-sm">{getRoomDisplayName(room)}</h3>
                      </div>
                      
                      {room.unit_id && room.units?.name && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {room.units.name}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getRoomTypeColor(room)}`}
                        >
                          <Users className="h-3 w-3 mr-1" />
                          {room.participants?.length || 0}
                        </Badge>
                        
                        {room.created_by === profile?.id && (
                          <Badge variant="outline" className="text-xs">
                            Criador
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredRooms.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{searchTerm ? 'Nenhuma sala encontrada' : 'Nenhuma sala de chat disponível'}</p>
                <p className="text-sm">Clique em "Nova Conversa" para começar</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Área do Chat */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Header do Chat */}
            <div className="p-4 border-b bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {getRoomTypeIcon(selectedRoom)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-lg font-semibold">{getRoomDisplayName(selectedRoom)}</h2>
                    {selectedRoom.units?.name && (
                      <p className="text-sm text-muted-foreground">
                        {selectedRoom.units.name}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {selectedRoom.participants?.length || 0} participantes
                  </Badge>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messagesLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Carregando mensagens...</p>
                  </div>
                ) : messages?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Seja o primeiro a enviar uma mensagem!</p>
                  </div>
                ) : (
                  messages?.filter(msg => !msg.is_deleted || msg.sender_id === profile?.id || profile?.role === 'admin').map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 group ${
                        msg.sender_id === profile?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {msg.sender_id !== profile?.id && (
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={msg.profiles?.avatar_url || undefined} />
                          <AvatarFallback>
                            {msg.profiles?.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className="max-w-xs lg:max-w-md">
                        <div
                          className={`px-4 py-3 rounded-lg ${
                            msg.sender_id === profile?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          } ${msg.is_deleted ? 'opacity-60 italic' : ''}`}
                        >
                          {msg.sender_id !== profile?.id && (
                            <p className="text-xs font-medium mb-1 opacity-80">
                              {msg.profiles?.name}
                            </p>
                          )}
                          
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm break-words">{msg.content}</p>
                              {msg.edited_at && !msg.is_deleted && (
                                <p className="text-xs opacity-70 mt-1">(editado)</p>
                              )}
                            </div>
                            
                            {canEditMessage(msg.sender_id) && !msg.is_deleted && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 ml-2 opacity-0 group-hover:opacity-100"
                                  >
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => setEditingMessage({ id: msg.id, content: msg.content })}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                          
                          <ChatMessageAttachment message={msg} />
                        </div>
                        
                        <p className={`text-xs mt-1 ${
                          msg.sender_id === profile?.id
                            ? 'text-right'
                            : 'text-left'
                        } text-muted-foreground`}>
                          {format(new Date(msg.created_at), 'HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                      
                      {msg.sender_id === profile?.id && (
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback>
                            {profile?.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Área de Upload de Anexos */}
            {showAttachmentUpload && (
              <div className="p-4 border-t bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Anexar arquivo</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAttachmentUpload(false)
                      setSelectedFile(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <ChatAttachmentUpload
                  onFileSelect={setSelectedFile}
                  selectedFile={selectedFile}
                />
              </div>
            )}

            {/* Input de Mensagem */}
            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowAttachmentUpload(!showAttachmentUpload)}
                  className={showAttachmentUpload ? 'bg-primary text-primary-foreground' : ''}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  disabled={sendMessage.isPending}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  disabled={(!message.trim() && !selectedFile) || sendMessage.isPending}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">Selecione uma sala de chat</h3>
              <p className="text-muted-foreground mb-4">
                Escolha uma sala na lateral para começar a conversar
              </p>
              <Button onClick={() => setShowContactsSidebar(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Iniciar Nova Conversa
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar de Contatos */}
      <ChatContactsSidebar
        open={showContactsSidebar}
        onOpenChange={setShowContactsSidebar}
        onDirectChat={handleRoomCreated}
      />

      {/* Dialog para Editar Mensagem */}
      <Dialog open={!!editingMessage} onOpenChange={() => setEditingMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Mensagem</DialogTitle>
            <DialogDescription>
              Faça as alterações necessárias na mensagem
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editingMessage?.content || ''}
              onChange={(e) => setEditingMessage(prev => 
                prev ? { ...prev, content: e.target.value } : null
              )}
              placeholder="Digite sua mensagem..."
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingMessage(null)}>
                Cancelar
              </Button>
              <Button onClick={handleEditMessage} disabled={editMessage.isPending}>
                {editMessage.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
