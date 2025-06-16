
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Ticket {
  id: string
  ticket_number: number
  title: string
  description: string
  priority: string
  status: string
  category: string
  requester: {
    name: string
    phone?: string
  }
  assignee?: {
    name: string
  }
  unit_id: string
  created_at: string
  updated_at: string
  resolved_at: string | null
}

interface TicketDetailsProps {
  ticket: Ticket
}

const priorityColors = {
  'baixa': 'bg-green-100 text-green-800',
  'media': 'bg-yellow-100 text-yellow-800',
  'alta': 'bg-orange-100 text-orange-800',
  'critica': 'bg-red-100 text-red-800'
}

const statusColors = {
  'aberto': 'bg-blue-100 text-blue-800',
  'em_andamento': 'bg-purple-100 text-purple-800',
  'aguardando': 'bg-yellow-100 text-yellow-800',
  'fechado': 'bg-green-100 text-green-800'
}

export function TicketDetails({ ticket }: TicketDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="font-medium">Título:</span>
              <p className="text-sm text-muted-foreground mt-1">{ticket.title}</p>
            </div>
            
            <div>
              <span className="font-medium">Prioridade:</span>
              <div className="mt-1">
                <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                  {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                </Badge>
              </div>
            </div>

            <div>
              <span className="font-medium">Status:</span>
              <div className="mt-1">
                <Badge className={statusColors[ticket.status as keyof typeof statusColors]}>
                  {ticket.status.replace('_', ' ').charAt(0).toUpperCase() + ticket.status.replace('_', ' ').slice(1)}
                </Badge>
              </div>
            </div>

            <div>
              <span className="font-medium">Categoria:</span>
              <p className="text-sm text-muted-foreground mt-1">
                {ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Responsáveis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="font-medium">Solicitante:</span>
              <p className="text-sm text-muted-foreground mt-1">{ticket.requester.name}</p>
              {ticket.requester.phone && (
                <p className="text-sm text-muted-foreground">📱 {ticket.requester.phone}</p>
              )}
            </div>

            {ticket.assignee && (
              <div>
                <span className="font-medium">Técnico Responsável:</span>
                <p className="text-sm text-muted-foreground mt-1">{ticket.assignee.name}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Descrição</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cronologia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Criado em:</span>
            <span className="text-muted-foreground">
              {format(new Date(ticket.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="font-medium">Última atualização:</span>
            <span className="text-muted-foreground">
              {format(new Date(ticket.updated_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </span>
          </div>

          {ticket.resolved_at && (
            <div className="flex justify-between text-sm">
              <span className="font-medium">Resolvido em:</span>
              <span className="text-muted-foreground">
                {format(new Date(ticket.resolved_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
