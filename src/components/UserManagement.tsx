
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Plus, Pencil, Trash2, Shield, User, Settings, Search, UserCheck, UserX } from 'lucide-react'
import { useProfiles } from '@/hooks/useProfiles'
import { useUnits } from '@/hooks/useUnits'
import { CreateUserDialog } from '@/components/CreateUserDialog'
import { EditUserDialog } from '@/components/EditUserDialog'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { useDeleteUser, useToggleUserStatus } from '@/hooks/useUserManagement'

export function UserManagement() {
  const { data: profiles = [], isLoading } = useProfiles()
  const { data: units = [] } = useUnits()
  const deleteUser = useDeleteUser()
  const toggleUserStatus = useToggleUserStatus()
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    userId: string | null
    userName: string
  }>({
    open: false,
    userId: null,
    userName: ''
  })

  const filteredProfiles = profiles.filter(profile =>
    profile.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    try {
      await toggleUserStatus.mutateAsync({ userId, currentStatus })
    } catch (error) {
      console.error('Error toggling user status:', error)
    }
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

  const stats = [
    {
      title: "Total de Usuários",
      value: profiles.length,
      icon: User,
      color: "text-blue-500"
    },
    {
      title: "Administradores",
      value: profiles.filter(p => p.role === 'admin').length,
      icon: Shield,
      color: "text-red-500"
    },
    {
      title: "Técnicos",
      value: profiles.filter(p => p.role === 'technician').length,
      icon: Settings,
      color: "text-blue-500"
    },
    {
      title: "Usuários Ativos",
      value: profiles.filter(p => p.status === 'ativo').length,
      icon: UserCheck,
      color: "text-green-500"
    }
  ]

  if (isLoading) {
    return <div className="flex justify-center p-4">Carregando usuários...</div>
  }

  return (
    <>
      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

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
          {/* Barra de Pesquisa */}
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

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
              {filteredProfiles.map((user) => (
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
                        title="Editar usuário"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(user.id, user.status)}
                        disabled={toggleUserStatus.isPending}
                        title={user.status === 'ativo' ? 'Desativar usuário' : 'Ativar usuário'}
                      >
                        {user.status === 'ativo' ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        title="Excluir usuário"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredProfiles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{searchTerm ? 'Nenhum usuário encontrado para a busca' : 'Nenhum usuário encontrado'}</p>
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
