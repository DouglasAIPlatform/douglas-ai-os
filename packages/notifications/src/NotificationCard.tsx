"use client";

import type { Notification } from "./NotificationType";
import {
  NOTIFICATION_DOMAIN_LABELS,
  NOTIFICATION_PRIORITY_LABELS,
  NOTIFICATION_TYPE_LABELS,
} from "./NotificationType";

interface NotificationCardProps {
  notification: Notification;
  isActive?: boolean;
  onSelect?: (notificationId: string) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onDismiss?: (notificationId: string) => void;
}

export function NotificationCard({
  notification,
  isActive = false,
  onSelect,
  onMarkAsRead,
  onDismiss,
}: NotificationCardProps) {
  return (
    <article
      className={[
        "rounded-[var(--ds-radius-md)] border p-[var(--ds-space-4)] transition-colors",
        isActive
          ? "border-[var(--ds-color-border-strong)] bg-[var(--ds-color-surface)]"
          : "border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)]",
        notification.status === "unread"
          ? "ring-1 ring-[var(--ds-color-border-default)]"
          : "",
      ].join(" ")}
    >
      <div className="flex flex-col gap-[var(--ds-space-3)] sm:flex-row sm:items-start sm:justify-between">
        <button
          className="min-w-0 flex-1 text-left"
          type="button"
          onClick={() => onSelect?.(notification.id)}
        >
          <div className="flex flex-wrap items-center gap-[var(--ds-space-2)]">
            <span className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] uppercase tracking-[var(--ds-letter-spacing-wide)] text-[var(--ds-color-text-muted)]">
              {NOTIFICATION_DOMAIN_LABELS[notification.domain] ?? notification.domain}
            </span>
            <span className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-subtle)]">
              {NOTIFICATION_TYPE_LABELS[notification.type]}
            </span>
          </div>
          <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
            {notification.title}
          </p>
          <p className="mt-[var(--ds-space-1)] line-clamp-2 text-[length:var(--ds-font-size-sm)] leading-[var(--ds-line-height-body)] text-[var(--ds-color-text-muted)]">
            {notification.message}
          </p>
        </button>

        <div className="flex shrink-0 flex-col items-start gap-[var(--ds-space-2)] sm:items-end">
          <span className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-subtle)]">
            {NOTIFICATION_PRIORITY_LABELS[notification.priority]}
          </span>
          <div className="flex flex-wrap gap-[var(--ds-space-2)]">
            {notification.status === "unread" ? (
              <button
                className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)] transition-colors hover:text-[var(--ds-color-text-primary)]"
                type="button"
                onClick={() => onMarkAsRead?.(notification.id)}
              >
                Marcar lida
              </button>
            ) : null}
            <button
              className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)] transition-colors hover:text-[var(--ds-color-text-primary)]"
              type="button"
              onClick={() => onDismiss?.(notification.id)}
            >
              Dispensar
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
