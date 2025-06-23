
import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Heart, MessageCircle, BarChart3, Star, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Announcement } from '@/hooks/useAnnouncements'
import { usePostComments, usePostLikes, useCreateComment, useToggleLike, useVotePoll } from '@/hooks/usePostInteractions'
import { useAuth } from '@/hooks/useAuth'
import { PollResults } from './PollResults'

interface AnnouncementCardProps {
  announcement: Announcement
  onEdit?: (announcement: Announcement) => void
  onDelete?: (id: string) => void
}

export function AnnouncementCard({ announcement, onEdit, onDelete }: AnnouncementCardProps) {
  const { profile } = useAuth()
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  
  const { data: comments = [] } = usePostComments(announcement.id)
  const { data: likes = [] } = usePostLikes(announcement.id)
  const createComment = useCreateComment()
  const toggleLike = useToggleLike()
  const votePoll = useVotePoll()

  const isLiked = likes.some(like => like.user_id === profile?.id)
  const isAuthor = announcement.author_id === profile?.id
  const isAdmin = profile?.role === 'admin'
  const canEdit = isAuthor || isAdmin

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    
    try {
      await createComment.mutateAsync({
        postId: announcement.id,
        content: newComment.trim()
      })
      setNewComment('')
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error)
    }
  }

  const handleToggleLike = async () => {
    try {
      await toggleLike.mutateAsync(announcement.id)
    } catch (error) {
      console.error('Erro ao curtir:', error)
    }
  }

  const handleVote = async (optionIndex: number) => {
    try {
      await votePoll.mutateAsync({
        postId: announcement.id,
        optionIndex
      })
    } catch (error) {
      console.error('Erro ao votar:', error)
    }
  }

  const hasUserVoted = announcement.poll_votes && Object.values(announcement.poll_votes).some((voters: any) =>
    Array.isArray(voters) && voters.includes(profile?.id)
  )

  return (
    <Card className="w-full">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={announcement.profiles.avatar_url} />
              <AvatarFallback>
                {announcement.profiles.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{announcement.profiles.name}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(announcement.created_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {announcement.is_featured && (
              <Badge variant="default" className="bg-yellow-500">
                <Star className="h-3 w-3 mr-1" />
                Destaque
              </Badge>
            )}
            <Badge variant={announcement.type === 'text' ? 'secondary' : announcement.type === 'poll' ? 'default' : 'outline'}>
              {announcement.type === 'text' && 'Comunicado'}
              {announcement.type === 'poll' && 'Enquete'}
              {announcement.type === 'image' && 'Imagem'}
            </Badge>
            
            {canEdit && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit?.(announcement)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete?.(announcement.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <h3 className="text-xl font-bold">{announcement.title}</h3>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="whitespace-pre-wrap">{announcement.content}</div>
        
        {announcement.type === 'image' && announcement.media_url && (
          <div className="rounded-lg overflow-hidden">
            <img
              src={announcement.media_url}
              alt={announcement.title}
              className="w-full h-auto max-h-96 object-cover"
            />
          </div>
        )}

        {announcement.type === 'poll' && announcement.poll_options && (
          <div className="space-y-3">
            {!hasUserVoted ? (
              <div className="space-y-2">
                <p className="font-medium">Escolha uma opção:</p>
                {announcement.poll_options.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleVote(index)}
                    disabled={votePoll.isPending}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-medium">Resultados da enquete:</p>
                <PollResults
                  options={announcement.poll_options}
                  votes={announcement.poll_votes || {}}
                />
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleLike}
            className={isLiked ? 'text-red-500' : ''}
            disabled={toggleLike.isPending}
          >
            <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
            {likes.length}
          </Button>

          {announcement.type === 'image' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              {comments.length}
            </Button>
          )}

          {announcement.type === 'poll' && hasUserVoted && (
            <Button variant="ghost" size="sm">
              <BarChart3 className="h-4 w-4 mr-1" />
              {Object.values(announcement.poll_votes || {}).reduce((acc: number, voters: any) => 
                acc + (Array.isArray(voters) ? voters.length : 0), 0
              )} votos
            </Button>
          )}
        </div>

        {showComments && announcement.type === 'image' && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.profiles.avatar_url} />
                    <AvatarFallback>
                      {comment.profiles.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="font-semibold text-sm">{comment.profiles.name}</p>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <Textarea
                placeholder="Adicione um comentário..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 min-h-[80px]"
              />
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || createComment.isPending}
              >
                Enviar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
