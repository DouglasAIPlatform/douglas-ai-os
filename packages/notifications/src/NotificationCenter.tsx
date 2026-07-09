"use client";

import { NotificationCard } from "./NotificationCard";
import { useNotifications } from "./useNotifications";
import type { NotificationDomain } from "./NotificationType";

interface NotificationCenterProps {
  domainFilter?: NotificationDomain;
  emptyMessage?: string;
}

export function NotificationCenter({
  domainFilter,
  emptyMessage = "Nenhuma notificação no centro.",
}: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    activeNotificationId,
    selectNotification,
    markAsRead,
    markAllAsRead,
    dismiss,
    list,
  } = useNotifications();

  const visibleNotifications = domainFilter
    ? list({ domain: domainFilter })
    : notifications;

  return (
    <section className="space-y-[var(--ds-space-4)]">
      <div className="flex flex-col gap-[var(--ds-space-3)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
            Notification Center
          </p>
          <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-muted)]">
            Infraestrutura mockada — {unreadCount} não lida(s).
          </p>
        </div>
        {unreadCount > 0 ? (
          <button
            className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)] transition-colors hover:text-[var(--ds-color-text-primary)]"
            type="button"
            onClick={() => markAllAsRead()}
          >
            Marcar todas como lidas
          </button>
        ) : null}
      </div>

      {visibleNotifications.length ? (
        <div className="space-y-[var(--ds-space-2)]">
          {visibleNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              isActive={notification.id === activeNotificationId}
              onSelect={selectNotification}
              onMarkAsRead={markAsRead}
              onDismiss={dismiss}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[var(--ds-radius-md)] border border-dashed border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]">
          <p className="text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-muted)]">
            {emptyMessage}
          </p>
        </div>
      )}
    </section>
  );
}
