
import { UserDashboardStats } from "@/components/UserDashboardStats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, FileText, Laptop } from "lucide-react"
import { useUserTickets } from "@/hooks/useUserTickets"
import { useUserAssignments } from "@/hooks/useUserAssignments"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function UserDashboard() {
  const { data: tickets = [], isLoading: ticketsLoading } = useUserTickets()
  const { data: assignments = [], isLoading: assignmentsLoading } = useUserAssignments()

  const recentTickets = tickets
    .filter(ticket => ticket.status !== 'fechado')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const recentAssignments = assignments
    .filter(assignment => assignment.status === 'ativo')
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
    .slice(0, 5)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberto':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'em_andamento':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'fechado':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
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
      case 'fechado':
        return 'Fechado'
      default:
        return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'baixa':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'media':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'alta':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'baixa':
        return 'Baixa'
      case 'media':
        return 'Média'
      case 'alta':
        return 'Alta'
      default:
        return priority
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Visão geral dos seus chamados e equipamentos
        </p>
      </div>

      {/* Estatísticas */}
      <UserDashboardStats />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Chamados Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Chamados Recentes
            </CardTitle>
            <CardDescription>
              Seus chamados mais recentes que não foram fechados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ticketsLoading ? (
              <div className="flex justify-center p-4">
                <div className="text-muted-foreground">Carregando...</div>
              </div>
            ) : recentTickets.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum chamado encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">#{ticket.ticket_number}</span>
                        <Badge className={getStatusColor(ticket.status)}>
                          {getStatusLabel(ticket.status)}
                        </Badge>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {getPriorityLabel(ticket.priority)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {ticket.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(ticket.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Equipamentos Ativos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Laptop className="h-5 w-5" />
              Equipamentos Ativos
            </CardTitle>
            <CardDescription>
              Equipamentos atualmente atribuídos a você
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assignmentsLoading ? (
              <div className="flex justify-center p-4">
                <div className="text-muted-foreground">Carregando...</div>
              </div>
            ) : recentAssignments.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <Laptop className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum equipamento atribuído</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAssignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {assignment.equipment?.name || 'Equipamento não encontrado'}
                        </span>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Ativo
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {assignment.equipment?.type} - {assignment.equipment?.brand} {assignment.equipment?.model}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Desde {format(new Date(assignment.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
