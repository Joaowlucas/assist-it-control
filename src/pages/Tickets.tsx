import { useState, useMemo } from "react"
import { useTickets } from "@/hooks/useTickets"
import { useAuth } from "@/hooks/useAuth"
import { useProfiles } from "@/hooks/useProfiles"
import { useUnits } from "@/hooks/useUnits"
import { useUpdateTicketStatus, useAssignTicket } from "@/hooks/useTicketStatus"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Clock, User, AlertTriangle, CheckCircle, XCircle, Plus, Filter, Users, Calendar } from "lucide-react"
import { CreateTicketDialog } from "@/components/CreateTicketDialog"
import { TicketDetailsDialog } from "@/components/TicketDetailsDialog"
import { TicketFilters } from "@/components/TicketFilters"
import { useToast } from "@/hooks/use-toast"
import { useTechnicianUnits } from "@/hooks/useTechnicianUnits"

export default function Tickets() {
  const { profile } = useAuth()
  const { data: tickets = [], isLoading } = useTickets()
  const { data: profiles = [] } = useProfiles()
  const { data: units = [] } = useUnits()
  const { data: technicianUnits = [] } = useTechnicianUnits(profile?.id)
  const { toast } = useToast()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    assignee: '',
    unit: '',
    dateRange: { from: undefined, to: undefined }
  })

  const updateTicketStatus = useUpdateTicketStatus()
  const assignTicket = useAssignTicket()

  // Técnicos que podem ser atribuídos aos chamados
  const technicians = useMemo(() => {
    return profiles.filter(profile => 
      profile.role === 'admin' || profile.role === 'technician'
    )
  }, [profiles])

  // Determinar se o usuário pode editar um chamado
  const canEditTicket = (ticket: any) => {
    if (profile?.role === 'admin') return true
    if (profile?.role === 'technician') {
      // Técnico pode editar chamados atribuídos a ele ou chamados das suas unidades
      const technicianUnitIds = technicianUnits.map(tu => tu.unit_id)
      return ticket.assignee_id === profile.id || technicianUnitIds.includes(ticket.unit_id)
    }
    return false
  }

  // Determinar se o usuário pode se auto-atribuir
  const canAssignToSelf = (ticket: any) => {
    if (profile?.role === 'admin' || profile?.role === 'technician') {
      // Verificar se técnico atende a unidade do chamado
      if (profile.role === 'technician') {
        const technicianUnitIds = technicianUnits.map(tu => tu.unit_id)
        return technicianUnitIds.includes(ticket.unit_id)
      }
      return true
    }
    return false
  }

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      await updateTicketStatus.mutateAsync({ 
        id: ticketId, 
        status: newStatus as any 
      })
    } catch (error) {
      console.error('Failed to update ticket status:', error)
    }
  }

  const handleAssignTicket = async (ticketId: string, assigneeId: string | null) => {
    try {
      await assignTicket.mutateAsync({ 
        id: ticketId, 
        assigneeId 
      })
    } catch (error) {
      console.error('Failed to assign ticket:', error)
    }
  }

  const handleAssignToSelf = (ticket: any) => {
    if (canAssignToSelf(ticket)) {
      handleAssignTicket(ticket.id, profile!.id)
    }
  }

  const filteredTickets = useMemo(() => {
    let filtered = tickets

    if (filters.status) {
      filtered = filtered.filter(ticket => ticket.status === filters.status)
    }
    if (filters.priority) {
      filtered = filtered.filter(ticket => ticket.priority === filters.priority)
    }
    if (filters.category) {
      filtered = filtered.filter(ticket => ticket.category === filters.category)
    }
    if (filters.assignee) {
      if (filters.assignee === 'unassigned') {
        filtered = filtered.filter(ticket => !ticket.assignee_id)
      } else {
        filtered = filtered.filter(ticket => ticket.assignee_id === filters.assignee)
      }
    }
    if (filters.unit) {
      filtered = filtered.filter(ticket => ticket.unit_id === filters.unit)
    }
    if (filters.dateRange.from) {
      filtered = filtered.filter(ticket => 
        new Date(ticket.created_at) >= filters.dateRange.from!
      )
    }
    if (filters.dateRange.to) {
      filtered = filtered.filter(ticket => 
        new Date(ticket.created_at) <= filters.dateRange.to!
      )
    }

    return filtered
  }, [tickets, filters])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberto': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'em_andamento': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'aguardando': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'fechado': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critica': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'alta': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
      case 'media': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'baixa': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aberto': return <XCircle className="h-4 w-4" />
      case 'em_andamento': return <Clock className="h-4 w-4" />
      case 'aguardando': return <AlertTriangle className="h-4 w-4" />
      case 'fechado': return <CheckCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'aberto': return 'Aberto'
      case 'em_andamento': return 'Em Andamento'
      case 'aguardando': return 'Aguardando'
      case 'fechado': return 'Fechado'
      default: return status
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'critica': return 'Crítica'
      case 'alta': return 'Alta'
      case 'media': return 'Média'
      case 'baixa': return 'Baixa'
      default: return priority
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chamados</h1>
          <p className="text-muted-foreground">
            Gerencie e acompanhe os chamados de suporte
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          
          {(profile?.role === 'admin' || profile?.role === 'technician') && (
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Chamado
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <TicketFilters
          filters={filters}
          onFiltersChange={setFilters}
          units={units}
          technicians={technicians}
        />
      )}

      <div className="grid gap-4">
        {filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum chamado encontrado</h3>
              <p className="text-muted-foreground text-center">
                Não há chamados que correspondam aos filtros selecionados.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">
                        #{ticket.ticket_number} - {ticket.title}
                      </CardTitle>
                      <Badge className={getStatusColor(ticket.status)}>
                        {getStatusIcon(ticket.status)}
                        <span className="ml-1">{getStatusText(ticket.status)}</span>
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {ticket.requester?.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(ticket.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </div>
                      {ticket.unit?.name && (
                        <Badge variant="outline">
                          {ticket.unit.name}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {getPriorityText(ticket.priority)}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {ticket.category}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <CardDescription className="mb-4 line-clamp-2">
                  {ticket.description}
                </CardDescription>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    {canEditTicket(ticket) && (
                      <Select
                        value={ticket.status}
                        onValueChange={(value) => handleStatusChange(ticket.id, value)}
                      >
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aberto">Aberto</SelectItem>
                          <SelectItem value="em_andamento">Em Andamento</SelectItem>
                          <SelectItem value="aguardando">Aguardando</SelectItem>
                          <SelectItem value="fechado">Fechado</SelectItem>
                        </SelectContent>
                      </Select>
                    )}

                    {canEditTicket(ticket) && (
                      <Select
                        value={ticket.assignee_id || ""}
                        onValueChange={(value) => handleAssignTicket(ticket.id, value || null)}
                      >
                        <SelectTrigger className="w-full sm:w-[200px]">
                          <SelectValue placeholder="Sem técnico" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Sem técnico</SelectItem>
                          {technicians.map((tech) => (
                            <SelectItem key={tech.id} value={tech.id}>
                              {tech.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {!ticket.assignee_id && canAssignToSelf(ticket) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAssignToSelf(ticket)}
                        disabled={assignTicket.isPending}
                      >
                        Aceitar Chamado
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {ticket.assignee?.name && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        {ticket.assignee.name}
                      </div>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTicket(ticket)
                        setShowDetailsDialog(true)
                      }}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CreateTicketDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <TicketDetailsDialog
        ticket={selectedTicket}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        units={units}
        technicians={technicians}
      />
    </div>
  )
}
