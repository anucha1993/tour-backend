'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button, Card } from '@/components/ui';
import { integrationsApi, API_BASE_URL } from '@/lib/api';
import { 
  ArrowLeft,Save,Zap,Loader2,X,
  Check,
  Search,
  ArrowRight,
  Eye,
  Code,
  ChevronDown,
  ChevronUp,
  Settings2,
} from 'lucide-react';
import Link from 'next/link';

// Data type colors
const TYPE_COLORS: Record<string, string> = {
  'string': 'bg-blue-100 text-blue-700',
  'int': 'bg-green-100 text-green-700',
  'float': 'bg-emerald-100 text-emerald-700',
  'date': 'bg-purple-100 text-purple-700',
  'boolean': 'bg-orange-100 text-orange-700',
  'array': 'bg-pink-100 text-pink-700',
  'array<string>': 'bg-pink-100 text-pink-700',
  'array<int>': 'bg-pink-100 text-pink-700',
  'object': 'bg-yellow-100 text-yellow-700',
};

// Lookup configurations - สำหรับ fields ที่ต้อง lookup จาก table อื่น
interface LookupConfig {
  table: string;         // ชื่อ table ที่จะ lookup
  matchFields: string[]; // fields ที่ API อาจส่งมา เรียงตามความน่าจะเป็น
  returnField: string;   // field ที่จะ return (ปกติคือ id)
}

const LOOKUP_CONFIGS: Record<string, LookupConfig> = {
  'country': {
    table: 'countries',
    matchFields: ['iso2', 'iso3', 'name_en', 'name_th', 'id'],
    returnField: 'id',
  },
  'transport': {
    table: 'transports', 
    matchFields: ['code', 'name', 'id'],
    returnField: 'id',
  },
  'airport': {
    table: 'airports',
    matchFields: ['iata', 'icao', 'name', 'id'],
    returnField: 'id',
  },
};

// Option สำหรับ enum/select fields
interface FieldOption {
  value: string;
  label: string;
}

// Field definition with optional lookup
interface FieldDefinition {
  section: string;
  key: string;
  label: string;
  type: string;
  required: boolean;
  description: string;
  lookup?: string;        // key ใน LOOKUP_CONFIGS
  lookupHint?: string;    // คำอธิบายว่า API น่าจะส่งมาเป็นอะไร
  options?: FieldOption[]; // ตัวเลือกสำหรับ enum/status fields
  targetTable?: string;   // target table for sync (periods, offers, etc.)
}

// All fields with data types - ครบตาม database schema
const ALL_FIELDS: FieldDefinition[] = [
  // === TOUR (ข้อมูลทัวร์หลัก) ===
  { section: 'tour', key: 'external_id', label: 'รหัสจาก API', type: 'string', required: true, description: 'ID ของทัวร์จากระบบ Wholesaler (สำหรับ sync)' },
  { section: 'tour', key: 'tour_code', label: 'รหัสทัวร์', type: 'string', required: true, description: 'รหัสทัวร์ในระบบเรา' },
  { section: 'tour', key: 'wholesaler_tour_code', label: 'รหัสทัวร์ Wholesaler', type: 'string', required: false, description: 'รหัสทัวร์ฝั่ง Wholesaler' },
  { section: 'tour', key: 'title', label: 'ชื่อทัวร์', type: 'string', required: true, description: 'ชื่อโปรแกรมทัวร์' },
  { section: 'tour', key: 'tour_type', label: 'ประเภททัวร์', type: 'string', required: false, description: 'ประเภทของทัวร์', options: [
    { value: 'join', label: 'Join Tour (จอยทัวร์)' },
    { value: 'incentive', label: 'Incentive (กรุ๊ปเหมา)' },
    { value: 'private', label: 'Private (ส่วนตัว)' },
  ]},
  { section: 'tour', key: 'duration_days', label: 'จำนวนวัน', type: 'int', required: true, description: 'ระยะเวลาทริป (วัน)' },
  { section: 'tour', key: 'duration_nights', label: 'จำนวนคืน', type: 'int', required: false, description: 'ระยะเวลาทริป (คืน)' },
  { 
    section: 'tour', key: 'primary_country_id', label: 'ประเทศหลัก', type: 'int', required: true, 
    description: 'ID ประเทศหลัก',
    lookup: 'country',
    lookupHint: 'API อาจส่งเป็น: TH (iso2), THA (iso3), Thailand (name)'
  },
  { section: 'tour', key: 'region', label: 'ภูมิภาค', type: 'string', required: false, description: 'ภูมิภาคของทัวร์', options: [
    { value: 'asia', label: 'Asia (เอเชีย)' },
    { value: 'europe', label: 'Europe (ยุโรป)' },
    { value: 'america', label: 'America (อเมริกา)' },
    { value: 'oceania', label: 'Oceania (โอเชียเนีย)' },
    { value: 'africa', label: 'Africa (แอฟริกา)' },
    { value: 'middle_east', label: 'Middle East (ตะวันออกกลาง)' },
  ]},
  { 
    section: 'tour', key: 'transport_id', label: 'ขนส่ง', type: 'int', required: false, 
    description: 'ID ผู้ให้บริการขนส่ง',
    lookup: 'transport',
    lookupHint: 'API อาจส่งเป็น: TG (code), Thai Airways (name)'
  },
  { section: 'tour', key: 'hotel_star', label: 'ระดับโรงแรม', type: 'int', required: false, description: 'ดาวโรงแรม', options: [
    { value: '3', label: '3 ดาว' },
    { value: '4', label: '4 ดาว' },
    { value: '5', label: '5 ดาว' },
    { value: '0', label: 'ไม่ระบุ' },
  ]},
  { section: 'tour', key: 'themes', label: 'ธีม', type: 'array<string>', required: false, description: 'ธีมทัวร์ เช่น ["ธรรมชาติ", "วัฒนธรรม"]' },
  { section: 'tour', key: 'suitable_for', label: 'เหมาะสำหรับ', type: 'array<string>', required: false, description: 'กลุ่มเป้าหมาย เช่น ["ครอบครัว", "คู่รัก"]' },
  
  // === DEPARTURE (รอบเดินทาง + ราคา) ===
  // API ส่ง departures[] มา → แต่ละ item มี period info + pricing รวมกัน
  // ตอน sync: loop departures[] → insert period (periods table) → ได้ period_id → insert offer (offers table)
  
  // --- Period Info (จะ insert ไป periods table) ---
  { section: 'departure', key: 'external_id', label: 'Period External ID', type: 'string', required: true, description: 'ID รอบเดินทางจาก Wholesaler API (สำหรับ sync)', targetTable: 'periods' },
  { section: 'departure', key: 'start_date', label: 'วันเดินทางไป', type: 'date', required: true, description: 'วันที่ออกเดินทาง (Database: start_date)', targetTable: 'periods' },
  { section: 'departure', key: 'end_date', label: 'วันเดินทางกลับ', type: 'date', required: false, description: 'วันที่กลับ (Database: end_date)', targetTable: 'periods' },
  { section: 'departure', key: 'capacity', label: 'จำนวนที่นั่งทั้งหมด', type: 'int', required: false, description: 'ที่นั่งทั้งหมด', targetTable: 'periods' },
  { section: 'departure', key: 'available', label: 'ที่นั่งว่าง', type: 'int', required: false, description: 'ที่นั่งที่เหลือ', targetTable: 'periods' },
  { section: 'departure', key: 'status', label: 'สถานะรอบ', type: 'string', required: true, description: 'สถานะรอบเดินทาง', targetTable: 'periods', options: [
    { value: 'draft', label: 'Draft (ร่าง)' },
    { value: 'open', label: 'Open (เปิดจอง)' },
    { value: 'closed', label: 'Closed (ปิดจอง)' },
    { value: 'full', label: 'Full (เต็ม)' },
    { value: 'cancelled', label: 'Cancelled (ยกเลิก)' },
  ]},
  { section: 'departure', key: 'guarantee_status', label: 'สถานะยืนยัน', type: 'string', required: false, description: 'สถานะยืนยันการเดินทาง', targetTable: 'periods', options: [
    { value: 'pending', label: 'Pending (รอยืนยัน)' },
    { value: 'guaranteed', label: 'Guaranteed (ยืนยันแล้ว)' },
    { value: 'cancelled', label: 'Cancelled (ยกเลิก)' },
  ]},
  
  // --- Offer/Pricing Info (จะ insert ไป offers table โดยใช้ period_id) ---
  { section: 'departure', key: 'currency', label: 'สกุลเงิน', type: 'string', required: true, description: 'สกุลเงิน', targetTable: 'offers', options: [
    { value: 'THB', label: 'THB (บาท)' },
    { value: 'USD', label: 'USD (ดอลลาร์)' },
    { value: 'EUR', label: 'EUR (ยูโร)' },
    { value: 'JPY', label: 'JPY (เยน)' },
    { value: 'CNY', label: 'CNY (หยวน)' },
    { value: 'KRW', label: 'KRW (วอน)' },
    { value: 'SGD', label: 'SGD (สิงคโปร์)' },
    { value: 'MYR', label: 'MYR (ริงกิต)' },
  ]},
  
  // ราคาผู้ใหญ่
  { section: 'departure', key: 'price_adult', label: 'ราคาผู้ใหญ่', type: 'float', required: true, description: 'ราคาผู้ใหญ่พัก 2-3', targetTable: 'offers' },
  { section: 'departure', key: 'discount_adult', label: 'ส่วนลดผู้ใหญ่', type: 'float', required: false, description: 'ส่วนลดผู้ใหญ่พัก 2-3', targetTable: 'offers' },
  
  // ราคาเด็ก (มีเตียง)
  { section: 'departure', key: 'price_child', label: 'ราคาเด็ก', type: 'float', required: false, description: 'ราคาเด็ก', targetTable: 'offers' },
  { section: 'departure', key: 'discount_child_bed', label: 'ส่วนลดเด็กมีเตียง', type: 'float', required: false, description: 'ส่วนลดเด็กมีเตียง', targetTable: 'offers' },
  
  // ราคาเด็ก (ไม่มีเตียง)
  { section: 'departure', key: 'price_child_nobed', label: 'ราคาเด็ก (ไม่เสริมเตียง)', type: 'float', required: false, description: 'เด็กไม่เสริมเตียง', targetTable: 'offers' },
  { section: 'departure', key: 'discount_child_nobed', label: 'ส่วนลดเด็กไม่มีเตียง', type: 'float', required: false, description: 'ส่วนลดเด็กไม่มีเตียง', targetTable: 'offers' },
  
  // ราคาทารก
  { section: 'departure', key: 'price_infant', label: 'ราคาทารก', type: 'float', required: false, description: 'ทารก', targetTable: 'offers' },
  
  // ราคา Join Land
  { section: 'departure', key: 'price_joinland', label: 'ราคา Join Land', type: 'float', required: false, description: 'ไม่รวมตั๋วเครื่องบิน', targetTable: 'offers' },
  
  // พักเดี่ยว
  { section: 'departure', key: 'price_single', label: 'พักเดี่ยว', type: 'float', required: false, description: 'พักเดี่ยว', targetTable: 'offers' },
  { section: 'departure', key: 'discount_single', label: 'ส่วนลดพักเดี่ยว', type: 'float', required: false, description: 'ส่วนลดพักเดี่ยว', targetTable: 'offers' },
  
  // มัดจำ
  { section: 'departure', key: 'deposit', label: 'มัดจำ', type: 'float', required: false, description: 'เงินมัดจำ', targetTable: 'offers' },
  
  // Commission
  { section: 'departure', key: 'commission_agent', label: 'คอมมิชชั่น Agent', type: 'float', required: false, description: 'ค่าคอมมิชชั่นสำหรับ Agent', targetTable: 'offers' },
  { section: 'departure', key: 'commission_sale', label: 'คอมมิชชั่น Sale', type: 'float', required: false, description: 'ค่าคอมมิชชั่นสำหรับ Sale', targetTable: 'offers' },
  
  // Policies
  { section: 'departure', key: 'cancellation_policy', label: 'เงื่อนไขยกเลิก', type: 'string', required: true, description: 'เงื่อนไขการยกเลิก (Required)', targetTable: 'offers' },
  { section: 'departure', key: 'refund_policy', label: 'เงื่อนไขคืนเงิน', type: 'string', required: false, description: 'เงื่อนไขการคืนเงิน', targetTable: 'offers' },
  { section: 'departure', key: 'notes', label: 'หมายเหตุราคา', type: 'string', required: false, description: 'หมายเหตุเพิ่มเติม', targetTable: 'offers' },
  { section: 'departure', key: 'ttl_minutes', label: 'อายุราคา (นาที)', type: 'int', required: false, description: 'อายุข้อมูลราคา (default: 10 นาที)', targetTable: 'offers' },
  
  // === PROMOTION (โปรโมชัน - ตาราง offer_promotions) ===
  // Promotion อยู่ภายใน departure item เช่นกัน แต่ต้องใช้ offer_id
  { section: 'promotion', key: 'promo_code', label: 'รหัสโปรโมชัน', type: 'string', required: false, description: 'รหัสโปรโมชัน เช่น EARLYBIRD2026' },
  { section: 'promotion', key: 'name', label: 'ชื่อโปรโมชัน', type: 'string', required: false, description: 'ชื่อโปรโมชัน' },
  { section: 'promotion', key: 'type', label: 'ประเภทส่วนลด', type: 'string', required: false, description: 'ประเภทโปรโมชัน', options: [
    { value: 'discount_amount', label: 'ลดเป็นจำนวนเงิน' },
    { value: 'discount_percent', label: 'ลดเป็นเปอร์เซ็นต์' },
    { value: 'freebie', label: 'ของแถม' },
  ]},
  { section: 'promotion', key: 'value', label: 'มูลค่าส่วนลด', type: 'float', required: false, description: 'มูลค่าส่วนลด (500 หรือ 10)' },
  { section: 'promotion', key: 'apply_to', label: 'ใช้กับ', type: 'string', required: false, description: 'ใช้ส่วนลดกับ', options: [
    { value: 'per_pax', label: 'ต่อคน' },
    { value: 'per_booking', label: 'ต่อการจอง' },
  ]},
  { section: 'promotion', key: 'start_at', label: 'โปรโมชันเริ่ม', type: 'date', required: false, description: 'วันที่เริ่มโปรโมชัน' },
  { section: 'promotion', key: 'end_at', label: 'โปรโมชันหมดอายุ', type: 'date', required: false, description: 'วันที่หมดโปรโมชัน' },
  { section: 'promotion', key: 'conditions', label: 'เงื่อนไขโปรโมชัน', type: 'object', required: false, description: 'เงื่อนไข เช่น min_pax, booking_before_days' },
  { section: 'promotion', key: 'is_active', label: 'เปิดใช้งาน', type: 'boolean', required: false, description: 'เปิดใช้โปรโมชัน', options: [
    { value: 'true', label: 'เปิด' },
    { value: 'false', label: 'ปิด' },
  ]},
  
  // === CONTENT (เนื้อหา) ===
  { section: 'content', key: 'description', label: 'รายละเอียด', type: 'string', required: false, description: 'คำอธิบายทัวร์' },
  { section: 'content', key: 'highlights', label: 'ไฮไลท์', type: 'array<string>', required: false, description: 'จุดเด่นของทริป' },
  { section: 'content', key: 'shopping_highlights', label: 'ไฮไลท์ช้อปปิ้ง', type: 'array<string>', required: false, description: 'จุดเด่นช้อปปิ้ง' },
  { section: 'content', key: 'food_highlights', label: 'ไฮไลท์อาหาร', type: 'array<string>', required: false, description: 'จุดเด่นอาหาร' },
  { section: 'content', key: 'inclusions', label: 'รวมในแพ็คเกจ', type: 'array<string>', required: false, description: 'สิ่งที่รวมในราคา' },
  { section: 'content', key: 'exclusions', label: 'ไม่รวมในแพ็คเกจ', type: 'array<string>', required: false, description: 'สิ่งที่ไม่รวมในราคา' },
  { section: 'content', key: 'conditions', label: 'เงื่อนไข', type: 'string', required: false, description: 'เงื่อนไขการจอง' },
  
  // === MEDIA (รูปภาพ/ไฟล์) ===
  { section: 'media', key: 'cover_image_url', label: 'รูปปก', type: 'string', required: false, description: 'URL รูปปกทัวร์' },
  { section: 'media', key: 'gallery', label: 'แกลเลอรี่', type: 'array<string>', required: false, description: 'URLs รูปภาพเพิ่มเติม' },
  { section: 'media', key: 'pdf_url', label: 'โบรชัวร์ PDF', type: 'string', required: false, description: 'URL ไฟล์ PDF' },
  { section: 'media', key: 'og_image_url', label: 'OG Image', type: 'string', required: false, description: 'รูปสำหรับ Social sharing' },
  
  // === ITINERARY (โปรแกรมทัวร์รายวัน) ===
  // API ส่ง Itinerary[] มา → แต่ละ item คือ 1 วัน
  // ตอน sync: loop Itinerary[] → insert/update tour_itineraries (ใช้ external_id + data_source เป็น key)
  { section: 'itinerary', key: 'external_id', label: 'Itinerary API ID', type: 'string', required: false, description: 'ID จาก API สำหรับ update', targetTable: 'tour_itineraries' },
  { section: 'itinerary', key: 'day_number', label: 'วันที่', type: 'int', required: true, description: 'ลำดับวัน เช่น 1, 2, 3', targetTable: 'tour_itineraries' },
  { section: 'itinerary', key: 'title', label: 'หัวข้อวัน', type: 'string', required: false, description: 'เช่น "สนามบินสุวรรณภูมิ กรุงเทพ"', targetTable: 'tour_itineraries' },
  { section: 'itinerary', key: 'description', label: 'รายละเอียด', type: 'string', required: false, description: 'รายละเอียดกิจกรรมของวัน', targetTable: 'tour_itineraries' },
  { section: 'itinerary', key: 'places', label: 'สถานที่', type: 'array<string>', required: false, description: 'รายชื่อสถานที่ในวันนั้น', targetTable: 'tour_itineraries' },
  { section: 'itinerary', key: 'has_breakfast', label: 'มีอาหารเช้า', type: 'boolean', required: false, description: 'รวมอาหารเช้า', targetTable: 'tour_itineraries' },
  { section: 'itinerary', key: 'has_lunch', label: 'มีอาหารกลางวัน', type: 'boolean', required: false, description: 'รวมอาหารกลางวัน', targetTable: 'tour_itineraries' },
  { section: 'itinerary', key: 'has_dinner', label: 'มีอาหารเย็น', type: 'boolean', required: false, description: 'รวมอาหารเย็น', targetTable: 'tour_itineraries' },
  { section: 'itinerary', key: 'meals_note', label: 'หมายเหตุอาหาร', type: 'string', required: false, description: 'รายละเอียดอาหาร', targetTable: 'tour_itineraries' },
  { section: 'itinerary', key: 'accommodation', label: 'ที่พัก', type: 'string', required: false, description: 'ชื่อโรงแรม', targetTable: 'tour_itineraries' },
  { section: 'itinerary', key: 'hotel_star', label: 'ระดับดาว', type: 'int', required: false, description: 'ระดับดาวโรงแรม', targetTable: 'tour_itineraries' },
  { section: 'itinerary', key: 'images', label: 'รูปภาพ', type: 'array<string>', required: false, description: 'URLs รูปภาพของวัน', targetTable: 'tour_itineraries' },
  
  // === SEO ===
  { section: 'seo', key: 'slug', label: 'URL Slug', type: 'string', required: false, description: 'URL-friendly path' },
  { section: 'seo', key: 'meta_title', label: 'Meta Title', type: 'string', required: false, description: 'หัวข้อสำหรับ SEO' },
  { section: 'seo', key: 'meta_description', label: 'Meta Description', type: 'string', required: false, description: 'คำอธิบายสำหรับ SEO' },
  { section: 'seo', key: 'keywords', label: 'Keywords', type: 'array<string>', required: false, description: 'คำค้นหา' },
  { section: 'seo', key: 'hashtags', label: 'Hashtags', type: 'array<string>', required: false, description: 'แฮชแท็ก' },
];

