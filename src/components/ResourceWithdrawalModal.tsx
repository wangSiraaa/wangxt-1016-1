import React, { useState } from 'react';
import { X, AlertTriangle, Check, UserCheck, Clock, DollarSign, MessageCircle, ChevronRight, RefreshCw } from 'lucide-react';
import type { Order, ResourceWithdrawal, AlternativeResource } from '@/types';
import { useWeddingStore } from '@/store/weddingStore';
import { formatCurrency } from '@/utils/feeUtils';
import { formatDateTime } from '@/utils/dateUtils';

interface ResourceWithdrawalModalProps {
  order: Order;
  withdrawal: ResourceWithdrawal;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ResourceWithdrawalModal: React.FC<ResourceWithdrawalModalProps> = ({
  order,
  withdrawal,
  onClose,
  onSuccess,
}) => {
  const [selectedAlternativeId, setSelectedAlternativeId] = useState<string | null>(
    withdrawal.selectedAlternativeId || null
  );
  const [customerConfirmed, setCustomerConfirmed] = useState<boolean>(
    withdrawal.customerConfirmed || false
  );
  const [step, setStep] = useState<'select' | 'confirm' | 'processing' | 'done'>('select');

  const selectAlternativeResource = useWeddingStore((state) => state.selectAlternativeResource);
  const confirmAlternativeWithCustomer = useWeddingStore((state) => state.confirmAlternativeWithCustomer);
  const resolveWithdrawal = useWeddingStore((state) => state.resolveWithdrawal);

  const handleSelectAlternative = (alternativeId: string) => {
    setSelectedAlternativeId(alternativeId);
    selectAlternativeResource(order.id, withdrawal.id, alternativeId);
  };

  const handleCustomerConfirm = (confirmed: boolean) => {
    setCustomerConfirmed(confirmed);
    confirmAlternativeWithCustomer(order.id, withdrawal.id, confirmed);
    if (confirmed) {
      setStep('confirm');
    }
  };

  const handleResolve = async () => {
    if (!selectedAlternativeId || !customerConfirmed) return;

    setStep('processing');

    setTimeout(() => {
      resolveWithdrawal(order.id, withdrawal.id);
      setStep('done');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    }, 1000);
  };

  const selectedAlternative = withdrawal.alternatives.find(
    (a) => a.resourceId === selectedAlternativeId
  );

  const getStepIcon = (currentStep: string) => {
    const steps = ['select', 'confirm', 'processing', 'done'];
    const currentIndex = steps.indexOf(currentStep);
    const stepConfig = [
      { icon: RefreshCw, label: '选择替代方案' },
      { icon: UserCheck, label: '客户确认' },
      { icon: Clock, label: '处理中' },
      { icon: Check, label: '完成' },
    ];

    return (
      <div className="flex items-center justify-center mb-6">
        {stepConfig.map((config, idx) => {
          const Icon = config.icon;
          const isActive = idx === currentIndex;
          const isPast = idx < currentIndex;
          const isFuture = idx > currentIndex;

          return (
            <React.Fragment key={config.label}>
              <div
                className={`flex flex-col items-center ${
                  isFuture ? 'opacity-40' : ''
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isPast
                      ? 'bg-emerald-500 text-white'
                      : isActive
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-xs mt-1 ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                  {config.label}
                </span>
              </div>
              {idx < stepConfig.length - 1 && (
                <ChevronRight className="w-5 h-5 text-gray-300 mx-2" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="bg-red-50 p-6 border-b border-red-100">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">资源撤回处理</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {withdrawal.resourceName} 已被供应商撤回，需要安排替代方案
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="mt-4 bg-white rounded-xl p-4 border border-red-200">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <MessageCircle className="w-4 h-4" />
              <span className="font-medium">撤回原因：</span>
              <span>{withdrawal.reason}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
              <Clock className="w-4 h-4" />
              <span>通知时间：{formatDateTime(withdrawal.notifiedAt)}</span>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          {getStepIcon(step)}

          {step === 'select' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800">
                  <span className="font-medium">重要提示：</span>
                  不允许静默替换资源。必须先选择替代方案，然后与客户确认获得同意后才能执行替换。
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  可用替代方案
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({withdrawal.alternatives.filter((a) => a.available).length} 个可用)
                  </span>
                </h3>
                <div className="space-y-3">
                  {withdrawal.alternatives.map((alternative) => (
                    <div
                      key={alternative.resourceId}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedAlternativeId === alternative.resourceId
                          ? 'border-blue-500 bg-blue-50'
                          : alternative.available
                          ? 'border-gray-200 hover:border-gray-300'
                          : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                      }`}
                      onClick={() => alternative.available && handleSelectAlternative(alternative.resourceId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              selectedAlternativeId === alternative.resourceId
                                ? 'border-blue-500 bg-blue-500'
                                : alternative.available
                                ? 'border-gray-300'
                                : 'border-gray-200'
                            }`}
                          >
                            {selectedAlternativeId === alternative.resourceId && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{alternative.resourceName}</p>
                            <p className="text-sm text-gray-500">{alternative.supplier}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-semibold ${
                              alternative.priceDifference > 0
                                ? 'text-red-600'
                                : alternative.priceDifference < 0
                                ? 'text-emerald-600'
                                : 'text-gray-600'
                            }`}
                          >
                            {alternative.priceDifference > 0 ? '+' : ''}
                            {formatCurrency(alternative.priceDifference)}
                          </span>
                          {!alternative.available && (
                            <p className="text-xs text-red-500 mt-1">该日期不可用</p>
                          )}
                        </div>
                      </div>
                      {alternative.notes && (
                        <p className="text-sm text-gray-500 mt-2 ml-9">{alternative.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'confirm' && selectedAlternative && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <UserCheck className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">客户确认</p>
                    <p className="text-sm text-blue-700 mt-1">
                      已选择替代方案：<span className="font-semibold">{selectedAlternative.resourceName}</span>
                      <br />
                      请确认客户是否同意该替代方案。系统将记录客户确认状态。
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-900 mb-3">方案对比</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                    <p className="text-xs text-red-500 font-medium">原资源</p>
                    <p className="font-medium text-gray-900 mt-1">{withdrawal.resourceName}</p>
                    <p className="text-sm text-gray-500">{withdrawal.supplier}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                    <p className="text-xs text-emerald-500 font-medium">替代资源</p>
                    <p className="font-medium text-gray-900 mt-1">{selectedAlternative.resourceName}</p>
                    <p className="text-sm text-gray-500">{selectedAlternative.supplier}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">价格差异</span>
                    <span
                      className={`font-semibold ${
                        selectedAlternative.priceDifference > 0
                          ? 'text-red-600'
                          : selectedAlternative.priceDifference < 0
                          ? 'text-emerald-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {selectedAlternative.priceDifference > 0 ? '+' : ''}
                      {formatCurrency(selectedAlternative.priceDifference)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-600">新总价</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(order.totalAmount + selectedAlternative.priceDifference)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => handleCustomerConfirm(false)}
                  className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors border-2 border-gray-200"
                >
                  客户拒绝
                </button>
                <button
                  onClick={() => handleCustomerConfirm(true)}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                >
                  客户已确认
                </button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
              <p className="text-gray-600">正在处理资源替换...</p>
            </div>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-lg font-semibold text-gray-900">处理完成</p>
              <p className="text-gray-500 mt-1">资源已成功替换</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex justify-end gap-3">
            {step === 'select' && (
              <>
                <button
                  onClick={onClose}
                  className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                >
                  稍后处理
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  disabled={!selectedAlternativeId}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一步
                </button>
              </>
            )}
            {step === 'confirm' && (
              <>
                <button
                  onClick={() => setStep('select')}
                  className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                >
                  上一步
                </button>
                <button
                  onClick={handleResolve}
                  disabled={!customerConfirmed}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认替换
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
