
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EquipmentPrintView } from "@/components/EquipmentPrintView"
import { useEquipmentPDF } from "@/hooks/useEquipmentPDF"
import { Download, X, Printer, Loader2 } from "lucide-react"

interface EquipmentPDFPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  equipment: any
  photos: any[]
  systemSettings: any
  tombamento: string
}

export function EquipmentPDFPreviewDialog({ 
  open, 
  onOpenChange, 
  equipment, 
  photos,
  systemSettings, 
  tombamento 
}: EquipmentPDFPreviewDialogProps) {
  const { downloadPDFFromPreview, printFromPreview, isGenerating } = useEquipmentPDF()

  const handleDownload = async () => {
    if (!equipment || !systemSettings) {
      console.warn('Dados necessários não disponíveis para gerar PDF')
      return
    }
    
    try {
      await downloadPDFFromPreview(equipment, photos || [], systemSettings, tombamento)
    } catch (error) {
      console.error('Erro ao fazer download do PDF:', error)
    }
  }

  const handlePrint = async () => {
    if (!equipment || !systemSettings) {
      console.warn('Dados necessários não disponíveis para impressão')
      return
    }
    
    try {
      await printFromPreview(equipment, photos || [], systemSettings)
    } catch (error) {
      console.error('Erro ao imprimir:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] p-0 gap-0">
        <DialogHeader className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <DialogTitle className="flex items-center justify-between text-lg">
            <span className="truncate pr-4">Pré-visualização - Equipamento {tombamento}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={isGenerating || !equipment || !systemSettings}
                className="hidden md:flex"
                title="Imprimir"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4 mr-2" />
                )}
                Imprimir
              </Button>
              <Button
                onClick={handleDownload}
                disabled={isGenerating || !equipment || !systemSettings}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isGenerating ? 'Gerando...' : 'Baixar PDF'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="p-2"
                disabled={isGenerating}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(95vh-80px)]">
          <div className="p-4 bg-gray-100 min-h-full">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto">
              {equipment && systemSettings ? (
                <EquipmentPrintView 
                  equipment={equipment} 
                  photos={photos || []}
                  systemSettings={systemSettings} 
                />
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Carregando dados do equipamento...</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
