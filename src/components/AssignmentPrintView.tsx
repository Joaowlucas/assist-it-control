
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AssignmentPrintViewProps {
  assignment: any
  systemSettings: any
}

export function AssignmentPrintView({ assignment, systemSettings }: AssignmentPrintViewProps) {
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

  const calculateDuration = (startDate: string, endDate?: string) => {
    try {
      const start = new Date(startDate)
      const end = endDate ? new Date(endDate) : new Date()
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    } catch {
      return 0
    }
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
              {systemSettings?.company_name || 'Sistema de Equipamentos'}
            </h1>
            <p className="text-gray-600 text-sm">Relatório de Atribuição de Equipamento</p>
          </div>
        </div>
        <div className="text-right text-sm text-gray-600">
          <p className="font-medium">Data de Geração:</p>
          <p className="font-medium">{formatDateTime(new Date().toISOString())}</p>
        </div>
      </div>

      {/* Informações da Atribuição */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Informações da Atribuição</h2>
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong className="text-gray-700">ID da Atribuição:</strong> <span className="text-gray-900">{assignment.id}</span></div>
            <div><strong className="text-gray-700">Status:</strong> <span className="text-gray-900">{getStatusText(assignment.status)}</span></div>
            <div><strong className="text-gray-700">Data de Início:</strong> <span className="text-gray-900">{formatDate(assignment.start_date)}</span></div>
            <div><strong className="text-gray-700">Data de Fim:</strong> <span className="text-gray-900">{assignment.end_date ? formatDate(assignment.end_date) : 'Em andamento'}</span></div>
            <div><strong className="text-gray-700">Duração:</strong> <span className="text-gray-900">{duration} dias</span></div>
            <div><strong className="text-gray-700">Responsável pela Atribuição:</strong> <span className="text-gray-900">{assignment.assigned_by_user?.name || 'Sistema'}</span></div>
          </div>
        </div>
      </div>

      {/* Informações do Equipamento */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Equipamento Atribuído</h2>
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong className="text-gray-700">Nome:</strong> <span className="text-gray-900">{assignment.equipment?.name || '-'}</span></div>
            <div><strong className="text-gray-700">Tipo:</strong> <span className="text-gray-900">{assignment.equipment?.type || '-'}</span></div>
            <div><strong className="text-gray-700">Marca:</strong> <span className="text-gray-900">{assignment.equipment?.brand || '-'}</span></div>
            <div><strong className="text-gray-700">Modelo:</strong> <span className="text-gray-900">{assignment.equipment?.model || '-'}</span></div>
            <div><strong className="text-gray-700">Número de Série:</strong> <span className="text-gray-900">{assignment.equipment?.serial_number || '-'}</span></div>
            <div><strong className="text-gray-700">Tombamento:</strong> <span className="text-gray-900">{assignment.equipment?.tombamento || '-'}</span></div>
            <div><strong className="text-gray-700">Unidade do Equipamento:</strong> <span className="text-gray-900">{assignment.equipment?.unit?.name || '-'}</span></div>
          </div>
        </div>
      </div>

      {/* Informações do Usuário */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Usuário Responsável</h2>
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong className="text-gray-700">Nome:</strong> <span className="text-gray-900">{assignment.user?.name || '-'}</span></div>
            <div><strong className="text-gray-700">Email:</strong> <span className="text-gray-900">{assignment.user?.email || '-'}</span></div>
            <div><strong className="text-gray-700">Unidade:</strong> <span className="text-gray-900">{assignment.user?.unit?.name || '-'}</span></div>
          </div>
        </div>
      </div>

      {/* Observações */}
      {assignment.notes && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Observações</h2>
          <div className="bg-gray-50 p-4 rounded-lg border">
            <p className="text-gray-700 whitespace-pre-wrap text-sm">{assignment.notes}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t text-center text-xs text-gray-600">
        <p>Este relatório foi gerado automaticamente pelo sistema de equipamentos</p>
        <p className="mt-1">{systemSettings?.company_name || 'Sistema de Equipamentos'} - {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
