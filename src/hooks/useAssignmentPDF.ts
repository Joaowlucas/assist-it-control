
import { useState } from 'react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { useToast } from './use-toast'
import { supabase } from '@/integrations/supabase/client'

export function useAssignmentPDF() {
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const generateAssignmentPDF = async (assignmentId: string, equipmentName: string, userName: string) => {
    setIsGenerating(true)
    
    try {
      // Buscar dados completos da atribuição
      const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .select(`
          *,
          equipment:equipment(id, name, type, brand, model, serial_number, tombamento, unit:units(name)),
          user:profiles!assignments_user_id_fkey(id, name, email, unit:units(name)),
          assigned_by_user:profiles!assignments_assigned_by_fkey(id, name, email)
        `)
        .eq('id', assignmentId)
        .single()

      if (assignmentError) throw assignmentError

      // Buscar configurações do sistema
      const { data: systemSettings, error: settingsError } = await supabase
        .from('system_settings')
        .select('*')
        .single()

      if (settingsError) throw settingsError

      // Criar conteúdo HTML para o PDF
      const printContent = createAssignmentPrintHTML(assignment, systemSettings)
      
      // Criar elemento temporário
      const tempElement = document.createElement('div')
      tempElement.innerHTML = printContent
      tempElement.style.position = 'absolute'
      tempElement.style.left = '-9999px'
      tempElement.style.width = '800px'
      tempElement.style.backgroundColor = 'white'
      document.body.appendChild(tempElement)

      // Aguardar imagens carregarem
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Capturar como canvas
      const canvas = await html2canvas(tempElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800
      })

      // Criar PDF
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 295 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      // Adicionar primeira página
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Adicionar páginas adicionais se necessário
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Fazer download
      const fileName = `Atribuicao_${equipmentName.replace(/[^a-zA-Z0-9]/g, '_')}_${userName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
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

  const createAssignmentPrintHTML = (assignment: any, systemSettings: any) => {
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
              <p style="color: #6b7280; margin: 4px 0 0 0;">Relatório de Atribuição de Equipamento</p>
            </div>
          </div>
          <div style="text-align: right; font-size: 14px; color: #6b7280;">
            <p style="margin: 0;">Data de Geração:</p>
            <p style="font-weight: 500; margin: 4px 0 0 0;">${formatDateTime(new Date().toISOString())}</p>
          </div>
        </div>

        <!-- Informações da Atribuição -->
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 20px; font-weight: bold; color: #111827; margin-bottom: 16px;">Informações da Atribuição</h2>
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div><strong>ID da Atribuição:</strong> ${assignment.id}</div>
              <div><strong>Status:</strong> ${getStatusText(assignment.status)}</div>
              <div><strong>Data de Início:</strong> ${formatDate(assignment.start_date)}</div>
              <div><strong>Data de Fim:</strong> ${assignment.end_date ? formatDate(assignment.end_date) : 'Em andamento'}</div>
              <div><strong>Duração:</strong> ${duration} dias</div>
              <div><strong>Responsável pela Atribuição:</strong> ${assignment.assigned_by_user?.name || 'Sistema'}</div>
            </div>
          </div>
        </div>

        <!-- Informações do Equipamento -->
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 20px; font-weight: bold; color: #111827; margin-bottom: 16px;">Equipamento Atribuído</h2>
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div><strong>Nome:</strong> ${assignment.equipment?.name || '-'}</div>
              <div><strong>Tipo:</strong> ${assignment.equipment?.type || '-'}</div>
              <div><strong>Marca:</strong> ${assignment.equipment?.brand || '-'}</div>
              <div><strong>Modelo:</strong> ${assignment.equipment?.model || '-'}</div>
              <div><strong>Número de Série:</strong> ${assignment.equipment?.serial_number || '-'}</div>
              <div><strong>Tombamento:</strong> ${assignment.equipment?.tombamento || '-'}</div>
              <div><strong>Unidade do Equipamento:</strong> ${assignment.equipment?.unit?.name || '-'}</div>
            </div>
          </div>
        </div>

        <!-- Informações do Usuário -->
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 20px; font-weight: bold; color: #111827; margin-bottom: 16px;">Usuário Responsável</h2>
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div><strong>Nome:</strong> ${assignment.user?.name || '-'}</div>
              <div><strong>Email:</strong> ${assignment.user?.email || '-'}</div>
              <div><strong>Unidade:</strong> ${assignment.user?.unit?.name || '-'}</div>
            </div>
          </div>
        </div>

        <!-- Observações -->
        ${assignment.notes ? `
          <div style="margin-bottom: 24px;">
            <h2 style="font-size: 20px; font-weight: bold; color: #111827; margin-bottom: 8px;">Observações</h2>
            <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
              <p style="color: #374151; white-space: pre-wrap; margin: 0;">${assignment.notes}</p>
            </div>
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
    generateAssignmentPDF,
    isGenerating
  }
}
