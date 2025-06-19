
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, MessageCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ChatRoom } from '@/hooks/useChat'

interface ChatRoomAvatarProps {
  room: ChatRoom
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ChatRoomAvatar({ room, size = 'md', className }: ChatRoomAvatarProps) {
  const { profile } = useAuth()

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  // Se a sala tem uma imagem personalizada, use ela
  if (room.image_url) {
    return (
      <Avatar className={`${sizeClasses[size]} ${className}`}>
        <AvatarImage src={room.image_url} />
        <AvatarFallback className="bg-primary/10">
          <MessageCircle className={iconSizes[size]} />
        </AvatarFallback>
      </Avatar>
    )
  }

  // Para conversas privadas (sem unit_id e com 2 participantes)
  if (!room.unit_id && room.participants && room.participants.length <= 2) {
    // Encontrar o outro participante (não o usuário atual)
    const otherParticipant = room.participants.find(p => p.user_id !== profile?.id)
    
    if (otherParticipant) {
      return (
        <Avatar className={`${sizeClasses[size]} ${className}`}>
          <AvatarImage src={otherParticipant.profiles.avatar_url || undefined} />
          <AvatarFallback className="bg-muted">
            {otherParticipant.profiles.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )
    }
    
    // Se não encontrou o outro participante, usar avatar do criador
    if (room.profiles) {
      return (
        <Avatar className={`${sizeClasses[size]} ${className}`}>
          <AvatarImage src={room.profiles.avatar_url || undefined} />
          <AvatarFallback className="bg-muted">
            {room.profiles.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )
    }
  }

  // Para salas de grupo ou de unidade
  if (room.unit_id || (room.participants && room.participants.length > 2)) {
    return (
      <Avatar className={`${sizeClasses[size]} ${className}`}>
        <AvatarFallback className="bg-primary/10">
          <Users className={iconSizes[size]} />
        </AvatarFallback>
      </Avatar>
    )
  }

  // Fallback padrão
  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarFallback className="bg-primary/10">
        <MessageCircle className={iconSizes[size]} />
      </AvatarFallback>
    </Avatar>
  )
}
