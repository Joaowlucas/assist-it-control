
import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, Users, Search } from 'lucide-react'
import { useProfiles } from '@/hooks/useProfiles'
import { DirectChatDialog } from '@/components/DirectChatDialog'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'

interface ChatContactsSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDirectChat?: (roomId: string) => void
}

export function ChatContactsSidebar({ open, onOpenChange, onDirectChat }: ChatContactsSidebarProps) {
  const { profile } = useAuth()
  const { data: profiles = [] } = useProfiles()
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [directChatDialog, setDirectChatDialog] = useState<{
    open: boolean
    targetUserId: string | null
  }>({
    open: false,
    targetUserId: null
  })

  useEffect(() => {
    if (!open) return

    const channel = supabase.channel('online-users-sidebar')
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const userIds = Object.keys(state).map(key => {
          const presences = state[key] as Array<{ user_id?: string }>
          return presences[0]?.user_id
        }).filter(Boolean) as string[]
        setOnlineUsers(userIds)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const userIds = (newPresences as Array<{ user_id?: string }>)
          .map((presence) => presence.user_id)
          .filter(Boolean) as string[]
        setOnlineUsers(prev => [...new Set([...prev, ...userIds])])
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const userIds = (leftPresences as Array<{ user_id?: string }>)
          .map((presence) => presence.user_id)
          .filter(Boolean) as string[]
        setOnlineUsers(prev => prev.filter(id => !userIds.includes(id)))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [open])

  const handleStartDirectChat = (userId: string) => {
    setDirectChatDialog({
      open: true,
      targetUserId: userId
    })
  }

  const handleRoomCreated = (roomId: string) => {
    onDirectChat?.(roomId)
    onOpenChange(false) // Fechar a sidebar após criar a conversa
  }

  // Filtrar usuários (excluir o próprio usuário e aplicar busca)
  const filteredProfiles = profiles
    .filter(p => p.id !== profile?.id && p.status === 'ativo')
    .filter(p => searchTerm === '' || p.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const onlineProfiles = filteredProfiles.filter(profile => onlineUsers.includes(profile.id))
  const offlineProfiles = filteredProfiles.filter(profile => !onlineUsers.includes(profile.id))

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-80 sm:max-w-80">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Contatos
            </SheetTitle>
            <SheetDescription>
              Selecione um usuário para iniciar uma conversa privada
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contatos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Lista de Usuários */}
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-4">
                {/* Usuários Online */}
                {onlineProfiles.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-green-600 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Online ({onlineProfiles.length})
                    </h4>
                    <div className="space-y-2">
                      {onlineProfiles.map((user) => (
                        <div 
                          key={user.id} 
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                          onClick={() => handleStartDirectChat(user.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback>
                                  {user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{user.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {user.role === 'admin' ? 'Administrador' : 
                                 user.role === 'technician' ? 'Técnico' : 'Usuário'}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Usuários Offline */}
                {offlineProfiles.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full" />
                      Offline ({offlineProfiles.length})
                    </h4>
                    <div className="space-y-2">
                      {offlineProfiles.map((user) => (
                        <div 
                          key={user.id} 
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                          onClick={() => handleStartDirectChat(user.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10 opacity-60">
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback>
                                  {user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-400 border-2 border-background rounded-full" />
                            </div>
                            <div>
                              <p className="text-sm font-medium opacity-60">{user.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {user.role === 'admin' ? 'Administrador' : 
                                 user.role === 'technician' ? 'Técnico' : 'Usuário'}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nenhum usuário encontrado */}
                {filteredProfiles.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum contato encontrado</p>
                    {searchTerm && (
                      <p className="text-sm mt-2">
                        Tente ajustar sua busca por "{searchTerm}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      <DirectChatDialog
        open={directChatDialog.open}
        onOpenChange={(open) => setDirectChatDialog(prev => ({ ...prev, open }))}
        targetUserId={directChatDialog.targetUserId}
        onRoomCreated={handleRoomCreated}
      />
    </>
  )
}
