
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/ImageUpload"
import { useCreateUserTicket } from "@/hooks/useUserTickets"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

interface CreateUserTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Categorias padronizadas do sistema
const TICKET_CATEGORIES = [
  { value: "hardware", label: "Hardware" },
  { value: "software", label: "Software" },
  { value: "rede", label: "Rede" },
  { value: "acesso", label: "Acesso" },
  { value: "outros", label: "Outros" }
] as const

const TICKET_PRIORITIES = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" }
] as const

export function CreateUserTicketDialog({ open, onOpenChange }: CreateUserTicketDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'outros' as 'hardware' | 'software' | 'rede' | 'acesso' | 'outros',
    priority: 'media' as 'baixa' | 'media' | 'alta' | 'critica'
  })

  const { profile } = useAuth()
  const createTicket = useCreateUserTicket()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await createTicket.mutateAsync({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        unit_id: profile!.unit_id!, // Usuário só pode criar ticket para sua unidade
        images: images
      })
      
      toast.success("Chamado criado com sucesso!")
      onOpenChange(false)
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'outros',
        priority: 'media'
      })
      setImages([])
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar chamado")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Chamado</DialogTitle>
          <DialogDescription>
            Descreva o problema ou solicitação que você precisa resolver
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input 
                id="title" 
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Computador não liga"
                required 
              />
            </div>
            
            <div>
              <Label htmlFor="description">Descrição *</Label>
              <Textarea 
                id="description" 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva detalhadamente o problema ou solicitação..."
                className="min-h-[100px]"
                required 
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoria *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({ ...formData, category: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="priority">Prioridade *</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_PRIORITIES.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
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

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar Chamado'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
