
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/ImageUpload"
import { useAuth } from "@/hooks/useAuth"
import { useUnits } from "@/hooks/useUnits"
import { useProfiles } from "@/hooks/useProfiles"

export interface TicketFormData {
  title: string
  description: string
  priority: 'baixa' | 'media' | 'alta' | 'critica'
  category: 'hardware' | 'software' | 'rede' | 'acesso' | 'outros'
  requester_id?: string
  unit_id: string
  images?: File[]
}

interface TicketFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'user' | 'admin'
  onSubmit: (data: TicketFormData) => Promise<void>
  isLoading?: boolean
}

export function TicketFormDialog({ 
  open, 
  onOpenChange, 
  mode, 
  onSubmit, 
  isLoading = false 
}: TicketFormDialogProps) {
  const { profile, user } = useAuth()
  const { data: units = [] } = useUnits()
  const { data: profiles = [] } = useProfiles()
  const [images, setImages] = useState<File[]>([])

  // Filtrar apenas usuários regulares para seleção do admin
  const regularUsers = profiles.filter(p => p.role === 'user')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    const ticketData: TicketFormData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      priority: formData.get('priority') as 'baixa' | 'media' | 'alta' | 'critica',
      category: formData.get('category') as 'hardware' | 'software' | 'rede' | 'acesso' | 'outros',
      unit_id: formData.get('unit_id') as string,
      images: images.length > 0 ? images : undefined
    }

    // Para admin, incluir o requester_id selecionado
    if (mode === 'admin') {
      ticketData.requester_id = formData.get('requester_id') as string
    } else {
      // Para usuário, usar o ID do usuário logado
      ticketData.requester_id = user?.id
    }

    try {
      await onSubmit(ticketData)
      onOpenChange(false)
      setImages([])
      ;(e.target as HTMLFormElement).reset()
    } catch (error) {
      console.error('Error creating ticket:', error)
    }
  }

  const getTitle = () => {
    return mode === 'admin' ? 'Criar Chamado para Usuário' : 'Criar Novo Chamado'
  }

  const getDescription = () => {
    return mode === 'admin' 
      ? 'Preencha as informações do chamado de suporte' 
      : 'Descreva seu problema e nossa equipe irá ajudá-lo'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-slate-50 border-slate-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-700">{getTitle()}</DialogTitle>
          <DialogDescription className="text-slate-600">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            {mode === 'admin' && (
              <div>
                <Label htmlFor="requester_id" className="text-slate-700">Solicitante</Label>
                <Select name="requester_id" required>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Selecione o usuário solicitante" />
                  </SelectTrigger>
                  <SelectContent>
                    {regularUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} - {user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="title" className="text-slate-700">Título</Label>
              <Input 
                id="title" 
                name="title" 
                placeholder="Descreva brevemente o problema"
                required 
                className="border-slate-300 focus:border-slate-400"
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="text-slate-700">Descrição</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Descreva detalhadamente o problema"
                required 
                className="border-slate-300 focus:border-slate-400"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority" className="text-slate-700">Prioridade</Label>
                <Select name="priority" required>
                  <SelectTrigger className="border-slate-300">
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
              
              <div>
                <Label htmlFor="category" className="text-slate-700">Categoria</Label>
                <Select name="category" required>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hardware">Hardware</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="rede">Rede</SelectItem>
                    <SelectItem value="acesso">Acesso</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="unit_id" className="text-slate-700">Unidade</Label>
              {mode === 'user' ? (
                <Input 
                  value={profile?.unit?.name || 'Unidade não definida'}
                  disabled
                  className="bg-slate-100 border-slate-300"
                />
              ) : (
                <Select name="unit_id" required>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {mode === 'user' && (
                <>
                  <input type="hidden" name="unit_id" value={profile?.unit?.id || ''} />
                  <p className="text-xs text-slate-500 mt-1">
                    Sua unidade será automaticamente selecionada
                  </p>
                </>
              )}
            </div>

            <ImageUpload 
              images={images}
              onImagesChange={setImages}
              maxImages={5}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-slate-600 hover:bg-slate-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Criando...' : 'Criar Chamado'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
