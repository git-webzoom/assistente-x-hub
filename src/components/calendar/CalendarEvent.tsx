import { format } from "date-fns";
import { Clock, MapPin, User } from "lucide-react";
import { Appointment } from "@/hooks/useAppointments";
import { Badge } from "@/components/ui/badge";

interface CalendarEventProps {
  appointment: Appointment;
  onClick: () => void;
}

export const CalendarEvent = ({ appointment, onClick }: CalendarEventProps) => {
  const startTime = new Date(appointment.start_time);
  const endTime = new Date(appointment.end_time);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "border-l-green-500 bg-green-500/5 hover:bg-green-500/10";
      case "completed":
        return "border-l-blue-500 bg-blue-500/5 hover:bg-blue-500/10";
      case "cancelled":
        return "border-l-red-500 bg-red-500/5 hover:bg-red-500/10";
      default:
        return "border-l-yellow-500 bg-yellow-500/5 hover:bg-yellow-500/10";
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from bubbling to day cell
    onClick();
  };

  return (
    <div
      onClick={handleClick}
      className={`text-xs p-1.5 rounded border-l-2 cursor-pointer transition-colors mb-1 ${getStatusColor(
        appointment.status
      )}`}
    >
      <div className="font-medium truncate">{appointment.title}</div>
      <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
        <Clock className="w-3 h-3" />
        <span>{isNaN(startTime.getTime()) ? "--:--" : format(startTime, "HH:mm")}</span>
      </div>
    </div>
  );
};
