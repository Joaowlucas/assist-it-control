
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface NotificationSetting {
  id: string
  user_id: string
  notification_type: 'tickets' | 'assignments' | 'equipment'
  enabled: boolean
  phone_override?: string
  created_at: string
  updated_at: string
}

export function useNotificationSettings(userId?: string) {
  return useQuery({
    queryKey: ['notification-settings', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId || '')
        .order('notification_type')
      
      if (error) throw error
      return data as NotificationSetting[]
    },
    enabled: !!userId,
  })
}

export function useUpdateNotificationSetting() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (setting: Partial<NotificationSetting> & { user_id: string, notification_type: string }) => {
      const { data, error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: setting.user_id,
          notification_type: setting.notification_type,
          enabled: setting.enabled ?? true,
          phone_override: setting.phone_override || null,
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] })
      toast({
        title: 'Configurações atualizadas',
        description: 'Suas preferências de notificação foram salvas.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Erro ao atualizar configurações de notificação.',
        variant: 'destructive',
      })
    },
  })
}

export function useNotificationLogs(userId?: string) {
  return useQuery({
    queryKey: ['notification-logs', userId],
    queryFn: async () => {
      let query = supabase
        .from('notification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (userId) {
        query = query.eq('user_id', userId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data
    },
  })
}

export function useTestWhatsAppConnection() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ phone, message }: { phone: string, message?: string }) => {
      const { data, error } = await supabase.functions.invoke('whatsapp-notifications', {
        body: {
          type: 'test',
          action: 'test',
          entityId: 'test',
          entityData: {
            test: true,
            phone: phone,
            message: message || 'Teste de conexão WhatsApp - Sistema de TI funcionando!'
          }
        }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast({
        title: 'Teste enviado!',
        description: `Mensagem de teste enviada. ${data.sent || 0} enviadas, ${data.failed || 0} falharam.`,
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro no teste',
        description: error.message || 'Erro ao enviar mensagem de teste.',
        variant: 'destructive',
      })
    },
  })
}
