export function PageBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[image:var(--ds-background-grid)] [background-size:var(--ds-background-grid-size)]" />
      <div className="absolute -left-[var(--ds-space-16)] top-0 h-[30rem] w-[30rem] rounded-[var(--ds-radius-full)] bg-[var(--ds-background-orb-violet)] blur-3xl" />
      <div className="absolute -right-[var(--ds-space-16)] top-[var(--ds-space-16)] h-[26.25rem] w-[26.25rem] rounded-[var(--ds-radius-full)] bg-[var(--ds-background-orb-sky)] blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-[22.5rem] w-[22.5rem] rounded-[var(--ds-radius-full)] bg-[var(--ds-background-orb-emerald)] blur-3xl" />
    </div>
  );
}
