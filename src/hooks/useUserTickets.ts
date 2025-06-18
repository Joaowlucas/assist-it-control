
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'

export interface UserTicket {
  id: string
  ticket_number: number
  title: string
  description: string
  priority: 'baixa' | 'media' | 'alta' | 'critica'
  category: string
  status: 'aberto' | 'em_andamento' | 'aguardando' | 'fechado'
  created_at: string
  updated_at: string
  unit_id: string
  resolved_at: string | null
  unit?: {
    id: string
    name: string
  }
  requester?: {
    name: string
    email: string
  }
  assignee?: {
    name: string
    email: string
  }
  attachments?: Array<{
    id: string
    file_name: string
    file_path: string
    public_url: string
    uploader: {
      name: string
      email: string
    }
  }>
}

export interface CreateTicketData {
  title: string
  description: string
  priority: 'baixa' | 'media' | 'alta' | 'critica'
  category: string
  unit_id?: string
  images?: File[]
}

export function useUserTickets() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['user-tickets', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []

      console.log('Fetching user tickets for:', profile.id)
      
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          unit:units(id, name),
          requester:profiles!tickets_requester_id_fkey(name, email),
          assignee:profiles!tickets_assignee_id_fkey(name, email),
          attachments:ticket_attachments(
            *,
            uploader:profiles(name, email)
          )
        `)
        .eq('requester_id', profile.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching user tickets:', error)
        throw error
      }
      
      // Gerar URLs públicas para os anexos
      const ticketsWithAttachments = data?.map(ticket => ({
        ...ticket,
        unit_id: ticket.unit?.id || '',
        resolved_at: ticket.resolved_at || null,
        attachments: ticket.attachments?.map(attachment => {
          const { data: urlData } = supabase.storage
            .from('ticket-attachments')
            .getPublicUrl(attachment.file_path)
          
          return {
            ...attachment,
            public_url: urlData.publicUrl
          }
        }) || []
      })) || []
      
      console.log('User tickets fetched:', ticketsWithAttachments)
      return ticketsWithAttachments as UserTicket[]
    },
    enabled: !!profile?.id,
  })
}

export function useCreateUserTicket() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (ticketData: CreateTicketData) => {
      if (!profile) {
        throw new Error('Usuário não autenticado')
      }

      console.log('Creating user ticket:', ticketData)

      // Usar unit_id fornecido ou unit_id do perfil como fallback
      const unitId = ticketData.unit_id || profile.unit_id
      
      if (!unitId) {
        throw new Error('Unidade não definida')
      }

      // Criar o chamado
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          title: ticketData.title,
          description: ticketData.description,
          priority: ticketData.priority,
          category: ticketData.category,
          requester_id: profile.id,
          unit_id: unitId,
          status: 'aberto'
        })
        .select(`
          *,
          unit:units(name),
          requester:profiles!tickets_requester_id_fkey(name, email),
          assignee:profiles!tickets_assignee_id_fkey(name, email)
        `)
        .single()

      if (ticketError) {
        console.error('Error creating ticket:', ticketError)
        throw ticketError
      }

      console.log('Ticket created:', ticket)

      // Upload das imagens se existirem
      if (ticketData.images && ticketData.images.length > 0) {
        console.log('Uploading images for ticket:', ticket.id)
        
        for (const image of ticketData.images) {
          const fileExt = image.name.split('.').pop()
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
          const filePath = `${profile.id}/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('ticket-attachments')
            .upload(filePath, image)

          if (uploadError) {
            console.error('Error uploading image:', uploadError)
            continue
          }

          // Criar registro do anexo
          const { error: attachmentError } = await supabase
            .from('ticket_attachments')
            .insert({
              ticket_id: ticket.id,
              file_name: image.name,
              file_path: filePath,
              file_size: image.size,
              mime_type: image.type,
              uploaded_by: profile.id
            })

          if (attachmentError) {
            console.error('Error creating attachment record:', attachmentError)
          }
        }
      }

      return ticket
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-tickets'] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      toast({
        title: 'Sucesso',
        description: `Chamado #${data.ticket_number} criado com sucesso`,
      })
    },
    onError: (error: any) => {
      console.error('Error in createUserTicket mutation:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao criar chamado: ' + (error.message || 'Erro desconhecido'),
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateUserTicket() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UserTicket> & { id: string }) => {
      console.log('Updating user ticket:', { id, updates })
      
      const { data, error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          unit:units(name),
          requester:profiles!tickets_requester_id_fkey(name, email),
          assignee:profiles!tickets_assignee_id_fkey(name, email)
        `)
        .single()
      
      if (error) {
        console.error('Error updating user ticket:', error)
        throw error
      }
      
      console.log('User ticket updated:', data)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-tickets'] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      toast({
        title: 'Sucesso',
        description: 'Chamado atualizado com sucesso',
      })
    },
    onError: (error: any) => {
      console.error('Error in updateUserTicket mutation:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar chamado: ' + (error.message || 'Erro desconhecido'),
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteUserTicket() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (ticketId: string) => {
      console.log('Deleting user ticket:', ticketId)
      
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId)
      
      if (error) {
        console.error('Error deleting user ticket:', error)
        throw error
      }
      
      console.log('User ticket deleted:', ticketId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-tickets'] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      toast({
        title: 'Sucesso',
        description: 'Chamado excluído com sucesso',
      })
    },
    onError: (error: any) => {
      console.error('Error in deleteUserTicket mutation:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao excluir chamado: ' + (error.message || 'Erro desconhecido'),
        variant: 'destructive',
      })
    },
  })
}
