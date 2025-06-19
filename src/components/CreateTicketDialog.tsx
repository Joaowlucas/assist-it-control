
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useCreateUserTicket } from '@/hooks/useUserTickets'
import { useTicketCategories } from '@/hooks/useTicketCategories'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { ImageUpload } from '@/components/ImageUpload'
import { MapPin } from 'lucide-react'

interface CreateTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTicketDialog({ open, onOpenChange }: CreateTicketDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'outros' as const,
    priority: 'media' as const
  })
  const [images, setImages] = useState<File[]>([])
  
  const createTicket = useCreateUserTicket()
  const { data: categories = [] } = useTicketCategories()
  const { toast } = useToast()
  const { profile } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.description) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      })
      return
    }

    try {
      await createTicket.mutateAsync({
        ...formData,
        images: images.length > 0 ? images : undefined
      })
      
      setFormData({
        title: '',
        description: '',
        category: 'outros',
        priority: 'media'
      })
      setImages([])
      onOpenChange(false)
      
      toast({
        title: 'Chamado criado!',
        description: 'Seu chamado foi criado e enviado para análise.',
      })
    } catch (error) {
      console.error('Error creating ticket:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Chamado</DialogTitle>
          <DialogDescription>
            Preencha os dados para criar um novo chamado de suporte.
          </DialogDescription>
        </DialogHeader>

        {/* Informações da Unidade */}
        {profile?.unit?.name && (
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Unidade: <strong>{profile.unit.name}</strong></span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Título *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Descreva brevemente o problema"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">
                Descrição *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva detalhadamente o problema, incluindo passos para reproduzi-lo, mensagens de erro, etc."
                rows={4}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(category => category.name && category.name.trim() !== '').map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="hardware">Hardware</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="rede">Rede</SelectItem>
                    <SelectItem value="acesso">Acesso</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Baixa
                      </div>
                    </SelectItem>
                    <SelectItem value="media">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        Média
                      </div>
                    </SelectItem>
                    <SelectItem value="alta">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        Alta
                      </div>
                    </SelectItem>
                    <SelectItem value="critica">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        Crítica
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Upload de Imagens */}
          <div className="space-y-4">
            <ImageUpload
              images={images}
              onImagesChange={setImages}
              maxImages={5}
              maxSize={5 * 1024 * 1024} // 5MB
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createTicket.isPending}>
              {createTicket.isPending ? 'Criando...' : 'Criar Chamado'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
