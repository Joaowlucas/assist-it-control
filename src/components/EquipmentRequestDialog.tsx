
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEquipmentRequests } from '@/hooks/useEquipmentRequests'
import { EQUIPMENT_TYPES } from '@/constants/equipmentTypes'
import { useToast } from '@/hooks/use-toast'

interface EquipmentRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EquipmentRequestDialog({ open, onOpenChange }: EquipmentRequestDialogProps) {
  const [formData, setFormData] = useState({
    equipment_type: '',
    justification: '',
    priority: 'media' as 'baixa' | 'media' | 'alta'
  })
  
  const { createRequest } = useEquipmentRequests()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.equipment_type || !formData.justification) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      })
      return
    }

    try {
      await createRequest.mutateAsync(formData)
      
      setFormData({
        equipment_type: '',
        justification: '',
        priority: 'media'
      })
      onOpenChange(false)
      
      toast({
        title: 'Solicitação enviada!',
        description: 'Sua solicitação de equipamento foi enviada para análise.',
      })
    } catch (error) {
      console.error('Error creating equipment request:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Solicitar Equipamento</DialogTitle>
          <DialogDescription>
            Preencha os dados para solicitar um novo equipamento.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="equipment_type">Tipo de Equipamento *</Label>
            <Select value={formData.equipment_type} onValueChange={(value) => handleInputChange('equipment_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {EQUIPMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="justification">Justificativa *</Label>
            <Textarea
              id="justification"
              value={formData.justification}
              onChange={(e) => handleInputChange('justification', e.target.value)}
              placeholder="Explique qual equipamento você precisa e por que você precisa dele..."
              rows={4}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="priority">Prioridade</Label>
            <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createRequest.isPending}>
              {createRequest.isPending ? 'Enviando...' : 'Enviar Solicitação'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
