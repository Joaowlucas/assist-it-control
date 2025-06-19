
import React, { useState } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, User, Settings, Shield, MessageCircle } from 'lucide-react'
import { useAvailableChatUsers, useCreateChatRoom } from '@/hooks/useChat'
import { useAuth } from '@/hooks/useAuth'

interface ChatContactsSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDirectChat?: (roomId: string) => void
}

export function ChatContactsSidebar({ open, onOpenChange, onDirectChat }: ChatContactsSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const { profile } = useAuth()
  const { data: availableUsers = [], isLoading } = useAvailableChatUsers()
  const createChatRoom = useCreateChatRoom()

  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
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
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'technician':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    }
  }

  const handleStartChat = async (userId: string, userName: string) => {
    try {
      const roomId = await createChatRoom.mutateAsync({
        name: `Chat: ${profile?.name} - ${userName}`,
        participantIds: [userId],
      })
      
      onOpenChange(false)
      setSearchTerm('')
      onDirectChat?.(roomId)
    } catch (error) {
      console.error('Error starting chat:', error)
    }
  }

  if (isLoading) {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Iniciar Nova Conversa
          </SheetTitle>
          <SheetDescription>
            Selecione um usuário para iniciar uma conversa direta
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-4 mt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-[calc(100vh-200px)] overflow-y-auto space-y-2">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário disponível'}
                </p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>
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
                    {user.units?.name && (
                      <p className="text-sm text-muted-foreground truncate">
                        {user.units.name}
                      </p>
                    )}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleStartChat(user.id, user.name)}
                    disabled={createChatRoom.isPending}
                    className="shrink-0"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Chat
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
