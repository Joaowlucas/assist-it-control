
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Heart, Eye, Calendar, User, Image as ImageIcon, BarChart3, MessageCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PollResults } from '@/components/PollResults'
import { useToggleLike, useVotePoll } from '@/hooks/usePostInteractions'
import { PostComments } from '@/components/PostComments'
import { ImageModal } from '@/components/ImageModal'
import { useToast } from '@/hooks/use-toast'

export default function Announcements() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null)
  
  const toggleLike = useToggleLike()
  const votePoll = useVotePoll()

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_page_posts')
        .select(`
          *,
          profiles!landing_page_posts_author_id_fkey(
            name,
            avatar_url
          )
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
  })

  const { data: likes = [] } = useQuery({
    queryKey: ['post-likes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_likes')
        .select('*')

      if (error) throw error
      return data || []
    },
  })

  const handleLike = async (postId: string) => {
    try {
      await toggleLike.mutateAsync(postId)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível curtir o post.",
        variant: "destructive",
      })
    }
  }

  const handleVote = async (postId: string, optionIndex: number) => {
    try {
      await votePoll.mutateAsync({ postId, optionIndex })
      toast({
        title: "Sucesso",
        description: "Voto registrado com sucesso!",
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível registrar o voto.",
        variant: "destructive",
      })
    }
  }

  const getPostLikes = (postId: string) => {
    return likes.filter(like => like.post_id === postId)
  }

  const hasUserLiked = (postId: string) => {
    return likes.some(like => like.post_id === postId && like.user_id === profile?.id)
  }

  const hasUserVoted = (post: any) => {
    if (!post.poll_votes || !profile?.id) return false
    return Object.values(post.poll_votes).some((voters: any) => 
      Array.isArray(voters) && voters.includes(profile.id)
    )
  }

  const openImageModal = (imageUrl: string, title: string) => {
    setSelectedImage({ url: imageUrl, title })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p>Carregando comunicados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Comunicados</h1>
        <p className="text-muted-foreground">
          Fique por dentro das últimas novidades e comunicações
        </p>
      </div>

      <div className="grid gap-6">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum comunicado ainda</h3>
              <p className="text-muted-foreground text-center">
                Os comunicados aparecerão aqui quando forem publicados.
              </p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.profiles?.avatar_url || undefined} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{post.profiles?.name || 'Sistema'}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(post.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                  <Badge variant={post.is_featured ? 'default' : 'secondary'}>
                    {post.is_featured ? 'Destaque' : 'Comunicado'}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{post.title}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{post.content}</p>
                </div>

                {/* Imagem */}
                {post.media_url && post.type === 'image' && (
                  <div className="space-y-2">
                    <div className="relative group cursor-pointer" onClick={() => openImageModal(post.media_url, post.title)}>
                      <img
                        src={post.media_url}
                        alt={post.title}
                        className="w-full max-h-96 object-cover rounded-lg transition-transform group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-white/90 text-black px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            Clique para ampliar
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enquete */}
                {post.type === 'poll' && post.poll_options && Array.isArray(post.poll_options) && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      <span className="font-medium">Enquete</span>
                    </div>
                    
                    {hasUserVoted(post) ? (
                      <PollResults 
                        options={post.poll_options} 
                        votes={post.poll_votes || {}} 
                      />
                    ) : (
                      <div className="space-y-2">
                        {post.poll_options.map((option: string, index: number) => (
                          <Button
                            key={index}
                            variant="outline"
                            className="w-full justify-start text-left h-auto py-3"
                            onClick={() => handleVote(post.id, index)}
                            disabled={votePoll.isPending}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Ações */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 ${
                        hasUserLiked(post.id) ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground'
                      }`}
                      disabled={toggleLike.isPending}
                    >
                      <Heart className={`h-4 w-4 ${hasUserLiked(post.id) ? 'fill-current' : ''}`} />
                      {getPostLikes(post.id).length}
                    </Button>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      {post.view_count || 0} visualizações
                    </div>
                  </div>
                </div>

                {/* Comentários */}
                <PostComments postId={post.id} />
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de imagem */}
      {selectedImage && (
        <ImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage.url}
          imageTitle={selectedImage.title}
        />
      )}
    </div>
  )
}
