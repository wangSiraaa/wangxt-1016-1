export type ResourceType =
  | 'venue'
  | 'photography'
  | 'videography'
  | 'host'
  | 'makeup'
  | 'car'
  | 'decor'
  | 'rehearsal'
  | 'welcomedinner';

export type ScheduleEventType =
  | 'welcome_dinner'
  | 'rehearsal'
  | 'ceremony'
  | 'lunch'
  | 'dinner'
  | 'tea_ceremony'
  | 'photoshoot'
  | 'rain_backup';

export const ResourceTypeLabels: Record<ResourceType, string> = {
  venue: '场地',
  photography: '摄影',
  videography: '摄像',
  host: '主持',
  makeup: '化妆',
  car: '婚车',
  decor: '布置供应商',
  rehearsal: '彩排',
  welcomedinner: '欢迎晚宴',
};

export const ScheduleEventTypeLabels: Record<ScheduleEventType, string> = {
  welcome_dinner: '欢迎晚宴',
  rehearsal: '婚礼彩排',
  ceremony: '结婚仪式',
  lunch: '午宴',
  dinner: '晚宴',
  tea_ceremony: '敬茶仪式',
  photoshoot: '外景拍摄',
  rain_backup: '雨天备选',
};

export const ScheduleEventTypeColors: Record<ScheduleEventType, string> = {
  welcome_dinner: 'bg-indigo-500',
  rehearsal: 'bg-cyan-500',
  ceremony: 'bg-rose-500',
  lunch: 'bg-amber-500',
  dinner: 'bg-orange-500',
  tea_ceremony: 'bg-pink-500',
  photoshoot: 'bg-purple-500',
  rain_backup: 'bg-blue-500',
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

export interface SupplierTerms {
  depositRate: number;
  balanceDueDays: number;
  reschedulePenaltyRate: number;
  cancelPenaltyRate: number;
  minPreparationDays: number;
  weekendSurchargeRate: number;
  holidaySurchargeRate: number;
}

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
  terms: SupplierTerms;
}

export interface ScheduleEvent {
  id: string;
  type: ScheduleEventType;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  resourceIds: string[];
  notes?: string;
  isRainBackup?: boolean;
  rainBackupEventId?: string;
}

export interface OrderResource {
  resourceId: string;
  resource: Resource;
  startTime: string;
  endTime: string;
  preparationEnd: string;
  cleanupStart: string;
  price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'withdrawn';
  conflict?: string;
  eventId?: string;
  withdrawnAt?: string;
  withdrawalReason?: string;
}

export interface ResourceWithdrawal {
  id: string;
  orderId: string;
  resourceId: string;
  resourceName: string;
  supplier: string;
  reason: string;
  notifiedAt: string;
  alternatives: AlternativeResource[];
  selectedAlternativeId?: string;
  customerConfirmed: boolean;
  customerConfirmedAt?: string;
  status: 'pending' | 'alternative_selected' | 'customer_confirmed' | 'resolved';
}

export interface AlternativeResource {
  resourceId: string;
  resourceName: string;
  supplier: string;
  priceDifference: number;
  available: boolean;
  notes?: string;
}

export interface PartialReschedule {
  id: string;
  orderId: string;
  eventId?: string;
  resourceIds: string[];
  oldDate: string;
  newDate: string;
  oldStartTime?: string;
  newStartTime?: string;
  reason: string;
  conflicts: ConflictInfo[];
  feeCalculation: FeeCalculation;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
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
  schedule: ScheduleEvent[];
  resourceWithdrawals: ResourceWithdrawal[];
  partialReschedules: PartialReschedule[];
  activeRainBackup?: boolean;
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
