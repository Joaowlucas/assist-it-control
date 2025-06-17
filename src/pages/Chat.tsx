
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Send, MessageCircle, Users } from 'lucide-react'
import { useChatRooms, useChatMessages, useSendMessage, ChatRoom } from '@/hooks/useChat'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Chat() {
  const { profile } = useAuth()
  const { data: rooms, isLoading: roomsLoading } = useChatRooms()
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [message, setMessage] = useState('')
  
  const { data: messages, isLoading: messagesLoading } = useChatMessages(selectedRoom?.id || '')
  const sendMessage = useSendMessage()

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !selectedRoom) return

    await sendMessage.mutateAsync({
      roomId: selectedRoom.id,
      content: message.trim(),
    })
    
    setMessage('')
  }

  const filteredRooms = rooms?.filter(room => {
    // Admin vê todas as salas
    if (profile?.role === 'admin') return true
    
    // Técnico vê salas de suas unidades
    if (profile?.role === 'technician') {
      return room.unit_id === profile.unit_id || room.unit_id === null
    }
    
    // Usuário vê apenas salas de sua unidade
    return room.unit_id === profile?.unit_id
  })

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
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat Interno
          </h2>
        </div>
        
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2">
            {filteredRooms?.map((room) => (
              <Card
                key={room.id}
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  selectedRoom?.id === room.id ? 'bg-accent' : ''
                }`}
                onClick={() => setSelectedRoom(room)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{room.name}</h3>
                      {room.units?.name && (
                        <p className="text-sm text-muted-foreground">
                          {room.units.name}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">
                      <Users className="h-3 w-3 mr-1" />
                      Chat
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {(!filteredRooms || filteredRooms.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma sala de chat disponível</p>
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
                <div>
                  <h2 className="text-lg font-semibold">{selectedRoom.name}</h2>
                  {selectedRoom.units?.name && (
                    <p className="text-sm text-muted-foreground">
                      {selectedRoom.units.name}
                    </p>
                  )}
                </div>
                <Badge variant="outline">
                  <Users className="h-3 w-3 mr-1" />
                  Chat Ativo
                </Badge>
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
                  messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${
                        msg.sender_id === profile?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {msg.sender_id !== profile?.id && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={msg.profiles?.avatar_url || undefined} />
                          <AvatarFallback>
                            {msg.profiles?.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div
                        className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                          msg.sender_id === profile?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {msg.sender_id !== profile?.id && (
                          <p className="text-xs font-medium mb-1">
                            {msg.profiles?.name}
                          </p>
                        )}
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender_id === profile?.id
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        }`}>
                          {format(new Date(msg.created_at), 'HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                      
                      {msg.sender_id === profile?.id && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback>
                            {profile?.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Input de Mensagem */}
            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  disabled={sendMessage.isPending}
                />
                <Button 
                  type="submit" 
                  disabled={!message.trim() || sendMessage.isPending}
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
              <p className="text-muted-foreground">
                Escolha uma sala na lateral para começar a conversar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
