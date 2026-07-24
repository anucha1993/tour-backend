'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import {
  ArrowLeft,
  Printer,
  Plug,
  KeyRound,
  Layers,
  ListChecks,
  Braces,
  Wand2,
  Coins,
  FileJson,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Star,
  Send,
  Mail,
  Clock,
  ShieldCheck,
  RefreshCw,
  Boxes,
  ArrowRightLeft,
  Server,
  Share2,
  Link2,
  Copy,
  Check,
  Loader2,
  X,
} from 'lucide-react';

/* ────────────────────────────────────────────────────────────────
   ข้อมูลฟิลด์ (ตรงกับ ALL_FIELDS ใน integrations/[id]/mapping/page.tsx)
   ──────────────────────────────────────────────────────────────── */

interface Field {
  key: string;
  label: string;
  type: string;
  required: boolean;
  note?: string;
}

const TOUR_FIELDS: Field[] = [
  { key: 'external_id', label: 'รหัสจาก API', type: 'string', required: true, note: 'ID ทัวร์ฝั่งคุณ ใช้จับคู่ตอน sync (ห้ามเปลี่ยน)' },
  { key: 'tour_code', label: 'รหัสทัวร์', type: 'string', required: true, note: 'ถ้าไม่ส่ง ระบบจะสร้างรหัส NT ให้เอง' },
  { key: 'wholesaler_tour_code', label: 'รหัสทัวร์ฝั่งคุณ', type: 'string', required: false },
  { key: 'title', label: 'ชื่อทัวร์', type: 'string', required: true },
  { key: 'tour_type', label: 'ประเภททัวร์', type: 'enum', required: false, note: 'join / incentive / private' },
  { key: 'duration_days', label: 'จำนวนวัน', type: 'int', required: true },
  { key: 'duration_nights', label: 'จำนวนคืน', type: 'int', required: false },
  { key: 'primary_country_id', label: 'ประเทศหลัก', type: 'lookup', required: true, note: 'ส่งได้เป็น iso2 (TH) / iso3 (THA) / ชื่อ (Thailand)' },
  { key: 'region', label: 'ภูมิภาค', type: 'enum', required: false, note: 'asia / europe / america / oceania / africa / middle_east' },
  { key: 'transport_id', label: 'สายการบิน/ขนส่ง', type: 'lookup', required: false, note: 'ส่งได้เป็น code (TG) / ชื่อ (Thai Airways)' },
  { key: 'hotel_star', label: 'ระดับโรงแรม', type: 'int', required: false, note: '3 / 4 / 5 / 0=ไม่ระบุ' },
  { key: 'themes', label: 'ธีม', type: 'array<string>', required: false },
  { key: 'suitable_for', label: 'เหมาะสำหรับ', type: 'array<string>', required: false },
];

const PERIOD_FIELDS: Field[] = [
  { key: 'external_id', label: 'รหัสรอบจาก API', type: 'string', required: true, note: 'ID รอบเดินทางฝั่งคุณ ใช้จับคู่ตอน sync' },
  { key: 'start_date', label: 'วันเดินทางไป', type: 'date', required: true, note: 'YYYY-MM-DD หรือช่วง "2027-03-21 - 2027-03-24" (ใช้ transform date_range)' },
  { key: 'end_date', label: 'วันเดินทางกลับ', type: 'date', required: false },
  { key: 'capacity', label: 'ที่นั่งทั้งหมด', type: 'int', required: false },
  { key: 'available', label: 'ที่นั่งว่าง', type: 'int', required: false },
  { key: 'status', label: 'สถานะรอบ', type: 'enum', required: true, note: 'draft / open / closed / full / cancelled' },
  { key: 'guarantee_status', label: 'สถานะยืนยัน', type: 'enum', required: false, note: 'pending / guaranteed / cancelled' },
];

const OFFER_FIELDS: Field[] = [
  { key: 'currency', label: 'สกุลเงิน', type: 'enum', required: true, note: 'THB / USD / EUR / JPY / CNY / KRW / SGD / MYR' },
  { key: 'price_adult', label: 'ราคาผู้ใหญ่ (พัก 2-3)', type: 'float', required: true, note: 'ราคาเต็ม (ก่อนลด)' },
  { key: 'discount_adult', label: 'ส่วนลดผู้ใหญ่', type: 'float', required: false, note: 'จำนวนเงินที่ลด (ไม่ใช่ราคาขาย) — ราคาขาย = price_adult − discount_adult' },
  { key: 'price_child', label: 'ราคาเด็ก (มีเตียง)', type: 'float', required: false },
  { key: 'discount_child_bed', label: 'ส่วนลดเด็กมีเตียง', type: 'float', required: false },
  { key: 'price_child_nobed', label: 'ราคาเด็ก (ไม่เสริมเตียง)', type: 'float', required: false },
  { key: 'discount_child_nobed', label: 'ส่วนลดเด็กไม่เสริมเตียง', type: 'float', required: false },
  { key: 'price_infant', label: 'ราคาทารก', type: 'float', required: false },
  { key: 'price_joinland', label: 'ราคา Join Land', type: 'float', required: false, note: 'ไม่รวมตั๋วเครื่องบิน' },
  { key: 'price_single', label: 'พักเดี่ยว (ส่วนเพิ่ม)', type: 'float', required: false },
  { key: 'discount_single', label: 'ส่วนลดพักเดี่ยว', type: 'float', required: false },
  { key: 'deposit', label: 'มัดจำ', type: 'float', required: false },
  { key: 'commission_agent', label: 'คอมมิชชั่น Agent', type: 'float', required: false },
  { key: 'commission_sale', label: 'คอมมิชชั่น Sale', type: 'float', required: false },
  { key: 'cancellation_policy', label: 'เงื่อนไขยกเลิก', type: 'string', required: true },
  { key: 'refund_policy', label: 'เงื่อนไขคืนเงิน', type: 'string', required: false },
  { key: 'notes', label: 'หมายเหตุราคา', type: 'string', required: false },
];

const PROMOTION_FIELDS: Field[] = [
  { key: 'promo_code', label: 'รหัสโปรโมชัน', type: 'string', required: false },
  { key: 'name', label: 'ชื่อโปรโมชัน', type: 'string', required: false },
  { key: 'type', label: 'ประเภทส่วนลด', type: 'enum', required: false, note: 'discount_amount / discount_percent / freebie' },
  { key: 'value', label: 'มูลค่าส่วนลด', type: 'float', required: false },
  { key: 'apply_to', label: 'ใช้กับ', type: 'enum', required: false, note: 'per_pax / per_booking' },
  { key: 'start_at', label: 'โปรเริ่ม', type: 'date', required: false },
  { key: 'end_at', label: 'โปรหมดอายุ', type: 'date', required: false },
  { key: 'is_active', label: 'เปิดใช้งาน', type: 'boolean', required: false },
];

const CONTENT_FIELDS: Field[] = [
  { key: 'description', label: 'รายละเอียด', type: 'string', required: false },
  { key: 'highlights', label: 'ไฮไลท์', type: 'array<string>', required: false },
  { key: 'shopping_highlights', label: 'ไฮไลท์ช้อปปิ้ง', type: 'array<string>', required: false },
  { key: 'food_highlights', label: 'ไฮไลท์อาหาร', type: 'array<string>', required: false },
  { key: 'inclusions', label: 'รวมในแพ็คเกจ', type: 'array<string>', required: false },
  { key: 'exclusions', label: 'ไม่รวมในแพ็คเกจ', type: 'array<string>', required: false },
  { key: 'conditions', label: 'เงื่อนไขการจอง', type: 'string', required: false },
];

const MEDIA_FIELDS: Field[] = [
  { key: 'cover_image_url', label: 'รูปปก', type: 'url', required: false },
  { key: 'gallery', label: 'แกลเลอรี่', type: 'array<url>', required: false },
  { key: 'pdf_url', label: 'โบรชัวร์ PDF', type: 'url', required: false },
  { key: 'og_image_url', label: 'OG Image', type: 'url', required: false },
];

const ITINERARY_FIELDS: Field[] = [
  { key: 'external_id', label: 'รหัสวันจาก API', type: 'string', required: false },
  { key: 'day_number', label: 'วันที่ (ลำดับ)', type: 'int', required: true },
  { key: 'title', label: 'หัวข้อวัน', type: 'string', required: false },
  { key: 'description', label: 'รายละเอียด', type: 'string', required: false },
  { key: 'places', label: 'สถานที่', type: 'array<string>', required: false },
  { key: 'has_breakfast', label: 'อาหารเช้า', type: 'boolean', required: false },
  { key: 'has_lunch', label: 'อาหารกลางวัน', type: 'boolean', required: false },
  { key: 'has_dinner', label: 'อาหารเย็น', type: 'boolean', required: false },
  { key: 'accommodation', label: 'ที่พัก', type: 'string', required: false },
  { key: 'hotel_star', label: 'ระดับดาว', type: 'int', required: false },
  { key: 'images', label: 'รูปภาพ', type: 'array<url>', required: false },
];

