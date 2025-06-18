
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Image, Play, Vote, MessageSquare } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useLandingPageContent } from "@/hooks/useLandingPageContent"
import { useState } from "react"

export default function LandingPage() {
  const { data: content = [], isLoading } = useLandingPageContent()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="h-5 w-5" />
      case 'video':
        return <Play className="h-5 w-5" />
      case 'poll':
        return <Vote className="h-5 w-5" />
      default:
        return <MessageSquare className="h-5 w-5" />
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'image':
        return <Badge variant="secondary">Imagem</Badge>
      case 'video':
        return <Badge variant="outline">Vídeo</Badge>
      case 'poll':
        return <Badge variant="default">Enquete</Badge>
      default:
        return <Badge variant="secondary">Comunicado</Badge>
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          Portal de Comunicados
        </h1>
        <p className="text-muted-foreground">
          Acompanhe as últimas novidades e comunicados da empresa
        </p>
      </div>

      <div className="grid gap-6">
        {content.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum comunicado disponível</h3>
              <p className="text-muted-foreground text-center">
                Os comunicados aparecerão aqui quando forem publicados pelos administradores.
              </p>
            </CardContent>
          </Card>
        ) : (
          content.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(item.type)}
                      <CardTitle className="text-xl">{item.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(item.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </div>
                      {getTypeBadge(item.type)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {item.content && (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-foreground whitespace-pre-wrap">{item.content}</p>
                  </div>
                )}
                
                {item.type === 'image' && item.image_url && (
                  <div className="relative rounded-lg overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.title || 'Imagem do comunicado'}
                      className="w-full max-h-96 object-cover"
                    />
                  </div>
                )}
                
                {item.type === 'video' && item.image_url && (
                  <div className="relative rounded-lg overflow-hidden bg-muted">
                    <div className="aspect-video flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <Play className="h-12 w-12 mx-auto text-muted-foreground" />
                        <Button variant="outline" asChild>
                          <a href={item.image_url} target="_blank" rel="noopener noreferrer">
                            Assistir Vídeo
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {item.type === 'poll' && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="text-center space-y-2">
                      <Vote className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Funcionalidade de enquete em desenvolvimento
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
