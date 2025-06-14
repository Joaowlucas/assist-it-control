
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserTicket } from "@/hooks/useUserTickets"
import { UserAssignment } from "@/hooks/useUserAssignments"
import { Search, Calendar } from "lucide-react"

interface OpenTicketsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tickets: UserTicket[]
}

export function OpenTicketsModal({ open, onOpenChange, tickets }: OpenTicketsModalProps) {
  const [search, setSearch] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(search.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(search.toLowerCase())
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter
    const matchesCategory = categoryFilter === "all" || ticket.category === categoryFilter
    return matchesSearch && matchesPriority && matchesCategory
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critica": return "destructive"
      case "alta": return "destructive"
      case "media": return "default"
      case "baixa": return "secondary"
      default: return "default"
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "critica": return "Crítica"
      case "alta": return "Alta"
      case "media": return "Média"
      case "baixa": return "Baixa"
      default: return priority
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "hardware": return "Hardware"
      case "software": return "Software"
      case "rede": return "Rede"
      case "acesso": return "Acesso"
      case "outros": return "Outros"
      default: return category
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "aberto": return "Aberto"
      case "em_andamento": return "Em Andamento"
      case "aguardando": return "Aguardando"
      default: return status
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-700">Chamados Abertos ({tickets.length})</DialogTitle>
          <DialogDescription className="text-slate-600">
            Detalhes dos seus chamados que estão em aberto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por título ou descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="hardware">Hardware</SelectItem>
                <SelectItem value="software">Software</SelectItem>
                <SelectItem value="rede">Rede</SelectItem>
                <SelectItem value="acesso">Acesso</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">#{ticket.ticket_number}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{ticket.title}</div>
                      <div className="text-sm text-slate-500">
                        {ticket.description.length > 60 
                          ? `${ticket.description.substring(0, 60)}...` 
                          : ticket.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getCategoryLabel(ticket.category)}</TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(ticket.priority) as any}>
                      {getPriorityLabel(ticket.priority)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">
                      {getStatusLabel(ticket.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredTickets.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              Nenhum chamado encontrado com os filtros aplicados
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface ClosedTicketsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tickets: UserTicket[]
}

export function ClosedTicketsModal({ open, onOpenChange, tickets }: ClosedTicketsModalProps) {
  const [search, setSearch] = useState("")

  const filteredTickets = tickets.filter(ticket => 
    ticket.title.toLowerCase().includes(search.toLowerCase()) ||
    ticket.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-700">Chamados Fechados ({tickets.length})</DialogTitle>
          <DialogDescription className="text-slate-600">
            Histórico dos seus chamados resolvidos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por título ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Fechado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">#{ticket.ticket_number}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{ticket.title}</div>
                      <div className="text-sm text-slate-500">
                        {ticket.description.length > 60 
                          ? `${ticket.description.substring(0, 60)}...` 
                          : ticket.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{ticket.category}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ticket.priority}</Badge>
                  </TableCell>
                  <TableCell>{new Date(ticket.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    {ticket.updated_at ? new Date(ticket.updated_at).toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredTickets.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              Nenhum chamado encontrado
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface ActiveEquipmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignments: UserAssignment[]
}

export function ActiveEquipmentModal({ open, onOpenChange, assignments }: ActiveEquipmentModalProps) {
  const [search, setSearch] = useState("")

  const filteredAssignments = assignments.filter(assignment => 
    assignment.equipment.name.toLowerCase().includes(search.toLowerCase()) ||
    assignment.equipment.type.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-700">Equipamentos Ativos ({assignments.length})</DialogTitle>
          <DialogDescription className="text-slate-600">
            Equipamentos que você está utilizando atualmente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou tipo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipamento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Marca/Modelo</TableHead>
                <TableHead>Série</TableHead>
                <TableHead>Data de Início</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">{assignment.equipment.name}</TableCell>
                  <TableCell>{assignment.equipment.type}</TableCell>
                  <TableCell>
                    {assignment.equipment.brand && assignment.equipment.model 
                      ? `${assignment.equipment.brand} ${assignment.equipment.model}`
                      : assignment.equipment.brand || assignment.equipment.model || '-'
                    }
                  </TableCell>
                  <TableCell>{assignment.equipment.serial_number || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {new Date(assignment.start_date).toLocaleDateString('pt-BR')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-500">
                      {assignment.notes ? assignment.notes.substring(0, 50) + '...' : 'Sem observações'}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredAssignments.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              Nenhum equipamento encontrado
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface AllAssignmentsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignments: UserAssignment[]
}

export function AllAssignmentsModal({ open, onOpenChange, assignments }: AllAssignmentsModalProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.equipment.name.toLowerCase().includes(search.toLowerCase()) ||
                         assignment.equipment.type.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || assignment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-700">Histórico de Atribuições ({assignments.length})</DialogTitle>
          <DialogDescription className="text-slate-600">
            Todos os equipamentos que você já utilizou
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome ou tipo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipamento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Marca/Modelo</TableHead>
                <TableHead>Data de Início</TableHead>
                <TableHead>Data de Fim</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duração</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssignments.map((assignment) => {
                const startDate = new Date(assignment.start_date)
                const endDate = assignment.end_date ? new Date(assignment.end_date) : new Date()
                const durationDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                
                return (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.equipment.name}</TableCell>
                    <TableCell>{assignment.equipment.type}</TableCell>
                    <TableCell>
                      {assignment.equipment.brand && assignment.equipment.model 
                        ? `${assignment.equipment.brand} ${assignment.equipment.model}`
                        : assignment.equipment.brand || assignment.equipment.model || '-'
                      }
                    </TableCell>
                    <TableCell>{startDate.toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      {assignment.end_date 
                        ? new Date(assignment.end_date).toLocaleDateString('pt-BR') 
                        : "-"
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={assignment.status === 'ativo' ? 'default' : 'secondary'}>
                        {assignment.status === 'ativo' ? 'Ativo' : 'Finalizado'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {durationDays} {durationDays === 1 ? 'dia' : 'dias'}
                      {assignment.status === 'ativo' && ' (em uso)'}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {filteredAssignments.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              Nenhuma atribuição encontrada
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
