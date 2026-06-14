import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order, Resource, OrderResource, RescheduleRecord, AuditLog, PaymentPlan, ConflictInfo } from '@/types';
import { mockOrders, mockResources } from '@/data/mockData';
import { generateId, addHours, isBefore, formatDate, formatDateTime } from '@/utils/dateUtils';
import { checkAllResourceConflicts } from '@/utils/conflictUtils';
import { calculateTotalAmount, generatePaymentPlans, calculateRescheduleFee, recalculateResourceTimes, calculateResourcePrice } from '@/utils/feeUtils';

interface WeddingState {
  orders: Order[];
  resources: Resource[];
  selectedOrderId: string | null;
  currentUser: string;
  currentRole: 'planner' | 'manager' | 'customer';
  
  setSelectedOrder: (orderId: string | null) => void;
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  deleteOrder: (orderId: string) => void;
  
  addAuditLog: (orderId: string, action: string, details: string, oldValue?: string, newValue?: string) => void;
  
  payDeposit: (orderId: string) => void;
  payInstallment: (orderId: string, paymentId: string) => void;
  
  approveOrder: (orderId: string, manager: string) => void;
  
  canReschedule: (orderId: string) => boolean;
  checkRescheduleConflicts: (orderId: string, newDate: string) => ConflictInfo[];
  applyReschedule: (
    orderId: string,
    newDate: string,
    reason: string,
    weatherBackup: boolean
  ) => { success: boolean; message: string; fee?: number };
  
  approveReschedule: (orderId: string, recordId: string, approved: boolean) => void;
  
  confirmResource: (orderId: string, resourceId: string) => void;
  
  checkExpiredOrders: () => void;
  
  getOrdersByDate: (date: string) => Order[];
  getConflictsForResource: (resourceId: string) => ConflictInfo[];
  
  resetToMockData: () => void;
}