const SEO_FIELDS: Field[] = [
  { key: 'slug', label: 'URL Slug', type: 'string', required: false },
  { key: 'meta_title', label: 'Meta Title', type: 'string', required: false },
  { key: 'meta_description', label: 'Meta Description', type: 'string', required: false },
  { key: 'keywords', label: 'Keywords', type: 'array<string>', required: false },
  { key: 'hashtags', label: 'Hashtags', type: 'array<string>', required: false },
];

/* ────────────────────────────────────────────────────────────────
   ตัวช่วย render
   ──────────────────────────────────────────────────────────────── */

function FieldTable({ fields }: { fields: Field[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="text-left px-3 py-2 font-medium">ฟิลด์ระบบเรา</th>
            <th className="text-left px-3 py-2 font-medium">ความหมาย</th>
            <th className="text-left px-3 py-2 font-medium">ชนิด</th>
            <th className="text-center px-3 py-2 font-medium">จำเป็น</th>
            <th className="text-left px-3 py-2 font-medium">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {fields.map((f) => (
            <tr key={f.key} className="hover:bg-gray-50 align-top">
              <td className="px-3 py-2">
                <code className="text-purple-700 font-mono text-xs">{f.key}</code>
              </td>
              <td className="px-3 py-2 text-gray-700">{f.label}</td>
              <td className="px-3 py-2">
                <span className="text-xs font-mono text-gray-500">{f.type}</span>
              </td>
              <td className="px-3 py-2 text-center">
                {f.required ? (
                  <span className="inline-block px-1.5 py-0.5 rounded bg-red-50 text-red-600 text-xs font-medium">บังคับ</span>
                ) : (
                  <span className="text-gray-300 text-xs">–</span>
                )}
              </td>
              <td className="px-3 py-2 text-gray-500 text-xs">{f.note || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EndpointTable({ rows }: { rows: [string, string, string][] }) {
  const color = (m: string) =>
    m === 'GET'
      ? 'bg-sky-50 text-sky-700'
      : m === 'PUT'
        ? 'bg-amber-50 text-amber-700'
        : m === 'DELETE'
          ? 'bg-red-50 text-red-700'
          : 'bg-emerald-50 text-emerald-700';
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <tbody className="divide-y divide-gray-100">
          {rows.map((r) => (
            <tr key={r[1]} className="align-top hover:bg-gray-50">
              <td className="px-3 py-2 w-16">
                <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold ${color(r[0])}`}>
                  {r[0]}
                </span>
              </td>
              <td className="px-3 py-2">
                <code className="text-purple-700 font-mono text-xs break-all">{r[1]}</code>
              </td>
              <td className="px-3 py-2 text-gray-500 text-xs">{r[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionCard({
  id,
  icon,
  title,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card id={id} className="p-5 sm:p-6 scroll-mt-24">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>
      <div className="space-y-4 text-sm text-gray-700 leading-relaxed">{children}</div>
    </Card>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-xs leading-relaxed font-mono whitespace-pre">
      {children}
    </pre>
  );
}

/* ────────────────────────────────────────────────────────────────
   ตัวอย่าง payload
   ──────────────────────────────────────────────────────────────── */

const SAMPLE_SINGLE = `// โหมด single — ทัวร์ + รอบเดินทาง มาในก้อนเดียว
{
  "data": [
    {
      "id": "TR-1001",                         // → tour.external_id
      "code": "JP-TG-5D",                       // → tour.wholesaler_tour_code
      "name": "มหัศจรรย์ญี่ปุ่น โตเกียว 5 วัน",   // → tour.title
      "days": 5, "nights": 3,                    // → duration_days / nights
      "country": "JP",                           // → primary_country_id (iso2)
      "airline": "TG",                           // → transport_id (code)
      "cover": "https://cdn.you/img/1001.jpg",   // → media.cover_image_url
      "periods": [
        {
          "period_id": "P-55",                   // → departure.external_id
          "date_start": "2026-11-12",            // → start_date
          "date_end": "2026-11-16",              // → end_date
          "seat": 30, "seat_available": 12,      // → capacity / available
          "status": "open",                      // → status
          "price": {
            "adult": 45900,                      // → price_adult
            "adult_sale": 42900,                 // → ใช้ formula: price_adult - adult_sale = discount_adult
            "single": 8000                       // → price_single
          }
        }
      ]
    }
  ],
  "meta": { "total": 240, "per_page": 50, "totalPages": 5 }
}`;

const SAMPLE_TWO_PHASE_TOURS = `// โหมด two_phase — (1) endpoint รายการทัวร์
GET https://api.you.com/v1/tours?page=1&per_page=50
{
  "data": [
    { "id": 1839, "code": "PKX11", "name": "ปักกิ่ง 4 วัน", "days": 4, "country": "CN" }
  ],
  "total": 87, "page": 1, "max_pages": 2
}`;

const SAMPLE_TWO_PHASE_PERIODS = `// โหมด two_phase — (2) endpoint รอบเดินทาง (ต่อทัวร์)
GET https://api.you.com/v1/tour-dates?tour_id={external_id}
{
  "success": true,
  "data": [
    {
      "id": 21014,                              // → departure.external_id
      "period": "2027-03-18 - 2027-03-22",      // → start_date/end_date (transform date_range)
      "seat": "20", "available_seat": "20",
      "post_status": "publish",                 // → status (map เป็น open)
      "price": {
        "adult": { "regular_price": "18999", "sale_price": "17999" }
      }
    }
  ]
}`;

/* ────────────────────────────────────────────────────────────────
   Case ตัวอย่างจริง (ไม่ระบุชื่อ Wholesale) — ~100% เข้ากันได้
   ──────────────────────────────────────────────────────────────── */

const CASE_CONFIG: [string, string][] = [
  ['Base URL', 'https://api.wholesale-x.com/v1.5/programtours'],
  ['รูปแบบ API', 'REST (JSON)'],
  ['โหมด sync', 'single — ทัวร์ + รอบเดินทาง + ราคา มาในก้อนเดียว'],
  ['วิธียืนยันตัวตน', 'custom header → auth-token: <JWT>'],
  ['การแบ่งหน้า', 'cursor (ดึงต่อเนื่องจนหมด)'],
  ['ประเภท', 'config-driven (ไม่ต้องเขียนโค้ดเฉพาะ)'],
];

// ตัวอย่าง response จริงจาก Wholesale รายหนึ่ง (ตัดให้สั้น) — ฟิลด์ตรงกับที่ระบบ map อยู่
const CASE_SAMPLE = `{
  "ProductID": "26051",                    // → tour.external_id
  "ProductCode": "WSX-KIX-2411TG",         // → tour.wholesaler_tour_code
  "ProductName": "มหัศจรรย์ OSAKA ...",     // → tour.title / seo.meta_title
  "CountryName": "Japan",                   // → tour.primary_country_id (lookup: name_en)
  "AirlineCode": "TG",                      // → tour.transport_id (lookup: code)
  "Days": 5, "Nights": 3,                   // → duration_days / duration_nights
  "URLImage": "https://.../cover.jpg",      // → media.cover_image_url
  "FilePDF": "https://.../program.pdf",     // → media.pdf_url
  "Highlight": "ชมซากุระ ...",              // → content.highlights + seo
  "Itinerary": [
    {
      "ItinID": "1", "ItinDay": "1",        // → itinerary.external_id / day_number
      "ItinDes": "สนามบินสุวรรณภูมิ",        // → itinerary.title / description / places
      "ItinHotel": "APA Hotel",             // → itinerary.accommodation
      "ItinHotelStar": "4",                 // → itinerary.hotel_star
      "ItinBfast": "N", "ItinLunch": "Y", "ItinDnr": "Y"  // → value_map: Y→true, N→false
    }
  ],
  "Periods": [
    {
      "PeriodID": "884512",                 // → departure.external_id
      "PeriodStartDate": "2026-11-12",      // → start_date
      "PeriodEndDate": "2026-11-16",        // → end_date
      "PeriodStatus": "book",               // → status (value_map: book→open)
      "Seat": "9", "GroupSize": "30",       // → available / capacity
      "Price": "45900", "Price_End": "42900", // → price_adult / discount = Price - Price_End
      "Price_Child": "44900",               // → price_child
      "Price_ChildNB": "43900",             // → price_child_nobed
      "Price_Infant": "9000",               // → price_infant
      "Price_Single_Bed": "8000",           // → price_single
      "ComAgent": "1000", "ComSale": "500"  // → commission_agent / commission_sale
    }
  ]
}`;

// ตัวอย่าง transform จริงจากการตั้งค่าที่ใช้งาน
const CASE_TRANSFORMS: { our: string; their: string; type: string; cfg: string }[] = [
  { our: 'discount_adult', their: 'Periods[].Price', type: 'formula', cfg: '{Price} - {Price_End}' },
  { our: 'has_breakfast', their: 'Itinerary[].ItinBfast', type: 'value_map', cfg: 'Y→true, N→false, ว่าง→false' },
  { our: 'status (period)', their: 'Periods[].PeriodStatus', type: 'value_map', cfg: 'book→open' },
  { our: 'primary_country_id', their: 'CountryName', type: 'lookup', cfg: 'จับคู่ด้วยชื่อประเทศ (name_en)' },
  { our: 'transport_id', their: 'AirlineCode', type: 'lookup', cfg: 'จับคู่ด้วยรหัสสายการบิน (code)' },
  { our: 'hashtags', their: 'Highlight', type: 'split', cfg: 'แยกด้วยช่องว่าง' },
  { our: 'description', their: 'ProductName + Highlight', type: 'template', cfg: '{ProductName}-{Highlight}' },
];

/* ────────────────────────────────────────────────────────────────
   Outbound Booking — provider / ความสามารถ / endpoint / ตัวอย่าง
   (ตรงกับ AdapterFactory::$bookingAdapters + *BookingAdapter::getConfigSchema())
   ──────────────────────────────────────────────────────────────── */

// provider ที่ลงทะเบียนใน AdapterFactory::$bookingAdapters
const BOOKING_PROVIDERS: { code: string; name: string; api: string; note: string }[] = [
  { code: 'zego', name: 'Zego Travel — Custom Booking API', api: 'REST v1.5 (3 ขั้นตอน)', note: 'ยิงจองเข้าระบบ Zego โดยตรงแบบเรียลไทม์' },
  { code: 'manual', name: 'Manual (แจ้งเตือนทางอีเมล)', api: 'Email', note: 'สำหรับเจ้าที่ยังไม่มี Booking API — ส่งอีเมลแจ้งจอง รอยืนยันเอง' },
];

// การตั้งค่าระดับ integration (คอลัมน์บน wholesaler_api_configs)
const BOOKING_CORE_FIELDS: Field[] = [
  { key: 'booking_enabled', label: 'เปิดใช้งาน Booking API', type: 'boolean', required: true, note: 'เมื่อเปิด ระบบจะยิงคำขอจองไป Wholesaler อัตโนมัติเมื่อมีลูกค้าจอง' },
  { key: 'booking_provider', label: 'Provider', type: 'enum', required: true, note: 'zego / manual (บังคับเมื่อเปิดใช้งาน)' },
  { key: 'booking_hold_ttl_seconds', label: 'อายุใบเสนอราคา (วินาที)', type: 'int', required: false, note: 'ค่าเริ่มต้น 900 (15 นาที) • ช่วง 60–7200' },
];

// ฟิลด์ตั้งค่าของ Zego (ZegoBookingAdapter::getConfigSchema)
const ZEGO_CONFIG_FIELDS: Field[] = [
  { key: 'public_key', label: 'Public Key', type: 'password', required: true, note: 'ดูได้ที่ zegotravel.com/AgencyProfile' },
  { key: 'base_url', label: 'Base URL', type: 'url', required: true, note: 'ค่าเริ่มต้น https://www.zegoapi.com/v1.5/booking' },
  { key: 'redirect_url', label: 'Redirect URL', type: 'url', required: false, note: 'URL เด้งกลับเมื่อจองสำเร็จ' },
  { key: 'max_pax', label: 'ผู้โดยสารสูงสุด/การจอง', type: 'number', required: false, note: 'ค่าเริ่มต้น 10 (Zego จำกัด 10 คน)' },
];

// ฟิลด์ตั้งค่าของ Manual (ManualBookingAdapter::getConfigSchema)
const MANUAL_CONFIG_FIELDS: Field[] = [
  { key: 'contact_email', label: 'อีเมลผู้รับแจ้งจอง', type: 'email', required: true, note: 'อีเมลที่รับการแจ้งเตือนเมื่อมีจองใหม่' },
  { key: 'contact_phone', label: 'เบอร์ติดต่อ', type: 'text', required: false },
  { key: 'reply_to', label: 'Reply-To Email', type: 'email', required: false },
  { key: 'subject_prefix', label: 'คำนำหน้าหัวข้ออีเมล', type: 'text', required: false, note: 'ค่าเริ่มต้น [Booking Request]' },
];

// เมทริกซ์ความสามารถ (ตรงกับ supportedFeatures())
const BOOKING_FEATURES: { key: string; label: string; zego: boolean; manual: boolean }[] = [
  { key: 'real_hold', label: 'กันที่นั่งจริงฝั่ง Wholesaler (Hold)', zego: false, manual: false },
  { key: 'cancel', label: 'ยกเลิกการจองผ่าน API', zego: false, manual: true },
  { key: 'modify', label: 'แก้ไขการจองผ่าน API', zego: false, manual: true },
  { key: 'multi_room', label: 'ระบุหลายประเภทห้อง', zego: true, manual: true },
  { key: 'remark', label: 'แนบหมายเหตุถึง Wholesaler', zego: true, manual: true },
];

// endpoint ตั้งค่า/ทดสอบ provider (BookingIntegrationController)
const BOOKING_ADMIN_ENDPOINTS: [string, string, string][] = [
  ['GET', '/integrations/booking/providers', 'รายชื่อ provider ทั้งหมด + schema (สำหรับ dropdown)'],
  ['GET', '/integrations/booking/providers/{code}/schema', 'schema ของ provider เดียว'],
  ['GET', '/integrations/{id}/booking', 'อ่านการตั้งค่า booking ปัจจุบันของ integration'],
  ['PUT', '/integrations/{id}/booking', 'บันทึกการตั้งค่า booking'],
  ['POST', '/integrations/{id}/booking/test', 'ตรวจสุขภาพ provider (validateConfig + healthCheck)'],
];

// endpoint วงจรการจอง (Api\\BookingController)
const BOOKING_LIFECYCLE_ENDPOINTS: [string, string, string][] = [
  ['POST', '/bookings/outbound/quote', 'สร้างใบเสนอราคา/กันที่ (quote) จาก period + จำนวนผู้โดยสาร'],
  ['POST', '/bookings/outbound/{id}/hold', 'บันทึกรายชื่อผู้โดยสารเข้ากับ quote'],
  ['POST', '/bookings/outbound/{id}/confirm', 'ส่งจองจริงไป Wholesaler ด้วย quote'],
  ['POST', '/bookings/outbound/{id}/cancel', 'ยกเลิกการจอง (ถ้า provider รองรับ)'],
  ['POST', '/bookings/{id}/outbound/retry', 'ยิงจองซ้ำเมื่อรอบก่อนหน้าล้มเหลว'],
];

// Zego 3-step flow (ZegoBookingAdapter)
const ZEGO_STEPS: [string, string, string][] = [
  ['GET', '/product/{public_key}/{product_code}', 'ดึงโปรแกรม + รายการรอบ (periods) ทั้งหมด'],
  ['GET', '/period/{public_key}/{period_id}', 'ดึงรอบที่เลือก + ออก uuid (ใช้ครั้งเดียว) + เทมเพลตราคา/ห้อง'],
  ['POST', '/booking-submit', 'ส่งจอง — header: x-public-key, x-uuid'],
];

const SAMPLE_QUOTE_REQ = `POST /api/bookings/outbound/quote
{
  "product_code": "WSX-KIX-2411TG",   // = tour.wholesaler_tour_code
  "travel_date":  "2026-11-12",         // Y-m-d ตรงกับรอบเดินทาง
  "pax_adult": 2, "pax_child": 1,
  "pax_child_nb": 0, "pax_infant": 0,
  "rooms": [ { "code": "TWN", "num": 1 } ]
}`;

const SAMPLE_QUOTE_RES = `// QuoteResult (toArray)
{
  "success": true,
  "quote_id": "zego_8f2c...e1",          // ใช้ยืนยันจองในสเต็ปถัดไป
  "expires_at": "2026-11-01T10:15:00+07:00",
  "remaining_seconds": 900,              // นับถอยหลังตาม hold_ttl
  "total_price": 137700, "currency": "THB",
  "breakdown": [
    { "label": "Adult", "qty": 2, "unit_price": 45900, "subtotal": 91800 }
  ],
  "passenger_types": [ /* code ผู้โดยสารที่ provider รองรับ เช่น MA/CH/IF */ ],
  "room_types":      [ /* code ห้องที่ provider รองรับ */ ],
  "is_real_hold": false                  // Zego = pseudo-hold (นับถอยหลังฝั่งเรา)
}`;

const SAMPLE_BOOK_REQ = `POST /api/bookings/outbound/{id}/confirm
{
  "customer_name":  "สมชาย ใจดี",
  "customer_phone": "0812345678",        // Zego บังคับ 10 หลักพอดี
  "remark": "ขอที่นั่งติดหน้าต่าง",
  "passengers": [ { "code": "MA", "num": 2 }, { "code": "CH", "num": 1 } ],
  "rooms":      [ { "code": "TWN", "num": 1 } ]
}`;

const SAMPLE_BOOK_RES = `// BookingResult (toArray)
{
  "success": true,
  "booking_ref": "ZG-88451207",
  "confirmation_number": "ZG-88451207",
  "status": "confirmed",                 // confirmed | pending | cancelled | failed
  "error_message": null, "error_code": null
}`;

/* ────────────────────────────────────────────────────────────────
   หน้า
   ──────────────────────────────────────────────────────────────── */

const TOC = [
  { id: 'overview', label: '1. ระบบทำงานอย่างไร' },
  { id: 'connection', label: '2. รูปแบบการเชื่อมต่อที่รองรับ' },
  { id: 'auth', label: '3. การยืนยันตัวตน (Auth)' },
  { id: 'pagination', label: '4. การแบ่งหน้า (Pagination)' },
  { id: 'response', label: '5. รูปแบบ Response ที่รองรับ' },
  { id: 'fields', label: '6. ฟิลด์ทั้งหมด (Field Dictionary)' },
  { id: 'transform', label: '7. การแปลงค่า (Transform)' },
  { id: 'pricing', label: '8. โมเดลราคา' },
  { id: 'samples', label: '9. ตัวอย่าง Payload' },
  { id: 'case-study', label: '10. Case ตัวอย่างจริง' },
  { id: 'tester', label: '11. เครื่องมือทดสอบ % (เร็ว ๆ นี้)' },
  { id: 'checklist', label: '12. เช็กลิสต์ก่อนส่ง' },
];

const TOC_OUTBOUND = [
  { id: 'ob-overview', label: 'A. Outbound Booking คืออะไร' },
  { id: 'ob-providers', label: 'B. Provider ที่รองรับ + ความสามารถ' },
  { id: 'ob-config', label: 'C. การตั้งค่าต่อ Integration' },
  { id: 'ob-lifecycle', label: 'D. วงจรการจอง (Quote → Confirm)' },
  { id: 'ob-provider-apis', label: 'E. รายละเอียด API แต่ละเจ้า' },
  { id: 'ob-partner', label: 'F. Wholesaler ที่มี Booking API' },
];

/** สรุปจำนวนฟิลด์บังคับ ใช้ทั้งในตารางและสเปกตัวทดสอบ */
const REQUIRED_TOUR = TOUR_FIELDS.filter((f) => f.required).length;
const REQUIRED_PERIOD = PERIOD_FIELDS.filter((f) => f.required).length;
const REQUIRED_OFFER = OFFER_FIELDS.filter((f) => f.required).length;

export function IntegrationManual({ mode = 'admin' }: { mode?: 'admin' | 'public' }) {
  const [activeTester, setActiveTester] = useState(false);
  const isAdmin = mode === 'admin';

  // Share-link state (admin only)
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareExpiry, setShareExpiry] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState('');
  const [shareCopied, setShareCopied] = useState(false);

  const handleShare = async () => {
    setShareOpen(true);
    if (shareUrl || shareLoading) return;
    setShareLoading(true);
    setShareError('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const res = await fetch('/api/share/manual', {
        method: 'POST',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.token) {
        throw new Error(data?.message || 'สร้างลิงก์ไม่สำเร็จ');
      }
      setShareUrl(`${window.location.origin}/shared/integrations-manual?token=${encodeURIComponent(data.token)}`);
      setShareExpiry(data.expiresAt || '');
    } catch (e) {
      setShareError(e instanceof Error ? e.message : 'สร้างลิงก์ไม่สำเร็จ');
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      setShareError('คัดลอกอัตโนมัติไม่ได้ กรุณาเลือกข้อความแล้วคัดลอกเอง');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          {isAdmin ? (
            <Link
              href="/dashboard/integrations"
              className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          ) : (
            <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">คู่มือการเชื่อมต่อ API สำหรับ Wholesaler</h1>
            <p className="text-gray-500 text-xs sm:text-sm">
              รองรับ 2 ทิศทาง: ขาเข้า — ดึงข้อมูลทัวร์ (Sync) และ ขาออก — ส่งการจองไปยัง Wholesaler (Booking)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isAdmin && (
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-sm font-medium"
            >
              <Share2 className="w-4 h-4" />
              แชร์ลิงก์ (ไม่ต้องล็อกอิน)
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium"
          >
            <Printer className="w-4 h-4" />
            พิมพ์ / บันทึก PDF
          </button>
        </div>
      </div>

      {/* Public read-only banner */}
      {!isAdmin && (
        <div className="rounded-xl border border-purple-100 bg-purple-50 px-4 py-3 text-sm text-purple-800 flex items-center gap-2 print:hidden">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          เอกสารสำหรับพาร์ทเนอร์ (อ่านอย่างเดียว) — ลิงก์นี้มีอายุจำกัดและไม่ต้องเข้าสู่ระบบ
        </div>
      )}

      {/* Share modal (admin) */}
      {isAdmin && shareOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:hidden"
          onClick={() => setShareOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Link2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">แชร์คู่มือแบบไม่ต้องล็อกอิน</h3>
                  <p className="text-xs text-gray-500">ส่ง URL นี้ให้พาร์ทเนอร์เปิดอ่านได้ทันที</p>
                </div>
              </div>
              <button onClick={() => setShareOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {shareLoading ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm py-6 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" /> กำลังสร้างลิงก์…
              </div>
            ) : shareError ? (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-700">{shareError}</div>
            ) : (
              <>
                <div className="flex items-stretch gap-2">
                  <input
                    readOnly
                    value={shareUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 font-mono"
                  />
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-sm font-medium flex-shrink-0"
                  >
                    {shareCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {shareCopied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                  </button>
                </div>
                {shareExpiry && (
                  <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    ลิงก์หมดอายุ{' '}
                    {new Date(shareExpiry).toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' })} (7 วัน)
                  </p>
                )}
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800 mt-3">
                  ใครก็ตามที่มีลิงก์นี้เปิดอ่านคู่มือได้จนกว่าจะหมดอายุ — ส่งเฉพาะผู้ที่เกี่ยวข้อง
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        {/* Table of contents */}
        <aside className="hidden lg:block print:hidden">
          <div className="sticky top-24">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3 text-gray-900 font-semibold text-sm">
                <BookOpen className="w-4 h-4" /> สารบัญ
              </div>
              <nav className="space-y-1">
                <div className="px-2 pt-0.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-purple-400">
                  ขาเข้า — ดึงข้อมูล (Sync)
                </div>
                {TOC.map((t) => (
                  <a
                    key={t.id}
                    href={`#${t.id}`}
                    className="block px-2 py-1.5 rounded text-xs text-gray-600 hover:bg-purple-50 hover:text-purple-700"
                  >
                    {t.label}
                  </a>
                ))}
                <div className="px-2 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-blue-400">
                  ขาออก — ส่งการจอง (Booking)
                </div>
                {TOC_OUTBOUND.map((t) => (
                  <a
                    key={t.id}
                    href={`#${t.id}`}
                    className="block px-2 py-1.5 rounded text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {t.label}
                  </a>
                ))}
              </nav>
            </Card>
          </div>
        </aside>

        {/* Content */}
        <div className="space-y-6 min-w-0">
          {/* 1. Overview */}
          <SectionCard id="overview" icon={<Plug className="w-5 h-5" />} title="1. ระบบทำงานอย่างไร">
            <p>
              ระบบของเราเป็นแบบ <strong>config-driven</strong> — เราไม่ต้องเขียนโค้ดใหม่ต่อ Wholesaler แต่ละราย
              เพียงคุณส่ง <strong>Endpoint + วิธียืนยันตัวตน</strong> มาให้ แล้วเราจะ &ldquo;จับคู่ฟิลด์&rdquo; (mapping)
              ระหว่างฟิลด์ใน API ของคุณกับฟิลด์ในระบบเราผ่านหน้าจอตั้งค่า
            </p>
            <p>การดึงข้อมูล (Sync) มี 2 เฟส:</p>
            <ol className="list-decimal ml-5 space-y-1">
              <li><strong>เฟส 1 — ดึงรายการทัวร์:</strong> เรียก endpoint รายการทัวร์ (รองรับแบ่งหน้า) แล้วสร้าง/อัปเดตทัวร์ในระบบ</li>
              <li><strong>เฟส 2 — ดึงรอบเดินทาง + ราคา:</strong> สำหรับแต่ละทัวร์ เรียก endpoint รอบเดินทาง แล้วสร้างรอบ (periods) และราคา (offers)</li>
            </ol>
            <p>
              มี 2 โหมด: <code>single</code> (ทัวร์ + รอบเดินทางมาในก้อนเดียว) และ <code>two_phase</code>
              (แยก endpoint สำหรับรอบเดินทาง — เหมาะกับ API ที่ต้องส่ง tour_id ไปขอรอบ)
            </p>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800">
              💡 <strong>สิ่งที่คุณต้องเตรียม:</strong> URL endpoint (รายการทัวร์ และรอบเดินทางถ้าเป็น two_phase),
              วิธียืนยันตัวตน (เช่น Bearer token / API Key header), และรูปแบบการแบ่งหน้า (ถ้ามี)
            </div>
          </SectionCard>

          {/* 2. Connection types */}
          <SectionCard id="connection" icon={<Layers className="w-5 h-5" />} title="2. รูปแบบการเชื่อมต่อที่รองรับ">
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { t: 'REST / JSON', d: 'รองรับเต็มรูปแบบ (แนะนำ) — HTTP GET/POST คืน JSON' },
                { t: 'SOAP / GraphQL', d: 'ยังไม่รองรับ (roadmap) — โปรดใช้ REST' },
                { t: 'โหมด single', d: 'ทัวร์ + รอบเดินทาง อยู่ใน response เดียว' },
                { t: 'โหมด two_phase', d: 'แยก endpoint รอบเดินทาง ต่อทัวร์ หรือแบบ bulk' },
                { t: 'Flat rows (group_by)', d: 'ถ้า API คืนแถวแบน ๆ 1 แถว = 1 รอบ เราจัดกลุ่มด้วย key ที่กำหนดได้' },
                { t: 'Custom (Headcode)', d: 'API ที่พิเศษมาก รองรับด้วยไฟล์ adapter เฉพาะ(เราเขียนให้)' },
              ].map((x) => (
                <div key={x.t} className="border border-gray-200 rounded-lg p-3">
                  <div className="font-semibold text-gray-900 text-sm">{x.t}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{x.d}</div>
                </div>
              ))}
            </div>
            <div className="mt-2">
              <p className="font-semibold text-gray-900 mb-1">Endpoint &amp; ตัวแปรแทนค่า (placeholder)</p>
              <p>ใน URL ของ endpoint รอบเดินทาง (two_phase) สามารถใส่ placeholder เหล่านี้ ระบบจะแทนค่าให้อัตโนมัติ:</p>
              <CodeBlock>{`{external_id}  {tour_id}  {id}  {series_id}
{tour_code}  {wholesaler_tour_code}  {code}  {slug}

ตัวอย่าง:  https://api.you.com/v1/tour-dates?tour_id={external_id}
ถ้า endpoint ไม่มี {placeholder} = เราถือว่าเป็น "bulk" (ดึงรอบทั้งหมดครั้งเดียว)`}</CodeBlock>
            </div>
          </SectionCard>

          {/* 3. Auth */}
          <SectionCard id="auth" icon={<KeyRound className="w-5 h-5" />} title="3. การยืนยันตัวตน (Auth) — รองรับ 5 แบบ">
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">ประเภท</th>
                    <th className="text-left px-3 py-2 font-medium">วิธีส่ง</th>
                    <th className="text-left px-3 py-2 font-medium">สิ่งที่ต้องแจ้งเรา</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['bearer', 'Header: Authorization: Bearer <token>', 'token' ],
                    ['api_key', 'Header ชื่อที่กำหนดเอง (เช่น X-API-Key)', 'ชื่อ header + ค่า api_key'],
                    ['basic', 'HTTP Basic Auth', 'username + password'],
                    ['oauth2', 'Client Credentials (ขอ token อัตโนมัติ) หรือ access_token สำเร็จรูป', 'token_url + client_id + client_secret'],
                    ['custom', 'หลาย custom header พร้อมกัน', 'รายการ header (key/value)'],
                  ].map((r) => (
                    <tr key={r[0]} className="align-top">
                      <td className="px-3 py-2"><code className="text-purple-700 text-xs">{r[0]}</code></td>
                      <td className="px-3 py-2 text-gray-700 text-xs">{r[1]}</td>
                      <td className="px-3 py-2 text-gray-500 text-xs">{r[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800">
              ⚠️ ชื่อ HTTP header ต้องเป็นอักษร <code>A-Z a-z 0-9 ! # $ % &amp; &apos; * + - . ^ _ ` | ~</code> เท่านั้น
              (ห้ามมี <code>@</code>, ช่องว่าง หรือ <code>:</code>)
            </div>
          </SectionCard>

          {/* 4. Pagination */}
          <SectionCard id="pagination" icon={<Gauge className="w-5 h-5" />} title="4. การแบ่งหน้า (Pagination) — รองรับ 5 แบบ">
            <p>ถ้ารายการทัวร์มีจำนวนมาก โปรดใช้การแบ่งหน้า ไม่งั้นเราจะดึงได้แค่หน้าเดียว โปรดแจ้งชื่อพารามิเตอร์ให้ตรง:</p>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">ชนิด</th>
                    <th className="text-left px-3 py-2 font-medium">พารามิเตอร์</th>
                    <th className="text-left px-3 py-2 font-medium">เราตรวจ &ldquo;มีหน้าถัดไป&rdquo; จาก</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['page', 'page_param (page), per_page_param (per_page), per_page', 'last_page / totalPages / total (หาร per_page)'],
                    ['offset', 'offset_param (offset), limit_param (limit), limit', 'total เทียบ offset+limit'],
                    ['cursor', 'param (cursor)', 'next_cursor / cursor / has_more'],
                    ['post_bulk', 'body (POST เดียวได้ทั้งหมด)', 'ครั้งเดียวจบ'],
                    ['none', '(ไม่มี) — ค่าเริ่มต้น', 'ครั้งเดียวจบ'],
                  ].map((r) => (
                    <tr key={r[0]} className="align-top">
                      <td className="px-3 py-2"><code className="text-purple-700 text-xs">{r[0]}</code></td>
                      <td className="px-3 py-2 text-gray-700 text-xs font-mono">{r[1]}</td>
                      <td className="px-3 py-2 text-gray-500 text-xs">{r[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500">
              เราอ่านจำนวนหน้า/รวมจากได้หลายชื่อ: <code>last_page</code>, <code>meta.last_page</code>,
              <code>meta.totalPages</code>, <code>total_pages</code>, <code>totalPage</code>, <code>total</code>,
              <code>meta.total</code>, <code>count</code>, <code>totalRecord</code>
            </p>
          </SectionCard>

          {/* 5. Response shapes */}
          <SectionCard id="response" icon={<FileJson className="w-5 h-5" />} title="5. รูปแบบ Response ที่รองรับ (4 ทรง)">
            <p>ระบบรับรูปแบบ JSON ได้หลายทรงโดยอัตโนมัติ:</p>
            <CodeBlock>{`1) Array ตรง ๆ:            [ { ... }, { ... } ]
2) ห่อชั้นเดียว:            { "data": [...] }  หรือ  { "tours": [...] }  หรือ  { "items": [...] }
3) ห่อสองชั้น (Laravel):    { "data": { "data": [...], "meta": { ... } } }
4) Object คีย์ตัวเลข:       { "1": {...}, "2": {...}, ... }`}</CodeBlock>
            <p className="text-xs text-gray-500">
              สำหรับ &ldquo;รายการทัวร์&rdquo; เรามองหา array ที่คีย์ <code>data</code> / <code>tours</code> /{' '}
              <code>items</code> ก่อน แล้วค่อย fallback ตามทรงอื่น
            </p>
          </SectionCard>

          {/* 6. Fields */}
          <SectionCard id="fields" icon={<ListChecks className="w-5 h-5" />} title="6. ฟิลด์ทั้งหมด (Field Dictionary)">
            <p>
              คุณไม่จำเป็นต้องตั้งชื่อฟิลด์ให้ตรงกับเรา — เราจับคู่เองผ่านหน้า mapping (รองรับ path ซ้อน เช่น{' '}
              <code>price.adult.regular_price</code>) ตารางด้านล่างคือฟิลด์&ldquo;ปลายทาง&rdquo;ของระบบเรา
              โดยเน้นที่ฟิลด์ <span className="text-red-600 font-medium">บังคับ</span> เป็นหลัก
            </p>

            <h3 className="font-semibold text-gray-900 mt-2">6.1 ข้อมูลทัวร์ (tour)</h3>
            <FieldTable fields={TOUR_FIELDS} />

            <h3 className="font-semibold text-gray-900 mt-4">6.2 รอบเดินทาง (departure → periods)</h3>
            <FieldTable fields={PERIOD_FIELDS} />

            <h3 className="font-semibold text-gray-900 mt-4">6.3 ราคา (departure → offers)</h3>
            <FieldTable fields={OFFER_FIELDS} />

            <h3 className="font-semibold text-gray-900 mt-4">6.4 โปรโมชัน (promotion)</h3>
            <FieldTable fields={PROMOTION_FIELDS} />

            <h3 className="font-semibold text-gray-900 mt-4">6.5 เนื้อหา (content)</h3>
            <FieldTable fields={CONTENT_FIELDS} />

            <h3 className="font-semibold text-gray-900 mt-4">6.6 รูปภาพ/ไฟล์ (media)</h3>
            <FieldTable fields={MEDIA_FIELDS} />

            <h3 className="font-semibold text-gray-900 mt-4">6.7 โปรแกรมรายวัน (itinerary)</h3>
            <FieldTable fields={ITINERARY_FIELDS} />

            <h3 className="font-semibold text-gray-900 mt-4">6.8 SEO</h3>
            <FieldTable fields={SEO_FIELDS} />
          </SectionCard>

          {/* 7. Transform */}
          <SectionCard id="transform" icon={<Wand2 className="w-5 h-5" />} title="7. การแปลงค่า (Transform)">
            <p>ถ้าค่าฝั่งคุณไม่ตรงรูปแบบเราพอดี ระบบมีตัวแปลงค่าให้ตอน mapping:</p>
            <ul className="list-disc ml-5 space-y-1">
              <li><strong>direct</strong> — คัดลอกค่าตรง ๆ</li>
              <li>
                <strong>custom → date_range</strong> — แยกวันจากช่วงเป็นข้อความ เช่น{' '}
                <code>&quot;2027-03-21 - 2027-03-24&quot;</code> → start/end (รองรับตัวคั่น <code>-</code>, <code>–</code>, <code>to</code>, <code>ถึง</code>)
              </li>
              <li>
                <strong>formula</strong> — สูตรคำนวณอ้างอิงหลายฟิลด์ เช่น ส่วนลด ={' '}
                <code>{'{price.adult.regular_price} - {price.adult.sale_price}'}</code> (รองรับ <code>+ - * /</code>, <code>max()</code>, <code>min()</code>)
              </li>
            </ul>
          </SectionCard>

          {/* 8. Pricing */}
          <SectionCard id="pricing" icon={<Coins className="w-5 h-5" />} title="8. โมเดลราคา (สำคัญมาก)">
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
              <p className="font-semibold text-purple-900">กติกาสำคัญ:</p>
              <p className="text-purple-800 text-sm mt-1">
                <code>price_adult</code> = ราคา<strong>เต็ม</strong> (ก่อนลด) &nbsp;•&nbsp;
                <code>discount_adult</code> = <strong>จำนวนเงินที่ลด</strong> (ไม่ใช่ราคาขาย)
              </p>
              <p className="text-purple-800 text-sm mt-2 font-mono bg-white/60 rounded px-2 py-1 inline-block">
                ราคาขายจริง = price_adult − discount_adult
              </p>
            </div>
            <p>
              ถ้า API ของคุณส่งมาเป็น <code>regular_price</code> (ราคาเต็ม) และ <code>sale_price</code> (ราคาขาย)
              ให้ map <code>price_adult ← regular_price</code> และตั้ง <code>discount_adult</code> เป็น formula{' '}
              <code>{'{regular_price} - {sale_price}'}</code> (อย่าส่ง sale_price เข้าช่อง discount ตรง ๆ ไม่งั้นราคาจะเพี้ยน)
            </p>
            <p className="text-xs text-gray-500">
              รูปแบบเดียวกันใช้กับ เด็กมีเตียง / เด็กไม่เสริมเตียง / พักเดี่ยว
            </p>
          </SectionCard>

          {/* 9. Samples */}
          <SectionCard id="samples" icon={<Braces className="w-5 h-5" />} title="9. ตัวอย่าง Payload ที่เข้ากันได้">
            <h3 className="font-semibold text-gray-900">9.1 โหมด single</h3>
            <CodeBlock>{SAMPLE_SINGLE}</CodeBlock>
            <h3 className="font-semibold text-gray-900 mt-3">9.2 โหมด two_phase</h3>
            <CodeBlock>{SAMPLE_TWO_PHASE_TOURS}</CodeBlock>
            <CodeBlock>{SAMPLE_TWO_PHASE_PERIODS}</CodeBlock>
          </SectionCard>

          {/* 10. Real-world case (anonymized) */}
          <SectionCard id="case-study" icon={<Star className="w-5 h-5" />} title="10. Case ตัวอย่างจริง (~100% เข้ากันได้)">
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
              <p className="text-emerald-900 text-sm">
                ตัวอย่างนี้คือการเชื่อมต่อที่<strong>สมบูรณ์แบบ</strong> —
                เชื่อมต่อแบบ config-driven ทั้งหมด <strong>ไม่ต้องเขียนโค้ดเฉพาะ</strong> map ครบ{' '}
                <strong>59 ฟิลด์</strong> ครอบคลุมทัวร์ / รอบเดินทาง / ราคา / เนื้อหา / รูปภาพ / โปรแกรมรายวัน / SEO
                ใช้เป็นแม่แบบได้เลย
              </p>
            </div>

            {/* Config */}
            <h3 className="font-semibold text-gray-900 mt-3">10.1 การตั้งค่าการเชื่อมต่อ</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {CASE_CONFIG.map(([k, v]) => (
                    <tr key={k} className="align-top">
                      <td className="px-3 py-2 text-gray-500 text-xs w-40 whitespace-nowrap">{k}</td>
                      <td className="px-3 py-2 text-gray-800 text-xs font-mono break-all">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sample response */}
            <h3 className="font-semibold text-gray-900 mt-3">10.2 ตัวอย่าง Response จริง (ตัดย่อ)</h3>
            <CodeBlock>{CASE_SAMPLE}</CodeBlock>

            {/* Transforms */}
            <h3 className="font-semibold text-gray-900 mt-3">10.3 การแปลงค่าที่ใช้จริง</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">ฟิลด์เรา</th>
                    <th className="text-left px-3 py-2 font-medium">ฟิลด์ต้นทาง</th>
                    <th className="text-left px-3 py-2 font-medium">ชนิด</th>
                    <th className="text-left px-3 py-2 font-medium">กติกา</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {CASE_TRANSFORMS.map((t) => (
                    <tr key={t.our} className="align-top">
                      <td className="px-3 py-2 text-gray-800 text-xs font-mono whitespace-nowrap">{t.our}</td>
                      <td className="px-3 py-2 text-gray-600 text-xs font-mono">{t.their}</td>
                      <td className="px-3 py-2 text-xs">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px] font-medium">
                          {t.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-500 text-xs font-mono">{t.cfg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mt-3 text-xs text-amber-800">
              <strong>จุดที่ทำให้ราคาถูกต้อง:</strong> ระบบต้นทางส่ง <code>Price</code> (ราคาเต็ม) และ{' '}
              <code>Price_End</code> (ราคาขาย) ระบบตั้ง <code>price_adult ← Price</code> และคิดส่วนลดด้วยสูตร{' '}
              <code>{'{Price} - {Price_End}'}</code> จึงได้ราคาเต็ม/ส่วนลด/ราคาขาย ครบถ้วน
            </div>
          </SectionCard>

          {/* 11. Compatibility Tester (spec / mockup) */}
          <SectionCard id="tester" icon={<Gauge className="w-5 h-5" />} title="11. เครื่องมือทดสอบความเข้ากันได้ (%) — เร็ว ๆ นี้">
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-3 text-xs text-gray-500">
              ส่วนนี้คือ <strong>ตัวอย่างหน้าจอ (mockup)</strong> ของเครื่องมือที่กำลังจะเปิดใช้ — ยังไม่เชื่อมระบบจริง
            </div>

            {/* Mockup form */}
            <div className="rounded-lg border border-gray-200 p-4 space-y-3 opacity-90">
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="text-xs text-gray-600 space-y-1">
                  <span>Endpoint รายการทัวร์</span>
                  <input
                    disabled
                    placeholder="https://api.you.com/v1/tours"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50"
                  />
                </label>
                <label className="text-xs text-gray-600 space-y-1">
                  <span>Auth</span>
                  <input
                    disabled
                    placeholder="Bearer <token>"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50"
                  />
                </label>
              </div>
              <button
                onClick={() => setActiveTester((v) => !v)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700"
              >
                <Gauge className="w-4 h-4" />
                {activeTester ? 'ซ่อนผลตัวอย่าง' : 'ทดสอบความเข้ากันได้ (ตัวอย่าง)'}
              </button>

              {activeTester && (
                <div className="mt-2 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-green-600">82%</div>
                    <div className="flex-1">
                      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: '82%' }} />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">เชื่อมต่อสำเร็จ • อ่านข้อมูลได้ • พบฟิลด์บังคับเกือบครบ</div>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-xs">
                    {[
                      ['เชื่อมต่อ + ยืนยันตัวตน', true],
                      ['อ่าน JSON เป็นรายการทัวร์ได้', true],
                      ['ตรวจพบการแบ่งหน้า', true],
                      ['ฟิลด์ทัวร์บังคับครบ', true],
                      ['ฟิลด์รอบเดินทางบังคับครบ', true],
                      ['ฟิลด์ราคาบังคับครบ (currency ไม่พบ)', false],
                    ].map(([label, ok]) => (
                      <div key={label as string} className="flex items-center gap-2">
                        {ok ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        )}
                        <span className={ok ? 'text-gray-700' : 'text-amber-700'}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Scoring spec */}
            <h3 className="font-semibold text-gray-900 mt-3">วิธีคิดคะแนน (สเปกที่จะใช้)</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">เกณฑ์</th>
                    <th className="text-center px-3 py-2 font-medium">น้ำหนัก</th>
                    <th className="text-left px-3 py-2 font-medium">เงื่อนไขผ่าน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['เชื่อมต่อ + ยืนยันตัวตน (ประตูบังคับ)', 'ผ่าน/ไม่ผ่าน', 'HTTP 2xx และ parse JSON ได้'],
                    ['อ่านเป็นรายการทัวร์ได้', '15%', 'พบ array ทัวร์ในทรงใดทรงหนึ่ง'],
                    ['ตรวจพบการแบ่งหน้า', '10%', 'พบ last_page/total หรือ cursor'],
                    [`ฟิลด์ทัวร์บังคับ (${REQUIRED_TOUR} ฟิลด์)`, '30%', 'จับคู่ได้ครบ'],
                    [`ฟิลด์รอบเดินทางบังคับ (${REQUIRED_PERIOD} ฟิลด์)`, '25%', 'จับคู่ได้ครบ'],
                    [`ฟิลด์ราคาบังคับ (${REQUIRED_OFFER} ฟิลด์)`, '15%', 'จับคู่ได้ครบ'],
                    ['ฟิลด์เสริม (media/content/itinerary)', '5%', 'ยิ่งครบยิ่งได้คะแนน'],
                  ].map((r) => (
                    <tr key={r[0] as string} className="align-top">
                      <td className="px-3 py-2 text-gray-700 text-xs">{r[0]}</td>
                      <td className="px-3 py-2 text-center text-xs font-mono">{r[1]}</td>
                      <td className="px-3 py-2 text-gray-500 text-xs">{r[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="list-disc ml-5 space-y-1 text-xs text-gray-600">
              <li>ถ้า &ldquo;ประตูบังคับ&rdquo; (เชื่อมต่อ/ยืนยันตัวตน) ไม่ผ่าน → คะแนนรวม = 0% พร้อมบอกสาเหตุ</li>
              <li>ผลลัพธ์แสดง % รวม + % รายหมวด + รายการฟิลด์ที่ &ldquo;จับคู่ได้/ยังขาด&rdquo; + คำแนะนำ mapping อัตโนมัติ</li>
              <li>การจับคู่อัตโนมัติใช้การเดาชื่อฟิลด์ (fuzzy) — คุณปรับแก้ได้ในหน้า mapping ภายหลัง</li>
            </ul>
          </SectionCard>

          {/* 12. Checklist */}
          <SectionCard id="checklist" icon={<CheckCircle2 className="w-5 h-5" />} title="12. เช็กลิสต์ก่อนส่ง Endpoint ให้เรา">
            <ul className="space-y-2">
              {[
                'URL endpoint รายการทัวร์ (และรอบเดินทาง ถ้าเป็น two_phase)',
                'วิธียืนยันตัวตน (ประเภท + ค่า เช่น token / ชื่อ header + key)',
                'รูปแบบการแบ่งหน้า + ชื่อพารามิเตอร์ (page/per_page ฯลฯ) และจำนวนรวม',
                'ตัวอย่าง JSON response จริง 1–2 ทัวร์ (พร้อมรอบเดินทาง + ราคา)',
                'ระบุว่าราคาเป็น "ราคาเต็ม + ส่วนลด" หรือ "ราคาเต็ม + ราคาขาย"',
                'รหัสประเทศ/สายการบิน ส่งมาเป็นอะไร (iso2/iso3/ชื่อ/code)',
                'Rate limit ถ้ามี (จำกัดกี่ครั้งต่อนาที)',
              ].map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{x}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          {/* ══════════════════ PART 2 — OUTBOUND BOOKING ══════════════════ */}
          <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-1">
              <Send className="w-5 h-5" />
              <h2 className="text-lg sm:text-xl font-bold">ส่วนที่ 2 — การจองขาออก (Outbound Booking)</h2>
            </div>
            <p className="text-blue-50 text-sm">
              เมื่อมีลูกค้าจองทัวร์ ระบบจะส่งคำขอจองออกไปยัง Wholesaler โดยอัตโนมัติผ่าน Booking Provider ที่เลือก —
              คนละส่วนกับการดึงข้อมูล (Sync) ด้านบน ตั้งค่าแยกกันต่อ integration
            </p>
          </div>

          {/* A. Overview */}
          <SectionCard id="ob-overview" icon={<Send className="w-5 h-5" />} title="A. Outbound Booking คืออะไร">
            <p>
              &ldquo;การจองขาออก&rdquo; คือการที่ระบบเรา <strong>ส่งคำขอจองไปยัง Wholesaler</strong> (ทิศทางตรงข้ามกับ Sync
              ที่เป็นการดึงข้อมูลเข้า) เมื่อมีลูกค้าจองทัวร์บนเว็บ หรือแอดมินสร้างการจองในระบบหลังบ้าน —
              ถ้าทัวร์นั้นมาจาก Wholesaler ที่ <strong>เปิดใช้งาน Booking</strong> ไว้ ระบบจะยิงจองต่อให้อัตโนมัติ
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { i: <ArrowRightLeft className="w-4 h-4" />, t: 'ทิศทาง', d: 'ระบบเรา → Wholesaler (ตรงข้าม Sync)' },
                { i: <Boxes className="w-4 h-4" />, t: 'ทริกเกอร์', d: 'ลูกค้าจอง / แอดมินสร้างการจอง บนรอบของทัวร์ที่เปิด booking' },
                { i: <ShieldCheck className="w-4 h-4" />, t: 'ไม่บล็อก', d: 'ถ้ายิงจองไม่สำเร็จ การจองยังอยู่ (provider_status=failed) ให้ทำมือต่อได้' },
              ].map((x) => (
                <div key={x.t} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 font-semibold text-gray-900 text-sm">
                    {x.i} {x.t}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{x.d}</div>
                </div>
              ))}
            </div>
            <p className="font-semibold text-gray-900">สถานะการจองฝั่ง provider (<code>provider_status</code>)</p>
            <CodeBlock>{`pending   → เริ่มส่งจองไป provider
quoted    → ได้ใบเสนอราคา/กันที่ (quote) แล้ว
confirmed → Wholesaler ยืนยันการจองแล้ว (สำเร็จ)
cancelled → ยกเลิกแล้ว
failed    → ยิงจองไม่สำเร็จ (แอดมินทำมือต่อ หรือกด retry)`}</CodeBlock>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800">
              ทุกขั้นตอนถูกบันทึกเป็น <code>BookingEvent</code> (ไทม์ไลน์ต่อการจอง) ดูได้ที่หน้ารายละเอียดการจอง —
              ช่วยไล่ปัญหาเวลา provider ตอบ error
            </div>
          </SectionCard>

          {/* B. Providers */}
          <SectionCard id="ob-providers" icon={<Server className="w-5 h-5" />} title="B. Provider ที่รองรับ + ความสามารถ">
            <p>
              ระบบเลือก provider ได้ต่อ integration แต่ละ provider คือ &ldquo;อะแดปเตอร์&rdquo; ที่รู้วิธีคุยกับ API
              ของ Wholesaler นั้น ๆ ปัจจุบันมี {BOOKING_PROVIDERS.length} ตัว:
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {BOOKING_PROVIDERS.map((p) => (
                <div key={p.code} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    {p.code === 'manual' ? <Mail className="w-4 h-4 text-blue-600" /> : <Send className="w-4 h-4 text-blue-600" />}
                    <span className="font-semibold text-gray-900 text-sm">{p.name}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <code className="text-purple-700">{p.code}</code>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">{p.api}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{p.note}</div>
                </div>
              ))}
            </div>

            <h3 className="font-semibold text-gray-900 mt-2">ตารางความสามารถ (Capabilities)</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">ความสามารถ</th>
                    <th className="text-left px-3 py-2 font-medium"><code className="text-xs">key</code></th>
                    <th className="text-center px-3 py-2 font-medium">Zego</th>
                    <th className="text-center px-3 py-2 font-medium">Manual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {BOOKING_FEATURES.map((f) => (
                    <tr key={f.key} className="align-top hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-700 text-xs">{f.label}</td>
                      <td className="px-3 py-2"><code className="text-purple-700 text-xs">{f.key}</code></td>
                      <td className="px-3 py-2 text-center">
                        {f.zego ? <CheckCircle2 className="w-4 h-4 text-green-500 inline" /> : <span className="text-gray-300">–</span>}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {f.manual ? <CheckCircle2 className="w-4 h-4 text-green-500 inline" /> : <span className="text-gray-300">–</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800">
              <strong>real_hold = ไม่รองรับทั้งคู่:</strong> ทั้ง Zego และ Manual เป็น &ldquo;pseudo-hold&rdquo; —
              ตัวนับถอยหลัง (TTL) อยู่ฝั่งเราเพื่อ UX เท่านั้น ไม่ได้ล็อกที่นั่งจริงฝั่ง Wholesaler จนกว่าจะยืนยัน (confirm)
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
              <strong>เพิ่ม provider ใหม่ได้:</strong> สร้างคลาสที่ extend <code>BaseBookingAdapter</code> (implement{' '}
              <code>BookingAdapterInterface</code>) แล้วลงทะเบียนด้วย <code>AdapterFactory::registerBookingAdapter(code, Class)</code>{' '}
              — provider จะโผล่ใน dropdown อัตโนมัติพร้อมฟอร์มตั้งค่าที่ประกาศใน <code>getConfigSchema()</code>
            </div>
          </SectionCard>

          {/* C. Config */}
          <SectionCard id="ob-config" icon={<KeyRound className="w-5 h-5" />} title="C. การตั้งค่าต่อ Integration">
            <p>
              ตั้งค่าที่หน้า <strong>Integrations → เลือกเจ้า → แท็บ Settings → การ์ด &ldquo;Booking Provider&rdquo;</strong>:
              เปิดสวิตช์ &rarr; เลือก provider &rarr; กรอกฟิลด์ที่ขึ้นตาม provider &rarr; กด <strong>บันทึก</strong> &rarr; กด{' '}
              <strong>ทดสอบ</strong> เพื่อเช็กสุขภาพ
            </p>

            <h3 className="font-semibold text-gray-900 mt-1">C.1 ค่าหลัก (ทุก provider)</h3>
            <FieldTable fields={BOOKING_CORE_FIELDS} />

            <h3 className="font-semibold text-gray-900 mt-3 flex items-center gap-1.5">
              <Send className="w-4 h-4 text-blue-600" /> C.2 ฟิลด์ของ Zego (<code className="text-xs">zego</code>)
            </h3>
            <FieldTable fields={ZEGO_CONFIG_FIELDS} />

            <h3 className="font-semibold text-gray-900 mt-3 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-blue-600" /> C.3 ฟิลด์ของ Manual (<code className="text-xs">manual</code>)
            </h3>
            <FieldTable fields={MANUAL_CONFIG_FIELDS} />

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 flex items-start gap-2">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>อายุใบเสนอราคา (Hold TTL):</strong> ค่าเริ่มต้น 900 วินาที (15 นาที) —
                คือเวลาที่เก็บ quote ไว้ก่อนหมดอายุ ถ้าลูกค้ายืนยันไม่ทันต้องขอ quote ใหม่ ปรับได้ 60–7200 วินาที
              </span>
            </div>
          </SectionCard>

          {/* D. Lifecycle */}
          <SectionCard id="ob-lifecycle" icon={<RefreshCw className="w-5 h-5" />} title="D. วงจรการจอง (Quote → Confirm)">
            <p>ทุก provider ทำงานตามวงจรเดียวกัน 4 สเต็ป (ระบบจัดการให้อัตโนมัติผ่าน <code>BookingService</code>):</p>
            <CodeBlock>{`1) quote    ── สร้างใบเสนอราคา/กันที่จาก product_code + travel_date + จำนวน pax
2) hold     ── ผูกรายชื่อผู้โดยสารเข้ากับ quote (ระบบ synth ให้ถ้าไม่ส่งมา)
3) confirm  ── ส่งจองจริงไป Wholesaler ด้วย quote → ได้ booking_ref
4) cancel   ── ยกเลิก (เฉพาะ provider ที่รองรับ)`}</CodeBlock>

            <h3 className="font-semibold text-gray-900 mt-1">Endpoint วงจรการจอง</h3>
            <EndpointTable rows={BOOKING_LIFECYCLE_ENDPOINTS} />

            <h3 className="font-semibold text-gray-900 mt-3">D.1 ขอ Quote</h3>
            <CodeBlock>{SAMPLE_QUOTE_REQ}</CodeBlock>
            <CodeBlock>{SAMPLE_QUOTE_RES}</CodeBlock>

            <h3 className="font-semibold text-gray-900 mt-3">D.2 ยืนยันการจอง (Confirm)</h3>
            <CodeBlock>{SAMPLE_BOOK_REQ}</CodeBlock>
            <CodeBlock>{SAMPLE_BOOK_RES}</CodeBlock>

            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800">
              <strong>รหัสผู้โดยสาร/ห้อง (code):</strong> <code>passengers[].code</code> และ <code>rooms[].code</code>{' '}
              ต้องใช้ค่าที่ provider คืนมาใน <code>passenger_types</code> / <code>room_types</code> ตอนขอ quote
              (เช่น Zego ใช้ MA=ผู้ใหญ่, CH=เด็ก, IF=ทารก) — อย่าเดาเอง
            </div>
          </SectionCard>

          {/* E. Provider APIs */}
          <SectionCard id="ob-provider-apis" icon={<Braces className="w-5 h-5" />} title="E. รายละเอียด API แต่ละเจ้า">
            <h3 className="font-semibold text-gray-900 flex items-center gap-1.5">
              <Send className="w-4 h-4 text-blue-600" /> E.1 Zego — Custom Booking API v1.5 (3 ขั้นตอน)
            </h3>
            <p className="text-xs text-gray-500">
              Base URL: <code>https://www.zegoapi.com/v1.5/booking</code> — ต่อท้าย path ด้านล่าง
            </p>
            <EndpointTable rows={ZEGO_STEPS} />
            <ul className="list-disc ml-5 space-y-1 text-xs text-gray-600">
              <li><strong>uuid ใช้ครั้งเดียว:</strong> Step 2 ออก uuid ใหม่ทุกครั้ง ระบบ cache ไว้กับ quote แล้วส่งใน header <code>x-uuid</code> ตอน submit</li>
              <li><strong>เบอร์โทรบังคับ 10 หลักพอดี</strong> (ไม่งั้น error <code>INVALID_CUSTOMER_PHONE</code>)</li>
              <li><strong>จำกัด 10 คน/การจอง</strong> (ปรับที่ฟิลด์ <code>max_pax</code>)</li>
              <li>รอบที่สถานะ <code>Soldout</code> / <code>Close Group</code> จะจองไม่ได้ (error <code>PERIOD_NOT_AVAILABLE</code>)</li>
              <li>ไม่รองรับ cancel/modify ฝั่ง Zego — ต้องติดต่อ Wholesaler โดยตรง</li>
              <li>เอกสารเต็ม: <code>tour-api/docs/Zego-Booking-API.md</code></li>
            </ul>

            <h3 className="font-semibold text-gray-900 mt-3 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-blue-600" /> E.2 Manual — แจ้งเตือนทางอีเมล
            </h3>
            <ul className="list-disc ml-5 space-y-1 text-xs text-gray-600">
              <li>สำหรับ Wholesaler ที่ <strong>ยังไม่มี Booking API</strong> — ไม่มีการยิง API จริง</li>
              <li>ตอน quote: สร้างใบเสนอราคาในระบบ (ราคา 0, ไม่กันที่นั่ง)</li>
              <li>ตอน confirm: ออกเลข <code>MAN-XXXXXXXXXX</code> แล้ว <strong>ส่งอีเมล</strong>แจ้งจองไปที่ <code>contact_email</code></li>
              <li>สถานะค้างที่ <code>pending</code> จนกว่าแอดมินจะยืนยันเองในระบบหลังบ้าน</li>
              <li>ส่งอีเมลแบบ best-effort — ถ้าอีเมลล้มเหลว การจองยัง&ldquo;สำเร็จ&rdquo; (บันทึก log ไว้)</li>
            </ul>
          </SectionCard>

          {/* F. For wholesalers with a booking API */}
          <SectionCard id="ob-partner" icon={<ShieldCheck className="w-5 h-5" />} title="F. สำหรับ Wholesaler ที่มี Booking API">
            <p>
              ถ้าคุณมี Booking API เป็นของตัวเอง เราสร้าง provider adapter ให้ได้ (แบบเดียวกับ Zego)
              โปรดเตรียมข้อมูลต่อไปนี้ให้เรา:
            </p>
            <ul className="space-y-2">
              {[
                'Base URL + วิธียืนยันตัวตนของ Booking API (public key / token / header)',
                'Endpoint เช็คที่ว่าง + ราคา จาก product_code + วันเดินทาง',
                'Endpoint กันที่/สร้างจอง (ถ้ามี) และ Endpoint ยืนยันจอง (submit/confirm)',
                'Endpoint ยกเลิก/แก้ไข (ถ้ามี) — ถ้าไม่มี เราถือว่าไม่รองรับ',
                'รหัสประเภทผู้โดยสาร (adult/child/infant) และรหัสประเภทห้อง ที่ API ต้องการ',
                'ข้อจำกัดจำนวนผู้โดยสารต่อการจอง + รูปแบบเบอร์โทร/ชื่อที่บังคับ',
                'ตัวอย่าง response ทั้งกรณีสำเร็จและ error (พร้อม error code)',
                'ระบุว่า API กันที่นั่งจริง (real hold) หรือเป็น pseudo-hold',
              ].map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{x}</span>
                </li>
              ))}
            </ul>

            <h3 className="font-semibold text-gray-900 mt-2">Endpoint ฝั่งแอดมิน (ตั้งค่า/ทดสอบ provider)</h3>
            <EndpointTable rows={BOOKING_ADMIN_ENDPOINTS} />
            <p className="text-xs text-gray-500">
              ทุก endpoint อยู่ใต้ <code>/api</code> — หน้าจอตั้งค่าเรียกให้อัตโนมัติ ไม่ต้องยิงเอง
              รายการนี้ไว้อ้างอิงตอนเชื่อมต่อ/ดีบั๊ก
            </p>
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-xs text-emerald-800">
              <strong>สรุป:</strong> ฝั่งตั้งค่าเป็น config-driven (เลือก provider + กรอกฟิลด์) ส่วนตรรกะการคุยกับ API
              แต่ละเจ้าอยู่ใน adapter — เพิ่ม Wholesaler ใหม่ที่ใช้ API เดิม (เช่น Zego) ทำได้ทันทีโดยไม่ต้องเขียนโค้ด
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
