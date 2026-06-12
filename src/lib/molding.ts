export type ParamKey =
  | "drying_temp" | "drying_time" | "mould_temp_fixed" | "mould_temp_moving"
  | "barrel_n1" | "barrel_c1" | "barrel_c2" | "barrel_c3"
  | "fill_speed_1" | "fill_speed_2" | "fill_speed_3" | "fill_speed_4"
  | "fill_pressure" | "switch_position"
  | "hold_speed"
  | "hold_pressure_1" | "hold_pressure_2" | "hold_pressure_3" | "hold_pressure_4"
  | "hold_time_1" | "hold_time_2" | "hold_time_3" | "hold_time_4";

export interface ParamDef {
  key: ParamKey;
  label: string;
  labelEn: string;
  unit?: string;
  /** key on the master_conditions row to read spec text from */
  specField?: string;
}

export const PARAMETERS: ParamDef[] = [
  { key: "drying_temp", label: "อุณหภูมิการอบ", labelEn: "Drying temp", unit: "℃", specField: "drying_temp_time" },
  { key: "drying_time", label: "เวลาการอบ", labelEn: "Drying time", unit: "hr", specField: "drying_temp_time" },
  { key: "mould_temp_fixed", label: "อุณหภูมิแม่พิมพ์ (Fixed)", labelEn: "Mould temp – Fixed", unit: "℃", specField: "mould_temp" },
  { key: "mould_temp_moving", label: "อุณหภูมิแม่พิมพ์ (Moving)", labelEn: "Mould temp – Moving", unit: "℃", specField: "mould_temp" },
  { key: "barrel_n1", label: "อุณหภูมิบาเรลล์ N1", labelEn: "Barrel N1 (Nozzle)", unit: "℃", specField: "barrel_nozzle" },
  { key: "barrel_c1", label: "อุณหภูมิบาเรลล์ C1", labelEn: "Barrel C1", unit: "℃", specField: "barrel_zone1" },
  { key: "barrel_c2", label: "อุณหภูมิบาเรลล์ C2", labelEn: "Barrel C2", unit: "℃", specField: "barrel_zone2" },
  { key: "barrel_c3", label: "อุณหภูมิบาเรลล์ C3", labelEn: "Barrel C3", unit: "℃", specField: "barrel_zone3" },
  { key: "fill_speed_1", label: "ความเร็วฉีด Step 1", labelEn: "Fill speed S1", unit: "mm/s", specField: "fill_speed_a" },
  { key: "fill_speed_2", label: "ความเร็วฉีด Step 2", labelEn: "Fill speed S2", unit: "mm/s", specField: "fill_speed_a" },
  { key: "fill_speed_3", label: "ความเร็วฉีด Step 3", labelEn: "Fill speed S3", unit: "mm/s", specField: "fill_speed_a" },
  { key: "fill_speed_4", label: "ความเร็วฉีด Step 4", labelEn: "Fill speed S4", unit: "mm/s", specField: "fill_speed_a" },
  { key: "fill_pressure", label: "แรงดันฉีด", labelEn: "Fill pressure", unit: "MPa", specField: "fill_pressure_a" },
  { key: "switch_position", label: "ระยะเปลี่ยน (Switch)", labelEn: "Switch position", unit: "mm", specField: "transfer_position_a" },
  { key: "hold_speed", label: "ความเร็วฉีดย้ำ", labelEn: "Hold speed", unit: "mm/s", specField: "hold_speed_a" },
  { key: "hold_pressure_1", label: "แรงฉีดย้ำ Step 1", labelEn: "Hold pressure S1", unit: "MPa", specField: "hold_pressure_a" },
  { key: "hold_pressure_2", label: "แรงฉีดย้ำ Step 2", labelEn: "Hold pressure S2", unit: "MPa", specField: "hold_pressure_a" },
  { key: "hold_pressure_3", label: "แรงฉีดย้ำ Step 3", labelEn: "Hold pressure S3", unit: "MPa", specField: "hold_pressure_a" },
  { key: "hold_pressure_4", label: "แรงฉีดย้ำ Step 4", labelEn: "Hold pressure S4", unit: "MPa", specField: "hold_pressure_a" },
  { key: "hold_time_1", label: "เวลาฉีดย้ำ Step 1", labelEn: "Hold time S1", unit: "s", specField: "hold_time_a" },
  { key: "hold_time_2", label: "เวลาฉีดย้ำ Step 2", labelEn: "Hold time S2", unit: "s", specField: "hold_time_a" },
  { key: "hold_time_3", label: "เวลาฉีดย้ำ Step 3", labelEn: "Hold time S3", unit: "s", specField: "hold_time_a" },
  { key: "hold_time_4", label: "เวลาฉีดย้ำ Step 4", labelEn: "Hold time S4", unit: "s", specField: "hold_time_a" },
];

export const SHIFTS = [
  { value: "D", label: "Day (กลางวัน)" },
  { value: "N", label: "Night (กลางคืน)" },
] as const;
