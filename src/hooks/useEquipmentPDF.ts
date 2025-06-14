import { useState } from 'react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { useToast } from './use-toast'
import { supabase } from '@/integrations/supabase/client'

export function useEquipmentPDF() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const { toast } = useToast()

  const fetchEquipmentData = async (equipmentId: string) => {
    // Buscar dados completos do equipamento
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select(`
        *,
        unit:units(name)
      `)
      .eq('id', equipmentId)
      .single()

    if (equipmentError) throw equipmentError

    // Buscar fotos do equipamento
    const { data: photos, error: photosError } = await supabase
      .from('equipment_photos')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })

    if (photosError) console.warn('Erro ao buscar fotos:', photosError)

    // Buscar configurações do sistema
    const { data: systemSettings, error: settingsError } = await supabase
      .from('system_settings')
      .select('*')
      .single()

    if (settingsError) throw settingsError

    return { equipment, photos: photos || [], systemSettings }
  }

  const previewEquipmentPDF = async (equipmentId: string, tombamento: string) => {
    setIsLoadingPreview(true)
    
    try {
      const data = await fetchEquipmentData(equipmentId)
      return data
    } catch (error: any) {
      console.error('Erro ao carregar dados para pré-visualização:', error)
      toast({
        title: 'Erro ao carregar pré-visualização',
        description: error.message || 'Ocorreu um erro ao carregar os dados.',
        variant: 'destructive',
      })
      throw error
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const printFromPreview = async (equipment: any, photos: any[], systemSettings: any) => {
    try {
      // Criar o mesmo conteúdo HTML usado para PDF
      const printContent = createEquipmentPrintHTML(equipment, photos, systemSettings)
      
      // Criar elemento temporário para impressão
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        throw new Error('Não foi possível abrir a janela de impressão')
      }

      // Escrever o conteúdo na nova janela
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Equipamento ${equipment.tombamento}</title>
            <style>
              @media print {
                body { margin: 0; }
                .no-print { display: none !important; }
              }
              @media screen {
                body { padding: 20px; background: #f5f5f5; }
                .print-container { background: white; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              ${printContent}
            </div>
          </body>
        </html>
      `)
      
      printWindow.document.close()
      
      // Aguardar imagens carregarem antes de imprimir
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 1000)
      }

      toast({
        title: 'Preparando impressão',
        description: 'O documento está sendo preparado para impressão.',
      })

    } catch (error: any) {
      console.error('Erro ao imprimir:', error)
      toast({
        title: 'Erro ao imprimir',
        description: error.message || 'Ocorreu um erro ao preparar a impressão.',
        variant: 'destructive',
      })
    }
  }

  const downloadPDFFromPreview = async (equipment: any, photos: any[], systemSettings: any, tombamento: string) => {
    setIsGenerating(true)
    
    try {
      // Criar conteúdo HTML para o PDF
      const printContent = createEquipmentPrintHTML(equipment, photos, systemSettings)
      
      // Criar elemento temporário
      const tempElement = document.createElement('div')
      tempElement.innerHTML = printContent
      tempElement.style.position = 'absolute'
      tempElement.style.left = '-9999px'
      tempElement.style.width = '800px'
      tempElement.style.backgroundColor = 'white'
      document.body.appendChild(tempElement)

      // Aguardar imagens carregarem
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Capturar como canvas
      const canvas = await html2canvas(tempElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: tempElement.scrollHeight
      })

      // Criar PDF
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 295 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      // Verificar se precisa de múltiplas páginas
      if (imgHeight <= pageHeight) {
        // Conteúdo cabe em uma página
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      } else {
        // Conteúdo precisa de múltiplas páginas
        let heightLeft = imgHeight
        let position = 0

        // Primeira página
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight

        // Páginas adicionais
        while (heightLeft > 0) {
          position = heightLeft - imgHeight
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }
      }

      // Fazer download
      const fileName = `Equipamento_${tombamento}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)

      // Limpar elemento temporário
      document.body.removeChild(tempElement)

      toast({
        title: 'PDF gerado com sucesso!',
        description: `O arquivo ${fileName} foi baixado.`,
      })

    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error)
      toast({
        title: 'Erro ao gerar PDF',
        description: error.message || 'Ocorreu um erro ao gerar o PDF.',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const generateEquipmentPDF = async (equipmentId: string, tombamento: string) => {
    setIsGenerating(true)
    
    try {
      const { equipment, photos, systemSettings } = await fetchEquipmentData(equipmentId)
      await downloadPDFFromPreview(equipment, photos, systemSettings, tombamento)
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error)
      toast({
        title: 'Erro ao gerar PDF',
        description: error.message || 'Ocorreu um erro ao gerar o PDF.',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const createEquipmentPrintHTML = (equipment: any, photos: any[], systemSettings: any) => {
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
      return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }

    const formatDateTime = (date: string) => {
      if (!date) return '-'
      return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    return `
      <div style="font-family: Arial, sans-serif; padding: 32px; background: white; max-width: 800px;">
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid #d1d5db;">
          <div style="display: flex; align-items: center; gap: 16px;">
            ${systemSettings?.company_logo_url ? `
              <img src="${systemSettings.company_logo_url}" alt="Logo" style="height: 64px; width: 64px; object-fit: contain;" />
            ` : ''}
            <div>
              <h1 style="font-size: 24px; font-weight: bold; color: #111827; margin: 0;">
                ${systemSettings?.company_name || 'Sistema de Equipamentos'}
              </h1>
              <p style="color: #6b7280; margin: 4px 0 0 0;">Relatório de Equipamento</p>
            </div>
          </div>
          <div style="text-align: right; font-size: 14px; color: #6b7280;">
            <p style="margin: 0;">Data de Geração:</p>
            <p style="font-weight: 500; margin: 4px 0 0 0;">${formatDateTime(new Date().toISOString())}</p>
          </div>
        </div>

        <!-- Informações Principais -->
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 20px; font-weight: bold; color: #111827; margin-bottom: 16px;">Informações do Equipamento</h2>
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div><strong>Tombamento:</strong> ${equipment.tombamento || '-'}</div>
              <div><strong>Status:</strong> ${getStatusText(equipment.status)}</div>
              <div><strong>Nome:</strong> ${equipment.name}</div>
              <div><strong>Tipo:</strong> ${equipment.type}</div>
              <div><strong>Marca:</strong> ${equipment.brand || '-'}</div>
              <div><strong>Modelo:</strong> ${equipment.model || '-'}</div>
              <div><strong>Número de Série:</strong> ${equipment.serial_number || '-'}</div>
              <div><strong>Unidade:</strong> ${equipment.unit?.name || '-'}</div>
            </div>
          </div>
        </div>

        <!-- Localização e Datas -->
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 20px; font-weight: bold; color: #111827; margin-bottom: 16px;">Localização e Datas</h2>
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div><strong>Localização:</strong> ${equipment.location || '-'}</div>
              <div><strong>Data de Compra:</strong> ${formatDate(equipment.purchase_date)}</div>
              <div><strong>Vencimento da Garantia:</strong> ${formatDate(equipment.warranty_end_date)}</div>
              <div><strong>Criado em:</strong> ${formatDateTime(equipment.created_at)}</div>
            </div>
          </div>
        </div>

        <!-- Descrição -->
        ${equipment.description ? `
          <div style="margin-bottom: 24px;">
            <h2 style="font-size: 20px; font-weight: bold; color: #111827; margin-bottom: 8px;">Descrição/Observações</h2>
            <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
              <p style="color: #374151; white-space: pre-wrap; margin: 0;">${equipment.description}</p>
            </div>
          </div>
        ` : ''}

        <!-- Fotos -->
        ${photos && photos.length > 0 ? `
          <div style="margin-bottom: 24px;">
            <h2 style="font-size: 20px; font-weight: bold; color: #111827; margin-bottom: 16px;">Fotos do Equipamento</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              ${photos.slice(0, 6).map((photo: any) => `
                <div style="border: 1px solid #d1d5db; border-radius: 8px; padding: 8px;">
                  <img src="${photo.photo_url}" alt="${photo.caption || 'Foto do equipamento'}" 
                       style="width: 100%; height: 128px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;" />
                  ${photo.caption ? `
                    <p style="font-size: 12px; color: #6b7280; margin: 0; text-overflow: ellipsis; overflow: hidden;">${photo.caption}</p>
                  ` : ''}
                  ${photo.is_primary ? `
                    <div style="font-size: 10px; color: #92400e; background: #fef3c7; padding: 2px 6px; border-radius: 3px; display: inline-block; margin-top: 4px;">
                      Principal
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
            ${photos.length > 6 ? `
              <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 16px;">
                E mais ${photos.length - 6} foto(s) não mostrada(s) neste relatório
              </p>
            ` : ''}
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #d1d5db; text-align: center; font-size: 12px; color: #6b7280;">
          <p style="margin: 0;">Este relatório foi gerado automaticamente pelo sistema de equipamentos</p>
          <p style="margin: 4px 0 0 0;">${systemSettings?.company_name || 'Sistema de Equipamentos'} - ${new Date().getFullYear()}</p>
        </div>
      </div>
    `
  }

  return {
    generateEquipmentPDF,
    previewEquipmentPDF,
    downloadPDFFromPreview,
    printFromPreview,
    isGenerating,
    isLoadingPreview
  }
}
