import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface WhatsAppTicketConfig {
  enabled: boolean
  welcomeMessage: string
  confirmationTemplate: string
  errorMessage: string
}

export function useWhatsAppTicketConfig() {
  return useQuery({
    queryKey: ['whatsapp-ticket-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single()

      if (error) throw error
      
      return {
        enabled: data.whatsapp_enabled || false,
        welcomeMessage: 'Olá! Digite sua solicitação de TI e criaremos um chamado automaticamente para você.',
        confirmationTemplate: '✅ Chamado #{ticket_number} criado com sucesso!\n📝 {title}\n📂 {category}\n⚡ {priority}',
        errorMessage: 'Desculpe, não foi possível criar o chamado. Tente novamente ou entre em contato conosco.'
      }
    },
  })
}

export function useUpdateWhatsAppTicketConfig() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (config: Partial<WhatsAppTicketConfig>) => {
      const { data, error } = await supabase
        .from('system_settings')
        .update({
          whatsapp_enabled: config.enabled
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-ticket-config'] })
      queryClient.invalidateQueries({ queryKey: ['system-settings'] })
      toast({
        title: 'Sucesso',
        description: 'Configuração do WhatsApp atualizada',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar configuração: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useWhatsAppTicketStats() {
  return useQuery({
    queryKey: ['whatsapp-ticket-stats'],
    queryFn: async () => {
      // Buscar estatísticas de chamados criados via WhatsApp
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('id, created_at, status, priority')
        .like('description', '%CHAMADO CRIADO VIA WHATSAPP%')
        .order('created_at', { ascending: false })

      if (error) throw error

      const today = new Date()
      const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000))

      const recentTickets = tickets.filter(ticket => 
        new Date(ticket.created_at) >= thirtyDaysAgo
      )

      return {
        total: tickets.length,
        recent: recentTickets.length,
        byStatus: tickets.reduce((acc, ticket) => {
          acc[ticket.status] = (acc[ticket.status] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        byPriority: tickets.reduce((acc, ticket) => {
          acc[ticket.priority] = (acc[ticket.priority] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }
    },
  })
}