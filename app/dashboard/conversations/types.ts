export interface Conversation {
  id: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  participant_phone?: string;
  title?: string;
  status: string;
  channel: string;
  created_at: string;
  updated_at?: string;
}

export type SortColumn = "title" | "created_at" | "updated_at";
export type SortDirection = "asc" | "desc";
export type ViewMode = "table" | "split";
