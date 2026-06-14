import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Phone,
  FileText,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building2,
  History,
  Wallet,
} from 'lucide-react';
import { useWeddingStore } from '@/store/weddingStore';
import { OrderStatusLabels, OrderStatusColors, ResourceTypeColors } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/feeUtils';
import { formatDate, formatDateTime, isDatePast } from '@/utils/dateUtils';
import PaymentPlanComponent from './PaymentPlan';
import SupplierConfirm from './SupplierConfirm';
import AuditTrail, { RescheduleHistory } from './AuditTrail';
import RescheduleModal from './RescheduleModal';
import ConflictExplain from './ConflictExplain';

interface OrderDetailProps {
  orderId: string;
  onBack: () => void;
}

export default function OrderDetail({ orderId, onBack }: OrderDetailProps) {
  const {
    orders,
    confirmResource,
    payDeposit,
    approveOrder,
    canReschedule,
    checkRescheduleConflicts,
    currentRole,
  } = useWeddingStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'payment' | 'history'>('overview');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  const order = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);

  if (!order) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">订单不存在</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          返回
        </button>
      </div>
    );
  }

  const canRescheduleOrder = canReschedule(orderId);
  const isPast = isDatePast(order.weddingDate);
  const hasConflicts = order.resources.some((r) => r.conflict);

  const tabs = [
    { id: 'overview', label: '合同概览', icon: FileText },
    { id: 'resources', label: '资源安排', icon: Building2 },
    { id: 'payment', label: '付款计划', icon: Wallet },
    { id: 'history', label: '操作记录', icon: History },
  ] as const;

  const handleConfirmResource = (resourceId: string) => {
    confirmResource(orderId, resourceId);
  };

  const handlePayDeposit = () => {
    payDeposit(orderId);
  };

  const handleApprove = () => {
    approveOrder(orderId, '张店长');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-gray-800">
                    {order.customerName}
                  </h1>
                  <span
                    className={cn(
                      'px-3 py-1 text-sm font-medium rounded-full',
                      OrderStatusColors[order.status]
                    )}
                  >
                    {OrderStatusLabels[order.status]}
                  </span>
                  {hasConflicts && (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      有冲突
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  订单号: {order.orderNo} · 策划师: {order.planner}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {order.status === 'pending_deposit' && (
                <button
                  onClick={handlePayDeposit}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  标记定金已付
                </button>
              )}

              {order.status === 'deposit_paid' && currentRole === 'manager' && (
                <button
                  onClick={handleApprove}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  店长审批
                </button>
              )}

              {canRescheduleOrder ? (
                <button
                  onClick={() => setShowRescheduleModal(true)}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  申请改期
                </button>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {isPast ? '婚礼已过，不可改期' : '暂不可改期'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-1 mt-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2',
                  activeTab === tab.id
                    ? 'bg-rose-50 text-rose-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">合同状态</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">婚礼日期</span>
                    </div>
                    <p className="text-xl font-semibold text-gray-800">
                      {formatDate(order.weddingDate)}
                    </p>
                    {isPast && (
                      <p className="text-xs text-orange-500 mt-1">婚礼已结束</p>
                    )}
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">婚礼地点</span>
                    </div>
                    <p className="text-xl font-semibold text-gray-800">
                      {order.weddingLocation}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">婚礼主题</span>
                    </div>
                    <p className="text-xl font-semibold text-gray-800">{order.theme}</p>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-xl">
                    <div className="flex items-center gap-2 text-rose-500 mb-2">
                      <Wallet className="w-4 h-4" />
                      <span className="text-sm">订单金额</span>
                    </div>
                    <p className="text-2xl font-bold text-rose-600">
                      {formatCurrency(order.totalAmount)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      已付 {formatCurrency(order.paidAmount)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">客户信息</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">新人姓名</p>
                      <p className="font-semibold text-gray-800">{order.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Phone className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">联系电话</p>
                      <p className="font-semibold text-gray-800">{order.customerPhone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {hasConflicts && (
                <ConflictExplain
                  conflicts={order.resources
                    .filter((r) => r.conflict)
                    .map((r) => ({
                      resourceId: r.resourceId,
                      resourceName: r.resource.name,
                      resourceType: r.resource.type,
                      conflictingOrderId: '',
                      conflictingOrderNo: '',
                      conflictingCustomer: '',
                      conflictStart: r.startTime,
                      conflictEnd: r.endTime,
                      conflictType: 'service',
                    }))}
                  title="资源冲突说明"
                />
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">资源概览</h2>
                <div className="space-y-3">
                  {order.resources.map((resource) => (
                    <div
                      key={resource.resourceId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-3 h-3 rounded-full',
                            ResourceTypeColors[resource.resource.type]
                          )}
                        />
                        <span className="text-sm text-gray-700">
                          {resource.resource.name}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-800">
                        {formatCurrency(resource.price)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-gray-600">总计</span>
                  <span className="text-lg font-bold text-rose-600">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>

              {order.depositExpiresAt && order.status === 'pending_deposit' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-yellow-800">定金支付提醒</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        定金未支付的订单将在{' '}
                        <span className="font-semibold">
                          {formatDateTime(order.depositExpiresAt)}
                        </span>{' '}
                        后自动释放档期
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {order.notes && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-3">备注</h2>
                  <p className="text-gray-600">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <SupplierConfirm
            resources={order.resources}
            onConfirm={handleConfirmResource}
            showConfirmButton={currentRole === 'planner' || currentRole === 'manager'}
          />
        )}

        {activeTab === 'payment' && (
          <div className="grid grid-cols-2 gap-6">
            <PaymentPlanComponent order={order} />
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">付款流水</h2>
                <div className="space-y-3">
                  {order.paymentPlans
                    .filter((p) => p.status === 'paid')
                    .map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 bg-green-50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{payment.name}</p>
                            <p className="text-xs text-gray-500">
                              {payment.paidDate && formatDate(payment.paidDate)}
                            </p>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-green-600">
                          +{formatCurrency(payment.amount)}
                        </span>
                      </div>
                    ))}
                  {order.paymentPlans.filter((p) => p.status === 'paid').length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <Wallet className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>暂无付款记录</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="grid grid-cols-2 gap-6">
            <AuditTrail logs={order.auditLogs} title="操作审计" />
            <RescheduleHistory
              records={order.rescheduleRecords}
              showActions={currentRole === 'manager'}
            />
          </div>
        )}
      </div>

      <RescheduleModal
        orderId={orderId}
        isOpen={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
      />
    </div>
  );
}
