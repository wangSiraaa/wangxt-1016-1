import type { Resource, Order, WeatherOption, OrderResource } from '@/types';
import { generateId, addDays, formatDate, addHours } from '@/utils/dateUtils';
import { generatePaymentPlans, calculateDeposit, calculateResourcePrice } from '@/utils/feeUtils';

export const mockResources: Resource[] = [
  {
    id: 'res-venue-001',
    type: 'venue',
    name: '星光宴会厅A',
    supplier: '星光大酒店',
    phone: '13800138001',
    basePrice: 28000,
    preparationHours: 4,
    serviceHours: 8,
    cleanupHours: 2,
    confirmed: true,
  },
  {
    id: 'res-venue-002',
    type: 'venue',
    name: '玫瑰花园厅',
    supplier: '玫瑰庄园',
    phone: '13800138002',
    basePrice: 35000,
    preparationHours: 5,
    serviceHours: 10,
    cleanupHours: 3,
    confirmed: true,
  },
  {
    id: 'res-photo-001',
    type: 'photography',
    name: '李明-首席摄影师',
    supplier: '光影工作室',
    phone: '13900139001',
    basePrice: 8800,
    preparationHours: 1,
    serviceHours: 10,
    cleanupHours: 0.5,
    confirmed: true,
  },
  {
    id: 'res-photo-002',
    type: 'photography',
    name: '王芳-资深摄影师',
    supplier: '光影工作室',
    phone: '13900139002',
    basePrice: 6800,
    preparationHours: 1,
    serviceHours: 10,
    cleanupHours: 0.5,
    confirmed: true,
  },
  {
    id: 'res-photo-003',
    type: 'photography',
    name: '张伟-金牌摄影师',
    supplier: '时光印记',
    phone: '13900139003',
    basePrice: 12000,
    preparationHours: 1,
    serviceHours: 12,
    cleanupHours: 0.5,
    confirmed: true,
  },
  {
    id: 'res-video-001',
    type: 'videography',
    name: '陈刚-首席摄像师',
    supplier: '影像工坊',
    phone: '13700137001',
    basePrice: 9800,
    preparationHours: 1,
    serviceHours: 10,
    cleanupHours: 0.5,
    confirmed: true,
  },
  {
    id: 'res-video-002',
    type: 'videography',
    name: '刘娜-资深摄像师',
    supplier: '影像工坊',
    phone: '13700137002',
    basePrice: 7800,
    preparationHours: 1,
    serviceHours: 10,
    cleanupHours: 0.5,
    confirmed: true,
  },
  {
    id: 'res-host-001',
    type: 'host',
    name: '赵老师-金牌主持',
    supplier: '声动主持团队',
    phone: '13600136001',
    basePrice: 5800,
    preparationHours: 2,
    serviceHours: 4,
    cleanupHours: 0.5,
    confirmed: true,
  },
  {
    id: 'res-host-002',
    type: 'host',
    name: '孙老师-资深主持',
    supplier: '声动主持团队',
    phone: '13600136002',
    basePrice: 3800,
    preparationHours: 2,
    serviceHours: 4,
    cleanupHours: 0.5,
    confirmed: true,
  },
  {
    id: 'res-makeup-001',
    type: 'makeup',
    name: 'Maggie-首席化妆师',
    supplier: '美丽人生造型',
    phone: '13500135001',
    basePrice: 4800,
    preparationHours: 3,
    serviceHours: 8,
    cleanupHours: 0.5,
    confirmed: true,
  },
  {
    id: 'res-makeup-002',
    type: 'makeup',
    name: 'Lisa-资深化妆师',
    supplier: '美丽人生造型',
    phone: '13500135002',
    basePrice: 3200,
    preparationHours: 3,
    serviceHours: 8,
    cleanupHours: 0.5,
    confirmed: true,
  },
  {
    id: 'res-car-001',
    type: 'car',
    name: '奔驰S级车队(5辆)',
    supplier: '皇家婚车',
    phone: '13400134001',
    basePrice: 6800,
    preparationHours: 1,
    serviceHours: 6,
    cleanupHours: 0.5,
    confirmed: true,
  },
  {
    id: 'res-car-002',
    type: 'car',
    name: '保时捷车队(3辆)',
    supplier: '皇家婚车',
    phone: '13400134002',
    basePrice: 12000,
    preparationHours: 1,
    serviceHours: 6,
    cleanupHours: 0.5,
    confirmed: true,
  },
  {
    id: 'res-decor-001',
    type: 'decor',
    name: '浪漫星空主题布置',
    supplier: '花田喜事',
    phone: '13300133001',
    basePrice: 15000,
    preparationHours: 8,
    serviceHours: 12,
    cleanupHours: 4,
    confirmed: true,
  },
  {
    id: 'res-decor-002',
    type: 'decor',
    name: '森系花园主题布置',
    supplier: '花田喜事',
    phone: '13300133002',
    basePrice: 18000,
    preparationHours: 10,
    serviceHours: 12,
    cleanupHours: 4,
    confirmed: true,
  },
  {
    id: 'res-rehearsal-001',
    type: 'rehearsal',
    name: '婚礼彩排服务',
    supplier: '幸福嫁日',
    phone: '13200132001',
    basePrice: 2000,
    preparationHours: 0.5,
    serviceHours: 2,
    cleanupHours: 0.5,
    confirmed: true,
  },
];

