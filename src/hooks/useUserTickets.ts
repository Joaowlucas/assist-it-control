
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

export interface TicketAttachment {
  id: string
  file_name: string
  file_path: string
  file_size: number | null
  mime_type: string | null
  created_at: string
}

export interface UserTicket {
  id: string
  title: string
  description: string
  priority: 'baixa' | 'media' | 'alta' | 'critica'
  status: 'aberto' | 'em_andamento' | 'aguardando' | 'fechado'
  category: 'hardware' | 'software' | 'rede' | 'acesso' | 'outros'
  created_at: string
  updated_at: string | null
  unit: { name: string } | null
  assignee: { name: string } | null
  attachments?: TicketAttachment[]
}

export function useUserTickets() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['user-tickets', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('tickets')
        .select(`
          id,
          title,
          description,
          priority,
          status,
          category,
          created_at,
          updated_at,
          unit:units(name),
          assignee:profiles!tickets_assignee_id_fkey(name),
          attachments:ticket_attachments(
            id,
            file_name,
            file_path,
            file_size,
            mime_type,
            created_at
          )
        `)
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as UserTicket[]
    },
    enabled: !!user,
  })
}

export function useCreateUserTicket() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user, profile } = useAuth()

  return useMutation({
    mutationFn: async ({ 
      title, 
      description, 
      priority, 
      category, 
      images 
    }: {
      title: string
      description: string
      priority: 'baixa' | 'media' | 'alta' | 'critica'
      category: 'hardware' | 'software' | 'rede' | 'acesso' | 'outros'
      images?: File[]
    }) => {
      if (!user || !profile?.unit_id) {
        throw new Error('Usuário não autenticado ou sem unidade definida')
      }

      console.log('Creating ticket with data:', { title, description, priority, category, unit_id: profile.unit_id })

      // Criar o chamado
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          title,
          description,
          priority,
          category,
          requester_id: user.id,
          unit_id: profile.unit_id,
          status: 'aberto'
        })
        .select()
        .single()

      if (ticketError) throw ticketError

      console.log('Ticket created:', ticket)

      // Upload das imagens se houver
      if (images && images.length > 0) {
        console.log('Uploading images:', images.length)
        
        for (const image of images) {
          const fileExt = image.name.split('.').pop()
          const fileName = `${user.id}/${ticket.id}/${Math.random()}.${fileExt}`
          
          // Upload da imagem
          const { error: uploadError } = await supabase.storage
            .from('ticket-attachments')
            .upload(fileName, image)

          if (uploadError) {
            console.error('Upload error:', uploadError)
            throw uploadError
          }

          // Criar registro do anexo
          const { error: attachmentError } = await supabase
            .from('ticket_attachments')
            .insert({
              ticket_id: ticket.id,
              file_name: image.name,
              file_path: fileName,
              file_size: image.size,
              mime_type: image.type,
              uploaded_by: user.id
            })

          if (attachmentError) {
            console.error('Attachment error:', attachmentError)
            throw attachmentError
          }
        }
      }

      return ticket
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-tickets'] })
      toast({
        title: 'Chamado criado com sucesso!',
        description: 'Seu chamado foi criado e está aguardando atendimento.',
      })
    },
    onError: (error: any) => {
      console.error('Create ticket error:', error)
      toast({
        title: 'Erro ao criar chamado',
        description: error.message || 'Erro ao criar o chamado.',
        variant: 'destructive',
      })
    },
  })
}
