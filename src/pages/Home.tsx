import { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  BarChart3,
  ListTodo,
  Users,
  Settings,
  Bell,
  Search,
  Sparkles,
  AlertTriangle,
  Clock,
  RefreshCw,
  XCircle,
  TrendingUp,
  ChevronRight,
  RotateCcw,
  ChevronDown,
  UserCog,
  Crown,
  User,
  SplitSquareVertical,
  CloudRain,
  AlertOctagon,
  Sun,
} from 'lucide-react';
import { useWeddingStore } from '@/store/weddingStore';
import WeddingCalendar from '@/components/WeddingCalendar';
import ResourceGantt from '@/components/ResourceGantt';
import OrderList from '@/components/OrderList';
import OrderDetail from '@/components/OrderDetail';
import { OrderStatusLabels, OrderStatusColors } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/feeUtils';

type TabType = 'dashboard' | 'calendar' | 'gantt' | 'orders' | 'demo';

export default function Home() {
  const { orders, checkExpiredOrders, resetToMockData, currentUser, currentRole, setCurrentRole } = useWeddingStore();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const roleSwitcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleSwitcherRef.current && !roleSwitcherRef.current.contains(event.target as Node)) {
        setShowRoleSwitcher(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleOptions = [
    { role: 'planner' as const, label: '策划师', name: '王策划', icon: UserCog, color: 'text-blue-600 bg-blue-100' },
    { role: 'manager' as const, label: '店长', name: '张店长', icon: Crown, color: 'text-purple-600 bg-purple-100' },
    { role: 'customer' as const, label: '客户', name: '李小姐', icon: User, color: 'text-green-600 bg-green-100' },
  ];

  const currentRoleOption = roleOptions.find((r) => r.role === currentRole) || roleOptions[0];

  useEffect(() => {
    checkExpiredOrders();
    const interval = setInterval(() => {
      checkExpiredOrders();
    }, 60000);
    return () => clearInterval(interval);
  }, [checkExpiredOrders]);

  const pendingDepositCount = orders.filter(
    (o) => o.status === 'pending_deposit'
  ).length;

  const activeWithdrawalsCount = orders.filter(
    (o) => (o.resourceWithdrawals || []).some(w => w.status === 'pending')
  ).length;

  const pendingPartialReschedulesCount = orders.filter(
    (o) => (o.partialReschedules || []).some(pr => pr.status === 'pending')
  ).length;

  const navItems = [
    { id: 'dashboard', label: '工作台', icon: Sparkles },
    { id: 'calendar', label: '婚礼日历', icon: Calendar },
    { id: 'gantt', label: '资源甘特', icon: BarChart3 },
    { id: 'orders', label: '订单管理', icon: ListTodo },
    { id: 'demo', label: '交付样例', icon: Users },
  ];

  if (selectedOrderId) {
    return (
      <OrderDetail
        orderId={selectedOrderId}
        onBack={() => setSelectedOrderId(null)}
      />
    );
  }

  const pendingDepositOrders = orders.filter(
    (o) => o.status === 'pending_deposit' && o.depositExpiresAt
  ).sort((a, b) => 
    new Date(a.depositExpiresAt!).getTime() - new Date(b.depositExpiresAt!).getTime()
  );

  const rescheduledOrders = orders.filter((o) => o.status === 'rescheduled');

  const expiredOrders = orders.filter((o) => o.status === 'expired');

  const DemoSection = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-8 h-8" />
          <h1 className="text-2xl font-bold">交付样例展示</h1>
        </div>
        <p className="text-white/80">
          以下四个典型场景展示了系统的核心业务规则和交互逻辑
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-yellow-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">定金过期释放</h3>
                <p className="text-sm text-gray-500">24小时未付定金自动释放档期</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {pendingDepositOrders.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">暂无待付定金订单</p>
              ) : (
                pendingDepositOrders.slice(0, 3).map((order) => {
                  const remaining = new Date(order.depositExpiresAt!).getTime() - new Date().getTime();
                  const hours = Math.floor(remaining / (1000 * 60 * 60));
                  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                  
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 cursor-pointer hover:bg-yellow-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{order.customerName}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{order.orderNo}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-yellow-600">
                            {hours > 0 ? `${hours}小时${minutes}分` : `${minutes}分钟`}
                          </p>
                          <p className="text-xs text-yellow-500">后过期</p>
                        </div>
                      </div>
                      <div className="mt-3 h-1.5 bg-yellow-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500 transition-all"
                          style={{
                            width: `${Math.max(10, 100 - (hours * 60 + minutes) / (24 * 60) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                <span className="font-medium text-gray-700">业务规则：</span>
                定金未付的订单只保留24小时，超时后自动取消并释放所有资源档期
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-red-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">摄影师冲突</h3>
                <p className="text-sm text-gray-500">同一时段不能重复排班</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {orders.filter(o => o.resources.some(r => r.conflict)).length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-500">当前无资源冲突</p>
                  <p className="text-xs text-gray-400 mt-1">所有摄影师排班正常</p>
                </div>
              ) : (
                orders
                  .filter((o) => o.resources.some((r) => r.conflict))
                  .slice(0, 3)
                  .map((order) => {
                    const conflictResources = order.resources.filter((r) => r.conflict);
                    return (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrderId(order.id)}
                        className="p-4 bg-red-50 rounded-xl border border-red-100 cursor-pointer hover:bg-red-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-800">{order.customerName}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {conflictResources.length} 个资源冲突
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {conflictResources.map((r) => (
                            <span
                              key={r.resourceId}
                              className="px-2 py-0.5 bg-red-200 text-red-700 text-xs rounded-full"
                            >
                              {r.resource.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                <span className="font-medium text-gray-700">业务规则：</span>
                同一摄影师同一时段不能被重复安排，包括准备期和清场期在内
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-amber-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <SplitSquareVertical className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">部分改期差价重算</h3>
                <p className="text-sm text-gray-500">只改部分资源，差异化计算费用</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {orders.filter(o => (o.partialReschedules || []).length > 0).length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">暂无部分改期订单</p>
              ) : (
                orders
                  .filter(o => (o.partialReschedules || []).length > 0)
                  .slice(0, 3)
                  .map((order) => {
                    const lastPR = order.partialReschedules![order.partialReschedules!.length - 1];
                    return (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrderId(order.id)}
                        className="p-4 bg-amber-50 rounded-xl border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-800">{order.customerName}</p>
                          <span
                            className={cn(
                              'text-xs font-medium px-2 py-0.5 rounded-full',
                              lastPR.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : lastPR.status === 'approved'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            )}
                          >
                            {lastPR.status === 'pending'
                              ? '待审批'
                              : lastPR.status === 'approved'
                              ? '已批准'
                              : '已拒绝'}
                          </span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <p className="text-gray-500">
                            改期资源: {lastPR.resourceNames.slice(0, 2).join('、')}
                            {lastPR.resourceNames.length > 2 && `等${lastPR.resourceNames.length}项`}
                          </p>
                          <div className="flex items-center gap-3">
                            <span className={lastPR.priceDifference >= 0 ? 'text-red-500' : 'text-green-500'}>
                              差价 {lastPR.priceDifference >= 0 ? '+' : ''}
                              {formatCurrency(lastPR.priceDifference)}
                            </span>
                            <span className="text-orange-600">
                              改期费 {formatCurrency(lastPR.rescheduleFee)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                <span className="font-medium text-gray-700">业务规则：</span>
                支持只改部分资源（如只改场地不改摄像），根据各供应商条款差异化计算违约金和差价
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-indigo-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <CloudRain className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">雨天备选切换</h3>
                <p className="text-sm text-gray-500">一键切换雨天/晴天方案</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {orders.filter(o => (o.schedule || []).some(e => e.isRainBackup)).length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">暂无雨天备选订单</p>
              ) : (
                orders
                  .filter(o => (o.schedule || []).some(e => e.isRainBackup))
                  .slice(0, 3)
                  .map((order) => {
                    const rainEvents = (order.schedule || []).filter(e => e.isRainBackup);
                    const normalEvents = (order.schedule || []).filter(e => !e.isRainBackup);
                    return (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrderId(order.id)}
                        className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 cursor-pointer hover:bg-indigo-100 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-800">{order.customerName}</p>
                          {order.activeRainBackup ? (
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full flex items-center gap-1">
                              <CloudRain className="w-3 h-3" />
                              雨天方案中
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full flex items-center gap-1">
                              <Sun className="w-3 h-3" />
                              晴天方案中
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 space-y-0.5">
                          <p>日程总数: {normalEvents.length} 个活动 + {rainEvents.length} 个雨天备选</p>
                          <p>婚礼日期: {order.weddingDate}</p>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                <span className="font-medium text-gray-700">业务规则：</span>
                雨天备选活动独立于正常日程，可一键切换，涉及场地变更时自动计算差价
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">快速体验</h3>
          <button
            onClick={resetToMockData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            重置演示数据
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <button
            onClick={() => {
              const order = orders.find((o) => o.status === 'pending_deposit');
              if (order) setSelectedOrderId(order.id);
            }}
            className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-xl transition-colors text-left"
          >
            <p className="font-medium text-gray-800">定金过期释放</p>
            <p className="text-sm text-gray-500 mt-1">查看2小时倒计时释放</p>
          </button>
          <button
            onClick={() => {
              const order = orders.find((o) => o.resources.some(r => r.conflict));
              if (order) setSelectedOrderId(order.id);
            }}
            className="p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-colors text-left"
          >
            <p className="font-medium text-gray-800">摄影师冲突</p>
            <p className="text-sm text-gray-500 mt-1">查看资源冲突提示</p>
          </button>
          <button
            onClick={() => {
              const order = orders.find((o) => (o.partialReschedules || []).length > 0);
              if (order) setSelectedOrderId(order.id);
            }}
            className="p-4 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors text-left"
          >
            <p className="font-medium text-gray-800">部分改期差价重算</p>
            <p className="text-sm text-gray-500 mt-1">只改仪式不改午宴</p>
          </button>
          <button
            onClick={() => {
              const order = orders.find((o) => (o.schedule || []).some(e => e.isRainBackup));
              if (order) setSelectedOrderId(order.id);
            }}
            className="p-4 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors text-left"
          >
            <p className="font-medium text-gray-800">雨天备选切换</p>
            <p className="text-sm text-gray-500 mt-1">一键切换雨天方案</p>
          </button>
        </div>
      </div>

      {activeWithdrawalsCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertOctagon className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-bold text-red-800">资源撤回待处理</h3>
              <p className="text-sm text-red-600">有 {activeWithdrawalsCount} 个资源被供应商临时撤回，需要立即处理</p>
            </div>
          </div>
          <button
            onClick={() => {
              const order = orders.find((o) => (o.resourceWithdrawals || []).some(w => w.status === 'pending'));
              if (order) setSelectedOrderId(order.id);
            }}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
          >
            立即处理
          </button>
        </div>
      )}
    </div>
  );

  const Dashboard = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">你好，{currentUser} 👋</h1>
            <p className="text-white/80 mt-1">
              {currentRole === 'planner' ? '策划师' : currentRole === 'manager' ? '店长' : '客户'}
              工作台
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-xl">
              <p className="text-xs text-white/80">今日婚礼</p>
              <p className="text-xl font-bold">
                {orders.filter((o) => {
                  const today = new Date();
                  return o.weddingDate === today.toISOString().split('T')[0] && 
                         o.status !== 'cancelled' && o.status !== 'expired';
                }).length}
                <span className="text-sm font-normal ml-1">场</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <WeddingCalendar
            onSelectOrder={setSelectedOrderId}
          />
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">待处理事项</h3>
              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                {pendingDepositCount + expiredOrders.length + activeWithdrawalsCount + pendingPartialReschedulesCount}
              </span>
            </div>
            <div className="space-y-3">
              {activeWithdrawalsCount > 0 && (
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                  <AlertOctagon className="w-5 h-5 text-red-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">资源撤回待处理</p>
                    <p className="text-xs text-gray-500">供应商临时撤回资源</p>
                  </div>
                  <span className="text-red-600 font-bold text-sm">
                    {activeWithdrawalsCount}
                  </span>
                </div>
              )}
              {pendingPartialReschedulesCount > 0 && (
                <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                  <SplitSquareVertical className="w-5 h-5 text-amber-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">部分改期待审批</p>
                    <p className="text-xs text-gray-500">等待店长审批</p>
                  </div>
                  <span className="text-amber-600 font-bold text-sm">
                    {pendingPartialReschedulesCount}
                  </span>
                </div>
              )}
              {pendingDepositCount > 0 && (
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">待付定金订单</p>
                    <p className="text-xs text-gray-500">{pendingDepositCount} 单等待支付</p>
                  </div>
                  <span className="text-yellow-600 font-bold text-sm">
                    {pendingDepositCount}
                  </span>
                </div>
              )}
              {expiredOrders.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">已过期订单</p>
                    <p className="text-xs text-gray-500">定金超时未支付</p>
                  </div>
                  <span className="text-red-600 font-bold text-sm">
                    {expiredOrders.length}
                  </span>
                </div>
              )}
              {rescheduledOrders.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                  <RefreshCw className="w-5 h-5 text-purple-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">改期待审批</p>
                    <p className="text-xs text-gray-500">等待店长审批</p>
                  </div>
                  <span className="text-purple-600 font-bold text-sm">
                    {rescheduledOrders.filter((o) =>
                      o.rescheduleRecords.some((r) => r.status === 'pending')
                    ).length}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">近期订单</h3>
            <div className="space-y-3">
              {orders
                .filter((o) => o.status !== 'cancelled' && o.status !== 'expired')
                .slice(0, 4)
                .map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {order.customerName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {order.customerName}
                      </p>
                      <p className="text-xs text-gray-500">{order.weddingDate}</p>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-0.5 text-xs rounded-full',
                        OrderStatusColors[order.status]
                      )}
                    >
                      {OrderStatusLabels[order.status]}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800">婚礼档期</h1>
              <p className="text-xs text-gray-500">Wedding Scheduler</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                    activeTab === item.id
                      ? 'bg-rose-50 text-rose-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                  {item.id === 'calendar' && pendingDepositCount > 0 && (
                    <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {pendingDepositCount}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div ref={roleSwitcherRef} className="relative">
            <button
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className={cn('w-10 h-10 rounded-full flex items-center justify-center font-bold', currentRoleOption.color)}>
                {currentRoleOption.icon && <currentRoleOption.icon className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-gray-800 truncate">{currentUser}</p>
                <p className="text-xs text-gray-500">{currentRoleOption.label}</p>
              </div>
              <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', showRoleSwitcher && 'rotate-180')} />
            </button>

            {showRoleSwitcher && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                <div className="p-2">
                  <p className="text-xs text-gray-400 px-3 py-2 font-medium">切换身份</p>
                  {roleOptions.map((option) => (
                    <button
                      key={option.role}
                      onClick={() => {
                        setCurrentRole(option.role, option.name);
                        setShowRoleSwitcher(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                        currentRole === option.role
                          ? 'bg-purple-50 text-purple-700'
                          : 'hover:bg-gray-50 text-gray-700'
                      )}
                    >
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', option.color)}>
                        <option.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{option.name}</p>
                        <p className="text-xs text-gray-500">{option.label}</p>
                      </div>
                      {currentRole === option.role && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'calendar' && (
            <WeddingCalendar onSelectOrder={setSelectedOrderId} />
          )}
          {activeTab === 'gantt' && (
            <ResourceGantt onSelectOrder={setSelectedOrderId} />
          )}
          {activeTab === 'orders' && (
            <OrderList onSelectOrder={setSelectedOrderId} />
          )}
          {activeTab === 'demo' && <DemoSection />}
        </div>
      </main>
    </div>
  );
}
