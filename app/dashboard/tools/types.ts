export type ReminderFreqType = "once" | "daily" | "weekly" | "hourly" | "interval" | "random_interval" | "monthly";
export type ReminderTimeMode = "exact" | "random_window";
export type ReminderVariableType = "text" | "date_now" | "time_now" | "datetime_now" | "number" | "url";

export interface ReminderVariableItem {
  id: string;
  key: string;
  type: ReminderVariableType;
  value: string;
}

export interface CronReminderItem {
  id: string;
  title: string;
  description: string | null;
  message: string;
  cron_expression: string;
  timezone: string;
  channel_type: "WHATSAPP" | "TELEGRAM";
  channel_id: string;
  target_recipients: string | null;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  last_status: string | null;
  last_error: string | null;
  run_count: number;
  cmetadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ChannelOption {
  id: string;
  name: string;
  type: "WHATSAPP" | "TELEGRAM";
  boundPhone?: string;
  autoReplyEnabled?: boolean;
}

export interface FunctionToolItem {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  category: string;
  is_enabled: boolean;
  parameters_json: string | null;
  endpoint_url: string | null;
  http_method: string | null;
  created_at: string;
  updated_at: string;
}

export interface McpToolItem {
  name: string;
  description?: string;
}

export interface McpServerItem {
  id: string;
  name: string;
  transport: string;
  endpoint_url: string;
  is_enabled: boolean;
  env_json: string;
  tools?: (string | McpToolItem)[];
  created_at?: string;
}

export interface WaGroupItem {
  id: string;
  subject: string;
  participantsCount: number;
}

export interface ManualCronSettings {
  freqType: ReminderFreqType;
  timeMode: ReminderTimeMode;
  time: string;
  endTime: string;
  days: number[];
  minute: number;
  intervalMins: number;
  dayOfMonth: number;
  minInterval: number;
  maxInterval: number;
  intervalUnit: "minutes" | "hours";
  useTimeWindow: boolean;
  windowStartTime: string;
  windowEndTime: string;
  targetDate?: string;
}

export type McpTemplateType = "stdio" | "streamable_http";

export interface McpServerPayload {
  name: string;
  transport: "STDIO" | "Streamable HTTP";
  endpoint_url: string;
  env_json: string;
  tools: (string | McpToolItem)[];
}
