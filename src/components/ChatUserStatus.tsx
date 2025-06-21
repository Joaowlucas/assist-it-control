
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Circle } from 'lucide-react'

interface ChatUserStatusProps {
  isOnline?: boolean
  lastSeen?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ChatUserStatus({ isOnline = false, lastSeen, size = 'md' }: ChatUserStatusProps) {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3', 
    lg: 'h-4 w-4'
  }

  if (isOnline) {
    return (
      <div className="flex items-center gap-1">
        <Circle className={`${sizeClasses[size]} fill-green-500 text-green-500`} />
        <span className="text-xs text-muted-foreground">Online</span>
      </div>
    )
  }

  if (lastSeen) {
    return (
      <div className="flex items-center gap-1">
        <Circle className={`${sizeClasses[size]} fill-gray-400 text-gray-400`} />
        <span className="text-xs text-muted-foreground">
          Visto por último {lastSeen}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Circle className={`${sizeClasses[size]} fill-gray-400 text-gray-400`} />
      <span className="text-xs text-muted-foreground">Offline</span>
    </div>
  )
}
