
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { MoreVertical, Edit, UserX, UserCheck, Mail, Trash2 } from 'lucide-react'
import { Tables } from '@/integrations/supabase/types'
import { useToggleUserStatus, useDeleteUser, useResetUserPassword } from '@/hooks/useUserManagement'
import { EditUserDialog } from './EditUserDialog'

type Profile = Tables<'profiles'>

interface UserActionsDropdownProps {
  user: Profile
}

export function UserActionsDropdown({ user }: UserActionsDropdownProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  const toggleStatus = useToggleUserStatus()
  const deleteUser = useDeleteUser()
  const resetPassword = useResetUserPassword()

  const handleToggleStatus = () => {
    toggleStatus.mutate({
      userId: user.id,
      currentStatus: user.status
    })
  }

  const handleDeleteUser = () => {
    deleteUser.mutate(user.id)
    setDeleteDialogOpen(false)
  }

  const handleResetPassword = () => {
    resetPassword.mutate(user.email)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleToggleStatus}>
            {user.status === 'ativo' ? (
              <>
                <UserX className="w-4 h-4 mr-2" />
                Desativar
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4 mr-2" />
                Ativar
              </>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleResetPassword}>
            <Mail className="w-4 h-4 mr-2" />
            Redefinir Senha
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserDialog 
        user={user}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário "{user.name}"? 
              Esta ação não pode ser desfeita e removerá permanentemente o usuário do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
