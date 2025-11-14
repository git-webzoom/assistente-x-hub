import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAppointments, Appointment } from "@/hooks/useAppointments";
import { AppointmentDialog } from "@/components/AppointmentDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CalendarView } from "@/components/calendar/CalendarView";
import { Card } from "@/components/ui/card";

const Appointments = () => {
  const { appointments, isLoading, createAppointment, updateAppointment, deleteAppointment } = useAppointments();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleCreate = (data: any) => {
    createAppointment.mutate(data);
    setDialogOpen(false);
    setEditingAppointment(undefined);
  };

  const handleEdit = (data: any) => {
    if (editingAppointment) {
      updateAppointment.mutate({ id: editingAppointment.id, ...data });
      setDialogOpen(false);
      setEditingAppointment(undefined);
    }
  };

  const handleDelete = () => {
    if (appointmentToDelete) {
      deleteAppointment.mutate(appointmentToDelete);
      setDeleteDialogOpen(false);
      setAppointmentToDelete(null);
    }
  };

  const handleEventClick = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setDialogOpen(true);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setEditingAppointment(undefined);
    setDialogOpen(true);
  };

  const handleNewAppointment = () => {
    setEditingAppointment(undefined);
    setSelectedDate(null);
    setDialogOpen(true);
  };

  const handleDeleteClick = () => {
    if (editingAppointment) {
      setAppointmentToDelete(editingAppointment.id);
      setDialogOpen(false);
      setDeleteDialogOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus compromissos e reuniões</p>
        </div>
        <Button onClick={handleNewAppointment}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      {isLoading ? (
        <Card className="p-8">
          <div className="text-center">Carregando...</div>
        </Card>
      ) : (
        <CalendarView
          appointments={appointments || []}
          onEventClick={handleEventClick}
          onDayClick={handleDayClick}
        />
      )}

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingAppointment(undefined);
            setSelectedDate(null);
          }
        }}
        onSubmit={editingAppointment ? handleEdit : handleCreate}
        initial={editingAppointment}
        selectedDate={selectedDate}
        onDelete={editingAppointment ? handleDeleteClick : undefined}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Appointments;
