import type {
  ReminderFreqType,
  ReminderTimeMode,
  ReminderVariableItem,
} from "../../types";

export interface ReminderValidationInput {
  title: string;
  timezone: string;
  variables: ReminderVariableItem[];
  freqType: ReminderFreqType;
  timeMode: ReminderTimeMode;
  time: string;
  endTime: string;
  days: number[];
  minInterval: number;
  maxInterval: number;
  intervalUnit: "minutes" | "hours";
  useTimeWindow: boolean;
  windowStartTime: string;
  windowEndTime: string;
  message: string;
  recipientMode: "specific" | "all";
  recipientList: string[];
  blacklistList?: string[];
  allowPrivate?: boolean;
  allowGroup?: boolean;
}

export interface ReminderPayloadInput {
  title: string;
  message: string;
  timezone: string;
  channelType: "WHATSAPP" | "TELEGRAM";
  channelId: string;
  isActive: boolean;
  recipientMode: "specific" | "all";
  allowPrivate: boolean;
  allowGroup: boolean;
  recipientList: string[];
  blacklistList: string[];
  freqType: ReminderFreqType;
  timeMode: ReminderTimeMode;
  time: string;
  endTime: string;
  days: number[];
  minute: number;
  intervalMinutes: number;
  dayOfMonth: number;
  minInterval: number;
  maxInterval: number;
  intervalUnit: "minutes" | "hours";
  useTimeWindow: boolean;
  windowStartTime: string;
  windowEndTime: string;
  targetDate: string;
  maxRuns: string;
  variables: ReminderVariableItem[];
}

export interface ReminderFormState extends ReminderPayloadInput {
  editingRecipientIdx: number | null;
  editingBlacklistIdx: number | null;
  countryCode: string;
  formError: string | null;
}
