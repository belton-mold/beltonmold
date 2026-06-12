import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppLayout } from "@/components/ui/AppLayout";
import { supabase } from "@/intregetion_Supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/master")({
  head: () => ({
    meta: [
      { title: "Master Conditions – Belton" },
      { name: "description", content: "จัดการฐานข้อมูล Master Condition ของแม่พิมพ์แต่ละตัว" },
    ],
  }),
  component: () => (
    <AppLayout>
      <MasterPage />
    </AppLayout>
  ),
});

const FIELDS: { key: string; label: string }[] = [
  { key: "product_name", label: "Product Name *" },
  { key: "mold_no", label: "Mold No *" },
  { key: "product_number", label: "Product Number" },
  { key: "customer", label: "Customer" },
  { key: "materials", label: "Materials" },
  { key: "cavities", label: "Cavities" },
  { key: "shot_weight", label: "Shot Weight" },
  { key: "piece_weight", label: "Piece Weight" },
  { key: "cycle_time", label: "Cycle Time" },
  { key: "drying_temp_time", label: "Drying Temp/Time" },
  { key: "mould_temp", label: "Mould Temp" },
  { key: "barrel_nozzle", label: "Barrel – Nozzle" },
  { key: "barrel_zone1", label: "Barrel – Zone 1" },
  { key: "barrel_zone2", label: "Barrel – Zone 2" },
  { key: "barrel_zone3", label: "Barrel – Zone 3" },
  { key: "barrel_zone4", label: "Barrel – Zone 4" },
  { key: "machine_a", label: "Machine A" },
  { key: "fill_speed_a", label: "Fill speed (A)" },
  { key: "fill_pressure_a", label: "Fill pressure (A)" },
  { key: "transfer_position_a", label: "Transfer position (A)" },
  { key: "hold_speed_a", label: "Hold speed (A)" },
  { key: "hold_pressure_a", label: "Hold pressure (A)" },
  { key: "hold_time_a", label: "Hold time (A)" },
  { key: "machine_b", label: "Machine B" },
  { key: "fill_speed_b", label: "Fill speed (B)" },
  { key: "fill_pressure_b", label: "Fill pressure (B)" },
  { key: "transfer_position_b", label: "Transfer position (B)" },
  { key: "hold_speed_b", label: "Hold speed (B)" },
  { key: "hold_pressure_b", label: "Hold pressure (B)" },
  { key: "hold_time_b", label: "Hold time (B)" },
];

type Row = Record<string, string | null>;
const empty: Row = Object.fromEntries(FIELDS.map((f) => [f.key, ""]));

function MasterPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row & { id?: string }>(empty);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["masters-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("master_conditions").select("*").order("product_name");
      if (error) throw error;
      return data ?? [];
    },
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

  const save = useMutation({
    mutationFn: async (row: Row & { id?: string }) => {
      const payload: Record<string, string | null> = {};
      for (const f of FIELDS) payload[f.key] = row[f.key] || null;
      if (row.id) {
        const { error } = await supabase.from("master_conditions").update(payload as never).eq("id", row.id);
        if (error) throw error;
      } else {
        if (!payload.product_name || !payload.mold_no) {
          throw new Error("กรุณากรอก Product Name และ Mold No");
        }
        const { error } = await supabase.from("master_conditions").insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("บันทึก Master เรียบร้อย");
      qc.invalidateQueries({ queryKey: ["masters-full"] });
      qc.invalidateQueries({ queryKey: ["masters"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("master_conditions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("ลบเรียบร้อย");
      qc.invalidateQueries({ queryKey: ["masters-full"] });
    },
  });

  function exportAll() {
    const ws = XLSX.utils.json_to_sheet(rows.map((r) => {
      const o: Record<string, unknown> = {};
      for (const f of FIELDS) o[f.label.replace(" *", "")] = (r as Row)[f.key] ?? "";
      return o;
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Master Conditions");
    XLSX.writeFile(wb, `Master_Conditions_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Master Conditions</h1>
          <p className="text-sm text-muted-foreground">ฐานข้อมูล Spec มาตรฐานของแต่ละ Product / Mold</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportAll}>
            <Download className="size-4 mr-2" /> Export Excel
          </Button>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(empty); }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(empty)}>
                <Plus className="size-4 mr-2" /> เพิ่ม Master
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing.id ? "แก้ไข Master Condition" : "เพิ่ม Master Condition"}</DialogTitle>
              </DialogHeader>
              <div className="grid md:grid-cols-2 gap-3 py-2">
                {FIELDS.map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <Label className="text-xs">{f.label}</Label>
                    {f.key === "customer" ? (
                      <Select value={editing.customer ?? ""} onValueChange={(v) => setEditing({ ...editing, customer: v })}>
                        <SelectTrigger><SelectValue placeholder="เลือก Customer..." /></SelectTrigger>
                        <SelectContent>
                          {customers.map((c) => (
                            <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={editing[f.key] ?? ""}
                        onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
                <Button onClick={() => save.mutate(editing)} disabled={save.isPending}>บันทึก</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">รายการทั้งหมด ({rows.length})</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="py-2 pr-3">Product</th>
                <th className="py-2 pr-3">Mold No</th>
                <th className="py-2 pr-3">Material</th>
                <th className="py-2 pr-3">Mould Temp</th>
                <th className="py-2 pr-3">Customer</th>
                <th className="py-2 pr-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">กำลังโหลด...</td></tr>}
              {!isLoading && rows.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">ยังไม่มีข้อมูล</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-medium">{r.product_name}</td>
                  <td className="py-2 pr-3 whitespace-pre-line text-xs">{r.mold_no}</td>
                  <td className="py-2 pr-3 text-xs">{r.materials}</td>
                  <td className="py-2 pr-3 text-xs">{r.mould_temp}</td>
                  <td className="py-2 pr-3 text-xs">{r.customer ?? "-"}</td>
                  <td className="py-2 pr-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(r as Row & { id: string }); setOpen(true); }}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      if (confirm(`ลบ "${r.product_name}"?`)) del.mutate(r.id);
                    }}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
