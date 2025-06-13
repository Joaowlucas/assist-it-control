
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useEffect } from 'react'

interface ColorSettings {
  custom_primary_color: string | null
  custom_primary_foreground_color: string | null
  custom_secondary_color: string | null
  custom_secondary_foreground_color: string | null
  custom_foreground_color: string | null
  custom_muted_foreground_color: string | null
  custom_destructive_color: string | null
  custom_destructive_foreground_color: string | null
  enable_custom_colors: boolean
}

const DEFAULT_COLORS = {
  primary: '#0f172a',
  primaryForeground: '#f8fafc',
  secondary: '#f1f5f9',
  secondaryForeground: '#0f172a',
  foreground: '#020617',
  mutedForeground: '#64748b',
  destructive: '#dc2626',
  destructiveForeground: '#fef2f2'
}

export function useColorCustomization() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: settings } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single()
      
      if (error) throw error
      return data
    },
  })

  const applyColors = (colors: ColorSettings) => {
    const root = document.documentElement
    
    if (colors.enable_custom_colors) {
      if (colors.custom_primary_color) {
        root.style.setProperty('--primary', colors.custom_primary_color)
      }
      if (colors.custom_primary_foreground_color) {
        root.style.setProperty('--primary-foreground', colors.custom_primary_foreground_color)
      }
      if (colors.custom_secondary_color) {
        root.style.setProperty('--secondary', colors.custom_secondary_color)
      }
      if (colors.custom_secondary_foreground_color) {
        root.style.setProperty('--secondary-foreground', colors.custom_secondary_foreground_color)
      }
      if (colors.custom_foreground_color) {
        root.style.setProperty('--foreground', colors.custom_foreground_color)
      }
      if (colors.custom_muted_foreground_color) {
        root.style.setProperty('--muted-foreground', colors.custom_muted_foreground_color)
      }
      if (colors.custom_destructive_color) {
        root.style.setProperty('--destructive', colors.custom_destructive_color)
      }
      if (colors.custom_destructive_foreground_color) {
        root.style.setProperty('--destructive-foreground', colors.custom_destructive_foreground_color)
      }
    } else {
      // Reset para cores padrão
      root.style.setProperty('--primary', DEFAULT_COLORS.primary)
      root.style.setProperty('--primary-foreground', DEFAULT_COLORS.primaryForeground)
      root.style.setProperty('--secondary', DEFAULT_COLORS.secondary)
      root.style.setProperty('--secondary-foreground', DEFAULT_COLORS.secondaryForeground)
      root.style.setProperty('--foreground', DEFAULT_COLORS.foreground)
      root.style.setProperty('--muted-foreground', DEFAULT_COLORS.mutedForeground)
      root.style.setProperty('--destructive', DEFAULT_COLORS.destructive)
      root.style.setProperty('--destructive-foreground', DEFAULT_COLORS.destructiveForeground)
    }
  }

  // Aplicar cores quando as configurações carregarem
  useEffect(() => {
    if (settings) {
      applyColors(settings)
    }
  }, [settings])

  const updateColorsMutation = useMutation({
    mutationFn: async (colors: Partial<ColorSettings>) => {
      const { data, error } = await supabase
        .from('system_settings')
        .update(colors)
        .eq('id', settings?.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] })
      applyColors(data)
      toast({
        title: "Cores atualizadas!",
        description: "As configurações de cores foram aplicadas com sucesso.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar cores",
        description: error.message || "Erro ao aplicar as configurações de cores.",
        variant: "destructive",
      })
    },
  })

  const resetColors = () => {
    updateColorsMutation.mutate({
      enable_custom_colors: false,
      custom_primary_color: null,
      custom_primary_foreground_color: null,
      custom_secondary_color: null,
      custom_secondary_foreground_color: null,
      custom_foreground_color: null,
      custom_muted_foreground_color: null,
      custom_destructive_color: null,
      custom_destructive_foreground_color: null,
    })
  }

  return {
    settings,
    updateColors: updateColorsMutation.mutate,
    resetColors,
    isUpdating: updateColorsMutation.isPending,
    applyColors
  }
}
