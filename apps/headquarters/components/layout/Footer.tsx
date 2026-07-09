import { platformVersion } from "@/lib/mock-data";

export function Footer() {
  return (
    <footer className="mt-[var(--ds-space-16)] flex flex-col items-center gap-[var(--ds-space-3)] border-t border-[var(--ds-color-border-subtle)] pt-[var(--ds-space-8)] text-center sm:flex-row sm:justify-between sm:text-left">
      <div className="flex items-center gap-[var(--ds-space-3)]">
        <div className="flex h-[var(--ds-space-8)] w-[var(--ds-space-8)] items-center justify-center rounded-[var(--ds-radius-sm)] bg-[var(--ds-color-brand-primary)]">
          <span className="text-[length:var(--ds-font-size-2xs)] font-[var(--ds-font-weight-bold)] text-[var(--ds-color-text-inverse)]">
            D
          </span>
        </div>
        <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-secondary)]">
          Douglas AI Platform
        </p>
      </div>
      <p className="text-[length:var(--ds-font-size-sm)] tabular-nums text-[var(--ds-color-text-subtle)]">
        Version {platformVersion}
      </p>
    </footer>
  );
}
