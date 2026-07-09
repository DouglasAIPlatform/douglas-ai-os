"use client";

import { useContext } from "react";
import { DepartmentSystemContext } from "./DepartmentSystemContext";

export function useDepartments() {
  const context = useContext(DepartmentSystemContext);

  if (!context) {
    throw new Error("useDepartments must be used inside DepartmentProvider.");
  }

  return context;
}
