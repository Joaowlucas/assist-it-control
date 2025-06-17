
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { useLandingPageContent } from '@/hooks/useLandingPage'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { LogIn, MessageSquare, Wrench, Users } from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: settings } = useSystemSettings()
  const { data: content } = useLandingPageContent()

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  // If landing page is disabled, redirect to login
  useEffect(() => {
    if (settings && !settings.landing_page_enabled) {
      navigate('/login')
    }
  }, [settings, navigate])

  const images = content?.filter(item => item.type === 'image') || []
  const announcements = content?.filter(item => item.type === 'announcement') || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {settings?.company_logo_url ? (
              <img 
                src={settings.company_logo_url} 
                alt="Logo" 
                className="h-8 w-8 object-contain"
              />
            ) : null}
            <h1 className="text-xl font-bold">
              {settings?.company_name || "Sistema de Suporte TI"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={() => navigate('/login')} className="gap-2">
              <LogIn className="h-4 w-4" />
              Entrar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center py-12 mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            {settings?.landing_page_title || "Bem-vindo ao Sistema de Suporte TI"}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {settings?.landing_page_subtitle || "Gerencie equipamentos, chamados e muito mais"}
          </p>
          <Button size="lg" onClick={() => navigate('/login')} className="gap-2">
            <LogIn className="h-5 w-5" />
            Acessar Sistema
          </Button>
        </section>

        {/* Features */}
        <section className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <Wrench className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Gestão de Equipamentos</h3>
              <p className="text-muted-foreground">
                Controle completo do inventário de equipamentos de TI
              </p>
            </CardContent>
          </Card>
          
          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Sistema de Chamados</h3>
              <p className="text-muted-foreground">
                Abertura e acompanhamento de solicitações de suporte
              </p>
            </CardContent>
          </Card>
          
          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Chat Interno</h3>
              <p className="text-muted-foreground">
                Comunicação direta entre usuários e técnicos
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Image Carousel */}
        {images.length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-8">Galeria</h2>
            <div className="max-w-4xl mx-auto">
              <Carousel className="w-full">
                <CarouselContent>
                  {images.map((image) => (
                    <CarouselItem key={image.id}>
                      <div className="p-1">
                        <Card>
                          <CardContent className="p-0">
                            <img
                              src={image.image_url || ''}
                              alt={image.title || 'Imagem'}
                              className="w-full h-64 md:h-96 object-cover rounded-lg"
                            />
                            {image.title && (
                              <div className="p-4">
                                <h3 className="text-lg font-semibold">{image.title}</h3>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          </section>
        )}

        {/* Announcements */}
        {announcements.length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-8">Comunicados</h2>
            <div className="max-w-4xl mx-auto space-y-6">
              {announcements.map((announcement) => (
                <Card key={announcement.id} className="p-6">
                  <CardContent>
                    <h3 className="text-xl font-semibold mb-4">{announcement.title}</h3>
                    <div className="prose dark:prose-invert max-w-none">
                      <p>{announcement.content}</p>
                    </div>
                    <div className="text-sm text-muted-foreground mt-4">
                      {new Date(announcement.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/95 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © 2025 {settings?.company_name || "Sistema de Suporte TI"}. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
