
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

interface UserTicket {
  id: string
  title: string
  description: string
  priority: "Baixa" | "Média" | "Alta" | "Crítica"
  status: "Aberto" | "Em Andamento" | "Aguardando" | "Fechado"
  category: "Hardware" | "Software" | "Rede" | "Acesso" | "Outros"
  unit: string
  createdAt: string
  updatedAt: string
}

interface UserAssignment {
  id: string
  equipmentName: string
  equipmentType: string
  startDate: string
  endDate?: string
  status: "Ativo" | "Finalizado"
}

const mockUserTickets: UserTicket[] = [
  {
    id: "TK-001",
    title: "Computador não liga",
    description: "O computador da estação 15 não está ligando após queda de energia",
    priority: "Alta",
    status: "Em Andamento",
    category: "Hardware",
    unit: "Matriz São Paulo",
    createdAt: "2024-06-10",
    updatedAt: "2024-06-10"
  },
  {
    id: "TK-005",
    title: "Problema na impressora",
    description: "A impressora não está funcionando",
    priority: "Média",
    status: "Fechado",
    category: "Hardware",
    unit: "Matriz São Paulo",
    createdAt: "2024-06-08",
    updatedAt: "2024-06-09"
  }
]

const mockUserAssignments: UserAssignment[] = [
  {
    id: "1",
    equipmentName: "Notebook Dell Latitude 5520",
    equipmentType: "Notebook",
    startDate: "2024-01-15",
    status: "Ativo"
  },
  {
    id: "2",
    equipmentName: "Monitor LG 24 polegadas",
    equipmentType: "Monitor",
    startDate: "2024-01-15",
    status: "Ativo"
  },
  {
    id: "3",
    equipmentName: "Notebook HP EliteBook",
    equipmentType: "Notebook",
    startDate: "2023-06-01",
    endDate: "2024-01-10",
    status: "Finalizado"
  }
]

const units = [
  { id: "1", name: "Matriz São Paulo" },
  { id: "2", name: "Filial Rio de Janeiro" }
]

export default function UserPortal() {
  const [tickets, setTickets] = useState<UserTicket[]>(mockUserTickets)
  const [assignments] = useState<UserAssignment[]>(mockUserAssignments)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Crítica": return "destructive"
      case "Alta": return "destructive"
      case "Média": return "default"
      case "Baixa": return "secondary"
      default: return "default"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aberto": return "destructive"
      case "Em Andamento": return "default"
      case "Aguardando": return "secondary"
      case "Fechado": return "outline"
      default: return "default"
    }
  }

  const getAssignmentStatusColor = (status: string) => {
    switch (status) {
      case "Ativo": return "default"
      case "Finalizado": return "secondary"
      default: return "default"
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    const newTicket: UserTicket = {
      id: `TK-${String(tickets.length + 10).padStart(3, '0')}`,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      priority: formData.get('priority') as any,
      status: "Aberto",
      category: formData.get('category') as any,
      unit: formData.get('unit') as string,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    }

    setTickets([newTicket, ...tickets])
    setIsDialogOpen(false)
    toast({
      title: "Chamado criado com sucesso!",
      description: `Seu chamado ${newTicket.id} foi criado e está aguardando atendimento.`,
    })
  }

  const openTickets = tickets.filter(t => t.status !== "Fechado")
  const closedTickets = tickets.filter(t => t.status === "Fechado")
  const activeAssignments = assignments.filter(a => a.status === "Ativo")

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-700">Portal do Usuário</h2>
          <p className="text-slate-500">
            Gerencie seus chamados e visualize seus equipamentos
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-600 hover:bg-slate-700 text-white">Novo Chamado</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-slate-50 border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-slate-700">Criar Novo Chamado</DialogTitle>
              <DialogDescription className="text-slate-600">
                Descreva seu problema e nossa equipe irá ajudá-lo
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="title" className="text-slate-700">Título</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    placeholder="Descreva brevemente o problema"
                    required 
                    className="border-slate-300 focus:border-slate-400"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-slate-700">Descrição</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    placeholder="Descreva detalhadamente o problema"
                    required 
                    className="border-slate-300 focus:border-slate-400"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority" className="text-slate-700">Prioridade</Label>
                    <Select name="priority" required>
                      <SelectTrigger className="border-slate-300">
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
                    <Label htmlFor="category" className="text-slate-700">Categoria</Label>
                    <Select name="category" required>
                      <SelectTrigger className="border-slate-300">
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
                
                <div>
                  <Label htmlFor="unit" className="text-slate-700">Unidade</Label>
                  <Select name="unit" required>
                    <SelectTrigger className="border-slate-300">
                      <SelectValue placeholder="Selecione sua unidade" />
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
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-300 text-slate-700 hover:bg-slate-100">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-slate-600 hover:bg-slate-700 text-white">Criar Chamado</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dashboard Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-100/70 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Chamados Abertos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{openTickets.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-100/70 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Chamados Fechados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{closedTickets.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-100/70 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Equipamentos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{activeAssignments.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-100/70 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Total de Atribuições</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{assignments.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tickets" className="space-y-4">
        <TabsList className="bg-slate-200 border-slate-300">
          <TabsTrigger value="tickets" className="data-[state=active]:bg-slate-100 text-slate-700">Meus Chamados</TabsTrigger>
          <TabsTrigger value="assignments" className="data-[state=active]:bg-slate-100 text-slate-700">Meus Equipamentos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tickets" className="space-y-4">
          <Card className="bg-slate-100/50 border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-700">Histórico de Chamados</CardTitle>
              <CardDescription className="text-slate-600">
                Todos os seus chamados de suporte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200">
                    <TableHead className="text-slate-600">ID</TableHead>
                    <TableHead className="text-slate-600">Título</TableHead>
                    <TableHead className="text-slate-600">Unidade</TableHead>
                    <TableHead className="text-slate-600">Categoria</TableHead>
                    <TableHead className="text-slate-600">Prioridade</TableHead>
                    <TableHead className="text-slate-600">Status</TableHead>
                    <TableHead className="text-slate-600">Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id} className="border-slate-200">
                      <TableCell className="font-medium text-slate-700">{ticket.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-slate-700">{ticket.title}</div>
                          <div className="text-sm text-slate-500">
                            {ticket.description.length > 40 
                              ? `${ticket.description.substring(0, 40)}...` 
                              : ticket.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">{ticket.unit}</TableCell>
                      <TableCell className="text-slate-600">{ticket.category}</TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(ticket.priority) as any}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(ticket.status) as any}>
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">{ticket.createdAt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="assignments" className="space-y-4">
          <Card className="bg-slate-100/50 border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-700">Histórico de Equipamentos</CardTitle>
              <CardDescription className="text-slate-600">
                Todos os equipamentos que você utilizou ou está utilizando
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200">
                    <TableHead className="text-slate-600">Equipamento</TableHead>
                    <TableHead className="text-slate-600">Tipo</TableHead>
                    <TableHead className="text-slate-600">Data de Início</TableHead>
                    <TableHead className="text-slate-600">Data de Fim</TableHead>
                    <TableHead className="text-slate-600">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id} className="border-slate-200">
                      <TableCell className="font-medium text-slate-700">{assignment.equipmentName}</TableCell>
                      <TableCell className="text-slate-600">{assignment.equipmentType}</TableCell>
                      <TableCell className="text-slate-600">{assignment.startDate}</TableCell>
                      <TableCell className="text-slate-600">{assignment.endDate || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={getAssignmentStatusColor(assignment.status) as any}>
                          {assignment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
