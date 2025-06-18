
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useEndAssignment } from "@/hooks/useEndAssignment"

interface ConfirmEndAssignmentDialogProps {
  assignmentId: string
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
  const [open, setOpen] = useState(false)
  const endAssignmentMutation = useEndAssignment()

  const handleConfirm = async () => {
    try {
      await endAssignmentMutation.mutateAsync(assignmentId)
      setOpen(false)
    } catch (error) {
      // O erro já é tratado no hook
      console.error('Erro ao finalizar atribuição:', error)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Finalização da Atribuição</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Você tem certeza que deseja finalizar a atribuição do equipamento{" "}
              <strong>{equipmentName}</strong> para o usuário{" "}
              <strong>{userName}</strong>?
            </p>
            <p className="text-sm text-muted-foreground">
              O equipamento será automaticamente marcado como disponível e 
              poderá ser atribuído a outro usuário.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={endAssignmentMutation.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={endAssignmentMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {endAssignmentMutation.isPending ? "Finalizando..." : "Finalizar Atribuição"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
