import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useCreateChatRoom } from '@/hooks/useChat'
import { useAuth } from '@/hooks/useAuth'
import { useProfiles } from '@/hooks/useProfiles'
import { MessageCircle, Users } from 'lucide-react'

interface DirectChatDialogProps {
  isOpen: boolean
  onClose: (open: boolean) => void
  onChatCreated?: (room: any) => void
}

export function DirectChatDialog({ 
  isOpen, 
  onClose,
  onChatCreated 
}: DirectChatDialogProps) {
  const { profile } = useAuth()
  const { data: profiles = [] } = useProfiles()
  const createRoom = useCreateChatRoom()
  const [isCreating, setIsCreating] = useState(false)

  const targetUser = profiles.find(p => p.id === targetUserId)

  const handleCreateDirectChat = async () => {
    if (!profile?.id || !targetUserId || !targetUser) return

    setIsCreating(true)

    try {
      const roomName = `${profile.name} • ${targetUser.name}`
      
      const roomId = await createRoom.mutateAsync({
        name: roomName,
        type: 'private',
        unitId: null,
        participantIds: [profile.id, targetUserId]
      })

      const newRoom = { id: roomId, name: roomName }
      onChatCreated?.(newRoom)
      onClose(false)
    } catch (error) {
      console.error('Error creating direct chat:', error)
    } finally {
      setIsCreating(false)
    }
  }

  if (!targetUser) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
            <Avatar className="h-12 w-12">
              <AvatarImage src={targetUser.avatar_url || undefined} />
              <AvatarFallback>
                {targetUser.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-medium">{targetUser.name}</h3>
              <p className="text-sm text-muted-foreground">
                {targetUser.role === 'admin' ? 'Administrador' : 
                 targetUser.role === 'technician' ? 'Técnico' : 'Usuário'}
              </p>
              {targetUser.email && (
                <p className="text-xs text-muted-foreground">{targetUser.email}</p>
              )}
            </div>
          </div>

          {/* Informação sobre conversas privadas */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-blue-800 dark:text-blue-200 font-medium">
                  Conversa Privada
                </p>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  Esta será uma conversa apenas entre vocês dois. Se já existe uma conversa anterior, 
                  você será direcionado para ela.
                </p>
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => onClose(false)}
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
                  Iniciando...
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
