import { useMemo, useState, useEffect } from 'react';
import {
  CalendarDays,
  Users,
  TrendingUp,
  Clock,
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { useWeddingStore } from '@/store/weddingStore';
import { OrderStatusLabels, OrderStatusColors, ResourceTypeColors } from '@/types';
import { cn } from '@/lib/utils';
import { formatDate, formatDateTime, isDatePast } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/feeUtils';
import type { Order, OrderStatus } from '@/types';

interface OrderListProps {
  onSelectOrder: (orderId: string) => void;
}

export default function OrderList({ onSelectOrder }: OrderListProps) {
  const { orders, checkExpiredOrders } = useWeddingStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  useEffect(() => {
    checkExpiredOrders();
    const interval = setInterval(() => {
      checkExpiredOrders();
    }, 60000);
    return () => clearInterval(interval);
  }, [checkExpiredOrders]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        if (statusFilter !== 'all' && o.status !== statusFilter) return false;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          return (
            o.customerName.toLowerCase().includes(term) ||
            o.orderNo.toLowerCase().includes(term) ||
            o.theme.toLowerCase().includes(term)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(a.weddingDate).getTime() - new Date(b.weddingDate).getTime());
  }, [orders, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = orders.length;
    const pendingDeposit = orders.filter((o) => o.status === 'pending_deposit').length;
    const confirmed = orders.filter(
      (o) => o.status === 'deposit_paid' || o.status === 'approved' || o.status === 'rescheduled'
    ).length;
    const expired = orders.filter((o) => o.status === 'expired').length;
    const totalRevenue = orders
      .filter((o) => o.status !== 'cancelled' && o.status !== 'expired')
      .reduce((sum, o) => sum + o.paidAmount, 0);

    return { total, pendingDeposit, confirmed, expired, totalRevenue };
  }, [orders]);

  const statusOptions: (OrderStatus | 'all')[] = [
    'all',
    'pending_deposit',
    'deposit_paid',
    'approved',
    'rescheduled',
    'completed',
    'cancelled',
    'expired',
  ];

  const getTimeRemaining = (order: Order) => {
    if (!order.depositExpiresAt || order.status !== 'pending_deposit') return null;
    const now = new Date().getTime();
    const expire = new Date(order.depositExpiresAt).getTime();
    const remaining = expire - now;
    if (remaining <= 0) return '已过期';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}小时${minutes}分后过期`;
    }
    return `${minutes}分钟后过期`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总订单数</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待付定金</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pendingDeposit}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
          {stats.pendingDeposit > 0 && (
            <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              请注意24小时过期
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已确认订单</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.confirmed}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已收款项</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-rose-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">订单列表</h2>
                <p className="text-sm text-gray-500">共 {filteredOrders.length} 条订单</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索订单..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none w-64"
                />
              </div>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                <Filter className="w-4 h-4 text-gray-400 ml-2" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                  className="bg-transparent px-2 py-1.5 text-sm text-gray-600 outline-none cursor-pointer"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status === 'all' ? '全部状态' : OrderStatusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无订单</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const timeRemaining = getTimeRemaining(order);
              const isPast = isDatePast(order.weddingDate);
              const hasConflict = order.resources.some((r) => r.conflict);

              return (
                <div
                  key={order.id}
                  onClick={() => onSelectOrder(order.id)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={cn(
                          'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0',
                          isPast ? 'bg-gray-100' : 'bg-gradient-to-br from-rose-400 to-pink-500'
                        )}
                      >
                        <span
                          className={cn(
                            'text-lg font-bold',
                            isPast ? 'text-gray-400' : 'text-white'
                          )}
                        >
                          {order.customerName.charAt(0)}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800 truncate">
                            {order.customerName}
                          </h3>
                          <span
                            className={cn(
                              'px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0',
                              OrderStatusColors[order.status]
                            )}
                          >
                            {OrderStatusLabels[order.status]}
                          </span>
                          {hasConflict && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                              <AlertTriangle className="w-3 h-3" />
                              冲突
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {formatDate(order.weddingDate)}
                          </span>
                          <span>{order.theme}</span>
                          <span className="text-gray-400">{order.orderNo}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2">
                          {order.resources.slice(0, 6).map((r) => (
                            <div
                              key={r.resourceId}
                              className={cn(
                                'w-2 h-2 rounded-full',
                                ResourceTypeColors[r.resource.type]
                              )}
                              title={r.resource.name}
                            />
                          ))}
                          {order.resources.length > 6 && (
                            <span className="text-xs text-gray-400">
                              +{order.resources.length - 6}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-800">
                          {formatCurrency(order.totalAmount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          已付 {formatCurrency(order.paidAmount)}
                        </p>
                      </div>

                      {timeRemaining && (
                        <div className="text-right">
                          <p
                            className={cn(
                              'text-xs font-medium',
                              timeRemaining.includes('已过期')
                                ? 'text-red-600'
                                : 'text-yellow-600'
                            )}
                          >
                            {timeRemaining}
                          </p>
                        </div>
                      )}

                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
