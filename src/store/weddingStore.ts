import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order, Resource, OrderResource, RescheduleRecord, AuditLog, PaymentPlan, ConflictInfo, ResourceWithdrawal, AlternativeResource, PartialReschedule, ScheduleEvent } from '@/types';
import { mockOrders, mockResources } from '@/data/mockData';
import { generateId, addHours, isBefore, formatDate, formatDateTime, addDays, diffInDays } from '@/utils/dateUtils';
import { checkAllResourceConflicts, checkPartialRescheduleConflicts } from '@/utils/conflictUtils';
import { calculateTotalAmount, generatePaymentPlans, calculateRescheduleFee, recalculateResourceTimes, calculateResourcePrice, calculatePartialRescheduleFee, calculateSupplierReschedulePenalty } from '@/utils/feeUtils';

interface WeddingState {
  orders: Order[];
  resources: Resource[];
  selectedOrderId: string | null;
  currentUser: string;
  currentRole: 'planner' | 'manager' | 'customer';
  
  setCurrentRole: (role: 'planner' | 'manager' | 'customer', userName?: string) => void;
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

  checkPartialRescheduleConflicts: (
    orderId: string,
    resourceIds: string[],
    newDate: string,
    newStartTime?: string
  ) => ConflictInfo[];

  applyPartialReschedule: (
    orderId: string,
    resourceIds: string[],
    newDate: string,
    reason: string,
    eventId?: string,
    newStartTime?: string
  ) => { success: boolean; message: string; partialReschedule?: PartialReschedule };

  approvePartialReschedule: (
    orderId: string,
    partialRescheduleId: string,
    approved: boolean
  ) => void;

  selectAlternativeResource: (
    orderId: string,
    withdrawalId: string,
    alternativeId: string
  ) => void;

  confirmAlternativeWithCustomer: (
    orderId: string,
    withdrawalId: string,
    customerConfirmed: boolean
  ) => void;

  resolveWithdrawal: (
    orderId: string,
    withdrawalId: string
  ) => void;

  toggleRainBackup: (
    orderId: string,
    enable: boolean
  ) => void;

  getScheduleForOrder: (orderId: string) => ScheduleEvent[];

  getActiveWithdrawals: (orderId: string) => ResourceWithdrawal[];

  getPendingPartialReschedules: (orderId: string) => PartialReschedule[];

  findAlternativeResources: (
    resourceId: string,
    date: string
  ) => AlternativeResource[];
}

