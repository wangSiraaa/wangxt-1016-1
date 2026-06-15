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
  CalendarDays,
  SplitSquareVertical,
  AlertOctagon,
  CloudRain,
  Sun,
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
import { ScheduleTimeline } from './ScheduleTimeline';
import { PartialRescheduleModal } from './PartialRescheduleModal';
import { ResourceWithdrawalModal } from './ResourceWithdrawalModal';

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
    approveReschedule,
    currentRole,
    toggleRainBackup,
    approvePartialReschedule,
  } = useWeddingStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'resources' | 'payment' | 'history'>('overview');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showPartialRescheduleModal, setShowPartialRescheduleModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [selectedWithdrawalId, setSelectedWithdrawalId] = useState<string | null>(null);

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
  const activeWithdrawals = (order.resourceWithdrawals || []).filter(w => w.status === 'pending');
  const pendingPartialReschedules = (order.partialReschedules || []).filter(pr => pr.status === 'pending');
  const hasRainBackup = (order.schedule || []).some(e => e.isRainBackup);

  const tabs = [
    { id: 'overview', label: '合同概览', icon: FileText },
    { id: 'schedule', label: '日程安排', icon: CalendarDays },
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

  const handleToggleRainBackup = (enable: boolean) => {
    toggleRainBackup(orderId, enable);
  };

  const handleOpenWithdrawal = (withdrawalId: string) => {
    setSelectedWithdrawalId(withdrawalId);
    setShowWithdrawalModal(true);
  };

  const handleApprovePartialReschedule = (prId: string, approved: boolean) => {
    approvePartialReschedule(orderId, prId, approved);
  };

  const selectedWithdrawal = activeWithdrawals.find(w => w.id === selectedWithdrawalId);

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

              {activeWithdrawals.length > 0 && (
                <button
                  onClick={() => handleOpenWithdrawal(activeWithdrawals[0].id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center gap-2 animate-pulse"
                >
                  <AlertOctagon className="w-4 h-4" />
                  资源撤回待处理 ({activeWithdrawals.length})
                </button>
              )}

              {pendingPartialReschedules.length > 0 && currentRole === 'manager' && (
                <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  部分改期待审批 ({pendingPartialReschedules.length})
                </span>
              )}

              {canRescheduleOrder && (currentRole === 'planner' || currentRole === 'manager') ? (
                <>
                  <button
                    onClick={() => setShowPartialRescheduleModal(true)}
                    className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors flex items-center gap-2"
                  >
                    <SplitSquareVertical className="w-4 h-4" />
                    部分改期
                  </button>
                  <button
                    onClick={() => setShowRescheduleModal(true)}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    全部改期
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {isPast
                      ? '婚礼已过，不可改期'
                      : currentRole === 'customer'
                      ? '请联系策划师申请改期'
                      : '暂不可改期'}
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
              {order.schedule && order.schedule.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">日程概览</h2>
                    <button
                      onClick={() => setActiveTab('schedule')}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      查看详情
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {order.schedule
                      .filter((e) => !e.isRainBackup)
                      .slice(0, 4)
                      .map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                        >
                          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800">{event.name}</p>
                            <p className="text-xs text-gray-500">
                              {event.date} {event.startTime}
                            </p>
                          </div>
                        </div>
                      ))}
                    {order.schedule.filter((e) => !e.isRainBackup).length > 4 && (
                      <p className="text-xs text-gray-400 text-center py-2">
                        还有 {order.schedule.filter((e) => !e.isRainBackup).length - 4} 个活动
                      </p>
                    )}
                  </div>
                </div>
              )}

              {hasRainBackup && (
                <div
                  className={`rounded-xl shadow-sm border p-6 ${
                    order.activeRainBackup
                      ? 'bg-indigo-50 border-indigo-200'
                      : 'bg-white border-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-800">雨天备选方案</h2>
                    {order.activeRainBackup && (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-xs font-medium rounded-full">
                        已激活
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {order.activeRainBackup
                      ? '当前已启用雨天备选方案，点击切换到雨天日程'
                      : '当前未启用雨天备选方案，如遇下雨可一键切换'}
                  </p>
                  <button
                    onClick={() => handleToggleRainBackup(!order.activeRainBackup)}
                    className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors ${
                      order.activeRainBackup
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {order.activeRainBackup ? (
                      <span className="flex items-center justify-center gap-2">
                        <Sun className="w-4 h-4" />
                        切换为晴天方案
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <CloudRain className="w-4 h-4" />
                        激活雨天备选
                      </span>
                    )}
                  </button>
                </div>
              )}

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

        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <ScheduleTimeline
              schedule={order.schedule || []}
              showRainBackup={true}
              activeRainBackup={order.activeRainBackup}
              onToggleRainBackup={handleToggleRainBackup}
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">供应商条款明细</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">资源</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">定金比例</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">尾款天数</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">改期违约金</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">取消违约金</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">最小准备期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.resources.map((resource) => {
                      const terms = resource.resource.terms;
                      return (
                        <tr key={resource.resourceId} className="border-b border-gray-100">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  'w-2 h-2 rounded-full',
                                  ResourceTypeColors[resource.resource.type]
                                )}
                              />
                              <span className="font-medium text-gray-800">
                                {resource.resource.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            {(terms.depositRate * 100).toFixed(0)}%
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            {terms.balanceDueDays}天
                          </td>
                          <td className="py-3 px-4 text-right text-amber-600">
                            {(terms.reschedulePenaltyRate * 100).toFixed(0)}%
                          </td>
                          <td className="py-3 px-4 text-right text-red-600">
                            {(terms.cancelPenaltyRate * 100).toFixed(0)}%
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            {terms.minPreparationDays}天
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                备注：违约金比例会根据距离婚礼日期的天数动态调整，距离越近比例越高
              </p>
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
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <AuditTrail logs={order.auditLogs} title="操作审计" />
              <RescheduleHistory
                records={order.rescheduleRecords}
                showActions={currentRole === 'manager'}
                onApprove={(recordId, approved) => approveReschedule(orderId, recordId, approved)}
              />
            </div>

            {(order.partialReschedules && order.partialReschedules.length > 0) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">部分改期记录</h2>
                <div className="space-y-3">
                  {order.partialReschedules.map((pr) => (
                    <div
                      key={pr.id}
                      className="p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <SplitSquareVertical className="w-5 h-5 text-amber-500" />
                          <div>
                            <p className="font-medium text-gray-800">
                              {pr.resourceIds.length} 个资源部分改期
                            </p>
                            <p className="text-xs text-gray-500">
                              申请时间: {formatDateTime(pr.requestedAt)}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            'px-3 py-1 text-xs font-medium rounded-full',
                            pr.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : pr.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          )}
                        >
                          {pr.status === 'pending'
                            ? '待审批'
                            : pr.status === 'approved'
                            ? '已批准'
                            : '已拒绝'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p className="mb-1">涉及资源: {pr.resourceNames.join('、')}</p>
                        <p>
                          费用变化: 原价 {formatCurrency(pr.originalPrice)} → 新价{' '}
                          {formatCurrency(pr.newPrice)} → 差价{' '}
                          <span
                            className={
                              pr.priceDifference >= 0 ? 'text-green-600' : 'text-red-600'
                            }
                          >
                            {pr.priceDifference >= 0 ? '+' : ''}
                            {formatCurrency(pr.priceDifference)}
                          </span>
                        </p>
                      </div>
                      {pr.status === 'pending' && currentRole === 'manager' && (
                        <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                          <button
                            onClick={() => handleApprovePartialReschedule(pr.id, true)}
                            className="px-4 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600"
                          >
                            批准
                          </button>
                          <button
                            onClick={() => handleApprovePartialReschedule(pr.id, false)}
                            className="px-4 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                          >
                            拒绝
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(order.resourceWithdrawals && order.resourceWithdrawals.length > 0) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">资源撤回记录</h2>
                <div className="space-y-3">
                  {order.resourceWithdrawals.map((w) => (
                    <div
                      key={w.id}
                      className="p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <AlertOctagon className="w-5 h-5 text-red-500" />
                          <div>
                            <p className="font-medium text-gray-800">
                              {w.withdrawnResourceName} 被供应商撤回
                            </p>
                            <p className="text-xs text-gray-500">
                              撤回时间: {formatDateTime(w.withdrawnAt)}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            'px-3 py-1 text-xs font-medium rounded-full',
                            w.status === 'pending'
                              ? 'bg-red-100 text-red-700'
                              : w.status === 'resolved'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          )}
                        >
                          {w.status === 'pending'
                            ? '待处理'
                            : w.status === 'resolved'
                            ? '已解决'
                            : '客户拒绝'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        撤回原因: {w.reason}
                      </p>
                      {w.alternativeResourceId && w.customerConfirmed && (
                        <p className="text-sm text-gray-600">
                          替换为: {w.alternativeResourceName} (差价:{' '}
                          {w.priceDifference !== undefined && w.priceDifference >= 0
                            ? '+'
                            : ''}
                          {formatCurrency(w.priceDifference || 0)})
                        </p>
                      )}
                      {w.status === 'pending' && (
                        <button
                          onClick={() => handleOpenWithdrawal(w.id)}
                          className="mt-3 px-4 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                        >
                          处理
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <RescheduleModal
        orderId={orderId}
        isOpen={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
      />

      <PartialRescheduleModal
        orderId={orderId}
        isOpen={showPartialRescheduleModal}
        onClose={() => setShowPartialRescheduleModal(false)}
      />

      {selectedWithdrawal && (
        <ResourceWithdrawalModal
          orderId={orderId}
          withdrawalId={selectedWithdrawal.id}
          isOpen={showWithdrawalModal}
          onClose={() => {
            setShowWithdrawalModal(false);
            setSelectedWithdrawalId(null);
          }}
        />
      )}
    </div>
  );
}
