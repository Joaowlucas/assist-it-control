
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface EquipmentPrintViewProps {
  equipment: any
  photos: any[]
  systemSettings: any
}

export function EquipmentPrintView({ equipment, photos, systemSettings }: EquipmentPrintViewProps) {
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'disponivel': return 'Disponível'
      case 'em_uso': return 'Em Uso'
      case 'manutencao': return 'Manutenção'
      case 'descartado': return 'Descartado'
      default: return status
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
              {systemSettings?.company_name || 'Sistema de Equipamentos'}
            </h1>
            <p className="text-gray-600 text-sm">Relatório de Equipamento</p>
          </div>
        </div>
        <div className="text-right text-sm text-gray-600">
          <p className="font-medium">Data de Geração:</p>
          <p className="font-medium">{formatDateTime(new Date().toISOString())}</p>
        </div>
      </div>

      {/* Informações do Equipamento */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Informações do Equipamento</h2>
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong className="text-gray-700">Nome:</strong> <span className="text-gray-900">{equipment.name}</span></div>
            <div><strong className="text-gray-700">Tipo:</strong> <span className="text-gray-900">{equipment.type}</span></div>
            <div><strong className="text-gray-700">Marca:</strong> <span className="text-gray-900">{equipment.brand || '-'}</span></div>
            <div><strong className="text-gray-700">Modelo:</strong> <span className="text-gray-900">{equipment.model || '-'}</span></div>
            <div><strong className="text-gray-700">Número de Série:</strong> <span className="text-gray-900">{equipment.serial_number || '-'}</span></div>
            <div><strong className="text-gray-700">Tombamento:</strong> <span className="text-gray-900">{equipment.tombamento || '-'}</span></div>
            <div><strong className="text-gray-700">Status:</strong> <span className="text-gray-900">{getStatusText(equipment.status)}</span></div>
            <div><strong className="text-gray-700">Localização:</strong> <span className="text-gray-900">{equipment.location || '-'}</span></div>
            <div><strong className="text-gray-700">Data de Compra:</strong> <span className="text-gray-900">{formatDate(equipment.purchase_date)}</span></div>
            <div><strong className="text-gray-700">Fim da Garantia:</strong> <span className="text-gray-900">{formatDate(equipment.warranty_end_date)}</span></div>
            <div><strong className="text-gray-700">Criado em:</strong> <span className="text-gray-900">{formatDateTime(equipment.created_at)}</span></div>
            <div><strong className="text-gray-700">Atualizado em:</strong> <span className="text-gray-900">{formatDateTime(equipment.updated_at)}</span></div>
          </div>
        </div>
      </div>

      {/* Descrição */}
      {equipment.description && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Descrição</h2>
          <div className="bg-gray-50 p-4 rounded-lg border">
            <p className="text-gray-700 whitespace-pre-wrap text-sm">{equipment.description}</p>
          </div>
        </div>
      )}

      {/* Fotos - Layout otimizado para aproveitamento do espaço */}
      {photos && photos.length > 0 && (
        <div className="mb-6 page-break-inside-avoid">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Fotos do Equipamento</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {photos.map((photo: any, index: number) => (
              <div key={photo.id} className="border border-gray-300 rounded p-3 bg-white">
                <div className="relative">
                  <img
                    src={photo.photo_url}
                    alt={photo.caption || `Foto ${index + 1}`}
                    className="w-full h-64 object-cover rounded border"
                    style={{ 
                      maxHeight: '256px', 
                      objectFit: 'cover',
                      objectPosition: 'center'
                    }}
                  />
                  {photo.is_primary && (
                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      Principal
                    </div>
                  )}
                </div>
                {photo.caption && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">{photo.caption}</p>
                  </div>
                )}
                <div className="mt-1">
                  <p className="text-xs text-gray-500">
                    Adicionada em: {formatDateTime(photo.created_at)}
                  </p>
                </div>
              </div>
            ))}
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
