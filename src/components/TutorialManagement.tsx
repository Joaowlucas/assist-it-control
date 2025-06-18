
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAllTutorials, useCreateTutorial, useUpdateTutorial, useDeleteTutorial, TutorialWithAuthor } from "@/hooks/useTutorialManagement"
import { Loader2, Plus, Edit, Trash2, Eye, VideoIcon } from "lucide-react"

const categories = [
  { value: 'geral', label: 'Geral' },
  { value: 'equipamentos', label: 'Equipamentos' },
  { value: 'software', label: 'Software' },
  { value: 'rede', label: 'Rede' },
  { value: 'seguranca', label: 'Segurança' },
  { value: 'manutencao', label: 'Manutenção' },
]

export function TutorialManagement() {
  const { toast } = useToast()
  const { data: tutorials, isLoading } = useAllTutorials()
  const createTutorial = useCreateTutorial()
  const updateTutorial = useUpdateTutorial()
  const deleteTutorial = useDeleteTutorial()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTutorial, setEditingTutorial] = useState<TutorialWithAuthor | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    category: 'geral',
    is_published: true
  })

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      video_url: '',
      thumbnail_url: '',
      category: 'geral',
      is_published: true
    })
    setEditingTutorial(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingTutorial) {
      updateTutorial.mutate({
        id: editingTutorial.id,
        ...formData
      })
    } else {
      createTutorial.mutate(formData)
    }

    setIsDialogOpen(false)
    resetForm()
  }

  const handleEdit = (tutorial: TutorialWithAuthor) => {
    setEditingTutorial(tutorial)
    setFormData({
      title: tutorial.title,
      description: tutorial.description || '',
      video_url: tutorial.video_url,
      thumbnail_url: tutorial.thumbnail_url || '',
      category: tutorial.category,
      is_published: tutorial.is_published
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este tutorial?')) {
      deleteTutorial.mutate(id)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <VideoIcon className="h-5 w-5" />
            Gerenciamento de Tutoriais
          </CardTitle>
          <CardDescription>
            Crie e gerencie vídeos tutoriais para usuários e técnicos
          </CardDescription>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Tutorial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTutorial ? 'Editar Tutorial' : 'Criar Novo Tutorial'}
              </DialogTitle>
              <DialogDescription>
                {editingTutorial ? 'Atualize as informações do tutorial' : 'Adicione um novo vídeo tutorial'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input 
                  id="title" 
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Digite o título do tutorial"
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea 
                  id="description" 
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o conteúdo do tutorial"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="video_url">URL do Vídeo *</Label>
                <Input 
                  id="video_url" 
                  value={formData.video_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
                  required 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Suporta YouTube, Vimeo ou links diretos para arquivos de vídeo
                </p>
              </div>

              <div>
                <Label htmlFor="thumbnail_url">URL da Thumbnail (opcional)</Label>
                <Input 
                  id="thumbnail_url" 
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Se não informado, será usado a thumbnail automática do vídeo
                </p>
              </div>

              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                />
                <Label htmlFor="is_published">Publicar tutorial</Label>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createTutorial.isPending || updateTutorial.isPending}>
                  {(createTutorial.isPending || updateTutorial.isPending) ? "Salvando..." : 
                   editingTutorial ? "Atualizar" : "Criar Tutorial"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {tutorials && tutorials.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Visualizações</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tutorials.map((tutorial) => (
                <TableRow key={tutorial.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{tutorial.title}</div>
                      {tutorial.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {tutorial.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {tutorial.category}
                    </Badge>
                  </TableCell>
                  <TableCell>{tutorial.author?.name || 'Autor desconhecido'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      {tutorial.view_count}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tutorial.is_published ? 'default' : 'secondary'}>
                      {tutorial.is_published ? 'Publicado' : 'Rascunho'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(tutorial.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(tutorial)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(tutorial.id)}
                        disabled={deleteTutorial.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <VideoIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum tutorial encontrado</h3>
            <p className="text-muted-foreground">
              Comece criando seu primeiro tutorial
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
