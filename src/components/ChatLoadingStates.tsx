
import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageCircle, Users, Loader2 } from 'lucide-react'

export function ChatRoomsSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ChatMessagesSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={`flex gap-3 ${i % 3 === 0 ? 'flex-row-reverse' : ''}`}>
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="space-y-2 max-w-xs">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className={`h-16 ${i % 2 === 0 ? 'w-48' : 'w-32'} rounded-lg`} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ChatUsersSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-16 rounded" />
        </div>
      ))}
    </div>
  )
}

interface LoadingOverlayProps {
  message?: string
  show: boolean
}

export function LoadingOverlay({ message = "Carregando...", show }: LoadingOverlayProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card p-6 rounded-lg shadow-lg border flex flex-col items-center gap-4 min-w-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-center">{message}</p>
      </div>
    </div>
  )
}

interface ChatActionLoadingProps {
  action: string
  show: boolean
}

export function ChatActionLoading({ action, show }: ChatActionLoadingProps) {
  if (!show) return null

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-muted/30 rounded">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{action}...</span>
    </div>
  )
}

export function EmptyChatState({ 
  icon: Icon = MessageCircle, 
  title, 
  description, 
  action 
}: {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md p-8">
        <Icon className="h-16 w-16 mx-auto text-muted-foreground/50" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
        {action && (
          <div className="pt-4">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}
