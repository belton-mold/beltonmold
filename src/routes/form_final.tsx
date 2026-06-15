import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/ui/AppLayout";
import { supabase } from "@/intregetion_Supabase/client";
import { PARAMETERS, SHIFTS } from "@/lib/molding";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { Download, Save, Trash2, Users, AlertTriangle } from "lucide-react";



function parseSpec(text?: string | null): { upper?: number; lower?: number } {
  if (!text) return {};
  const m = String(text).match(/(-?\d+(?:\.\d+)?)\s*[±+\-]\s*\(?\s*(-?\d+(?:\.\d+)?)/);
  if (m) {
    const c = parseFloat(m[1]); const t = parseFloat(m[2]);
    return { upper: c + t, lower: c - t };
  }
  const ge = String(text).match(/(?:≧|>=)\s*(-?\d+(?:\.\d+)?)/);
  if (ge) return { lower: parseFloat(ge[1]) };
  const le = String(text).match(/(?:≦|<=)\s*(-?\d+(?:\.\d+)?)/);
  if (le) return { upper: parseFloat(le[1]) };
  return {};
}

export const Route = createFileRoute("/form")({
  head: () => ({
    meta: [
      { title: "Technician Form – Belton Molding Record" },
      { name: "description", content: "ฟอร์มบันทึกพารามิเตอร์การฉีดสำหรับช่างเทคนิค" },
    ],
  }),
  errorComponent: ({ error, reset }) => (
    <AppLayout>
      <div className="p-6 space-y-3">
        <h2 className="text-lg font-semibold">เกิดข้อผิดพลาด</h2>
        <pre className="text-xs whitespace-pre-wrap text-destructive bg-muted p-3 rounded">
          {error?.message ?? String(error)}
        </pre>
        <button className="text-sm underline" onClick={() => reset()}>ลองใหม่</button>
      </div>
    </AppLayout>
  ),
  component: () => (
    <AppLayout>
      <FormPage />
    </AppLayout>
  ),
});

function FormPage() {
  const qc = useQueryClient();
  const [masterId, setMasterId] = useState<string>("");
  const [machineKey, setMachineKey] = useState<string>("");
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [shift, setShift] = useState<"D" | "N">("D");
  const [technician, setTechnician] = useState("");
  const [notes, setNotes] = useState("");
  const [customer, setCustomer] = useState("");
  const [params, setParams] = useState<Record<string, string>>({});

  const { data: masters = [] } = useQuery({
    queryKey: ["masters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("master_conditions").select("*").order("product_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: machines = [] } = useQuery({
    queryKey: ["machines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("machines").select("*").order("machine_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ["technicians"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("technicians").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const addTech = useMutation({
    mutationFn: async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("กรุณากรอกชื่อ");
      const { error } = await supabase.from("technicians").insert({ name: trimmed });
      if (error && !String(error.message).includes("duplicate")) throw error;
      return trimmed;
    },
    onSuccess: (name) => {
      toast.success("เพิ่มช่างเทคนิคแล้ว");
      qc.invalidateQueries({ queryKey: ["technicians"] });
      setTechnician(name);
      setNewTech("");
      setAddingTech(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [addingTech, setAddingTech] = useState(false);
  const [newTech, setNewTech] = useState("");
  const [manageDialog, setManageDialog] = useState(false);

  const delTech = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("technicians").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("ลบช่างเทคนิคแล้ว");
      qc.invalidateQueries({ queryKey: ["technicians"] });
      setTechnician("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const master = useMemo(
    () => masters.find((m) => m.id === masterId),
    [masters, masterId],
  );
  const machine = useMemo(
    () => machines.find((m) => `${m.machine_name}|${m.machine_no}` === machineKey),
    [machines, machineKey],
  );

  const save = useMutation({
    mutationFn: async () => {
      if (!master) throw new Error("กรุณาเลือก Product / Mold");
      if (!machine) throw new Error("กรุณาเลือก Machine");
      const payload = {
        master_condition_id: master.id,
        product_name: master.product_name,
        mold_no: master.mold_no,
        part_no: master.product_number,
        customer: customer || master.customer || "",
        machine_name: machine.machine_name,
        machine_no: machine.machine_no,
        record_date: date,
        shift,
        technician: technician || null,
        parameters: params,
        notes: notes || null,
      };
      const { error } = await supabase
        .from("daily_records")
        .upsert(payload, { onConflict: "master_condition_id,record_date,shift,machine_no" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("บันทึกข้อมูลเรียบร้อย");
      qc.invalidateQueries({ queryKey: ["records-recent"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function exportXlsx() {
    const XLSX = await import("xlsx");
    if (!master) {
      toast.error("เลือก Product / Mold ก่อน export");
      return;
    }
    const header = [
      ["ใบบันทึกพารามิเตอร์การฉีด – Belton Technology"],
      [],
      ["Part Name", master.product_name, "", "Part No", master.product_number ?? ""],
      ["Customer", customer || master.customer || "", "", "Mold No", master.mold_no],
      ["Machine", machine ? `${machine.machine_name} ${machine.machine_no}` : "", "", "Date / Shift", `${date} / ${shift}`],
      ["Technician", technician],
      [],
      ["Items", "Spec", "Measured", "Unit"],
    ];
    const rows = PARAMETERS.map((p) => [
      `${p.label} (${p.labelEn})`,
      p.specField ? (master as Record<string, unknown>)[p.specField] ?? "" : "",
      params[p.key] ?? "",
      p.unit ?? "",
    ]);
    const ws = XLSX.utils.aoa_to_sheet([...header, ...rows, [], ["Notes", notes]]);
    ws["!cols"] = [{ wch: 32 }, { wch: 30 }, { wch: 18 }, { wch: 10 }, { wch: 24 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Record");
    XLSX.writeFile(wb, `Molding_${master.product_name.replace(/\s+/g, "_")}_${date}_${shift}.xlsx`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">บันทึกพารามิเตอร์การฉีด</h1>
          <p className="text-sm text-muted-foreground">Technician Form – กรอกค่าที่วัดจริง เปรียบเทียบกับ Spec ของแม่พิมพ์</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportXlsx}>
            <Download className="size-4 mr-2" /> Export Excel
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            <Save className="size-4 mr-2" /> {save.isPending ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Part Information & Machine</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <Field label="Product / Mold">
            <Select value={masterId} onValueChange={setMasterId}>
              <SelectTrigger><SelectValue placeholder="เลือก Product..." /></SelectTrigger>
              <SelectContent>
                {masters.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.product_name} — {String(m.mold_no ?? "").split("\n")[0].split("/")[0].trim() || "—"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Machine">
            <Select value={machineKey} onValueChange={setMachineKey}>
              <SelectTrigger><SelectValue placeholder="เลือก Machine..." /></SelectTrigger>
              <SelectContent>
                {machines.map((m) => (
                  <SelectItem key={m.id} value={`${m.machine_name}|${m.machine_no}`}>
                    {m.machine_name} – {m.machine_no}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Customer">
            <Select value={customer} onValueChange={setCustomer}>
              <SelectTrigger><SelectValue placeholder="เลือก Customer..." /></SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Part No"><Input value={String(master?.product_number ?? "")} readOnly /></Field>
          <Field label="Material"><Input value={String(master?.materials ?? "")} readOnly /></Field>
          <Field label="Cavities"><Input value={String(master?.cavities ?? "")} readOnly /></Field>

          <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Shift">
            <Select value={shift} onValueChange={(v) => setShift(v as "D" | "N")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SHIFTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Technician">
            <div className="flex gap-2">
              <Select value={technician} onValueChange={(v) => { if (v === "__add__") { setAddingTech(true); } else { setTechnician(v); } }}>
                <SelectTrigger><SelectValue placeholder="เลือกช่าง..." /></SelectTrigger>
                <SelectContent>
                  {technicians.map((t) => (
                    <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                  ))}
                  <SelectItem value="__add__">+ เพิ่มช่างใหม่...</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="icon" title="จัดการรายชื่อช่าง" onClick={() => setManageDialog(true)}>
                <Users className="size-4" />
              </Button>
            </div>
            {addingTech && (
              <div className="flex gap-2 mt-2">
                <Input
                  autoFocus
                  placeholder="ชื่อ-นามสกุล"
                  value={newTech}
                  onChange={(e) => setNewTech(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTech.mutate(newTech); } }}
                />
                <Button type="button" size="sm" onClick={() => addTech.mutate(newTech)} disabled={addTech.isPending}>
                  เพิ่ม
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => { setAddingTech(false); setNewTech(""); }}>
                  ยกเลิก
                </Button>
              </div>
            )}
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">พารามิเตอร์ที่วัดได้จริง (Measured Values)</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-muted-foreground">
                <tr>
                  <th className="text-left py-2 pr-3 w-1/3">รายการ / Items</th>
                  <th className="text-left py-2 pr-3 w-1/3">Spec.</th>
                  <th className="text-left py-2 pr-3">Measured</th>
                  <th className="text-left py-2 pr-3 w-20">Unit</th>
                </tr>
              </thead>
              <tbody>
                {PARAMETERS.map((p) => {
                  const spec = p.specField && master
                    ? (master as Record<string, unknown>)[p.specField] as string | null
                    : null;
                  return (
                    <tr key={p.key} className="border-b last:border-0">
                      <td className="py-2 pr-3">
                        <div className="font-medium">{p.label}</div>
                        <div className="text-xs text-muted-foreground">{p.labelEn}</div>
                      </td>
                      <td className="py-2 pr-3">
                        <span className="inline-block px-2 py-1 rounded bg-brand-soft text-xs text-foreground">
                          {spec || "—"}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        {(() => {
                          const { upper, lower } = parseSpec(spec);
                          const val = parseFloat(params[p.key] ?? "");
                          const outOfSpec = Number.isFinite(val) && (
                            (upper != null && val > upper) || (lower != null && val < lower)
                          );
                          return (
                            <div className="flex items-center gap-1">
                              <Input
                                type="text"
                                inputMode={p.key === "hold_speed" ? "text" : "decimal"}
                                className={`h-9 ${outOfSpec ? "border-red-500 bg-red-50" : ""}`}
                                value={params[p.key] ?? ""}
                                onChange={(e) => setParams({ ...params, [p.key]: e.target.value })}
                              />
                              {outOfSpec && (
                                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" title="ค่าเกิน Spec!" />
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground text-xs">{p.unit}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader><CardTitle className="text-base">หมายเหตุ</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="บันทึกเพิ่มเติม..." />
        </CardContent>
      </Card>
      <Dialog open={manageDialog} onOpenChange={setManageDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>รายชื่อช่างเทคนิค</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {technicians.length === 0 && (
              <p className="text-sm text-muted-foreground">ยังไม่มีรายชื่อ</p>
            )}
            {technicians.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                <span className="text-sm">{t.name}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  disabled={delTech.isPending}
                  onClick={() => delTech.mutate(t.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
