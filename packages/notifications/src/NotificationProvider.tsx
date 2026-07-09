"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { NotificationContext } from "./NotificationContext";
import { NotificationHistory } from "./NotificationHistory";
import { NotificationStore } from "./NotificationStore";
import type { Notification, NotificationFilter, NotificationInput } from "./NotificationType";

export interface NotificationProviderProps {
  children: ReactNode;
  seedNotifications?: Notification[];
}

export function NotificationProvider({
  children,
  seedNotifications = [],
}: NotificationProviderProps) {
  const [activeNotificationId, setActiveNotificationId] = useState<string | null>(
    null,
  );
  const [version, setVersion] = useState(0);

  const { store, history } = useMemo(() => {
    const nextStore = new NotificationStore();
    const nextHistory = new NotificationHistory();

    if (seedNotifications.length) {
      nextStore.seed(seedNotifications);
      seedNotifications.forEach((notification) => {
        nextHistory.record("created", notification);
      });
    }

    return { store: nextStore, history: nextHistory };
  }, [seedNotifications]);

  const refresh = useCallback(() => {
    setVersion((current) => current + 1);
  }, []);

  const notifications = useMemo(() => store.list(), [store, version]);
  const unreadCount = useMemo(() => store.unreadCount(), [store, version]);

  const activeNotification =
    notifications.find(
      (notification) => notification.id === activeNotificationId,
    ) ?? null;

  const addNotification = useCallback(
    (input: NotificationInput) => {
      const notification = store.add(input);
      history.record("created", notification);
      refresh();
      return notification;
    },
    [history, refresh, store],
  );

  const markAsRead = useCallback(
    (notificationId: string) => {
      const notification = store.markAsRead(notificationId);
      if (notification) history.record("read", notification);
      refresh();
      return notification;
    },
    [history, refresh, store],
  );

  const markAllAsRead = useCallback(() => {
    const updated = store.markAllAsRead();
    updated.forEach((notification) => history.record("read", notification));
    refresh();
    return updated;
  }, [history, refresh, store]);

  const dismiss = useCallback(
    (notificationId: string) => {
      const notification = store.dismiss(notificationId);
      if (notification) history.record("dismissed", notification);
      refresh();
      return notification;
    },
    [history, refresh, store],
  );

  const archive = useCallback(
    (notificationId: string) => {
      const notification = store.archive(notificationId);
      if (notification) history.record("archived", notification);
      refresh();
      return notification;
    },
    [history, refresh, store],
  );

  const list = useCallback(
    (filter?: NotificationFilter) => store.list(filter),
    [store],
  );

  const getRecentHistory = useCallback(
    (limit?: number) => history.getRecent(limit),
    [history],
  );

  const value = useMemo(
    () => ({
      store,
      history,
      notifications,
      unreadCount,
      activeNotificationId,
      activeNotification,
      selectNotification: setActiveNotificationId,
      clearSelection: () => setActiveNotificationId(null),
      addNotification,
      markAsRead,
      markAllAsRead,
      dismiss,
      archive,
      list,
      getRecentHistory,
    }),
    [
      activeNotification,
      activeNotificationId,
      addNotification,
      archive,
      dismiss,
      getRecentHistory,
      history,
      list,
      markAllAsRead,
      markAsRead,
      notifications,
      store,
      unreadCount,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
