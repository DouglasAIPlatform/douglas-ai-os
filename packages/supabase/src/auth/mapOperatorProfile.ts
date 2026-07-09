import type { OperatorProfileRow } from "../schema";
import type { AuthProfile } from "./AuthTypes";

export function mapOperatorProfileRow(row: OperatorProfileRow): AuthProfile {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    role: row.role,
    status: row.status,
  };
}
