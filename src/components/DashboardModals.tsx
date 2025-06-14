
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTickets } from "@/hooks/useTickets"
import { useEquipment } from "@/hooks/useEquipment"
import { useProfiles } from "@/hooks/useProfiles"
import { Search, Calendar, Clock, User, Computer } from "lucide-react"

interface DashboardOpenTicketsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DashboardOpenTicketsModal({ open, onOpenChange }: DashboardOpenTicketsModalProps) {
  const { data: tickets = [] } = useTickets()
  const [search, setSearch] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const openTickets = tickets.filter(t => t.status !== "fechado")
  
  const filteredTickets = openTickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(search.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(search.toLowerCase())
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
    return matchesSearch && matchesPriority && matchesStatus
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

  // Estatísticas rápidas
  const priorityStats = {
    critica: openTickets.filter(t => t.priority === "critica").length,
    alta: openTickets.filter(t => t.priority === "alta").length,
    media: openTickets.filter(t => t.priority === "media").length,
    baixa: openTickets.filter(t => t.priority === "baixa").length,
  }

  const statusStats = {
    aberto: openTickets.filter(t => t.status === "aberto").length,
    em_andamento: openTickets.filter(t => t.status === "em_andamento").length,
    aguardando: openTickets.filter(t => t.status === "aguardando").length,
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-700">Chamados Abertos ({openTickets.length})</DialogTitle>
          <DialogDescription className="text-slate-600">
            Visão detalhada de todos os chamados em aberto no sistema
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estatísticas Rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Por Prioridade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Crítica:</span>
                  <Badge variant="destructive" className="text-xs">{priorityStats.critica}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Alta:</span>
                  <Badge variant="destructive" className="text-xs">{priorityStats.alta}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Média:</span>
                  <Badge variant="default" className="text-xs">{priorityStats.media}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Baixa:</span>
                  <Badge variant="secondary" className="text-xs">{priorityStats.baixa}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Por Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Aberto:</span>
                  <Badge variant="destructive" className="text-xs">{statusStats.aberto}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Em Andamento:</span>
                  <Badge variant="default" className="text-xs">{statusStats.em_andamento}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Aguardando:</span>
                  <Badge variant="secondary" className="text-xs">{statusStats.aguardando}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="aberto">Aberto</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="aguardando">Aguardando</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Responsável</TableHead>
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
                        {ticket.description.length > 40 
                          ? `${ticket.description.substring(0, 40)}...` 
                          : ticket.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4 text-slate-400" />
                      {ticket.requester?.name || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>{ticket.unit?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(ticket.priority) as any}>
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(ticket.status) as any}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </TableCell>
                  <TableCell>{ticket.assignee?.name || 'Não atribuído'}</TableCell>
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

interface DashboardEquipmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DashboardEquipmentModal({ open, onOpenChange }: DashboardEquipmentModalProps) {
  const { data: equipment = [] } = useEquipment()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                         (item.type && item.type.toLowerCase().includes(search.toLowerCase())) ||
                         (item.brand && item.brand.toLowerCase().includes(search.toLowerCase()))
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    const matchesType = typeFilter === "all" || item.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "disponivel": return "default"
      case "em_uso": return "secondary"
      case "manutencao": return "destructive"
      case "descartado": return "outline"
      default: return "default"
    }
  }

  const statusStats = {
    disponivel: equipment.filter(e => e.status === "disponivel").length,
    em_uso: equipment.filter(e => e.status === "em_uso").length,
    manutencao: equipment.filter(e => e.status === "manutencao").length,
    descartado: equipment.filter(e => e.status === "descartado").length,
  }

  const uniqueTypes = [...new Set(equipment.map(e => e.type).filter(Boolean))]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-700">Equipamentos ({equipment.length})</DialogTitle>
          <DialogDescription className="text-slate-600">
            Visão detalhada de todos os equipamentos do sistema
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estatísticas por Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Disponível</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{statusStats.disponivel}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Em Uso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{statusStats.em_uso}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Manutenção</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{statusStats.manutencao}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Descartado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{statusStats.descartado}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome, tipo ou marca..."
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
                <SelectItem value="disponivel">Disponível</SelectItem>
                <SelectItem value="em_uso">Em Uso</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
                <SelectItem value="descartado">Descartado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {uniqueTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tombamento</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Marca/Modelo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipment.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.tombamento || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Computer className="h-4 w-4 text-slate-400" />
                      {item.name}
                    </div>
                  </TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>
                    {item.brand && item.model 
                      ? `${item.brand} ${item.model}`
                      : item.brand || item.model || '-'
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(item.status) as any}>
                      {item.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.location || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredEquipment.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              Nenhum equipamento encontrado com os filtros aplicados
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface DashboardUsersModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DashboardUsersModal({ open, onOpenChange }: DashboardUsersModalProps) {
  const { data: users = [] } = useProfiles()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  const activeUsers = users.filter(user => user.status === 'ativo')
  
  const filteredUsers = activeUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) ||
                         user.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const roleStats = {
    admin: activeUsers.filter(u => u.role === "admin").length,
    user: activeUsers.filter(u => u.role === "user").length,
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-700">Usuários Ativos ({activeUsers.length})</DialogTitle>
          <DialogDescription className="text-slate-600">
            Lista de todos os usuários ativos no sistema
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estatísticas por Papel */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Administradores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{roleStats.admin}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{roleStats.user}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">Usuário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4 text-slate-400" />
                      {user.name}
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.unit_id ? 'Sim' : 'Não definida'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              Nenhum usuário encontrado com os filtros aplicados
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
