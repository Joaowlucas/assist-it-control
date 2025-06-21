
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useCreateChatRoom } from '@/hooks/useChat'
import { useAuth } from '@/hooks/useAuth'
import { useProfiles } from '@/hooks/useProfiles'
import { MessageCircle, Users, Shield, Settings, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface DirectChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetUserId: string | null
  onRoomCreated?: (roomId: string) => void
}

export function DirectChatDialog({ 
  open, 
  onOpenChange, 
  targetUserId, 
  onRoomCreated 
}: DirectChatDialogProps) {
  const { profile } = useAuth()
  const { data: profiles = [] } = useProfiles()
  const createRoom = useCreateChatRoom()
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  const targetUser = profiles.find(p => p.id === targetUserId)

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-red-500" />
      case 'technician':
        return <Settings className="h-4 w-4 text-blue-500" />
      default:
        return <User className="h-4 w-4 text-green-500" />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'technician':
        return 'Técnico'
      default:
        return 'Usuário'
    }
  }

  const handleCreateDirectChat = async () => {
    if (!profile?.id || !targetUserId || !targetUser) return

    setIsCreating(true)

    try {
      console.log('Creating direct chat with:', targetUser.name)
      
      // Criar nome no formato: "Seu Nome • Nome do Destinatário"
      const roomName = `${profile.name} • ${targetUser.name}`
      
      const roomId = await createRoom.mutateAsync({
        name: roomName,
        type: 'private',
        unitId: null,
        participantIds: [profile.id, targetUserId]
      })

      toast({
        title: 'Sucesso',
        description: `Conversa iniciada com ${targetUser.name}`,
      })

      onRoomCreated?.(roomId)
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating direct chat:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar a conversa. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  if (!targetUser) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Iniciar Conversa Privada
          </DialogTitle>
          <DialogDescription>
            Você está prestes a iniciar uma conversa privada com este usuário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do usuário */}
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <Avatar className="h-16 w-16">
              <AvatarImage src={targetUser.avatar_url || undefined} />
              <AvatarFallback className="text-lg">
                {targetUser.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{targetUser.name}</h3>
                {getRoleIcon(targetUser.role)}
              </div>
              <p className="text-sm text-muted-foreground">
                {getRoleLabel(targetUser.role)}
              </p>
              {targetUser.email && (
                <p className="text-xs text-muted-foreground break-all">
                  {targetUser.email}
                </p>
              )}
            </div>
          </div>

          {/* Informação sobre conversas privadas */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-blue-800 dark:text-blue-200 font-medium text-sm">
                  Conversa Privada
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">
                  Esta será uma conversa apenas entre vocês dois. Se já existe uma conversa anterior, 
                  você será direcionado para ela. Todas as mensagens serão privadas e visíveis apenas 
                  para os participantes.
                </p>
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateDirectChat}
              disabled={isCreating}
              className="flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Criando...
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4" />
                  Iniciar Conversa
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
