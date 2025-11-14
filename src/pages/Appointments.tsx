import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Calendar as CalendarIcon, Clock, MapPin, User, Edit, Trash2 } from "lucide-react";
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
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

const Appointments = () => {
  const { appointments, isLoading, createAppointment, updateAppointment, deleteAppointment } = useAppointments();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);

  const handleCreate = (data: any) => {
    createAppointment.mutate(data);
  };

  const handleEdit = (data: any) => {
    if (editingAppointment) {
      updateAppointment.mutate({ id: editingAppointment.id, ...data });
    }
  };

  const handleDelete = () => {
    if (appointmentToDelete) {
      deleteAppointment.mutate(appointmentToDelete);
      setDeleteDialogOpen(false);
      setAppointmentToDelete(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "completed":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "cancelled":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      default:
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmado";
      case "completed":
        return "Concluído";
      case "cancelled":
        return "Cancelado";
      default:
        return "Agendado";
    }
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Hoje";
    if (isTomorrow(date)) return "Amanhã";
    return format(date, "dd 'de' MMMM", { locale: ptBR });
  };

  const groupedAppointments = appointments?.reduce((acc, appointment) => {
    const date = new Date(appointment.start_time);
    const dateKey = format(date, "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(appointment);
    return acc;
  }, {} as Record<string, Appointment[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus compromissos e reuniões</p>
        </div>
        <Button onClick={() => { setEditingAppointment(undefined); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : !appointments || appointments.length === 0 ? (
        <Card className="p-8 text-center">
          <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum agendamento</h3>
          <p className="text-muted-foreground mb-4">
            Crie seu primeiro agendamento para começar
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Agendamento
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAppointments || {}).map(([dateKey, dayAppointments]) => {
            const date = new Date(dateKey);
            return (
              <div key={dateKey}>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  {getDateLabel(date)}
                </h2>
                <div className="space-y-3">
                  {dayAppointments.map((appointment) => {
                    const startDate = new Date(appointment.start_time);
                    const endDate = new Date(appointment.end_time);
                    const past = isPast(endDate);

                    return (
                      <Card key={appointment.id} className={`p-4 ${past ? "opacity-60" : ""}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{appointment.title}</h3>
                              <Badge className={getStatusColor(appointment.status)}>
                                {getStatusLabel(appointment.status)}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
                              </div>

                              {appointment.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {appointment.location}
                                </div>
                              )}

                              {appointment.contact && (
                                <div className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  {appointment.contact.name}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingAppointment(appointment);
                                setDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setAppointmentToDelete(appointment.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingAppointment(undefined);
        }}
        onSubmit={editingAppointment ? handleEdit : handleCreate}
        initial={editingAppointment}
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
