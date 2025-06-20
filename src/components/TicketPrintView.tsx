
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TicketPrintViewProps {
  ticket: any
  systemSettings: any
}

export function TicketPrintView({ ticket, systemSettings }: TicketPrintViewProps) {
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

  const formatDate = (date: string) => {
    if (!date) return '-'
    try {
      return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })
    } catch {
      return '-'
    }
  }

  const formatDateTime = (date: string) => {
    if (!date) return '-'
    try {
      return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    } catch {
      return '-'
    }
  }

  return (
    <div className="p-8 bg-white text-black max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-gray-300">
        <div className="flex items-center gap-4">
          {systemSettings?.company_logo_url && (
            <img 
              src={systemSettings.company_logo_url} 
              alt="Logo" 
              className="h-16 w-16 object-contain"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {systemSettings?.company_name || 'Sistema de Chamados'}
            </h1>
            <p className="text-gray-600 text-sm">Relatório de Chamado de Suporte</p>
          </div>
        </div>
        <div className="text-right text-sm text-gray-600">
          <p className="font-medium">Data de Geração:</p>
          <p className="font-medium">{formatDateTime(new Date().toISOString())}</p>
        </div>
      </div>

      {/* Informações do Chamado */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Informações do Chamado</h2>
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong className="text-gray-700">Número:</strong> <span className="text-gray-900">#{ticket.ticket_number}</span></div>
            <div><strong className="text-gray-700">Status:</strong> <span className="text-gray-900">{getStatusText(ticket.status)}</span></div>
            <div><strong className="text-gray-700">Prioridade:</strong> <span className="text-gray-900">{getPriorityText(ticket.priority)}</span></div>
            <div><strong className="text-gray-700">Categoria:</strong> <span className="text-gray-900 capitalize">{ticket.category}</span></div>
            <div><strong className="text-gray-700">Solicitante:</strong> <span className="text-gray-900">{ticket.requester?.name}</span></div>
            <div><strong className="text-gray-700">Unidade:</strong> <span className="text-gray-900">{ticket.unit?.name}</span></div>
            <div><strong className="text-gray-700">Técnico:</strong> <span className="text-gray-900">{ticket.assignee?.name || 'Não atribuído'}</span></div>
            <div><strong className="text-gray-700">Criado em:</strong> <span className="text-gray-900">{formatDateTime(ticket.created_at)}</span></div>
          </div>
        </div>
      </div>

      {/* Título e Descrição */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Título</h2>
        <p className="text-gray-800 mb-4">{ticket.title}</p>
        
        <h2 className="text-xl font-bold text-gray-900 mb-2">Descrição</h2>
        <div className="bg-gray-50 p-4 rounded-lg border">
          <p className="text-gray-700 whitespace-pre-wrap text-sm">{ticket.description}</p>
        </div>
      </div>

      {/* Anexos */}
      {ticket.attachments && ticket.attachments.length > 0 && (
        <div className="mb-6 page-break-inside-avoid">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Anexos</h2>
          <div className="grid grid-cols-2 gap-4">
            {ticket.attachments.map((attachment: any, index: number) => (
              <div key={attachment.id} className="border border-gray-300 rounded p-2">
                {attachment.mime_type?.startsWith('image/') ? (
                  <div>
                    <img
                      src={attachment.public_url}
                      alt={attachment.file_name}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                    <p className="text-xs text-gray-600 truncate">{attachment.file_name}</p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm font-medium text-gray-700">{attachment.file_name}</p>
                    <p className="text-xs text-gray-500">Arquivo anexado</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comentários */}
      {ticket.comments && ticket.comments.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Histórico de Comentários</h2>
          <div className="space-y-3">
            {ticket.comments.map((comment: any, index: number) => (
              <div key={comment.id} className="border-l-4 border-blue-200 bg-gray-50 p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{comment.user?.name}</span>
                    {comment.is_internal && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Interno
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDateTime(comment.created_at)}
                  </span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap text-sm">{comment.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t text-center text-xs text-gray-600">
        <p>Este relatório foi gerado automaticamente pelo sistema de chamados</p>
        <p className="mt-1">{systemSettings?.company_name || 'Sistema de Chamados'} - {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
