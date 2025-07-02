import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { AnnouncementWithUnits } from '@/hooks/useAnnouncementsWithUnits'

interface AnnouncementActionsProps {
  post: AnnouncementWithUnits
  onUpdate: () => void
}

export function AnnouncementActions({ post, onUpdate }: AnnouncementActionsProps) {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editForm, setEditForm] = useState({
    title: post.title,
    content: post.content,
    is_featured: post.is_featured
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Verificar permissões
  const canEdit = React.useMemo(() => {
    if (!profile) return false
    
    // Admin pode editar qualquer post
    if (profile.role === 'admin') return true
    
    // Autor pode editar próprios posts
    if (post.author_id === profile.id) return true
    
    // Técnico pode editar posts das suas unidades
    if (profile.role === 'technician' && profile.technician_units) {
      const technicianUnitIds = profile.technician_units.map(tu => tu.unit_id)
      const postUnitIds = post.unit_ids || []
      
      // Se post é para todas as unidades ou se técnico tem alguma unidade do post
      return postUnitIds.includes('all') || 
             postUnitIds.some(unitId => technicianUnitIds.includes(unitId))
    }
    
    return false
  }, [profile, post])

  const canDelete = canEdit // Mesmas regras para deletar

  if (!canEdit && !canDelete) {
    return null
  }

  const handleEdit = async () => {
    if (!profile) return
    
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('landing_page_posts')
        .update({
          title: editForm.title,
          content: editForm.content,
          is_featured: editForm.is_featured,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id)

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Comunicado atualizado com sucesso!',
      })
      
      setShowEditDialog(false)
      onUpdate()
    } catch (error) {
      console.error('Erro ao atualizar comunicado:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar comunicado. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!profile) return
    
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('landing_page_posts')
        .delete()
        .eq('id', post.id)

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Comunicado excluído com sucesso!',
      })
      
      setShowDeleteDialog(false)
      onUpdate()
    } catch (error) {
      console.error('Erro ao excluir comunicado:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao excluir comunicado. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canEdit && (
            <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem 
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Comunicado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Título do comunicado"
              />
            </div>
            <div>
              <Label htmlFor="content">Conteúdo</Label>
              <Textarea
                id="content"
                value={editForm.content}
                onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Conteúdo do comunicado"
                rows={4}
              />
            </div>
            {profile?.role === 'admin' && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={editForm.is_featured}
                  onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_featured: checked }))}
                />
                <Label htmlFor="featured">Comunicado em destaque</Label>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
                disabled={isUpdating}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleEdit}
                disabled={isUpdating || !editForm.title.trim() || !editForm.content.trim()}
              >
                {isUpdating ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este comunicado? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}