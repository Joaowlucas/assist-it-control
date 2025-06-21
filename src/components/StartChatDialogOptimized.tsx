
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Search, User, Settings, Shield, Plus, Building2, Loader2, CheckCircle } from 'lucide-react'
import { useAvailableChatUsersOptimized, useCreateChatRoomOptimized, findExistingPrivateChat } from '@/hooks/useChatOptimized'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { ChatUsersSkeleton, ChatActionLoading } from '@/components/ChatLoadingStates'

interface StartChatDialogOptimizedProps {
  onChatCreated?: (roomId: string) => void
}

export function StartChatDialogOptimized({ onChatCreated }: StartChatDialogOptimizedProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [creatingChat, setCreatingChat] = useState(false)
  
  const { profile } = useAuth()
  const { data: availableUsers = [], isLoading: loadingUsers } = useAvailableChatUsersOptimized()
  const createChatRoom = useCreateChatRoomOptimized()
  const { toast } = useToast()

  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.unit_name && user.unit_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

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
    if (!profile?.id || creatingChat) return

    setSelectedUserId(userId)
    setCreatingChat(true)

    try {
      console.log('🚀 Starting optimized chat creation with:', userId, userName)
      
      // Primeiro, verificar se já existe conversa
      const existingRoomId = await findExistingPrivateChat(profile.id, userId)
      
      if (existingRoomId) {
        console.log('✅ Found existing conversation, redirecting...')
        toast({
          title: "Conversa encontrada",
          description: `Redirecionando para conversa existente com ${userName}`,
          duration: 2000,
        })
        
        setOpen(false)
        setSearchTerm('')
        setSelectedUserId(null)
        onChatCreated?.(existingRoomId)
        return
      }

      // Criar nova conversa
      console.log('📝 Creating new conversation...')
      const roomName = `${profile.name} • ${userName}`
      
      const roomId = await createChatRoom.mutateAsync({
        name: roomName,
        type: 'private',
        participantIds: [userId],
      })
      
      console.log('✅ New conversation created:', roomId)
      
      toast({
        title: "Sucesso",
        description: `Nova conversa iniciada com ${userName}`,
        duration: 3000,
      })
      
      setOpen(false)
      setSearchTerm('')
      setSelectedUserId(null)
      onChatCreated?.(roomId)
      
    } catch (error) {
      console.error('❌ Error starting chat:', error)
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a conversa. Tente novamente.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setCreatingChat(false)
      setSelectedUserId(null)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (creatingChat) return // Bloquear fechamento durante criação
    setOpen(newOpen)
    if (!newOpen) {
      setSearchTerm('')
      setSelectedUserId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2"
          disabled={loadingUsers}
        >
          {loadingUsers ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
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
          {/* Barra de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              disabled={creatingChat}
            />
          </div>

          {/* Loading durante criação */}
          {creatingChat && (
            <ChatActionLoading 
              action="Iniciando conversa" 
              show={creatingChat} 
            />
          )}

          {/* Lista de usuários */}
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {loadingUsers ? (
              <ChatUsersSkeleton />
            ) : filteredUsers.length === 0 ? (
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
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                    selectedUserId === user.id 
                      ? 'bg-primary/10 border-primary/50' 
                      : 'hover:bg-muted/50 cursor-pointer'
                  } ${creatingChat && selectedUserId !== user.id ? 'opacity-50' : ''}`}
                  onClick={() => !creatingChat && handleStartChat(user.id, user.name)}
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

                  {selectedUserId === user.id && creatingChat ? (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  ) : selectedUserId === user.id ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
