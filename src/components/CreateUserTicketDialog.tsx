
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCreateTicket } from "@/hooks/useTickets"
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

export function CreateUserTicketDialog({ open, onOpenChange }: CreateUserTicketDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { profile } = useAuth()
  const createTicket = useCreateTicket()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    
    try {
      const ticketData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        category: formData.get('category') as 'hardware' | 'software' | 'rede' | 'acesso' | 'outros',
        priority: formData.get('priority') as 'baixa' | 'media' | 'alta' | 'critica',
        unit_id: profile!.unit_id!, // Usuário só pode criar ticket para sua unidade
        requester_id: profile!.id,
        status: 'aberto' as const,
      }

      await createTicket.mutateAsync(ticketData)
      toast.success("Chamado criado com sucesso!")
      onOpenChange(false)
      
      // Reset form
      const form = e.currentTarget
      form.reset()
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar chamado")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Chamado</DialogTitle>
          <DialogDescription>
            Descreva o problema ou solicitação que você precisa resolver
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="title">Título *</Label>
              <Input 
                id="title" 
                name="title" 
                placeholder="Ex: Computador não liga"
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Categoria *</Label>
              <Select name="category" required>
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
              <Select name="priority" required>
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

          <div>
            <Label htmlFor="description">Descrição *</Label>
            <Textarea 
              id="description" 
              name="description" 
              placeholder="Descreva detalhadamente o problema ou solicitação..."
              className="min-h-[100px]"
              required 
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
