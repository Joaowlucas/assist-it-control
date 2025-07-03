import React from 'react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { usePostLikes, useToggleLike } from '@/hooks/usePostInteractions'
import { useAuth } from '@/hooks/useAuth'

interface LikeButtonProps {
  postId: string
  className?: string
}

export function LikeButton({ postId, className = '' }: LikeButtonProps) {
  const { profile } = useAuth()
  const { data: likes = [] } = usePostLikes(postId)
  const toggleLike = useToggleLike()
  
  const isLiked = likes.some(like => like.user_id === profile?.id)
  const likeCount = likes.length

  const handleToggleLike = async () => {
    if (!profile) return
    
    try {
      await toggleLike.mutateAsync(postId)
    } catch (error) {
      console.error('Erro ao curtir post:', error)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggleLike}
      disabled={!profile || toggleLike.isPending}
      className={`transition-all duration-200 hover:scale-105 active:scale-95 ${className} ${
        isLiked 
          ? 'text-red-500 hover:text-red-600' 
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <Heart 
        className={`h-4 w-4 mr-1 transition-all duration-200 ${
          isLiked ? 'fill-current animate-bounce-gentle' : ''
        }`} 
      />
      <span className="text-sm font-medium">{likeCount}</span>
    </Button>
  )
}