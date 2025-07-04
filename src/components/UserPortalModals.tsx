
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
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
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] flex flex-col bg-card border-border">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-foreground">Chamados Abertos ({tickets.length})</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Detalhes dos seus chamados que estão em aberto
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título ou descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background border-border text-foreground"
              />
            </div>
            <div className="flex gap-2 sm:gap-4">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-background border-border text-foreground">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-background border-border text-foreground">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="hardware">Hardware</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="rede">Rede</SelectItem>
                  <SelectItem value="acesso">Acesso</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border border-border overflow-hidden flex-1 bg-card">
            <ScrollArea className="h-full max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-muted/50">
                    <TableHead className="text-muted-foreground">ID</TableHead>
                    <TableHead className="text-muted-foreground">Título</TableHead>
                    <TableHead className="hidden sm:table-cell text-muted-foreground">Categoria</TableHead>
                    <TableHead className="text-muted-foreground">Prioridade</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="hidden lg:table-cell text-muted-foreground">Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id} className="border-border hover:bg-muted/50">
                      <TableCell className="font-medium text-foreground">#{ticket.ticket_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-foreground text-sm">{ticket.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {ticket.description.length > 40 
                              ? `${ticket.description.substring(0, 40)}...` 
                              : ticket.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{getCategoryLabel(ticket.category)}</TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(ticket.priority) as any} className="text-xs">
                          {getPriorityLabel(ticket.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="text-xs">
                          {getStatusLabel(ticket.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          {filteredTickets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
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
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] flex flex-col bg-card border-border">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-foreground">Chamados Fechados ({tickets.length})</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Histórico dos seus chamados resolvidos
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background border-border text-foreground"
            />
          </div>

          <div className="rounded-md border border-border overflow-hidden flex-1 bg-card">
            <ScrollArea className="h-full max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-muted/50">
                    <TableHead className="text-muted-foreground">ID</TableHead>
                    <TableHead className="text-muted-foreground">Título</TableHead>
                    <TableHead className="hidden sm:table-cell text-muted-foreground">Categoria</TableHead>
                    <TableHead className="text-muted-foreground">Prioridade</TableHead>
                    <TableHead className="text-muted-foreground">Criado em</TableHead>
                    <TableHead className="hidden lg:table-cell text-muted-foreground">Fechado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id} className="border-border hover:bg-muted/50">
                      <TableCell className="font-medium text-foreground">#{ticket.ticket_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-foreground text-sm">{ticket.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {ticket.description.length > 40 
                              ? `${ticket.description.substring(0, 40)}...` 
                              : ticket.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{ticket.category}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{ticket.priority}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{new Date(ticket.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {ticket.updated_at ? new Date(ticket.updated_at).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          {filteredTickets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
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
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] flex flex-col bg-card border-border">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-foreground">Equipamentos Ativos ({assignments.length})</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Equipamentos que você está utilizando atualmente
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou tipo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background border-border text-foreground"
            />
          </div>

          <div className="rounded-md border border-border overflow-hidden flex-1 bg-card">
            <ScrollArea className="h-full max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-muted/50">
                    <TableHead className="text-muted-foreground">Equipamento</TableHead>
                    <TableHead className="hidden sm:table-cell text-muted-foreground">Tipo</TableHead>
                    <TableHead className="hidden md:table-cell text-muted-foreground">Marca/Modelo</TableHead>
                    <TableHead className="hidden lg:table-cell text-muted-foreground">Série</TableHead>
                    <TableHead className="text-muted-foreground">Data de Início</TableHead>
                    <TableHead className="hidden xl:table-cell text-muted-foreground">Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id} className="border-border hover:bg-muted/50">
                      <TableCell className="font-medium text-foreground">{assignment.equipment.name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{assignment.equipment.type}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {assignment.equipment.brand && assignment.equipment.model 
                          ? `${assignment.equipment.brand} ${assignment.equipment.model}`
                          : assignment.equipment.brand || assignment.equipment.model || '-'
                        }
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{assignment.equipment.serial_number || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(assignment.start_date).toLocaleDateString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="text-sm text-muted-foreground">
                          {assignment.notes ? assignment.notes.substring(0, 30) + '...' : 'Sem observações'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          {filteredAssignments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
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
      <DialogContent className="w-[95vw] max-w-5xl max-h-[85vh] flex flex-col bg-card border-border">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-foreground">Histórico de Atribuições ({assignments.length})</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Todos os equipamentos que você já utilizou
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou tipo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background border-border text-foreground"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-background border-border text-foreground">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border border-border overflow-hidden flex-1 bg-card">
            <ScrollArea className="h-full max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-muted/50">
                    <TableHead className="text-muted-foreground">Equipamento</TableHead>
                    <TableHead className="hidden sm:table-cell text-muted-foreground">Tipo</TableHead>
                    <TableHead className="hidden md:table-cell text-muted-foreground">Marca/Modelo</TableHead>
                    <TableHead className="text-muted-foreground">Data de Início</TableHead>
                    <TableHead className="hidden lg:table-cell text-muted-foreground">Data de Fim</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="hidden xl:table-cell text-muted-foreground">Duração</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((assignment) => {
                    const startDate = new Date(assignment.start_date)
                    const endDate = assignment.end_date ? new Date(assignment.end_date) : new Date()
                    const durationDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                    
                    return (
                      <TableRow key={assignment.id} className="border-border hover:bg-muted/50">
                        <TableCell className="font-medium text-foreground">{assignment.equipment.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{assignment.equipment.type}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {assignment.equipment.brand && assignment.equipment.model 
                            ? `${assignment.equipment.brand} ${assignment.equipment.model}`
                            : assignment.equipment.brand || assignment.equipment.model || '-'
                          }
                        </TableCell>
                        <TableCell className="text-muted-foreground">{startDate.toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {assignment.end_date 
                            ? new Date(assignment.end_date).toLocaleDateString('pt-BR') 
                            : "-"
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant={assignment.status === 'ativo' ? 'default' : 'secondary'} className="text-xs">
                            {assignment.status === 'ativo' ? 'Ativo' : 'Finalizado'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-muted-foreground">
                          {durationDays} {durationDays === 1 ? 'dia' : 'dias'}
                          {assignment.status === 'ativo' && ' (em uso)'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          {filteredAssignments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma atribuição encontrada
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
