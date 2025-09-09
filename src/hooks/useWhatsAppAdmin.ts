import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface WhatsAppTicket {
  id: string
  ticket_number: number
  title: string
  description: string
  category: string
  priority: string
  status: string
  created_at: string
  requester: {
    name: string
    phone: string
  }
  unit: {
    name: string
  }
}

export function useWhatsAppTickets() {
  return useQuery({
    queryKey: ['whatsapp-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          id,
          ticket_number,
          title,
          description,
          category,
          priority,
          status,
          created_at,
          requester:profiles!requester_id(name, phone),
          unit:units(name)
        `)
        .like('description', '%CHAMADO CRIADO VIA WHATSAPP%')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data as WhatsAppTicket[]
    },
  })
}

export function useWhatsAppStats() {
  return useQuery({
    queryKey: ['whatsapp-stats'],
    queryFn: async () => {
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('id, created_at, status, priority, category')
        .like('description', '%CHAMADO CRIADO VIA WHATSAPP%')

      if (error) throw error

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const thisWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000))
      const thisMonth = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000))

      const todayTickets = tickets.filter(t => new Date(t.created_at) >= today)
      const weekTickets = tickets.filter(t => new Date(t.created_at) >= thisWeek)
      const monthTickets = tickets.filter(t => new Date(t.created_at) >= thisMonth)

      return {
        total: tickets.length,
        today: todayTickets.length,
        thisWeek: weekTickets.length,
        thisMonth: monthTickets.length,
        byStatus: tickets.reduce((acc, ticket) => {
          acc[ticket.status] = (acc[ticket.status] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        byPriority: tickets.reduce((acc, ticket) => {
          acc[ticket.priority] = (acc[ticket.priority] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        byCategory: tickets.reduce((acc, ticket) => {
          acc[ticket.category] = (acc[ticket.category] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }
    },
  })
}

export function useTestWhatsAppWebhook() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ phone, message }: { phone: string; message: string }) => {
      const mockData = {
        data: {
          key: {
            remoteJid: `${phone}@s.whatsapp.net`,
            fromMe: false,
            id: `test-${Date.now()}`
          },
          messageType: 'conversation',
          message: {
            conversation: message
          },
          pushName: 'Teste',
          messageTimestamp: Date.now()
        }
      }

      const response = await supabase.functions.invoke('whatsapp-webhook', {
        body: mockData
      })

      if (response.error) {
        throw new Error(response.error.message)
      }

      return response.data
    },
    onSuccess: (data) => {
      toast({
        title: 'Teste realizado com sucesso',
        description: data.ticket 
          ? `Chamado #${data.ticket.ticket_number} criado para ${data.user}`
          : 'Webhook processado com sucesso',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro no teste',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}