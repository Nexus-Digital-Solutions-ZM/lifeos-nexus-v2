"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import type { Reminder } from "@/types";
import { PageHeader, Button, PlusIcon, Modal, Field, Input, Textarea, Select, EmptyState } from "@/components/ui";
import { format } from "date-fns";
import toast from "react-hot-toast";

const CHANNELS = ["email", "whatsapp", "both"];
const RECURRENCES = ["none", "daily", "weekly"];

const EMPTY = {
  title: "", message: "", channel: "email", recipient_email: "",
  recipient_phone: "", scheduled_at: "", recurrence: "none"
};

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await api.get("/reminders/").catch(() => ({ data: [] }));
    setReminders(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.title.trim() || !form.scheduled_at) return toast.error("Title and date required");
    setSaving(true);
    try {
      await api.post("/reminders/", { ...form, scheduled_at: new Date(form.scheduled_at).toISOString() });
      toast.success("Reminder scheduled");
      setModal(false);
      setForm(EMPTY);
      load();
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  const cancel = async (id: number) => {
    await api.delete(`/reminders/${id}`).catch(() => toast.error("Failed"));
    toast.success("Reminder cancelled");
    load();
  };

  const upcoming = reminders.filter(r => !r.sent && r.is_active);
  const sent = reminders.filter(r => r.sent);

  const channelIcon = (c: string) => c === "email" ? "✉" : c === "whatsapp" ? "💬" : "✉💬";

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Reminders"
        action={<Button onClick={() => { setForm(EMPTY); setModal(true); }}><PlusIcon /> Schedule Reminder</Button>}
      />

      {/* Upcoming */}
      {upcoming.length === 0 ? (
        <EmptyState message="No upcoming reminders scheduled." />
      ) : (
        <div className="space-y-3 mb-8">
          {upcoming.map(r => (
            <div key={r.id} className="bg-surface border border-subtle rounded-xl p-5 flex items-start gap-4 hover:border-base-300 transition-colors group">
              <div className="text-2xl">{channelIcon(r.channel)}</div>
              <div className="flex-1">
                <div className="text-base-800 font-medium">{r.title}</div>
                {r.message && <div className="text-base-500 text-sm mt-1">{r.message}</div>}
                <div className="flex items-center gap-4 mt-2 text-xs font-mono">
                  <span className="text-gold">{format(new Date(r.scheduled_at), "EEE dd MMM yyyy · HH:mm")}</span>
                  {r.recurrence && r.recurrence !== "none" && (
                    <span className="text-accent-teal bg-accent-teal/10 px-2 py-0.5 rounded">↻ {r.recurrence}</span>
                  )}
                  {r.recipient_email && <span className="text-base-400">→ {r.recipient_email}</span>}
                  {r.recipient_phone && <span className="text-base-400">→ {r.recipient_phone}</span>}
                </div>
              </div>
              <button onClick={() => cancel(r.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-base-300 hover:text-accent-red p-1 text-xs font-mono">
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Sent */}
      {sent.length > 0 && (
        <>
          <div className="text-base-400 text-[10px] font-mono uppercase tracking-widest mb-3">── SENT</div>
          <div className="space-y-2 opacity-50">
            {sent.slice(0, 5).map(r => (
              <div key={r.id} className="bg-base border border-subtle rounded-xl px-5 py-3 flex items-center gap-3">
                <span className="text-base">{channelIcon(r.channel)}</span>
                <span className="text-base-500 text-sm flex-1">{r.title}</span>
                <span className="text-base-400 text-xs font-mono">{r.sent_at ? format(new Date(r.sent_at), "dd MMM · HH:mm") : "—"}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {modal && (
        <Modal title="Schedule Reminder" onClose={() => setModal(false)}>
          <Field label="Title"><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Follow up with mechanic" /></Field>
          <Field label="Message (optional)"><Textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Additional details..." /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Scheduled At">
              <Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} />
            </Field>
            <Field label="Recurrence">
              <Select value={form.recurrence} onChange={e => setForm({ ...form, recurrence: e.target.value })}>
                {RECURRENCES.map(r => <option key={r} value={r}>{r}</option>)}
              </Select>
            </Field>
            <Field label="Channel">
              <Select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })}>
                {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
          </div>
          {(form.channel === "email" || form.channel === "both") && (
            <Field label="Recipient Email"><Input type="email" value={form.recipient_email} onChange={e => setForm({ ...form, recipient_email: e.target.value })} placeholder="email@..." /></Field>
          )}
          {(form.channel === "whatsapp" || form.channel === "both") && (
            <Field label="Recipient Phone"><Input value={form.recipient_phone} onChange={e => setForm({ ...form, recipient_phone: e.target.value })} placeholder="+260..." /></Field>
          )}
          <Button onClick={save} disabled={saving} className="w-full justify-center mt-2">
            {saving ? "Scheduling..." : "Schedule Reminder"}
          </Button>
        </Modal>
      )}
    </div>
  );
}
