import { Header as PlatformHeader } from "@douglas/ui";
import { CommandPaletteActions } from "@/features/command-palette/CommandPaletteActions";
import { formatCurrentDate } from "@/lib/format-date";
import { userName } from "@/lib/mock-data";

export function Header() {
  const currentDate = formatCurrentDate();
  const currentDateTime = new Date().toISOString().split("T")[0];

  return (
    <PlatformHeader
      eyebrow="Douglas AI"
      title="Centro de Comando"
      greeting={`Bom dia ${userName} 👋`}
      description="Visão institucional da operação, agentes e sistemas da Douglas AI Platform."
      date={currentDate}
      dateTime={currentDateTime}
      statusLabel="Status Geral: Todos os sistemas operacionais."
      statusVariant="operational"
      userName={userName}
      userSubtitle="Online"
      userInitials="DA"
      actions={<CommandPaletteActions />}
    />
  );
}
