
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useEndAssignment } from "@/hooks/useAssignments"

interface ConfirmEndAssignmentDialogProps {
  assignmentId: string | null
  equipmentName: string
  userName: string
  children: React.ReactNode
}

export function ConfirmEndAssignmentDialog({ 
  assignmentId, 
  equipmentName,
  userName,
  children
}: ConfirmEndAssignmentDialogProps) {
  const endAssignment = useEndAssignment()

  const handleConfirm = async () => {
    if (assignmentId) {
      await endAssignment.mutateAsync(assignmentId)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Finalização</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja finalizar a atribuição do equipamento "{equipmentName}" para o usuário "{userName}"? O equipamento ficará disponível para nova atribuição.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={endAssignment.isPending}>
            {endAssignment.isPending ? 'Finalizando...' : 'Finalizar Atribuição'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
