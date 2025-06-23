
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageCircle, Send, Trash2 } from 'lucide-react'
import { usePostComments, useCreateComment } from '@/hooks/usePostInteractions'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PostCommentsProps {
  postId: string
}

export function PostComments({ postId }: PostCommentsProps) {
  const [newComment, setNewComment] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  
  const { profile } = useAuth()
  const { data: comments = [], isLoading } = usePostComments(postId)
  const createComment = useCreateComment()

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      await createComment.mutateAsync({
        postId,
        content: newComment.trim()
      })
      setNewComment('')
    } catch (error) {
      console.error('Error creating comment:', error)
    }
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Carregando comentários...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <MessageCircle className="h-4 w-4" />
          {comments.length} comentário{comments.length !== 1 ? 's' : ''}
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Lista de comentários */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                  <AvatarFallback>
                    {comment.profiles?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {comment.profiles?.name || 'Usuário'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Formulário para novo comentário */}
          <form onSubmit={handleSubmitComment} className="space-y-3">
            <Textarea
              placeholder="Escreva um comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={!newComment.trim() || createComment.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                {createComment.isPending ? 'Enviando...' : 'Comentar'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
