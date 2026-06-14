import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, AlertTriangle } from 'lucide-react';
import { useWeddingStore } from '@/store/weddingStore';
import { getMonthMatrix, formatDate, isSameDay, isDatePast } from '@/utils/dateUtils';
import { OrderStatusLabels, OrderStatusColors, ResourceTypeColors } from '@/types';
import { cn } from '@/lib/utils';

interface WeddingCalendarProps {
  onSelectOrder?: (orderId: string) => void;
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
}

export default function WeddingCalendar({ onSelectOrder, selectedDate, onSelectDate }: WeddingCalendarProps) {
  const { orders, checkExpiredOrders } = useWeddingStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const weeks = useMemo(() => getMonthMatrix(year, month), [year, month]);

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getOrdersForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return orders.filter(
      (o) => o.weddingDate === dateStr && o.status !== 'cancelled' && o.status !== 'expired'
    );
  };

  const handleDateClick = (date: Date) => {
    const dateStr = formatDate(date);
    onSelectDate?.(dateStr);
    if (viewMode === 'day') {
      setCurrentDate(date);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pendingDepositCount = orders.filter(
    (o) => o.status === 'pending_deposit' && o.depositExpiresAt
  ).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">婚礼日历</h2>
              <p className="text-sm text-gray-500">策划师排期总览</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('month')}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-all',
                  viewMode === 'month'
                    ? 'bg-white shadow-sm text-gray-800 font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                月视图
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-all',
                  viewMode === 'day'
                    ? 'bg-white shadow-sm text-gray-800 font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                日视图
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h3 className="text-base font-semibold text-gray-800 min-w-[120px] text-center">
              {year}年 {monthNames[month]}
            </h3>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            {pendingDepositCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-700">
                  {pendingDepositCount} 单待付定金
                </span>
              </div>
            )}
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium"
            >
              今天
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'month' ? (
        <div className="p-4">
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map((day, i) => (
              <div
                key={day}
                className={cn(
                  'text-center text-sm font-medium py-2',
                  i === 0 || i === 6 ? 'text-rose-500' : 'text-gray-500'
                )}
              >
                {day}
              </div>
            ))}
          </div>
          <div className="space-y-1">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 gap-1">
                {week.map((date, dayIdx) => {
                  if (!date) return <div key={dayIdx} className="h-20" />;
                  
                  const dateStr = formatDate(date);
                  const dayOrders = getOrdersForDate(date);
                  const isToday = isSameDay(date, today);
                  const isPast = isDatePast(date) && !isToday;
                  const isSelected = selectedDate === dateStr;
                  const isCurrentMonth = date.getMonth() === month;

                  return (
                    <div
                      key={dayIdx}
                      onClick={() => handleDateClick(date)}
                      className={cn(
                        'h-20 p-1.5 rounded-lg cursor-pointer transition-all border-2',
                        isSelected
                          ? 'border-rose-500 bg-rose-50'
                          : 'border-transparent hover:bg-gray-50',
                        isPast && 'opacity-50',
                        !isCurrentMonth && 'opacity-30'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={cn(
                            'text-sm font-medium',
                            isToday && 'w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center'
                          )}
                        >
                          {date.getDate()}
                        </span>
                        {dayOrders.length > 0 && (
                          <span className="text-xs text-gray-400">
                            {dayOrders.length}场
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 overflow-hidden">
                        {dayOrders.slice(0, 2).map((order) => (
                          <div
                            key={order.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectOrder?.(order.id);
                            }}
                            className={cn(
                              'text-xs px-1.5 py-0.5 rounded truncate',
                              OrderStatusColors[order.status]
                            )}
                          >
                            {order.customerName.split(' & ')[0]}
                          </div>
                        ))}
                        {dayOrders.length > 2 && (
                          <div className="text-xs text-gray-400 pl-1">
                            +{dayOrders.length - 2} 更多
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="mb-4">
            <h4 className="text-base font-semibold text-gray-800">
              {formatDate(currentDate, 'YYYY年MM月DD日')}
            </h4>
          </div>
          <div className="space-y-3">
            {getOrdersForDate(currentDate).length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>当日暂无婚礼安排</p>
              </div>
            ) : (
              getOrdersForDate(currentDate).map((order) => (
                <div
                  key={order.id}
                  onClick={() => onSelectOrder?.(order.id)}
                  className="p-4 rounded-xl border border-gray-100 hover:border-rose-200 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-semibold text-gray-800">{order.customerName}</h5>
                      <p className="text-sm text-gray-500">{order.theme}</p>
                    </div>
                    <span className={cn(
                      'px-2.5 py-1 text-xs font-medium rounded-full',
                      OrderStatusColors[order.status]
                    )}>
                      {OrderStatusLabels[order.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>10:00 - 18:00</span>
                    </div>
                    <div>{order.weddingLocation}</div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {order.resources.slice(0, 5).map((r) => (
                      <div
                        key={r.resourceId}
                        className={cn(
                          'w-2 h-2 rounded-full',
                          ResourceTypeColors[r.resource.type]
                        )}
                        title={r.resource.name}
                      />
                    ))}
                    {order.resources.length > 5 && (
                      <span className="text-xs text-gray-400">
                        +{order.resources.length - 5}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
