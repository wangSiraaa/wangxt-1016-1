import React, { useState } from 'react';
import { Clock, MapPin, CloudRain, Sun, CalendarDays, Users, Camera, UtensilsCrossed, Music, Flower2, Car } from 'lucide-react';
import type { ScheduleEvent } from '@/types';
import { ScheduleEventTypeLabels, ScheduleEventTypeColors } from '@/types';

interface ScheduleTimelineProps {
  schedule: ScheduleEvent[];
  activeRainBackup?: boolean;
  onToggleRainBackup?: (enable: boolean) => void;
  showRainBackupToggle?: boolean;
}

const eventIcons: Record<string, React.ReactNode> = {
  welcome_dinner: <UtensilsCrossed className="w-5 h-5" />,
  rehearsal: <Users className="w-5 h-5" />,
  ceremony: <Flower2 className="w-5 h-5" />,
  lunch: <UtensilsCrossed className="w-5 h-5" />,
  dinner: <UtensilsCrossed className="w-5 h-5" />,
  tea_ceremony: <Flower2 className="w-5 h-5" />,
  photoshoot: <Camera className="w-5 h-5" />,
  makeup: <Users className="w-5 h-5" />,
  car: <Car className="w-5 h-5" />,
  rain_backup: <CloudRain className="w-5 h-5" />,
};

export const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({
  schedule,
  activeRainBackup = false,
  onToggleRainBackup,
  showRainBackupToggle = false,
}) => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const sortedSchedule = [...schedule].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  const regularEvents = sortedSchedule.filter(e => !e.isRainBackup);
  const rainBackupEvents = sortedSchedule.filter(e => e.isRainBackup);

  const eventsToShow = activeRainBackup
    ? [...regularEvents, ...rainBackupEvents]
    : regularEvents;

  const getEventColor = (type: string, isRainBackup?: boolean) => {
    if (isRainBackup) return 'bg-indigo-50 border-indigo-200';
    return ScheduleEventTypeColors[type] || 'bg-gray-50 border-gray-200';
  };

  const getEventTextColor = (type: string, isRainBackup?: boolean) => {
    if (isRainBackup) return 'text-indigo-600';
    const colorMap: Record<string, string> = {
      welcome_dinner: 'text-amber-600',
      rehearsal: 'text-purple-600',
      ceremony: 'text-rose-600',
      lunch: 'text-emerald-600',
      dinner: 'text-orange-600',
      tea_ceremony: 'text-teal-600',
      photoshoot: 'text-blue-600',
      rain_backup: 'text-indigo-600',
    };
    return colorMap[type] || 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">婚礼日程安排</h3>
          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-sm rounded-full">
            {eventsToShow.length} 个活动
          </span>
        </div>
        {showRainBackupToggle && onToggleRainBackup && (
          <button
            onClick={() => onToggleRainBackup(!activeRainBackup)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeRainBackup
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {activeRainBackup ? <CloudRain className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            {activeRainBackup ? '雨天方案' : '晴天方案'}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {eventsToShow.map((event, index) => (
          <div
            key={event.id}
          >
            {index > 0 && (
              <div className="ml-5 h-8 w-px bg-gray-200" />
            )}
            <div
              className={`relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${getEventColor(event.type, event.isRainBackup)} ${
                selectedEvent === event.id ? 'ring-2 ring-blue-400' : ''
              }`}
              onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
            >
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  event.isRainBackup ? 'bg-indigo-100' : 'bg-white border-2 border-gray-200'
                } ${getEventTextColor(event.type, event.isRainBackup)}`}
              >
                {eventIcons[event.type] || <CalendarDays className="w-5 h-5" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h4 className={`font-semibold ${getEventTextColor(event.type, event.isRainBackup)}`}>
                    {ScheduleEventTypeLabels[event.type] || event.name}
                  </h4>
                  {event.isRainBackup && (
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-xs font-medium rounded-full">
                      雨天备选
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="w-4 h-4" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{event.startTime} - {event.endTime}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                </div>

                {event.notes && (
                  <p className="mt-2 text-sm text-gray-500">{event.notes}</p>
                )}

                {selectedEvent === event.id && event.resourceIds && event.resourceIds.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">关联资源：</p>
                    <div className="flex flex-wrap gap-2">
                      {event.resourceIds.map((id) => (
                        <span
                          key={id}
                          className="px-2 py-1 bg-white rounded-lg text-xs text-gray-600 border border-gray-200"
                        >
                          {id}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className={`w-2 h-2 rounded-full ${event.isRainBackup ? 'bg-indigo-400' : 'bg-rose-400'} mt-2' />
            </div>
          </div>
        ))}
      </div>

      {rainBackupEvents.length > 0 && !activeRainBackup && (
        <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
          <div className="flex items-center gap-2 text-indigo-700">
            <CloudRain className="w-5 h-5" />
            <span className="font-medium">已设置 {rainBackupEvents.length} 个雨天备选活动</span>
          </div>
          <p className="mt-1 text-sm text-indigo-600">
            点击上方"雨天方案"按钮可查看和切换雨天备选日程
          </p>
        </div>
      )}
    </div>
  );
};
