
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send, X } from 'lucide-react'
import { useCreateChatRoom, useSendMessage } from '@/hooks/useChat'
import { useProfiles } from '@/hooks/useProfiles'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

interface DirectChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetUserId: string | null
  onRoomCreated?: (roomId: string) => void
}

export function DirectChatDialog({ open, onOpenChange, targetUserId, onRoomCreated }: DirectChatDialogProps) {
  const { profile } = useAuth()
  const { data: profiles } = useProfiles()
  const createChatRoom = useCreateChatRoom()
  const sendMessage = useSendMessage()
  const { toast } = useToast()
  const [message, setMessage] = useState('')

  const targetUser = profiles?.find(p => p.id === targetUserId)

  const handleStartChat = async () => {
    if (!targetUserId || !targetUser || !message.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite uma mensagem para iniciar a conversa',
        variant: 'destructive'
      })
      return
    }

    try {
      // Criar sala de chat privada
      const room = await createChatRoom.mutateAsync({
        name: `Chat: ${profile?.name} & ${targetUser.name}`,
        participants: [targetUserId]
      })

      // Enviar primeira mensagem
      await sendMessage.mutateAsync({
        roomId: room.id,
        content: message
      })

      setMessage('')
      onOpenChange(false)
      onRoomCreated?.(room.id)

      toast({
        title: 'Conversa iniciada!',
        description: `Conversa privada com ${targetUser.name} foi criada.`
      })
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error)
    }
  }

  if (!targetUser) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={targetUser.avatar_url || undefined} />
              <AvatarFallback>
                {targetUser.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            Conversar com {targetUser.name}
          </DialogTitle>
          <DialogDescription>
            Inicie uma conversa privada enviando uma mensagem
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarImage src={targetUser.avatar_url || undefined} />
              <AvatarFallback>
                {targetUser.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{targetUser.name}</p>
              <p className="text-sm text-muted-foreground">{targetUser.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Primeira mensagem</label>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              onKeyPress={(e) => e.key === 'Enter' && handleStartChat()}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleStartChat}
              disabled={!message.trim() || createChatRoom.isPending || sendMessage.isPending}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {createChatRoom.isPending || sendMessage.isPending ? 'Enviando...' : 'Iniciar Conversa'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
