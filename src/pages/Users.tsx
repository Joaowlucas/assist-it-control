
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Plus, Users as UsersIcon, Shield, User, Wrench } from "lucide-react"
import { useProfiles } from "@/hooks/useProfiles"
import { CreateUserDialog } from "@/components/CreateUserDialog"
import { EditUserDialog } from "@/components/EditUserDialog"
import { UserActionsDropdown } from "@/components/UserActionsDropdown"
import { useUnits } from "@/hooks/useUnits"

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  
  const { data: profiles = [], isLoading } = useProfiles()
  const { data: units = [] } = useUnits()

  const filteredProfiles = profiles.filter(profile =>
    profile.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return Shield
      case 'technician':
        return Wrench
      case 'user':
        return User
      default:
        return User
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'technician':
        return 'Técnico'
      case 'user':
        return 'Usuário'
      default:
        return role
    }
  }

  const stats = [
    {
      title: "Total de Usuários",
      value: profiles.length,
      icon: UsersIcon,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950"
    },
    {
      title: "Administradores",
      value: profiles.filter(p => p.role === 'admin').length,
      icon: Shield,
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950"
    },
    {
      title: "Técnicos",
      value: profiles.filter(p => p.role === 'technician').length,
      icon: Wrench,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950"
    },
    {
      title: "Usuários",
      value: profiles.filter(p => p.role === 'user').length,
      icon: User,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950"
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, funções e permissões do sistema
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Lista de usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            Gerencie todos os usuários cadastrados no sistema
          </CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="text-muted-foreground">Carregando usuários...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProfiles.map((profile) => {
                const RoleIcon = getRoleIcon(profile.role)
                return (
                  <div key={profile.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>
                          {profile.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{profile.name}</h3>
                          <Badge className={getRoleColor(profile.role)}>
                            <RoleIcon className="h-3 w-3 mr-1" />
                            {getRoleLabel(profile.role)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                        {profile.unit_id && (
                          <p className="text-xs text-muted-foreground">
                            Unidade: {units.find(u => u.id === profile.unit_id)?.name || 'N/A'}
                          </p>
                        )}
                      </div>
                    </div>
                    <UserActionsDropdown 
                      user={profile}
                    />
                  </div>
                )
              })}
              
              {filteredProfiles.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <UsersIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum usuário encontrado</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateUserDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
      
      {editingUser && (
        <EditUserDialog
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          user={editingUser}
        />
      )}
    </div>
  )
}
