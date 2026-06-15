import type { Order, OrderResource, ConflictInfo, ResourceType } from '@/types';
import { isBefore, isAfter, formatDateTime } from './dateUtils';

export function checkResourceConflict(
  resourceId: string,
  startTime: string,
  endTime: string,
  orders: Order[],
  excludeOrderId?: string
): ConflictInfo[] {
  const conflicts: ConflictInfo[] = [];

  for (const order of orders) {
    if (excludeOrderId && order.id === excludeOrderId) continue;
    if (order.status === 'cancelled' || order.status === 'expired') continue;

    for (const orderResource of order.resources) {
      if (orderResource.resourceId !== resourceId) continue;
      if (orderResource.status === 'cancelled') continue;

      const prepStart = orderResource.startTime;
      const cleanupEnd = orderResource.endTime;

      if (
        isBefore(startTime, cleanupEnd) &&
        isAfter(endTime, prepStart)
      ) {
        let conflictType: 'preparation' | 'service' | 'cleanup' = 'service';
        if (isBefore(startTime, orderResource.startTime)) {
          conflictType = 'preparation';
        } else if (isAfter(endTime, orderResource.endTime)) {
          conflictType = 'cleanup';
        }

        conflicts.push({
          resourceId,
          resourceName: orderResource.resource.name,
          resourceType: orderResource.resource.type,
          conflictingOrderId: order.id,
          conflictingOrderNo: order.orderNo,
          conflictingCustomer: order.customerName,
          conflictStart: prepStart,
          conflictEnd: cleanupEnd,
          conflictType,
        });
      }
    }
  }

  return conflicts;
}

export function checkAllResourceConflicts(
  resources: OrderResource[],
  orders: Order[],
  excludeOrderId?: string
): Map<string, ConflictInfo[]> {
  const conflictMap = new Map<string, ConflictInfo[]>();

  for (const resource of resources) {
    const conflicts = checkResourceConflict(
      resource.resourceId,
      resource.startTime,
      resource.endTime,
      orders,
      excludeOrderId
    );
    if (conflicts.length > 0) {
      conflictMap.set(resource.resourceId, conflicts);
    }
  }

  return conflictMap;
}

export function hasPhotographyConflict(
  photographerId: string,
  weddingDate: string,
  startTime: string,
  endTime: string,
  orders: Order[],
  excludeOrderId?: string
): boolean {
  for (const order of orders) {
    if (excludeOrderId && order.id === excludeOrderId) continue;
    if (order.status === 'cancelled' || order.status === 'expired') continue;

    for (const resource of order.resources) {
      if (
        resource.resource.type === 'photography' &&
        resource.resourceId === photographerId &&
        resource.status !== 'cancelled'
      ) {
        if (
          isBefore(startTime, resource.endTime) &&
          isAfter(endTime, resource.startTime)
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

export function formatConflictMessage(conflicts: ConflictInfo[]): string {
  if (conflicts.length === 0) return '';

  const messages = conflicts.map((c) => {
    const typeMap = {
      preparation: '准备期',
      service: '服务期',
      cleanup: '清场期',
    };
    return `${c.resourceName}(${c.conflictingCustomer}-${c.conflictingOrderNo}) ${typeMap[c.conflictType]}冲突: ${formatDateTime(c.conflictStart)} - ${formatDateTime(c.conflictEnd)}`;
  });

  return messages.join('\n');
}

export function getResourcesByType(
  resources: OrderResource[],
  type: ResourceType
): OrderResource[] {
  return resources.filter((r) => r.resource.type === type);
}

export function checkPartialRescheduleConflicts(
  resourcesToReschedule: OrderResource[],
  orders: Order[],
  excludeOrderId: string,
  rescheduleResourceIds: string[]
): ConflictInfo[] {
  const allConflicts: ConflictInfo[] = [];

  for (const resource of resourcesToReschedule) {
    if (!rescheduleResourceIds.includes(resource.resourceId)) continue;

    const conflicts = checkResourceConflict(
      resource.resourceId,
      resource.startTime,
      resource.endTime,
      orders,
      excludeOrderId
    );

    allConflicts.push(...conflicts);
  }

  return allConflicts;
}
