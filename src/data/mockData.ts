import type { Resource, Order, WeatherOption, OrderResource, ScheduleEvent, SupplierTerms } from '@/types';
import { generateId, addDays, formatDate, addHours } from '@/utils/dateUtils';
import { generatePaymentPlans, calculateDeposit, calculateResourcePrice } from '@/utils/feeUtils';

const venueTerms: SupplierTerms = {
  depositRate: 0.5,
  balanceDueDays: 14,
  reschedulePenaltyRate: 0.2,
  cancelPenaltyRate: 0.5,
  minPreparationDays: 30,
  weekendSurchargeRate: 0.2,
  holidaySurchargeRate: 0.5,
};

const photographyTerms: SupplierTerms = {
  depositRate: 0.3,
  balanceDueDays: 7,
  reschedulePenaltyRate: 0.1,
  cancelPenaltyRate: 0.3,
  minPreparationDays: 14,
  weekendSurchargeRate: 0.2,
  holidaySurchargeRate: 0.3,
};

const hostTerms: SupplierTerms = {
  depositRate: 0.3,
  balanceDueDays: 3,
  reschedulePenaltyRate: 0.15,
  cancelPenaltyRate: 0.4,
  minPreparationDays: 7,
  weekendSurchargeRate: 0.25,
  holidaySurchargeRate: 0.4,
};

const makeupTerms: SupplierTerms = {
  depositRate: 0.3,
  balanceDueDays: 3,
  reschedulePenaltyRate: 0.1,
  cancelPenaltyRate: 0.3,
  minPreparationDays: 7,
  weekendSurchargeRate: 0.15,
  holidaySurchargeRate: 0.3,
};

const carTerms: SupplierTerms = {
  depositRate: 0.4,
  balanceDueDays: 7,
  reschedulePenaltyRate: 0.15,
  cancelPenaltyRate: 0.4,
  minPreparationDays: 10,
  weekendSurchargeRate: 0.2,
  holidaySurchargeRate: 0.35,
};

const decorTerms: SupplierTerms = {
  depositRate: 0.5,
  balanceDueDays: 14,
  reschedulePenaltyRate: 0.25,
  cancelPenaltyRate: 0.6,
  minPreparationDays: 21,
  weekendSurchargeRate: 0.1,
  holidaySurchargeRate: 0.3,
};

const rehearsalTerms: SupplierTerms = {
  depositRate: 0.2,
  balanceDueDays: 1,
  reschedulePenaltyRate: 0.05,
  cancelPenaltyRate: 0.2,
  minPreparationDays: 3,
  weekendSurchargeRate: 0,
  holidaySurchargeRate: 0.1,
};

const welcomeDinnerTerms: SupplierTerms = {
  depositRate: 0.4,
  balanceDueDays: 7,
  reschedulePenaltyRate: 0.15,
  cancelPenaltyRate: 0.4,
  minPreparationDays: 14,
  weekendSurchargeRate: 0.15,
  holidaySurchargeRate: 0.3,
};

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
    terms: venueTerms,
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
    terms: venueTerms,
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
    terms: photographyTerms,
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
    terms: photographyTerms,
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
    terms: photographyTerms,
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
    terms: photographyTerms,
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
    terms: photographyTerms,
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
    terms: hostTerms,
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
    terms: hostTerms,
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
    terms: makeupTerms,
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
    terms: makeupTerms,
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
    terms: carTerms,
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
    terms: carTerms,
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
    terms: decorTerms,
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
    terms: decorTerms,
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
    terms: rehearsalTerms,
  },
  {
    id: 'res-welcome-001',
    type: 'welcomedinner',
    name: '欢迎晚宴套餐',
    supplier: '星光大酒店',
    phone: '13800138003',
    basePrice: 12000,
    preparationHours: 2,
    serviceHours: 4,
    cleanupHours: 1,
    confirmed: true,
    terms: welcomeDinnerTerms,
  },
];

function createOrderResource(
  resource: Resource,
  weddingDate: Date | string,
  serviceStartHour: number,
  eventId?: string
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
    eventId,
  };
}

