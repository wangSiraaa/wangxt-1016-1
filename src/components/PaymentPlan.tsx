import { CreditCard, Calendar as CalendarIcon, Clock, CheckCircle2, AlertTriangle, XCircle, Wallet } from 'lucide-react';
import type { Order, PaymentPlan } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/feeUtils';
import { formatDate, isDatePast, diffInDays } from '@/utils/dateUtils';
import { useWeddingStore } from '@/store/weddingStore';

interface PaymentPlanProps {
  order: Order;
  onPay?: (paymentId: string) => void;
}

export default function PaymentPlanComponent({ order, onPay }: PaymentPlanProps) {
  const { payInstallment, currentRole } = useWeddingStore();

  const sortedPlans = [...order.paymentPlans].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  const paidAmount = order.paidAmount;
  const totalAmount = order.totalAmount;
  const remainingAmount = totalAmount - paidAmount;

  const progress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  const getPaymentIcon = (type: PaymentPlan['type']) => {
    switch (type) {
      case 'deposit':
        return <Wallet className="w-4 h-4" />;
      case 'installment':
        return <CalendarIcon className="w-4 h-4" />;
      case 'balance':
        return <CreditCard className="w-4 h-4" />;
      case 'reschedule_fee':
        return <Clock className="w-4 h-4" />;
    }
  };

  const getPaymentTypeLabel = (type: PaymentPlan['type']) => {
    const labels = {
      deposit: '定金',
      installment: '分期',
      balance: '尾款',
      reschedule_fee: '改期费',
    };
    return labels[type];
  };

  const getStatusIcon = (status: PaymentPlan['status']) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-400" />;
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-gray-300" />;
    }
  };

  const getStatusLabel = (status: PaymentPlan['status']) => {
    const labels = {
      paid: '已支付',
      pending: '待支付',
      overdue: '已逾期',
      cancelled: '已取消',
    };
    return labels[status];
  };

  const handlePay = (payment: PaymentPlan) => {
    if (payment.status === 'paid' || payment.status === 'cancelled') return;
    if (onPay) {
      onPay(payment.id);
    } else {
      payInstallment(order.id, payment.id);
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const canPay = (payment: PaymentPlan) => {
    if (payment.status === 'paid' || payment.status === 'cancelled') return false;
    if (currentRole === 'customer') return true;
    if (currentRole === 'planner') return false;
    if (currentRole === 'manager') return true;
    return false;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-800">付款计划</h2>
            <p className="text-sm text-gray-500">客户付款节点</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">付款进度</span>
            <span className="text-sm font-medium text-gray-800">
              {formatCurrency(paidAmount)} / {formatCurrency(totalAmount)}
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>已付 {progress.toFixed(1)}%</span>
            <span>剩余 {formatCurrency(remainingAmount)}</span>
          </div>
        </div>

        <div className="space-y-3">
          {sortedPlans.map((payment, index) => {
            const daysUntilDue = getDaysUntilDue(payment.dueDate);
            const isUrgent = payment.status === 'pending' && daysUntilDue > 0 && daysUntilDue <= 7;
            const isOverdue = payment.status === 'pending' && daysUntilDue < 0;

            return (
              <div
                key={payment.id}
                className={cn(
                  'p-4 rounded-xl border transition-all',
                  payment.status === 'paid'
                    ? 'bg-gray-50 border-gray-100'
                    : isOverdue
                    ? 'bg-red-50 border-red-100'
                    : isUrgent
                    ? 'bg-yellow-50 border-yellow-100'
                    : 'bg-white border-gray-100'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        payment.status === 'paid'
                          ? 'bg-green-100 text-green-600'
                          : isOverdue
                          ? 'bg-red-100 text-red-600'
                          : 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {getPaymentIcon(payment.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-800">{payment.name}</h4>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                          {getPaymentTypeLabel(payment.type)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <CalendarIcon className="w-4 h-4" />
                        <span>到期日: {formatDate(payment.dueDate)}</span>
                        {payment.paidDate && (
                          <span className="text-green-600">
                            (支付: {formatDate(payment.paidDate)})
                          </span>
                        )}
                      </div>
                      {isUrgent && (
                        <div className="mt-1 text-xs text-yellow-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>还有 {daysUntilDue} 天到期</span>
                        </div>
                      )}
                      {isOverdue && (
                        <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>已逾期 {Math.abs(daysUntilDue)} 天</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-800">
                        {formatCurrency(payment.amount)}
                      </div>
                      <div className="flex items-center justify-end gap-1 text-sm">
                        {getStatusIcon(payment.status)}
                        <span
                          className={cn(
                            payment.status === 'paid' && 'text-green-600',
                            payment.status === 'pending' && 'text-gray-500',
                            payment.status === 'overdue' && 'text-red-600',
                            payment.status === 'cancelled' && 'text-gray-400'
                          )}
                        >
                          {getStatusLabel(payment.status)}
                        </span>
                      </div>
                    </div>

                    {canPay(payment) && (
                      <button
                        onClick={() => handlePay(payment)}
                        className={cn(
                          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                          payment.status === 'paid' || payment.status === 'cancelled'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        )}
                        disabled={payment.status === 'paid' || payment.status === 'cancelled'}
                      >
                        支付
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {order.depositExpiresAt && order.status === 'pending_deposit' && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">定金支付提醒</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  定金未支付的订单将在{' '}
                  <span className="font-semibold">
                    {formatDate(order.depositExpiresAt, 'MM月DD日 HH:mm')}
                  </span>{' '}
                  后自动释放档期
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
