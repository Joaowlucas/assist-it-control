
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface ConfirmEndAssignmentDialogProps {
  open: boolean
  assignmentId: string | null
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmEndAssignmentDialog({ 
  open, 
  assignmentId, 
  onConfirm, 
  onCancel 
}: ConfirmEndAssignmentDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Finalização</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja finalizar esta atribuição? O equipamento ficará disponível para nova atribuição.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Finalizar Atribuição
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
