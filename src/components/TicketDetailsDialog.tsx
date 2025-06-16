
import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { MessageSquare, FileText, Download } from "lucide-react"

import { TicketDetails } from "./TicketDetails"
import { WhatsAppSendDialog } from "./WhatsAppSendDialog"
import { TicketPDFPreviewDialog } from "./TicketPDFPreviewDialog"
import { useTicketPDF } from "@/hooks/useTicketPDF"
import { useSystemSettings } from "@/hooks/useSystemSettings"

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
  unit_id: string
  created_at: string
  updated_at: string
  resolved_at: string | null
}

interface TicketDetailsDialogProps {
  ticket: Ticket | null
  open: boolean
  onOpenChange: (open: boolean) => void
  units: {
    id: string
    name: string
  }[]
  technicians: {
    id: string
    name: string
  }[]
}

export function TicketDetailsDialog({ ticket, open, onOpenChange }: TicketDetailsDialogProps) {
  // Early return if ticket is null - BEFORE any hooks
  if (!ticket) {
    return null
  }

  const { toast } = useToast()
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false)
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false)
  const { generateTicketPDF, isGenerating } = useTicketPDF()
  const { data: systemSettings } = useSystemSettings()

  const handleDownloadPDF = async () => {
    try {
      await generateTicketPDF(ticket.id, ticket.ticket_number.toString())
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({
        title: "Erro!",
        description: "Erro ao gerar PDF do chamado.",
        variant: "destructive",
      })
    }
  }

  const handlePreviewPDF = () => {
    setPdfPreviewOpen(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Chamado #{ticket.ticket_number}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWhatsappDialogOpen(true)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviewPDF}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Visualizar PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPDF}
                  disabled={isGenerating}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Gerando...' : 'Baixar PDF'}
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              Detalhes do chamado aberto por {ticket.requester.name} em{" "}
              {format(new Date(ticket.created_at), "dd 'de' MMMM 'de' yyyy", {
                locale: ptBR,
              })}
            </DialogDescription>
          </DialogHeader>

          <TicketDetails ticket={ticket} />
        </DialogContent>
      </Dialog>

      <WhatsAppSendDialog
        open={whatsappDialogOpen}
        onOpenChange={setWhatsappDialogOpen}
        ticket={ticket}
      />

      <TicketPDFPreviewDialog
        open={pdfPreviewOpen}
        onOpenChange={setPdfPreviewOpen}
        ticket={ticket}
        systemSettings={systemSettings}
        ticketNumber={ticket.ticket_number.toString()}
      />
    </>
  )
}
