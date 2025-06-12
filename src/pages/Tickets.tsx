
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Edit, Trash2, Plus } from "lucide-react"

interface Ticket {
  id: string
  title: string
  description: string
  priority: "Baixa" | "Média" | "Alta" | "Crítica"
  status: "Aberto" | "Em Andamento" | "Aguardando" | "Fechado"
  category: "Hardware" | "Software" | "Rede" | "Acesso" | "Outros"
  requesterId: string
  requesterName: string
  unit: string
  assigneeId?: string
  assigneeName?: string
  createdAt: string
  updatedAt: string
}

interface User {
  id: string
  name: string
  email: string
  role: "admin" | "user" | "technician"
  unit: string
}

interface Unit {
  id: string
  name: string
}

const mockUsers: User[] = [
  { id: "1", name: "João Silva", email: "joao@empresa.com", role: "user", unit: "Matriz São Paulo" },
  { id: "2", name: "Maria Santos", email: "maria@empresa.com", role: "user", unit: "Filial Rio de Janeiro" },
  { id: "3", name: "Carlos Tech", email: "carlos@empresa.com", role: "technician", unit: "TI" },
  { id: "4", name: "Ana Tech", email: "ana@empresa.com", role: "technician", unit: "TI" },
]

const mockTickets: Ticket[] = [
  {
    id: "TK-001",
    title: "Computador não liga",
    description: "O computador da estação 15 não está ligando após queda de energia",
    priority: "Alta",
    status: "Aberto",
    category: "Hardware",
    requesterId: "1",
    requesterName: "João Silva",
    unit: "Matriz São Paulo",
    createdAt: "2024-06-10",
    updatedAt: "2024-06-10"
  },
  {
    id: "TK-002",
    title: "Acesso ao sistema ERP",
    description: "Não consigo acessar o sistema ERP, recebo erro de autenticação",
    priority: "Média",
    status: "Em Andamento",
    category: "Acesso",
    requesterId: "2",
    requesterName: "Maria Santos",
    unit: "Filial Rio de Janeiro",
    assigneeId: "3",
    assigneeName: "Carlos Tech",
    createdAt: "2024-06-09",
    updatedAt: "2024-06-10"
  }
]

