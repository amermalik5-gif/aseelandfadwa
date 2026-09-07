import * as XLSX from "xlsx";

export type ImportRow = { name: string; maxGuests: number; phone: string | null };

const NAME_HEADERS = ["name", "الاسم", "اسم", "guest", "family"];
const COUNT_HEADERS = [
  "invites",
  "seats",
  "guests",
  "count",
  "عدد الدعوات",
  "عدد المقاعد",
  "عدد الضيوف",
  "العدد",
  "المقاعد",
];
const PHONE_HEADERS = ["phone", "mobile", "الهاتف", "رقم الهاتف", "الجوال", "الموبايل"];

function normalize(v: unknown): string {
  return String(v ?? "").trim().toLowerCase();
}

/**
 * Parses an uploaded sheet into rows. Accepts a header row (matched loosely,
 * Arabic or English) or plain data starting at row 1 with columns
 * [name, count, phone?].
 */
export function parseGuestSheet(buffer: Buffer): ImportRow[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];

  const grid: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    blankrows: false,
  });
  if (grid.length === 0) return [];

  let nameCol = 0;
  let countCol = 1;
  let phoneCol: number | null = 2;
  let startRow = 0;

  const first = grid[0].map(normalize);
  const headerNameIdx = first.findIndex((c) =>
    NAME_HEADERS.some((h) => c.includes(h))
  );
  if (headerNameIdx !== -1) {
    startRow = 1;
    nameCol = headerNameIdx;
    const countIdx = first.findIndex((c) =>
      COUNT_HEADERS.some((h) => c.includes(h))
    );
    const phoneIdx = first.findIndex((c) =>
      PHONE_HEADERS.some((h) => c.includes(h))
    );
    countCol = countIdx !== -1 ? countIdx : nameCol + 1;
    phoneCol = phoneIdx !== -1 ? phoneIdx : null;
  }

  const rows: ImportRow[] = [];
  for (let i = startRow; i < grid.length; i++) {
    const row = grid[i];
    const name = String(row[nameCol] ?? "").trim();
    if (!name) continue;
    const rawCount = Number(String(row[countCol] ?? "").trim());
    const maxGuests =
      Number.isFinite(rawCount) && rawCount >= 1
        ? Math.min(Math.floor(rawCount), 50)
        : 1;
    const phoneRaw =
      phoneCol !== null ? String(row[phoneCol] ?? "").trim() : "";
    rows.push({
      name: name.slice(0, 160),
      maxGuests,
      phone: phoneRaw ? phoneRaw.slice(0, 24) : null,
    });
  }
  return rows;
}

export function buildTemplate(): Buffer {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ["Name / الاسم", "Invites / عدد الدعوات", "Phone / الهاتف"],
    ["عائلة محمد أحمد", 4, "0791234567"],
    ["John Smith", 2, ""],
  ]);
  ws["!cols"] = [{ wch: 32 }, { wch: 20 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws, "Guests");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export type ExportRow = {
  name: string;
  maxGuests: number;
  phone: string | null;
  status: string;
  attendingCount: number | null;
  mobile: string | null;
  respondedAt: string;
  sent: string;
  opened: string;
  tableNo: string;
  notes: string;
  link: string;
};

export function buildExport(rows: ExportRow[]): Buffer {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    [
      "Name / الاسم",
      "Seats / المقاعد",
      "Phone / الهاتف",
      "Status / الحالة",
      "Coming / عدد الحضور",
      "RSVP mobile / هاتف الرد",
      "Replied at / تاريخ الرد",
      "Sent / أُرسلت",
      "Opened / فُتحت",
      "Table / الطاولة",
      "Notes / ملاحظات",
      "Link / الرابط",
    ],
    ...rows.map((r) => [
      r.name,
      r.maxGuests,
      r.phone ?? "",
      r.status,
      r.attendingCount ?? "",
      r.mobile ?? "",
      r.respondedAt,
      r.sent,
      r.opened,
      r.tableNo,
      r.notes,
      r.link,
    ]),
  ]);
  ws["!cols"] = [
    { wch: 30 },
    { wch: 10 },
    { wch: 16 },
    { wch: 12 },
    { wch: 10 },
    { wch: 16 },
    { wch: 18 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 30 },
    { wch: 46 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "RSVPs");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
