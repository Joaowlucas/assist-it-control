
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSystemSettings, useUpdateSystemSettings } from '@/hooks/useSystemSettings'
import { useForm } from 'react-hook-form'
import { Settings, Save } from 'lucide-react'

export function SystemSettingsForm() {
  const { data: settings, isLoading } = useSystemSettings()
  const updateSettings = useUpdateSystemSettings()

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: settings
  })

  React.useEffect(() => {
    if (settings) {
      Object.keys(settings).forEach(key => {
        setValue(key as any, (settings as any)[key])
      })
    }
  }, [settings, setValue])

  const onSubmit = (data: any) => {
    updateSettings.mutate(data)
  }

  if (isLoading) {
    return <div>Carregando configurações...</div>
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company_name">Nome da Empresa</Label>
          <Input
            id="company_name"
            {...register('company_name')}
            placeholder="Nome da sua empresa"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="department_name">Nome do Departamento</Label>
          <Input
            id="department_name"
            {...register('department_name')}
            placeholder="Ex: TI, Informática"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="support_email">Email de Suporte</Label>
          <Input
            id="support_email"
            type="email"
            {...register('support_email')}
            placeholder="suporte@empresa.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ticket_email">Email para Chamados</Label>
          <Input
            id="ticket_email"
            type="email"
            {...register('ticket_email')}
            placeholder="chamados@empresa.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="equipment_email">Email para Equipamentos</Label>
          <Input
            id="equipment_email"
            type="email"
            {...register('equipment_email')}
            placeholder="equipamentos@empresa.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="default_priority">Prioridade Padrão</Label>
          <Select onValueChange={(value) => setValue('default_priority', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baixa">Baixa</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="critica">Crítica</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="auto_assign_tickets"
          onCheckedChange={(checked) => setValue('auto_assign_tickets', checked)}
          checked={watch('auto_assign_tickets')}
        />
        <Label htmlFor="auto_assign_tickets">
          Atribuir chamados automaticamente
        </Label>
      </div>

      <Button type="submit" disabled={updateSettings.isPending}>
        <Save className="h-4 w-4 mr-2" />
        {updateSettings.isPending ? 'Salvando...' : 'Salvar Configurações'}
      </Button>
    </form>
  )
}