const units: Unit[] = [
  { id: "1", name: "Matriz São Paulo" },
  { id: "2", name: "Filial Rio de Janeiro" }
]

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets)
  const [users] = useState<User[]>(mockUsers)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)
  const { toast } = useToast()

  const technicians = users.filter(user => user.role === "technician")
  const systemUsers = users.filter(user => user.role === "user")

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Crítica": return "bg-red-100 text-red-800 border-red-200"
      case "Alta": return "bg-orange-100 text-orange-800 border-orange-200"
      case "Média": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Baixa": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aberto": return "bg-red-100 text-red-800 border-red-200"
      case "Em Andamento": return "bg-blue-100 text-blue-800 border-blue-200"
      case "Aguardando": return "bg-purple-100 text-purple-800 border-purple-200"
      case "Fechado": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    const requesterId = formData.get('requesterId') as string
    const requester = systemUsers.find(u => u.id === requesterId)
    const assigneeId = formData.get('assigneeId') as string
    const assignee = assigneeId ? technicians.find(t => t.id === assigneeId) : undefined

    const ticketData: Ticket = {
      id: editingTicket?.id || `TK-${String(tickets.length + 1).padStart(3, '0')}`,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      priority: formData.get('priority') as any,
      status: formData.get('status') as any || "Aberto",
      category: formData.get('category') as any,
      requesterId: requesterId,
      requesterName: requester?.name || "",
      unit: formData.get('unit') as string,
      assigneeId: assigneeId || undefined,
      assigneeName: assignee?.name || undefined,
      createdAt: editingTicket?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    }

    if (editingTicket) {
      setTickets(tickets.map(t => t.id === editingTicket.id ? ticketData : t))
      toast({
        title: "Chamado atualizado com sucesso!",
        description: `Chamado ${ticketData.id} foi atualizado.`,
      })
    } else {
      setTickets([ticketData, ...tickets])
      toast({
        title: "Chamado criado com sucesso!",
        description: `Chamado ${ticketData.id} foi criado e está aguardando atendimento.`,
      })
    }

    setIsDialogOpen(false)
    setEditingTicket(null)
  }

  const handleEdit = (ticket: Ticket) => {
    setEditingTicket(ticket)
    setIsDialogOpen(true)
  }

  const handleStatusChange = (ticketId: string, newStatus: Ticket['status']) => {
    setTickets(tickets.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, status: newStatus, updatedAt: new Date().toISOString().split('T')[0] }
        : ticket
    ))
    toast({
      title: "Status atualizado!",
      description: `Status do chamado ${ticketId} alterado para ${newStatus}.`,
    })
  }

  const handleAssignTechnician = (ticketId: string, technicianId: string) => {
    const technician = technicians.find(t => t.id === technicianId)
    setTickets(tickets.map(ticket => 
      ticket.id === ticketId 
        ? { 
            ...ticket, 
            assigneeId: technicianId, 
            assigneeName: technician?.name,
            status: "Em Andamento",
            updatedAt: new Date().toISOString().split('T')[0]
          }
        : ticket
    ))
    toast({
      title: "Técnico atribuído!",
      description: `Chamado ${ticketId} atribuído para ${technician?.name}.`,
    })
  }

  const openCreateDialog = () => {
    setEditingTicket(null)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Chamados</h2>
          <p className="text-muted-foreground">
            Gerencie todos os chamados de suporte
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={openCreateDialog}
              className="bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Chamado
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingTicket ? "Editar Chamado" : "Criar Novo Chamado"}
              </DialogTitle>
              <DialogDescription>
                {editingTicket ? "Modifique as informações do chamado" : "Preencha as informações do chamado de suporte"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    placeholder="Descreva brevemente o problema"
                    defaultValue={editingTicket?.title || ""}
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    placeholder="Descreva detalhadamente o problema"
                    defaultValue={editingTicket?.description || ""}
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select name="priority" defaultValue={editingTicket?.priority || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baixa">Baixa</SelectItem>
                        <SelectItem value="Média">Média</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Crítica">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select name="category" defaultValue={editingTicket?.category || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hardware">Hardware</SelectItem>
                        <SelectItem value="Software">Software</SelectItem>
                        <SelectItem value="Rede">Rede</SelectItem>
                        <SelectItem value="Acesso">Acesso</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="requesterId">Solicitante</Label>
                    <Select name="requesterId" defaultValue={editingTicket?.requesterId || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o solicitante" />
                      </SelectTrigger>
                      <SelectContent>
                        {systemUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} - {user.unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="unit">Unidade</Label>
                    <Select name="unit" defaultValue={editingTicket?.unit || ""}>
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

                {editingTicket && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select name="status" defaultValue={editingTicket?.status || ""}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Aberto">Aberto</SelectItem>
                          <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                          <SelectItem value="Aguardando">Aguardando</SelectItem>
                          <SelectItem value="Fechado">Fechado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="assigneeId">Técnico Responsável</Label>
                      <Select name="assigneeId" defaultValue={editingTicket?.assigneeId || "none"}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um técnico" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {technicians.map((tech) => (
                            <SelectItem key={tech.id} value={tech.id}>
                              {tech.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className="bg-green-100 text-green-800 hover:bg-green-200 border border-green-200"
                >
                  {editingTicket ? "Atualizar" : "Criar"} Chamado
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Chamados</CardTitle>
          <CardDescription>
            Todos os chamados de suporte ordenados por data de criação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Técnico</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">{ticket.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{ticket.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {ticket.description.length > 50 
                          ? `${ticket.description.substring(0, 50)}...` 
                          : ticket.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{ticket.requesterName}</TableCell>
                  <TableCell>{ticket.unit}</TableCell>
                  <TableCell>{ticket.category}</TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={ticket.status} 
                      onValueChange={(value) => handleStatusChange(ticket.id, value as Ticket['status'])}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aberto">Aberto</SelectItem>
                        <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                        <SelectItem value="Aguardando">Aguardando</SelectItem>
                        <SelectItem value="Fechado">Fechado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={ticket.assigneeId || "none"} 
                      onValueChange={(value) => value !== "none" && handleAssignTechnician(ticket.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Atribuir" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {technicians.map((tech) => (
                          <SelectItem key={tech.id} value={tech.id}>
                            {tech.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(ticket)}
                        className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                      >
                        <Edit className="h-4 w-4" />
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
