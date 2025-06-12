
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

interface Ticket {
  id: string
  title: string
  description: string
  priority: "Baixa" | "Média" | "Alta" | "Crítica"
  status: "Aberto" | "Em Andamento" | "Aguardando" | "Fechado"
  category: "Hardware" | "Software" | "Rede" | "Acesso" | "Outros"
  requester: string
  unit: string
  assignee?: string
  createdAt: string
  updatedAt: string
}

const mockTickets: Ticket[] = [
  {
    id: "TK-001",
    title: "Computador não liga",
    description: "O computador da estação 15 não está ligando após queda de energia",
    priority: "Alta",
    status: "Aberto",
    category: "Hardware",
    requester: "João Silva",
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
    requester: "Maria Santos",
    unit: "Filial Rio de Janeiro",
    assignee: "Carlos Tech",
    createdAt: "2024-06-09",
    updatedAt: "2024-06-10"
  },
  {
    id: "TK-003",
    title: "Internet lenta",
    description: "A internet está muito lenta no setor financeiro",
    priority: "Baixa",
    status: "Aguardando",
    category: "Rede",
    requester: "Ana Costa",
    unit: "Matriz São Paulo",
    createdAt: "2024-06-08",
    updatedAt: "2024-06-09"
  }
]

const units = [
  { id: "1", name: "Matriz São Paulo" },
  { id: "2", name: "Filial Rio de Janeiro" }
]

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    const newTicket: Ticket = {
      id: `TK-${String(tickets.length + 1).padStart(3, '0')}`,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      priority: formData.get('priority') as any,
      status: "Aberto",
      category: formData.get('category') as any,
      requester: formData.get('requester') as string,
      unit: formData.get('unit') as string,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    }

    setTickets([newTicket, ...tickets])
    setIsDialogOpen(false)
    toast({
      title: "Chamado criado com sucesso!",
      description: `Chamado ${newTicket.id} foi criado e está aguardando atendimento.`,
    })
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
            <Button>Novo Chamado</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Criar Novo Chamado</DialogTitle>
              <DialogDescription>
                Preencha as informações do chamado de suporte
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
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    placeholder="Descreva detalhadamente o problema"
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select name="priority" required>
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
                    <Select name="category" required>
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
                    <Label htmlFor="requester">Solicitante</Label>
                    <Input 
                      id="requester" 
                      name="requester" 
                      placeholder="Nome do solicitante"
                      required 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="unit">Unidade</Label>
                    <Select name="unit" required>
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
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar Chamado</Button>
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
                <TableHead>Criado em</TableHead>
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
                  <TableCell>{ticket.requester}</TableCell>
                  <TableCell>{ticket.unit}</TableCell>
                  <TableCell>{ticket.category}</TableCell>
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
                  <TableCell>{ticket.createdAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
