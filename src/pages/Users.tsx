import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { User, Edit, Trash2 } from "lucide-react"

interface SystemUser {
  id: string
  name: string
  email: string
  role: "admin" | "user" | "technician"
  unit: string
  status: "Ativo" | "Inativo"
  createdAt: string
}

const mockUsers: SystemUser[] = [
  {
    id: "1",
    name: "Administrador",
    email: "admin@empresa.com",
    role: "admin",
    unit: "Matriz São Paulo",
    status: "Ativo",
    createdAt: "2024-01-15"
  },
  {
    id: "2",
    name: "João Silva",
    email: "user@empresa.com", 
    role: "user",
    unit: "Matriz São Paulo",
    status: "Ativo",
    createdAt: "2024-02-10"
  },
  {
    id: "3",
    name: "Maria Santos",
    email: "maria@empresa.com",
    role: "user", 
    unit: "Filial Rio de Janeiro",
    status: "Ativo",
    createdAt: "2024-03-05"
  },
  {
    id: "4",
    name: "Carlos Tech",
    email: "carlos@empresa.com",
    role: "technician", 
    unit: "TI",
    status: "Ativo",
    createdAt: "2024-03-10"
  },
  {
    id: "5",
    name: "Ana Tech",
    email: "ana@empresa.com",
    role: "technician", 
    unit: "TI",
    status: "Ativo",
    createdAt: "2024-03-15"
  }
]

const units = [
  { id: "1", name: "Matriz São Paulo" },
  { id: "2", name: "Filial Rio de Janeiro" }
]

export default function Users() {
  const [users, setUsers] = useState<SystemUser[]>(mockUsers)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null)
  const { toast } = useToast()

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "destructive"
      case "technician": return "default"
      case "user": return "secondary"
      default: return "default"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Administrador"
      case "technician": return "Técnico"
      case "user": return "Usuário"
      default: return role
    }
  }

  const getStatusColor = (status: string) => {
    return status === "Ativo" ? "default" : "secondary"
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    const userData = {
      id: editingUser?.id || String(users.length + 1),
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as "admin" | "user" | "technician",
      unit: formData.get('unit') as string,
      status: formData.get('status') as "Ativo" | "Inativo",
      createdAt: editingUser?.createdAt || new Date().toISOString().split('T')[0]
    }

    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? userData : u))
      toast({
        title: "Usuário atualizado com sucesso!",
        description: `${userData.name} foi atualizado.`,
      })
    } else {
      setUsers([...users, userData])
      toast({
        title: "Usuário criado com sucesso!",
        description: `${userData.name} foi adicionado ao sistema.`,
      })
    }

    setIsDialogOpen(false)
    setEditingUser(null)
  }

  const handleEdit = (user: SystemUser) => {
    setEditingUser(user)
    setIsDialogOpen(true)
  }

  const handleDelete = (userId: string) => {
    const user = users.find(u => u.id === userId)
    setUsers(users.filter(u => u.id !== userId))
    toast({
      title: "Usuário removido",
      description: `${user?.name} foi removido do sistema.`,
    })
  }

  const openCreateDialog = () => {
    setEditingUser(null)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gerenciamento de Usuários</h2>
          <p className="text-muted-foreground">
            Gerencie os usuários do sistema de suporte
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <User className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Editar Usuário" : "Criar Novo Usuário"}
              </DialogTitle>
              <DialogDescription>
                {editingUser ? "Modifique as informações do usuário" : "Adicione um novo usuário ao sistema"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    placeholder="Nome do usuário"
                    defaultValue={editingUser?.name}
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email"
                    placeholder="usuario@empresa.com"
                    defaultValue={editingUser?.email}
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="role">Função</Label>
                    <Select name="role" defaultValue={editingUser?.role} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuário</SelectItem>
                        <SelectItem value="technician">Técnico</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={editingUser?.status || "Ativo"} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="unit">Unidade</Label>
                  <Select name="unit" defaultValue={editingUser?.unit} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.name}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingUser ? "Atualizar" : "Criar"} Usuário
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dashboard Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.status === "Ativo").length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === "admin").length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Técnicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === "technician").length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === "user").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            Todos os usuários cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleColor(user.role) as any}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.unit}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(user.status) as any}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
