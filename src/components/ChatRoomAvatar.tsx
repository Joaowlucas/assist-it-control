
import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageCircle, Building2 } from 'lucide-react'
import { ChatRoom } from '@/hooks/useChat'
import { useAuth } from '@/hooks/useAuth'

interface ChatRoomAvatarProps {
  room: ChatRoom
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ChatRoomAvatar({ room, size = 'md', className = '' }: ChatRoomAvatarProps) {
  const { profile } = useAuth()
  
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  }

  // Para conversas privadas (2 participantes), mostrar avatares duplos
  const isPrivateChat = !room.unit_id && room.participants && room.participants.length === 2
  
  if (isPrivateChat) {
    const otherParticipant = room.participants?.find(p => p.user_id !== profile?.id)
    const currentUser = room.participants?.find(p => p.user_id === profile?.id)
    
    return (
      <div className={`relative ${sizeClasses[size]} ${className}`}>
        {/* Avatar do usuário atual (menor, no fundo) */}
        <Avatar className={`absolute -top-1 -left-1 ${size === 'sm' ? 'h-5 w-5' : size === 'md' ? 'h-6 w-6' : 'h-7 w-7'} border-2 border-background`}>
          <AvatarImage src={currentUser?.profiles?.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {currentUser?.profiles?.name?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        {/* Avatar do outro participante (maior, na frente) */}
        <Avatar className={`absolute -bottom-1 -right-1 ${size === 'sm' ? 'h-5 w-5' : size === 'md' ? 'h-6 w-6' : 'h-7 w-7'} border-2 border-background`}>
          <AvatarImage src={otherParticipant?.profiles?.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {otherParticipant?.profiles?.name?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      </div>
    )
  }

  // Para salas com imagem personalizada
  if (room.image_url) {
    return (
      <Avatar className={`${sizeClasses[size]} ${className}`}>
        <AvatarImage src={room.image_url} />
        <AvatarFallback>
          {room.unit_id ? <Building2 className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        </AvatarFallback>
      </Avatar>
    )
  }

  // Avatar padrão baseado no tipo da sala
  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarFallback>
        {room.unit_id ? <Building2 className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </AvatarFallback>
    </Avatar>
  )
}
