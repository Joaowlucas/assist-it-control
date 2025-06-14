
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TicketAttachmentManager } from "@/components/TicketAttachmentManager"
import { useUpdateUserTicket, UserTicket } from "@/hooks/useUserTickets"
import { useTicketAttachments } from "@/hooks/useTicketAttachments"

interface EditTicketDialogProps {
  ticket: UserTicket | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditTicketDialog({ ticket, open, onOpenChange }: EditTicketDialogProps) {
  const updateTicketMutation = useUpdateUserTicket()
  const { data: attachments = [], isLoading: attachmentsLoading, error: attachmentsError } = useTicketAttachments(ticket?.id || '')
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'media' as 'baixa' | 'media' | 'alta' | 'critica',
    category: 'outros' as 'hardware' | 'software' | 'rede' | 'acesso' | 'outros'
  })

  console.log('EditTicketDialog - ticket:', ticket?.id)
  console.log('EditTicketDialog - attachments:', attachments)
  console.log('EditTicketDialog - attachmentsError:', attachmentsError)

  // Atualizar form data quando o ticket mudar
  useEffect(() => {
    if (ticket) {
      setFormData({
        title: ticket.title || '',
        description: ticket.description || '',
        priority: ticket.priority || 'media',
        category: ticket.category || 'outros'
      })
    }
  }, [ticket])

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

  // Preparar anexos para o gerenciador
  const attachmentsWithUrls = attachments.map(attachment => ({
    ...attachment,
    public_url: attachment.public_url || ''
  }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-slate-50 border-slate-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-700">Editar Chamado #{ticket.ticket_number}</DialogTitle>
          <DialogDescription className="text-slate-600">
            Altere as informações do seu chamado e gerencie os anexos
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
                className="border-slate-300 focus:border-slate-400 min-h-[100px]"
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

          {/* Gerenciamento de Anexos */}
          <div className="border-t border-slate-200 pt-4">
            <Label className="text-slate-700 text-base font-medium">Anexos</Label>
            <div className="mt-3">
              {attachmentsLoading ? (
                <div className="text-center text-slate-500 py-4">Carregando anexos...</div>
              ) : attachmentsError ? (
                <div className="text-center text-red-500 py-4">
                  Erro ao carregar anexos: {attachmentsError.message}
                </div>
              ) : (
                <TicketAttachmentManager
                  ticketId={ticket.id}
                  existingAttachments={attachmentsWithUrls}
                />
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
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
              {updateTicketMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
