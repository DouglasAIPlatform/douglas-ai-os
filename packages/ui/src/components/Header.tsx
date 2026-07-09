import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

export type StatusIndicatorVariant = "online" | "operational" | "idle" | "offline";

export interface HeaderProps extends HTMLAttributes<HTMLElement> {
  title: string;
  eyebrow?: string;
  greeting?: string;
  description?: string;
  date?: string;
  dateTime?: string;
  statusLabel?: string;
  statusVariant?: StatusIndicatorVariant;
  userName?: string;
  userSubtitle?: string;
  userInitials?: string;
  actions?: ReactNode;
}

export interface HeaderTitleProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  eyebrow?: string;
  greeting?: string;
  description?: string;
}

export interface HeaderActionsProps extends HTMLAttributes<HTMLDivElement> {}

export interface UserAvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  initials?: string;
  status?: StatusIndicatorVariant;
}

export interface StatusIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  variant?: StatusIndicatorVariant;
}

export interface DateIndicatorProps extends HTMLAttributes<HTMLTimeElement> {
  label: string;
  dateTime?: string;
}

const statusStyles: Record<StatusIndicatorVariant, string> = {
  online: "bg-[var(--ds-color-success)] shadow-[var(--ds-shadow-status-success)]",
  operational:
    "bg-[var(--ds-color-success)] shadow-[var(--ds-shadow-status-success)]",
  idle: "bg-[var(--ds-color-warning)] shadow-[var(--ds-shadow-status-warning)]",
  offline: "bg-[var(--ds-color-text-subtle)]",
};

const headerActionClassName =
  "inline-flex h-[var(--ds-space-10)] items-center gap-[var(--ds-space-2)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface-glass)] px-[var(--ds-space-3)] text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-muted)] shadow-[var(--ds-elevation-xs)] backdrop-blur-sm transition-colors duration-[var(--ds-duration-normal)] ease-[var(--ds-ease-standard)] hover:bg-[var(--ds-color-surface)] hover:text-[var(--ds-color-text-primary)] focus-visible:outline-none focus-visible:shadow-[var(--ds-shadow-focus)]";

function CalendarIcon() {
  return (
    <svg
      aria-hidden
      className="h-[var(--ds-space-3-5)] w-[var(--ds-space-3-5)]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 2v4m8-4v4M3 10h18M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden
      className="h-[var(--ds-space-3-5)] w-[var(--ds-space-3-5)]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-4.35-4.35M10.875 18.75a7.875 7.875 0 1 1 0-15.75 7.875 7.875 0 0 1 0 15.75Z"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      aria-hidden
      className="h-[var(--ds-space-3-5)] w-[var(--ds-space-3-5)]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022 23.848 23.848 0 0 0 5.455 1.31m5.714 0a3 3 0 0 1-5.714 0"
      />
    </svg>
  );
}

function CommandIcon() {
  return (
    <svg
      aria-hidden
      className="h-[var(--ds-space-3-5)] w-[var(--ds-space-3-5)]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 6.75A3.75 3.75 0 1 0 5.25 10.5H9V6.75Zm0 0A3.75 3.75 0 1 1 12.75 10.5H9V6.75Zm0 10.5A3.75 3.75 0 1 1 5.25 13.5H9v3.75Zm0 0A3.75 3.75 0 1 0 12.75 13.5H9v3.75Z"
      />
    </svg>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function HeaderTitle({
  title,
  eyebrow,
  greeting,
  description,
  className,
  ...props
}: HeaderTitleProps) {
  return (
    <div className={cn("min-w-0", className)} {...props}>
      {eyebrow ? (
        <p className="text-[length:var(--ds-font-size-2xs)] font-[var(--ds-font-weight-semibold)] uppercase tracking-[var(--ds-letter-spacing-brand)] text-[var(--ds-color-text-subtle)]">
          {eyebrow}
        </p>
      ) : null}
      <div className="mt-[var(--ds-space-1)] flex flex-col gap-[var(--ds-space-2)] lg:flex-row lg:items-end lg:gap-[var(--ds-space-4)]">
        <h1 className="text-[length:var(--ds-font-size-2xl)] font-[var(--ds-font-weight-semibold)] leading-[var(--ds-line-height-heading)] tracking-[var(--ds-letter-spacing-tight)] text-[var(--ds-color-text-primary)] sm:text-[length:var(--ds-font-size-3xl)]">
          {title}
        </h1>
        {greeting ? (
          <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-muted)]">
            {greeting}
          </p>
        ) : null}
      </div>
      {description ? (
        <p className="mt-[var(--ds-space-2)] max-w-2xl text-[length:var(--ds-font-size-sm)] leading-[var(--ds-line-height-body)] text-[var(--ds-color-text-muted)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function HeaderActions({
  className,
  children,
  ...props
}: HeaderActionsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-[var(--ds-space-2)] sm:flex-nowrap",
        className,
      )}
      {...props}
    >
      {children ?? (
        <>
          <button
            aria-label="Pesquisa global"
            className={headerActionClassName}
            type="button"
          >
            <SearchIcon />
            <span className="hidden sm:inline">Pesquisar</span>
          </button>
          <button
            aria-label="Command Palette"
            className={headerActionClassName}
            type="button"
          >
            <CommandIcon />
            <span className="hidden sm:inline">Command</span>
          </button>
          <button
            aria-label="Notificações"
            className={cn(headerActionClassName, "w-[var(--ds-space-10)] px-0")}
            type="button"
          >
            <BellIcon />
          </button>
        </>
      )}
    </div>
  );
}

