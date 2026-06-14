import { CheckCircle2, Clock, XCircle, Phone, Building2, User } from 'lucide-react';
import type { OrderResource } from '@/types';
import { ResourceTypeLabels, ResourceTypeColors } from '@/types';
import { formatDateTime } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/feeUtils';
import { cn } from '@/lib/utils';

interface SupplierConfirmProps {
  resources: OrderResource[];
  onConfirm?: (resourceId: string) => void;
  showConfirmButton?: boolean;
}

export default function SupplierConfirm({ resources, onConfirm, showConfirmButton = false }: SupplierConfirmProps) {
  const confirmedCount = resources.filter((r) => r.status === 'confirmed').length;
  const pendingCount = resources.filter((r) => r.status === 'pending').length;

  const getStatusIcon = (status: OrderResource['status']) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: OrderResource['status']) => {
    const labels = {
      confirmed: '已确认',
      pending: '待确认',
      cancelled: '已取消',
    };
    return labels[status];
  };

  const getStatusColor = (status: OrderResource['status']) => {
    const colors = {
      confirmed: 'bg-green-50 text-green-700 border-green-200',
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      cancelled: 'bg-gray-50 text-gray-500 border-gray-200',
    };
    return colors[status];
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">供应商确认</h2>
              <p className="text-sm text-gray-500">
                {confirmedCount}/{resources.length} 家已确认
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full">
                {pendingCount} 家待确认
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all"
            style={{ width: `${(confirmedCount / resources.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-[400px] overflow-auto">
        {resources.map((resource) => (
          <div
            key={resource.resourceId}
            className={cn(
              'p-4 rounded-xl border transition-all',
              getStatusColor(resource.status),
              resource.conflict && 'border-red-300 bg-red-50'
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    ResourceTypeColors[resource.resource.type],
                    'bg-opacity-20'
                  )}
                >
                  <span className="text-white text-xs font-medium">
                    {ResourceTypeLabels[resource.resource.type].charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-800">{resource.resource.name}</h4>
                    <span className="text-xs px-2 py-0.5 bg-white/60 rounded text-gray-600">
                      {ResourceTypeLabels[resource.resource.type]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{resource.resource.supplier}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{resource.resource.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {formatDateTime(resource.startTime)} - {formatDateTime(resource.endTime)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-semibold text-gray-800">
                    {formatCurrency(resource.price)}
                  </div>
                  <div className="flex items-center gap-1 justify-end mt-1">
                    {getStatusIcon(resource.status)}
                    <span className="text-xs">{getStatusLabel(resource.status)}</span>
                  </div>
                </div>

                {showConfirmButton && resource.status === 'pending' && (
                  <button
                    onClick={() => onConfirm?.(resource.resourceId)}
                    className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                  >
                    确认
                  </button>
                )}
              </div>
            </div>

            {resource.conflict && (
              <div className="mt-3 p-2 bg-red-100/50 rounded-lg text-xs text-red-700 flex items-start gap-2">
                <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{resource.conflict}</span>
              </div>
            )}

            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
              <div>
                <span className="text-gray-400">准备期:</span>{' '}
                <span className="text-amber-600">
                  {formatDateTime(resource.startTime)} -{' '}
                  {formatDateTime(resource.preparationEnd)}
                </span>
              </div>
              <div>
                <span className="text-gray-400">服务期:</span>{' '}
                <span className="text-rose-600">
                  {formatDateTime(resource.preparationEnd)} -{' '}
                  {formatDateTime(resource.cleanupStart)}
                </span>
              </div>
              <div>
                <span className="text-gray-400">清场期:</span>{' '}
                <span className="text-blue-600">
                  {formatDateTime(resource.cleanupStart)} -{' '}
                  {formatDateTime(resource.endTime)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
