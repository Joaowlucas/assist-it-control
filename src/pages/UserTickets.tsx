
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useUserTickets } from "@/hooks/useUserTickets"
import { useAuth } from "@/hooks/useAuth"
import { CreateUserTicketDialog } from "@/components/CreateUserTicketDialog"
import { TicketDetailsDialog } from "@/components/TicketDetailsDialog"
import { EditTicketDialog } from "@/components/EditTicketDialog"
import { Plus, Search, Eye, Clock, CheckCircle, AlertCircle, XCircle, Edit } from "lucide-react"
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function UserTickets() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const { profile } = useAuth()
  const { data: tickets = [], isLoading } = useUserTickets()

  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberto':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'em_andamento':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'aguardando':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'fechado':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'cancelado':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aberto':
        return 'Aberto'
      case 'em_andamento':
        return 'Em Andamento'
      case 'aguardando':
        return 'Aguardando'
      case 'fechado':
        return 'Fechado'
      case 'cancelado':
        return 'Cancelado'
      default:
        return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critica':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'alta':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'media':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'baixa':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critica':
        return 'Crítica'
      case 'alta':
        return 'Alta'
      case 'media':
        return 'Média'
      case 'baixa':
        return 'Baixa'
      default:
        return priority
    }
  }

  const handleViewTicket = (ticket: any) => {
    setSelectedTicket(ticket)
    setIsDetailsDialogOpen(true)
  }

  const handleEditTicket = (ticket: any) => {
    setSelectedTicket(ticket)
    setIsEditDialogOpen(true)
  }

  const canEditTicket = (ticket: any) => {
    return ticket.status === 'aberto' || ticket.status === 'em_andamento'
  }

  // Estatísticas dos tickets
  const stats = [
    {
      title: "Total",
      value: tickets.length,
      icon: AlertCircle,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950"
    },
    {
      title: "Abertos",
      value: tickets.filter(t => t.status === 'aberto').length,
      icon: Clock,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950"
    },
    {
      title: "Em Andamento",
      value: tickets.filter(t => t.status === 'em_andamento').length,
      icon: AlertCircle,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950"
    },
    {
      title: "Fechados",
      value: tickets.filter(t => t.status === 'fechado').length,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950"
    }
  ]

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Meus Chamados</h2>
          <p className="text-muted-foreground">
            Acompanhe seus chamados de suporte técnico
          </p>
        </div>
        
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Chamado
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar chamados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Lista de Chamados */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Chamados</CardTitle>
          <CardDescription>
            {filteredTickets.length} de {tickets.length} chamados
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">
                      {ticket.title}
                    </TableCell>
                    <TableCell>{ticket.category}</TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {getPriorityLabel(ticket.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(ticket.status)}>
                        {getStatusLabel(ticket.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewTicket(ticket)}
                          title="Visualizar chamado"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canEditTicket(ticket) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTicket(ticket)}
                            title="Editar chamado"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredTickets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Nenhum chamado encontrado' : 'Nenhum chamado criado ainda'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogos */}
      <CreateUserTicketDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {selectedTicket && (
        <TicketDetailsDialog
          ticket={selectedTicket}
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          units={[]}
          technicians={[]}
        />
      )}

      {selectedTicket && (
        <EditTicketDialog
          ticket={selectedTicket}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}
    </div>
  )
}
