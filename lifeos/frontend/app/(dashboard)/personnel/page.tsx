"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import type { Personnel, PersonnelCreate } from "@/types";
import { PageHeader, Button, PlusIcon, StatusDot, SectionLabel, Modal, Field, Input, Textarea, Select, EmptyState } from "@/components/ui";
import toast from "react-hot-toast";

const STATUSES = ["active", "inactive", "onboarding"];
const EMPTY: PersonnelCreate = {
  full_name: "", role: "", area: "", phone: "", email: "",
  reports_to: "Siddhartha", availability: "", status: "active",
  projects: "", pending_deliverables: "", contract_status: "", salary_notes: "", reliability_notes: "", notes: ""
};

export default function PersonnelPage() {
  const [people, setPeople] = useState<Personnel[]>([]);
  const [modal, setModal] = useState<null | "add" | Personnel>(null);
  const [form, setForm] = useState<PersonnelCreate>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await api.get("/personnel/").catch(() => ({ data: [] }));
    setPeople(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY); setModal("add"); };
  const openEdit = (p: Personnel) => {
    setForm({
      full_name: p.full_name, role: p.role || "", area: p.area || "",
      phone: p.phone || "", email: p.email || "", reports_to: p.reports_to || "",
      availability: p.availability || "", status: p.status,
      projects: p.projects || "", pending_deliverables: p.pending_deliverables || "",
      contract_status: p.contract_status || "", salary_notes: p.salary_notes || "",
      reliability_notes: p.reliability_notes || "", notes: p.notes || ""
    });
    setModal(p);
  };

  const save = async () => {
    if (!form.full_name.trim()) return toast.error("Name required");
    setSaving(true);
    try {
      if (modal === "add") {
        await api.post("/personnel/", form);
        toast.success("Person added");
      } else {
        await api.patch(`/personnel/${(modal as Personnel).id}`, form);
        toast.success("Updated");
      }
      setModal(null);
      load();
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!confirm("Remove this person?")) return;
    await api.delete(`/personnel/${id}`).catch(() => toast.error("Failed"));
    toast.success("Removed");
    load();
  };

  const areas = [...new Set(people.map(p => p.area || "Other"))];

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Personnel Registry"
        action={<Button onClick={openAdd}><PlusIcon /> Add Person</Button>}
      />

      {people.length === 0 && <EmptyState message="No team members yet." />}

      {areas.map(area => (
        <div key={area} className="mb-8">
          <SectionLabel>{area.toUpperCase()}</SectionLabel>
          <div className="grid grid-cols-2 gap-4">
            {people.filter(p => (p.area || "Other") === area).map(p => (
              <div key={p.id} className="bg-surface border border-subtle rounded-xl p-5 hover:border-base-300 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-display text-base-800 text-lg">{p.full_name}</div>
                    <div className="text-gold text-xs mt-0.5">{p.role}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusDot status={p.status} />
                    <span className="text-base-400 text-[10px] font-mono">{p.status}</span>
                  </div>
                </div>

                <div className="space-y-1.5 mb-3 text-xs font-mono">
                  {p.phone && <div className="text-base-500">📞 {p.phone}</div>}
                  {p.email && <div className="text-base-500">✉ {p.email}</div>}
                  {p.reports_to && <div className="text-base-400">Reports to: <span className="text-base-500">{p.reports_to}</span></div>}
                  {p.availability && <div className="text-base-400">Availability: <span className="text-base-500">{p.availability}</span></div>}
                </div>

                {p.projects && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {p.projects.split(",").map((proj, i) => (
                      <span key={i} className="bg-base-200 text-base-500 text-[10px] font-mono px-2 py-0.5 rounded">
                        {proj.trim()}
                      </span>
                    ))}
                  </div>
                )}

                {p.pending_deliverables && (
                  <div className="bg-accent-amber/8 border border-accent-amber/20 rounded-lg p-2.5 mb-3">
                    <div className="text-accent-amber text-[10px] font-mono mb-0.5">⏳ PENDING</div>
                    <div className="text-gold-light text-xs">{p.pending_deliverables}</div>
                  </div>
                )}

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>Edit</Button>
                  <Button variant="danger" size="sm" onClick={() => remove(p.id)}>Remove</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {modal && (
        <Modal title={modal === "add" ? "Add Team Member" : `Edit: ${(modal as Personnel).full_name}`} onClose={() => setModal(null)}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name"><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Full name" /></Field>
            <Field label="Role / Title"><Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="e.g. Project Lead" /></Field>
            <Field label="Area / Department"><Input value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} placeholder="e.g. Startups, Warehouse" /></Field>
            <Field label="Reports To"><Input value={form.reports_to} onChange={e => setForm({ ...form, reports_to: e.target.value })} placeholder="e.g. Siddhartha" /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+260..." /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@..." /></Field>
            <Field label="Availability"><Input value={form.availability} onChange={e => setForm({ ...form, availability: e.target.value })} placeholder="e.g. Full-time, Daytime" /></Field>
            <Field label="Status">
              <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Active Projects (comma-separated)">
            <Input value={form.projects} onChange={e => setForm({ ...form, projects: e.target.value })} placeholder="ZamPOS, Align, ..." />
          </Field>
          <Field label="Pending Deliverables">
            <Textarea value={form.pending_deliverables} onChange={e => setForm({ ...form, pending_deliverables: e.target.value })} placeholder="What's outstanding from this person?" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Contract Status"><Input value={form.contract_status} onChange={e => setForm({ ...form, contract_status: e.target.value })} placeholder="e.g. Contractor, Full-time" /></Field>
            <Field label="Salary / Rate Notes"><Input value={form.salary_notes} onChange={e => setForm({ ...form, salary_notes: e.target.value })} placeholder="e.g. K5,000/mo" /></Field>
          </div>
          <Field label="Notes">
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Reliability notes, background, anything relevant..." />
          </Field>
          <Button onClick={save} disabled={saving} className="w-full justify-center mt-2">
            {saving ? "Saving..." : "Save"}
          </Button>
        </Modal>
      )}
    </div>
  );
}