function generateSchedule(weddingDate: Date | string, resourceIds: string[]): ScheduleEvent[] {
  const dateStr = formatDate(weddingDate);
  const dayBefore = formatDate(addDays(weddingDate, -1));
  const dayAfter = formatDate(addDays(weddingDate, 1));
  const rainBackupDate = formatDate(addDays(weddingDate, 7));
  
  const schedule: ScheduleEvent[] = [
    {
      id: generateId(),
      type: 'welcome_dinner',
      name: '欢迎晚宴',
      date: dayBefore,
      startTime: '18:00',
      endTime: '21:00',
      location: '星光大酒店宴会厅',
      resourceIds: resourceIds.filter(id => id.includes('venue') || id.includes('welcome') || id.includes('host')),
    },
    {
      id: generateId(),
      type: 'rehearsal',
      name: '婚礼彩排',
      date: dayBefore,
      startTime: '15:00',
      endTime: '17:00',
      location: '玫瑰花园仪式区',
      resourceIds: resourceIds.filter(id => id.includes('host') || id.includes('rehearsal')),
    },
    {
      id: generateId(),
      type: 'photoshoot',
      name: '外景拍摄',
      date: dateStr,
      startTime: '08:00',
      endTime: '10:00',
      location: '城市公园',
      resourceIds: resourceIds.filter(id => id.includes('photo') || id.includes('video') || id.includes('car')),
    },
    {
      id: generateId(),
      type: 'tea_ceremony',
      name: '敬茶仪式',
      date: dateStr,
      startTime: '10:30',
      endTime: '11:30',
      location: '新人住所',
      resourceIds: resourceIds.filter(id => id.includes('photo') || id.includes('video')),
    },
    {
      id: generateId(),
      type: 'ceremony',
      name: '结婚仪式',
      date: dateStr,
      startTime: '11:58',
      endTime: '12:30',
      location: '玫瑰花园仪式区',
      resourceIds: resourceIds.filter(id => !id.includes('rehearsal') && !id.includes('welcome')),
    },
    {
      id: generateId(),
      type: 'lunch',
      name: '午宴',
      date: dateStr,
      startTime: '12:30',
      endTime: '14:30',
      location: '星光宴会厅A',
      resourceIds: resourceIds.filter(id => id.includes('venue') || id.includes('host') || id.includes('photo') || id.includes('video') || id.includes('decor')),
    },
    {
      id: generateId(),
      type: 'dinner',
      name: '晚宴',
      date: dateStr,
      startTime: '18:00',
      endTime: '21:00',
      location: '星光宴会厅A',
      resourceIds: resourceIds.filter(id => id.includes('venue') || id.includes('host') || id.includes('photo') || id.includes('video') || id.includes('decor') || id.includes('makeup')),
    },
    {
      id: generateId(),
      type: 'rain_backup',
      name: '雨天备选-室内仪式',
      date: rainBackupDate,
      startTime: '11:58',
      endTime: '12:30',
      location: '星光大酒店室内仪式厅',
      resourceIds: resourceIds.filter(id => !id.includes('rehearsal') && !id.includes('welcome')),
      isRainBackup: true,
    },
  ];

  return schedule;
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
  serviceStartHour: number = 10,
  options?: {
    hasPhotographerConflict?: boolean;
    hasResourceWithdrawal?: boolean;
    hasPartialReschedule?: boolean;
    isPendingDeposit?: boolean;
  }
): Order {
  const schedule = generateSchedule(weddingDate, resourceIds);
  
  const orderResources = resourceIds
    .map((id) => {
      const res = mockResources.find((r) => r.id === id);
      if (!res) return null;
      const event = schedule.find(e => e.resourceIds.includes(id) && !e.isRainBackup);
      return createOrderResource(res, weddingDate, serviceStartHour, event?.id);
    })
    .filter(Boolean) as OrderResource[];

  if (options?.hasPhotographerConflict) {
    const photoRes = orderResources.find(r => r.resource.type === 'photography');
    if (photoRes) {
      photoRes.conflict = '与订单WH202406002的王芳-资深摄影师在仪式时段冲突';
    }
  }

  const totalAmount = orderResources.reduce((sum, r) => sum + r.price, 0);
  const deposit = calculateDeposit(totalAmount);
  const depositPaid = status !== 'pending_deposit' && status !== 'draft' && status !== 'expired';
  const paymentPlans = generatePaymentPlans(totalAmount, weddingDate, depositPaid);
  
  const paidAmount = depositPaid ? deposit : 0;
  const depositExpiresAt = options?.isPendingDeposit
    ? addHours(new Date(), 2).toISOString()
    : status === 'pending_deposit'
    ? addHours(new Date(), 2).toISOString()
    : status === 'draft'
    ? addHours(new Date(), 24).toISOString()
    : undefined;

  const resourceWithdrawals = options?.hasResourceWithdrawal ? [
    {
      id: generateId(),
      orderId: '',
      resourceId: 'res-makeup-001',
      resourceName: 'Maggie-首席化妆师',
      supplier: '美丽人生造型',
      reason: '化妆师突发身体不适，无法提供服务',
      notifiedAt: addHours(new Date(), -2).toISOString(),
      alternatives: [
        {
          resourceId: 'res-makeup-002',
          resourceName: 'Lisa-资深化妆师',
          supplier: '美丽人生造型',
          priceDifference: -1600,
          available: true,
          notes: '同团队资深化妆师，经验丰富',
        },
        {
          resourceId: 'res-makeup-003',
          resourceName: 'Emily-首席化妆师',
          supplier: '风尚造型',
          priceDifference: 800,
          available: true,
          notes: '合作供应商首席化妆师，需额外服务费',
        },
      ],
      customerConfirmed: false,
      status: 'pending' as const,
    },
  ] : [];

  const partialReschedules = options?.hasPartialReschedule ? [
    {
      id: generateId(),
      orderId: '',
      eventId: schedule.find(e => e.type === 'lunch')?.id,
      resourceIds: ['res-venue-001'],
      oldDate: formatDate(weddingDate),
      newDate: formatDate(weddingDate),
      oldStartTime: '12:30',
      newStartTime: '14:00',
      reason: '客户希望延后午宴，只调整场地和餐饮，摄影摄像时间不变',
      conflicts: [],
      feeCalculation: {
        originalTotal: totalAmount,
        rescheduleFee: 1200,
        priceDifference: 0,
        newTotal: totalAmount + 1200,
        paidAmount: deposit,
        balanceDue: totalAmount + 1200 - deposit,
        details: [
          {
            name: '星光宴会厅A',
            oldPrice: 28000,
            newPrice: 28000,
            difference: 0,
          },
        ],
      },
      status: 'pending' as const,
      createdAt: addHours(new Date(), -1).toISOString(),
    },
  ] : [];

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
    schedule,
    resourceWithdrawals,
    partialReschedules,
    activeRainBackup: false,
  };
}

