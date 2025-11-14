import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Appointment } from "@/hooks/useAppointments";
import { useContacts } from "@/hooks/useContacts";
import { format } from "date-fns";

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  initial?: Appointment;
  selectedDate?: Date | null;
  onDelete?: () => void;
}

export const AppointmentDialog = ({ open, onOpenChange, onSubmit, initial, selectedDate, onDelete }: AppointmentDialogProps) => {
  const { contacts } = useContacts();
  const [formData, setFormData] = useState({
    title: "",
    contact_id: "",
    start_time: "",
    end_time: "",
    location: "",
    status: "scheduled",
  });

  useEffect(() => {
    if (initial) {
      const start = new Date(initial.start_time);
      const end = new Date(initial.end_time);
      setFormData({
        title: initial.title,
        contact_id: initial.contact_id || "",
        start_time: isNaN(start.getTime()) ? "" : format(start, "yyyy-MM-dd'T'HH:mm"),
        end_time: isNaN(end.getTime()) ? "" : format(end, "yyyy-MM-dd'T'HH:mm"),
        location: initial.location || "",
        status: initial.status || "scheduled",
      });
    } else if (selectedDate) {
      // Pre-fill with selected date from calendar
      const selected = new Date(selectedDate);
      const dateStr = isNaN(selected.getTime()) ? format(new Date(), "yyyy-MM-dd") : format(selected, "yyyy-MM-dd");
      setFormData({
        title: "",
        contact_id: "",
        start_time: `${dateStr}T09:00`,
        end_time: `${dateStr}T10:00`,
        location: "",
        status: "scheduled",
      });
    } else {
      setFormData({
        title: "",
        contact_id: "",
        start_time: "",
        end_time: "",
        location: "",
        status: "scheduled",
      });
    }
  }, [initial, selectedDate, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      contact_id: formData.contact_id || null,
    };
    onSubmit(submitData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="contact">Contato</Label>
            <Select
              value={formData.contact_id || undefined}
              onValueChange={(value) =>
                setFormData({ ...formData, contact_id: value === "none" ? "" : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um contato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {contacts?.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Início *</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">Fim *</Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Local</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Endereço ou link de reunião"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Agendado</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center gap-2 pt-4">
            {initial && onDelete && (
              <Button type="button" variant="destructive" onClick={onDelete}>
                Excluir
              </Button>
            )}
            <div className="flex justify-end gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {initial ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
