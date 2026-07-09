const accentPalettes = [
  { bg: "bg-[image:var(--ds-gradient-violet)]" },
  { bg: "bg-[image:var(--ds-gradient-sky)]" },
  { bg: "bg-[image:var(--ds-gradient-emerald)]" },
  { bg: "bg-[image:var(--ds-gradient-amber)]" },
  { bg: "bg-[image:var(--ds-gradient-rose)]" },
  { bg: "bg-[image:var(--ds-gradient-fuchsia)]" },
  { bg: "bg-[image:var(--ds-gradient-cyan)]" },
  { bg: "bg-[image:var(--ds-gradient-neutral)]" },
] as const;

function hashString(value: string): number {
  return value.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function getAccentPalette(name: string) {
  return accentPalettes[hashString(name) % accentPalettes.length];
}
