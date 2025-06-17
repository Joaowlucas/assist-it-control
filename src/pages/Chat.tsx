
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useChatRooms, useChatMessages, useSendMessage } from '@/hooks/useChat'
import { useAuth } from '@/hooks/useAuth'
import { CreateChatRoomDialog } from '@/components/CreateChatRoomDialog'
import { MessageSquare, Send, Users, Plus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Chat() {
  const { profile } = useAuth()
  const { data: rooms, isLoading } = useChatRooms()
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const { messages } = useChatMessages(selectedRoom || '')
  const sendMessage = useSendMessage()

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return

    try {
      await sendMessage.mutateAsync({
        roomId: selectedRoom,
        content: newMessage.trim()
      })
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const selectedRoomData = rooms?.find(room => room.id === selectedRoom)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-8rem)]">
      <div className="flex gap-4 h-full">
        {/* Rooms Sidebar */}
        <Card className="w-80 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat
              </CardTitle>
              {(profile?.role === 'admin' || profile?.role === 'technician') && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-3">
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {rooms?.map((room) => (
                  <div
                    key={room.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedRoom === room.id 
                        ? 'bg-primary/10 border border-primary/20' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedRoom(room.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm">{room.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {room.chat_participants?.length || 0}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {room.unit?.name || 'Geral'}
                    </p>
                    {room.chat_messages?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(room.updated_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </p>
                    )}
                  </div>
                ))}
                {(!rooms || rooms.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Nenhuma sala de chat disponível</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col">
          {selectedRoom ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {selectedRoomData?.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedRoomData?.unit?.name || 'Geral'} • {' '}
                      <Users className="h-3 w-3 inline" /> {' '}
                      {selectedRoomData?.chat_participants?.length || 0} participantes
                    </p>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              
              {/* Messages */}
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.sender_id === profile?.id ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.sender?.avatar_url} />
                          <AvatarFallback>
                            {message.sender?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex-1 max-w-xs ${
                          message.sender_id === profile?.id ? 'text-right' : ''
                        }`}>
                          <div className={`rounded-lg p-3 ${
                            message.sender_id === profile?.id
                              ? 'bg-primary text-primary-foreground ml-auto'
                              : 'bg-muted'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{message.sender?.name}</span>
                            <span>•</span>
                            <span>
                              {formatDistanceToNow(new Date(message.created_at), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
              
              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage()
                      }
                    }}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!newMessage.trim() || sendMessage.isPending}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">Selecione uma sala de chat</h3>
                <p className="text-muted-foreground">
                  Escolha uma sala na lateral para começar a conversar
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      <CreateChatRoomDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
      />
    </div>
  )
}
