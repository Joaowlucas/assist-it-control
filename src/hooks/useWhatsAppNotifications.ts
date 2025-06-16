
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface WhatsAppNotification {
  id: string
  ticket_id: string | null
  user_id: string | null
  phone_number: string
  message: string
  status: 'pending' | 'sent' | 'failed'
  evolution_message_id: string | null
  error_message: string | null
  sent_at: string | null
  created_at: string
  updated_at: string
}

export function useWhatsAppNotifications() {
  return useQuery({
    queryKey: ['whatsapp-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_notifications')
        .select(`
          *,
          ticket:tickets(ticket_number, title),
          user:profiles(name)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
  })
}

export function useSendWhatsAppMessage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ 
      ticketId, 
      phone, 
      message, 
      userId 
    }: {
      ticketId?: string
      phone: string
      message: string
      userId?: string
    }) => {
      // Primeiro salvar no banco
      const { data: notification, error } = await supabase
        .from('whatsapp_notifications')
        .insert({
          ticket_id: ticketId || null,
          user_id: userId || null,
          phone_number: phone,
          message,
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      // Tentar enviar via Evolution API
      try {
        const response = await fetch('/api/send-whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone,
            message,
            notificationId: notification.id
          })
        })

        if (!response.ok) {
          throw new Error('Erro ao enviar mensagem')
        }

        return notification
      } catch (error) {
        // Atualizar status para failed
        await supabase
          .from('whatsapp_notifications')
          .update({ 
            status: 'failed', 
            error_message: error instanceof Error ? error.message : 'Erro desconhecido' 
          })
          .eq('id', notification.id)

        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-notifications'] })
      toast({
        title: 'Sucesso',
        description: 'Mensagem WhatsApp enviada com sucesso!',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao enviar mensagem WhatsApp: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}
