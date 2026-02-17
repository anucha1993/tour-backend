'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Plane, Globe, Crown, BookOpen, Users, Ticket,
  Building2, Landmark, HardHat, GraduationCap, Heart, Handshake,
  MapPin, Star, Shield, Briefcase, Camera, Ship,
  Bus, Train, Mountain, Palmtree, Sun, Umbrella,
  Hotel, Utensils, Compass, Map, Flag, Award,
  Calendar, Clock, Phone, Mail, CreditCard, DollarSign,
  TrendingUp, Target, Zap, Gift, Gem, Sparkles,
  type LucideIcon,
} from 'lucide-react';

export const ICON_MAP: Record<string, { icon: LucideIcon; label: string }> = {
  Plane: { icon: Plane, label: 'เครื่องบิน' },
  Globe: { icon: Globe, label: 'โลก' },
  Crown: { icon: Crown, label: 'มงกุฎ' },
  BookOpen: { icon: BookOpen, label: 'หนังสือ' },
  Users: { icon: Users, label: 'กลุ่มคน' },
  Ticket: { icon: Ticket, label: 'ตั๋ว' },
  Building2: { icon: Building2, label: 'ตึก/บริษัท' },
  Landmark: { icon: Landmark, label: 'อาคารราชการ' },
  HardHat: { icon: HardHat, label: 'หมวกก่อสร้าง' },
  GraduationCap: { icon: GraduationCap, label: 'หมวกรับปริญญา' },
  Heart: { icon: Heart, label: 'หัวใจ' },
  Handshake: { icon: Handshake, label: 'จับมือ' },
  MapPin: { icon: MapPin, label: 'หมุดแผนที่' },
  Star: { icon: Star, label: 'ดาว' },
  Shield: { icon: Shield, label: 'โล่' },
  Briefcase: { icon: Briefcase, label: 'กระเป๋าเอกสาร' },
  Camera: { icon: Camera, label: 'กล้อง' },
  Ship: { icon: Ship, label: 'เรือ' },
  Bus: { icon: Bus, label: 'รถบัส' },
  Train: { icon: Train, label: 'รถไฟ' },
  Mountain: { icon: Mountain, label: 'ภูเขา' },
  Palmtree: { icon: Palmtree, label: 'ต้นปาล์ม' },
  Sun: { icon: Sun, label: 'ดวงอาทิตย์' },
  Umbrella: { icon: Umbrella, label: 'ร่ม' },
  Hotel: { icon: Hotel, label: 'โรงแรม' },
  Utensils: { icon: Utensils, label: 'อาหาร' },
  Compass: { icon: Compass, label: 'เข็มทิศ' },
  Map: { icon: Map, label: 'แผนที่' },
  Flag: { icon: Flag, label: 'ธง' },
  Award: { icon: Award, label: 'รางวัล' },
  Calendar: { icon: Calendar, label: 'ปฏิทิน' },
  Clock: { icon: Clock, label: 'นาฬิกา' },
  Phone: { icon: Phone, label: 'โทรศัพท์' },
  Mail: { icon: Mail, label: 'อีเมล' },
  CreditCard: { icon: CreditCard, label: 'บัตรเครดิต' },
  DollarSign: { icon: DollarSign, label: 'เงิน' },
  TrendingUp: { icon: TrendingUp, label: 'กราฟขึ้น' },
  Target: { icon: Target, label: 'เป้าหมาย' },
  Zap: { icon: Zap, label: 'สายฟ้า' },
  Gift: { icon: Gift, label: 'ของขวัญ' },
  Gem: { icon: Gem, label: 'เพชร' },
  Sparkles: { icon: Sparkles, label: 'ประกาย' },
};

export function getIconComponent(name: string): LucideIcon | null {
  return ICON_MAP[name]?.icon || null;
}

export function RenderIcon({ name, className }: { name: string; className?: string }) {
  const entry = ICON_MAP[name];
  if (!entry) return <span className={className}>{name}</span>;
  const Icon = entry.icon;
  return <Icon className={className} />;
}

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = Object.entries(ICON_MAP).filter(([key, val]) =>
    key.toLowerCase().includes(search.toLowerCase()) || val.label.includes(search)
  );

  const selectedEntry = value ? ICON_MAP[value] : null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 border rounded-lg px-3 py-2 hover:bg-gray-50 text-left"
      >
        {selectedEntry ? (
          <selectedEntry.icon className="w-5 h-5 text-orange-500" />
        ) : (
          <span className="w-5 h-5 bg-gray-200 rounded" />
        )}
        <span className="flex-1 text-sm text-gray-700">{value ? selectedEntry?.label || value : 'เลือกไอคอน...'}</span>
        {value && (
          <span
            onClick={e => { e.stopPropagation(); onChange(''); }}
            className="text-gray-400 hover:text-red-500 text-xs"
          >✕</span>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-72 bg-white border rounded-lg shadow-xl max-h-64 overflow-hidden">
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="ค้นหาไอคอน..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-48 p-2 grid grid-cols-6 gap-1">
            {filtered.map(([key, { icon: Icon, label }]) => (
              <button
                key={key}
                type="button"
                title={label}
                onClick={() => { onChange(key); setOpen(false); setSearch(''); }}
                className={`w-10 h-10 flex items-center justify-center rounded hover:bg-orange-50 transition ${value === key ? 'bg-orange-100 ring-2 ring-orange-400' : ''}`}
              >
                <Icon className="w-5 h-5 text-gray-700" />
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-6 text-center text-sm text-gray-400 py-4">ไม่พบไอคอน</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
