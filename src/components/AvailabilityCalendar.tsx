import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

interface AvailabilitySlot {
  id: string;
  provider_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  notes: string | null;
}

interface AvailabilityCalendarProps {
  providerId: string;
  onSlotSelect?: (slot: AvailabilitySlot) => void;
  selectedSlot?: AvailabilitySlot | null;
  readonly?: boolean;
}

export default function AvailabilityCalendar({ 
  providerId, 
  onSlotSelect, 
  selectedSlot,
  readonly = false 
}: AvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'week' | 'month'>('week');

  useEffect(() => {
    loadSlots();
  }, [providerId, currentDate, view]);

  async function loadSlots() {
    setLoading(true);
    try {
      const startDate = new Date(currentDate);
      const endDate = new Date(currentDate);
      
      if (view === 'week') {
        startDate.setDate(startDate.getDate() - startDate.getDay());
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
      } else {
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
      }

      const { data } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('provider_id', providerId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      setSlots(data as AvailabilitySlot[] ?? []);
    } catch (error) {
      console.error('Error loading availability slots:', error);
    } finally {
      setLoading(false);
    }
  }

  function navigateWeek(direction: 'prev' | 'next') {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  }

  function navigateMonth(direction: 'prev' | 'next') {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  }

  function getWeekDays() {
    const days = [];
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());

    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }

    return days;
  }

  function getMonthDays() {
    const days = [];
    const start = new Date(currentDate);
    start.setDate(1);
    start.setDate(start.getDate() - start.getDay());

    const end = new Date(currentDate);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setDate(end.getDate() + (6 - end.getDay()));

    let current = new Date(start);
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }

  function getSlotsForDate(date: Date) {
    const dateStr = date.toISOString().split('T')[0];
    return slots.filter(slot => slot.date === dateStr && slot.is_available);
  }

  function handleSlotClick(slot: AvailabilitySlot) {
    if (!readonly && onSlotSelect) {
      onSlotSelect(slot);
    }
  }

  const weekDays = getWeekDays();
  const monthDays = getMonthDays();

  return (
    <div className="card">
      <div className="flex items-center justify-between p-4 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-neutral-600" />
          <h3 className="font-semibold text-neutral-900">
            {view === 'week' 
              ? formatDate(currentDate, 'fr-FR', { month: 'long', year: 'numeric' })
              : formatDate(currentDate, 'fr-FR', { month: 'long', year: 'numeric' })
            }
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                view === 'week' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600'
              }`}
            >
              Semaine
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                view === 'month' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600'
              }`}
            >
              Mois
            </button>
          </div>
          <button
            onClick={() => view === 'week' ? navigateWeek('prev') : navigateMonth('prev')}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => view === 'week' ? navigateWeek('next') : navigateMonth('next')}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-primary-600" />
          </div>
        ) : view === 'week' ? (
          <div className="space-y-4">
            {weekDays.map((day) => {
              const daySlots = getSlotsForDate(day);
              const isToday = new Date().toDateString() === day.toDateString();
              const isPast = day < new Date().setHours(0, 0, 0, 0);

              return (
                <div key={day.toDateString()} className="border border-neutral-200 rounded-lg overflow-hidden">
                  <div className={`flex items-center justify-between px-4 py-2 ${
                    isToday ? 'bg-primary-50 text-primary-700' : 'bg-neutral-50'
                  }`}>
                    <span className="font-medium">
                      {formatDate(day, 'fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}
                      {isToday && <span className="ml-2 text-xs font-semibold">(Aujourd'hui)</span>}
                    </span>
                    <span className="text-sm text-neutral-600">
                      {daySlots.length} créneau{daySlots.length !== 1 ? 'x' : ''} disponible{daySlots.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {daySlots.length > 0 ? (
                    <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {daySlots.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => handleSlotClick(slot)}
                          disabled={isPast || readonly}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedSlot?.id === slot.id
                              ? 'bg-primary-600 text-white'
                              : isPast
                              ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                              : 'bg-white border border-neutral-200 hover:border-primary-300 hover:bg-primary-50'
                          }`}
                        >
                          <Clock size={14} />
                          <span>{slot.start_time}</span>
                          {slot.notes && <span className="text-xs opacity-75">({slot.notes})</span>}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-neutral-500">
                      Aucun créneau disponible
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-neutral-600 py-2">
                {day}
              </div>
            ))}
            {monthDays.map((day) => {
              const daySlots = getSlotsForDate(day);
              const isToday = new Date().toDateString() === day.toDateString();
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isPast = day < new Date().setHours(0, 0, 0, 0);

              return (
                <div
                  key={day.toDateString()}
                  className={`min-h-[80px] p-1 border border-neutral-100 rounded-lg ${
                    !isCurrentMonth ? 'bg-neutral-50 opacity-50' : 'bg-white'
                  }`}
                >
                  <div className={`text-center text-sm mb-1 ${
                    isToday ? 'bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center mx-auto' : ''
                  }`}>
                    {day.getDate()}
                  </div>
                  {daySlots.length > 0 && !isPast && (
                    <div className="flex flex-wrap gap-1">
                      {daySlots.slice(0, 3).map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => handleSlotClick(slot)}
                          disabled={readonly}
                          className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
                            selectedSlot?.id === slot.id
                              ? 'bg-primary-600 text-white'
                              : 'bg-success-100 text-success-700 hover:bg-success-200'
                          }`}
                        >
                          {slot.start_time}
                        </button>
                      ))}
                      {daySlots.length > 3 && (
                        <span className="text-xs text-neutral-500">+{daySlots.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