function createOrderResource(
  resource: Resource,
  weddingDate: Date | string,
  serviceStartHour: number
) {
  const dateStr = formatDate(weddingDate);
  const serviceStart = new Date(`${dateStr}T${String(serviceStartHour).padStart(2, '0')}:00:00`);
  
  const startTime = addHours(serviceStart, -resource.preparationHours);
  const endTime = addHours(serviceStart, resource.serviceHours + resource.cleanupHours);
  const preparationEnd = new Date(serviceStart);
  const cleanupStart = addHours(serviceStart, resource.serviceHours);
  const price = calculateResourcePrice(resource.basePrice, resource.serviceHours, weddingDate);

  return {
    resourceId: resource.id,
    resource: { ...resource },
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    preparationEnd: preparationEnd.toISOString(),
    cleanupStart: cleanupStart.toISOString(),
    price,
    status: 'confirmed' as const,
  };
}

function generateWeatherOptions(baseDate: Date | string): WeatherOption[] {
  const conditions = ['晴', '多云', '阴', '小雨', '中雨'];
  const options: WeatherOption[] = [];
  
  for (let i = 0; i < 7; i++) {
    const date = addDays(baseDate, i - 3);
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const temp = 15 + Math.floor(Math.random() * 15);
    options.push({
      date: formatDate(date),
      condition,
      temperature: `${temp}°C`,
      suitable: !condition.includes('雨'),
      backupAvailable: Math.random() > 0.3,
    });
  }
  
  return options;
}

const today = new Date();

const date1 = addDays(today, 7);
const date2 = addDays(today, 14);
const date3 = addDays(today, 21);
const date4 = addDays(today, -5);
const date5 = addDays(today, 3);
const date6 = addDays(today, 30);

function buildOrder(
  orderNo: string,
  customerName: string,
  customerPhone: string,
  weddingDate: Date,
  resourceIds: string[],
  status: Order['status'],
  planner: string,
  theme: string,
  serviceStartHour: number = 10
): Order {
  const orderResources = resourceIds
    .map((id) => {
      const res = mockResources.find((r) => r.id === id);
      if (!res) return null;
      return createOrderResource(res, weddingDate, serviceStartHour);
    })
    .filter(Boolean) as OrderResource[];

  const totalAmount = orderResources.reduce((sum, r) => sum + r.price, 0);
  const deposit = calculateDeposit(totalAmount);
  const depositPaid = status !== 'pending_deposit' && status !== 'draft' && status !== 'expired';
  const paymentPlans = generatePaymentPlans(totalAmount, weddingDate, depositPaid);
  
  const paidAmount = depositPaid ? deposit : 0;
  const depositExpiresAt = status === 'pending_deposit'
    ? addHours(new Date(), 2).toISOString()
    : status === 'draft'
    ? addHours(new Date(), 24).toISOString()
    : undefined;

  return {
    id: generateId(),
    orderNo,
    customerName,
    customerPhone,
    weddingDate: formatDate(weddingDate),
    weddingLocation: '星光大酒店',
    theme,
    totalAmount,
    paidAmount,
    status,
    resources: orderResources,
    paymentPlans,
    rescheduleRecords: [],
    auditLogs: [],
    createdAt: addDays(today, -10).toISOString(),
    updatedAt: addDays(today, -1).toISOString(),
    depositExpiresAt,
    planner,
    manager: '张店长',
    notes: '',
    weatherBackup: generateWeatherOptions(weddingDate),
    version: 1,
  };
}

