
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface EquipmentPrintViewProps {
  equipment: any
  photos: any[]
  systemSettings: any
}

export function EquipmentPrintView({ equipment, photos, systemSettings }: EquipmentPrintViewProps) {
  const getStatusText = (status: string) => {
    switch (status) {
      case 'disponivel': return 'Disponível'
      case 'em_uso': return 'Em Uso'
      case 'manutencao': return 'Manutenção'
      case 'descartado': return 'Descartado'
      default: return status
    }
  }

  const formatDate = (date: string) => {
    if (!date) return '-'
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })
  }

  const formatDateTime = (date: string) => {
    if (!date) return '-'
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ptBR })
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
              {systemSettings?.company_name || 'Sistema de Equipamentos'}
            </h1>
            <p className="text-gray-600">Relatório de Equipamento</p>
          </div>
        </div>
        <div className="text-right text-sm text-gray-600">
          <p>Data de Geração:</p>
          <p className="font-medium">{format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
        </div>
      </div>

      {/* Informações Principais */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Informações do Equipamento</h2>
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
          <div>
            <span className="font-medium text-gray-700">Tombamento:</span>
            <span className="ml-2">{equipment.tombamento || '-'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Status:</span>
            <span className="ml-2">{getStatusText(equipment.status)}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Nome:</span>
            <span className="ml-2">{equipment.name}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Tipo:</span>
            <span className="ml-2">{equipment.type}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Marca:</span>
            <span className="ml-2">{equipment.brand || '-'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Modelo:</span>
            <span className="ml-2">{equipment.model || '-'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Número de Série:</span>
            <span className="ml-2">{equipment.serial_number || '-'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Unidade:</span>
            <span className="ml-2">{equipment.unit?.name || '-'}</span>
          </div>
        </div>
      </div>

      {/* Localização e Datas */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Localização e Datas</h2>
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
          <div>
            <span className="font-medium text-gray-700">Localização:</span>
            <span className="ml-2">{equipment.location || '-'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Data de Compra:</span>
            <span className="ml-2">{formatDate(equipment.purchase_date)}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Vencimento da Garantia:</span>
            <span className="ml-2">{formatDate(equipment.warranty_end_date)}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Criado em:</span>
            <span className="ml-2">{formatDateTime(equipment.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Descrição */}
      {equipment.description && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Descrição/Observações</h2>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-gray-800 whitespace-pre-wrap">{equipment.description}</p>
          </div>
        </div>
      )}

      {/* Fotos */}
      {photos && photos.length > 0 && (
        <div className="mb-6 page-break-inside-avoid">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Fotos do Equipamento</h2>
          <div className="grid grid-cols-2 gap-4">
            {photos.slice(0, 6).map((photo, index) => (
              <div key={photo.id} className="border border-gray-300 rounded p-2">
                <div>
                  <img
                    src={photo.photo_url}
                    alt={photo.caption || 'Foto do equipamento'}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                  {photo.caption && (
                    <p className="text-xs text-gray-600 truncate">{photo.caption}</p>
                  )}
                  {photo.is_primary && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Principal
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {photos.length > 6 && (
            <p className="text-center text-gray-600 text-sm mt-4">
              E mais {photos.length - 6} foto(s) não mostrada(s) neste relatório
            </p>
          )}
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
