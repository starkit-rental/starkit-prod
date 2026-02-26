"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval, addDays, startOfWeek, endOfWeek } from "date-fns";
import { pl } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OccupiedRange = {
  start: Date;
  end: Date;
  isBuffer?: boolean;
};

type AvailabilityCalendarProps = {
  selectedStart: Date | null;
  selectedEnd: Date | null;
  onSelectRange: (start: Date, end: Date) => void;
  occupiedRanges?: OccupiedRange[];
  minDate?: Date;
};

export function AvailabilityCalendar({
  selectedStart,
  selectedEnd,
  onSelectRange,
  occupiedRanges = [],
  minDate = new Date(),
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [isSelectingRange, setIsSelectingRange] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const isDateOccupied = (date: Date) => {
    return occupiedRanges.some((range) =>
      isWithinInterval(date, { start: range.start, end: range.end })
    );
  };

  const isDateBuffer = (date: Date) => {
    return occupiedRanges.some(
      (range) =>
        range.isBuffer && isWithinInterval(date, { start: range.start, end: range.end })
    );
  };

  const isDateInSelectedRange = (date: Date) => {
    if (!selectedStart) return false;
    if (!selectedEnd && !hoverDate) return isSameDay(date, selectedStart);
    const end = selectedEnd || hoverDate;
    if (!end) return isSameDay(date, selectedStart);
    return isWithinInterval(date, { start: selectedStart, end });
  };

  const handleDateClick = (date: Date) => {
    if (date < minDate || isDateOccupied(date)) return;

    if (!isSelectingRange) {
      // Start new selection
      setIsSelectingRange(true);
      onSelectRange(date, date);
    } else {
      // Complete selection
      setIsSelectingRange(false);
      if (date < selectedStart!) {
        onSelectRange(date, selectedStart!);
      } else {
        onSelectRange(selectedStart!, date);
      }
    }
  };

  const handleManualDateChange = (type: 'start' | 'end', value: string) => {
    const newDate = new Date(value);
    if (isNaN(newDate.getTime())) return;

    if (type === 'start') {
      onSelectRange(newDate, selectedEnd || newDate);
    } else {
      onSelectRange(selectedStart || newDate, newDate);
    }
    setIsSelectingRange(false);
  };

  const weekDays = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nie"];

  return (
    <div className="w-full">
      {/* Manual date inputs */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Data rozpoczęcia</label>
          <input
            type="date"
            value={selectedStart ? format(selectedStart, 'yyyy-MM-dd') : ''}
            onChange={(e) => handleManualDateChange('start', e.target.value)}
            min={format(minDate, 'yyyy-MM-dd')}
            className="w-full h-9 px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4A843] focus:border-transparent"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Data zakończenia</label>
          <input
            type="date"
            value={selectedEnd ? format(selectedEnd, 'yyyy-MM-dd') : ''}
            onChange={(e) => handleManualDateChange('end', e.target.value)}
            min={selectedStart ? format(selectedStart, 'yyyy-MM-dd') : format(minDate, 'yyyy-MM-dd')}
            className="w-full h-9 px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4A843] focus:border-transparent"
          />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-sm font-semibold text-slate-900">
          {format(currentMonth, "LLLL yyyy", { locale: pl })}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-slate-500 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isOccupied = isDateOccupied(day);
          const isBuffer = isDateBuffer(day);
          const isSelected = isDateInSelectedRange(day);
          const isDisabled = day < minDate || isOccupied;
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={idx}
              onClick={() => handleDateClick(day)}
              onMouseEnter={() => selectedStart && !selectedEnd && setHoverDate(day)}
              onMouseLeave={() => setHoverDate(null)}
              disabled={isDisabled}
              className={cn(
                "relative h-9 text-sm rounded-md transition-colors",
                !isCurrentMonth && "text-slate-300",
                isCurrentMonth && !isDisabled && "text-slate-700 hover:bg-slate-100",
                isOccupied && !isBuffer && "bg-red-50 text-red-400 cursor-not-allowed",
                isBuffer && "bg-amber-50 text-amber-400 cursor-not-allowed",
                isSelected && !isDisabled && "bg-[#D4A843] text-white hover:bg-[#D4A843]/90",
                isToday && !isSelected && "ring-1 ring-[#D4A843]",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-red-50 border border-red-200" />
          <span>Zajęte</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-amber-50 border border-amber-200" />
          <span>Bufor (+2 dni)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-[#D4A843]" />
          <span>Wybrane</span>
        </div>
      </div>
    </div>
  );
}
