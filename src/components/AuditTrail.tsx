import { Clock, User, ArrowRight, FileText, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import type { AuditLog, RescheduleRecord } from '@/types';
import { formatDateTime, formatDate } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/feeUtils';
import { cn } from '@/lib/utils';

interface AuditTrailProps {
  logs: AuditLog[];
  title?: string;
  maxItems?: number;
}

export default function AuditTrail({ logs, title = '操作审计', maxItems }: AuditTrailProps) {
  const displayLogs = maxItems ? logs.slice(-maxItems).reverse() : [...logs].reverse();

  const getActionIcon = (action: string) => {
    if (action.includes('改期')) return <RefreshCw className="w-4 h-4" />;
    if (action.includes('审批') || action.includes('通过')) return <CheckCircle className="w-4 h-4" />;
    if (action.includes('支付') || action.includes('付款')) return <FileText className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('拒绝') || action.includes('取消')) return 'bg-red-100 text-red-600';
    if (action.includes('审批通过') || action.includes('确认')) return 'bg-green-100 text-green-600';
    if (action.includes('改期')) return 'bg-purple-100 text-purple-600';
    if (action.includes('支付')) return 'bg-blue-100 text-blue-600';
    return 'bg-gray-100 text-gray-600';
  };

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="text-center py-8 text-gray-400">
          <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>暂无操作记录</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500">共 {logs.length} 条操作记录</p>
      </div>

      <div className="p-4 max-h-[400px] overflow-auto">
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />
          
          <div className="space-y-4">
            {displayLogs.map((log, index) => (
              <div key={log.id} className="relative flex gap-4">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10',
                    getActionColor(log.action)
                  )}
                >
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-800">{log.action}</h4>
                    <span className="text-xs text-gray-400">
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                  {log.oldValue && log.newValue && (
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span className="px-2 py-1 bg-gray-100 rounded text-gray-500">
                        {log.oldValue}
                      </span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="px-2 py-1 bg-green-50 rounded text-green-600">
                        {log.newValue}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                    <User className="w-3.5 h-3.5" />
                    <span>操作人: {log.operator}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface RescheduleHistoryProps {
  records: RescheduleRecord[];
  onApprove?: (recordId: string, approved: boolean) => void;
  showActions?: boolean;
}

export function RescheduleHistory({ records, onApprove, showActions = false }: RescheduleHistoryProps) {
  if (records.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">改期记录</h3>
        <div className="text-center py-8 text-gray-400">
          <RefreshCw className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>暂无改期记录</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: RescheduleRecord['status']) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    const labels = {
      pending: '待审批',
      approved: '已通过',
      rejected: '已拒绝',
    };
    return (
      <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full', badges[status])}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800">改期记录</h3>
        <p className="text-sm text-gray-500">共 {records.length} 次改期</p>
      </div>

      <div className="p-4 space-y-4">
        {[...records].reverse().map((record) => (
          <div
            key={record.id}
            className="p-4 bg-gray-50 rounded-xl border border-gray-100"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">改期申请</h4>
                  <p className="text-sm text-gray-500">
                    改期费 {formatCurrency(record.rescheduleFee)}
                  </p>
                </div>
              </div>
              {getStatusBadge(record.status)}
            </div>

            <div className="flex items-center gap-4 mb-3">
              <div className="flex-1 p-3 bg-white rounded-lg">
                <p className="text-xs text-gray-400 mb-1">原日期</p>
                <p className="font-medium text-gray-700">{formatDate(record.oldDate)}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
              <div className="flex-1 p-3 bg-purple-50 rounded-lg">
                <p className="text-xs text-purple-400 mb-1">新日期</p>
                <p className="font-medium text-purple-700">{formatDate(record.newDate)}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="text-gray-400">改期原因:</span>
                <span>{record.reason}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="text-gray-400">价格差额:</span>
                <span className={record.priceDifference >= 0 ? 'text-red-600' : 'text-green-600'}>
                  {record.priceDifference >= 0 ? '+' : ''}
                  {formatCurrency(record.priceDifference)}
                </span>
              </div>
              {record.weatherBackup && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-gray-400">天气备选:</span>
                  <span className="text-blue-600">已启用</span>
                </div>
              )}
              {record.conflicts.length > 0 && (
                <div className="flex items-center gap-2 text-yellow-600">
                  <span className="text-gray-400">资源冲突:</span>
                  <span>{record.conflicts.length} 项</span>
                </div>
              )}
            </div>

            {record.status === 'approved' && record.approvedBy && (
              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                <span>审批人: {record.approvedBy}</span>
                <span>{formatDateTime(record.approvedAt)}</span>
              </div>
            )}

            {showActions && record.status === 'pending' && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => onApprove?.(record.id, true)}
                  className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  通过
                </button>
                <button
                  onClick={() => onApprove?.(record.id, false)}
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-1"
                >
                  <XCircle className="w-4 h-4" />
                  拒绝
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
