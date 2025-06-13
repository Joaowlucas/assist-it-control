
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { UserTicket } from "@/hooks/useUserTickets"
import { Edit, Trash2, Search } from "lucide-react"

interface OpenTicketsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tickets: UserTicket[]
  onEditTicket: (ticket: UserTicket) => void
  onDeleteTicket: (ticketId: string) => void
}

export function OpenTicketsModal({ 
  open, 
  onOpenChange, 
  tickets, 
  onEditTicket, 
  onDeleteTicket 
}: OpenTicketsModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberto": return "destructive"
      case "em_andamento": return "default"
      case "aguardando": return "secondary"
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "aberto": return "Aberto"
      case "em_andamento": return "Em Andamento"
      case "aguardando": return "Aguardando"
      default: return status
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

  const canEditOrDelete = (ticket: UserTicket) => {
    return ticket.status === 'aberto'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] bg-slate-50 border-slate-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-700">Chamados Abertos</DialogTitle>
          <DialogDescription className="text-slate-600">
            Seus chamados que ainda estão aguardando resolução
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por título ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 border-slate-300 focus:border-slate-400"
              />
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-[180px] border-slate-300">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Prioridades</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px] border-slate-300">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                <SelectItem value="hardware">Hardware</SelectItem>
                <SelectItem value="software">Software</SelectItem>
                <SelectItem value="rede">Rede</SelectItem>
                <SelectItem value="acesso">Acesso</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          <div className="border border-slate-200 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200">
                  <TableHead className="text-slate-600">ID</TableHead>
                  <TableHead className="text-slate-600">Título</TableHead>
                  <TableHead className="text-slate-600">Categoria</TableHead>
                  <TableHead className="text-slate-600">Prioridade</TableHead>
                  <TableHead className="text-slate-600">Status</TableHead>
                  <TableHead className="text-slate-600">Criado em</TableHead>
                  <TableHead className="text-slate-600">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                      Nenhum chamado encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id} className="border-slate-200">
                      <TableCell className="font-medium text-slate-700">
                        #{ticket.ticket_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-slate-700">{ticket.title}</div>
                          <div className="text-sm text-slate-500">
                            {ticket.description.length > 50 
                              ? `${ticket.description.substring(0, 50)}...` 
                              : ticket.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">{getCategoryLabel(ticket.category)}</TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(ticket.priority) as any}>
                          {getPriorityLabel(ticket.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(ticket.status) as any}>
                          {getStatusLabel(ticket.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {canEditOrDelete(ticket) && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditTicket(ticket)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteTicket(ticket.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="text-sm text-slate-500 text-center">
            Mostrando {filteredTickets.length} de {tickets.length} chamados abertos
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
