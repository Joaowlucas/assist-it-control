
import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ChatRoom } from '@/hooks/useChat'
import { useAuth } from '@/hooks/useAuth'
import { MessageSquare, Settings, Users, Building2, Crown } from 'lucide-react'

interface ChatRoomHeaderProps {
  room: ChatRoom
  participantCount?: number
  onEditRoom?: () => void
}

export function ChatRoomHeader({ room, participantCount = 0, onEditRoom }: ChatRoomHeaderProps) {
  const { profile } = useAuth()
  
  const canEditRoom = profile?.role === 'admin' || room.created_by === profile?.id

  const getRoomIcon = () => {
    switch (room.type) {
      case 'private':
        return <MessageSquare className="h-4 w-4" />
      case 'unit':
        return <Building2 className="h-4 w-4" />
      case 'group':
        return <Users className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getRoomTypeLabel = () => {
    switch (room.type) {
      case 'private':
        return 'Conversa Privada'
      case 'unit':
        return 'Unidade'
      case 'group':
        return 'Grupo'
      default:
        return 'Chat'
    }
  }

  const getRoomTypeBadgeColor = () => {
    switch (room.type) {
      case 'private':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'unit':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'group':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={room.image_url || undefined} />
          <AvatarFallback className="bg-muted">
            {getRoomIcon()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-lg">{room.name}</h2>
            {room.created_by === profile?.id && (
              <Crown className="h-4 w-4 text-yellow-500" />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={getRoomTypeBadgeColor()}>
              {getRoomIcon()}
              <span className="ml-1">{getRoomTypeLabel()}</span>
            </Badge>
            
            {participantCount > 0 && (
              <span className="text-sm text-muted-foreground">
                {participantCount} participante{participantCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {canEditRoom && onEditRoom && (
          <Button variant="ghost" size="sm" onClick={onEditRoom}>
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
