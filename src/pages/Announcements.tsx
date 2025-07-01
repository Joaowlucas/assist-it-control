
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/hooks/use-toast'
import { PostComments } from '@/components/PostComments'
import { ImageModal } from '@/components/ImageModal'
import { AnnouncementForm, AnnouncementFormData } from '@/components/AnnouncementForm'
import { Plus } from 'lucide-react'

interface PostProfile {
  name: string
  avatar_url?: string
}

interface Post {
  id: string
  title: string
  content: string
  created_at: string
  author_id: string
  poll_options?: string[]
  poll_votes?: Record<string, string[]>
  media_url?: string
  profiles: PostProfile
}

async function getLandingPagePosts() {
  const { data, error } = await supabase
    .from('landing_page_posts')
    .select(`
      *,
      profiles(name, avatar_url)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching landing page posts:", error)
    throw error
  }

  return data as Post[]
}

export default function Announcements() {
  const { data: posts = [], refetch } = useQuery({
    queryKey: ['landingPagePosts'],
    queryFn: getLandingPagePosts,
  })
  const { profile } = useAuth()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const canCreateAnnouncement = profile?.role === 'admin' || profile?.role === 'technician'

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
    if (!profile) return

    setIsCreating(true)
    try {
      const { error } = await supabase
        .from('landing_page_posts')
        .insert({
          title: data.title,
          content: data.content,
          type: data.type,
          is_featured: data.is_featured,
          media_url: data.media_url,
          poll_options: data.poll_options,
          author_id: profile.id,
        })

      if (error) throw error

      setShowAnnouncementForm(false)
      await refetch()
      toast({
        title: "Comunicado criado!",
        description: "O comunicado foi publicado com sucesso.",
      })
    } catch (error) {
      console.error('Error creating announcement:', error)
      toast({
        title: "Erro",
        description: "Não foi possível criar o comunicado.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

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

      <div className="space-y-6">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex items-start space-x-4">
                <Avatar>
                  <AvatarImage src={post.profiles?.avatar_url || undefined} />
                  <AvatarFallback>{post.profiles?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-left">{post.title}</CardTitle>
                  <CardDescription className="text-left">
                    <span>{post.profiles?.name}</span>
                    <span className="mx-1">•</span>
                    <span>
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </CardDescription>
                </div>
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

              <PostComments postId={post.id} />
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedImage && (
        <ImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage}
          imageTitle="Post Image"
        />
      )}

      <AnnouncementForm
        open={showAnnouncementForm}
        onOpenChange={setShowAnnouncementForm}
        onSubmit={handleAnnouncementSubmit}
        loading={isCreating}
      />
    </div>
  )
}
