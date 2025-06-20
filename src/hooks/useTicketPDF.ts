import { useState } from 'react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { useToast } from './use-toast'
import { supabase } from '@/integrations/supabase/client'

export function useTicketPDF() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const { toast } = useToast()

  const fetchTicketData = async (ticketId: string) => {
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        requester:profiles!tickets_requester_id_fkey(name, email),
        assignee:profiles!tickets_assignee_id_fkey(name, email),
        unit:units(name),
        comments:ticket_comments(
          *,
          user:profiles(name, email)
        ),
        attachments:ticket_attachments(
          *,
          uploader:profiles(name, email)
        )
      `)
      .eq('id', ticketId)
      .single()

    if (ticketError) throw ticketError

    const { data: systemSettings, error: settingsError } = await supabase
      .from('system_settings')
      .select('*')
      .single()

    if (settingsError) throw settingsError

    const ticketWithUrls = {
      ...ticket,
      attachments: ticket.attachments?.map((attachment: any) => {
        const { data: urlData } = supabase.storage
          .from('ticket-attachments')
          .getPublicUrl(attachment.file_path)
        
        return {
          ...attachment,
          public_url: urlData.publicUrl
        }
      }) || []
    }

    return { ticket: ticketWithUrls, systemSettings }
  }

  const previewTicketPDF = async (ticketId: string, ticketNumber: string) => {
    setIsLoadingPreview(true)
    
    try {
      const data = await fetchTicketData(ticketId)
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

  const printFromPreview = async (ticket: any, systemSettings: any) => {
    try {
      const printContent = createPrintHTML(ticket, systemSettings)
      
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        throw new Error('Não foi possível abrir a janela de impressão')
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Chamado #${ticket.ticket_number}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: Arial, sans-serif; line-height: 1.4; }
              @media print {
                body { margin: 0; padding: 0; }
                .no-print { display: none !important; }
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

  const downloadPDFFromPreview = async (ticket: any, systemSettings: any, ticketNumber: string) => {
    setIsGenerating(true)
    
    try {
      const printContent = createPrintHTML(ticket, systemSettings)
      
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

      // Aguardar imagens carregarem
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
          }, 3000)
          
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
      
      await new Promise(resolve => setTimeout(resolve, 1000))

      const canvas = await html2canvas(tempElement, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800
      })

      const imgData = canvas.toDataURL('image/png', 0.9)
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const fileName = `Chamado_${ticketNumber}_${new Date().toISOString().split('T')[0]}.pdf`
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

  const generateTicketPDF = async (ticketId: string, ticketNumber: string) => {
    setIsGenerating(true)
    
    try {
      const { ticket, systemSettings } = await fetchTicketData(ticketId)
      await downloadPDFFromPreview(ticket, systemSettings, ticketNumber)
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

  const createPrintHTML = (ticket: any, systemSettings: any) => {
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
      return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
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
                ${systemSettings?.company_name || 'Sistema de Chamados'}
              </h1>
              <p style="color: #6b7280; margin: 4px 0 0 0; font-size: 14px;">Relatório de Chamado de Suporte</p>
            </div>
          </div>
          <div style="text-align: right; font-size: 12px; color: #6b7280; flex-shrink: 0;">
            <p style="margin: 0; font-weight: 500;">Data de Geração:</p>
            <p style="font-weight: 500; margin: 4px 0 0 0;">${formatDate(new Date().toISOString())}</p>
          </div>
        </div>

        <!-- Informações Principais -->
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 12px;">Informações do Chamado</h2>
          <div style="background: #f9fafb; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
              <div style="padding: 6px 0;"><strong style="color: #374151;">Número:</strong> <span style="color: #111827;">#${ticket.ticket_number}</span></div>
              <div style="padding: 6px 0;"><strong style="color: #374151;">Status:</strong> <span style="color: #111827;">${getStatusText(ticket.status)}</span></div>
              <div style="padding: 6px 0;"><strong style="color: #374151;">Prioridade:</strong> <span style="color: #111827;">${getPriorityText(ticket.priority)}</span></div>
              <div style="padding: 6px 0;"><strong style="color: #374151;">Categoria:</strong> <span style="color: #111827; text-transform: capitalize;">${ticket.category}</span></div>
              <div style="padding: 6px 0;"><strong style="color: #374151;">Solicitante:</strong> <span style="color: #111827;">${ticket.requester?.name}</span></div>
              <div style="padding: 6px 0;"><strong style="color: #374151;">Unidade:</strong> <span style="color: #111827;">${ticket.unit?.name}</span></div>
              <div style="padding: 6px 0;"><strong style="color: #374151;">Técnico:</strong> <span style="color: #111827;">${ticket.assignee?.name || 'Não atribuído'}</span></div>
              <div style="padding: 6px 0;"><strong style="color: #374151;">Criado em:</strong> <span style="color: #111827;">${formatDate(ticket.created_at)}</span></div>
            </div>
          </div>
        </div>

        <!-- Título e Descrição -->
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 8px;">Título</h2>
          <p style="color: #374151; margin-bottom: 16px; font-size: 13px;">${ticket.title}</p>
          
          <h2 style="font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 8px;">Descrição</h2>
          <div style="background: #f9fafb; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb;">
            <p style="color: #374151; white-space: pre-wrap; margin: 0; font-size: 13px; line-height: 1.4;">${ticket.description}</p>
          </div>
        </div>

        <!-- Anexos -->
        ${ticket.attachments && ticket.attachments.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 12px;">Anexos</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
              ${ticket.attachments.map((attachment: any) => `
                <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; background: white;">
                  ${attachment.mime_type?.startsWith('image/') ? `
                    <img src="${attachment.public_url}" alt="${attachment.file_name}" 
                         style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 6px; display: block;" 
                         crossorigin="anonymous" />
                  ` : `
                    <div style="text-align: center; padding: 16px;">
                      <p style="font-weight: 500; color: #374151; margin: 0; font-size: 13px;">${attachment.file_name}</p>
                      <p style="font-size: 11px; color: #6b7280; margin: 4px 0 0 0;">Arquivo anexado</p>
                    </div>
                  `}
                  <p style="font-size: 11px; color: #6b7280; margin: 0; word-wrap: break-word;">${attachment.file_name}</p>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Comentários -->
        ${ticket.comments && ticket.comments.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 12px;">Histórico de Comentários</h2>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${ticket.comments.map((comment: any) => `
                <div style="border-left: 4px solid #bfdbfe; background: #f9fafb; padding: 12px; border-radius: 0 6px 6px 0;">
                  <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="font-weight: 500; color: #374151; font-size: 13px;">${comment.user?.name}</span>
                      ${comment.is_internal ? `
                        <span style="font-size: 10px; background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 3px;">
                          Interno
                        </span>
                      ` : ''}
                    </div>
                    <span style="font-size: 11px; color: #6b7280; flex-shrink: 0;">
                      ${formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p style="color: #374151; font-size: 12px; white-space: pre-wrap; margin: 0; line-height: 1.4;">${comment.content}</p>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #d1d5db; text-align: center; font-size: 11px; color: #6b7280;">
          <p style="margin: 0;">Este relatório foi gerado automaticamente pelo sistema de chamados</p>
          <p style="margin: 4px 0 0 0;">${systemSettings?.company_name || 'Sistema de Chamados'} - ${new Date().getFullYear()}</p>
        </div>
      </div>
    `
  }

  return {
    generateTicketPDF,
    previewTicketPDF,
    downloadPDFFromPreview,
    printFromPreview,
    isGenerating,
    isLoadingPreview
  }
}
