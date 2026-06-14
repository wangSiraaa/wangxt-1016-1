import { AlertTriangle, XCircle, Clock, Info } from 'lucide-react';
import type { ConflictInfo } from '@/types';
import { ResourceTypeLabels } from '@/types';
import { formatDateTime } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';

interface ConflictExplainProps {
  conflicts: ConflictInfo[];
  title?: string;
}

export default function ConflictExplain({ conflicts, title = '资源冲突说明' }: ConflictExplainProps) {
  if (conflicts.length === 0) return null;

  const getConflictTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      preparation: '准备期',
      service: '服务期',
      cleanup: '清场期',
    };
    return labels[type] || type;
  };

  const getConflictSeverity = (type: string) => {
    if (type === 'service') return 'high';
    if (type === 'preparation' || type === 'cleanup') return 'medium';
    return 'low';
  };

  return (
    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h3 className="font-semibold text-red-800">{title}</h3>
          <p className="text-sm text-red-600 mt-0.5">
            检测到 {conflicts.length} 个资源冲突，请协调后再安排
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {conflicts.map((conflict, index) => {
          const severity = getConflictSeverity(conflict.conflictType);
          return (
            <div
              key={index}
              className={cn(
                'p-3 rounded-lg border',
                severity === 'high'
                  ? 'bg-red-100/50 border-red-200'
                  : 'bg-yellow-50 border-yellow-200'
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'px-2 py-0.5 text-xs font-medium rounded-full',
                        severity === 'high'
                          ? 'bg-red-500 text-white'
                          : 'bg-yellow-500 text-white'
                      )}
                    >
                      {getConflictTypeLabel(conflict.conflictType)}冲突
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {ResourceTypeLabels[conflict.resourceType]}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-800 mt-1.5">{conflict.resourceName}</h4>
                </div>
                {severity === 'high' && (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">冲突订单:</span>
                  <span className="text-gray-800 ml-1">
                    {conflict.conflictingCustomer}
                  </span>
                  <span className="text-gray-400 ml-1">({conflict.conflictingOrderNo})</span>
                </div>
                <div>
                  <span className="text-gray-500">冲突时段:</span>
                </div>
                <div className="col-span-2 text-gray-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {formatDateTime(conflict.conflictStart)} -{' '}
                    {formatDateTime(conflict.conflictEnd)}
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-red-100/50">
                <div className="flex items-start gap-1.5 text-xs text-red-600">
                  <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>
                    建议：请与客户协商调整时间，或更换其他{ResourceTypeLabels[conflict.resourceType]}资源
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
