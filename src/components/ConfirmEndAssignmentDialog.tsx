
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
} from "@/components/ui/alert-dialog"
import { useEndAssignment } from "@/hooks/useEndAssignment"

interface ConfirmEndAssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignmentId: string
  equipmentName: string
  userName: string
  children?: React.ReactNode
}

export function ConfirmEndAssignmentDialog({
  open,
  onOpenChange,
  assignmentId,
  equipmentName,
  userName,
  children
}: ConfirmEndAssignmentDialogProps) {
  const endAssignmentMutation = useEndAssignment()

  const handleConfirm = async () => {
    try {
      await endAssignmentMutation.mutateAsync(assignmentId)
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao finalizar atribuição:', error)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {children}
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
