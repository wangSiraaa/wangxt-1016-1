export type ResourceType =
  | 'venue'
  | 'photography'
  | 'videography'
  | 'host'
  | 'makeup'
  | 'car'
  | 'decor'
  | 'rehearsal';

export const ResourceTypeLabels: Record<ResourceType, string> = {
  venue: '场地',
  photography: '摄影',
  videography: '摄像',
  host: '主持',
  makeup: '化妆',
  car: '婚车',
  decor: '布置供应商',
  rehearsal: '彩排',
};

export const ResourceTypeColors: Record<ResourceType, string> = {
  venue: 'bg-rose-500',
  photography: 'bg-pink-500',
  videography: 'bg-fuchsia-500',
  host: 'bg-purple-500',
  makeup: 'bg-violet-500',
  car: 'bg-indigo-500',
  decor: 'bg-blue-500',
  rehearsal: 'bg-cyan-500',
};

export interface Resource {
  id: string;
  type: ResourceType;
  name: string;
  supplier: string;
  phone: string;
  basePrice: number;
  preparationHours: number;
  serviceHours: number;
  cleanupHours: number;
  confirmed: boolean;
}

export interface OrderResource {
  resourceId: string;
  resource: Resource;
  startTime: string;
  endTime: string;
  preparationEnd: string;
  cleanupStart: string;
  price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  conflict?: string;
}

export type OrderStatus =
  | 'draft'
  | 'pending_deposit'
  | 'deposit_paid'
  | 'approved'
  | 'rescheduled'
  | 'completed'
  | 'cancelled'
  | 'expired';

export const OrderStatusLabels: Record<OrderStatus, string> = {
  draft: '草稿',
  pending_deposit: '待付定金',
  deposit_paid: '定金已付',
  approved: '店长审批通过',
  rescheduled: '已改期',
  completed: '已完成',
  cancelled: '已取消',
  expired: '已过期',
};

export const OrderStatusColors: Record<OrderStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_deposit: 'bg-yellow-100 text-yellow-700',
  deposit_paid: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rescheduled: 'bg-purple-100 text-purple-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  expired: 'bg-orange-100 text-orange-700',
};

export interface PaymentPlan {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  type: 'deposit' | 'installment' | 'balance' | 'reschedule_fee';
}

export interface RescheduleRecord {
  id: string;
  orderId: string;
  oldDate: string;
  newDate: string;
  reason: string;
  rescheduleFee: number;
  priceDifference: number;
  weatherBackup: boolean;
  approvedBy: string;
  approvedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  conflicts: string[];
}

export interface AuditLog {
  id: string;
  orderId: string;
  action: string;
  operator: string;
  timestamp: string;
  details: string;
  oldValue?: string;
  newValue?: string;
}

export interface WeatherOption {
  date: string;
  condition: string;
  temperature: string;
  suitable: boolean;
  backupAvailable: boolean;
}

export interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  weddingDate: string;
  weddingLocation: string;
  theme: string;
  totalAmount: number;
  paidAmount: number;
  status: OrderStatus;
  resources: OrderResource[];
  paymentPlans: PaymentPlan[];
  rescheduleRecords: RescheduleRecord[];
  auditLogs: AuditLog[];
  createdAt: string;
  updatedAt: string;
  depositExpiresAt?: string;
  planner: string;
  manager?: string;
  notes?: string;
  weatherBackup?: WeatherOption[];
  version: number;
}

export interface ConflictInfo {
  resourceId: string;
  resourceName: string;
  resourceType: ResourceType;
  conflictingOrderId: string;
  conflictingOrderNo: string;
  conflictingCustomer: string;
  conflictStart: string;
  conflictEnd: string;
  conflictType: 'preparation' | 'service' | 'cleanup';
}

export interface FeeCalculation {
  originalTotal: number;
  rescheduleFee: number;
  priceDifference: number;
  newTotal: number;
  paidAmount: number;
  balanceDue: number;
  details: {
    name: string;
    oldPrice: number;
    newPrice: number;
    difference: number;
  }[];
}