export const mockOrders: Order[] = [
  buildOrder(
    'WH202406001',
    '张先生 & 李小姐',
    '13800000001',
    date1,
    ['res-venue-001', 'res-photo-001', 'res-video-001', 'res-host-001', 'res-makeup-001', 'res-car-001', 'res-decor-001', 'res-rehearsal-001', 'res-welcome-001'],
    'approved',
    '王策划',
    '浪漫星空主题',
    10,
    {
      hasResourceWithdrawal: true,
    }
  ),
  buildOrder(
    'WH202406002',
    '刘先生 & 陈小姐',
    '13800000002',
    date2,
    ['res-venue-002', 'res-photo-002', 'res-video-002', 'res-host-002', 'res-makeup-002', 'res-car-002', 'res-decor-002', 'res-rehearsal-001'],
    'deposit_paid',
    '李策划',
    '森系花园主题',
    10,
    {
      hasPhotographerConflict: true,
    }
  ),
  buildOrder(
    'WH202406003',
    '王先生 & 赵小姐',
    '13800000003',
    date3,
    ['res-venue-001', 'res-photo-001', 'res-host-001', 'res-makeup-001', 'res-car-001', 'res-welcome-001'],
    'pending_deposit',
    '王策划',
    '简约轻奢主题',
    10,
    {
      isPendingDeposit: true,
    }
  ),
  buildOrder(
    'WH202406004',
    '陈先生 & 周小姐',
    '13800000004',
    date5,
    ['res-venue-001', 'res-photo-001', 'res-video-001', 'res-host-001', 'res-makeup-001'],
    'rescheduled',
    '张策划',
    '经典中式主题',
    10,
    {
      hasPartialReschedule: true,
    }
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

mockOrders.forEach((order, index) => {
  if (order.resourceWithdrawals.length > 0) {
    order.resourceWithdrawals.forEach(w => {
      w.orderId = order.id;
    });
  }
  if (order.partialReschedules.length > 0) {
    order.partialReschedules.forEach(pr => {
      pr.orderId = order.id;
    });
  }
});

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
  {
    id: generateId(),
    orderId: mockOrders[0].id,
    action: '供应商撤回',
    operator: '系统',
    timestamp: addHours(new Date(), -2).toISOString(),
    details: 'Maggie-首席化妆师突发身体不适，需要安排替代方案',
    oldValue: 'Maggie-首席化妆师',
    newValue: '待确认替代方案',
  },
];