export function StatusIndicator({
  label,
  variant = "operational",
  className,
  ...props
}: StatusIndicatorProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-[var(--ds-space-2)] rounded-[var(--ds-radius-full)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface-glass)] px-[var(--ds-space-3)] py-[var(--ds-space-1-5)] text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-secondary)] shadow-[var(--ds-elevation-xs)] backdrop-blur-sm",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "h-[var(--ds-space-1-5)] w-[var(--ds-space-1-5)] rounded-[var(--ds-radius-full)]",
          statusStyles[variant],
        )}
      />
      {label}
    </div>
  );
}

export function DateIndicator({
  label,
  dateTime,
  className,
  ...props
}: DateIndicatorProps) {
  return (
    <time
      dateTime={dateTime}
      className={cn(
        "inline-flex items-center gap-[var(--ds-space-2)] rounded-[var(--ds-radius-full)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface-glass)] px-[var(--ds-space-3)] py-[var(--ds-space-1-5)] text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] capitalize text-[var(--ds-color-text-secondary)] shadow-[var(--ds-elevation-xs)] backdrop-blur-sm",
        className,
      )}
      {...props}
    >
      <CalendarIcon />
      {label}
    </time>
  );
}

export function UserAvatar({
  name,
  initials,
  status = "online",
  className,
  ...props
}: UserAvatarProps) {
  return (
    <div
      className={cn(
        "relative inline-flex h-[var(--ds-space-10)] w-[var(--ds-space-10)] shrink-0",
        className,
      )}
      title={name}
      {...props}
    >
      <div className="flex h-[var(--ds-space-10)] w-[var(--ds-space-10)] items-center justify-center rounded-[var(--ds-radius-2xl)] bg-[image:var(--ds-gradient-brand)] text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-inverse)] shadow-[var(--ds-elevation-md)]">
        {initials ?? getInitials(name)}
      </div>
      <span className="absolute -bottom-[var(--ds-space-0-5)] -right-[var(--ds-space-0-5)] flex h-[var(--ds-space-3-5)] w-[var(--ds-space-3-5)] items-center justify-center rounded-[var(--ds-radius-full)] border-2 border-[var(--ds-color-surface)] bg-[var(--ds-color-surface)]">
        <span
          aria-hidden
          className={cn(
            "h-[var(--ds-space-2)] w-[var(--ds-space-2)] rounded-[var(--ds-radius-full)]",
            statusStyles[status],
          )}
        />
      </span>
    </div>
  );
}

export function Header({
  title,
  eyebrow,
  greeting,
  description,
  date,
  dateTime,
  statusLabel,
  statusVariant = "operational",
  userName,
  userSubtitle,
  userInitials,
  actions,
  className,
  children,
  ...props
}: HeaderProps) {
  return (
    <header
      className={cn(
        "mb-[var(--ds-space-10)] rounded-[var(--ds-radius-panel)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-glass)] p-[var(--ds-space-4)] shadow-[var(--ds-elevation-sm)] backdrop-blur-xl sm:p-[var(--ds-space-5)]",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-[var(--ds-space-5)] xl:flex-row xl:items-center xl:justify-between">
        <HeaderTitle
          title={title}
          eyebrow={eyebrow}
          greeting={greeting}
          description={description}
        />
        <div className="flex flex-col gap-[var(--ds-space-3)] lg:flex-row lg:items-center">
          <HeaderActions>{actions}</HeaderActions>
          {(date || statusLabel || userName) && (
            <div className="flex flex-wrap items-center gap-[var(--ds-space-2)]">
              {date ? <DateIndicator label={date} dateTime={dateTime} /> : null}
              {statusLabel ? (
                <StatusIndicator
                  label={statusLabel}
                  variant={statusVariant}
                />
              ) : null}
              {userName ? (
                <div className="inline-flex items-center gap-[var(--ds-space-3)] rounded-[var(--ds-radius-2xl)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface-glass)] px-[var(--ds-space-2-5)] py-[var(--ds-space-2)] shadow-[var(--ds-elevation-xs)] backdrop-blur-sm">
                  <div className="hidden min-w-0 text-right sm:block">
                    <p className="truncate text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
                      {userName}
                    </p>
                    {userSubtitle ? (
                      <p className="truncate text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                        {userSubtitle}
                      </p>
                    ) : null}
                  </div>
                  <UserAvatar
                    name={userName}
                    initials={userInitials}
                    status="online"
                  />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
      {children}
    </header>
  );
}
