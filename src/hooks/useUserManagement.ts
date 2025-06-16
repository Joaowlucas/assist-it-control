
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useUpdateTechnicianUnits } from '@/hooks/useTechnicianUnits'

interface CreateUserData {
  name: string
  email: string
  password: string
  role: 'admin' | 'technician' | 'user'
  unit_id: string | null
  unit_ids?: string[]
}

interface UpdateUserData {
  id: string
  name?: string
  email?: string
  role?: 'admin' | 'technician' | 'user'
  unit_id?: string | null
  unit_ids?: string[]
  status?: string
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (userData: CreateUserData) => {
      console.log('Creating user with data:', userData)
      console.log('User phone number:', userData.phone)

      // Validar se há telefone quando necessário
      if (!userData.phone || userData.phone.trim() === '') {
        console.warn('User being created without phone number')
      }

      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Você precisa estar logado para criar usuários')
      }

      // Call the edge function to create user
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: userData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      console.log('Edge function response:', { data, error })

      if (error) {
        console.error('Edge function error:', error)
        throw new Error(error.message || 'Erro ao criar usuário')
      }

      if (data?.error) {
        console.error('Edge function returned error:', data.error)
        throw new Error(data.error)
      }

      if (!data?.success) {
        throw new Error('Falha ao criar usuário')
      }

      return data
    },
    onSuccess: (data) => {
      console.log('User created successfully:', data)
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      queryClient.invalidateQueries({ queryKey: ['technician-units'] })
      toast({
        title: 'Usuário criado com sucesso!',
        description: 'O novo usuário foi adicionado ao sistema.',
      })
    },
    onError: (error: any) => {
      console.error('Create user error:', error)
      toast({
        title: 'Erro ao criar usuário',
        description: error.message || 'Erro ao criar o usuário.',
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const updateTechnicianUnits = useUpdateTechnicianUnits()

  return useMutation({
    mutationFn: async ({ id, unit_ids, ...updateData }: UpdateUserData) => {
      console.log('Updating user:', id, 'with data:', updateData)
      console.log('User phone number:', updateData.phone)

      // Se está atualizando email, verificar se já existe
      if (updateData.email) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('email, id')
          .eq('email', updateData.email)
          .neq('id', id)
          .single()

        if (existingUser) {
          throw new Error('Email já está em uso por outro usuário')
        }
      }

      // Atualizar perfil (sem unit_ids que é específico para técnicos)
      const profileData = { ...updateData }
      delete (profileData as any).unit_ids

      console.log('Updating profile with data:', profileData)

      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', id)
        .select(`
          *,
          unit:units(name)
        `)
        .single()

      if (error) {
        console.error('Error updating profile:', error)
        throw error
      }

      console.log('Profile updated successfully:', data)

      // Se for técnico e tiver unit_ids, atualizar unidades do técnico
      if (updateData.role === 'technician' && unit_ids) {
        await updateTechnicianUnits.mutateAsync({
          technicianId: id,
          unitIds: unit_ids
        })
      }

      return data
    },
    onSuccess: (data) => {
      console.log('User update completed:', data)
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      queryClient.invalidateQueries({ queryKey: ['technician-units'] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      toast({
        title: 'Usuário atualizado!',
        description: `${data.name} foi atualizado com sucesso.`,
      })
    },
    onError: (error: any) => {
      console.error('Update user error:', error)
      toast({
        title: 'Erro ao atualizar usuário',
        description: error.message || 'Erro ao atualizar o usuário.',
        variant: 'destructive',
      })
    },
  })
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ userId, currentStatus }: { userId: string, currentStatus: string }) => {
      const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo'
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId)
        .select('name, status')
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      toast({
        title: `Usuário ${data.status === 'ativo' ? 'ativado' : 'desativado'}!`,
        description: `${data.name} foi ${data.status === 'ativo' ? 'ativado' : 'desativado'} com sucesso.`,
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao alterar status',
        description: error.message || 'Erro ao alterar status do usuário.',
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (userId: string) => {
      // Verificar se usuário tem tickets ou atribuições antes de deletar
      const { data: tickets } = await supabase
        .from('tickets')
        .select('id')
        .or(`requester_id.eq.${userId},assignee_id.eq.${userId}`)
        .limit(1)

      const { data: assignments } = await supabase
        .from('assignments')
        .select('id')
        .or(`user_id.eq.${userId},assigned_by.eq.${userId}`)
        .limit(1)

      if (tickets && tickets.length > 0) {
        throw new Error('Não é possível excluir usuário com tickets vinculados')
      }

      if (assignments && assignments.length > 0) {
        throw new Error('Não é possível excluir usuário com atribuições vinculadas')
      }

      // Deletar perfil (isso também deletará o usuário da auth via cascade)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      toast({
        title: 'Usuário removido!',
        description: 'O usuário foi removido do sistema.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover usuário',
        description: error.message || 'Erro ao remover o usuário.',
        variant: 'destructive',
      })
    },
  })
}

export function useResetUserPassword() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error
    },
    onSuccess: () => {
      toast({
        title: 'Email de recuperação enviado!',
        description: 'Um email com instruções para redefinir a senha foi enviado.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao enviar email',
        description: error.message || 'Erro ao enviar email de recuperação.',
        variant: 'destructive',
      })
    },
  })
}