export const useWeddingStore = create<WeddingState>()(
  persist(
    (set, get) => ({
      orders: mockOrders,
      resources: mockResources,
      selectedOrderId: null,
      currentUser: '王策划',
      currentRole: 'planner',

      setSelectedOrder: (orderId) => set({ selectedOrderId: orderId }),

      addOrder: (order) =>
        set((state) => ({
          orders: [...state.orders, order],
        })),

      updateOrder: (orderId, updates) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? { ...o, ...updates, updatedAt: new Date().toISOString(), version: o.version + 1 }
              : o
          ),
        })),

      deleteOrder: (orderId) =>
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== orderId),
        })),

      addAuditLog: (orderId, action, details, oldValue, newValue) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return;

        const log: AuditLog = {
          id: generateId(),
          orderId,
          action,
          operator: state.currentUser,
          timestamp: new Date().toISOString(),
          details,
          oldValue,
          newValue,
        };

        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId ? { ...o, auditLogs: [...o.auditLogs, log] } : o
          ),
        }));
      },

      payDeposit: (orderId) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return;

        const deposit = order.paymentPlans.find((p) => p.type === 'deposit');
        if (!deposit) return;

        const updatedPlans = order.paymentPlans.map((p) =>
          p.id === deposit.id
            ? { ...p, status: 'paid' as const, paidDate: formatDate(new Date()) }
            : p
        );

        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: 'deposit_paid',
                  paidAmount: deposit.amount,
                  paymentPlans: updatedPlans,
                  depositExpiresAt: undefined,
                }
              : o
          ),
        }));

        get().addAuditLog(
          orderId,
          '支付定金',
          `客户支付定金 ¥${deposit.amount.toLocaleString()}`,
          '待付定金',
          '定金已付'
        );
      },

      payInstallment: (orderId, paymentId) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return;

        const payment = order.paymentPlans.find((p) => p.id === paymentId);
        if (!payment || payment.status === 'paid') return;

        const updatedPlans = order.paymentPlans.map((p) =>
          p.id === paymentId
            ? { ...p, status: 'paid' as const, paidDate: formatDate(new Date()) }
            : p
        );

        const newPaidAmount = order.paidAmount + payment.amount;

        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? { ...o, paidAmount: newPaidAmount, paymentPlans: updatedPlans }
              : o
          ),
        }));

        get().addAuditLog(
          orderId,
          '支付款项',
          `支付${payment.name} ¥${payment.amount.toLocaleString()}`,
          '未支付',
          '已支付'
        );
      },

      approveOrder: (orderId, manager) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order || order.status !== 'deposit_paid') return;

        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId ? { ...o, status: 'approved', manager } : o
          ),
        }));

        get().addAuditLog(
          orderId,
          '店长审批',
          `店长${manager}审批通过订单`,
          '定金已付',
          '店长审批通过'
        );
      },

      canReschedule: (orderId) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return false;

        const weddingDate = new Date(order.weddingDate);
        weddingDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (weddingDate < today) return false;
        if (order.status === 'cancelled' || order.status === 'expired' || order.status === 'completed') return false;

        return true;
      },

      checkRescheduleConflicts: (orderId, newDate) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return [];

        const newResources = order.resources.map((r) => {
          const times = recalculateResourceTimes(
            newDate,
            10,
            r.resource.preparationHours,
            r.resource.serviceHours,
            r.resource.cleanupHours
          );
          const newPrice = calculateResourcePrice(r.resource.basePrice, r.resource.serviceHours, newDate);
          return {
            ...r,
            ...times,
            price: newPrice,
          };
        });

        const conflictMap = checkAllResourceConflicts(newResources, state.orders, orderId);
        const allConflicts: ConflictInfo[] = [];
        conflictMap.forEach((conflicts) => {
          allConflicts.push(...conflicts);
        });

        return allConflicts;
      },

      applyReschedule: (orderId, newDate, reason, weatherBackup) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return { success: false, message: '订单不存在' };

        if (!state.canReschedule(orderId)) {
          return { success: false, message: '婚礼日期已过，不能改期' };
        }

        const conflicts = state.checkRescheduleConflicts(orderId, newDate);
        if (conflicts.length > 0) {
          const conflictNames = conflicts.map((c) => c.resourceName).join('、');
          return { success: false, message: `资源冲突：${conflictNames}` };
        }

        const rescheduleFee = calculateRescheduleFee(order.totalAmount);

        const newResources = order.resources.map((r) => {
          const times = recalculateResourceTimes(
            newDate,
            10,
            r.resource.preparationHours,
            r.resource.serviceHours,
            r.resource.cleanupHours
          );
          const newPrice = calculateResourcePrice(r.resource.basePrice, r.resource.serviceHours, newDate);
          return {
            ...r,
            ...times,
            price: newPrice,
          };
        });

        const newTotal = calculateTotalAmount(newResources);
        const priceDifference = newTotal - order.totalAmount;

        const newPaymentPlans = generatePaymentPlans(newTotal + rescheduleFee, newDate, true);
        
        const rescheduleRecord: RescheduleRecord = {
          id: generateId(),
          orderId,
          oldDate: order.weddingDate,
          newDate,
          reason,
          rescheduleFee,
          priceDifference,
          weatherBackup,
          approvedBy: '',
          approvedAt: '',
          status: 'pending',
          conflicts: [],
        };

        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  weddingDate: newDate,
                  resources: newResources,
                  totalAmount: newTotal + rescheduleFee,
                  paymentPlans: newPaymentPlans,
                  status: 'rescheduled',
                  rescheduleRecords: [...o.rescheduleRecords, rescheduleRecord],
                }
              : o
          ),
        }));

        get().addAuditLog(
          orderId,
          '申请改期',
          `申请从${order.weddingDate}改期至${newDate}，改期费¥${rescheduleFee.toLocaleString()}`,
          order.weddingDate,
          newDate
        );

        return {
          success: true,
          message: '改期申请已提交，等待店长审批',
          fee: rescheduleFee,
        };
      },

      approveReschedule: (orderId, recordId, approved) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return;

        const record = order.rescheduleRecords.find((r) => r.id === recordId);
        if (!record || record.status !== 'pending') return;

        if (approved) {
          set((s) => ({
            orders: s.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    rescheduleRecords: o.rescheduleRecords.map((r) =>
                      r.id === recordId
                        ? {
                            ...r,
                            status: 'approved',
                            approvedBy: s.currentUser,
                            approvedAt: new Date().toISOString(),
                          }
                        : r
                    ),
                  }
                : o
            ),
          }));

          get().addAuditLog(
            orderId,
            '改期审批通过',
            `店长审批通过改期申请`,
            '待审批',
            '已通过'
          );
        } else {
          set((s) => ({
            orders: s.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    rescheduleRecords: o.rescheduleRecords.map((r) =>
                      r.id === recordId ? { ...r, status: 'rejected' } : r
                    ),
                  }
                : o
            ),
          }));

          get().addAuditLog(
            orderId,
            '改期审批拒绝',
            `店长拒绝改期申请`,
            '待审批',
            '已拒绝'
          );
        }
      },

      confirmResource: (orderId, resourceId) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return;

        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  resources: o.resources.map((r) =>
                    r.resourceId === resourceId
                      ? { ...r, status: 'confirmed' as const }
                      : r
                  ),
                }
              : o
          ),
        }));

        const resource = order.resources.find((r) => r.resourceId === resourceId);
        if (resource) {
          get().addAuditLog(
            orderId,
            '供应商确认',
            `${resource.resource.name}供应商已确认`,
            '待确认',
            '已确认'
          );
        }
      },

      checkExpiredOrders: () => {
        const state = get();
        const now = new Date();
        const expiredCount = 0;

        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.status === 'pending_deposit' && o.depositExpiresAt) {
              const expireTime = new Date(o.depositExpiresAt);
              if (now > expireTime) {
                return { ...o, status: 'expired' as const };
              }
            }
            return o;
          }),
        }));
      },

      getOrdersByDate: (date) => {
        const state = get();
        return state.orders.filter(
          (o) => o.weddingDate === date && o.status !== 'cancelled' && o.status !== 'expired'
        );
      },

      getConflictsForResource: (resourceId) => {
        const state = get();
        const allConflicts: ConflictInfo[] = [];

        for (const order of state.orders) {
          if (order.status === 'cancelled' || order.status === 'expired') continue;
          
          const resource = order.resources.find((r) => r.resourceId === resourceId);
          if (resource) {
            const conflicts = checkAllResourceConflicts([resource], state.orders, order.id);
            const resourceConflicts = conflicts.get(resourceId);
            if (resourceConflicts) {
              allConflicts.push(...resourceConflicts);
            }
          }
        }

        return allConflicts;
      },

      resetToMockData: () => {
        set({
          orders: mockOrders,
          resources: mockResources,
          selectedOrderId: null,
        });
      },
    }),
    {
      name: 'wedding-storage',
      partialize: (state) => ({
        orders: state.orders,
        resources: state.resources,
      }),
    }
  )
);
