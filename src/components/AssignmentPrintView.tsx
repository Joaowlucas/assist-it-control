
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AssignmentPrintViewProps {
  assignment: any
  systemSettings: any
}

export function AssignmentPrintView({ assignment, systemSettings }: AssignmentPrintViewProps) {
  const formatDate = (date: string) => {
    if (!date) return '-'
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })
  }

  const formatDateTime = (date: string) => {
    if (!date) return '-'
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ptBR })
  }

  const calculateDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date()
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ativo': return 'Ativo'
      case 'finalizado': return 'Finalizado'
      default: return status
    }
  }

  const duration = calculateDuration(assignment.start_date, assignment.end_date)

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
              {systemSettings?.company_name || 'Sistema de Equipamentos'}
            </h1>
            <p className="text-gray-600">Relatório de Atribuição de Equipamento</p>
          </div>
        </div>
        <div className="text-right text-sm text-gray-600">
          <p>Data de Geração:</p>
          <p className="font-medium">{format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
        </div>
      </div>

      {/* Informações da Atribuição */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Informações da Atribuição</h2>
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
          <div>
            <span className="font-medium text-gray-700">ID da Atribuição:</span>
            <span className="ml-2">{assignment.id}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Status:</span>
            <span className="ml-2">{getStatusText(assignment.status)}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Data de Início:</span>
            <span className="ml-2">{formatDate(assignment.start_date)}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Data de Fim:</span>
            <span className="ml-2">{assignment.end_date ? formatDate(assignment.end_date) : 'Em andamento'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Duração:</span>
            <span className="ml-2">{duration} dias</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Responsável pela Atribuição:</span>
            <span className="ml-2">{assignment.assigned_by_user?.name || 'Sistema'}</span>
          </div>
        </div>
      </div>

      {/* Informações do Equipamento */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Equipamento Atribuído</h2>
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
          <div>
            <span className="font-medium text-gray-700">Nome:</span>
            <span className="ml-2">{assignment.equipment?.name || '-'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Tipo:</span>
            <span className="ml-2">{assignment.equipment?.type || '-'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Marca:</span>
            <span className="ml-2">{assignment.equipment?.brand || '-'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Modelo:</span>
            <span className="ml-2">{assignment.equipment?.model || '-'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Número de Série:</span>
            <span className="ml-2">{assignment.equipment?.serial_number || '-'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Tombamento:</span>
            <span className="ml-2">{assignment.equipment?.tombamento || '-'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Unidade do Equipamento:</span>
            <span className="ml-2">{assignment.equipment?.unit?.name || '-'}</span>
          </div>
        </div>
      </div>

      {/* Informações do Usuário */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Usuário Responsável</h2>
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
          <div>
            <span className="font-medium text-gray-700">Nome:</span>
            <span className="ml-2">{assignment.user?.name || '-'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Email:</span>
            <span className="ml-2">{assignment.user?.email || '-'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Unidade:</span>
            <span className="ml-2">{assignment.user?.unit?.name || '-'}</span>
          </div>
        </div>
      </div>

      {/* Observações */}
      {assignment.notes && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Observações</h2>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-gray-800 whitespace-pre-wrap">{assignment.notes}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
        <p>Este relatório foi gerado automaticamente pelo sistema de equipamentos</p>
        <p>{systemSettings?.company_name || 'Sistema de Equipamentos'} - {format(new Date(), 'yyyy', { locale: ptBR })}</p>
      </div>
    </div>
  )
}
