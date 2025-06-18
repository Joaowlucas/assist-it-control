
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useTicketTemplates, useCreateTicketTemplate, useUpdateTicketTemplate, useDeleteTicketTemplate } from "@/hooks/useTicketTemplates"
import { useTicketCategories } from "@/hooks/useTicketCategories"
import { Edit, Trash2, Plus } from "lucide-react"

export function TicketTemplateManagement() {
  const { data: templates = [], isLoading } = useTicketTemplates()
  const { data: categories = [] } = useTicketCategories()
  const createTemplate = useCreateTicketTemplate()
  const updateTemplate = useUpdateTicketTemplate()
  const deleteTemplate = useDeleteTicketTemplate()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    const templateData = {
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      priority: formData.get('priority') as string,
      title_template: formData.get('title_template') as string,
      description_template: formData.get('description_template') as string,
      is_active: true
    }

    try {
      if (editingTemplate) {
        await updateTemplate.mutateAsync({ id: editingTemplate.id, ...templateData })
      } else {
        await createTemplate.mutateAsync(templateData)
      }
      setIsDialogOpen(false)
      setEditingTemplate(null)
      ;(e.target as HTMLFormElement).reset()
    } catch (error) {
      console.error('Error saving template:', error)
    }
  }

  const handleEdit = (template: any) => {
    setEditingTemplate(template)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate.mutateAsync(id)
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingTemplate(null)
  }

  if (isLoading) {
    return <div className="flex justify-center p-4">Carregando...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Templates de Chamados</CardTitle>
          <CardDescription>
            Crie templates pré-configurados para facilitar a criação de chamados
          </CardDescription>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'Editar Template' : 'Novo Template'}</DialogTitle>
              <DialogDescription>
                Configure um template para facilitar a criação de chamados
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Template</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    defaultValue={editingTemplate?.name}
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select name="category" defaultValue={editingTemplate?.category} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="priority">Prioridade Padrão</Label>
                <Select name="priority" defaultValue={editingTemplate?.priority || 'media'} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="critica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="title_template">Título do Template</Label>
                <Input 
                  id="title_template" 
                  name="title_template" 
                  defaultValue={editingTemplate?.title_template}
                  placeholder="Ex: Problema com impressora [MODELO]"
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="description_template">Descrição do Template</Label>
                <Textarea 
                  id="description_template" 
                  name="description_template" 
                  defaultValue={editingTemplate?.description_template}
                  placeholder="Descreva o template da descrição do chamado..."
                  rows={4}
                  required 
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createTemplate.isPending || updateTemplate.isPending}>
                  {editingTemplate ? 'Atualizar' : 'Criar'} Template
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell className="capitalize">{template.category}</TableCell>
                <TableCell className="capitalize">{template.priority}</TableCell>
                <TableCell className="max-w-xs truncate">{template.title_template}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(template.id)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
