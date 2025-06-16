
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useWhatsAppNotifications } from "@/hooks/useWhatsAppNotifications"
import { Loader2, MessageSquare, CheckCircle, XCircle, Clock } from "lucide-react"

export function WhatsAppLogsSection() {
  const { data: notifications, isLoading } = useWhatsAppNotifications()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'sent':
        return 'default'
      case 'failed':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sent':
        return 'Enviado'
      case 'failed':
        return 'Falhou'
      default:
        return 'Pendente'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Logs de Notificações WhatsApp
        </CardTitle>
        <CardDescription>
          Histórico de mensagens enviadas via WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!notifications || notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma notificação WhatsApp encontrada
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Chamado</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Data de Envio</TableHead>
                <TableHead>Erro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(notification.status)}
                      <Badge variant={getStatusVariant(notification.status)}>
                        {getStatusLabel(notification.status)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {notification.ticket ? (
                      <div>
                        <div className="font-medium">#{notification.ticket.ticket_number}</div>
                        <div className="text-sm text-muted-foreground">
                          {notification.ticket.title}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {notification.user?.name || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono">
                    {notification.phone_number}
                  </TableCell>
                  <TableCell>
                    {notification.sent_at ? (
                      new Date(notification.sent_at).toLocaleString('pt-BR')
                    ) : (
                      <span className="text-muted-foreground">Não enviado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {notification.error_message ? (
                      <div className="text-sm text-red-600 max-w-xs truncate" title={notification.error_message}>
                        {notification.error_message}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
