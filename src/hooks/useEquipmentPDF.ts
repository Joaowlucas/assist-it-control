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
      const printContent = createEquipmentPrintHTML(equipment, photos, systemSettings)
      
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        throw new Error('Não foi possível abrir a janela de impressão')
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Equipamento ${equipment.tombamento}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: Arial, sans-serif; line-height: 1.4; }
              @media print {
                body { margin: 0; padding: 0; }
                .no-print { display: none !important; }
                .print-container { 
                  width: 100% !important; 
                  max-width: none !important; 
                  margin: 0 !important; 
                  padding: 15px !important; 
                }
                .page-break { page-break-before: always; }
              }
              @media screen {
                body { padding: 20px; background: #f5f5f5; }
                .print-container { 
                  background: white; 
                  box-shadow: 0 0 10px rgba(0,0,0,0.1); 
                  margin: 0 auto;
                  max-width: 800px;
                  padding: 20px;
                }
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
      
      const images = printWindow.document.images
      let loadedImages = 0
      const totalImages = images.length

      const checkAllImagesLoaded = () => {
        if (loadedImages === totalImages) {
          setTimeout(() => {
            printWindow.print()
            setTimeout(() => printWindow.close(), 1000)
          }, 500)
        }
      }

      if (totalImages === 0) {
        setTimeout(() => {
          printWindow.print()
          setTimeout(() => printWindow.close(), 1000)
        }, 500)
      } else {
        Array.from(images).forEach((img) => {
          if (img.complete) {
            loadedImages++
            checkAllImagesLoaded()
          } else {
            img.onload = () => {
              loadedImages++
              checkAllImagesLoaded()
            }
            img.onerror = () => {
              loadedImages++
              checkAllImagesLoaded()
            }
          }
        })
        
        setTimeout(checkAllImagesLoaded, 5000)
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
      const printContent = createEquipmentPrintHTML(equipment, photos, systemSettings)
      
      const tempElement = document.createElement('div')
      tempElement.innerHTML = printContent
      tempElement.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 800px;
        background-color: white;
        font-family: Arial, sans-serif;
        padding: 32px;
        line-height: 1.5;
      `
      document.body.appendChild(tempElement)

      // Aguardar imagens carregarem com promise mais robusta
      const images = tempElement.querySelectorAll('img')
      const imagePromises = Array.from(images).map((img) => {
        return new Promise((resolve) => {
          if (img.complete) {
            resolve(img)
            return
          }
          
          let timeoutId: NodeJS.Timeout
          
          const cleanup = () => {
            clearTimeout(timeoutId)
            img.onload = null
            img.onerror = null
          }
          
          timeoutId = setTimeout(() => {
            cleanup()
            resolve(img)
          }, 3000) // 3s timeout por imagem
          
          img.onload = () => {
            cleanup()
            resolve(img)
          }
          img.onerror = () => {
            cleanup()
            resolve(img)
          }
        })
      })

      await Promise.allSettled(imagePromises)
      
      // Aguardar renderização
      await new Promise(resolve => setTimeout(resolve, 1000))

      const canvas = await html2canvas(tempElement, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: tempElement.scrollHeight,
        logging: false,
        imageTimeout: 5000,
        removeContainer: true,
        ignoreElements: (element) => {
          return element.classList?.contains('no-print') || false
        }
      })

      const imgData = canvas.toDataURL('image/png', 0.9)
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const fileName = `Equipamento_${tombamento}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)

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
      try {
        return new Date(date).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      } catch {
        return '-'
      }
    }

    const formatDateTime = (date: string) => {
      if (!date) return '-'
      try {
        return new Date(date).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch {
        return '-'
      }
    }

    return `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: white; max-width: 800px; margin: 0 auto; color: #333; line-height: 1.5;">
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e5e7eb; flex-wrap: wrap; gap: 16px;">
          <div style="display: flex; align-items: center; gap: 16px; flex: 1; min-width: 250px;">
            ${systemSettings?.company_logo_url ? `
              <img src="${systemSettings.company_logo_url}" alt="Logo" style="height: 60px; width: 60px; object-fit: contain; flex-shrink: 0;" crossorigin="anonymous" />
            ` : ''}
            <div style="flex: 1;">
              <h1 style="font-size: 20px; font-weight: bold; color: #111827; margin: 0; line-height: 1.3;">
                ${systemSettings?.company_name || 'Sistema de Equipamentos'}
              </h1>
              <p style="color: #6b7280; margin: 4px 0 0 0; font-size: 14px;">Relatório de Equipamento</p>
            </div>
          </div>
          <div style="text-align: right; font-size: 12px; color: #6b7280; flex-shrink: 0;">
            <p style="margin: 0; font-weight: 500;">Data de Geração:</p>
            <p style="font-weight: 500; margin: 4px 0 0 0;">${formatDateTime(new Date().toISOString())}</p>
          </div>
        </div>

        <!-- Informações Principais -->
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 12px;">Informações do Equipamento</h2>
          <div style="background: #f9fafb; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
              <div style="padding: 6px 0;"><strong style="color: #374151;">Tombamento:</strong> <span style="color: #111827;">${equipment.tombamento || '-'}</span></div>
              <div style="padding: 6px 0;"><strong style="color: #374151;">Status:</strong> <span style="color: #111827;">${getStatusText(equipment.status)}</span></div>
              <div style="padding: 6px 0;"><strong style="color: #374151;">Nome:</strong> <span style="color: #111827;">${equipment.name}</span></div>
              <div style="padding: 6px 0;"><strong style="color: #374151;">Tipo:</strong> <span style="color: #111827; text-transform: capitalize;">${equipment.type}</span></div>
              <div style="padding: 6px 0;"><strong style="color: #374151;">Marca:</strong> <span style="color: #111827;">${equipment.brand || '-'}</span></div>
              <div style="padding: 6px 0;"><strong style="color: #374151;">Modelo:</strong> <span style="color: #111827;">${equipment.model || '-'}</span></div>
              <div style="padding: 6px 0;"><strong style="color: #374151;">Número de Série:</strong> <span style="color: #111827;">${equipment.serial_number || '-'}</span></div>
              <div style="padding: 6px 0;"><strong style="color: #374151;">Unidade:</strong> <span style="color: #111827;">${equipment.unit?.name || '-'}</span></div>
            </div>
          </div>
        </div>

        <!-- Localização e Datas -->
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 12px;">Localização e Datas</h2>
          <div style="background: #f9fafb; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
              <div style="padding: 6px 0;"><strong style="color: #374151;">Localização:</strong> <span style="color: #111827;">${equipment.location || '-'}</span></div>
              <div style="padding: 6px 0;"><strong style="color: #374151;">Data de Compra:</strong> <span style="color: #111827;">${formatDate(equipment.purchase_date)}</span></div>
              <div style="padding: 6px 0;"><strong style="color: #374151;">Vencimento da Garantia:</strong> <span style="color: #111827;">${formatDate(equipment.warranty_end_date)}</span></div>
              <div style="padding: 6px 0;"><strong style="color: #374151;">Criado em:</strong> <span style="color: #111827;">${formatDateTime(equipment.created_at)}</span></div>
            </div>
          </div>
        </div>

        <!-- Descrição -->
        ${equipment.description ? `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 12px;">Descrição/Observações</h2>
            <div style="background: #f9fafb; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb;">
              <p style="color: #374151; white-space: pre-wrap; margin: 0; font-size: 13px; line-height: 1.4;">${equipment.description}</p>
            </div>
          </div>
        ` : ''}

        <!-- Fotos -->
        ${photos && photos.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 12px;">Fotos do Equipamento</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
              ${photos.slice(0, 6).map((photo: any) => `
                <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; background: white;">
                  <img src="${photo.photo_url}" alt="${photo.caption || 'Foto do equipamento'}" 
                       style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 6px; display: block;" 
                       crossorigin="anonymous" />
                  ${photo.caption ? `
                    <p style="font-size: 11px; color: #6b7280; margin: 0 0 4px 0; word-wrap: break-word;">${photo.caption}</p>
                  ` : ''}
                  ${photo.is_primary ? `
                    <div style="font-size: 10px; color: #92400e; background: #fef3c7; padding: 2px 4px; border-radius: 3px; display: inline-block;">
                      Principal
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
            ${photos.length > 6 ? `
              <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 12px; font-style: italic;">
                E mais ${photos.length - 6} foto(s) não mostrada(s) neste relatório
              </p>
            ` : ''}
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #d1d5db; text-align: center; font-size: 11px; color: #6b7280;">
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
