
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

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-gray-300">
        <div className="flex items-center gap-4">
          {systemSettings?.company_logo_url && (
            <img
              src={systemSettings.company_logo_url}
              alt="Logo da empresa"
              className="h-16 w-16 object-contain"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {systemSettings?.company_name || 'Sistema de Chamados'}
            </h1>
            <p className="text-gray-600">Relatório de Chamado de Suporte</p>
          </div>
        </div>
        <div className="text-right text-sm text-gray-600">
          <p>Data de Geração:</p>
          <p className="font-medium">{format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
        </div>
      </div>

      {/* Informações Principais */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Informações do Chamado</h2>
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
          <div>
            <span className="font-medium text-gray-700">Número:</span>
            <span className="ml-2">#{ticket.ticket_number}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Status:</span>
            <span className="ml-2">{getStatusText(ticket.status)}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Prioridade:</span>
            <span className="ml-2">{getPriorityText(ticket.priority)}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Categoria:</span>
            <span className="ml-2 capitalize">{ticket.category}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Solicitante:</span>
            <span className="ml-2">{ticket.requester?.name}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Unidade:</span>
            <span className="ml-2">{ticket.unit?.name}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Técnico:</span>
            <span className="ml-2">{ticket.assignee?.name || 'Não atribuído'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Criado em:</span>
            <span className="ml-2">{format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
          </div>
        </div>
      </div>

      {/* Título e Descrição */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Título</h2>
        <p className="text-gray-800 mb-4">{ticket.title}</p>
        
        <h2 className="text-xl font-bold text-gray-900 mb-2">Descrição</h2>
        <div className="bg-gray-50 p-4 rounded">
          <p className="text-gray-800 whitespace-pre-wrap">{ticket.description}</p>
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
                    {format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </span>
                </div>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
        <p>Este relatório foi gerado automaticamente pelo sistema de chamados</p>
        <p>{systemSettings?.company_name || 'Sistema de Chamados'} - {format(new Date(), 'yyyy', { locale: ptBR })}</p>
      </div>
    </div>
  )
}
