"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import type { Project, ProjectCreate } from "@/types";
import { PageHeader, Button, PlusIcon, Badge, StatusDot, SectionLabel, Modal, Field, Input, Textarea, Select, EmptyState } from "@/components/ui";
import toast from "react-hot-toast";

const CATEGORIES = ["startup", "music-ai", "finance", "agri", "lifestyle", "other"];
const URGENCIES = ["critical", "urgent", "high", "medium", "low"];
const STATUSES = ["active", "pending", "blocked", "done", "archived"];
const COLORS = ["#4ECDC4","#FF6B6B","#A78BFA","#F59E0B","#10B981","#60A5FA","#F97316","#84CC16","#06B6D4","#EAB308","#FF2D55","#C49E52"];

const EMPTY_FORM: ProjectCreate = {
  name: "", owner: "", category: "startup", color: "#4ECDC4",
  status: "active", urgency: "medium", blockers: "", next_action: "", description: ""
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [modal, setModal] = useState<null | "add" | Project>(null);
  const [form, setForm] = useState<ProjectCreate>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = async () => {
    const res = await api.get("/projects/").catch(() => ({ data: [] }));
    setProjects(res.data);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY_FORM); setModal("add"); };
  const openEdit = (p: Project) => {
    setForm({ name: p.name, owner: p.owner || "", category: p.category || "startup", color: p.color || "#4ECDC4", status: p.status, urgency: p.urgency, blockers: p.blockers || "", next_action: p.next_action || "", description: p.description || "" });
    setModal(p);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Project name required");
    setSaving(true);
    try {
      if (modal === "add") {
        await api.post("/projects/", form);
        toast.success("Project created");
      } else {
        await api.patch(`/projects/${(modal as Project).id}`, form);
        toast.success("Project updated");
      }
      setModal(null);
      load();
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this project?")) return;
    setDeleting(id);
    try {
      await api.delete(`/projects/${id}`);
      toast.success("Project deleted");
      load();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const grouped = CATEGORIES.reduce<Record<string, Project[]>>((acc, cat) => {
    const items = projects.filter(p => p.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});
  // catch uncategorized
  const others = projects.filter(p => !CATEGORIES.includes(p.category || ""));
  if (others.length) grouped["other"] = [...(grouped["other"] || []), ...others];

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Active Projects"
        action={
          <Button onClick={openAdd}>
            <PlusIcon /> Add Project
          </Button>
        }
      />

      {projects.length === 0 && <EmptyState message="No projects yet — add your first one." />}

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="mb-8">
          <SectionLabel>{cat.replace("-", " / ").toUpperCase()} ({items.length})</SectionLabel>
          <div className="space-y-3">
            {items.map(p => (
              <div key={p.id} className="bg-surface border border-subtle rounded-xl px-5 py-4 flex items-center gap-4 hover:border-base-300 transition-colors group">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.color || "#4ECDC4", boxShadow: `0 0 8px ${p.color}50` }} />
                <div className="flex-1 min-w-0">
                  <div className="text-base-800 font-medium">{p.name}</div>
                  <div className="text-base-400 text-xs font-mono mt-0.5 flex items-center gap-3">
                    <span>Owner: {p.owner || "TBD"}</span>
                    {p.blockers && <span className="text-accent-red">⚠ {p.blockers}</span>}
                    {p.next_action && <span className="text-gold">→ {p.next_action}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusDot status={p.status} />
                  <span className="text-base-400 text-xs font-mono">{p.status}</span>
                </div>
                <Badge level={p.urgency} />
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>Edit</Button>
                  <Button variant="danger" size="sm" onClick={() => remove(p.id)} disabled={deleting === p.id}>
                    {deleting === p.id ? "..." : "Del"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {modal && (
        <Modal title={modal === "add" ? "Add Project" : `Edit: ${(modal as Project).name}`} onClose={() => setModal(null)}>
          <Field label="Project Name">
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. ZamPOS" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Owner">
              <Input value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} placeholder="e.g. Simeon" />
            </Field>
            <Field label="Category">
              <Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Urgency">
              <Select value={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.value as any })}>
                {URGENCIES.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Color">
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm({ ...form, color: c })}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{ background: c, borderColor: form.color === c ? "#fff" : "transparent" }}
                />
              ))}
            </div>
          </Field>
          <Field label="Blockers">
            <Input value={form.blockers} onChange={e => setForm({ ...form, blockers: e.target.value })} placeholder="What's blocking this?" />
          </Field>
          <Field label="Next Action">
            <Input value={form.next_action} onChange={e => setForm({ ...form, next_action: e.target.value })} placeholder="What needs to happen next?" />
          </Field>
          <Field label="Description">
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional notes..." />
          </Field>
          <Button onClick={save} disabled={saving} className="w-full justify-center mt-2">
            {saving ? "Saving..." : "Save Project"}
          </Button>
        </Modal>
      )}
    </div>
  );
}
