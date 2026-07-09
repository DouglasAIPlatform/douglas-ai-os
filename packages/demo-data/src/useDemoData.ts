"use client";

import { useContext } from "react";
import { DemoDataContext } from "./DemoDataContext";

export function useDemoData() {
  const context = useContext(DemoDataContext);
  if (!context) {
    throw new Error("useDemoData must be used within DemoDataProvider");
  }
  return context;
}
