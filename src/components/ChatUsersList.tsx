
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, Users } from 'lucide-react'
import { useProfiles } from '@/hooks/useProfiles'
import { DirectChatDialog } from '@/components/DirectChatDialog'
import { supabase } from '@/integrations/supabase/client'

interface ChatUsersListProps {
  onDirectChat?: (roomId: string) => void
}

export function ChatUsersList({ onDirectChat }: ChatUsersListProps) {
  const { data: profiles = [] } = useProfiles()
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [directChatDialog, setDirectChatDialog] = useState<{
    open: boolean
    targetUserId: string | null
  }>({
    open: false,
    targetUserId: null
  })

  useEffect(() => {
    const channel = supabase.channel('online-users')
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const userIds = Object.keys(state).map(key => {
          const presences = state[key] as Array<{ user_id: string }>
          return presences[0]?.user_id
        }).filter(Boolean)
        setOnlineUsers(userIds)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const userIds = newPresences.map((presence: any) => presence.user_id).filter(Boolean)
        setOnlineUsers(prev => [...new Set([...prev, ...userIds])])
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const userIds = leftPresences.map((presence: any) => presence.user_id).filter(Boolean)
        setOnlineUsers(prev => prev.filter(id => !userIds.includes(id)))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleStartDirectChat = (userId: string) => {
    setDirectChatDialog({
      open: true,
      targetUserId: userId
    })
  }

  const handleRoomCreated = (roomId: string) => {
    onDirectChat?.(roomId)
  }

  const onlineProfiles = profiles.filter(profile => 
    onlineUsers.includes(profile.id) && profile.status === 'ativo'
  )

  const offlineProfiles = profiles.filter(profile => 
    !onlineUsers.includes(profile.id) && profile.status === 'ativo'
  )

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuários
          </CardTitle>
          <CardDescription>
            {onlineProfiles.length} usuários online
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-4">
              {onlineProfiles.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Online ({onlineProfiles.length})
                  </h4>
                  <div className="space-y-2">
                    {onlineProfiles.map((profile) => (
                      <div key={profile.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={profile.avatar_url || undefined} />
                              <AvatarFallback>
                                {profile.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{profile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {profile.role === 'admin' ? 'Administrador' : 
                               profile.role === 'technician' ? 'Técnico' : 'Usuário'}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartDirectChat(profile.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {offlineProfiles.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    Offline ({offlineProfiles.length})
                  </h4>
                  <div className="space-y-2">
                    {offlineProfiles.map((profile) => (
                      <div key={profile.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 group">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-8 w-8 opacity-60">
                              <AvatarImage src={profile.avatar_url || undefined} />
                              <AvatarFallback>
                                {profile.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-400 border-2 border-background rounded-full" />
                          </div>
                          <div>
                            <p className="text-sm font-medium opacity-60">{profile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {profile.role === 'admin' ? 'Administrador' : 
                               profile.role === 'technician' ? 'Técnico' : 'Usuário'}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartDirectChat(profile.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profiles.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum usuário encontrado</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <DirectChatDialog
        open={directChatDialog.open}
        onOpenChange={(open) => setDirectChatDialog(prev => ({ ...prev, open }))}
        targetUserId={directChatDialog.targetUserId}
        onRoomCreated={handleRoomCreated}
      />
    </>
  )
}