export const mockOrders: Order[] = [
  buildOrder(
    'WH202406001',
    '张先生 & 李小姐',
    '13800000001',
    date1,
    ['res-venue-001', 'res-photo-001', 'res-video-001', 'res-host-001', 'res-makeup-001', 'res-car-001', 'res-decor-001', 'res-rehearsal-001'],
    'approved',
    '王策划',
    '浪漫星空主题'
  ),
  buildOrder(
    'WH202406002',
    '刘先生 & 陈小姐',
    '13800000002',
    date2,
    ['res-venue-002', 'res-photo-002', 'res-video-002', 'res-host-002', 'res-makeup-002', 'res-car-002', 'res-decor-002', 'res-rehearsal-001'],
    'deposit_paid',
    '李策划',
    '森系花园主题'
  ),
  buildOrder(
    'WH202406003',
    '王先生 & 赵小姐',
    '13800000003',
    date3,
    ['res-venue-001', 'res-photo-001', 'res-host-001', 'res-makeup-001', 'res-car-001'],
    'pending_deposit',
    '王策划',
    '简约轻奢主题'
  ),
  buildOrder(
    'WH202406004',
    '陈先生 & 周小姐',
    '13800000004',
    date5,
    ['res-venue-001', 'res-photo-001', 'res-video-001', 'res-host-001', 'res-makeup-001'],
    'rescheduled',
    '张策划',
    '经典中式主题'
  ),
  buildOrder(
    'WH202406005',
    '李先生 & 孙小姐',
    '13800000005',
    date4,
    ['res-venue-002', 'res-photo-002', 'res-host-002', 'res-makeup-002'],
    'completed',
    '李策划',
    '海边度假主题'
  ),
  buildOrder(
    'WH202406006',
    '赵先生 & 吴小姐',
    '13800000006',
    date6,
    ['res-venue-002', 'res-photo-003', 'res-video-001', 'res-host-001', 'res-makeup-001', 'res-car-001', 'res-decor-001'],
    'draft',
    '王策划',
    '童话城堡主题'
  ),
];

mockOrders[3].rescheduleRecords = [
  {
    id: generateId(),
    orderId: mockOrders[3].id,
    oldDate: formatDate(addDays(date5, -7)),
    newDate: formatDate(date5),
    reason: '新娘临时有事需要改期',
    rescheduleFee: 5800,
    priceDifference: 1200,
    weatherBackup: true,
    approvedBy: '张店长',
    approvedAt: addDays(today, -2).toISOString(),
    status: 'approved',
    conflicts: [],
  },
];

mockOrders[3].version = 2;

mockOrders[3].auditLogs = [
  {
    id: generateId(),
    orderId: mockOrders[3].id,
    action: '创建订单',
    operator: '张策划',
    timestamp: addDays(today, -20).toISOString(),
    details: '创建订单，选择经典中式主题',
  },
  {
    id: generateId(),
    orderId: mockOrders[3].id,
    action: '支付定金',
    operator: '客户',
    timestamp: addDays(today, -15).toISOString(),
    details: '客户支付定金 17,400元',
    oldValue: '待付定金',
    newValue: '定金已付',
  },
  {
    id: generateId(),
    orderId: mockOrders[3].id,
    action: '申请改期',
    operator: '客户',
    timestamp: addDays(today, -5).toISOString(),
    details: '客户申请从原日期改期',
  },
  {
    id: generateId(),
    orderId: mockOrders[3].id,
    action: '改期审批通过',
    operator: '张店长',
    timestamp: addDays(today, -2).toISOString(),
    details: '店长审批通过改期申请，收取改期费 5,800元',
    oldValue: formatDate(addDays(date5, -7)),
    newValue: formatDate(date5),
  },
];

mockOrders[0].auditLogs = [
  {
    id: generateId(),
    orderId: mockOrders[0].id,
    action: '创建订单',
    operator: '王策划',
    timestamp: addDays(today, -30).toISOString(),
    details: '创建订单，选择浪漫星空主题',
  },
  {
    id: generateId(),
    orderId: mockOrders[0].id,
    action: '支付定金',
    operator: '客户',
    timestamp: addDays(today, -28).toISOString(),
    details: '客户支付定金 22,620元',
  },
  {
    id: generateId(),
    orderId: mockOrders[0].id,
    action: '店长审批通过',
    operator: '张店长',
    timestamp: addDays(today, -25).toISOString(),
    details: '店长审批通过订单',
    oldValue: '定金已付',
    newValue: '店长审批通过',
  },
];
