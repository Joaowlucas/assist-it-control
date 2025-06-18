
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
import { Badge } from "@/components/ui/badge"
import { usePredefinedTexts, useCreatePredefinedText, useUpdatePredefinedText, useDeletePredefinedText } from "@/hooks/usePredefinedTexts"
import { useTicketCategories } from "@/hooks/useTicketCategories"
import { Edit, Trash2, Plus } from "lucide-react"

export function PredefinedTextsManagement() {
  const { data: texts = [], isLoading } = usePredefinedTexts()
  const { data: categories = [] } = useTicketCategories()
  const createText = useCreatePredefinedText()
  const updateText = useUpdatePredefinedText()
  const deleteText = useDeletePredefinedText()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingText, setEditingText] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    const textData = {
      type: formData.get('type') as 'title' | 'description',
      category: formData.get('category') as string || null,
      text_content: formData.get('text_content') as string,
      is_active: true
    }

    try {
      if (editingText) {
        await updateText.mutateAsync({ id: editingText.id, ...textData })
      } else {
        await createText.mutateAsync(textData)
      }
      setIsDialogOpen(false)
      setEditingText(null)
      ;(e.target as HTMLFormElement).reset()
    } catch (error) {
      console.error('Error saving text:', error)
    }
  }

  const handleEdit = (text: any) => {
    setEditingText(text)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteText.mutateAsync(id)
    } catch (error) {
      console.error('Error deleting text:', error)
    }
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingText(null)
  }

  if (isLoading) {
    return <div className="flex justify-center p-4">Carregando...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Textos Pré-definidos</CardTitle>
          <CardDescription>
            Gerencie textos pré-definidos para agilizar a criação de chamados
          </CardDescription>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Texto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingText ? 'Editar Texto' : 'Novo Texto'}</DialogTitle>
              <DialogDescription>
                Configure um novo texto pré-definido para agilizar a criação de chamados
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select name="type" defaultValue={editingText?.type} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">Título</SelectItem>
                    <SelectItem value="description">Descrição</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select name="category" defaultValue={editingText?.category}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as categorias</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="text_content">Conteúdo do Texto</Label>
                <Textarea 
                  id="text_content" 
                  name="text_content" 
                  defaultValue={editingText?.text_content}
                  placeholder="Digite o texto pré-definido..."
                  rows={4}
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createText.isPending || updateText.isPending}>
                  {editingText ? 'Atualizar' : 'Criar'} Texto
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
              <TableHead>Tipo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Conteúdo</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {texts.map((text) => (
              <TableRow key={text.id}>
                <TableCell>
                  <Badge variant={text.type === 'title' ? 'default' : 'secondary'}>
                    {text.type === 'title' ? 'Título' : 'Descrição'}
                  </Badge>
                </TableCell>
                <TableCell>{text.category || 'Todas'}</TableCell>
                <TableCell className="max-w-xs truncate">{text.text_content}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(text)}
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
                            Tem certeza que deseja excluir este texto pré-definido? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(text.id)}
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
