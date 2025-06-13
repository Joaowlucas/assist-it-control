import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TicketFormDialog, TicketFormData } from "@/components/TicketFormDialog"
import { useTickets, useCreateTicket } from "@/hooks/useTickets"
import { useProfiles } from "@/hooks/useProfiles"
import { useAuth } from "@/hooks/useAuth"
import { useUpdateTicketAttachments } from "@/hooks/useUpdateTicketAttachments"
import { TicketFilters } from "@/components/TicketFilters"
import { TicketDetailsDialog } from "@/components/TicketDetailsDialog"
import { AttachmentIcon } from "@/components/AttachmentIcon"
import { QuickAttachmentsModal } from "@/components/QuickAttachmentsModal"
import { useUpdateTicketStatus, useAssignTicket } from "@/hooks/useTicketStatus"
import { Plus, Eye, Clock, User, MapPin } from "lucide-react"
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Tickets() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedTicketForAttachments, setSelectedTicketForAttachments] = useState<any>(null)
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false)
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')

  const { user } = useAuth()
  const { data: tickets = [], isLoading: ticketsLoading, error: ticketsError } = useTickets()
  const { data: profiles = [] } = useProfiles()
  const createTicket = useCreateTicket()
  const updateStatus = useUpdateTicketStatus()
  const assignTicket = useAssignTicket()
  const { addAttachments } = useUpdateTicketAttachments()

  // Filtrar técnicos
  const technicians = profiles.filter(profile => 
    profile.role === 'technician' || profile.role === 'admin'
  )

  // Aplicar filtros
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = !searchTerm || 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.requester?.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter
    const matchesAssignee = assigneeFilter === 'all' || 
      (assigneeFilter === 'unassigned' && !ticket.assignee_id) ||
      ticket.assignee_id === assigneeFilter

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesAssignee
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberto': return 'bg-red-100 text-red-700 border-red-200'
      case 'em_andamento': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'aguardando': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'fechado': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critica': return 'bg-red-100 text-red-700 border-red-200'
      case 'alta': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'media': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'baixa': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const handleCreateTicket = async (data: TicketFormData) => {
    console.log('Creating ticket with data:', data)
    
    try {
      // Primeiro criar o ticket básico
      const ticketData = {
        title: data.title,
        description: data.description,
        priority: data.priority,
        category: data.category,
        requester_id: data.requester_id!,
        unit_id: data.unit_id,
      }

      const createdTicket = await createTicket.mutateAsync(ticketData)
      console.log('Ticket created successfully:', createdTicket)

      // Se há imagens, fazer upload dos anexos
      if (data.images && data.images.length > 0) {
        console.log('Uploading attachments for ticket:', createdTicket.id)
        await addAttachments.mutateAsync({
          ticketId: createdTicket.id,
          images: data.images
        })
        console.log('Attachments uploaded successfully')
      }

      return createdTicket
    } catch (error) {
      console.error('Error in handleCreateTicket:', error)
      throw error
    }
  }

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    await updateStatus.mutateAsync({ id: ticketId, status: newStatus as any })
  }

  const handleAssigneeChange = async (ticketId: string, assigneeId: string) => {
    const actualAssigneeId = assigneeId === 'unassigned' ? null : assigneeId
    await assignTicket.mutateAsync({ id: ticketId, assigneeId: actualAssigneeId })
  }

  const openTicketDetails = (ticket: any) => {
    setSelectedTicket(ticket)
    setIsDetailsDialogOpen(true)
  }

  const openAttachmentsModal = (ticket: any) => {
    setSelectedTicketForAttachments(ticket)
    setIsAttachmentsModalOpen(true)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setCategoryFilter('all')
    setAssigneeFilter('all')
  }

  if (ticketsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando chamados...</div>
      </div>
    )
  }

  if (ticketsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Erro ao carregar chamados: {ticketsError.message}</div>
      </div>
    )
  }

  // Verificar se está carregando criação ou upload de anexos
  const isCreatingTicket = createTicket.isPending || addAttachments.isPending

  return (
    <div className="space-y-4 md:space-y-6 bg-gray-50 min-h-screen p-3 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Chamados</h2>
          <p className="text-gray-600 text-sm md:text-base">
            Gerencie todos os chamados de suporte
          </p>
        </div>
        
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-black text-white hover:bg-gray-800 w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Chamado
        </Button>
      </div>

      {/* Filtros */}
      <TicketFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        assigneeFilter={assigneeFilter}
        onAssigneeFilterChange={setAssigneeFilter}
        onClearFilters={clearFilters}
        technicians={technicians}
      />

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-300"></div>
              <span className="text-xs md:text-sm text-gray-600">Abertos</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900">
              {tickets.filter(t => t.status === 'aberto').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-300"></div>
              <span className="text-xs md:text-sm text-gray-600">Em Andamento</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900">
              {tickets.filter(t => t.status === 'em_andamento').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-300"></div>
              <span className="text-xs md:text-sm text-gray-600">Aguardando</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900">
              {tickets.filter(t => t.status === 'aguardando').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-300"></div>
              <span className="text-xs md:text-sm text-gray-600">Fechados</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900">
              {tickets.filter(t => t.status === 'fechado').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Chamados */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900 text-lg md:text-xl">Lista de Chamados</CardTitle>
          <CardDescription className="text-gray-600">
            {filteredTickets.length} de {tickets.length} chamados
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Tabela para desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="text-gray-700">#</TableHead>
                  <TableHead className="text-gray-700">Título</TableHead>
                  <TableHead className="text-gray-700">Solicitante</TableHead>
                  <TableHead className="text-gray-700">Unidade</TableHead>
                  <TableHead className="text-gray-700">Categoria</TableHead>
                  <TableHead className="text-gray-700">Prioridade</TableHead>
                  <TableHead className="text-gray-700">Status</TableHead>
                  <TableHead className="text-gray-700">Técnico</TableHead>
                  <TableHead className="text-gray-700">Anexos</TableHead>
                  <TableHead className="text-gray-700">Criado</TableHead>
                  <TableHead className="text-gray-700">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id} className="border-gray-200 hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900">#{ticket.ticket_number}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{ticket.title}</div>
                        <div className="text-sm text-gray-600">
                          {ticket.description.length > 50 
                            ? `${ticket.description.substring(0, 50)}...` 
                            : ticket.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{ticket.requester?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{ticket.unit?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-gray-900">{ticket.category}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getPriorityColor(ticket.priority)} capitalize`}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={ticket.status} 
                        onValueChange={(value) => handleStatusChange(ticket.id, value)}
                      >
                        <SelectTrigger className="w-32 bg-white border-gray-300">
                          <Badge className={`${getStatusColor(ticket.status)} capitalize border-0`}>
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aberto">Aberto</SelectItem>
                          <SelectItem value="em_andamento">Em Andamento</SelectItem>
                          <SelectItem value="aguardando">Aguardando</SelectItem>
                          <SelectItem value="fechado">Fechado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={ticket.assignee_id || 'unassigned'} 
                        onValueChange={(value) => handleAssigneeChange(ticket.id, value)}
                      >
                        <SelectTrigger className="w-32 bg-white border-gray-300">
                          <SelectValue placeholder="Atribuir" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Não atribuído</SelectItem>
                          {technicians.map((tech) => (
                            <SelectItem key={tech.id} value={tech.id}>
                              {tech.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <AttachmentIcon
                        count={ticket.attachments_count || 0}
                        onClick={() => openAttachmentsModal(ticket)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {format(new Date(ticket.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openTicketDetails(ticket)}
                        className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Cards para mobile e tablet */}
          <div className="lg:hidden space-y-4 p-4">
            {filteredTickets.map((ticket) => (
              <Card key={ticket.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">#{ticket.ticket_number} - {ticket.title}</h3>
                          <AttachmentIcon
                            count={ticket.attachments_count || 0}
                            onClick={() => openAttachmentsModal(ticket)}
                            className="text-xs"
                          />
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {ticket.description.length > 100 
                            ? `${ticket.description.substring(0, 100)}...` 
                            : ticket.description}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openTicketDetails(ticket)}
                        className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 ml-2"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Solicitante:</span>
                        <div className="font-medium">{ticket.requester?.name}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Unidade:</span>
                        <div className="font-medium">{ticket.unit?.name}</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge className={`${getStatusColor(ticket.status)} capitalize text-xs`}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={`${getPriorityColor(ticket.priority)} capitalize text-xs`}>
                        {ticket.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {ticket.category}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Criado em {format(new Date(ticket.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredTickets.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum chamado encontrado com os filtros aplicados
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Criação de Chamados */}
      <TicketFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        mode="admin"
        onSubmit={handleCreateTicket}
        isLoading={isCreatingTicket}
      />

      {/* Dialog de Detalhes */}
      <TicketDetailsDialog
        ticket={selectedTicket}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        technicians={technicians}
      />

      {/* Modal de Anexos Rápido */}
      <QuickAttachmentsModal
        ticketId={selectedTicketForAttachments?.id || ''}
        ticketNumber={selectedTicketForAttachments?.ticket_number || ''}
        open={isAttachmentsModalOpen}
        onOpenChange={setIsAttachmentsModalOpen}
      />
    </div>
  )
}