const SECTION_COLORS: Record<string, string> = {
  tour: 'bg-blue-500',
  departure: 'bg-purple-500',
  promotion: 'bg-yellow-500',
  content: 'bg-orange-500',
  media: 'bg-pink-500',
  itinerary: 'bg-teal-500',
  seo: 'bg-cyan-500',
};

const SECTION_NAMES: Record<string, string> = {
  tour: 'ข้อมูลทัวร์',
  departure: 'รอบเดินทาง & ราคา',
  promotion: 'โปรโมชัน',
  content: 'เนื้อหา',
  media: 'รูปภาพ/ไฟล์',
  itinerary: 'โปรแกรมรายวัน',
  seo: 'SEO',
};

// Helper function to extract fields from API sample data
function extractApiFields(
  obj: unknown, 
  prefix: string = ''
): Record<string, { type: string; sample: unknown }> {
  const result: Record<string, { type: string; sample: unknown }> = {};
  
  if (obj === null || obj === undefined) {
    return result;
  }
  
  if (Array.isArray(obj)) {
    // For arrays, use [0] notation and explore first element
    if (obj.length > 0) {
      const firstItem = obj[0];
      if (typeof firstItem === 'object' && firstItem !== null) {
        // Array of objects - use [] notation
        const nested = extractApiFields(firstItem, `${prefix}[]`);
        Object.assign(result, nested);
      } else {
        // Array of primitives
        const arrayType = typeof firstItem === 'number' 
          ? (Number.isInteger(firstItem) ? 'array<int>' : 'array<float>')
          : `array<${typeof firstItem}>`;
        result[prefix] = { type: arrayType, sample: obj.slice(0, 3) };
      }
    } else {
      result[prefix] = { type: 'array', sample: [] };
    }
  } else if (typeof obj === 'object') {
    // Object - explore each key
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const newPrefix = prefix ? `${prefix}.${key}` : key;
      
      if (value === null) {
        result[newPrefix] = { type: 'null', sample: null };
      } else if (Array.isArray(value)) {
        // Array field
        if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
          // Array of objects
          result[newPrefix] = { type: 'array<object>', sample: `[${value.length} items]` };
          const nested = extractApiFields(value[0], `${newPrefix}[]`);
          Object.assign(result, nested);
        } else {
          // Array of primitives
          const sampleItem = value[0];
          const arrayType = sampleItem !== undefined
            ? (typeof sampleItem === 'number' 
                ? (Number.isInteger(sampleItem) ? 'array<int>' : 'array<float>')
                : `array<${typeof sampleItem}>`)
            : 'array';
          result[newPrefix] = { type: arrayType, sample: value.slice(0, 3) };
        }
      } else if (typeof value === 'object') {
        // Nested object
        result[newPrefix] = { type: 'object', sample: '{...}' };
        const nested = extractApiFields(value, newPrefix);
        Object.assign(result, nested);
      } else {
        // Primitive value
        let type: string = typeof value;
        if (type === 'number') {
          type = Number.isInteger(value) ? 'int' : 'float';
        }
        // Detect date strings
        if (type === 'string' && typeof value === 'string') {
          if (/^\d{4}-\d{2}-\d{2}(T|\s)?\d{2}:\d{2}:\d{2}/.test(value)) {
            type = 'datetime';
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            type = 'date';
          } else if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
            type = 'time';
          }
        }
        result[newPrefix] = { type, sample: value };
      }
    }
  } else {
    // Primitive at root level
    let type: string = typeof obj;
    if (type === 'number') {
      type = Number.isInteger(obj) ? 'int' : 'float';
    }
    result[prefix || 'value'] = { type, sample: obj };
  }
  
  return result;
}

// Value mapping สำหรับ transform ค่า enum/status
interface ValueMapItem {
  from: string;  // ค่าจาก API
  to: string;    // ค่าของเรา
}

// String transform options
interface StringTransform {
  type: 'split' | 'join' | 'replace' | 'template' | 'none';
  // สำหรับ split: แปลง string เป็น array
  splitBy?: string;  // เช่น ' ' (space), ',' (comma), '\n' (newline)
  // สำหรับ join: แปลง array เป็น string หรือ rejoin หลัง split
  joinWith?: string; // เช่น ',' หรือ ', '
  // สำหรับ replace: แทนที่ข้อความ
  replaceFrom?: string;
  replaceTo?: string;
  // สำหรับ template: รวมหลาย fields
  template?: string; // เช่น '{ProductName} - {Highlight}'
}

