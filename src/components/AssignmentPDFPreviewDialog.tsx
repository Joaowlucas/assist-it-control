
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AssignmentPrintView } from "@/components/AssignmentPrintView"
import { useAssignmentPDF } from "@/hooks/useAssignmentPDF"
import { Download, X, Printer } from "lucide-react"

interface AssignmentPDFPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: any
  systemSettings: any
  assignmentId: string
  equipmentName: string
  userName: string
}

export function AssignmentPDFPreviewDialog({ 
  open, 
  onOpenChange, 
  assignment,
  systemSettings,
  assignmentId,
  equipmentName,
  userName
}: AssignmentPDFPreviewDialogProps) {
  const { downloadPDFFromPreview, printFromPreview, isGenerating } = useAssignmentPDF()

  const handleDownload = async () => {
    if (!assignment || !systemSettings) return
    await downloadPDFFromPreview(assignment, systemSettings, equipmentName, userName)
  }

  const handlePrint = async () => {
    if (!assignment || !systemSettings) return
    await printFromPreview(assignment, systemSettings)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-4 border-b border-gray-200 bg-gray-50">
          <DialogTitle className="flex items-center justify-between text-lg">
            <span>Pré-visualização do Relatório - Atribuição {equipmentName}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="hidden md:flex"
                title="Imprimir"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button
                onClick={handleDownload}
                disabled={isGenerating}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? 'Gerando...' : 'Baixar PDF'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="p-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(90vh-80px)]">
          <div className="p-4 bg-gray-100">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              {assignment && systemSettings ? (
                <AssignmentPrintView 
                  assignment={assignment} 
                  systemSettings={systemSettings} 
                />
              ) : (
                <div className="p-8 text-center text-gray-500">
                  Carregando dados da atribuição...
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
