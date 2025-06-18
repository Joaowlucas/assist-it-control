
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash, Image, Play, Vote, MessageSquare } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { 
  useLandingPageContent, 
  useCreateLandingPageContent, 
  useUpdateLandingPageContent, 
  useDeleteLandingPageContent 
} from "@/hooks/useLandingPageContent"
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog"

export function LandingPageManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingContent, setEditingContent] = useState<any>(null)
  const [deletingContent, setDeletingContent] = useState<any>(null)

  const { data: content = [], isLoading } = useLandingPageContent()
  const createContent = useCreateLandingPageContent()
  const updateContent = useUpdateLandingPageContent()
  const deleteContent = useDeleteLandingPageContent()

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)

    const contentData = {
      type: formData.get('type') as string,
      title: formData.get('title') as string,
      content: formData.get('content') as string || null,
      image_url: formData.get('image_url') as string || null,
      display_order: parseInt(formData.get('display_order') as string) || 0,
    }

    try {
      await createContent.mutateAsync(contentData)
      setIsCreateDialogOpen(false)
      const form = e.target as HTMLFormElement
      form.reset()
    } catch (error) {
      console.error('Error creating content:', error)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingContent) return

    const formData = new FormData(e.target as HTMLFormElement)

    const contentData = {
      id: editingContent.id,
      type: formData.get('type') as string,
      title: formData.get('title') as string,
      content: formData.get('content') as string || null,
      image_url: formData.get('image_url') as string || null,
      display_order: parseInt(formData.get('display_order') as string) || 0,
    }

    try {
      await updateContent.mutateAsync(contentData)
      setIsEditDialogOpen(false)
      setEditingContent(null)
    } catch (error) {
      console.error('Error updating content:', error)
    }
  }

  const handleEdit = (item: any) => {
    setEditingContent(item)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (item: any) => {
    setDeletingContent(item)
  }

  const confirmDelete = async () => {
    if (!deletingContent) return
    
    try {
      await deleteContent.mutateAsync(deletingContent.id)
      setDeletingContent(null)
    } catch (error) {
      console.error('Error deleting content:', error)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />
      case 'video':
        return <Play className="h-4 w-4" />
      case 'poll':
        return <Vote className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gerenciar Landing Page</h3>
          <p className="text-sm text-muted-foreground">
            Crie e gerencie comunicados, imagens, vídeos e enquetes
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Comunicado
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Comunicado</DialogTitle>
              <DialogDescription>
                Adicione um novo comunicado à landing page
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="type">Tipo de Conteúdo</Label>
                  <Select name="type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Comunicado de Texto</SelectItem>
                      <SelectItem value="image">Imagem</SelectItem>
                      <SelectItem value="video">Vídeo</SelectItem>
                      <SelectItem value="poll">Enquete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Título do comunicado"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="content">Conteúdo</Label>
                  <Textarea
                    id="content"
                    name="content"
                    placeholder="Conteúdo do comunicado..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="image_url">URL da Imagem/Vídeo (opcional)</Label>
                  <Input
                    id="image_url"
                    name="image_url"
                    type="url"
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>

                <div>
                  <Label htmlFor="display_order">Ordem de Exibição</Label>
                  <Input
                    id="display_order"
                    name="display_order"
                    type="number"
                    defaultValue={0}
                    min={0}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createContent.isPending}>
                  {createContent.isPending ? 'Criando...' : 'Criar Comunicado'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comunicados Publicados</CardTitle>
          <CardDescription>
            Gerencie todos os comunicados da landing page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {content.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(item.type)}
                      {getTypeBadge(item.type)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>
                    {format(new Date(item.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>{item.display_order}</TableCell>
                  <TableCell>
                    <Badge variant={item.is_active ? "default" : "secondary"}>
                      {item.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item)}
                        className="hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Comunicado</DialogTitle>
            <DialogDescription>
              Altere as informações do comunicado
            </DialogDescription>
          </DialogHeader>
          {editingContent && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="edit-type">Tipo de Conteúdo</Label>
                  <Select name="type" defaultValue={editingContent.type} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Comunicado de Texto</SelectItem>
                      <SelectItem value="image">Imagem</SelectItem>
                      <SelectItem value="video">Vídeo</SelectItem>
                      <SelectItem value="poll">Enquete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-title">Título</Label>
                  <Input
                    id="edit-title"
                    name="title"
                    defaultValue={editingContent.title || ''}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="edit-content">Conteúdo</Label>
                  <Textarea
                    id="edit-content"
                    name="content"
                    defaultValue={editingContent.content || ''}
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-image_url">URL da Imagem/Vídeo</Label>
                  <Input
                    id="edit-image_url"
                    name="image_url"
                    type="url"
                    defaultValue={editingContent.image_url || ''}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-display_order">Ordem de Exibição</Label>
                  <Input
                    id="edit-display_order"
                    name="display_order"
                    type="number"
                    defaultValue={editingContent.display_order || 0}
                    min={0}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateContent.isPending}>
                  {updateContent.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={!!deletingContent}
        onOpenChange={() => setDeletingContent(null)}
        onConfirm={confirmDelete}
        title="Excluir Comunicado"
        description={`Tem certeza que deseja excluir o comunicado "${deletingContent?.title}"? Esta ação não pode ser desfeita.`}
        isLoading={deleteContent.isPending}
      />
    </div>
  )
}
