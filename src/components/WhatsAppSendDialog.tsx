
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useSendWhatsAppMessage } from "@/hooks/useWhatsAppNotifications"
import { useUpdateProfile } from "@/hooks/useProfiles"
import { useTicketAttachments } from "@/hooks/useTicketAttachments"
import { Loader2, MessageSquare } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Ticket {
  id: string
  ticket_number: number
  title: string
  description: string
  priority: string
  status: string
  category: string
  requester: {
    id: string
    name: string
    phone?: string
  }
  assignee?: {
    name: string
  }
  created_at: string
  updated_at: string
  resolved_at?: string | null
}

interface WhatsAppSendDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: Ticket
}

export function WhatsAppSendDialog({ open, onOpenChange, ticket }: WhatsAppSendDialogProps) {
  const sendMessage = useSendWhatsAppMessage()
  const updateProfile = useUpdateProfile()
  const { data: attachments = [] } = useTicketAttachments(ticket.id)
  
  const [phone, setPhone] = useState(ticket.requester.phone || '')
  const [savePhone, setSavePhone] = useState(!ticket.requester.phone)
  
  // Gerar mensagem automática com anexos e horários completos
  const generateMessage = () => {
    const priorityEmoji = {
      'baixa': '🟢',
      'media': '🟡', 
      'alta': '🟠',
      'critica': '🔴'
    }

    const statusEmoji = {
      'aberto': '📂',
      'em_andamento': '⚙️',
      'aguardando': '⏳',
      'fechado': '✅'
    }

    // Formatação de datas com horário
    const formatDateTime = (dateString: string) => {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    }

    let message = `🎫 *Atualização do Chamado #${ticket.ticket_number}*

📋 *Título:* ${ticket.title}

📝 *Descrição:* ${ticket.description}

${priorityEmoji[ticket.priority as keyof typeof priorityEmoji] || '⚪'} *Prioridade:* ${ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}

${statusEmoji[ticket.status as keyof typeof statusEmoji] || '⚪'} *Status:* ${ticket.status.replace('_', ' ').charAt(0).toUpperCase() + ticket.status.replace('_', ' ').slice(1)}

🏷️ *Categoria:* ${ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}

${ticket.assignee ? `👨‍💻 *Técnico:* ${ticket.assignee.name}\n` : ''}
📅 *Criado em:* ${formatDateTime(ticket.created_at)}
📅 *Atualizado em:* ${formatDateTime(ticket.updated_at)}`

    // Adicionar data de resolução se o chamado estiver fechado
    if (ticket.resolved_at) {
      message += `\n✅ *Resolvido em:* ${formatDateTime(ticket.resolved_at)}`
    }

    // Adicionar anexos se existirem
    if (attachments && attachments.length > 0) {
      message += `\n\n📎 *Anexos (${attachments.length}):`
      attachments.forEach((attachment, index) => {
        message += `\n${index + 1}. ${attachment.file_name}`
      })
    }

    message += `\n\n---\n*Sistema de Chamados - ${ticket.requester.name}*`

    return message
  }

  const [message, setMessage] = useState('')

  // Atualizar mensagem quando anexos carregarem
  useEffect(() => {
    setMessage(generateMessage())
  }, [attachments, ticket])

  const handleSend = async () => {
    if (!phone.trim()) return

    try {
      // Enviar mensagem
      await sendMessage.mutateAsync({
        ticketId: ticket.id,
        phone: phone.replace(/\D/g, ''), // Remove formatação
        message,
        userId: ticket.requester.id
      })

      // Salvar telefone no perfil se solicitado
      if (savePhone && !ticket.requester.phone) {
        await updateProfile.mutateAsync({
          id: ticket.requester.id,
          phone: phone.replace(/\D/g, '')
        })
      }

      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    }
  }

  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Aplica máscara brasileira
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4,5})(\d{4})$/, '$1-$2')
    }
    
    return numbers.slice(0, 11)
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4,5})(\d{4})$/, '$1-$2')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Enviar WhatsApp - Chamado #{ticket.ticket_number}
          </DialogTitle>
          <DialogDescription>
            Envie uma notificação via WhatsApp para o solicitante do chamado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="phone">Número do WhatsApp</Label>
            <Input
              id="phone"
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
            />
          </div>

          {!ticket.requester.phone && (
            <div className="flex items-center space-x-2">
              <Switch
                id="save-phone"
                checked={savePhone}
                onCheckedChange={setSavePhone}
              />
              <Label htmlFor="save-phone">
                Salvar este número no perfil de {ticket.requester.name}
              </Label>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              rows={15}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSend}
              disabled={!phone.trim() || sendMessage.isPending}
            >
              {sendMessage.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Enviar WhatsApp
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
