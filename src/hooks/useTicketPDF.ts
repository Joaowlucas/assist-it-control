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
    // Buscar dados completos do chamado
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

    // Buscar configurações do sistema
    const { data: systemSettings, error: settingsError } = await supabase
      .from('system_settings')
      .select('*')
      .single()

    if (settingsError) throw settingsError

    // Adicionar URLs públicas aos anexos
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
      // Criar o conteúdo HTML
      const printContent = createPrintHTML(ticket, systemSettings)
      
      // Salvar conteúdo original
      const originalContent = document.body.innerHTML
      const originalTitle = document.title
      
      // Substituir conteúdo da página temporariamente
      document.title = `Chamado #${ticket.ticket_number}`
      document.body.innerHTML = `
        <div style="font-family: Arial, sans-serif;">
          ${printContent}
        </div>
      `

      toast({
        title: 'Preparando impressão',
        description: 'O documento está sendo preparado para impressão.',
      })

      // Aguardar um pouco para renderização
      setTimeout(() => {
        // Imprimir
        window.print()
        
        // Restaurar conteúdo original após impressão
        setTimeout(() => {
          document.body.innerHTML = originalContent
          document.title = originalTitle
          // Recarregar os event listeners do React
          window.location.reload()
        }, 1000)
      }, 500)

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
      // Criar conteúdo HTML para o PDF
      const printContent = createPrintHTML(ticket, systemSettings)
      
      // Criar elemento temporário com dimensões fixas
      const tempElement = document.createElement('div')
      tempElement.innerHTML = printContent
      tempElement.style.position = 'absolute'
      tempElement.style.left = '-9999px'
      tempElement.style.width = '794px' // A4 width em pixels (210mm)
      tempElement.style.backgroundColor = 'white'
      tempElement.style.padding = '20px'
      tempElement.style.boxSizing = 'border-box'
      document.body.appendChild(tempElement)

      console.log('Elemento criado, aguardando renderização...')
      
      // Aguardar imagens carregarem
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Capturar como canvas com configurações otimizadas
      const canvas = await html2canvas(tempElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: 'auto', // Deixar altura automática
        logging: false
      })

      console.log('Canvas capturado:', canvas.width, 'x', canvas.height)

      // Criar PDF
      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const pageWidth = 210 // A4 width em mm
      const pageHeight = 297 // A4 height em mm
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * pageWidth) / canvas.width

      console.log('Dimensões do PDF:', imgWidth, 'x', imgHeight, 'mm')
      console.log('Altura da página:', pageHeight, 'mm')

      // Adicionar imagem no PDF
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)

      // Apenas adicionar páginas extras se realmente necessário
      if (imgHeight > pageHeight) {
        console.log('Conteúdo excede uma página, adicionando páginas extras...')
        let position = -pageHeight
        
        while (position + imgHeight > 0) {
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
          position -= pageHeight
        }
      }

      // Fazer download
      const fileName = `Chamado_${ticketNumber}_${new Date().toISOString().split('T')[0]}.pdf`
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
      <style>
        @media print {
          body { margin: 0 !important; padding: 0 !important; }
          * { box-sizing: border-box; }
          .page-break { page-break-before: always; }
        }
        @media screen {
          body { font-family: Arial, sans-serif; }
        }
      </style>
      <div style="font-family: Arial, sans-serif; padding: 20px; background: white; max-width: 794px; margin: 0 auto;">
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 2px solid #d1d5db;">
          <div style="display: flex; align-items: center; gap: 12px;">
            ${systemSettings?.company_logo_url ? `
              <img src="${systemSettings.company_logo_url}" alt="Logo" style="height: 48px; width: 48px; object-fit: contain;" />
            ` : ''}
            <div>
              <h1 style="font-size: 20px; font-weight: bold; color: #111827; margin: 0;">
                ${systemSettings?.company_name || 'Sistema de Chamados'}
              </h1>
              <p style="color: #6b7280; margin: 4px 0 0 0; font-size: 14px;">Relatório de Chamado de Suporte</p>
            </div>
          </div>
          <div style="text-align: right; font-size: 12px; color: #6b7280;">
            <p style="margin: 0;">Data de Geração:</p>
            <p style="font-weight: 500; margin: 4px 0 0 0;">${formatDate(new Date().toISOString())}</p>
          </div>
        </div>

        <!-- Informações Principais -->
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 12px;">Informações do Chamado</h2>
          <div style="background: #f9fafb; padding: 12px; border-radius: 6px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
              <div><strong>Número:</strong> #${ticket.ticket_number}</div>
              <div><strong>Status:</strong> ${getStatusText(ticket.status)}</div>
              <div><strong>Prioridade:</strong> ${getPriorityText(ticket.priority)}</div>
              <div><strong>Categoria:</strong> ${ticket.category}</div>
              <div><strong>Solicitante:</strong> ${ticket.requester?.name}</div>
              <div><strong>Unidade:</strong> ${ticket.unit?.name}</div>
              <div><strong>Técnico:</strong> ${ticket.assignee?.name || 'Não atribuído'}</div>
              <div><strong>Criado em:</strong> ${formatDate(ticket.created_at)}</div>
            </div>
          </div>
        </div>

        <!-- Título e Descrição -->
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 8px;">Título</h2>
          <p style="color: #374151; margin-bottom: 12px; font-size: 14px;">${ticket.title}</p>
          
          <h2 style="font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 8px;">Descrição</h2>
          <div style="background: #f9fafb; padding: 12px; border-radius: 6px;">
            <p style="color: #374151; white-space: pre-wrap; margin: 0; font-size: 14px;">${ticket.description}</p>
          </div>
        </div>

        <!-- Anexos -->
        ${ticket.attachments && ticket.attachments.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 12px;">Anexos</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              ${ticket.attachments.map((attachment: any) => `
                <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 8px;">
                  ${attachment.mime_type?.startsWith('image/') ? `
                    <img src="${attachment.public_url}" alt="${attachment.file_name}" 
                         style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 6px;" />
                  ` : `
                    <div style="text-align: center; padding: 12px;">
                      <p style="font-weight: 500; color: #374151; margin: 0; font-size: 12px;">${attachment.file_name}</p>
                      <p style="font-size: 10px; color: #6b7280; margin: 4px 0 0 0;">Arquivo anexado</p>
                    </div>
                  `}
                  <p style="font-size: 10px; color: #6b7280; margin: 0; text-overflow: ellipsis; overflow: hidden;">${attachment.file_name}</p>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Comentários -->
        ${ticket.comments && ticket.comments.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 12px;">Histórico de Comentários</h2>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${ticket.comments.map((comment: any) => `
                <div style="border-left: 4px solid #bfdbfe; background: #f9fafb; padding: 10px;">
                  <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <span style="font-weight: 500; color: #374151; font-size: 13px;">${comment.user?.name}</span>
                      ${comment.is_internal ? `
                        <span style="font-size: 10px; background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 3px;">
                          Interno
                        </span>
                      ` : ''}
                    </div>
                    <span style="font-size: 10px; color: #6b7280;">
                      ${formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p style="color: #374151; font-size: 12px; white-space: pre-wrap; margin: 0;">${comment.content}</p>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #d1d5db; text-align: center; font-size: 10px; color: #6b7280;">
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
