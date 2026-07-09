"use client";

import { useContext } from "react";
import { TaskContext } from "./TaskContext";

export function useTask() {
  const context = useContext(TaskContext);

  if (!context) {
    throw new Error("useTask must be used inside TaskProvider.");
  }

  return context;
}
