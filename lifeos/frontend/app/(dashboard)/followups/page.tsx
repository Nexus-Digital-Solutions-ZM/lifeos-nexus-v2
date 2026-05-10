"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import type { FollowUp, FollowUpCreate } from "@/types";
import { PageHeader, Button, PlusIcon, Badge, Modal, Field, Input, Textarea, Select, EmptyState } from "@/components/ui";
import toast from "react-hot-toast";

const PRIORITIES = ["critical", "urgent", "high", "medium", "low"];
const EMPTY: FollowUpCreate = { item: "", owner: "", priority: "high", due_date: "", notes: "" };

export default function FollowUpsPage() {
  const [items, setItems] = useState<FollowUp[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<FollowUpCreate>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"open" | "done">("open");

  const load = async () => {
    const done = filter === "done";
    const res = await api.get(`/followups/?done=${done}`).catch(() => ({ data: [] }));
    setItems(res.data);
  };

  useEffect(() => { load(); }, [filter]);

  const toggle = async (f: FollowUp) => {
    await api.patch(`/followups/${f.id}`, { done: !f.done }).catch(() => toast.error("Failed"));
    load();
    if (!f.done) toast.success("Marked complete ✓");
  };

  const remove = async (id: number) => {
    await api.delete(`/followups/${id}`).catch(() => toast.error("Failed"));
    toast.success("Deleted");
    load();
  };

  const save = async () => {
    if (!form.item.trim()) return toast.error("Item text required");
    setSaving(true);
    try {
      await api.post("/followups/", form);
      toast.success("Follow-up added");
      setModal(false);
      setForm(EMPTY);
      load();
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  // Sort by priority
  const PRIORITY_ORDER: Record<string, number> = { critical: 0, urgent: 1, high: 2, medium: 3, low: 4 };
  const sorted = [...items].sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 5) - (PRIORITY_ORDER[b.priority] ?? 5));

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Follow-Ups & Reminders"
        action={<Button onClick={() => { setForm(EMPTY); setModal(true); }}><PlusIcon /> Add Follow-Up</Button>}
      />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["open", "done"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-mono transition-all ${filter === f ? "bg-gold text-black font-bold" : "bg-surface border border-subtle text-base-500 hover:text-base-700"}`}>
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {sorted.length === 0 && <EmptyState message={filter === "open" ? "No open follow-ups. 🎉" : "No completed items."} />}

      <div className="space-y-2.5">
        {sorted.map(f => (
          <div key={f.id}
            className={`flex items-start gap-4 p-4 border border-subtle rounded-xl transition-colors group ${f.done ? "bg-base opacity-50" : "bg-surface hover:border-base-300"}`}
          >
            {/* Checkbox */}
            <button onClick={() => toggle(f)}
              className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                f.done ? "border-accent-green bg-accent-green/20" : "border-base-300 hover:border-gold"
              }`}
            >
              {f.done && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00D084" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>

            <div className="flex-1 min-w-0">
              <p className={`text-sm leading-snug ${f.done ? "line-through text-base-400" : "text-base-800"}`}>{f.item}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <Badge level={f.priority} />
                {f.owner && <span className="text-base-400 text-xs font-mono">→ {f.owner}</span>}
                {f.due_date && <span className="text-base-400 text-xs font-mono">Due {f.due_date}</span>}
                {f.done_at && <span className="text-accent-green text-xs font-mono">Done {new Date(f.done_at).toLocaleDateString()}</span>}
              </div>
              {f.notes && <p className="text-base-400 text-xs mt-1.5">{f.notes}</p>}
            </div>

            <button onClick={() => remove(f.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-base-300 hover:text-accent-red p-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title="Add Follow-Up" onClose={() => setModal(false)}>
          <Field label="Task / Follow-Up">
            <Textarea value={form.item} onChange={e => setForm({ ...form, item: e.target.value })} placeholder="What needs to be followed up on?" />
          </Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Owner">
              <Input value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} placeholder="Who owns this?" />
            </Field>
            <Field label="Due Date">
              <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
            </Field>
            <Field label="Priority">
              <Select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as any })}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Notes (optional)">
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any additional context..." />
          </Field>
          <Button onClick={save} disabled={saving} className="w-full justify-center mt-2">
            {saving ? "Saving..." : "Add Follow-Up"}
          </Button>
        </Modal>
      )}
    </div>
  );
}
