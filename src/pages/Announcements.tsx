
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Filter } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement, Announcement } from '@/hooks/useAnnouncements'
import { AnnouncementCard } from '@/components/AnnouncementCard'
import { AnnouncementForm, AnnouncementFormData } from '@/components/AnnouncementForm'
import { useToast } from '@/hooks/use-toast'

export default function Announcements() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | undefined>()

  const { data: announcements = [], isLoading } = useAnnouncements()
  const createAnnouncement = useCreateAnnouncement()
  const updateAnnouncement = useUpdateAnnouncement()
  const deleteAnnouncement = useDeleteAnnouncement()

  const isAdmin = profile?.role === 'admin'

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || announcement.type === typeFilter
    return matchesSearch && matchesType
  })

  const handleCreateAnnouncement = async (data: AnnouncementFormData) => {
    try {
      await createAnnouncement.mutateAsync(data)
      setShowForm(false)
      toast({
        title: "Sucesso",
        description: "Comunicado publicado com sucesso!",
      })
    } catch (error) {
      console.error('Erro ao criar comunicado:', error)
      toast({
        title: "Erro",
        description: "Erro ao publicar comunicado. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateAnnouncement = async (data: AnnouncementFormData) => {
    if (!editingAnnouncement) return

    try {
      await updateAnnouncement.mutateAsync({
        id: editingAnnouncement.id,
        title: data.title,
        content: data.content,
        is_featured: data.is_featured,
      })
      setEditingAnnouncement(undefined)
      setShowForm(false)
      toast({
        title: "Sucesso",
        description: "Comunicado atualizado com sucesso!",
      })
    } catch (error) {
      console.error('Erro ao atualizar comunicado:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar comunicado. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este comunicado?')) return

    try {
      await deleteAnnouncement.mutateAsync(id)
      toast({
        title: "Sucesso",
        description: "Comunicado excluído com sucesso!",
      })
    } catch (error) {
      console.error('Erro ao excluir comunicado:', error)
      toast({
        title: "Erro",
        description: "Erro ao excluir comunicado. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setShowForm(true)
  }

  const handleNewAnnouncement = () => {
    setEditingAnnouncement(undefined)
    setShowForm(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando comunicados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Comunicados</h1>
            <p className="text-muted-foreground">
              Central de comunicação interna da empresa
            </p>
          </div>
          
          {isAdmin && (
            <Button onClick={handleNewAnnouncement} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Novo Comunicado
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar comunicados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="text">Comunicados</SelectItem>
              <SelectItem value="poll">Enquetes</SelectItem>
              <SelectItem value="image">Imagens</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-6">
          {filteredAnnouncements.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {searchTerm || typeFilter !== 'all' 
                  ? 'Nenhum comunicado encontrado com os filtros aplicados.' 
                  : 'Ainda não há comunicados publicados.'}
              </p>
              {isAdmin && !searchTerm && typeFilter === 'all' && (
                <Button onClick={handleNewAnnouncement} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Publicar Primeiro Comunicado
                </Button>
              )}
            </div>
          ) : (
            filteredAnnouncements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onEdit={isAdmin ? handleEditAnnouncement : undefined}
                onDelete={isAdmin ? handleDeleteAnnouncement : undefined}
              />
            ))
          )}
        </div>

        <AnnouncementForm
          open={showForm}
          onOpenChange={setShowForm}
          onSubmit={editingAnnouncement ? handleUpdateAnnouncement : handleCreateAnnouncement}
          announcement={editingAnnouncement}
          loading={createAnnouncement.isPending || updateAnnouncement.isPending}
        />
      </div>
    </div>
  )
}
