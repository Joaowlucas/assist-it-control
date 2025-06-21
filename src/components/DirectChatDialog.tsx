
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCreateChatRoom } from '@/hooks/useChat'
import { useAuth } from '@/hooks/useAuth'
import { useAvailableChatUsers } from '@/hooks/useAvailableChatUsers'
import { useExistingPrivateChat } from '@/hooks/useExistingChat'
import { MessageCircle, Search, Users, Shield, Settings, User } from 'lucide-react'

interface DirectChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetUserId?: string | null
  onRoomCreated?: (roomId: string) => void
}

export function DirectChatDialog({ 
  open, 
  onOpenChange, 
  targetUserId, 
  onRoomCreated 
}: DirectChatDialogProps) {
  const { profile } = useAuth()
  const { data: availableUsers = [], isLoading } = useAvailableChatUsers()
  const createRoom = useCreateChatRoom()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(targetUserId || null)
  const [isCreating, setIsCreating] = useState(false)

  const { data: existingChatId } = useExistingPrivateChat(
    profile?.id,
    selectedUserId || undefined
  )

  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedUser = availableUsers.find(u => u.id === selectedUserId)

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />
      case 'technician':
        return <Settings className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'technician':
        return 'Técnico'
      default:
        return 'Usuário'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'technician':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    }
  }

  const handleCreateOrOpenChat = async () => {
    if (!profile?.id || !selectedUserId || !selectedUser) return

    setIsCreating(true)

    try {
      // Se já existe uma conversa, usar ela
      if (existingChatId) {
        onRoomCreated?.(existingChatId)
        onOpenChange(false)
        return
      }

      // Criar nova conversa privada
      const roomName = `${profile.name} • ${selectedUser.name}`
      
      const roomId = await createRoom.mutateAsync({
        name: roomName,
        type: 'private',
        participantIds: [profile.id, selectedUserId]
      })

      onRoomCreated?.(roomId)
      onOpenChange(false)
      setSelectedUserId(null)
      setSearchTerm('')
    } catch (error) {
      console.error('Error creating/opening chat:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const resetDialog = () => {
    setSelectedUserId(null)
    setSearchTerm('')
  }

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        onOpenChange(newOpen)
        if (!newOpen) resetDialog()
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat Direto
          </DialogTitle>
          <DialogDescription>
            {selectedUser 
              ? `Iniciar conversa com ${selectedUser.name}`
              : 'Selecione um usuário para iniciar uma conversa privada'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedUser ? (
            <>
              {/* Busca de usuários */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Lista de usuários */}
              <ScrollArea className="max-h-60">
                <div className="space-y-2">
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
                      Carregando usuários...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum usuário encontrado</p>
                      {profile?.role === 'user' && (
                        <p className="text-sm mt-2">
                          Você pode conversar com administradores e técnicos da sua unidade
                        </p>
                      )}
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedUserId(user.id)}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{user.name}</p>
                            <Badge className={`${getRoleColor(user.role)} text-xs flex items-center gap-1`}>
                              {getRoleIcon(user.role)}
                              <span>{getRoleLabel(user.role)}</span>
                            </Badge>
                          </div>
                          {user.unit_name && (
                            <p className="text-sm text-muted-foreground truncate">
                              {user.unit_name}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </>
          ) : (
            <>
              {/* Usuário selecionado */}
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback>
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{selectedUser.name}</h3>
                    <Badge className={`${getRoleColor(selectedUser.role)} text-xs flex items-center gap-1`}>
                      {getRoleIcon(selectedUser.role)}
                      <span>{getRoleLabel(selectedUser.role)}</span>
                    </Badge>
                  </div>
                  {selectedUser.unit_name && (
                    <p className="text-sm text-muted-foreground">{selectedUser.unit_name}</p>
                  )}
                </div>
              </div>

              {/* Status da conversa */}
              {existingChatId && (
                <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Já existe uma conversa com este usuário. Você será direcionado para ela.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Botões de ação */}
          <div className="flex justify-end gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => selectedUser ? setSelectedUserId(null) : onOpenChange(false)}
              disabled={isCreating}
            >
              {selectedUser ? 'Voltar' : 'Cancelar'}
            </Button>
            {selectedUser && (
              <Button 
                onClick={handleCreateOrOpenChat}
                disabled={isCreating}
                className="flex items-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {existingChatId ? 'Abrindo...' : 'Iniciando...'}
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4" />
                    {existingChatId ? 'Abrir Conversa' : 'Iniciar Conversa'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
