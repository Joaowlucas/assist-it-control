
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUpdateUserTicket, UserTicket } from "@/hooks/useUserTickets"

interface EditTicketDialogProps {
  ticket: UserTicket | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditTicketDialog({ ticket, open, onOpenChange }: EditTicketDialogProps) {
  const updateTicketMutation = useUpdateUserTicket()
  const [formData, setFormData] = useState({
    title: ticket?.title || '',
    description: ticket?.description || '',
    priority: ticket?.priority || 'media',
    category: ticket?.category || 'outros'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticket) return

    try {
      await updateTicketMutation.mutateAsync({
        id: ticket.id,
        ...formData
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating ticket:', error)
    }
  }

  if (!ticket) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-slate-50 border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-slate-700">Editar Chamado #{ticket.ticket_number}</DialogTitle>
          <DialogDescription className="text-slate-600">
            Altere as informações do seu chamado
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="title" className="text-slate-700">Título</Label>
              <Input 
                id="title" 
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Descreva brevemente o problema"
                required 
                className="border-slate-300 focus:border-slate-400"
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="text-slate-700">Descrição</Label>
              <Textarea 
                id="description" 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva detalhadamente o problema"
                required 
                className="border-slate-300 focus:border-slate-400"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority" className="text-slate-700">Prioridade</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
                >
                  <SelectTrigger className="border-slate-300">
                    <SelectValue />
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
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({ ...formData, category: value as any })}
                >
                  <SelectTrigger className="border-slate-300">
                    <SelectValue />
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
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
              disabled={updateTicketMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-slate-600 hover:bg-slate-700 text-white"
              disabled={updateTicketMutation.isPending}
            >
              {updateTicketMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
