
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useProfiles, useUpdateProfile } from "@/hooks/useProfiles"
import { useUnits } from "@/hooks/useUnits"
import { CreateUserDialog } from "@/components/CreateUserDialog"
import { UserActionsDropdown } from "@/components/UserActionsDropdown"
import { Loader2, User, Shield, Wrench, Calendar, Plus } from "lucide-react"

export function UserManagement() {
  const { data: profiles, isLoading } = useProfiles()
  const { data: units } = useUnits()
  const updateProfile = useUpdateProfile()
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />
      case 'technician':
        return <Wrench className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'technician':
        return 'default'
      default:
        return 'secondary'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    return status === 'ativo' ? 'default' : 'secondary'
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'technician':
        return 'Técnico'
      default:
        return 'Usuário'
    }
  }

  const handleRoleChange = (userId: string, newRole: string) => {
    updateProfile.mutate({
      id: userId,
      role: newRole as 'admin' | 'technician' | 'user'
    })
  }

  const handleUnitChange = (userId: string, newUnitId: string) => {
    updateProfile.mutate({
      id: userId,
      unit_id: newUnitId === "none" ? null : newUnitId
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getUnitName = (unitId: string | null) => {
    if (!unitId) return 'Nenhuma unidade'
    const unit = units?.find(u => u.id === unitId)
    return unit?.name || 'Unidade não encontrada'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Usuários</h2>
          <p className="text-muted-foreground">
            Gerencie usuários e suas permissões no sistema
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Criar Usuário
        </Button>
      </div>

      <div className="grid gap-4">
        {profiles?.map((profile) => (
          <Card key={profile.id}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getRoleIcon(profile.role)}
                  <div>
                    <CardTitle className="text-lg">{profile.name}</CardTitle>
                    <CardDescription>{profile.email}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={getRoleBadgeVariant(profile.role)}>
                    {getRoleLabel(profile.role)}
                  </Badge>
                  <Badge variant={getStatusBadgeVariant(profile.status)}>
                    {profile.status}
                  </Badge>
                  <UserActionsDropdown user={profile} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Função</label>
                  <Select
                    value={profile.role}
                    onValueChange={(value) => handleRoleChange(profile.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="technician">Técnico</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Unidade</label>
                  <Select
                    value={profile.unit_id || "none"}
                    onValueChange={(value) => handleUnitChange(profile.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma unidade</SelectItem>
                      {units?.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Badge variant={getStatusBadgeVariant(profile.status)}>
                    {profile.status}
                  </Badge>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Criado em</label>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2" />
                    {profile.created_at ? formatDate(profile.created_at) : 'N/A'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {profiles?.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando o primeiro usuário do sistema.
            </p>
          </CardContent>
        </Card>
      )}

      <CreateUserDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
      />
    </div>
  )
}
