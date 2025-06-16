
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
      console.log('Iniciando envio de WhatsApp...', { ticketId, phone: phone.substring(0, 4) + '****', userId })

      // Validar telefone
      const cleanPhone = phone.replace(/\D/g, '')
      if (cleanPhone.length < 10 || cleanPhone.length > 13) {
        throw new Error('Número de telefone inválido. Use o formato (11) 99999-9999')
      }

      // Primeiro salvar no banco
      const { data: notification, error } = await supabase
        .from('whatsapp_notifications')
        .insert({
          ticket_id: ticketId || null,
          user_id: userId || null,
          phone_number: cleanPhone,
          message,
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao salvar notificação:', error)
        throw new Error('Erro ao salvar notificação: ' + error.message)
      }

      console.log('Notificação salva:', notification.id)

      // Tentar enviar via Evolution API
      try {
        console.log('Chamando função send-whatsapp...')
        const response = await supabase.functions.invoke('send-whatsapp', {
          body: {
            phone: cleanPhone,
            message,
            notificationId: notification.id
          }
        })

        if (response.error) {
          console.error('Erro na função send-whatsapp:', response.error)
          throw new Error(response.error.message || 'Erro na função de envio')
        }

        console.log('WhatsApp enviado com sucesso:', response.data)
        return notification
      } catch (error) {
        console.error('Erro no envio:', error)
        
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
      console.error('Erro no hook de envio:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao enviar mensagem WhatsApp: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}
