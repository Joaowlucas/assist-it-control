
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {Separator } from "@/components/ui/separator"
import { useSystemSettings } from "@/hooks/useSystemSettings"
import { useLandingPagePosts } from "@/hooks/useLandingPagePosts"
import { Calendar, Clock, Users, TrendingUp, Image as ImageIcon, Video, BarChart3 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function LandingPage() {
  const navigate = useNavigate()
  const { data: systemSettings } = useSystemSettings()
  const { data: posts, isLoading } = useLandingPagePosts()

  const handleLogin = () => {
    navigate('/login')
  }

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />
      case 'video':
        return <Video className="h-4 w-4" />
      case 'poll':
        return <BarChart3 className="h-4 w-4" />
      default:
        return null
    }
  }

  const calculatePollResults = (pollVotes: any, pollOptions: any[]) => {
    if (!pollVotes || !pollOptions || !Array.isArray(pollOptions)) return []
    
    const totalVotes = Object.values(pollVotes as Record<string, number>).reduce((sum: number, votes: number) => sum + (votes || 0), 0)
    
    return pollOptions.map((option: any, index: number) => ({
      option,
      votes: (pollVotes as Record<string, number>)[index] || 0,
      percentage: totalVotes > 0 ? (((pollVotes as Record<string, number>)[index] || 0) / totalVotes) * 100 : 0
    }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {systemSettings?.company_logo_url && (
                <img 
                  src={systemSettings.company_logo_url} 
                  alt="Logo" 
                  className="h-8 w-auto"
                />
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {systemSettings?.company_name || 'Sistema de Suporte'}
                </h1>
                <p className="text-sm text-gray-600">
                  {systemSettings?.department_name || 'Departamento de TI'}
                </p>
              </div>
            </div>
            
            <Button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700">
              Entrar no Sistema
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {systemSettings?.landing_page_title || 'Bem-vindo ao Portal Corporativo'}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {systemSettings?.landing_page_subtitle || 'Fique por dentro das novidades e comunicados da empresa'}
          </p>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts?.map((post) => (
            <Card key={post.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={post.profiles?.avatar_url} />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {post.profiles?.name?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">
                          {post.profiles?.name || 'Administrador'}
                        </h3>
                        {getPostTypeIcon(post.type) && (
                          <Badge variant="secondary" className="text-xs">
                            {getPostTypeIcon(post.type)}
                            {post.type === 'poll' ? 'Enquete' : 
                             post.type === 'image' ? 'Imagem' :
                             post.type === 'video' ? 'Vídeo' : 'Texto'}
                          </Badge>
                        )}
                        {post.is_featured && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Destaque
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatDistanceToNow(new Date(post.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                        {post.view_count && post.view_count > 0 && (
                          <>
                            <Separator orientation="vertical" className="h-4" />
                            <Users className="h-4 w-4" />
                            <span>{post.view_count} visualizações</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Title */}
                <h4 className="text-lg font-semibold text-gray-900">{post.title}</h4>
                
                {/* Content */}
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
                </div>

                {/* Media */}
                {post.media_url && (
                  <div className="mt-4">
                    {post.type === 'image' && (
                      <img 
                        src={post.media_url} 
                        alt="Post media"
                        className="rounded-lg max-w-full h-auto shadow-sm"
                      />
                    )}
                    {post.type === 'video' && (
                      <div className="aspect-video">
                        <video 
                          controls 
                          className="w-full h-full rounded-lg shadow-sm"
                          poster={post.media_url}
                        >
                          <source src={post.media_url} type="video/mp4" />
                          Seu navegador não suporta vídeos.
                        </video>
                      </div>
                    )}
                  </div>
                )}

                {/* Poll */}
                {post.type === 'poll' && post.poll_options && Array.isArray(post.poll_options) && (
                  <div className="mt-4 space-y-3">
                    <h5 className="font-medium text-gray-900">Enquete:</h5>
                    {calculatePollResults(post.poll_votes, post.poll_options).map((result, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            {result.option}
                          </span>
                          <span className="text-sm text-gray-500">
                            {result.votes} votos ({result.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={result.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {posts?.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum comunicado ainda
              </h3>
              <p className="text-gray-600">
                Os comunicados da empresa aparecerão aqui em breve.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; {new Date().getFullYear()} {systemSettings?.company_name || 'Sistema de Suporte'}. Todos os direitos reservados.</p>
            <p className="mt-2 text-sm">
              Para suporte técnico, entre em contato: {systemSettings?.support_email || 'suporte@empresa.com'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
