
import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateUserDialog } from './CreateUserDialog'
import { EditUserDialog } from './EditUserDialog'
import { UserActionsDropdown } from './UserActionsDropdown'
import { Plus, Search, Users, UserCheck, UserX } from 'lucide-react'
import { useTechnicianUnits } from '@/hooks/useTechnicianUnits'

interface Profile {
  id: string
  name: string
  email: string
  role: 'admin' | 'technician' | 'user'
  status: string
  created_at: string
  avatar_url?: string
  unit_id?: string
  phone?: string
  updated_at?: string
  unit?: {
    name: string
  }
}

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          unit:units(name)
        `)
        .order('name')

      if (error) throw error
      return data as Profile[]
    }
  })

  const handleEditUser = (user: Profile) => {
    setSelectedUser(user)
    setEditDialogOpen(true)
  }

  const filteredProfiles = profiles.filter(profile =>
    profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeUsers = profiles.filter(p => p.status === 'ativo')
  const inactiveUsers = profiles.filter(p => p.status === 'inativo')
  const admins = profiles.filter(p => p.role === 'admin')
  const technicians = profiles.filter(p => p.role === 'technician')
  const users = profiles.filter(p => p.role === 'user')

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">Administrador</Badge>
      case 'technician':
        return <Badge variant="default">Técnico</Badge>
      case 'user':
        return <Badge variant="secondary">Usuário</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    return status === 'ativo' 
      ? <Badge variant="default" className="bg-green-500">Ativo</Badge>
      : <Badge variant="destructive">Inativo</Badge>
  }

  // Hook para buscar unidades de técnicos
  const TechnicianUnits = ({ technicianId }: { technicianId: string }) => {
    const { data: technicianUnits = [] } = useTechnicianUnits(technicianId)
    
    if (technicianUnits.length === 0) {
      return <span className="text-gray-500">Nenhuma unidade atribuída</span>
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {technicianUnits.map((tu) => (
          <Badge key={tu.id} variant="outline" className="text-xs">
            {tu.unit?.name}
          </Badge>
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header e Estatísticas */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Usuários</h2>
          <p className="text-gray-600">Gerencie usuários do sistema</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profiles.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeUsers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Inativos</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactiveUsers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{admins.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Técnicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{technicians.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Buscar usuários..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabela de Usuários */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Unidade/Atribuições</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProfiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback>
                        {profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{profile.name}</span>
                  </div>
                </TableCell>
                <TableCell>{profile.email}</TableCell>
                <TableCell>{getRoleBadge(profile.role)}</TableCell>
                <TableCell>{getStatusBadge(profile.status)}</TableCell>
                <TableCell>
                  {profile.role === 'technician' ? (
                    <TechnicianUnits technicianId={profile.id} />
                  ) : profile.unit?.name ? (
                    <Badge variant="outline">{profile.unit.name}</Badge>
                  ) : (
                    <span className="text-gray-500">Nenhuma unidade</span>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-right">
                  <UserActionsDropdown 
                    user={profile} 
                    onEdit={() => handleEditUser(profile)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CreateUserDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
      
      {selectedUser && (
        <EditUserDialog 
          open={editDialogOpen} 
          onOpenChange={setEditDialogOpen}
          user={selectedUser}
        />
      )}
    </div>
  )
}
