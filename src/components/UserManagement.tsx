
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Plus } from "lucide-react"
import { useProfiles, useUpdateProfile } from "@/hooks/useProfiles"
import { useUnits } from "@/hooks/useUnits"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

export function UserManagement() {
  const { data: profiles = [], refetch } = useProfiles()
  const { data: units = [] } = useUnits()
  const updateProfileMutation = useUpdateProfile()
  const { toast } = useToast()
  
  const [editingUser, setEditingUser] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    try {
      await updateProfileMutation.mutateAsync({
        id: editingUser.id,
        name: editingUser.name,
        role: editingUser.role,
        unit_id: editingUser.unit_id,
        status: editingUser.status
      })
      setIsDialogOpen(false)
      setEditingUser(null)
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
    }
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: "destructive",
      technician: "default", 
      user: "secondary"
    } as const
    
    const labels = {
      admin: "Administrador",
      technician: "Técnico",
      user: "Usuário"
    }
    
    return <Badge variant={variants[role as keyof typeof variants]}>{labels[role as keyof typeof labels]}</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Usuários</CardTitle>
        <CardDescription>
          Gerencie os usuários do sistema e suas permissões.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Usuários Cadastrados</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </div>
          
          <div className="space-y-2">
            {profiles.map((profile) => (
              <div key={profile.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{profile.name}</div>
                  <div className="text-sm text-muted-foreground">{profile.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  {getRoleBadge(profile.role)}
                  <Dialog open={isDialogOpen && editingUser?.id === profile.id} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setEditingUser(profile)
                          setIsDialogOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Usuário</DialogTitle>
                        <DialogDescription>
                          Atualize as informações do usuário.
                        </DialogDescription>
                      </DialogHeader>
                      {editingUser && (
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                          <div>
                            <Label htmlFor="name">Nome</Label>
                            <Input
                              id="name"
                              value={editingUser.name}
                              onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="role">Função</Label>
                            <Select value={editingUser.role} onValueChange={(value) => setEditingUser({...editingUser, role: value})}>
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
                            <Label htmlFor="unit">Unidade</Label>
                            <Select value={editingUser.unit_id || ""} onValueChange={(value) => setEditingUser({...editingUser, unit_id: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma unidade" />
                              </SelectTrigger>
                              <SelectContent>
                                {units.map((unit) => (
                                  <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                              Cancelar
                            </Button>
                            <Button type="submit" disabled={updateProfileMutation.isPending}>
                              {updateProfileMutation.isPending ? "Salvando..." : "Salvar"}
                            </Button>
                          </DialogFooter>
                        </form>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