// Mapping can be either API field or fixed value
interface MappingValue {
  type: 'api' | 'fixed';
  value: string;
  // สำหรับ lookup fields
  lookupBy?: string;  // field ที่ใช้ match เช่น 'iso2', 'code', 'name'
  // สำหรับ transform enum/status values
  valueMap?: ValueMapItem[];  // [{from: 'book', to: 'open'}, {from: 'sold_out', to: 'full'}]
  // สำหรับ string transform
  stringTransform?: StringTransform;
}

interface MappingData {
  [key: string]: MappingValue;
}

// Get all field keys
const getAllFieldKeys = () => ALL_FIELDS.map(f => `${f.section}.${f.key}`);

export default function IntegrationMappingPage() {
  const params = useParams();
  const [mappings, setMappings] = useState<MappingData>({});
  const [saving, setSaving] = useState(false);
  const [loadingMappings, setLoadingMappings] = useState(true);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [filterSection, setFilterSection] = useState<string>('all');
  const [showPreview, setShowPreview] = useState(true);
  const [apiSampleData, setApiSampleData] = useState<Record<string, unknown> | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loadingApiData, setLoadingApiData] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Field management - เก็บ field ที่เปิดใช้งาน
  const [enabledFields, setEnabledFields] = useState<Set<string>>(new Set(getAllFieldKeys()));
  const [showFieldManager, setShowFieldManager] = useState(false);
  
  // Fixed value modal
  const [fixedValueModal, setFixedValueModal] = useState<{
    open: boolean;
    fieldKey: string;
    field: FieldDefinition | null;
    value: string;
  }>({ open: false, fieldKey: '', field: null, value: '' });

  // Value Map Modal - สำหรับ transform enum/status/boolean values
  const [valueMapModal, setValueMapModal] = useState<{
    open: boolean;
    fieldKey: string;
    field: FieldDefinition | null;
    items: ValueMapItem[];
    allowEmpty?: boolean; // Allow mapping empty/null values
  }>({ open: false, fieldKey: '', field: null, items: [], allowEmpty: false });

  // String Transform Modal - สำหรับ split/join/template
  const [transformModal, setTransformModal] = useState<{
    open: boolean;
    fieldKey: string;
    field: FieldDefinition | null;
    transform: StringTransform;
  }>({ open: false, fieldKey: '', field: null, transform: { type: 'none' } });

  // Test Mapping Modal
  const [testModal, setTestModal] = useState<{
    open: boolean;
    loading: boolean;
    result: {
      success: boolean;
      message: string;
      summary: {
        tours: number;
        departures: number;
        itineraries: number;
        errors: number;
        warnings: number;
      };
      validations: Array<{
        section: string;
        status: string;
        message: string;
        count?: number;
        fields?: Record<string, unknown>;
        items?: Array<{
          index: number;
          status: string;
          issues: string[];
          data: Record<string, unknown>;
        }>;
      }>;
      errors: Array<{ section: string; type: string; message: string }>;
      warnings: Array<{ section: string; type: string; message: string }>;
    } | null;
  }>({ open: false, loading: false, result: null });

  // Load saved mappings from API
  useEffect(() => {
    const loadMappings = async () => {
      setLoadingMappings(true);
      try {
        const response = await integrationsApi.get(Number(params.id));
        
        if (response.success && response.data) {
          // API returns data in response.data.config structure
          const apiData = response.data as { config?: { enabled_fields?: string[] }; mappings?: Record<string, Array<{ 
            section_name: string; 
            our_field: string; 
            their_field?: string; 
            default_value?: string;
            transform_type: string;
            transform_config?: { value_map?: ValueMapItem[]; string_transform?: StringTransform; lookup_by?: string };
          }>> };
          
          // Convert API format to local format
          const loadedMappings: MappingData = {};

          // Flatten mappings from grouped format
          if (apiData.mappings) {
            Object.values(apiData.mappings).flat().forEach((m) => {
              const fieldKey = `${m.section_name}.${m.our_field}`;
              const hasApiField = m.their_field && m.their_field.length > 0;
              loadedMappings[fieldKey] = {
                type: hasApiField ? 'api' : 'fixed',
                value: hasApiField ? (m.their_field || '') : (m.default_value || ''),
                lookupBy: m.transform_config?.lookup_by || undefined,
                valueMap: m.transform_config?.value_map || undefined,
                stringTransform: m.transform_config?.string_transform || undefined,
              };
            });
          }

          // Load enabled fields from config
          const enabledFieldsData = apiData.config?.enabled_fields;
          if (enabledFieldsData && Array.isArray(enabledFieldsData) && enabledFieldsData.length > 0) {
            setEnabledFields(new Set(enabledFieldsData));
          }
          // If empty or null, keep the default (all fields enabled) - don't change enabledFields

          setMappings(loadedMappings);
        }
      } catch (error) {
        console.error('Failed to load mappings:', error);
      } finally {
        setLoadingMappings(false);
      }
    };

    if (params.id) {
      loadMappings();
    }
  }, [params.id]);

  // Fetch sample data from API
  useEffect(() => {
    const fetchSampleData = async () => {
      setLoadingApiData(true);
      setApiError(null);
      try {
        // ดึงข้อมูลจาก API จริง (record แรก)
        const response = await integrationsApi.fetchSample(Number(params.id));
        
        if (response.success && response.data) {
          setApiSampleData(response.data as Record<string, unknown>);
        } else {
          // Store full error response for display
          const errorInfo = {
            message: (response as unknown as { message?: string }).message || 'ไม่สามารถดึงข้อมูลได้',
          };
          setApiError(JSON.stringify(errorInfo, null, 2));
        }
      } catch (error) {
        console.error('Failed to fetch sample data:', error);
        setApiError(`ไม่สามารถเชื่อมต่อ Backend ได้\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nกรุณาตรวจสอบการเชื่อมต่อ API`);
      } finally {
        setLoadingApiData(false);
      }
    };

    if (params.id) {
      fetchSampleData();
    }
  }, [params.id]);

  // Get field key
  const getFieldKey = (section: string, key: string) => `${section}.${key}`;

  // Extract API fields from sample data (dynamically)
  const apiFields = apiSampleData ? extractApiFields(apiSampleData) : {};
  const apiFieldKeys = Object.keys(apiFields);

  // Update mapping (API field)
  const updateMapping = (fieldKey: string, apiField: string, keepValueMap = false) => {
    if (apiField.trim() === '') {
      const newMappings = { ...mappings };
      delete newMappings[fieldKey];
      setMappings(newMappings);
    } else {
      setMappings(prev => {
        const existing = prev[fieldKey];
        return { 
          ...prev, 
          [fieldKey]: { 
            type: 'api', 
            value: apiField,
            // Keep existing valueMap if updating just the field
            valueMap: keepValueMap && existing?.valueMap ? existing.valueMap : undefined
          } 
        };
      });
    }
    setEditingCell(null);
    setSearchValue('');
  };

  // Update value map for enum/status transform
  const updateValueMap = (fieldKey: string, items: ValueMapItem[]) => {
    setMappings(prev => {
      const existing = prev[fieldKey];
      if (!existing) return prev;
      return {
        ...prev,
        [fieldKey]: {
          ...existing,
          valueMap: items.length > 0 ? items : undefined
        }
      };
    });
  };

  // Update string transform (split/join/template)
  const updateStringTransform = (fieldKey: string, transform: StringTransform | undefined) => {
    setMappings(prev => {
      const existing = prev[fieldKey];
      if (!existing) return prev;
      return {
        ...prev,
        [fieldKey]: {
          ...existing,
          stringTransform: transform && transform.type !== 'none' ? transform : undefined
        }
      };
    });
  };

  // Update mapping (Fixed value)
  const updateFixedValue = (fieldKey: string, value: string) => {
    if (value.trim() === '') {
      const newMappings = { ...mappings };
      delete newMappings[fieldKey];
      setMappings(newMappings);
    } else {
      setMappings(prev => ({ ...prev, [fieldKey]: { type: 'fixed', value } }));
    }
    setEditingCell(null);
    setSearchValue('');
  };

  // Get current value
  const getMappingDisplay = (mapping: MappingValue | undefined) => {
    if (!mapping) return null;
    return mapping;
  };

  // Toggle field enabled/disabled
  const toggleField = (fieldKey: string) => {
    setEnabledFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldKey)) {
        newSet.delete(fieldKey);
        // Also remove mapping if exists
        const newMappings = { ...mappings };
        delete newMappings[fieldKey];
        setMappings(newMappings);
      } else {
        newSet.add(fieldKey);
      }
      return newSet;
    });
  };

  // Toggle all fields in a section
  const toggleSection = (section: string, enable: boolean) => {
    setEnabledFields(prev => {
      const newSet = new Set(prev);
      const sectionFields = ALL_FIELDS.filter(f => f.section === section);
      sectionFields.forEach(f => {
        const key = getFieldKey(f.section, f.key);
        if (enable) {
          newSet.add(key);
        } else {
          newSet.delete(key);
          // Remove mapping
          const newMappings = { ...mappings };
          delete newMappings[key];
          setMappings(newMappings);
        }
      });
      return newSet;
    });
  };

  // Filter fields - only show enabled fields
  const filteredFields = ALL_FIELDS.filter(f => {
    const fieldKey = getFieldKey(f.section, f.key);
    const isEnabled = enabledFields.has(fieldKey);
    const matchesSection = filterSection === 'all' || f.section === filterSection;
    return isEnabled && matchesSection;
  });

  // Filter API fields for autocomplete
  const filteredApiFields = apiFieldKeys.filter(f =>
    f.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Stats
  const mappedCount = Object.keys(mappings).length;
  const enabledCount = enabledFields.size;
  const requiredFields = ALL_FIELDS.filter(f => f.required);
  const requiredCount = requiredFields.length;
  const requiredMapped = requiredFields.filter(f => 
    mappings[getFieldKey(f.section, f.key)]
  ).length;
  const requiredEnabled = requiredFields.filter(f => 
    enabledFields.has(getFieldKey(f.section, f.key))
  ).length;

  // Auto detect
  const handleAutoDetect = () => {
    const newMappings = { ...mappings };
    
    for (const field of ALL_FIELDS) {
      const fieldKey = getFieldKey(field.section, field.key);
      if (newMappings[fieldKey]) continue;
      
      const fieldName = field.key.toLowerCase();
      const match = apiFieldKeys.find(apiField => {
        const apiName = apiField.toLowerCase().split('.').pop() || '';
        return apiName === fieldName || 
               apiName.includes(fieldName) ||
               fieldName.includes(apiName);
      });
      
      if (match) {
        newMappings[fieldKey] = { type: 'api', value: match };
      }
    }
    
    setMappings(newMappings);
  };

  // Get sample value for display
  const getSampleValue = (apiField: string): string => {
    const field = apiFields[apiField];
    if (!field) return '';
    const sample = field.sample;
    if (Array.isArray(sample)) {
      return `[${sample.slice(0, 2).join(', ')}${sample.length > 2 ? '...' : ''}]`;
    }
    if (typeof sample === 'string' && sample.length > 30) {
      return sample.substring(0, 30) + '...';
    }
    return String(sample);
  };

  // Generate preview JSON based on current mappings
  const generatePreviewJson = () => {
    // ใช้ข้อมูลจริงจาก API ถ้ามี ไม่งั้นสร้างจาก apiFields
    let sourceData: Record<string, unknown> = {};
    
    if (apiSampleData && Object.keys(apiSampleData).length > 0) {
      sourceData = apiSampleData;
    } else if (Object.keys(apiFields).length > 0) {
      // Build sourceData from apiFields samples
      // Group by array paths first
      const arrayPaths: Record<string, Record<string, unknown>> = {};
      const simplePaths: Record<string, unknown> = {};
      
      for (const [path, fieldInfo] of Object.entries(apiFields)) {
        if (path.includes('[]')) {
          // e.g., "departures[].DepartDate" -> arrayKey: "departures", field: "DepartDate"
          const [arrayPart, ...rest] = path.split('[].');
          const arrayKey = arrayPart.replace('[]', '');
          const fieldPath = rest.join('.');
          
          if (!arrayPaths[arrayKey]) {
            arrayPaths[arrayKey] = {};
          }
          if (fieldPath) {
            arrayPaths[arrayKey][fieldPath] = fieldInfo.sample;
          }
        } else {
          // Simple path like "ProductName" or "Country.Name"
          simplePaths[path] = fieldInfo.sample;
        }
      }
      
      // Build sourceData
      // Add simple paths
      for (const [path, value] of Object.entries(simplePaths)) {
        const parts = path.split('.');
        let current = sourceData;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]] as Record<string, unknown>;
        }
        current[parts[parts.length - 1]] = value;
      }
      
      // Add array paths
      for (const [arrayKey, fields] of Object.entries(arrayPaths)) {
        sourceData[arrayKey] = [fields]; // Create array with one item containing all fields
      }
    }

    // Helper function to get nested value from object using dot notation
    // Supports multiple nested arrays like "periods[].tour_period[].period_id"
    const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
      const parts = path.split('.');
      let current: unknown = obj;
      
      for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        
        // Handle array notation like "departures[]" or "periods[]"
        if (part.includes('[]')) {
          const arrayKey = part.replace('[]', '');
          const arr = (current as Record<string, unknown>)[arrayKey];
          if (Array.isArray(arr) && arr.length > 0) {
            current = arr[0]; // Get first item for preview
          } else {
            return undefined;
          }
        } else {
          current = (current as Record<string, unknown>)[part];
        }
      }
      
      return current;
    };

    // Helper function to flatten deeply nested arrays
    // e.g., "periods[].tour_period[]" will return all items from periods[*].tour_period[*]
    const flattenNestedArrays = (obj: Record<string, unknown>, path: string): unknown[] => {
      // Split path by '[].' to get array segments
      // e.g., "periods[].tour_period[]" -> ["periods", "tour_period"]
      // e.g., "periods[].tour_daily[].day_list[]" -> ["periods", "tour_daily", "day_list"]
      const segments = path.split('[].').map(s => s.replace('[]', ''));
      
      const flatten = (current: unknown, segmentIndex: number): unknown[] => {
        if (segmentIndex >= segments.length) {
          return current !== undefined && current !== null ? [current] : [];
        }
        
        const segment = segments[segmentIndex];
        
        if (current === null || current === undefined) return [];
        
        const arr = (current as Record<string, unknown>)[segment];
        
        if (!Array.isArray(arr)) {
          // If not an array, try to get the value directly
          if (segmentIndex === segments.length - 1 && arr !== undefined) {
            return [arr];
          }
          return [];
        }
        
        // Recursively flatten nested arrays
        const results: unknown[] = [];
        for (const item of arr) {
          results.push(...flatten(item, segmentIndex + 1));
        }
        return results;
      };
      
      return flatten(obj, 0);
    };

    // Helper to get the deepest array path from a mapping path
    // e.g., "periods[].tour_period[].period_id" -> "periods[].tour_period[]"
    const getDeepestArrayPath = (path: string): string | null => {
      const lastArrayIndex = path.lastIndexOf('[]');
      if (lastArrayIndex === -1) return null;
      return path.substring(0, lastArrayIndex + 2);
    };

    // Helper to get value from a specific array item
    const getValueFromItem = (item: Record<string, unknown>, fieldPath: string): unknown => {
      // fieldPath could be simple like "DepartDate" or nested like "Price.Adult"
      const parts = fieldPath.split('.');
      let current: unknown = item;
      for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        current = (current as Record<string, unknown>)[part];
      }
      return current;
    };

    // Apply transforms to a value
    const applyTransforms = (apiValue: unknown, mapping: MappingValue, fieldDef?: FieldDefinition): unknown => {
      let value = apiValue;
      
      // Apply valueMap transform if exists
      if (mapping.valueMap && mapping.valueMap.length > 0) {
        // Handle empty/null/undefined values - check for special "__EMPTY__" marker
        const isEmptyValue = value === null || value === undefined || value === '';
        const stringValue = isEmptyValue ? '__EMPTY__' : String(value);
        
        const mapItem = mapping.valueMap.find((m: ValueMapItem) => 
          m.from.toLowerCase() === stringValue.toLowerCase()
        );
        
        if (mapItem) {
          value = mapItem.to;
          // Convert to proper boolean for boolean fields
          if (fieldDef?.type === 'boolean') {
            value = value === 'true' || value === '1' || value === true;
          }
        }
      }
      
      // Apply string transform (split/join/replace)
      if (mapping.stringTransform && value !== undefined) {
        const transform = mapping.stringTransform;
        
        if (transform.type === 'split' && transform.splitBy && typeof value === 'string') {
          const parts = value.split(transform.splitBy).map(s => s.trim()).filter(s => s);
          if (transform.joinWith !== undefined) {
            value = parts.join(transform.joinWith);
          } else {
            value = parts;
          }
        } else if (transform.type === 'replace' && transform.replaceFrom && typeof value === 'string') {
          value = value.split(transform.replaceFrom).join(transform.replaceTo || '');
        }
      }
      
      return value;
    };

    // Build transformed data based on mappings - only include enabled fields
    // Dynamic sections from ALL_FIELDS
    const allSections = [...new Set(ALL_FIELDS.map(f => f.section))];
    const result: Record<string, unknown> = {};
    for (const section of allSections) {
      if (section === 'departure' || section === 'itinerary') {
        result[section] = []; // departure and itinerary are arrays
      } else {
        result[section] = {};
      }
    }

    // Helper function to process array sections (departure, itinerary)
    const processArraySection = (
      sectionName: string,
      priorityFields: string[]
    ) => {
      const sectionFields = ALL_FIELDS.filter(f => f.section === sectionName);
      const sectionMappings: Record<string, { field: FieldDefinition; mapping: MappingValue }> = {};
      
      for (const field of sectionFields) {
        const fieldKey = getFieldKey(field.section, field.key);
        if (enabledFields.has(fieldKey) && mappings[fieldKey]) {
          sectionMappings[field.key] = { field, mapping: mappings[fieldKey] };
        }
      }

      // Find source array in sourceData using deepest nested path
      let sourceArray: unknown[] = [];
      let deepestArrayPath: string | null = null;
      
      // Priority: find array from priority fields first
      for (const priorityField of priorityFields) {
        const mapping = sectionMappings[priorityField]?.mapping;
        if (mapping?.type === 'api' && mapping.value.includes('[]')) {
          const arrayPath = getDeepestArrayPath(mapping.value);
          if (arrayPath) {
            // Use flattenNestedArrays to get all nested items
            const arr = flattenNestedArrays(sourceData, arrayPath);
            if (arr.length > 0) {
              sourceArray = arr;
              deepestArrayPath = arrayPath;
              break;
            }
          }
        }
      }
      
      // Fallback: try any array mapping
      if (sourceArray.length === 0) {
        for (const { mapping } of Object.values(sectionMappings)) {
          if (mapping.type === 'api' && mapping.value.includes('[]')) {
            const arrayPath = getDeepestArrayPath(mapping.value);
            if (arrayPath) {
              const arr = flattenNestedArrays(sourceData, arrayPath);
              if (arr.length > 0) {
                sourceArray = arr;
                deepestArrayPath = arrayPath;
                break;
              }
            }
          }
        }
      }

      // Helper to extract field path relative to the array base
      const getRelativeFieldPath = (fullPath: string): string | null => {
        if (!deepestArrayPath) return null;
        // e.g., fullPath = "periods[].tour_period[].period_id"
        // deepestArrayPath = "periods[].tour_period[]"
        // should return "period_id"
        if (fullPath.startsWith(deepestArrayPath + '.')) {
          return fullPath.substring(deepestArrayPath.length + 1);
        }
        // If path has nested array after the deepest, get the last segment
        const lastBracket = fullPath.lastIndexOf('[].');
        if (lastBracket !== -1) {
          return fullPath.substring(lastBracket + 3);
        }
        return null;
      };

      // Loop through all items
      if (sourceArray.length > 0) {
        for (const sourceItem of sourceArray) {
          const item: Record<string, unknown> = {};
          
          for (const [key, { field, mapping }] of Object.entries(sectionMappings)) {
            if (mapping.type === 'fixed') {
              item[key] = mapping.value;
            } else if (mapping.type === 'api') {
              let fieldPath = mapping.value;
              
              if (fieldPath.includes('[]')) {
                // Get the field name relative to the deepest array
                const relativePath = getRelativeFieldPath(fieldPath);
                if (relativePath) {
                  fieldPath = relativePath;
                } else {
                  // Fallback: get the last part after the last '[].
                  const lastBracket = fieldPath.lastIndexOf('[].');
                  if (lastBracket !== -1) {
                    fieldPath = fieldPath.substring(lastBracket + 3);
                  }
                }
              } else {
                // Top-level field (no array notation)
                const apiValue = getNestedValue(sourceData, fieldPath);
                if (apiValue !== undefined) {
                  item[key] = applyTransforms(apiValue, mapping, field);
                }
                continue;
              }
              
              let apiValue = getValueFromItem(sourceItem as Record<string, unknown>, fieldPath);
              apiValue = applyTransforms(apiValue, mapping, field);
              
              if (apiValue !== undefined) {
                item[key] = apiValue;
              }
            }
          }
          
          if (Object.keys(item).length > 0) {
            (result[sectionName] as unknown[]).push(item);
          }
        }
      } else {
        // Fallback: single item for non-array mappings
        const item: Record<string, unknown> = {};
        for (const [key, { field, mapping }] of Object.entries(sectionMappings)) {
          if (mapping.type === 'fixed') {
            item[key] = mapping.value;
          } else if (mapping.type === 'api') {
            let apiValue = getNestedValue(sourceData, mapping.value);
            apiValue = applyTransforms(apiValue, mapping, field);
            if (apiValue !== undefined) {
              item[key] = apiValue;
            }
          }
        }
        if (Object.keys(item).length > 0) {
          (result[sectionName] as unknown[]).push(item);
        }
      }
    };

    // Process departure section
    processArraySection('departure', ['departure_date', 'return_date', 'price_adult', 'external_id']);
    
    // Process itinerary section
    processArraySection('itinerary', ['day_number', 'title', 'description']);

    // Process non-array fields (tour, content, media, seo, promotion)

    for (const field of ALL_FIELDS) {
      // Skip array sections - already processed above
      if (field.section === 'departure' || field.section === 'itinerary') {
        continue;
      }
      
      const fieldKey = getFieldKey(field.section, field.key);
      
      // Skip disabled fields
      if (!enabledFields.has(fieldKey)) {
        continue;
      }
      
      const mapping = mappings[fieldKey];
      
      if (mapping) {
        if (mapping.type === 'fixed') {
          (result[field.section] as Record<string, unknown>)[field.key] = mapping.value;
        } else if (mapping.type === 'api') {
          let apiValue: unknown;
          
          // Check if using template (concat multiple fields)
          if (mapping.stringTransform?.type === 'template' && mapping.stringTransform.template) {
            // Replace {fieldName} with actual values
            let template = mapping.stringTransform.template;
            const fieldMatches = template.match(/\{([^}]+)\}/g);
            if (fieldMatches) {
              for (const match of fieldMatches) {
                const fieldPath = match.slice(1, -1); // Remove { }
                const fieldValue = getNestedValue(sourceData, fieldPath);
                template = template.replace(match, fieldValue !== undefined ? String(fieldValue) : '');
              }
            }
            apiValue = template.trim();
          } else {
            apiValue = getNestedValue(sourceData, mapping.value);
          }
          
          apiValue = applyTransforms(apiValue, mapping, field);
          
          if (apiValue !== undefined) {
            (result[field.section] as Record<string, unknown>)[field.key] = apiValue;
          }
        }
      }
      // Don't add null for unmapped fields - just skip them
    }

    // Remove empty sections
    const cleanResult: Record<string, unknown> = {};
    for (const [section, fields] of Object.entries(result)) {
      if (section === 'departure' || section === 'itinerary') {
        // Array sections
        if (Array.isArray(fields) && fields.length > 0) {
          cleanResult[section] = fields;
        }
      } else {
        // Object sections
        const nonNullFields: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(fields as Record<string, unknown>)) {
          if (value !== null && value !== undefined) {
            nonNullFields[key] = value;
          }
        }
        if (Object.keys(nonNullFields).length > 0) {
          cleanResult[section] = nonNullFields;
        }
      }
    }

    return cleanResult;
  };

  // Save
  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert mappings to API format - ใช้ format ที่ backend ต้องการ
      const mappingsArray = Object.entries(mappings).map(([fieldKey, mapping]) => {
        const [section, key] = fieldKey.split('.');
        return {
          section,
          our_field: key,
          source_type: mapping.type, // 'api' or 'fixed'
          api_field: mapping.type === 'api' ? mapping.value : null,
          fixed_value: mapping.type === 'fixed' ? mapping.value : null,
          lookup_by: mapping.lookupBy || null,
          value_map: mapping.valueMap || null,
          string_transform: mapping.stringTransform || null,
        };
      });

      // Include enabled fields info
      const enabledFieldsArray = Array.from(enabledFields);

      // ส่งตรงไป backend ด้วย fetch เพราะ format ต่างจาก type definition
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const response = await fetch(`${API_BASE_URL}/integrations/${params.id}/mappings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          mappings: mappingsArray,
          enabled_fields: enabledFieldsArray,
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        alert('บันทึกสำเร็จ!');
      } else {
        alert('เกิดข้อผิดพลาด: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to save mappings:', error);
      alert('ไม่สามารถบันทึกได้: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // Test Mapping (Dry Run)
  const handleTestMapping = async () => {
    if (!apiSampleData) {
      alert('กรุณาโหลดข้อมูลตัวอย่างก่อน');
      return;
    }

    setTestModal({ open: true, loading: true, result: null });

    try {
      const transformedData = generatePreviewJson();
      
      // ส่ง enabled_fields ไปด้วยเพื่อให้ backend ตรวจสอบเฉพาะ fields ที่เปิดใช้งาน
      const enabledFieldsArray = Array.from(enabledFields);
      
      // สร้าง mappings array เพื่อส่งไปให้ backend รู้ว่า local field map มาจาก API field ใด
      const mappingsArray = Object.entries(mappings).map(([fieldKey, mapping]) => {
        const [section, key] = fieldKey.split('.');
        return {
          section,
          our_field: key,
          source_type: mapping.type, // 'api' or 'fixed'
          api_field: mapping.type === 'api' ? mapping.value : null,
          fixed_value: mapping.type === 'fixed' ? mapping.value : null,
        };
      });

      // ใช้ fetch โดยตรงเพื่อส่ง enabled_fields และ mappings
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const response = await fetch(`${API_BASE_URL}/integrations/${params.id}/test-mapping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sample_data: apiSampleData,
          transformed_data: transformedData,
          enabled_fields: enabledFieldsArray,
          mappings: mappingsArray,
        }),
      });

      const result = await response.json();
      
      setTestModal({
        open: true,
        loading: false,
        result: result,
      });
    } catch (error) {
      setTestModal({
        open: true,
        loading: false,
        result: {
          success: false,
          message: 'เกิดข้อผิดพลาด: ' + (error instanceof Error ? error.message : 'Unknown error'),
          summary: { tours: 0, departures: 0, itineraries: 0, errors: 1, warnings: 0 },
          validations: [],
          errors: [{ section: 'system', type: 'network', message: String(error) }],
          warnings: [],
        },
      });
    }
  };

  // Handle cell click
  const handleCellClick = (fieldKey: string) => {
    setEditingCell(fieldKey);
    const mapping = mappings[fieldKey];
    setSearchValue(mapping?.type === 'api' ? mapping.value : '');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className="space-y-4">
      {/* Header - Compact */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/dashboard/integrations/${params.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Field Mapping</h1>
            <p className="text-gray-500 text-xs">คลิกที่ช่องเพื่อพิมพ์หรือเลือก API field</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs sm:text-sm text-gray-500">
            {requiredMapped}/{requiredEnabled} required • {mappedCount}/{enabledCount} mapped
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowFieldManager(!showFieldManager)}
            className={showFieldManager ? 'bg-purple-100 border-purple-500' : ''}
          >
            <Settings2 className="w-4 h-4" />
            <span className="hidden sm:inline">จัดการ Fields</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleAutoDetect}>
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Auto</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleTestMapping}
            disabled={!apiSampleData}
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            🧪 <span className="hidden sm:inline">ทดสอบ</span>
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="hidden sm:inline">บันทึก</span>
          </Button>
        </div>
      </div>

      {/* Field Manager Panel */}
      {showFieldManager && (
        <Card className="p-4 border-2 border-purple-200 bg-purple-50 border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-purple-900 flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              จัดการ Fields ที่ใช้งาน
            </h3>
            <div className="text-sm text-purple-700">
              เปิดใช้งาน {enabledCount}/{ALL_FIELDS.length} fields
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ">
            {Object.entries(SECTION_NAMES).map(([sectionKey, sectionName]) => {
              const sectionFields = ALL_FIELDS.filter(f => f.section === sectionKey);
              const enabledInSection = sectionFields.filter(f => 
                enabledFields.has(getFieldKey(f.section, f.key))
              ).length;
              const allEnabled = enabledInSection === sectionFields.length;
              
              return (
                <div key={sectionKey} className="bg-white rounded-lg p-3 border border-gray-300">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded ${SECTION_COLORS[sectionKey]}`}></span>
                      <span className="font-medium text-gray-900">{sectionName}</span>
                      <span className="text-xs text-gray-500">({enabledInSection}/{sectionFields.length})</span>
                    </div>
                    <button
                      onClick={() => toggleSection(sectionKey, !allEnabled)}
                      className={`px-2 py-0.5 text-xs rounded ${allEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {allEnabled ? 'ปิดทั้งหมด' : 'เปิดทั้งหมด'}
                    </button>
                  </div>
                  
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {sectionFields.map(field => {
                      const fieldKey = getFieldKey(field.section, field.key);
                      const isEnabled = enabledFields.has(fieldKey);
                      
                      return (
                        <label 
                          key={fieldKey}
                          className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-50 ${
                            isEnabled ? '' : 'opacity-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => toggleField(fieldKey)}
                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm flex-1">{field.label}</span>
                          {field.required && (
                            <span className="text-xs text-red-500">*</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-3 pt-3 border-t border-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-xs text-purple-700">
              💡 ปิด field ที่ไม่ใช้เพื่อลดความซับซ้อน • Required fields จะถูกเตือนถ้าปิด
            </p>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => setEnabledFields(new Set(getAllFieldKeys()))}>
                เปิดทั้งหมด
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                // Keep only required fields
                const requiredKeys = new Set(ALL_FIELDS.filter(f => f.required).map(f => getFieldKey(f.section, f.key)));
                setEnabledFields(requiredKeys);
              }}>
                เฉพาะ Required
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-nowrap overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setFilterSection('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap flex-shrink-0 ${
            filterSection === 'all' 
              ? 'bg-gray-900 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ทั้งหมด ({enabledCount})
        </button>
        {Object.entries(SECTION_NAMES).map(([key, name]) => {
          const sectionFields = ALL_FIELDS.filter(f => f.section === key);
          const enabledInSection = sectionFields.filter(f => enabledFields.has(getFieldKey(f.section, f.key))).length;
          const mapped = sectionFields.filter(f => 
            enabledFields.has(getFieldKey(f.section, f.key)) && 
            mappings[getFieldKey(f.section, f.key)]
          ).length;
          const isActive = filterSection === key;
          if (enabledInSection === 0) return null; // Hide sections with no enabled fields
          return (
            <button
              key={key}
              onClick={() => setFilterSection(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                isActive 
                  ? `${SECTION_COLORS[key]} text-white` 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${SECTION_COLORS[key]}`}></span>
              {name} ({mapped}/{enabledInSection})
            </button>
          );
        })}
      </div>

      {/* Info Box for Departure Section */}
      {filterSection === 'departure' && (
        <div className="bg-gradient-to-r from-purple-50 to-green-50 border border-purple-200 rounded-lg p-3 sm:p-4">
          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-sm sm:text-base">
            <span className="text-lg">📋</span>
            รอบเดินทาง & ราคา (Departures Array)
          </h4>
          <p className="text-xs sm:text-sm text-gray-600 mb-2">
            ข้อมูลจะมาจาก <code className="bg-gray-200 px-1 rounded">departures[]</code> ใน API response 
            ซึ่งแต่ละ item มีข้อมูล period + pricing รวมกัน
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-purple-400"></span>
              <span className="text-purple-700">→ periods table</span>
            </span>
            <span className="text-gray-400">แล้ว</span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-400"></span>
              <span className="text-green-700">→ offers table (ใช้ period_id)</span>
            </span>
          </div>
        </div>
      )}

      {/* Info Box for Itinerary Section */}
      {filterSection === 'itinerary' && (
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-3 sm:p-4">
          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-sm sm:text-base">
            <span className="text-lg">📅</span>
            โปรแกรมรายวัน (Itinerary Array)
          </h4>
          <p className="text-xs sm:text-sm text-gray-600 mb-2">
            ข้อมูลจะมาจาก <code className="bg-gray-200 px-1 rounded">Itinerary[]</code> ใน API response 
            ซึ่งแต่ละ item คือ 1 วันของโปรแกรมทัวร์
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-teal-400"></span>
              <span className="text-teal-700">→ tour_itineraries table (ใช้ tour_id)</span>
            </span>
          </div>
        </div>
      )}

      {/* Table Editor */}
      <Card className="overflow-hidden border-2">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="px-2 py-2 text-left font-semibold text-gray-700 w-16"></th>
                <th className="px-2 py-2 text-left font-semibold text-gray-700">
                  <div>Field ของเรา</div>
                  <div className="text-xs font-normal text-gray-500">ชื่อ • ประเภท</div>
                </th>
                <th className="px-2 py-2 text-center font-semibold text-gray-700 w-10"></th>
                <th className="px-2 py-2 text-left font-semibold text-gray-700">
                  <div>API Field</div>
                  <div className="text-xs font-normal text-gray-500">ชื่อ • ประเภท • ตัวอย่าง</div>
                </th>
                <th className="px-2 py-2 text-center font-semibold text-gray-700 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredFields.map((field, idx) => {
                const fieldKey = getFieldKey(field.section, field.key);
                const mapping = mappings[fieldKey];
                const isEditing = editingCell === fieldKey;
                const isEven = idx % 2 === 0;
                const apiFieldData = mapping?.type === 'api' ? apiFields[mapping.value] : null;
                
                return (
                  <tr 
                    key={fieldKey} 
                    className={`border-b border-gray-300 hover:bg-blue-50 transition-colors ${isEven ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    {/* Section Badge */}
                    <td className="px-2 py-2">
                      <div className={`w-2 h-8 rounded ${SECTION_COLORS[field.section]}`} title={SECTION_NAMES[field.section]}></div>
                    </td>
                    
                    {/* Our Field with Type */}
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="font-medium text-gray-900">{field.label}</span>
                            {field.required && <span className="text-red-500 text-xs">*</span>}
                            {field.lookup && (
                              <span 
                                className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 cursor-help"
                                title={field.lookupHint || `Lookup จาก ${LOOKUP_CONFIGS[field.lookup]?.table}`}
                              >
                                🔗 lookup
                              </span>
                            )}
                            {field.targetTable && (
                              <span 
                                className={`text-xs px-1.5 py-0.5 rounded cursor-help ${
                                  field.targetTable === 'periods' 
                                    ? 'bg-purple-100 text-purple-700' 
                                    : field.targetTable === 'offers'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                                title={`จะ insert ไป ${field.targetTable} table`}
                              >
                                → {field.targetTable}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <code className="text-xs text-gray-400">{field.key}</code>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${TYPE_COLORS[field.type] || 'bg-gray-100 text-gray-600'}`}>
                              {field.type}
                            </span>
                          </div>
                          {field.lookupHint && (
                            <div className="text-xs text-orange-500 mt-0.5">{field.lookupHint}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    {/* Arrow */}
                    <td className="px-2 py-2 text-center">
                      <ArrowRight className={`w-4 h-4 mx-auto ${mapping ? 'text-green-500' : 'text-gray-300'}`} />
                    </td>
                    
                    {/* API Field OR Fixed Value - Editable Cell */}
                    <td className="px-2 py-1">
                      {isEditing ? (
                        <div className="relative">
                          {/* Tab buttons */}
                          <div className="flex items-center gap-1 mb-1">
                            <button
                              type="button"
                              onMouseDown={() => {
                                const current = mappings[fieldKey];
                                if (current?.type !== 'api') {
                                  setSearchValue('');
                                }
                              }}
                              className={`px-2 py-0.5 text-xs rounded-t ${
                                !mappings[fieldKey] || mappings[fieldKey]?.type === 'api' 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                              }`}
                            >
                              จาก API
                            </button>
                            <button
                              type="button"
                              onMouseDown={() => {
                                const currentField = ALL_FIELDS.find(f => getFieldKey(f.section, f.key) === fieldKey);
                                const currentValue = mappings[fieldKey]?.type === 'fixed' ? mappings[fieldKey]?.value : '';
                                setFixedValueModal({
                                  open: true,
                                  fieldKey,
                                  field: currentField || null,
                                  value: currentValue || ''
                                });
                              }}
                              className="px-2 py-0.5 text-xs rounded-t bg-purple-100 text-purple-700 hover:bg-purple-200"
                            >
                              ค่าคงที่
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <Search className="w-4 h-4 text-gray-400 absolute left-2 top-8" />
                            <input
                              ref={inputRef}
                              type="text"
                              value={searchValue}
                              onChange={(e) => setSearchValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateMapping(fieldKey, searchValue);
                                } else if (e.key === 'Escape') {
                                  setEditingCell(null);
                                  setSearchValue('');
                                }
                              }}
                              onBlur={() => {
                                setTimeout(() => {
                                  if (editingCell === fieldKey) {
                                    setEditingCell(null);
                                  }
                                }, 200);
                              }}
                              className="w-full pl-8 pr-2 py-1.5 border-2 border-blue-500 rounded text-sm focus:outline-none"
                              placeholder="พิมพ์หรือเลือก API field..."
                            />
                          </div>
                          {/* Dropdown */}
                          {searchValue !== '' && filteredApiFields.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-40 overflow-auto">
                              {filteredApiFields.slice(0, 8).map(api => (
                                <button
                                  key={api}
                                  onMouseDown={() => updateMapping(fieldKey, api)}
                                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-blue-50 flex items-center gap-2"
                                >
                                  <code className="text-blue-600">{api}</code>
                                </button>
                              ))}
                            </div>
                          )}
                          {/* Quick select */}
                          {searchValue === '' && (
                            <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-auto">
                              <div className="p-2 text-xs text-gray-500 border-b">เลือก API field:</div>
                              {apiFieldKeys.map(api => (
                                <button
                                  key={api}
                                  onMouseDown={() => updateMapping(fieldKey, api)}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 border-b border-gray-100"
                                >
                                  <div className="flex items-center justify-between">
                                    <code className="text-gray-700 font-medium">{api}</code>
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${TYPE_COLORS[apiFields[api]?.type] || 'bg-gray-100 text-gray-600'}`}>
                                      {apiFields[api]?.type || 'unknown'}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5 truncate">
                                    ตัวอย่าง: {getSampleValue(api)}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          onClick={() => handleCellClick(fieldKey)}
                          className={`
                            px-3 py-2 rounded cursor-pointer border-2 border-dashed transition-all min-h-[50px]
                            ${mapping 
                              ? mapping.type === 'fixed' 
                                ? 'bg-purple-50 border-purple-300 hover:border-purple-400'
                                : 'bg-green-50 border-green-300 hover:border-green-400' 
                              : 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                            }
                          `}
                        >
                          {mapping ? (
                            <div>
                              <div className="flex items-center justify-between">
                                {mapping.type === 'api' && apiFieldData ? (
                                  <div className="flex items-center gap-2">
                                    <code className="text-green-700 font-medium">{mapping.value}</code>
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${TYPE_COLORS[apiFieldData.type] || 'bg-gray-100 text-gray-600'}`}>
                                      {apiFieldData.type}
                                    </span>
                                  </div>
                                ) : mapping.type === 'fixed' ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">ค่าคงที่</span>
                                    <code className="text-purple-700 font-medium">&quot;{mapping.value}&quot;</code>
                                  </div>
                                ) : (
                                  <code className="text-green-700 font-medium">{mapping.value}</code>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateMapping(fieldKey, '');
                                  }}
                                  className="p-0.5 text-gray-400 hover:text-red-500"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              {mapping.type === 'api' && apiFieldData && (
                                <div className="text-xs text-gray-500 mt-1 truncate">
                                  <span className="text-gray-400">ตัวอย่าง:</span> {getSampleValue(mapping.value)}
                                </div>
                              )}
                              {/* Lookup selector for fields that need ID translation */}
                              {mapping.type === 'api' && field.lookup && (
                                <div className="mt-1 flex items-center gap-2">
                                  <span className="text-xs text-orange-600">🔗 Lookup:</span>
                                  <select
                                    value={mapping.lookupBy || 'auto'}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      setMappings(prev => ({
                                        ...prev,
                                        [fieldKey]: { ...mapping, lookupBy: e.target.value }
                                      }));
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xs px-1.5 py-0.5 rounded border border-orange-300 bg-orange-50 text-orange-700"
                                  >
                                    <option value="auto">Auto detect</option>
                                    {LOOKUP_CONFIGS[field.lookup]?.matchFields.map(mf => (
                                      <option key={mf} value={mf}>{mf}</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                              {/* Value Transform for enum/status/boolean fields */}
                              {mapping.type === 'api' && ((field.options && field.options.length > 0) || field.type === 'boolean') && (
                                <div className="mt-1 flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setValueMapModal({
                                        open: true,
                                        fieldKey,
                                        field: field.type === 'boolean' ? {
                                          ...field,
                                          options: [
                                            { value: 'true', label: 'true (ใช่)' },
                                            { value: 'false', label: 'false (ไม่)' }
                                          ]
                                        } : field,
                                        items: mapping.valueMap || [],
                                        allowEmpty: field.type === 'boolean' // Allow mapping empty values for boolean
                                      });
                                    }}
                                    className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${
                                      mapping.valueMap && mapping.valueMap.length > 0
                                        ? 'bg-amber-100 text-amber-700 border border-amber-300'
                                        : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700'
                                    }`}
                                  >
                                    <span>🔄</span>
                                    Value Map
                                    {mapping.valueMap && mapping.valueMap.length > 0 && (
                                      <span className="ml-1 bg-amber-500 text-white text-xs px-1 rounded">
                                        {mapping.valueMap.length}
                                      </span>
                                    )}
                                  </button>
                                </div>
                              )}
                              {/* String Transform for string/array fields (split, join, template) */}
                              {mapping.type === 'api' && (field.type === 'string' || field.type.startsWith('array')) && (
                                <div className="mt-1 flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTransformModal({
                                        open: true,
                                        fieldKey,
                                        field,
                                        transform: mapping.stringTransform || { type: 'none' }
                                      });
                                    }}
                                    className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${
                                      mapping.stringTransform && mapping.stringTransform.type !== 'none'
                                        ? 'bg-cyan-100 text-cyan-700 border border-cyan-300'
                                        : 'bg-gray-100 text-gray-600 hover:bg-cyan-50 hover:text-cyan-700'
                                    }`}
                                  >
                                    <span>✂️</span>
                                    Transform
                                    {mapping.stringTransform && mapping.stringTransform.type !== 'none' && (
                                      <span className="ml-1 bg-cyan-500 text-white text-xs px-1 rounded">
                                        {mapping.stringTransform.type}
                                      </span>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">คลิกเพื่อเลือก API field หรือกำหนดค่าคงที่...</span>
                          )}
                        </div>
                      )}
                    </td>
                    
                    {/* Status */}
                    <td className="px-3 py-2 text-center">
                      {mapping ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : field.required ? (
                        <span className="text-xs text-amber-500 font-bold">!</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Footer Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-xs sm:text-sm text-gray-500 px-2">
        <span>แสดง {filteredFields.length} fields</span>
        <span>
          <span className="text-green-600 font-medium">{mappedCount} mapped</span>
          {' • '}
          <span className={requiredMapped < requiredCount ? 'text-amber-600' : 'text-green-600'}>
            {requiredMapped}/{requiredCount} required
          </span>
        </span>
      </div>

      {/* Preview JSON Section */}
      <Card className="overflow-hidden border-2 mt-4">
        <div 
          className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white cursor-pointer"
          onClick={() => setShowPreview(!showPreview)}
        >
          <div className="flex items-center gap-2">
            <Code className="w-4 sm:w-5 h-4 sm:h-5 text-green-400" />
            <span className="font-semibold text-sm sm:text-base">Preview: ตัวอย่างข้อมูลหลัง Transform</span>
            <span className="text-xs text-gray-400 ml-2 hidden sm:inline">
              (ดึงข้อมูล Record แรกจาก API จริง)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-400 hidden sm:block" />
            {showPreview ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>
        
        {showPreview && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-3 sm:p-4 bg-gray-50">
            {/* Left: API Response (Before) */}
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-gray-500 uppercase">API Response</span>
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Before</span>
                  {loadingApiData && (
                    <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                  )}
                </div>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    setLoadingApiData(true);
                    try {
                      const response = await integrationsApi.fetchSample(Number(params.id));
                      if (response.success && response.data) {
                        setApiSampleData(response.data as Record<string, unknown>);
                      }
                    } catch (error) {
                      console.error('Failed to refresh:', error);
                    } finally {
                      setLoadingApiData(false);
                    }
                  }}
                  className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                  disabled={loadingApiData}
                >
                  <Zap className="w-3 h-3" />
                  Refresh
                </button>
              </div>
              <pre className="text-xs bg-gray-900 text-gray-100 p-3 sm:p-4 rounded-lg overflow-auto max-h-60 sm:max-h-80 font-mono">
                <code>
                  {apiSampleData 
                    ? JSON.stringify(apiSampleData, null, 2)
                    : loadingApiData 
                      ? 'กำลังโหลดข้อมูล...'
                      : apiError
                        ? typeof apiError === 'object' 
                          ? JSON.stringify(apiError, null, 2)
                          : `// ❌ Error:\n${apiError}`
                        : '// กำลังเตรียมข้อมูล...'
                  }
                </code>
              </pre>
            </div>
            
            {/* Right: Transformed Data (After) */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">Transformed</span>
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">After</span>
              </div>
              <pre className="text-xs bg-gray-900 text-green-400 p-3 sm:p-4 rounded-lg overflow-auto max-h-60 sm:max-h-80 font-mono">
                <code>
                  {JSON.stringify(generatePreviewJson(), null, 2)}
                </code>
              </pre>
            </div>
          </div>
        )}
        
        {/* Legend */}
        {showPreview && (
          <div className="px-3 sm:px-4 py-2 bg-gray-100 border-t flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-green-500"></span>
              <span>Mapped จาก API</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-purple-500"></span>
              <span>ค่าคงที่</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gray-400"></span>
              <span>null = ยังไม่ได้ mapping</span>
            </div>
          </div>
        )}
      </Card>

      {/* Fixed Value Modal */}
      {fixedValueModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">กำหนดค่าคงที่</h3>
                {fixedValueModal.field && (
                  <p className="text-sm text-gray-500">{fixedValueModal.field.label}</p>
                )}
              </div>
              <button
                onClick={() => setFixedValueModal({ open: false, fieldKey: '', field: null, value: '' })}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-4">
              {fixedValueModal.field?.description && (
                <p className="text-sm text-gray-600 mb-3">{fixedValueModal.field.description}</p>
              )}
              
              {/* แสดง Select ถ้ามี options, ไม่งั้นแสดง Input */}
              {fixedValueModal.field?.options && fixedValueModal.field.options.length > 0 ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เลือกค่า:
                  </label>
                  <select
                    value={fixedValueModal.value}
                    onChange={(e) => setFixedValueModal(prev => ({ ...prev, value: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">-- เลือก --</option>
                    {fixedValueModal.field.options.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  
                  {/* Quick select buttons */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {fixedValueModal.field.options.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFixedValueModal(prev => ({ ...prev, value: opt.value }))}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                          fixedValueModal.value === opt.value
                            ? 'bg-purple-500 text-white border-purple-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    กรอกค่า ({fixedValueModal.field?.type || 'string'}):
                  </label>
                  <input
                    type={fixedValueModal.field?.type === 'int' || fixedValueModal.field?.type === 'float' ? 'number' : 'text'}
                    value={fixedValueModal.value}
                    onChange={(e) => setFixedValueModal(prev => ({ ...prev, value: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder={`กรอก${fixedValueModal.field?.label || 'ค่า'}...`}
                    autoFocus
                  />
                </div>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex items-center justify-between rounded-b-lg">
              <button
                type="button"
                onClick={() => {
                  // Clear the fixed value (remove mapping)
                  updateFixedValue(fixedValueModal.fieldKey, '');
                  setFixedValueModal({ open: false, fieldKey: '', field: null, value: '' });
                }}
                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                ลบค่า
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFixedValueModal({ open: false, fieldKey: '', field: null, value: '' })}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (fixedValueModal.value.trim()) {
                      updateFixedValue(fixedValueModal.fieldKey, fixedValueModal.value.trim());
                    }
                    setFixedValueModal({ open: false, fieldKey: '', field: null, value: '' });
                  }}
                  className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  ยืนยัน
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Value Map Modal - Transform enum/status values */}
      {valueMapModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">🔄 Value Transform</h3>
                {valueMapModal.field && (
                  <p className="text-sm text-gray-500">
                    Map ค่าจาก API ไปเป็นค่าของเรา - {valueMapModal.field.label}
                  </p>
                )}
              </div>
              <button
                onClick={() => setValueMapModal({ open: false, fieldKey: '', field: null, items: [], allowEmpty: false })}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-4 max-h-96 overflow-auto">
              <p className="text-sm text-gray-600 mb-3">
                กำหนด mapping ระหว่างค่าที่ได้รับจาก API กับค่าในระบบของเรา
              </p>
              
              {/* Existing mappings */}
              <div className="space-y-2 mb-4">
                {valueMapModal.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.from}
                      onChange={(e) => {
                        const newItems = [...valueMapModal.items];
                        newItems[idx].from = e.target.value;
                        setValueMapModal(prev => ({ ...prev, items: newItems }));
                      }}
                      placeholder="ค่าจาก API"
                      className="flex-1 px-2 py-1.5 border rounded text-sm"
                    />
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <select
                      value={item.to}
                      onChange={(e) => {
                        const newItems = [...valueMapModal.items];
                        newItems[idx].to = e.target.value;
                        setValueMapModal(prev => ({ ...prev, items: newItems }));
                      }}
                      className="flex-1 px-2 py-1.5 border rounded text-sm"
                    >
                      <option value="">-- เลือกค่า --</option>
                      {valueMapModal.field?.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const newItems = valueMapModal.items.filter((_, i) => i !== idx);
                        setValueMapModal(prev => ({ ...prev, items: newItems }));
                      }}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Add new mapping button */}
              <button
                onClick={() => {
                  setValueMapModal(prev => ({
                    ...prev,
                    items: [...prev.items, { from: '', to: '' }]
                  }));
                }}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-amber-400 hover:text-amber-600 text-sm"
              >
                + เพิ่ม mapping
              </button>
              
              {/* Quick examples */}
              {valueMapModal.field?.options && valueMapModal.items.length === 0 && (
                <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs font-medium text-amber-700 mb-2">ตัวอย่างการใช้งาน:</p>
                  <div className="text-xs text-amber-600 space-y-1">
                    <div>• API ส่ง &quot;book&quot; → แปลงเป็น &quot;open&quot;</div>
                    <div>• API ส่ง &quot;sold_out&quot; → แปลงเป็น &quot;full&quot;</div>
                    <div>• API ส่ง &quot;available&quot; → แปลงเป็น &quot;open&quot;</div>
                  </div>
                </div>
              )}
              
              {/* Quick add buttons for boolean empty value */}
              {valueMapModal.allowEmpty && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs font-medium text-blue-700 mb-2">💡 เพิ่มด่วน (สำหรับ boolean):</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        if (!valueMapModal.items.some(i => i.from === '__EMPTY__')) {
                          setValueMapModal(prev => ({
                            ...prev,
                            items: [...prev.items, { from: '__EMPTY__', to: 'false' }]
                          }));
                        }
                      }}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      + (ค่าว่าง) → false
                    </button>
                    <button
                      onClick={() => {
                        if (!valueMapModal.items.some(i => i.from === 'Y')) {
                          setValueMapModal(prev => ({
                            ...prev,
                            items: [...prev.items, { from: 'Y', to: 'true' }]
                          }));
                        }
                      }}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      + Y → true
                    </button>
                    <button
                      onClick={() => {
                        if (!valueMapModal.items.some(i => i.from === 'N')) {
                          setValueMapModal(prev => ({
                            ...prev,
                            items: [...prev.items, { from: 'N', to: 'false' }]
                          }));
                        }
                      }}
                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      + N → false
                    </button>
                    <button
                      onClick={() => {
                        if (!valueMapModal.items.some(i => i.from === '1')) {
                          setValueMapModal(prev => ({
                            ...prev,
                            items: [...prev.items, { from: '1', to: 'true' }]
                          }));
                        }
                      }}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      + 1 → true
                    </button>
                    <button
                      onClick={() => {
                        if (!valueMapModal.items.some(i => i.from === '0')) {
                          setValueMapModal(prev => ({
                            ...prev,
                            items: [...prev.items, { from: '0', to: 'false' }]
                          }));
                        }
                      }}
                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      + 0 → false
                    </button>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    💡 ใช้ <code className="bg-blue-100 px-1 rounded">__EMPTY__</code> สำหรับ map ค่าว่าง/null
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex items-center justify-between rounded-b-lg">
              <button
                type="button"
                onClick={() => {
                  updateValueMap(valueMapModal.fieldKey, []);
                  setValueMapModal({ open: false, fieldKey: '', field: null, items: [], allowEmpty: false });
                }}
                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                ลบทั้งหมด
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setValueMapModal({ open: false, fieldKey: '', field: null, items: [], allowEmpty: false })}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Filter out empty items (but keep __EMPTY__ as valid)
                    const validItems = valueMapModal.items.filter(item => item.from.trim() && item.to.trim());
                    updateValueMap(valueMapModal.fieldKey, validItems);
                    setValueMapModal({ open: false, fieldKey: '', field: null, items: [], allowEmpty: false });
                  }}
                  className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* String Transform Modal - Split/Join/Template */}
      {transformModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">✂️ String Transform</h3>
                {transformModal.field && (
                  <p className="text-sm text-gray-500">
                    แปลงข้อความ - {transformModal.field.label}
                  </p>
                )}
              </div>
              <button
                onClick={() => setTransformModal({ open: false, fieldKey: '', field: null, transform: { type: 'none' } })}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-4 max-h-96 overflow-auto">
              {/* Transform Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">ประเภท Transform:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { type: 'none', label: 'ไม่แปลง', desc: 'ใช้ค่าตรงๆ' },
                    { type: 'split', label: 'Split & Join', desc: 'แยก/รวมข้อความ' },
                    { type: 'replace', label: 'Replace', desc: 'แทนที่ข้อความ' },
                    { type: 'template', label: 'Template', desc: 'รวมหลาย fields' },
                  ].map(opt => (
                    <button
                      key={opt.type}
                      onClick={() => setTransformModal(prev => ({
                        ...prev,
                        transform: { ...prev.transform, type: opt.type as StringTransform['type'] }
                      }))}
                      className={`p-3 rounded-lg border-2 text-left ${
                        transformModal.transform.type === opt.type
                          ? 'border-cyan-500 bg-cyan-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm">{opt.label}</div>
                      <div className="text-xs text-gray-500">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Split & Join Options */}
              {transformModal.transform.type === 'split' && (
                <div className="space-y-3 p-3 bg-cyan-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">แยกด้วย (Split by):</label>
                    <select
                      value={transformModal.transform.splitBy || ''}
                      onChange={(e) => setTransformModal(prev => ({
                        ...prev,
                        transform: { ...prev.transform, splitBy: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="">-- เลือก --</option>
                      <option value=" ">Space (ช่องว่าง)</option>
                      <option value=",">Comma (,)</option>
                      <option value="\n">Newline (บรรทัดใหม่)</option>
                      <option value="/">Slash (/)</option>
                      <option value="-">Dash (-)</option>
                      <option value="|">Pipe (|)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">รวมด้วย (Join with):</label>
                    <select
                      value={transformModal.transform.joinWith ?? ''}
                      onChange={(e) => setTransformModal(prev => ({
                        ...prev,
                        transform: { ...prev.transform, joinWith: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="">เก็บเป็น Array</option>
                      <option value=",">Comma (,)</option>
                      <option value=", ">Comma + Space (, )</option>
                      <option value=" | ">Pipe ( | )</option>
                      <option value="\n">Newline</option>
                    </select>
                  </div>
                  <div className="text-xs text-cyan-700 p-2 bg-cyan-100 rounded">
                    <strong>ตัวอย่าง:</strong> &quot;A B C&quot; → Split by space → Join with &quot;,&quot; → &quot;A,B,C&quot;
                  </div>
                </div>
              )}

              {/* Replace Options */}
              {transformModal.transform.type === 'replace' && (
                <div className="space-y-3 p-3 bg-cyan-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ค้นหา (Find):</label>
                    <input
                      type="text"
                      value={transformModal.transform.replaceFrom || ''}
                      onChange={(e) => setTransformModal(prev => ({
                        ...prev,
                        transform: { ...prev.transform, replaceFrom: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      placeholder="ข้อความที่ต้องการแทนที่"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">แทนที่ด้วย (Replace with):</label>
                    <input
                      type="text"
                      value={transformModal.transform.replaceTo || ''}
                      onChange={(e) => setTransformModal(prev => ({
                        ...prev,
                        transform: { ...prev.transform, replaceTo: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      placeholder="ข้อความใหม่ (เว้นว่างเพื่อลบ)"
                    />
                  </div>
                </div>
              )}

              {/* Template Options */}
              {transformModal.transform.type === 'template' && (
                <div className="space-y-3 p-3 bg-cyan-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Template:</label>
                    <textarea
                      value={transformModal.transform.template || ''}
                      onChange={(e) => setTransformModal(prev => ({
                        ...prev,
                        transform: { ...prev.transform, template: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                      rows={3}
                      placeholder="{ProductName} - {Highlight}"
                    />
                  </div>
                  <div className="text-xs text-cyan-700 p-2 bg-cyan-100 rounded">
                    <strong>วิธีใช้:</strong> ใช้ {'{ชื่อ field}'} เพื่อดึงค่าจาก API
                    <div className="mt-1">ตัวอย่าง: <code>{'{ProductName} - {Highlight}'}</code></div>
                    <div className="mt-2 text-cyan-600">
                      <strong>Available fields:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {apiFieldKeys.slice(0, 10).map(f => (
                          <button
                            key={f}
                            onClick={() => setTransformModal(prev => ({
                              ...prev,
                              transform: { 
                                ...prev.transform, 
                                template: (prev.transform.template || '') + `{${f}}` 
                              }
                            }))}
                            className="px-1.5 py-0.5 bg-cyan-200 rounded text-cyan-800 hover:bg-cyan-300"
                          >
                            {f}
                          </button>
                        ))}
                        {apiFieldKeys.length > 10 && <span className="text-gray-500">+{apiFieldKeys.length - 10} more</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex items-center justify-between rounded-b-lg">
              <button
                type="button"
                onClick={() => {
                  updateStringTransform(transformModal.fieldKey, undefined);
                  setTransformModal({ open: false, fieldKey: '', field: null, transform: { type: 'none' } });
                }}
                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                ลบ Transform
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTransformModal({ open: false, fieldKey: '', field: null, transform: { type: 'none' } })}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateStringTransform(transformModal.fieldKey, transformModal.transform);
                    setTransformModal({ open: false, fieldKey: '', field: null, transform: { type: 'none' } });
                  }}
                  className="px-4 py-2 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Mapping Modal */}
      {testModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 ">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[85vh] overflow-hidden flex flex-col border border-gray-200">
            {/* Header */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg">ทดสอบ Mapping</h3>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">Dry Run - ตรวจสอบความถูกต้องก่อน sync จริง</p>
                  </div>
                </div>
                <button
                  onClick={() => setTestModal({ open: false, loading: false, result: null })}
                  className="p-2 hover:bg-white/80 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4 sm:p-6">
              {testModal.loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  </div>
                  <span className="text-gray-600 font-medium">กำลังทดสอบ Mapping...</span>
                  <span className="text-sm text-gray-400 mt-1">กรุณารอสักครู่</span>
                </div>
              ) : testModal.result ? (
                <div className="space-y-5">
                  {/* Summary Card */}
                  <div className={`p-5 rounded-xl border ${
                    testModal.result.success 
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                      : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200'
                  }`}>
                    <div className="flex items-start sm:items-center gap-3 mb-4">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        testModal.result.success 
                          ? 'bg-green-100' 
                          : 'bg-red-100'
                      }`}>
                        {testModal.result.success ? (
                          <Check className="w-6 h-6 text-green-600" />
                        ) : (
                          <X className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className={`font-bold text-base sm:text-lg ${testModal.result.success ? 'text-green-700' : 'text-red-700'}`}>
                          {testModal.result.success ? 'Mapping ผ่านการทดสอบ พร้อม sync ได้เลย' : 'พบปัญหาใน Mapping'}
                        </h4>
                        <p className="text-sm text-gray-500">{testModal.result.message}</p>
                      </div>
                    </div>
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                      <div className="bg-white/60 rounded-lg p-2 sm:p-3 text-center border border-white">
                        <div className="text-xl sm:text-2xl font-bold text-indigo-600">{testModal.result.summary?.tours ?? 0}</div>
                        <div className="text-xs text-gray-500 mt-1">ทัวร์</div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2 sm:p-3 text-center border border-white">
                        <div className="text-xl sm:text-2xl font-bold text-purple-600">{testModal.result.summary?.departures ?? 0}</div>
                        <div className="text-xs text-gray-500 mt-1">รอบเดินทาง</div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2 sm:p-3 text-center border border-white">
                        <div className="text-xl sm:text-2xl font-bold text-cyan-600">{testModal.result.summary?.itineraries ?? 0}</div>
                        <div className="text-xs text-gray-500 mt-1">วัน</div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2 sm:p-3 text-center border border-white">
                        <div className={`text-xl sm:text-2xl font-bold ${(testModal.result.summary?.errors ?? 0) > 0 ? 'text-red-600' : 'text-gray-300'}`}>
                          {testModal.result.summary?.errors ?? 0}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Errors</div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2 sm:p-3 text-center border border-white">
                        <div className={`text-xl sm:text-2xl font-bold ${(testModal.result.summary?.warnings ?? 0) > 0 ? 'text-amber-600' : 'text-gray-300'}`}>
                          {testModal.result.summary?.warnings ?? 0}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Warnings</div>
                      </div>
                    </div>
                  </div>

                  {/* Errors */}
                  {testModal.result.errors?.length > 0 && (
                    <div className="rounded-xl border border-red-200 overflow-hidden">
                      <div className="px-4 py-3 bg-red-50 border-b border-red-200 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                          <X className="w-3.5 h-3.5 text-red-600" />
                        </div>
                        <span className="font-semibold text-red-700">Errors ({testModal.result.errors.length})</span>
                      </div>
                      <div className="p-3 space-y-2 bg-white">
                        {testModal.result.errors.map((err, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-red-50/50 rounded-lg">
                            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">{err.section}</span>
                            <span className="text-sm text-red-600">{err.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {testModal.result.warnings?.length > 0 && (
                    <div className="rounded-xl border border-amber-200 overflow-hidden">
                      <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                          <span className="text-amber-600 text-sm">!</span>
                        </div>
                        <span className="font-semibold text-amber-700">Warnings ({testModal.result.warnings.length})</span>
                      </div>
                      <div className="p-3 space-y-2 bg-white">
                        {testModal.result.warnings.map((warn, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-amber-50/50 rounded-lg">
                            <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">{warn.section}</span>
                            <span className="text-sm text-amber-600">{warn.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Validations - Detailed Report */}
                  {testModal.result.validations?.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                        <Search className="w-3.5 h-3.5 text-gray-600" />
                      </div>
                      <h4 className="font-semibold text-gray-700">รายละเอียดการตรวจสอบ</h4>
                    </div>
                    {testModal.result.validations.map((v: { 
                      section: string; 
                      status: string; 
                      message?: string;
                      count?: number; 
                      enabled_count?: number;
                      enabled_fields?: string[];
                      tested_fields?: Array<{ field: string; mapped_value?: unknown; value?: unknown; has_value?: boolean; status: string }>;
                      fields?: Record<string, unknown>; 
                      items?: Array<{ 
                        index: number; 
                        status: string; 
                        issues: string[]; 
                        data: Record<string, unknown>;
                        tested_fields?: Array<{ field: string; value: unknown; status: string }>;
                      }>;
                    }, i: number) => (
                      <div key={i} className="border rounded-xl overflow-hidden border-gray-200 bg-white">
                        {/* Section Header */}
                        <div className={`px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          v.status === 'success' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100' : 
                          v.status === 'error' ? 'bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-100' : 
                          'bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              v.status === 'success' ? 'bg-green-100' : 
                              v.status === 'error' ? 'bg-red-100' : 'bg-amber-100'
                            }`}>
                              {v.status === 'success' ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : v.status === 'error' ? (
                                <X className="w-4 h-4 text-red-600" />
                              ) : (
                                <span className="text-amber-600 text-sm font-bold">!</span>
                              )}
                            </div>
                            <span className="font-semibold text-gray-800">{
                              v.section === 'tour' ? 'Tour' : 
                              v.section === 'departure' ? 'Departure' : 
                              v.section === 'itinerary' ? 'Itinerary' : v.section
                            }</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                            {v.enabled_count !== undefined && (
                              <span className="flex items-center gap-1.5 text-gray-600">
                                <Settings2 className="w-3.5 h-3.5" />
                                <strong>{v.enabled_count}</strong> fields
                              </span>
                            )}
                            {v.count !== undefined && (
                              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-white/60 rounded-full text-gray-600">
                                <span className="font-semibold">{v.count}</span> items
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Tour Section: Show tested fields as table */}
                        {v.section === 'tour' && v.tested_fields && v.tested_fields.length > 0 && (
                          <div className="p-3 sm:p-4 overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left text-gray-500 border-b border-gray-100">
                                  <th className="pb-2 font-medium">Local Field</th>
                                  <th className="pb-2 font-medium text-center w-10">→</th>
                                  <th className="pb-2 font-medium">API Field</th>
                                  <th className="pb-2 font-medium text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {v.tested_fields.map((tf: { field: string; api_field?: string; source_type?: string; mapped_value?: unknown; value?: unknown; has_value?: boolean; status: string }, j: number) => (
                                  <tr key={j} className="border-b border-gray-50 hover:bg-gray-50/50">
                                    <td className="py-2 font-medium text-gray-700">{tf.field}</td>
                                    <td className="py-2 text-center">
                                      <ArrowRight className="w-4 h-4 text-gray-300 mx-auto" />
                                    </td>
                                    <td className="py-2">
                                      {tf.source_type === 'fixed' ? (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-purple-50 text-purple-700 rounded font-mono text-xs">
                                          &quot;{String(tf.mapped_value)}&quot;
                                        </span>
                                      ) : tf.api_field ? (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-mono text-xs">
                                          {tf.api_field}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 text-xs">(ไม่ได้ map)</span>
                                      )}
                                    </td>
                                    <td className="py-2 text-right">
                                      {tf.status === 'ok' ? (
                                        <span className="inline-flex items-center gap-1 text-green-600">
                                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                          success
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-gray-400">
                                          <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                                          empty
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        
                        {/* Departure/Itinerary: Show as compact table */}
                        {(v.section === 'departure' || v.section === 'itinerary') && v.tested_fields && v.tested_fields.length > 0 && (
                          <div className="p-3 bg-white border-t border-gray-100 overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-left text-gray-500 border-b">
                                  <th className="pb-2 font-medium">Local Field</th>
                                  <th className="pb-2 font-medium">→</th>
                                  <th className="pb-2 font-medium">API Field</th>
                                  <th className="pb-2 font-medium text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {v.tested_fields.map((tf: { field: string; api_field?: string; source_type?: string; mapped_value?: unknown; status: string }, j: number) => (
                                  <tr key={j} className={`border-b border-gray-100 ${tf.status === 'ok' ? '' : 'bg-gray-50'}`}>
                                    <td className="py-1.5 font-medium text-gray-700">{tf.field}</td>
                                    <td className="py-1.5 text-gray-400">→</td>
                                    <td className="py-1.5">
                                      {tf.source_type === 'fixed' ? (
                                        <span className="text-purple-600 font-mono">&quot;{String(tf.mapped_value)}&quot;</span>
                                      ) : tf.api_field ? (
                                        <span className="text-blue-600 font-mono">{tf.api_field}</span>
                                      ) : (
                                        <span className="text-gray-400">(ไม่ได้ map)</span>
                                      )}
                                    </td>
                                    <td className="py-1.5 text-right">
                                      {tf.status === 'ok' ? (
                                        <span className="inline-flex items-center gap-1 text-green-600">
                                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                          success
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-gray-400">
                                          <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                                          empty
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        
                        {/* Items detail for Departure/Itinerary */}
                        {v.items && v.items.length > 0 && (
                          <div className="p-2 text-sm space-y-2 bg-gray-50 border-t border-gray-100">
                            {v.items.slice(0, 3).map((item: { 
                              index: number; 
                              status: string; 
                              issues: string[]; 
                              data: Record<string, unknown>;
                              tested_fields?: Array<{ field: string; api_field?: string; source_type?: string; mapped_value?: unknown; value?: unknown; status: string }>;
                            }, j: number) => (
                              <div key={j} className={`rounded border overflow-hidden ${
                                item.status === 'success' ? 'bg-white border-green-200' : 
                                item.status === 'error' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                              }`}>
                                <div className={`flex items-center gap-2 px-3 py-1.5 ${
                                  item.status === 'success' ? 'bg-green-50' : 
                                  item.status === 'error' ? 'bg-red-100' : 'bg-amber-100'
                                }`}>
                                  <span className={`font-medium ${
                                    item.status === 'success' ? 'text-green-700' : 
                                    item.status === 'error' ? 'text-red-700' : 'text-amber-700'
                                  }`}>
                                    {item.status === 'success' ? '✅ .' : item.status === 'error' ? '❌ ' : '⚠️ '}
                                    {item.index}
                                  </span>
                                  {item.issues.length === 0 && (
                                    <span className="text-green-600 text-xs">ผ่านทุก field</span>
                                  )}
                                </div>
                                
                                {/* Show issues if any */}
                                {item.issues.length > 0 && (
                                  <ul className="text-xs text-red-600 px-3 py-2 bg-red-50/50">
                                    {item.issues.map((issue: string, k: number) => <li key={k}>• {issue}</li>)}
                                  </ul>
                                )}
                                
                                {/* Show tested fields as table */}
                                {item.tested_fields && item.tested_fields.length > 0 && (
                                  <div className="px-3 py-2 overflow-x-auto">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="text-left text-gray-500 border-b">
                                          <th className="pb-1 font-medium">Local Field</th>
                                          <th className="pb-1 font-medium">→</th>
                                          <th className="pb-1 font-medium">API Field</th>
                                          <th className="pb-1 font-medium text-right">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {item.tested_fields.map((tf: { field: string; api_field?: string; source_type?: string; mapped_value?: unknown; value?: unknown; status: string }, k: number) => (
                                          <tr key={k} className={`border-b border-gray-100 ${tf.status === 'ok' ? '' : 'bg-gray-50/50'}`}>
                                            <td className="py-1 font-medium text-gray-700">{tf.field}</td>
                                            <td className="py-1 text-gray-400">→</td>
                                            <td className="py-1">
                                              {tf.source_type === 'fixed' ? (
                                                <span className="text-purple-600 font-mono">&quot;{String(tf.mapped_value ?? tf.value)}&quot;</span>
                                              ) : tf.api_field ? (
                                                <span className="text-blue-600 font-mono">{tf.api_field}</span>
                                              ) : (
                                                <span className="text-gray-400">(ไม่ได้ map)</span>
                                              )}
                                            </td>
                                            <td className="py-1 text-right">
                                              {tf.status === 'ok' ? (
                                                <span className="inline-flex items-center gap-1 text-green-600">
                                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                  success
                                                </span>
                                              ) : (
                                                <span className="inline-flex items-center gap-1 text-gray-400">
                                                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                                  empty
                                                </span>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            ))}
                            {v.items.length > 3 && (
                              <div className="text-gray-500 text-xs text-center py-1">
                                ...และอีก {v.items.length - 3} รายการ
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Message if section disabled */}
                        {v.message && v.message.includes('disabled') && (
                          <div className="p-2 bg-gray-100 text-gray-500 text-sm border-t">
                            ⏭️ Section นี้ไม่มี field ที่เปิดใช้งาน (ข้ามการทดสอบ)
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="p-4 border-t bg-gray-50 flex items-center justify-end rounded-b-lg border-gray-200">
              <button
                type="button"
                onClick={() => setTestModal({ open: false, loading: false, result: null })}
                className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}