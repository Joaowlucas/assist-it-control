import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Star, Settings } from 'lucide-react'
import { useTicketCategories, useCreateTicketCategory, useUpdateTicketCategory, useDeleteTicketCategory, useSetDefaultCategory } from '@/hooks/useTicketCategories'

export function TicketCategoriesManagement() {
  const { data: categories = [], isLoading } = useTicketCategories()
  const createCategory = useCreateTicketCategory()
  const updateCategory = useUpdateTicketCategory()
  const deleteCategory = useDeleteTicketCategory()
  const setDefaultCategory = useSetDefaultCategory()
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createCategory.mutateAsync({
        name: formData.name,
        description: formData.description,
        is_active: true,
        is_default: false
      })
      setFormData({ name: '', description: '' })
      setCreateDialogOpen(false)
    } catch (error) {
      console.error('Error creating category:', error)
    }
  }

  const handleEditClick = (category: any) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      description: category.description || ''
    })
    setEditDialogOpen(true)
  }

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCategory) return

    try {
      await updateCategory.mutateAsync({
        id: selectedCategory.id,
        name: formData.name,
        description: formData.description
      })
      setFormData({ name: '', description: '' })
      setEditDialogOpen(false)
    } catch (error) {
      console.error('Error updating category:', error)
    }
  }

  const handleDeleteClick = async (categoryId: string) => {
    try {
      await deleteCategory.mutateAsync(categoryId)
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  const handleSetDefaultClick = async (categoryId: string) => {
    try {
      await setDefaultCategory.mutateAsync(categoryId)
    } catch (error) {
      console.error('Error setting default category:', error)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gerenciamento de Categorias
          </CardTitle>
          <CardDescription>
            Gerencie as categorias de chamados do sistema
          </CardDescription>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Padrão</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.name}</TableCell>
                <TableCell>{category.description}</TableCell>
                <TableCell>
                  {category.is_default ? (
                    <Badge variant="secondary">
                      <Star className="h-3 w-3 mr-1" />
                      Padrão
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefaultClick(category.id)}
                    >
                      Definir como Padrão
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {categories.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma categoria encontrada</p>
          </div>
        )}
      </CardContent>

      {/* Create Category Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Nova Categoria</DialogTitle>
            <DialogDescription>
              Adicione uma nova categoria para classificar os chamados.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <Button type="submit" className="w-full">
              Criar Categoria
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Edite os detalhes da categoria selecionada.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <Button type="submit" className="w-full">
              Salvar Alterações
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
