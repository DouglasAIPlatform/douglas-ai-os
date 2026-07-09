import type { Notification, NotificationStatus } from "./NotificationType";

export type NotificationHistoryAction =
  | "created"
  | "read"
  | "dismissed"
  | "archived"
  | "removed";

export interface NotificationHistoryEntry {
  id: string;
  notificationId: string;
  action: NotificationHistoryAction;
  snapshot: Notification;
  createdAt: string;
}

export class NotificationHistory {
  private entries: NotificationHistoryEntry[] = [];
  private readonly capacity: number;

  constructor(capacity = 500) {
    this.capacity = capacity;
  }

  record(
    action: NotificationHistoryAction,
    snapshot: Notification,
  ): NotificationHistoryEntry {
    const entry: NotificationHistoryEntry = {
      id: `notification-history:${Date.now()}:${this.entries.length}`,
      notificationId: snapshot.id,
      action,
      snapshot,
      createdAt: new Date().toISOString(),
    };

    this.entries = [entry, ...this.entries].slice(0, this.capacity);
    return entry;
  }

  getByNotificationId(notificationId: string): NotificationHistoryEntry[] {
    return this.entries.filter((entry) => entry.notificationId === notificationId);
  }

  getByAction(action: NotificationHistoryAction): NotificationHistoryEntry[] {
    return this.entries.filter((entry) => entry.action === action);
  }

  getRecent(limit = 20): NotificationHistoryEntry[] {
    return this.entries.slice(0, limit);
  }

  getAll(): NotificationHistoryEntry[] {
    return [...this.entries];
  }

  count(): number {
    return this.entries.length;
  }

  clear(): void {
    this.entries = [];
  }
}

export function mapStatusToHistoryAction(
  status: NotificationStatus,
): NotificationHistoryAction | null {
  switch (status) {
    case "read":
      return "read";
    case "dismissed":
      return "dismissed";
    case "archived":
      return "archived";
    default:
      return null;
  }
}
