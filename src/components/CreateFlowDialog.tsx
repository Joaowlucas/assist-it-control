import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useWhatsAppFlows } from "@/hooks/useWhatsAppFlows";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface CreateFlowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateFlowDialog = ({ open, onOpenChange }: CreateFlowDialogProps) => {
  const { createFlow } = useWhatsAppFlows();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
    trigger_keywords: [] as string[],
  });
  const [newKeyword, setNewKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createFlow(formData);
      onOpenChange(false);
      setFormData({
        name: "",
        description: "",
        is_active: true,
        trigger_keywords: [],
      });
    } catch (error) {
      console.error("Erro ao criar fluxo:", error);
    } finally {
      setLoading(false);
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !formData.trigger_keywords.includes(newKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        trigger_keywords: [...prev.trigger_keywords, newKeyword.trim()]
      }));
      setNewKeyword("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      trigger_keywords: prev.trigger_keywords.filter(k => k !== keyword)
    }));
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyword();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Novo Fluxo</DialogTitle>
          <DialogDescription>
            Configure um novo fluxo de conversa para o WhatsApp
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Fluxo</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Suporte Técnico"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o que este fluxo faz..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">Palavras-chave de Ativação</Label>
            <div className="flex gap-2">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={handleKeywordKeyDown}
                placeholder="Digite uma palavra-chave..."
              />
              <Button type="button" onClick={addKeyword} variant="outline">
                Adicionar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.trigger_keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {keyword}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeKeyword(keyword)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="active">Ativar fluxo imediatamente</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Criando..." : "Criar Fluxo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};