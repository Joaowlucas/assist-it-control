
import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { PostComments } from '@/components/PostComments'
import { ImageModal } from '@/components/ImageModal'
import { AnnouncementFormWithUnits, AnnouncementFormData } from '@/components/AnnouncementFormWithUnits'
import { AnnouncementApproval } from '@/components/AnnouncementApproval'
import { AnnouncementActions } from '@/components/AnnouncementActions'
import { LikeButton } from '@/components/LikeButton'
import { useAnnouncementsWithUnits, useCreateAnnouncementWithUnits } from '@/hooks/useAnnouncementsWithUnits'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Announcements() {
  const { data: posts = [], refetch } = useAnnouncementsWithUnits()
  const { profile } = useAuth()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)
  const createAnnouncement = useCreateAnnouncementWithUnits()

  const canCreateAnnouncement = profile?.role === 'admin' || profile?.role === 'technician' || profile?.role === 'user'
  const canApprove = profile?.role === 'admin' || profile?.role === 'technician'

  const handleVote = async (postId: string, option: string) => {
    if (!profile) return

    try {
      const post = posts.find(p => p.id === postId)
      if (!post) return

      const currentVotes = post.poll_votes || {}
      const currentOptions = post.poll_options || []
      
      // Remove user from all options first
      const updatedVotes: Record<string, string[]> = {}
      currentOptions.forEach(opt => {
        updatedVotes[opt] = (currentVotes[opt] || []).filter(userId => userId !== profile.id)
      })
      
      // Add user to selected option
      if (!updatedVotes[option]) {
        updatedVotes[option] = []
      }
      updatedVotes[option].push(profile.id)

      const { error } = await supabase
        .from('landing_page_posts')
        .update({ 
          poll_votes: updatedVotes
        })
        .eq('id', postId)

      if (error) throw error

      await refetch()
      toast({
        title: "Voto registrado!",
        description: "Seu voto foi registrado com sucesso.",
      })
    } catch (error) {
      console.error('Error voting:', error)
      toast({
        title: "Erro",
        description: "Não foi possível registrar seu voto.",
        variant: "destructive",
      })
    }
  }

  const handleAnnouncementSubmit = async (data: AnnouncementFormData) => {
    try {
      console.log('Submitting announcement:', data)
      await createAnnouncement.mutateAsync(data)
      setShowAnnouncementForm(false)
      await refetch() // Forçar atualização da lista
    } catch (error) {
      console.error('Error creating announcement:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Publicado
          </Badge>
        )
      case 'pending_approval':
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-300">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejeitado
          </Badge>
        )
      default:
        return null
    }
  }

  const publishedPosts = posts.filter(post => post.status === 'published')
  
  // Para "Meus Posts", precisamos buscar todos os posts do usuário, não apenas os da timeline
  const { data: myPostsData = [] } = useQuery({
    queryKey: ['my-announcements', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []
      
      const { data, error } = await supabase
        .from('landing_page_posts')
        .select(`
          *,
          profiles!landing_page_posts_author_id_fkey(name, avatar_url)
        `)
        .eq('author_id', profile.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as any[]
    },
    enabled: !!profile?.id,
  })
  
  const myPosts = myPostsData as any[]

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Comunicados</h1>
        {canCreateAnnouncement && (
          <Button onClick={() => setShowAnnouncementForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Comunicado
          </Button>
        )}
      </div>

      <Tabs defaultValue="published" className="space-y-6">
        <TabsList>
          <TabsTrigger value="published">Comunicados Publicados</TabsTrigger>
          {profile && (
            <TabsTrigger value="my-posts">Meus Comunicados</TabsTrigger>
          )}
          {canApprove && (
            <TabsTrigger value="approval">Aprovações</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="published" className="space-y-6">
          {publishedPosts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  Nenhum comunicado publicado ainda.
                </p>
              </CardContent>
            </Card>
          ) : (
            publishedPosts.map((post, index) => (
              <Card 
                key={post.id} 
                className="animate-fade-in hover:scale-[1.01] transition-all duration-300 card-modern"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="flex items-start space-x-4">
                    <Avatar>
                      <AvatarImage src={post.profiles?.avatar_url || undefined} />
                      <AvatarFallback>{post.profiles?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-left">{post.title}</CardTitle>
                        {post.is_featured && (
                          <Badge className="bg-yellow-500">Destaque</Badge>
                        )}
                      </div>
                      <CardDescription className="text-left">
                        <span>{post.profiles?.name}</span>
                        <span className="mx-1">•</span>
                        <span>
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </CardDescription>
                    </div>
                    <AnnouncementActions post={post} onUpdate={refetch} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 text-left">{post.content}</p>

                  {post.media_url && (
                    <div className="mt-4">
                      <img
                        src={post.media_url}
                        alt="Post image"
                        className="max-w-full h-auto rounded cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setSelectedImage(post.media_url!)}
                      />
                    </div>
                  )}

                  {post.poll_options && post.poll_options.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold mb-2 text-left">Enquete</h3>
                      <ul className="space-y-2">
                        {post.poll_options.map((option) => {
                          const voteCount = post.poll_votes?.[option]?.length || 0
                          const userHasVoted = post.poll_votes?.[option]?.includes(profile?.id || '') || false

                          return (
                            <li key={option} className="flex items-center justify-between">
                              <label className="flex-1 text-left">{option}</label>
                              <div>
                                <span className="mr-2">{voteCount} votos</span>
                                <Button 
                                  size="sm"
                                  variant={userHasVoted ? "secondary" : "outline"}
                                  onClick={() => handleVote(post.id, option)}
                                  disabled={userHasVoted}
                                >
                                  {userHasVoted ? 'Votado' : 'Votar'}
                                </Button>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-4 border-t">
                    <LikeButton postId={post.id} />
                  </div>

                  <PostComments postId={post.id} />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {profile && (
          <TabsContent value="my-posts" className="space-y-6">
            {myPosts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    Você ainda não criou nenhum comunicado.
                  </p>
                </CardContent>
              </Card>
            ) : (
              myPosts.map((post, index) => (
                <Card 
                  key={post.id}
                  className="animate-fade-in hover:scale-[1.01] transition-all duration-300 card-modern"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-left">{post.title}</CardTitle>
                        {getStatusBadge(post.status)}
                        {post.is_featured && (
                          <Badge className="bg-yellow-500">Destaque</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <CardDescription>
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                        </CardDescription>
                        <AnnouncementActions post={post} onUpdate={refetch} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 text-left">{post.content}</p>
                    
                    {post.status === 'rejected' && post.rejection_reason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-medium text-red-800">Motivo da rejeição:</p>
                        <p className="text-sm text-red-700">{post.rejection_reason}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 pt-4 border-t">
                      <LikeButton postId={post.id} />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        )}

        {canApprove && (
          <TabsContent value="approval">
            <AnnouncementApproval />
          </TabsContent>
        )}
      </Tabs>

      {selectedImage && (
        <ImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage}
          imageTitle="Post Image"
        />
      )}

      <AnnouncementFormWithUnits
        open={showAnnouncementForm}
        onOpenChange={setShowAnnouncementForm}
        onSubmit={handleAnnouncementSubmit}
        loading={createAnnouncement.isPending}
      />
    </div>
  )
}
