import { useState, useMemo } from 'react';
import { BarChart3, AlertCircle, Clock, CheckCircle2, Filter } from 'lucide-react';
import { useWeddingStore } from '@/store/weddingStore';
import { ResourceType, ResourceTypeLabels, ResourceTypeColors } from '@/types';
import { cn } from '@/lib/utils';
import { formatDateTime, formatDate, addDays, diffInHours } from '@/utils/dateUtils';
import type { OrderResource } from '@/types';

interface ResourceGanttProps {
  onSelectOrder?: (orderId: string) => void;
}

export default function ResourceGantt({ onSelectOrder }: ResourceGanttProps) {
  const { orders, resources } = useWeddingStore();
  const [selectedType, setSelectedType] = useState<ResourceType | 'all'>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
    const today = new Date();
    const start = formatDate(today);
    const end = formatDate(addDays(today, 30));
    return { start, end };
  });

  const resourceTypes: (ResourceType | 'all')[] = [
    'all',
    'venue',
    'photography',
    'videography',
    'host',
    'makeup',
    'car',
    'decor',
    'rehearsal',
  ];

  const filteredResources = useMemo(() => {
    if (selectedType === 'all') return resources;
    return resources.filter((r) => r.type === selectedType);
  }, [resources, selectedType]);

  const activeOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status !== 'cancelled' && o.status !== 'expired'
    );
  }, [orders]);

  const getResourceSchedules = (resourceId: string) => {
    const schedules: Array<{
      orderId: string;
      orderNo: string;
      customer: string;
      resource: OrderResource;
      status: string;
    }> = [];

    for (const order of activeOrders) {
      const res = order.resources.find((r) => r.resourceId === resourceId);
      if (res && res.status !== 'cancelled') {
        schedules.push({
          orderId: order.id,
          orderNo: order.orderNo,
          customer: order.customerName,
          resource: res,
          status: order.status,
        });
      }
    }

    return schedules.sort(
      (a, b) => new Date(a.resource.startTime).getTime() - new Date(b.resource.startTime).getTime()
    );
  };

  const totalHours = useMemo(() => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    return diffInHours(start, end);
  }, [dateRange]);

  const getBarPosition = (startTime: string) => {
    const rangeStart = new Date(dateRange.start).getTime();
    const start = new Date(startTime).getTime();
    const offset = (start - rangeStart) / (1000 * 60 * 60);
    return Math.max(0, Math.min(100, (offset / totalHours) * 100));
  };

  const getBarWidth = (startTime: string, endTime: string) => {
    const duration = diffInHours(startTime, endTime);
    return Math.max(2, Math.min(100, (duration / totalHours) * 100));
  };

  const hasConflict = (resourceId: string): boolean => {
    const schedules = getResourceSchedules(resourceId);
    for (let i = 0; i < schedules.length - 1; i++) {
      const currentEnd = new Date(schedules[i].resource.endTime);
      const nextStart = new Date(schedules[i + 1].resource.startTime);
      if (currentEnd > nextStart) return true;
    }
    return false;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">资源甘特图</h2>
              <p className="text-sm text-gray-500">资源占用时间线</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <div className="w-3 h-3 rounded bg-amber-200" />
              <span>准备期</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <div className="w-3 h-3 rounded bg-rose-500" />
              <span>服务期</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <div className="w-3 h-3 rounded bg-blue-200" />
              <span>清场期</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Filter className="w-4 h-4" />
            <span>类型筛选:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {resourceTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-lg transition-all',
                  selectedType === type
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {type === 'all' ? '全部' : ResourceTypeLabels[type]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-auto max-h-[500px]">
        <div className="min-w-[800px]">
          <div className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
            <div className="grid grid-cols-[200px_1fr]">
              <div className="px-4 py-2 text-sm font-medium text-gray-600 border-r border-gray-100">
                资源名称
              </div>
              <div className="px-4 py-2 text-sm font-medium text-gray-600">
                时间轴
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {filteredResources.map((resource) => {
              const schedules = getResourceSchedules(resource.id);
              const conflict = hasConflict(resource.id);

              return (
                <div key={resource.id} className="grid grid-cols-[200px_1fr] hover:bg-gray-50">
                  <div className="px-4 py-3 border-r border-gray-100">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn('w-2 h-2 rounded-full', ResourceTypeColors[resource.type])}
                      />
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {resource.name}
                      </span>
                      {conflict && (
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{resource.supplier}</p>
                  </div>
                  <div className="px-4 py-3 relative">
                    <div className="relative h-10 bg-gray-50 rounded-lg">
                      {schedules.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                          暂无排期
                        </div>
                      ) : (
                        schedules.map((schedule) => {
                          const left = getBarPosition(schedule.resource.startTime);
                          const width = getBarWidth(
                            schedule.resource.startTime,
                            schedule.resource.endTime
                          );
                          const prepWidth = getBarWidth(
                            schedule.resource.startTime,
                            schedule.resource.preparationEnd
                          );
                          const serviceLeft = getBarPosition(schedule.resource.preparationEnd);
                          const serviceWidth = getBarWidth(
                            schedule.resource.preparationEnd,
                            schedule.resource.cleanupStart
                          );
                          const cleanupLeft = getBarPosition(schedule.resource.cleanupStart);
                          const cleanupWidth = getBarWidth(
                            schedule.resource.cleanupStart,
                            schedule.resource.endTime
                          );

                          return (
                            <div
                              key={schedule.orderId}
                              className="absolute top-1/2 -translate-y-1/2 h-6 cursor-pointer group"
                              style={{ left: `${left}%`, width: `${width}%` }}
                              onClick={() => onSelectOrder?.(schedule.orderId)}
                            >
                              <div className="absolute inset-0 flex">
                                <div
                                  className="h-full bg-amber-200 rounded-l-md"
                                  style={{ width: `${(prepWidth / width) * 100}%` }}
                                />
                                <div
                                  className={cn(
                                    'h-full',
                                    ResourceTypeColors[resource.type]
                                  )}
                                  style={{ width: `${(serviceWidth / width) * 100}%` }}
                                />
                                <div
                                  className="h-full bg-blue-200 rounded-r-md"
                                  style={{ width: `${(cleanupWidth / width) * 100}%` }}
                                />
                              </div>
                              
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                                  <div className="font-medium">{schedule.customer}</div>
                                  <div className="text-gray-300 mt-0.5">
                                    {formatDateTime(schedule.resource.startTime)} -{' '}
                                    {formatDateTime(schedule.resource.endTime)}
                                  </div>
                                  <div className="text-gray-400 mt-0.5">
                                    {schedule.orderNo}
                                  </div>
                                </div>
                                <div className="w-2 h-2 bg-gray-900 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-500">
            共 <span className="font-medium text-gray-700">{filteredResources.length}</span> 个资源
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-gray-600">正常排期</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-gray-600">存在冲突</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
