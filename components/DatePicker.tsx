'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';

interface DatePickerProps {
  selectedDate: string;
  availableDates: string[];
  onChange: (date: string) => void;
  disabled?: boolean;
}

export default function DatePicker({ selectedDate, availableDates, onChange, disabled = false }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate || new Date()));
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Update current month when selected date changes
  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(new Date(selectedDate));
    }
  }, [selectedDate]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const daysInMonth = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const isDateAvailable = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return availableDates.includes(dateStr);
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return isSameDay(date, new Date(selectedDate));
  };

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (isDateAvailable(date)) {
      onChange(dateStr);
      setIsOpen(false);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed bg-white"
      >
        <Calendar className="w-5 h-5 text-gray-400" />
        <span className="text-gray-900">
          {selectedDate ? format(new Date(selectedDate), 'MMM dd, yyyy') : 'Select date'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 min-w-[320px]">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="p-1 hover:bg-gray-100 rounded transition"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-1 hover:bg-gray-100 rounded transition"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((day, idx) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isAvailable = isDateAvailable(day);
              const isSelected = isDateSelected(day);
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  disabled={!isAvailable || !isCurrentMonth}
                  className={`
                    aspect-square flex items-center justify-center text-sm rounded transition
                    ${!isCurrentMonth ? 'text-gray-300' : ''}
                    ${isSelected 
                      ? 'bg-blue-600 text-white font-semibold' 
                      : isAvailable && isCurrentMonth
                      ? 'text-gray-900 hover:bg-blue-50 cursor-pointer'
                      : 'text-gray-400 cursor-not-allowed'
                    }
                    ${isToday && !isSelected ? 'ring-2 ring-blue-300' : ''}
                  `}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          {/* Available dates info */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              {availableDates.length} date{availableDates.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

