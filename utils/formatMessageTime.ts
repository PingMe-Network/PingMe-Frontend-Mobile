import { format, isToday } from "date-fns";

export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);

  if (isToday(date)) {
    return format(date, "HH:mm");
  } else {
    return format(date, "HH:mm, dd/MM/yyyy");
  }
}
