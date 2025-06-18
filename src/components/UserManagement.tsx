
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil, Trash2, Shield, User, Settings } from 'lucide-react'
import { useProfiles } from '@/hooks/useProfiles'
import { useUnits } from '@/hooks/useUnits'
import { CreateUserDialog } from '@/components/CreateUserDialog'
import { EditUserDialog } from '@/components/EditUserDialog'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { useDeleteUser } from '@/hooks/useUserManagement'

export function UserManagement() {
  const { data: profiles = [], isLoading } = useProfiles()
  const { data: units = [] } = useUnits()
  const deleteUser = useDeleteUser()
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    userId: string | null
    userName: string
  }>({
    open: false,
    userId: null,
    userName: ''
  })

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'technician':
        return 'Técnico'
      case 'user':
        return 'Usuário'
      default:
        return 'Desconhecido'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'technician':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'user':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'inativo':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const handleEditUser = (user: any) => {
    setSelectedUser(user)
    setEditDialogOpen(true)
  }

  const handleDeleteUser = (userId: string, userName: string) => {
    setDeleteDialog({
      open: true,
      userId,
      userName
    })
  }

  const confirmDelete = async () => {
    if (deleteDialog.userId) {
      try {
        await deleteUser.mutateAsync(deleteDialog.userId)
        setDeleteDialog({ open: false, userId: null, userName: '' })
      } catch (error) {
        console.error('Error deleting user:', error)
      }
    }
  }

  if (isLoading) {
    return <div className="flex justify-center p-4">Carregando usuários...</div>
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Gerenciamento de Usuários
            </CardTitle>
            <CardDescription>
              Gerencie usuários, papéis e permissões do sistema
            </CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(user.role)}>
                      {user.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                      {user.role === 'technician' && <Settings className="h-3 w-3 mr-1" />}
                      {user.role === 'user' && <User className="h-3 w-3 mr-1" />}
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {units.find(unit => unit.id === user.unit_id)?.name || 'Não definida'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(user.status)}>
                      {user.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {profiles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum usuário encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <EditUserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={selectedUser}
      />

      <ConfirmDeleteDialog
        open={deleteDialog.open}
        title="Confirmar Exclusão"
        description={`Tem certeza que deseja excluir o usuário "${deleteDialog.userName}"? Esta ação não pode ser desfeita.`}
        onConfirm={confirmDelete}
        onOpenChange={(open) => setDeleteDialog({ open: false, userId: null, userName: '' })}
      />
    </>
  )
}
