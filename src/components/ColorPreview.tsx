
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ColorPreviewProps {
  isEnabled: boolean
}

export function ColorPreview({ isEnabled }: ColorPreviewProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Preview das Cores</CardTitle>
        <CardDescription>
          Veja como ficará a aplicação com as cores selecionadas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Exemplo de texto principal</p>
          <p className="text-sm text-muted-foreground">
            Este é um exemplo de texto secundário com as cores customizadas aplicadas.
          </p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button size="sm">
            Botão Primário
          </Button>
          <Button variant="secondary" size="sm">
            Botão Secundário
          </Button>
          <Button variant="destructive" size="sm">
            Botão Destrutivo
          </Button>
        </div>

        <Card className="p-3">
          <p className="text-sm">
            Este é um exemplo de card com as cores personalizadas.
          </p>
        </Card>

        {!isEnabled && (
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Habilite as cores personalizadas para ver o preview
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
