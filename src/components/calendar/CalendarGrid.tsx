import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isToday, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment } from "@/hooks/useAppointments";
import { CalendarEvent } from "./CalendarEvent";
import { cn } from "@/lib/utils";

interface CalendarGridProps {
  currentDate: Date;
  appointments: Appointment[];
  onEventClick: (appointment: Appointment) => void;
  onDayClick: (date: Date) => void;
}

export const CalendarGrid = ({ currentDate, appointments, onEventClick, onDayClick }: CalendarGridProps) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: ptBR });
  const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const getAppointmentsForDay = (day: Date) => {
    return appointments?.filter((appointment) =>
      isSameDay(new Date(appointment.start_time), day)
    ) || [];
  };

  return (
    <div className="bg-card rounded-lg border">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-semibold text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dayAppointments = getAppointmentsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={idx}
              onClick={() => onDayClick(day)}
              className={cn(
                "min-h-[120px] p-2 border-b border-r cursor-pointer hover:bg-accent/50 transition-colors",
                !isCurrentMonth && "bg-muted/30",
                isCurrentDay && "bg-accent/20"
              )}
            >
              <div
                className={cn(
                  "text-sm font-medium mb-1",
                  !isCurrentMonth && "text-muted-foreground",
                  isCurrentDay && "bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center"
                )}
              >
                {format(day, "d")}
              </div>
              <div className="space-y-1 overflow-y-auto max-h-[80px]" onClick={(e) => e.stopPropagation()}>
                {dayAppointments.map((appointment) => (
                  <CalendarEvent
                    key={appointment.id}
                    appointment={appointment}
                    onClick={() => onEventClick(appointment)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
