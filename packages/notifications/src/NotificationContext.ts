"use client";

import { createContext } from "react";
import type { NotificationHistory } from "./NotificationHistory";
import type { NotificationStore } from "./NotificationStore";
import type {
  Notification,
  NotificationFilter,
  NotificationInput,
} from "./NotificationType";
import type { NotificationHistoryEntry } from "./NotificationHistory";

export interface NotificationContextValue {
  store: NotificationStore;
  history: NotificationHistory;
  notifications: Notification[];
  unreadCount: number;
  activeNotificationId: string | null;
  activeNotification: Notification | null;
  selectNotification: (notificationId: string) => void;
  clearSelection: () => void;
  addNotification: (input: NotificationInput) => Notification;
  markAsRead: (notificationId: string) => Notification | undefined;
  markAllAsRead: () => Notification[];
  dismiss: (notificationId: string) => Notification | undefined;
  archive: (notificationId: string) => Notification | undefined;
  list: (filter?: NotificationFilter) => Notification[];
  getRecentHistory: (limit?: number) => NotificationHistoryEntry[];
}

export const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);
