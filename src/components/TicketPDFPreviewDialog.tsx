
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TicketPrintView } from "@/components/TicketPrintView"
import { useTicketPDF } from "@/hooks/useTicketPDF"
import { Download, X, Printer } from "lucide-react"

interface TicketPDFPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: any
  systemSettings: any
  ticketNumber: string
}

export function TicketPDFPreviewDialog({ 
  open, 
  onOpenChange, 
  ticket, 
  systemSettings, 
  ticketNumber 
}: TicketPDFPreviewDialogProps) {
  const { downloadPDFFromPreview, printFromPreview, isGenerating } = useTicketPDF()

  const handleDownload = async () => {
    if (!ticket || !systemSettings) return
    await downloadPDFFromPreview(ticket, systemSettings, ticketNumber)
  }

  const handlePrint = async () => {
    if (!ticket || !systemSettings) return
    await printFromPreview(ticket, systemSettings)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-5xl max-h-[90vh] p-0 gap-0 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600">
        <DialogHeader className="p-4 border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-lg text-slate-900 dark:text-slate-100">
            <span>Pré-visualização do Relatório - Chamado #{ticketNumber}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="hidden md:flex bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
                title="Imprimir"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button
                onClick={handleDownload}
                disabled={isGenerating}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? 'Gerando...' : 'Baixar PDF'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="p-2 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(90vh-80px)]">
          <div className="p-4 bg-slate-100 dark:bg-slate-900">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              {ticket && systemSettings ? (
                <TicketPrintView 
                  ticket={ticket} 
                  systemSettings={systemSettings} 
                />
              ) : (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  Carregando dados do chamado...
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
