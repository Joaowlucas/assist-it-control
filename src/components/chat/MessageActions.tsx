import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { MoreVertical, Edit, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface MessageActionsProps {
  messageId: string
  currentContent: string
  onEdit: (messageId: string, newContent: string) => Promise<void>
  onDelete: (messageId: string) => Promise<void>
  disabled?: boolean
}

export function MessageActions({ messageId, currentContent, onEdit, onDelete, disabled }: MessageActionsProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editContent, setEditContent] = useState(currentContent)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleEdit = async () => {
    if (!editContent.trim()) {
      toast({
        title: "Erro",
        description: "A mensagem não pode estar vazia",
        variant: "destructive",
      })
      return
    }

    if (editContent.trim() === currentContent.trim()) {
      setShowEditDialog(false)
      return
    }

    setLoading(true)
    try {
      await onEdit(messageId, editContent.trim())
      setShowEditDialog(false)
      toast({
        title: "Sucesso",
        description: "Mensagem editada com sucesso",
      })
    } catch (error) {
      console.error('Error editing message:', error)
      toast({
        title: "Erro",
        description: "Não foi possível editar a mensagem",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await onDelete(messageId)
      setShowDeleteDialog(false)
      toast({
        title: "Sucesso",
        description: "Mensagem excluída com sucesso",
      })
    } catch (error) {
      console.error('Error deleting message:', error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a mensagem",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = () => {
    setEditContent(currentContent)
    setShowEditDialog(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="w-40 bg-background border border-border shadow-lg z-50"
        >
          <DropdownMenuItem onClick={openEditDialog} className="gap-2">
            <Edit className="h-3 w-3" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)} 
            className="gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Mensagem</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="min-h-[100px] resize-none"
              disabled={loading}
            />
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEdit}
              disabled={loading || !editContent.trim()}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Mensagem</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta mensagem? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}