import type { Order, OrderResource, FeeCalculation, PaymentPlan } from '@/types';
import { addDays, formatDate, generateId, addHours } from './dateUtils';

export const RESCHEDULE_FEE_RATE = 0.1;
export const DEPOSIT_RATE = 0.3;
export const DEPOSIT_EXPIRE_HOURS = 24;

export function calculateTotalAmount(resources: OrderResource[]): number {
  return resources.reduce((sum, r) => sum + r.price, 0);
}

export function calculateDeposit(totalAmount: number): number {
  return Math.round(totalAmount * DEPOSIT_RATE);
}

export function calculateRescheduleFee(totalAmount: number): number {
  return Math.round(totalAmount * RESCHEDULE_FEE_RATE);
}

export function generatePaymentPlans(
  totalAmount: number,
  weddingDate: Date | string,
  depositPaid: boolean = false
): PaymentPlan[] {
  const plans: PaymentPlan[] = [];
  const deposit = calculateDeposit(totalAmount);
  const balance = totalAmount - deposit;

  const today = new Date();

  plans.push({
    id: generateId(),
    name: '定金',
    amount: deposit,
    dueDate: formatDate(addDays(today, 1)),
    status: depositPaid ? 'paid' : 'pending',
    paidDate: depositPaid ? formatDate(today) : undefined,
    type: 'deposit',
  });

  const midDate = addDays(weddingDate, -30);
  if (midDate > today) {
    const midAmount = Math.round(balance * 0.5);
    plans.push({
      id: generateId(),
      name: '中期款',
      amount: midAmount,
      dueDate: formatDate(midDate),
      status: 'pending',
      type: 'installment',
    });
    plans.push({
      id: generateId(),
      name: '尾款',
      amount: balance - midAmount,
      dueDate: formatDate(addDays(weddingDate, -7)),
      status: 'pending',
      type: 'balance',
    });
  } else {
    plans.push({
      id: generateId(),
      name: '尾款',
      amount: balance,
      dueDate: formatDate(addDays(weddingDate, -7)),
      status: 'pending',
      type: 'balance',
    });
  }

  return plans;
}

export function calculateRescheduleFeeDetails(
  originalOrder: Order,
  newResources: OrderResource[],
  newWeddingDate: string
): FeeCalculation {
  const originalTotal = originalOrder.totalAmount;
  const newTotal = calculateTotalAmount(newResources);
  const priceDifference = newTotal - originalTotal;
  const rescheduleFee = calculateRescheduleFee(originalTotal);
  const newTotalWithFee = newTotal + rescheduleFee;

  const details = originalOrder.resources.map((oldRes) => {
    const newRes = newResources.find((nr) => nr.resourceId === oldRes.resourceId);
    return {
      name: oldRes.resource.name,
      oldPrice: oldRes.price,
      newPrice: newRes ? newRes.price : oldRes.price,
      difference: newRes ? newRes.price - oldRes.price : 0,
    };
  });

  return {
    originalTotal,
    rescheduleFee,
    priceDifference,
    newTotal: newTotalWithFee,
    paidAmount: originalOrder.paidAmount,
    balanceDue: newTotalWithFee - originalOrder.paidAmount,
    details,
  };
}

export function calculateResourcePrice(
  basePrice: number,
  serviceHours: number,
  date: Date | string
): number {
  const d = new Date(date);
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
  const multiplier = isWeekend ? 1.2 : 1;
  return Math.round(basePrice * multiplier);
}

export function recalculateResourceTimes(
  weddingDate: Date | string,
  serviceStartHour: number,
  preparationHours: number,
  serviceHours: number,
  cleanupHours: number
): {
  startTime: string;
  endTime: string;
  preparationEnd: string;
  cleanupStart: string;
} {
  const dateStr = formatDate(weddingDate);
  const serviceStart = new Date(`${dateStr}T${String(serviceStartHour).padStart(2, '0')}:00:00`);
  
  const startTime = addHours(serviceStart, -preparationHours);
  const endTime = addHours(serviceStart, serviceHours + cleanupHours);
  const preparationEnd = new Date(serviceStart);
  const cleanupStart = addHours(serviceStart, serviceHours);

  return {
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    preparationEnd: preparationEnd.toISOString(),
    cleanupStart: cleanupStart.toISOString(),
  };
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN')}`;
}
