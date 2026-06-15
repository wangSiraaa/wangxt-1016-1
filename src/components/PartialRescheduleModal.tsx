import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertTriangle, Check, DollarSign, Info } from 'lucide-react';
import type { Order, OrderResource, FeeCalculation, ConflictInfo } from '@/types';
import { useWeddingStore } from '@/store/weddingStore';
import { formatCurrency } from '@/utils/feeUtils';
import { checkPartialRescheduleConflicts } from '@/utils/conflictUtils';
import { calculatePartialRescheduleFee } from '@/utils/feeUtils';
import { formatDate, addDays } from '@/utils/dateUtils';

interface PartialRescheduleModalProps {
  order: Order;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PartialRescheduleModal: React.FC<PartialRescheduleModalProps> = ({
  order,
  onClose,
  onSuccess,
}) => {
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [newDate, setNewDate] = useState(order.weddingDate);
  const [newStartTime, setNewStartTime] = useState('10:00');
  const [reason, setReason] = useState('');
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [feeCalc, setFeeCalc] = useState<FeeCalculation | null>(null);
  const [step, setStep] = useState<'select' | 'review' | 'submitting'>('select');

  const currentRole = useWeddingStore((state) => state.currentRole);
  const orders = useWeddingStore((state) => state.orders);
  const applyPartialReschedule = useWeddingStore((state) => state.applyPartialReschedule);

  useEffect(() => {
    if (selectedResourceIds.length > 0) {
      const resourcesToReschedule = order.resources.filter((r) =>
        selectedResourceIds.includes(r.resourceId)
      );
      const newResources = resourcesToReschedule.map((r) => {
        const startHour = parseInt(newStartTime.split(':')[0]);
        const times = {
          startTime: new Date(`${newDate}T${String(startHour - r.resource.preparationHours).padStart(2, '0')}:00:00`).toISOString(),
          endTime: new Date(`${newDate}T${String(startHour + r.resource.serviceHours + r.resource.cleanupHours).padStart(2, '0')}:00:00`).toISOString(),
          preparationEnd: new Date(`${newDate}T${String(startHour).padStart(2, '0')}:00:00`).toISOString(),
          cleanupStart: new Date(`${newDate}T${String(startHour + r.resource.serviceHours).padStart(2, '0')}:00:00`).toISOString(),
        };
        return { ...r, ...times };
      });

      const newConflicts = checkPartialRescheduleConflicts(
        newResources,
        orders,
        order.id,
        selectedResourceIds
      );
      setConflicts(newConflicts);

      const calc = calculatePartialRescheduleFee(order, selectedResourceIds, newDate, newStartTime);
      setFeeCalc(calc);
    } else {
      setConflicts([]);
      setFeeCalc(null);
    }
  }, [selectedResourceIds, newDate, newStartTime, order, orders]);

  const handleResourceToggle = (resourceId: string) => {
    setSelectedResourceIds((prev) =>
      prev.includes(resourceId)
        ? prev.filter((id) => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const handleSubmit = async () => {
    if (selectedResourceIds.length === 0) return;
    if (conflicts.length > 0) return;

    setStep('submitting');

    const result = applyPartialReschedule(
      order.id,
      selectedResourceIds,
      newDate,
      reason,
      undefined,
      newStartTime
    );

    if (result.success) {
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1000);
    } else {
      alert(result.message);
      setStep('review');
    }
  };

  const selectedResources = order.resources.filter((r) =>
    selectedResourceIds.includes(r.resourceId)
  );

  const getResourceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      venue: '场地',
      photography: '摄影',
      videography: '摄像',
      host: '主持',
      makeup: '化妆',
      car: '婚车',
      decor: '花艺',
      rehearsal: '彩排',
      welcomedinner: '欢迎晚宴',
    };
    return labels[type] || type;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">部分改期申请</h2>
            <p className="text-sm text-gray-500 mt-1">
              订单 {order.orderNo} - {order.customerName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {step === 'select' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900">部分改期说明</p>
                    <p className="text-sm text-amber-700 mt-1">
                      选择需要改期的资源，未选中的资源将保持原日期不变。
                      系统将根据各供应商条款自动计算改期费和差价。
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  选择需要改期的资源
                </label>
                <div className="grid gap-3">
                  {order.resources.map((resource) => (
                    <div
                      key={resource.resourceId}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedResourceIds.includes(resource.resourceId)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleResourceToggle(resource.resourceId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              selectedResourceIds.includes(resource.resourceId)
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {selectedResourceIds.includes(resource.resourceId) && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{resource.resource.name}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                                {getResourceTypeLabel(resource.resource.type)}
                              </span>
                              <span>{formatCurrency(resource.price)}</span>
                            </div>
                          </div>
                        </div>
                        {resource.resource.terms && (
                          <div className="text-right text-xs text-gray-500">
                            <p>定金: {(resource.resource.terms.depositRate * 100).toFixed(0)}%</p>
                            <p>改期违约金: {(resource.resource.terms.reschedulePenaltyRate * 100).toFixed(0)}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    新日期
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={formatDate(new Date())}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    新开始时间
                  </label>
                  <select
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Array.from({ length: 13 }, (_, i) => {
                      const hour = i + 8;
                      return (
                        <option key={hour} value={`${String(hour).padStart(2, '0')}:00`}>
                          {String(hour).padStart(2, '0')}:00
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  改期原因
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="请输入改期原因..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>
          )}

          {step === 'review' && feeCalc && (
            <div className="space-y-6">
              {conflicts.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900">检测到资源冲突</p>
                      <div className="mt-2 space-y-2">
                        {conflicts.map((conflict, idx) => (
                          <div key={idx} className="text-sm text-red-700">
                            {conflict.resourceName} 与订单 {conflict.conflictingOrderNo} ({conflict.conflictingCustomer}) 冲突
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">改期资源</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  {selectedResources.map((r) => (
                    <div
                      key={r.resourceId}
                      className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{r.resource.name}</p>
                        <p className="text-sm text-gray-500">
                          原: {order.weddingDate} {r.startTime.split('T')[1]?.substring(0, 5)} → 新: {newDate} {newStartTime}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  费用明细
                </h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-gray-600">项目</th>
                        <th className="text-right py-2 text-gray-600">原价</th>
                        <th className="text-right py-2 text-gray-600">新价</th>
                        <th className="text-right py-2 text-gray-600">差价</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feeCalc.details.map((d, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-2 text-gray-900">{d.name}</td>
                          <td className="text-right py-2 text-gray-600">{formatCurrency(d.oldPrice)}</td>
                          <td className="text-right py-2 text-gray-900">{formatCurrency(d.newPrice)}</td>
                          <td className={`text-right py-2 font-medium ${d.difference >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {d.difference >= 0 ? '+' : ''}{formatCurrency(d.difference)}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-gray-200">
                        <td colSpan={3} className="py-3 font-medium text-gray-700">价格差价</td>
                        <td className={`text-right py-3 font-semibold ${feeCalc.priceDifference >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {feeCalc.priceDifference >= 0 ? '+' : ''}{formatCurrency(feeCalc.priceDifference)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="py-2 font-medium text-gray-700">改期费</td>
                        <td className="text-right py-2 font-semibold text-amber-600">
                          +{formatCurrency(feeCalc.rescheduleFee)}
                        </td>
                      </tr>
                      <tr className="border-t-2 border-gray-300 bg-gray-100">
                        <td colSpan={3} className="py-3 font-bold text-gray-900">新总价</td>
                        <td className="text-right py-3 font-bold text-gray-900">
                          {formatCurrency(feeCalc.newTotal)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="py-2 text-gray-600">已付金额</td>
                        <td className="text-right py-2 text-gray-600">
                          -{formatCurrency(feeCalc.paidAmount)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="py-2 font-semibold text-gray-700">还需支付</td>
                        <td className="text-right py-2 font-semibold text-blue-600">
                          {formatCurrency(feeCalc.balanceDue)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === 'submitting' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
              <p className="text-gray-600">正在提交改期申请...</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
            >
              取消
            </button>
            {step === 'select' && (
              <button
                onClick={() => setStep('review')}
                disabled={selectedResourceIds.length === 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一步
              </button>
            )}
            {step === 'review' && (
              <>
                <button
                  onClick={() => setStep('select')}
                  className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                >
                  上一步
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={conflicts.length > 0}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  提交改期申请
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
