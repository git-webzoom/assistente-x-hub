import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task, TaskStatus } from "@/hooks/useTasks";
import { useCards } from "@/hooks/useCards";
import { format } from "date-fns";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: Partial<Task>) => void;
  initial?: Task;
  onDelete?: (id: string) => void;
}

const TaskDialog = ({ open, onOpenChange, onSubmit, initial, onDelete }: TaskDialogProps) => {
  const { cards } = useCards();
  const [formData, setFormData] = useState({
    card_id: "",
    title: "",
    due_date: "",
    status: "pending" as TaskStatus,
    notes: "",
  });

  useEffect(() => {
    if (initial) {
      const dueDate = initial.due_date ? new Date(initial.due_date) : null;
      const dueDateStr = dueDate && !isNaN(dueDate.getTime()) ? format(dueDate, "yyyy-MM-dd'T'HH:mm") : "";
      
      setFormData({
        card_id: initial.card_id,
        title: initial.title,
        due_date: dueDateStr,
        status: initial.status,
        notes: initial.notes || "",
      });
    } else {
      setFormData({
        card_id: "",
        title: "",
        due_date: "",
        status: "pending",
        notes: "",
      });
    }
  }, [initial, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const taskData: Partial<Task> = {
      ...formData,
      due_date: formData.due_date || null,
      notes: formData.notes || null,
    };

    if (initial) {
      onSubmit({ ...taskData, id: initial.id });
    } else {
      onSubmit(taskData);
    }

    onOpenChange(false);
  };

  const handleDelete = () => {
    if (initial && onDelete && confirm("Tem certeza que deseja excluir esta tarefa?")) {
      onDelete(initial.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="card">Card *</Label>
            <Select
              value={formData.card_id}
              onValueChange={(value) => setFormData({ ...formData, card_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um card" />
              </SelectTrigger>
              <SelectContent>
                {cards?.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    {card.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Data de Vencimento</Label>
            <Input
              id="due_date"
              type="datetime-local"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: TaskStatus) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="in_progress">Em Progresso</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
            />
          </div>

          <div className="flex justify-between gap-3 pt-4">
            {initial && onDelete && (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                Excluir
              </Button>
            )}
            <div className="flex gap-3 ml-auto">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {initial ? "Salvar" : "Criar"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;
