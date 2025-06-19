
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, Building2, MessageCircle } from 'lucide-react'
import { ChatRoom } from '@/hooks/useChat'
import { cn } from '@/lib/utils'

interface ChatRoomAvatarProps {
  room: ChatRoom
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ChatRoomAvatar({ room, size = 'md', className }: ChatRoomAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const getAvatarContent = () => {
    // Se tem imagem personalizada, usar ela
    if (room.image_url) {
      return (
        <Avatar className={cn(sizeClasses[size], className)}>
          <AvatarImage src={room.image_url} alt={room.name} />
          <AvatarFallback>
            {room.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )
    }

    // Para conversas privadas (2 participantes), mostrar avatar do outro usuário
    if (room.type === 'private' && room.participants && room.participants.length === 2) {
      const otherParticipant = room.participants.find(p => p.user_id !== room.created_by)
      if (otherParticipant) {
        return (
          <Avatar className={cn(sizeClasses[size], className)}>
            <AvatarImage src={otherParticipant.profiles?.avatar_url || undefined} />
            <AvatarFallback>
              {otherParticipant.profiles?.name?.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
        )
      }
    }

    // Avatar baseado no tipo da sala
    const getTypeIcon = () => {
      switch (room.type) {
        case 'unit':
          return <Building2 className={iconSizes[size]} />
        case 'group':
          return <Users className={iconSizes[size]} />
        default:
          return <MessageCircle className={iconSizes[size]} />
      }
    }

    const getTypeColor = () => {
      switch (room.type) {
        case 'unit':
          return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
        case 'group':
          return 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300'
        default:
          return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
      }
    }

    return (
      <div className={cn(
        sizeClasses[size], 
        'rounded-full flex items-center justify-center',
        getTypeColor(),
        className
      )}>
        {getTypeIcon()}
      </div>
    )
  }

  return getAvatarContent()
}
