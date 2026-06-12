import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/ui/AppLayout";
import { supabase } from "@/intregetion_Supabase/client";
import { PARAMETERS } from "@/lib/molding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Download, Eye, FileDown, Pencil, Trash2, Save } from "lucide-react";




export const Route = createFileRoute("/records")({
  head: () => ({
    meta: [
      { title: "ประวัติการบันทึก – Belton Molding Record" },
      { name: "description", content: "ดูข้อมูลที่บันทึกและส่งออกเป็น Excel" },
    ],
  }),
  errorComponent: ({ error, reset }) => (
    <AppLayout>
      <div className="p-6 space-y-3">
        <h2 className="text-lg font-semibold">เกิดข้อผิดพลาด</h2>
        <pre className="text-xs whitespace-pre-wrap text-destructive bg-muted p-3 rounded">{error?.message ?? String(error)}</pre>
        <button className="text-sm underline" onClick={() => reset()}>ลองใหม่</button>
      </div>
    </AppLayout>
  ),
  component: () => (
    <AppLayout>
      <RecordsPage />
    </AppLayout>
  ),
});

function RecordsPage() {
  const qc = useQueryClient();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [shift, setShift] = useState<string>("all");
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["records-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_records").select("*")
        .order("record_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("daily_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("ลบรายการแล้ว");
      qc.invalidateQueries({ queryKey: ["records-all"] });
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (from && r.record_date < from) return false;
      if (to && r.record_date > to) return false;
      if (shift !== "all" && r.shift !== shift) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [r.product_name, r.part_no, r.mold_no, r.customer, r.machine_name, r.machine_no, r.technician]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [records, from, to, search, shift]);

  async function exportSummary() {
    if (filtered.length === 0) {
      toast.error("ไม่มีข้อมูลให้ส่งออก");
      return;
    }
    const XLSX = await import("xlsx");

    // Summary sheet: one row per record + parameters as columns
    const paramHeaders = PARAMETERS.map((p) => `${p.labelEn} (${p.unit ?? ""})`);
    const baseHeaders = [
      "Date", "Shift", "Customer", "Part Name", "Part No", "Mold No",
      "Machine", "Machine No", "Technician",
    ];
    const allDefectKeys = Array.from(new Set(
      filtered.flatMap((r) => Object.keys((r.defects as object) ?? {})),
    ));
    const header = [...baseHeaders, ...paramHeaders, ...allDefectKeys.map((d) => `Defect: ${d}`), "Notes"];

    const rows = filtered.map((r) => {
      const p = (r.parameters as Record<string, unknown>) ?? {};
      const d = (r.defects as Record<string, unknown>) ?? {};
      return [
        r.record_date, r.shift, r.customer ?? "", r.product_name, r.part_no ?? "",
        r.mold_no, r.machine_name ?? "", r.machine_no ?? "", r.technician ?? "",
        ...PARAMETERS.map((pd) => p[pd.key] ?? ""),
        ...allDefectKeys.map((k) => d[k] ?? ""),
        r.notes ?? "",
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    ws["!cols"] = header.map(() => ({ wch: 16 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Summary");
    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Molding_Summary_${today}.xlsx`);
  }

  function buildRecordSheet(XLSX: typeof import("xlsx"), r: any) {
    const header = [
      ["ใบบันทึกพารามิเตอร์การฉีด – Belton Technology"],
      [],
      ["Part Name", r.product_name, "", "Part No", r.part_no ?? ""],
      ["Customer", r.customer ?? "", "", "Mold No", r.mold_no],
      ["Machine", `${r.machine_name ?? ""} ${r.machine_no ?? ""}`, "", "Date / Shift", `${r.record_date} / ${r.shift}`],
      ["Technician", r.technician ?? ""],
      [],
      ["Items", "Measured", "Unit"],
    ];
    const p = (r.parameters as Record<string, unknown>) ?? {};
    const rows = PARAMETERS.map((pd) => [
      `${pd.label} (${pd.labelEn})`,
      p[pd.key] ?? "",
      pd.unit ?? "",
    ]);
    const d = (r.defects as Record<string, unknown>) ?? {};
    const defectRows: (string | number)[][] = [
      [], ["Defects", "Count"],
      ...Object.entries(d).map(([k, v]) => [k, Number(v) || 0]),
    ];
    const ws = XLSX.utils.aoa_to_sheet([...header, ...rows, ...defectRows, [], ["Notes", r.notes ?? ""]]);
    ws["!cols"] = [{ wch: 32 }, { wch: 22 }, { wch: 10 }, { wch: 18 }, { wch: 24 }];
    return ws;
  }

  async function exportSingle(r: any) {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, buildRecordSheet(XLSX, r), "Record");
    XLSX.writeFile(wb, `Molding_${String(r.product_name).replace(/\s+/g, "_")}_${r.record_date}_${r.shift}.xlsx`);
  }

  async function exportAllDetailed() {
    if (filtered.length === 0) {
      toast.error("ไม่มีข้อมูลให้ส่งออก");
      return;
    }
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    const paramHeaders = PARAMETERS.map((p) => `${p.labelEn} (${p.unit ?? ""})`);
    const baseHeaders = ["Date", "Shift", "Customer", "Part Name", "Part No", "Mold No", "Machine", "Machine No", "Technician"];
    const allDefectKeys = Array.from(new Set(filtered.flatMap((r) => Object.keys((r.defects as object) ?? {}))));
    const header = [...baseHeaders, ...paramHeaders, ...allDefectKeys.map((d) => `Defect: ${d}`), "Notes"];
    const rows = filtered.map((r) => {
      const p = (r.parameters as Record<string, unknown>) ?? {};
      const d = (r.defects as Record<string, unknown>) ?? {};
      return [
        r.record_date, r.shift, r.customer ?? "", r.product_name, r.part_no ?? "",
        r.mold_no, r.machine_name ?? "", r.machine_no ?? "", r.technician ?? "",
        ...PARAMETERS.map((pd) => p[pd.key] ?? ""),
        ...allDefectKeys.map((k) => d[k] ?? ""),
        r.notes ?? "",
      ];
    });
    const summary = XLSX.utils.aoa_to_sheet([header, ...rows]);
    summary["!cols"] = header.map(() => ({ wch: 16 }));
    XLSX.utils.book_append_sheet(wb, summary, "Summary");

    const usedNames = new Set<string>(["Summary"]);
    filtered.forEach((r, idx) => {
      const raw = `${r.record_date}_${r.shift}_${String(r.product_name ?? "").slice(0, 12)}`
        .replace(/[\\/?*\[\]:]/g, "-");
      let name = raw.slice(0, 28) || `Rec_${idx + 1}`;
      let n = 2;
      while (usedNames.has(name)) name = `${raw.slice(0, 25)}_${n++}`;
      usedNames.add(name);
      XLSX.utils.book_append_sheet(wb, buildRecordSheet(XLSX, r), name);
    });

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Molding_AllRecords_${today}.xlsx`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ประวัติการบันทึก</h1>
          <p className="text-sm text-muted-foreground">ดูข้อมูลที่บันทึกทั้งหมด กรองและส่งออกเป็น Excel</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={exportSummary}>
            <FileDown className="size-4 mr-2" /> Export สรุป ({filtered.length})
          </Button>
          <Button onClick={exportAllDetailed}>
            <FileDown className="size-4 mr-2" /> Export ทุกรายการ (แยก Sheet)
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">ตัวกรอง</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">จากวันที่</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">ถึงวันที่</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Shift</Label>
            <Select value={shift} onValueChange={setShift}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="D">Day</SelectItem>
                <SelectItem value="N">Night</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">ค้นหา (Part, Mold, Machine, Technician)</Label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="พิมพ์เพื่อค้นหา..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-left py-2 px-3">Date</th>
                  <th className="text-left py-2 px-3">Shift</th>
                  <th className="text-left py-2 px-3">Customer</th>
                  <th className="text-left py-2 px-3">Part / Mold</th>
                  <th className="text-left py-2 px-3">Machine</th>
                  <th className="text-left py-2 px-3">Technician</th>
                  <th className="text-right py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">กำลังโหลด...</td></tr>
                )}
                {!isLoading && filtered.length === 0 && (
                  <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">ไม่พบข้อมูล</td></tr>
                )}
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-accent/30">
                    <td className="py-2 px-3">{r.record_date}</td>
                    <td className="py-2 px-3">{r.shift}</td>
                    <td className="py-2 px-3">{r.customer ?? "—"}</td>
                    <td className="py-2 px-3">
                      <div className="font-medium">{r.product_name}</div>
                      <div className="text-xs text-muted-foreground">{r.mold_no}</div>
                    </td>
                    <td className="py-2 px-3">{r.machine_name} {r.machine_no}</td>
                    <td className="py-2 px-3">{r.technician ?? "—"}</td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex justify-end gap-2 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => setViewing(r)}>
                          <Eye className="size-4 mr-1" /> ดู
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
                          <Pencil className="size-4 mr-1" /> แก้ไข
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => exportSingle(r)}>
                          <Download className="size-4 mr-1" /> Excel
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleting(r)}>
                          <Trash2 className="size-4 mr-1" /> ลบ
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>รายละเอียดการบันทึก</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Info label="Date" value={viewing.record_date} />
                <Info label="Shift" value={viewing.shift} />
                <Info label="Customer" value={viewing.customer ?? "—"} />
                <Info label="Part Name" value={viewing.product_name} />
                <Info label="Part No" value={viewing.part_no ?? "—"} />
                <Info label="Mold No" value={viewing.mold_no} />
                <Info label="Machine" value={`${viewing.machine_name ?? ""} ${viewing.machine_no ?? ""}`} />
                <Info label="Technician" value={viewing.technician ?? "—"} />
              </div>
              <div>
                <h3 className="font-semibold mb-2">พารามิเตอร์</h3>
                <table className="w-full text-xs border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">รายการ</th>
                      <th className="text-left p-2">Measured</th>
                      <th className="text-left p-2 w-16">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PARAMETERS.map((p) => {
                      const v = (viewing.parameters as Record<string, unknown>)?.[p.key];
                      return (
                        <tr key={p.key} className="border-t">
                          <td className="p-2">{p.label} <span className="text-muted-foreground">({p.labelEn})</span></td>
                          <td className="p-2 font-medium">{(v as string) || "—"}</td>
                          <td className="p-2 text-muted-foreground">{p.unit}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {viewing.defects && Object.keys(viewing.defects).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">ของเสีย</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(viewing.defects as Record<string, unknown>).map(([k, v]) => (
                      <Info key={k} label={k} value={String(v)} />
                    ))}
                  </div>
                </div>
              )}
              {viewing.notes && (
                <div>
                  <h3 className="font-semibold mb-1">หมายเหตุ</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{viewing.notes}</p>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={() => exportSingle(viewing)}>
                  <Download className="size-4 mr-2" /> Export Excel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <EditDialog
        record={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          qc.invalidateQueries({ queryKey: ["records-all"] });
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && (
                <>ลบรายการ <b>{deleting.product_name}</b> วันที่ {deleting.record_date} กะ {deleting.shift} — ไม่สามารถกู้คืนได้</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); if (deleting) delMut.mutate(deleting.id); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function EditDialog({
  record, onClose, onSaved,
}: { record: any | null; onClose: () => void; onSaved: () => void }) {
  const [date, setDate] = useState("");
  const [shift, setShift] = useState("D");
  const [technician, setTechnician] = useState("");
  const [notes, setNotes] = useState("");
  const [params, setParams] = useState<Record<string, string>>({});
  const [defects, setDefects] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!record) return;
    setDate(record.record_date ?? "");
    setShift(record.shift ?? "D");
    setTechnician(record.technician ?? "");
    setNotes(record.notes ?? "");
    const p = (record.parameters as Record<string, unknown>) ?? {};
    setParams(Object.fromEntries(Object.entries(p).map(([k, v]) => [k, String(v ?? "")])));
    const d = (record.defects as Record<string, unknown>) ?? {};
    setDefects(Object.fromEntries(Object.entries(d).map(([k, v]) => [k, String(v ?? "")])));
  }, [record]);

  const save = useMutation({
    mutationFn: async () => {
      if (!record) return;
      const { error } = await supabase.from("daily_records").update({
        record_date: date,
        shift,
        technician: technician || null,
        notes: notes || null,
        parameters: params,
        defects: Object.fromEntries(
          Object.entries(defects).filter(([, v]) => v && Number(v) > 0).map(([k, v]) => [k, Number(v)]),
        ),
      }).eq("id", record.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("อัปเดตเรียบร้อย"); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const defectKeys = Object.keys(defects);

  return (
    <Dialog open={!!record} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>แก้ไขรายการ</DialogTitle></DialogHeader>
        {record && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Shift</Label>
                <Select value={shift} onValueChange={setShift}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="D">Day</SelectItem>
                    <SelectItem value="N">Night</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs text-muted-foreground">Technician</Label>
                <Input value={technician} onChange={(e) => setTechnician(e.target.value)} />
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">พารามิเตอร์</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="border-b text-muted-foreground">
                    <tr>
                      <th className="text-left p-2">รายการ</th>
                      <th className="text-left p-2">Measured</th>
                      <th className="text-left p-2 w-16">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PARAMETERS.map((p) => (
                      <tr key={p.key} className="border-b last:border-0">
                        <td className="p-2">{p.label} <span className="text-muted-foreground">({p.labelEn})</span></td>
                        <td className="p-2">
                          <Input
                            type="text"
                            className="h-8"
                            value={params[p.key] ?? ""}
                            onChange={(e) => setParams({ ...params, [p.key]: e.target.value })}
                          />
                        </td>
                        <td className="p-2 text-muted-foreground">{p.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {defectKeys.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">ของเสีย</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {defectKeys.map((k) => (
                    <div key={k} className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{k}</Label>
                      <Input
                        type="number"
                        min={0}
                        value={defects[k] ?? ""}
                        onChange={(e) => setDefects({ ...defects, [k]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs text-muted-foreground">หมายเหตุ</Label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                <Save className="size-4 mr-2" /> {save.isPending ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