export const useWeddingStore = create<WeddingState>()(
  persist(
    (set, get) => ({
      orders: mockOrders,
      resources: mockResources,
      selectedOrderId: null,
      currentUser: '王策划',
      currentRole: 'planner',

      setCurrentRole: (role, userName) => {
        const userNames: Record<string, string> = {
          planner: '王策划',
          manager: '张店长',
          customer: '李小姐',
        };
        set({
          currentRole: role,
          currentUser: userName || userNames[role],
        });
      },

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

        if (state.currentRole !== 'planner' && state.currentRole !== 'manager') {
          return { success: false, message: '只有策划师可以提交改期申请' };
        }

        if (!state.canReschedule(orderId)) {
          return { success: false, message: '婚礼日期已过，不能改期' };
        }

        const conflicts = state.checkRescheduleConflicts(orderId, newDate);
        if (conflicts.length > 0) {
          const conflictNames = conflicts.map((c) => c.resourceName).join('、');
          return { success: false, message: `资源冲突：${conflictNames}` };
        }

        const rescheduleFee = calculateRescheduleFee(order.totalAmount);

        const pendingResources = order.resources.map((r) => {
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

        const newTotal = calculateTotalAmount(pendingResources);
        const priceDifference = newTotal - order.totalAmount;

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
          conflicts: conflicts.map((c) => c.resourceName),
        };

        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: 'rescheduled',
                  rescheduleRecords: [...o.rescheduleRecords, rescheduleRecord],
                }
              : o
          ),
        }));

        get().addAuditLog(
          orderId,
          '申请改期',
          `策划师${state.currentUser}申请从${order.weddingDate}改期至${newDate}，改期费¥${rescheduleFee.toLocaleString()}`,
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

        if (state.currentRole !== 'manager') {
          return;
        }

        const record = order.rescheduleRecords.find((r) => r.id === recordId);
        if (!record || record.status !== 'pending') return;

        const now = new Date().toISOString();

        if (approved) {
          const newResources = order.resources.map((r) => {
            const times = recalculateResourceTimes(
              record.newDate,
              10,
              r.resource.preparationHours,
              r.resource.serviceHours,
              r.resource.cleanupHours
            );
            const newPrice = calculateResourcePrice(r.resource.basePrice, r.resource.serviceHours, record.newDate);
            return {
              ...r,
              ...times,
              price: newPrice,
            };
          });

          const newTotal = calculateTotalAmount(newResources);
          const newPaymentPlans = generatePaymentPlans(newTotal + record.rescheduleFee, record.newDate, true);

          set((s) => ({
            orders: s.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    weddingDate: record.newDate,
                    resources: newResources,
                    totalAmount: newTotal + record.rescheduleFee,
                    paymentPlans: newPaymentPlans,
                    status: 'approved',
                    version: o.version + 1,
                    manager: s.currentUser,
                    rescheduleRecords: o.rescheduleRecords.map((r) =>
                      r.id === recordId
                        ? {
                            ...r,
                            status: 'approved',
                            approvedBy: s.currentUser,
                            approvedAt: now,
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
            `店长${state.currentUser}审批通过改期申请，从${record.oldDate}改期至${record.newDate}，改期费¥${record.rescheduleFee.toLocaleString()}`,
            '待审批',
            '已通过'
          );
        } else {
          set((s) => ({
            orders: s.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    status: 'approved',
                    rescheduleRecords: o.rescheduleRecords.map((r) =>
                      r.id === recordId
                        ? {
                            ...r,
                            status: 'rejected',
                            approvedBy: s.currentUser,
                            approvedAt: now,
                          }
                        : r
                    ),
                  }
                : o
            ),
          }));

          get().addAuditLog(
            orderId,
            '改期审批拒绝',
            `店长${state.currentUser}拒绝改期申请，原日期${record.oldDate}保持不变`,
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

      checkPartialRescheduleConflicts: (orderId, resourceIds, newDate, newStartTime) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return [];

        const resourcesToReschedule = order.resources.filter((r) => resourceIds.includes(r.resourceId));
        if (resourcesToReschedule.length === 0) return [];

        const newResources = resourcesToReschedule.map((r) => {
          const times = recalculateResourceTimes(
            newDate,
            newStartTime ? parseInt(newStartTime.split(':')[0]) : 10,
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

        return checkPartialRescheduleConflicts(newResources, state.orders, orderId, resourceIds);
      },

      applyPartialReschedule: (orderId, resourceIds, newDate, reason, eventId, newStartTime) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return { success: false, message: '订单不存在' };

        if (state.currentRole !== 'planner' && state.currentRole !== 'manager') {
          return { success: false, message: '只有策划师可以提交改期申请' };
        }

        if (!state.canReschedule(orderId)) {
          return { success: false, message: '婚礼日期已过，不能改期' };
        }

        const conflicts = state.checkPartialRescheduleConflicts(orderId, resourceIds, newDate, newStartTime);
        if (conflicts.length > 0) {
          const conflictNames = conflicts.map((c) => c.resourceName).join('、');
          return { success: false, message: `资源冲突：${conflictNames}` };
        }

        const resourcesToReschedule = order.resources.filter((r) => resourceIds.includes(r.resourceId));
        const feeCalc = calculatePartialRescheduleFee(order, resourceIds, newDate, newStartTime);

        const partialReschedule: PartialReschedule = {
          id: generateId(),
          orderId,
          eventId: eventId,
          resourceIds,
          oldDate: order.weddingDate,
          newDate,
          oldStartTime: resourcesToReschedule[0]?.startTime || '10:00',
          newStartTime: newStartTime || resourcesToReschedule[0]?.startTime || '10:00',
          reason,
          conflicts: conflicts.map((c) => c.resourceName),
          feeCalculation: feeCalc,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };

        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  partialReschedules: [...o.partialReschedules, partialReschedule],
                }
              : o
          ),
        }));

        get().addAuditLog(
          orderId,
          '部分改期申请',
          `策划师${state.currentUser}申请部分改期：${resourceIds.map((id) => {
            const r = order.resources.find((rr) => rr.resourceId === id);
            return r?.resource.name;
          }).filter(Boolean).join('、')}，从${order.weddingDate}改期至${newDate}，改期费¥${feeCalc.rescheduleFee.toLocaleString()}`,
          order.weddingDate,
          newDate
        );

        return {
          success: true,
          message: '部分改期申请已提交，等待店长审批',
          partialReschedule,
        };
      },

      approvePartialReschedule: (orderId, partialRescheduleId, approved) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return;

        if (state.currentRole !== 'manager') return;

        const pr = order.partialReschedules.find((p) => p.id === partialRescheduleId);
        if (!pr || pr.status !== 'pending') return;

        const now = new Date().toISOString();

        if (approved) {
          const newResources = order.resources.map((r) => {
            if (!pr.resourceIds.includes(r.resourceId)) return r;

            const times = recalculateResourceTimes(
              pr.newDate,
              pr.newStartTime ? parseInt(pr.newStartTime.split(':')[0]) : 10,
              r.resource.preparationHours,
              r.resource.serviceHours,
              r.resource.cleanupHours
            );
            const newPrice = calculateResourcePrice(r.resource.basePrice, r.resource.serviceHours, pr.newDate);
            return {
              ...r,
              ...times,
              price: newPrice,
            };
          });

          const newTotal = order.totalAmount + pr.feeCalculation.rescheduleFee + pr.feeCalculation.priceDifference;
          const newPaymentPlans = generatePaymentPlans(newTotal, pr.newDate, order.paidAmount > 0);

          set((s) => ({
            orders: s.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    resources: newResources,
                    totalAmount: newTotal,
                    paymentPlans: newPaymentPlans,
                    version: o.version + 1,
                    partialReschedules: o.partialReschedules.map((p) =>
                      p.id === partialRescheduleId
                        ? { ...p, status: 'approved', approvedAt: now, approvedBy: s.currentUser }
                        : p
                    ),
                  }
                : o
            ),
          }));

          get().addAuditLog(
            orderId,
            '部分改期审批通过',
            `店长${state.currentUser}审批通过部分改期申请，改期费¥${pr.feeCalculation.rescheduleFee.toLocaleString()}`,
            '待审批',
            '已通过'
          );
        } else {
          set((s) => ({
            orders: s.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    partialReschedules: o.partialReschedules.map((p) =>
                      p.id === partialRescheduleId
                        ? { ...p, status: 'rejected', approvedAt: now, approvedBy: s.currentUser }
                        : p
                    ),
                  }
                : o
            ),
          }));

          get().addAuditLog(
            orderId,
            '部分改期审批拒绝',
            `店长${state.currentUser}拒绝部分改期申请`,
            '待审批',
            '已拒绝'
          );
        }
      },

      selectAlternativeResource: (orderId, withdrawalId, alternativeId) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return;

        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  resourceWithdrawals: o.resourceWithdrawals.map((w) =>
                    w.id === withdrawalId
                      ? { ...w, selectedAlternativeId: alternativeId }
                      : w
                  ),
                }
              : o
          ),
        }));

        const withdrawal = order.resourceWithdrawals.find((w) => w.id === withdrawalId);
        const alternative = withdrawal?.alternatives.find((a) => a.resourceId === alternativeId);
        if (withdrawal && alternative) {
          get().addAuditLog(
            orderId,
            '选择替代方案',
            `策划师${state.currentUser}选择替代方案：${alternative.resourceName}，差价¥${alternative.priceDifference.toLocaleString()}`,
            withdrawal.resourceName,
            alternative.resourceName
          );
        }
      },

      confirmAlternativeWithCustomer: (orderId, withdrawalId, customerConfirmed) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return;

        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  resourceWithdrawals: o.resourceWithdrawals.map((w) =>
                    w.id === withdrawalId
                      ? { ...w, customerConfirmed }
                      : w
                  ),
                }
              : o
          ),
        }));

        const withdrawal = order.resourceWithdrawals.find((w) => w.id === withdrawalId);
        if (withdrawal) {
          get().addAuditLog(
            orderId,
            customerConfirmed ? '客户确认替代方案' : '客户拒绝替代方案',
            `客户${customerConfirmed ? '确认' : '拒绝'}替代方案：${withdrawal.resourceName} → ${withdrawal.alternatives.find((a) => a.resourceId === withdrawal.selectedAlternativeId)?.resourceName}`,
            '待客户确认',
            customerConfirmed ? '客户已确认' : '客户已拒绝'
          );
        }
      },

      resolveWithdrawal: (orderId, withdrawalId) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return;

        const withdrawal = order.resourceWithdrawals.find((w) => w.id === withdrawalId);
        if (!withdrawal || !withdrawal.selectedAlternativeId || !withdrawal.customerConfirmed) return;

        const alternative = withdrawal.alternatives.find((a) => a.resourceId === withdrawal.selectedAlternativeId);
        const newResource = state.resources.find((r) => r.id === withdrawal.selectedAlternativeId);

        if (alternative && newResource) {
          const newResources = order.resources.map((r) => {
            if (r.resourceId !== withdrawal.resourceId) return r;
            return {
              ...r,
              resourceId: newResource.id,
              resource: newResource,
              price: r.price + alternative.priceDifference,
              status: 'pending' as const,
            };
          });

          const priceDiff = alternative.priceDifference;
          const newTotal = order.totalAmount + priceDiff;
          const newPaymentPlans = generatePaymentPlans(newTotal, order.weddingDate, order.paidAmount > 0);

          set((s) => ({
            orders: s.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    resources: newResources,
                    totalAmount: newTotal,
                    paymentPlans: newPaymentPlans,
                    version: o.version + 1,
                    resourceWithdrawals: o.resourceWithdrawals.map((w) =>
                      w.id === withdrawalId
                        ? { ...w, status: 'resolved' as const, resolvedAt: new Date().toISOString() }
                        : w
                    ),
                  }
                : o
            ),
          }));

          get().addAuditLog(
            orderId,
            '资源撤回已处理',
            `已将${withdrawal.resourceName}替换为${alternative.resourceName}，差价¥${priceDiff.toLocaleString()}`,
            withdrawal.resourceName,
            alternative.resourceName
          );
        }
      },

      toggleRainBackup: (orderId, enable) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return;

        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  activeRainBackup: enable,
                }
              : o
          ),
        }));

        get().addAuditLog(
          orderId,
          enable ? '激活雨天备选' : '关闭雨天备选',
          enable ? '由于天气预报有雨，已激活雨天备选方案' : '天气转好，已关闭雨天备选方案',
          '晴天方案',
          enable ? '雨天方案' : '晴天方案'
        );
      },

      getScheduleForOrder: (orderId) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return [];
        return order.schedule || [];
      },

      getActiveWithdrawals: (orderId) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return [];
        return (order.resourceWithdrawals || []).filter((w) => w.status === 'pending');
      },

      getPendingPartialReschedules: (orderId) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return [];
        return (order.partialReschedules || []).filter((pr) => pr.status === 'pending');
      },

      findAlternativeResources: (resourceId, date) => {
        const state = get();
        const originalResource = state.resources.find((r) => r.id === resourceId);
        if (!originalResource) return [];

        const conflicts = state.getConflictsForResource(resourceId);
        const conflictDates = new Set(conflicts.map((c) => c.conflictOrderDate));

        const alternatives = state.resources
          .filter((r) => r.type === originalResource.type && r.id !== resourceId)
          .map((r) => {
            const isConflicted = conflictDates.has(date);
            const priceDiff = r.basePrice - originalResource.basePrice;
            return {
              resourceId: r.id,
              resourceName: r.name,
              supplier: r.supplier,
              priceDifference: priceDiff,
              available: !isConflicted,
              notes: isConflicted ? '该日期已有其他订单' : '该日期可用',
            };
          });

        return alternatives;
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
