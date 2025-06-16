
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useNotificationLogs } from '@/hooks/useNotificationSettings'
import { useAuth } from '@/hooks/useAuth'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageSquare, CheckCircle, AlertCircle, Clock, Trash2 } from 'lucide-react'

export function NotificationManagementSection() {
  const { user } = useAuth()
  const { data: logs, isLoading } = useNotificationLogs()

  if (isLoading) {
    return <div>Carregando logs de notificação...</div>
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tickets':
        return '🎫'
      case 'assignments':
        return '📦'
      case 'equipment':
        return '🖥️'
      default:
        return '📱'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Log de Notificações WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!logs || logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma notificação enviada ainda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getTypeIcon(log.notification_type)}</span>
                    <div>
                      <p className="font-medium capitalize">
                        {log.notification_type} - {log.entity_type}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(log.status)}
                    <Badge variant={
                      log.status === 'sent' ? 'default' : 
                      log.status === 'failed' ? 'destructive' : 
                      'secondary'
                    }>
                      {getStatusLabel(log.status)}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Telefone:</span>
                    <span className="font-mono bg-muted px-2 py-1 rounded">
                      {log.phone}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-sm font-medium">Mensagem:</span>
                    <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">
                      {log.message}
                    </div>
                  </div>

                  {log.error_message && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-red-600">Erro:</span>
                      <div className="bg-red-50 border border-red-200 p-2 rounded text-sm text-red-700">
                        {log.error_message}
                      </div>
                    </div>
                  )}

                  {log.sent_at && (
                    <p className="text-xs text-muted-foreground">
                      Enviado em: {new Date(log.sent_at).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
