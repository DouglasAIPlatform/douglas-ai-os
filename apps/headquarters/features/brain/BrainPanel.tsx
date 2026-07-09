"use client";

import { SearchPanel } from "@/features/search-engine/SearchPanel";
import { BrainOverview } from "./BrainOverview";

export function BrainPanel() {
  return (
    <>
      <BrainOverview />
      <SearchPanel />
    </>
  );
}
