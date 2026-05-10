// ── Auth ──────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: "admin" | "member";
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

// ── Project ───────────────────────────────────────────────────────────────────
export type UrgencyLevel = "critical" | "urgent" | "high" | "medium" | "low";
export type ProjectStatus = "active" | "pending" | "blocked" | "done" | "archived";

export interface Project {
  id: number;
  name: string;
  owner: string | null;
  category: string | null;
  color: string | null;
  status: ProjectStatus;
  urgency: UrgencyLevel;
  blockers: string | null;
  next_action: string | null;
  description: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ProjectCreate {
  name: string;
  owner?: string;
  category?: string;
  color?: string;
  status?: ProjectStatus;
  urgency?: UrgencyLevel;
  blockers?: string;
  next_action?: string;
  description?: string;
}

// ── Personnel ─────────────────────────────────────────────────────────────────
export type PersonnelStatus = "active" | "inactive" | "onboarding";

export interface Personnel {
  id: number;
  full_name: string;
  role: string | null;
  area: string | null;
  phone: string | null;
  email: string | null;
  reports_to: string | null;
  availability: string | null;
  status: PersonnelStatus;
  projects: string | null;
  pending_deliverables: string | null;
  contract_status: string | null;
  salary_notes: string | null;
  reliability_notes: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface PersonnelCreate {
  full_name: string;
  role?: string;
  area?: string;
  phone?: string;
  email?: string;
  reports_to?: string;
  availability?: string;
  status?: PersonnelStatus;
  projects?: string;
  pending_deliverables?: string;
  contract_status?: string;
  salary_notes?: string;
  reliability_notes?: string;
  notes?: string;
}

// ── FollowUp ──────────────────────────────────────────────────────────────────
export type FollowUpPriority = "critical" | "urgent" | "high" | "medium" | "low";

export interface FollowUp {
  id: number;
  item: string;
  owner: string | null;
  priority: FollowUpPriority;
  due_date: string | null;
  done: boolean;
  done_at: string | null;
  project_id: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface FollowUpCreate {
  item: string;
  owner?: string;
  priority?: FollowUpPriority;
  due_date?: string;
  project_id?: number;
  notes?: string;
}

// ── Reminder ──────────────────────────────────────────────────────────────────
export type ReminderChannel = "email" | "whatsapp" | "both";

export interface Reminder {
  id: number;
  title: string;
  message: string | null;
  channel: ReminderChannel;
  recipient_email: string | null;
  recipient_phone: string | null;
  scheduled_at: string;
  sent: boolean;
  sent_at: string | null;
  recurrence: string | null;
  is_active: boolean;
  created_at: string;
}

// ── Briefing ──────────────────────────────────────────────────────────────────
export interface Briefing {
  briefing: string;
  generated_at: string;
  project_count: number;
  open_followups: number;
  urgent_count: number;
}

// ── WebSocket ─────────────────────────────────────────────────────────────────
export interface WSEvent {
  event: string;
  data: unknown;
}

// ── Misc ──────────────────────────────────────────────────────────────────────
export interface FollowUpStats {
  total: number;
  open: number;
  urgent: number;
  overdue: number;
}
