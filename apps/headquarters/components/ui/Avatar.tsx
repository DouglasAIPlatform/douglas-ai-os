import { cn } from "@douglas/ui";
import { getAccentPalette, getInitials } from "@/lib/visual-helpers";

interface AvatarProps {
  name: string;
  size?: "sm" | "md";
  className?: string;
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  const palette = getAccentPalette(name);
  const initials = getInitials(name);

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[var(--ds-radius-md)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-inverse)] shadow-[var(--ds-elevation-xs)]",
        palette.bg,
        size === "sm"
          ? "h-[var(--ds-space-8)] w-[var(--ds-space-8)] text-[length:var(--ds-font-size-2xs)]"
          : "h-[var(--ds-space-10)] w-[var(--ds-space-10)] text-[length:var(--ds-font-size-xs)]",
        className,
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}
