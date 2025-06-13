
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/ImageUpload"
import { AttachmentsPreview } from "@/components/AttachmentsPreview"
import { useUpdateUserTicket, UserTicket } from "@/hooks/useUserTickets"
import { useUpdateTicketAttachments } from "@/hooks/useUpdateTicketAttachments"
import { useTicketAttachments } from "@/hooks/useTicketAttachments"
import { Paperclip } from "lucide-react"

interface EditTicketDialogProps {
  ticket: UserTicket | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditTicketDialog({ ticket, open, onOpenChange }: EditTicketDialogProps) {
  const updateTicketMutation = useUpdateUserTicket()
  const { addAttachments } = useUpdateTicketAttachments()
  const { data: attachments = [] } = useTicketAttachments(ticket?.id || '')
  
  const [formData, setFormData] = useState({
    title: ticket?.title || '',
    description: ticket?.description || '',
    priority: ticket?.priority || 'media',
    category: ticket?.category || 'outros'
  })
  const [newImages, setNewImages] = useState<File[]>([])
  const [showAttachmentsPreview, setShowAttachmentsPreview] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticket) return

    try {
      await updateTicketMutation.mutateAsync({
        id: ticket.id,
        ...formData
      })

      // Adicionar novos anexos se houver
      if (newImages.length > 0) {
        await addAttachments.mutateAsync({
          ticketId: ticket.id,
          images: newImages
        })
        setNewImages([])
      }

      onOpenChange(false)
    } catch (error) {
      console.error('Error updating ticket:', error)
    }
  }

  if (!ticket) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] bg-slate-50 border-slate-200 max-h-[90vh] overflow-y-auto">
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

              {/* Seção de Anexos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-700">Anexos</Label>
                  {attachments.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAttachmentsPreview(true)}
                      className="flex items-center gap-2"
                    >
                      <Paperclip className="h-4 w-4" />
                      Ver {attachments.length} anexo{attachments.length > 1 ? 's' : ''}
                    </Button>
                  )}
                </div>
                
                <div>
                  <Label className="text-slate-700 text-sm">Adicionar novos anexos</Label>
                  <ImageUpload 
                    images={newImages}
                    onImagesChange={setNewImages}
                    maxImages={5}
                  />
                </div>
                
                {newImages.length > 0 && (
                  <p className="text-xs text-slate-500">
                    {newImages.length} novo{newImages.length > 1 ? 's' : ''} anexo{newImages.length > 1 ? 's' : ''} será{newImages.length > 1 ? 'ão' : ''} adicionado{newImages.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                className="border-slate-300 text-slate-700 hover:bg-slate-100"
                disabled={updateTicketMutation.isPending || addAttachments.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-slate-600 hover:bg-slate-700 text-white"
                disabled={updateTicketMutation.isPending || addAttachments.isPending}
              >
                {updateTicketMutation.isPending || addAttachments.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AttachmentsPreview
        ticketId={ticket.id}
        ticketNumber={ticket.ticket_number.toString()}
        open={showAttachmentsPreview}
        onOpenChange={setShowAttachmentsPreview}
        canEdit={true}
      />
    </>
  )
}
