
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Search, User, Settings, Shield, Plus, Building2 } from 'lucide-react'
import { useAvailableChatUsers } from '@/hooks/useAvailableChatUsers'
import { useCreateChatRoom } from '@/hooks/useChat'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

interface StartChatDialogProps {
  onChatCreated?: (roomId: string) => void
}

export function StartChatDialog({ onChatCreated }: StartChatDialogProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const { profile } = useAuth()
  const { data: availableUsers = [], isLoading } = useAvailableChatUsers()
  const createChatRoom = useCreateChatRoom()
  const { toast } = useToast()

  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.unit_name && user.unit_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

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

  const handleStartChat = async (userId: string, userName: string) => {
    if (!profile?.id) return

    try {
      console.log('Starting direct chat with user:', userId, userName)
      
      // Criar nome da conversa no formato: "Seu Nome • Nome do Destinatário"
      const roomName = `${profile.name} • ${userName}`
      
      const roomId = await createChatRoom.mutateAsync({
        name: roomName,
        type: 'private',
        participantIds: [userId],
      })
      
      toast({
        title: "Sucesso",
        description: `Conversa iniciada com ${userName}`,
      })
      
      setOpen(false)
      setSearchTerm('')
      onChatCreated?.(roomId)
    } catch (error) {
      console.error('Error starting chat:', error)
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a conversa. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <MessageCircle className="h-4 w-4 mr-2" />
        Carregando...
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Conversa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Iniciar Nova Conversa
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col space-y-4 min-h-0">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">
                  {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário disponível'}
                </p>
                <div className="text-sm space-y-1">
                  {profile?.role === 'admin' && (
                    <p>Como admin, você pode conversar com qualquer usuário.</p>
                  )}
                  {profile?.role === 'technician' && (
                    <p>Você pode conversar com admins e usuários das unidades que atende.</p>
                  )}
                  {profile?.role === 'user' && (
                    <p>Você pode conversar com admins, técnicos e usuários da sua unidade.</p>
                  )}
                </div>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleStartChat(user.id, user.name)}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="bg-muted">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{user.name}</p>
                      <Badge className={`${getRoleColor(user.role)} text-xs flex items-center gap-1`}>
                        {getRoleIcon(user.role)}
                        <span>{getRoleLabel(user.role)}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      {user.unit_name && (
                        <>
                          <Building2 className="h-3 w-3" />
                          <span className="truncate">{user.unit_name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <MessageCircle className="h-5 w-5 text-muted-foreground" />
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
