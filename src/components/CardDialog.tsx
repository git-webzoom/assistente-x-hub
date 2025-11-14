import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initial?: {
    id: string;
    title: string;
    value: number;
    description?: string | null;
    tags?: string[] | null;
  };
  onSubmit: (data: { id?: string; title: string; value: number; description?: string; tags?: string[] }) => void;
}

export const CardDialog = ({ open, onOpenChange, mode, initial, onSubmit }: CardDialogProps) => {
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (open && initial) {
      setTitle(initial.title || "");
      setValue(String(initial.value ?? ""));
      setDescription(initial.description || "");
      setTags(Array.isArray(initial.tags) ? initial.tags.join(", ") : "");
    } else if (open && !initial) {
      setTitle("");
      setValue("");
      setDescription("");
      setTags("");
    }
  }, [open, initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && value) {
      onSubmit({
        id: initial?.id,
        title: title.trim(),
        value: parseFloat(value),
        description: description.trim() || undefined,
        tags: tags.trim() ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      });
      if (mode === "create") {
        setTitle("");
        setValue("");
        setDescription("");
        setTags("");
      }
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Editar Card" : "Novo Card"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Atualize as informações da oportunidade" : "Adicione uma nova oportunidade à pipeline"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Ex: João Silva - Empresa ABC"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Valor (R$)</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                placeholder="Ex: 5000.00"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Detalhes da oportunidade..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input
                id="tags"
                placeholder="Ex: quente, empresa, urgente"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{mode === "edit" ? "Salvar" : "Criar Card"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
