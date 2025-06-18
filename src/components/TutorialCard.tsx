
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Play, Eye, Calendar } from "lucide-react"
import { Tutorial } from "@/hooks/useTutorials"

interface TutorialCardProps {
  tutorial: Tutorial
  onClick: () => void
}

export function TutorialCard({ tutorial, onClick }: TutorialCardProps) {
  const getVideoThumbnail = (videoUrl: string, customThumbnail?: string | null) => {
    if (customThumbnail) return customThumbnail

    // YouTube thumbnail
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      const videoId = videoUrl.includes('youtu.be') 
        ? videoUrl.split('youtu.be/')[1]?.split('?')[0]
        : videoUrl.split('v=')[1]?.split('&')[0]
      
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      }
    }

    // Vimeo thumbnail would require API call, so we'll use a placeholder
    return '/placeholder.svg'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 group" onClick={onClick}>
      <div className="relative">
        <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
          <img
            src={getVideoThumbnail(tutorial.video_url, tutorial.thumbnail_url)}
            alt={tutorial.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = '/placeholder.svg'
            }}
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-white/90 rounded-full p-3">
              <Play className="h-6 w-6 text-gray-800 fill-current" />
            </div>
          </div>
        </div>
        <Badge variant="secondary" className="absolute top-2 right-2 capitalize">
          {tutorial.category}
        </Badge>
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
          {tutorial.title}
        </CardTitle>
        {tutorial.description && (
          <CardDescription className="line-clamp-2">
            {tutorial.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {tutorial.author?.name?.charAt(0)?.toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            <span>{tutorial.author?.name || 'Autor'}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{tutorial.view_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(tutorial.created_at)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
