
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
        <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600">
          <DialogHeader>
            <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <span className="text-slate-900 dark:text-slate-100">Chamado #{ticket.ticket_number}</span>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWhatsappDialogOpen(true)}
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviewPDF}
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Visualizar PDF</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPDF}
                  disabled={isGenerating}
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
                >
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{isGenerating ? 'Gerando...' : 'Baixar PDF'}</span>
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-300">
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
