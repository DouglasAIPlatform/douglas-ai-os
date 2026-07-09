import type {
  Notification,
  NotificationFilter,
  NotificationInput,
  NotificationStatus,
} from "./NotificationType";

function matchesFilter(
  notification: Notification,
  filter: NotificationFilter = {},
): boolean {
  if (filter.type && notification.type !== filter.type) return false;
  if (filter.priority && notification.priority !== filter.priority) return false;
  if (filter.channel && notification.channel !== filter.channel) return false;
  if (filter.domain && notification.domain !== filter.domain) return false;
  if (filter.status && notification.status !== filter.status) return false;
  return true;
}

function sortNotifications(notifications: Notification[]): Notification[] {
  const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };

  return [...notifications].sort(
    (a, b) =>
      priorityOrder[a.priority] - priorityOrder[b.priority] ||
      b.createdAt.localeCompare(a.createdAt),
  );
}

export class NotificationStore {
  private notifications = new Map<string, Notification>();

  seed(notifications: Notification[]): void {
    notifications.forEach((notification) => {
      this.notifications.set(notification.id, notification);
    });
  }

  add(input: NotificationInput): Notification {
    const now = new Date().toISOString();
    const notification: Notification = {
      id: `notification:${Date.now()}:${this.notifications.size}`,
      type: input.type,
      priority: input.priority ?? "normal",
      channel: input.channel ?? "in_app",
      domain: input.domain,
      title: input.title,
      message: input.message,
      status: "unread",
      createdAt: now,
      metadata: input.metadata ?? {},
    };

    this.notifications.set(notification.id, notification);
    return notification;
  }

  get(id: string): Notification | undefined {
    return this.notifications.get(id);
  }

  list(filter?: NotificationFilter): Notification[] {
    const items = Array.from(this.notifications.values()).filter((notification) =>
      matchesFilter(notification, filter),
    );

    return sortNotifications(items);
  }

  markAsRead(id: string): Notification | undefined {
    return this.updateStatus(id, "read", { readAt: new Date().toISOString() });
  }

  markAllAsRead(): Notification[] {
    return this.list({ status: "unread" }).map(
      (notification) => this.markAsRead(notification.id)!,
    );
  }

  dismiss(id: string): Notification | undefined {
    return this.updateStatus(id, "dismissed", {
      dismissedAt: new Date().toISOString(),
    });
  }

  archive(id: string): Notification | undefined {
    return this.updateStatus(id, "archived");
  }

  remove(id: string): boolean {
    return this.notifications.delete(id);
  }

  count(filter?: NotificationFilter): number {
    return this.list(filter).length;
  }

  unreadCount(): number {
    return this.count({ status: "unread" });
  }

  clear(): void {
    this.notifications.clear();
  }

  private updateStatus(
    id: string,
    status: NotificationStatus,
    timestamps: Partial<Pick<Notification, "readAt" | "dismissedAt">> = {},
  ): Notification | undefined {
    const current = this.notifications.get(id);
    if (!current) return undefined;

    const updated: Notification = {
      ...current,
      status,
      ...timestamps,
    };

    this.notifications.set(id, updated);
    return updated;
  }
}
