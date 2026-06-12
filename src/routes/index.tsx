import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/ui/AppLayout";
import { supabase } from "@/intregetion_Supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { PARAMETERS, type ParamKey } from "@/lib/molding";
import { ClipboardList, CalendarDays } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard – Belton Molding Record" },
      { name: "description", content: "Trend graphs ของแต่ละพารามิเตอร์ พร้อม Upper/Lower limit จาก Spec" },
    ],
  }),
  component: () => (
    <AppLayout>
      <DashboardPage />
    </AppLayout>
  ),
});

/** Parse spec text like "175±(5℃)" or "105±(5℃)" → {center, upper, lower} */
function parseSpec(text?: string | null): { upper?: number; lower?: number; center?: number } {
  if (!text) return {};
  const m = String(text).match(/(-?\d+(?:\.\d+)?)\s*[±+\-]\s*\(?\s*(-?\d+(?:\.\d+)?)/);
  if (m) {
    const c = parseFloat(m[1]); const t = parseFloat(m[2]);
    return { center: c, upper: c + t, lower: c - t };
  }
  // try "≧4" / ">=4"
  const ge = String(text).match(/(?:≧|>=)\s*(-?\d+(?:\.\d+)?)/);
  if (ge) return { lower: parseFloat(ge[1]) };
  const le = String(text).match(/(?:≦|<=)\s*(-?\d+(?:\.\d+)?)/);
  if (le) return { upper: parseFloat(le[1]) };
  const num = String(text).match(/(-?\d+(?:\.\d+)?)/);
  if (num) return { center: parseFloat(num[1]) };
  return {};
}

type ChartGroup = {
  title: string;
  unit: string;
  keys: { key: ParamKey; label: string; color: string }[];
  specField: string;
};

const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#ea580c", "#7c3aed", "#0891b2"];

const GROUPS: ChartGroup[] = [
  {
    title: "Resin Dryer Temperature", unit: "℃", specField: "drying_temp_time",
    keys: [{ key: "drying_temp", label: "Drying temp", color: COLORS[0] }],
  },
  {
    title: "Resin Dryer Time", unit: "hr", specField: "drying_temp_time",
    keys: [{ key: "drying_time", label: "Drying time", color: COLORS[0] }],
  },
  {
    title: "Mould Temperature", unit: "℃", specField: "mould_temp",
    keys: [
      { key: "mould_temp_fixed", label: "Fixed", color: COLORS[0] },
      { key: "mould_temp_moving", label: "Moving", color: COLORS[1] },
    ],
  },
  {
    title: "Barrel Temperature", unit: "℃", specField: "barrel_zone1",
    keys: [
      { key: "barrel_n1", label: "N1", color: COLORS[0] },
      { key: "barrel_c1", label: "C1", color: COLORS[1] },
      { key: "barrel_c2", label: "C2", color: COLORS[2] },
      { key: "barrel_c3", label: "C3", color: COLORS[3] },
    ],
  },
  {
    title: "Fill Speed", unit: "mm/s", specField: "fill_speed_a",
    keys: [
      { key: "fill_speed_1", label: "S1", color: COLORS[0] },
      { key: "fill_speed_2", label: "S2", color: COLORS[1] },
      { key: "fill_speed_3", label: "S3", color: COLORS[2] },
      { key: "fill_speed_4", label: "S4", color: COLORS[3] },
    ],
  },
  {
    title: "Fill Pressure", unit: "MPa", specField: "fill_pressure_a",
    keys: [{ key: "fill_pressure", label: "Fill pressure", color: COLORS[0] }],
  },
  {
    title: "Switch Position", unit: "mm", specField: "transfer_position_a",
    keys: [{ key: "switch_position", label: "Switch position", color: COLORS[0] }],
  },
  {
    title: "Hold Pressure", unit: "MPa", specField: "hold_pressure_a",
    keys: [
      { key: "hold_pressure_1", label: "S1", color: COLORS[0] },
      { key: "hold_pressure_2", label: "S2", color: COLORS[1] },
      { key: "hold_pressure_3", label: "S3", color: COLORS[2] },
      { key: "hold_pressure_4", label: "S4", color: COLORS[3] },
    ],
  },
  {
    title: "Hold Time", unit: "s", specField: "hold_time_a",
    keys: [
      { key: "hold_time_1", label: "S1", color: COLORS[0] },
      { key: "hold_time_2", label: "S2", color: COLORS[1] },
      { key: "hold_time_3", label: "S3", color: COLORS[2] },
      { key: "hold_time_4", label: "S4", color: COLORS[3] },
    ],
  },
];

function DashboardPage() {
  const [product, setProduct] = useState<string>("all");
  const [machine, setMachine] = useState<string>("all");

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["records-trend"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_records").select("*")
        .order("record_date", { ascending: true })
        .order("shift", { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const { data: masters = [] } = useQuery({
    queryKey: ["masters-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("master_conditions").select("*");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const products = useMemo(
    () => Array.from(new Set(records.map((r) => r.product_name).filter(Boolean))),
    [records],
  );
  const machines = useMemo(
    () => Array.from(new Set(
      records.map((r) => [r.machine_name, r.machine_no].filter(Boolean).join(" ").trim())
        .filter(Boolean),
    )),
    [records],
  );

  const filtered = useMemo(() => records.filter((r) => {
    if (product !== "all" && r.product_name !== product) return false;
    const m = [r.machine_name, r.machine_no].filter(Boolean).join(" ").trim();
    if (machine !== "all" && m !== machine) return false;
    return true;
  }), [records, product, machine]);

  // Pick spec from the matching master row (by product if available)
  const spec = useMemo(() => {
    if (product === "all") return masters[0] ?? null;
    return masters.find((m) => m.product_name === product) ?? null;
  }, [masters, product]);

  // X-axis labels: "MMM-DD-D/N"
  const chartData = useMemo(() => filtered.map((r) => {
    const d = new Date(r.record_date);
    const label = `${d.toLocaleDateString("en-US", { month: "short", day: "2-digit" })}-${r.shift}`;
    const p = (r.parameters ?? {}) as Record<string, unknown>;
    const row: Record<string, unknown> = { label };
    for (const pd of PARAMETERS) {
      const v = Number(p[pd.key]);
      row[pd.key] = Number.isFinite(v) ? v : null;
    }
    return row;
  }), [filtered]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard – Parameter Trend</h1>
        <p className="text-sm text-muted-foreground">
          กราฟแนวโน้มของแต่ละพารามิเตอร์ตามวัน-กะ พร้อมเส้น Upper / Lower limit จาก Spec
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Product / Part</Label>
            <Select value={product} onValueChange={setProduct}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                {products.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Machine</Label>
            <Select value={machine} onValueChange={setMachine}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                {machines.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-100"><ClipboardList className="h-6 w-6 text-blue-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Records</p>
              <p className="text-2xl font-bold">{records.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-100"><CalendarDays className="h-6 w-6 text-green-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Today</p>
              <p className="text-2xl font-bold">{records.filter((r) => r.record_date === format(new Date(), "yyyy-MM-dd")).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">กำลังโหลด...</p>}
      {!isLoading && chartData.length === 0 && (
        <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">
          ยังไม่มีข้อมูล – เริ่มบันทึกที่หน้า Technician Form
        </CardContent></Card>
      )}

      {chartData.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-4">
          {GROUPS.map((g) => {
            const specVal = spec ? (spec as any)[g.specField] : null;
            const { upper, lower } = parseSpec(specVal);
            return (
              <Card key={g.title}>
                <CardHeader>
                  <CardTitle className="text-base">{g.title} <span className="text-xs text-muted-foreground font-normal">({g.unit})</span></CardTitle>
                  {specVal && (
                    <p className="text-xs text-muted-foreground">
                      Spec: {String(specVal).replace(/\n/g, " · ")}
                      {upper != null && lower != null && ` → ${lower} ~ ${upper}`}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="label" fontSize={10} angle={-35} textAnchor="end" height={50} interval="preserveStartEnd" />
                      <YAxis fontSize={11} domain={["auto", "auto"]} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {upper != null && (
                        <ReferenceLine y={upper} stroke="#dc2626" strokeDasharray="4 4"
                          label={{ value: `Upper ${upper}`, fontSize: 10, fill: "#dc2626", position: "right" }} />
                      )}
                      {lower != null && (
                        <ReferenceLine y={lower} stroke="#dc2626" strokeDasharray="4 4"
                          label={{ value: `Lower ${lower}`, fontSize: 10, fill: "#dc2626", position: "right" }} />
                      )}
                      {g.keys.map((k) => (
                        <Line key={k.key} type="monotone" dataKey={k.key} name={k.label}
                          stroke={k.color} strokeWidth={2} dot={{ r: 2 }} connectNulls />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
