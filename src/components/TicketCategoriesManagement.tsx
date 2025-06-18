
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { useTicketCategories, useCreateTicketCategory, useUpdateTicketCategory, useDeleteTicketCategory } from "@/hooks/useTicketCategories"
import { Edit, Trash2, Plus } from "lucide-react"

export function TicketCategoriesManagement() {
  const { data: categories = [], isLoading } = useTicketCategories()
  const createCategory = useCreateTicketCategory()
  const updateCategory = useUpdateTicketCategory()
  const deleteCategory = useDeleteTicketCategory()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    const categoryData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      is_active: true
    }

    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory.id, ...categoryData })
      } else {
        await createCategory.mutateAsync(categoryData)
      }
      setIsDialogOpen(false)
      setEditingCategory(null)
      ;(e.target as HTMLFormElement).reset()
    } catch (error) {
      console.error('Error saving category:', error)
    }
  }

  const handleEdit = (category: any) => {
    if (category.is_default) {
      return // Não permitir editar categorias padrão
    }
    setEditingCategory(category)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory.mutateAsync(id)
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingCategory(null)
  }

  if (isLoading) {
    return <div className="flex justify-center p-4">Carregando...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Categorias de Chamados</CardTitle>
          <CardDescription>
            Gerencie as categorias disponíveis para classificar chamados
          </CardDescription>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
              <DialogDescription>
                Configure uma nova categoria para classificar chamados
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Categoria</Label>
                <Input 
                  id="name" 
                  name="name" 
                  defaultValue={editingCategory?.name}
                  placeholder="Ex: seguranca, telefonia, etc."
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  defaultValue={editingCategory?.description}
                  placeholder="Descreva quando usar esta categoria..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                  {editingCategory ? 'Atualizar' : 'Criar'} Categoria
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
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium capitalize">{category.name}</TableCell>
                <TableCell>{category.description || '-'}</TableCell>
                <TableCell>
                  <Badge variant={category.is_default ? 'default' : 'secondary'}>
                    {category.is_default ? 'Padrão' : 'Personalizada'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {!category.is_default && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(category)}
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
                                Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita e só é permitida se não houver chamados usando esta categoria.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(category.id)}
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                    {category.is_default && (
                      <span className="text-sm text-muted-foreground">Categoria padrão</span>
                    )}
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
