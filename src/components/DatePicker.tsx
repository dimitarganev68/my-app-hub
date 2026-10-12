import * as React from "react";
import { format, isValid, parse } from "date-fns";
import { bg } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Display format for every date field in the app: дд.мм.гггг */
export const DATE_PATTERN = "dd.MM.yyyy";
/** Storage format kept in state / records */
export const ISO_PATTERN = "yyyy-MM-dd";

export function dateFromISO(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const d = parse(value, ISO_PATTERN, new Date());
  return isValid(d) ? d : undefined;
}

export function dateToISO(date: Date | undefined): string {
  return date ? format(date, ISO_PATTERN) : "";
}

export function formatDateDisplay(value: string | undefined): string {
  const d = dateFromISO(value);
  return d ? format(d, DATE_PATTERN) : "";
}

type DatePickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "дд.мм.гггг",
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = dateFromISO(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 opacity-60" />
          {selected ? format(selected, DATE_PATTERN) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          locale={bg}
          selected={selected}
          defaultMonth={selected ?? new Date()}
          onSelect={(date) => {
            onChange(dateToISO(date));
            setOpen(false);
          }}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
