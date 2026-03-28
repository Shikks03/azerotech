export const VALID_STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled"] as const;
export type Status = typeof VALID_STATUSES[number];
