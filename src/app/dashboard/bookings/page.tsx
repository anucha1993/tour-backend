'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, RefreshCw, ChevronLeft, ChevronRight,
  FileText, Zap, Globe, Clock, CheckCircle2,
  XCircle, CreditCard, Package, AlertCircle,
  Eye, ChevronDown, Plus, Edit3, Users, MapPin,
  Minus, X, Loader2,
} from 'lucide-react';
import { bookingsApi, AdminBooking, BookingStatistics, toursApi, Tour } from '@/lib/api';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending: { label: 'รอดำเนินการ', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Clock },
  confirmed: { label: 'ยืนยันแล้ว', color: 'text-blue-700', bg: 'bg-blue-100', icon: CheckCircle2 },
  paid: { label: 'ชำระเงินแล้ว', color: 'text-green-700', bg: 'bg-green-100', icon: CreditCard },
  cancelled: { label: 'ยกเลิก', color: 'text-red-700', bg: 'bg-red-100', icon: XCircle },
  completed: { label: 'เสร็จสมบูรณ์', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: Package },
};

const SOURCE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  website: { label: 'เว็บไซต์', icon: Globe, color: 'text-blue-600' },
  flash_sale: { label: 'Flash Sale', icon: Zap, color: 'text-red-500' },
  manual: { label: 'Manual', icon: FileText, color: 'text-purple-600' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const cfg = SOURCE_CONFIG[source] || SOURCE_CONFIG.website;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─── Booking Detail Modal ───
function BookingDetailModal({ booking, onClose, onStatusUpdate, onEdit }: {
  booking: AdminBooking;
  onClose: () => void;
  onStatusUpdate: (id: number, status: string, note?: string) => Promise<void>;
  onEdit: () => void;
}) {
  const [newStatus, setNewStatus] = useState(booking.status);
  const [adminNote, setAdminNote] = useState(booking.admin_note || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusDropdown, setStatusDropdown] = useState(false);

  const handleUpdate = async () => {
    if (newStatus === booking.status && adminNote === (booking.admin_note || '')) return;
    setIsUpdating(true);
    await onStatusUpdate(booking.id, newStatus, adminNote || undefined);
    setIsUpdating(false);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatDateTime = (d: string) => new Date(d).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-800">รายละเอียดใบจอง</h2>
            <p className="text-sm text-gray-500 font-mono">{booking.booking_code}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer">
              <Edit3 className="w-4 h-4" />
              แก้ไข
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Status + Source */}
          <div className="flex items-center gap-3">
            <StatusBadge status={booking.status} />
            <SourceBadge source={booking.source} />
            <span className="text-xs text-gray-400 ml-auto">{formatDateTime(booking.created_at)}</span>
          </div>

          {/* Tour info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-2">ข้อมูลทัวร์</h3>
            <p className="text-sm font-semibold">{booking.tour?.title || '-'}</p>
            <div className="flex gap-4 mt-1 text-xs text-gray-500">
              <span>รหัส: {booking.tour?.tour_code}</span>
              {booking.period && (
                <span>เดินทาง: {formatDate(booking.period.start_date)} - {formatDate(booking.period.end_date)}</span>
              )}
            </div>
            {booking.flash_sale_item && (
              <div className="mt-2 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs text-red-600 font-semibold">
                  Flash Sale: ฿{Number(booking.flash_sale_item.flash_price).toLocaleString()} (-{booking.flash_sale_item.discount_percent}%)
                </span>
                {booking.flash_sale_item.flash_sale && (
                  <span className="text-xs text-gray-400">({booking.flash_sale_item.flash_sale.title})</span>
                )}
              </div>
            )}
          </div>

          {/* Customer info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-2">ข้อมูลลูกค้า</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">ชื่อ:</span> {booking.first_name} {booking.last_name}</div>
              <div><span className="text-gray-500">โทร:</span> {booking.phone}</div>
              <div><span className="text-gray-500">อีเมล:</span> {booking.email}</div>
              {booking.member && (
                <div><span className="text-gray-500">สมาชิก ID:</span> #{booking.member.id}</div>
              )}
            </div>
          </div>

          {/* Quantities & Pricing */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-2">จำนวน & ราคา</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">ผู้ใหญ่:</span> {booking.qty_adult} ท่าน × ฿{Number(booking.price_adult).toLocaleString()}</div>
              {booking.qty_adult_single > 0 && (
                <div><span className="text-gray-500">พักเดี่ยว:</span> {booking.qty_adult_single} ท่าน</div>
              )}
              {booking.qty_child_bed > 0 && (
                <div><span className="text-gray-500">เด็ก (เตียง):</span> {booking.qty_child_bed} ท่าน × ฿{Number(booking.price_child_bed).toLocaleString()}</div>
              )}
              {booking.qty_child_nobed > 0 && (
                <div><span className="text-gray-500">เด็ก (ไม่มีเตียง):</span> {booking.qty_child_nobed} ท่าน × ฿{Number(booking.price_child_nobed).toLocaleString()}</div>
              )}
              {(booking.qty_infant || 0) > 0 && (
                <div><span className="text-gray-500">ทารก:</span> {booking.qty_infant} ท่าน × ฿{Number(booking.price_infant || 0).toLocaleString()}</div>
              )}
            </div>
            {/* Room types */}
            {((booking.qty_triple || 0) > 0 || (booking.qty_twin || 0) > 0 || (booking.qty_double || 0) > 0) && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-500 font-medium">ห้องพัก:</span>
                <div className="flex gap-3 mt-1 text-sm text-gray-600">
                  {(booking.qty_triple || 0) > 0 && <span>Triple: {booking.qty_triple}</span>}
                  {(booking.qty_twin || 0) > 0 && <span>Twin: {booking.qty_twin}</span>}
                  {(booking.qty_double || 0) > 0 && <span>Double: {booking.qty_double}</span>}
                </div>
              </div>
            )}
            <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-700">ยอดรวม</span>
              <span className="text-lg font-bold text-red-500">฿{Number(booking.total_amount).toLocaleString()}</span>
            </div>
          </div>

          {/* Extras */}
          {(booking.sale_code || booking.special_request) && (
            <div className="bg-gray-50 rounded-xl p-4 text-sm">
              {booking.sale_code && <p><span className="text-gray-500">Sale Code:</span> {booking.sale_code}</p>}
              {booking.special_request && <p className="mt-1"><span className="text-gray-500">คำขอพิเศษ:</span> {booking.special_request}</p>}
            </div>
          )}

          {/* Status update */}
          <div className="border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">อัปเดตสถานะ</h3>
            <div className="relative mb-3">
              <button
                onClick={() => setStatusDropdown(!statusDropdown)}
                className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm flex items-center justify-between cursor-pointer ${STATUS_CONFIG[newStatus]?.color || ''}`}
              >
                <span className="flex items-center gap-2">
                  {(() => { const Icon = STATUS_CONFIG[newStatus]?.icon || Clock; return <Icon className="w-4 h-4" />; })()}
                  {STATUS_CONFIG[newStatus]?.label || newStatus}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {statusDropdown && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setStatusDropdown(false)} />
                  <ul className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                      const Icon = cfg.icon;
                      return (
                        <li key={key}>
                          <button
                            onClick={() => { setNewStatus(key as AdminBooking['status']); setStatusDropdown(false); }}
                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 cursor-pointer ${key === newStatus ? 'bg-gray-50 font-semibold' : ''} ${cfg.color}`}
                          >
                            <Icon className="w-4 h-4" />{cfg.label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
            <textarea
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              placeholder="หมายเหตุแอดมิน..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 resize-none"
            />
            <button
              onClick={handleUpdate}
              disabled={isUpdating || (newStatus === booking.status && adminNote === (booking.admin_note || ''))}
              className="mt-2 w-full py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              {isUpdating ? 'กำลังอัปเดต...' : 'อัปเดตสถานะ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create Booking Modal ───
function CreateBookingModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState<'tour' | 'form'>('tour');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Tour[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [qtyAdult, setQtyAdult] = useState(1);
  const [qtyAdultSingle, setQtyAdultSingle] = useState(0);
  const [qtyChildBed, setQtyChildBed] = useState(0);
  const [qtyChildNoBed, setQtyChildNoBed] = useState(0);
  const [qtyInfant, setQtyInfant] = useState(0);
  const [qtyTriple, setQtyTriple] = useState(0);
  const [qtyTwin, setQtyTwin] = useState(0);
  const [qtyDouble, setQtyDouble] = useState(0);
  const [priceAdult, setPriceAdult] = useState(0);
  const [priceSingle, setPriceSingle] = useState(0);
  const [priceChildBed, setPriceChildBed] = useState(0);
  const [priceChildNoBed, setPriceChildNoBed] = useState(0);
  const [priceInfant, setPriceInfant] = useState(0);
  const [saleCode, setSaleCode] = useState('');
  const [specialRequest, setSpecialRequest] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [status, setStatus] = useState('pending');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Calculate total - single room adults pay priceAdult + priceSingle (supplement)
  const totalAdultRegular = qtyAdult * priceAdult;
  const totalAdultSingle = qtyAdultSingle * (priceAdult + priceSingle); // Adult price + single supplement
  const totalAmount = totalAdultRegular + totalAdultSingle + (qtyChildBed * priceChildBed) + (qtyChildNoBed * priceChildNoBed) + (qtyInfant * priceInfant);

  // Calculate total passengers and rooms for validation
  // 1 person can use max 1 room (TWIN/DOUBLE fits 1-2, TRIPLE fits 1-3, SINGLE fits 1)
  const totalPassengers = qtyAdult + qtyAdultSingle + qtyChildBed + qtyChildNoBed;
  const totalRooms = qtyTriple + qtyTwin + qtyDouble + qtyAdultSingle;
  const isRoomOverCount = totalRooms > totalPassengers;

  // Auto search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await toursApi.list({ search: searchQuery, per_page: '10', with_periods: 'true' });
        const tours = (res as unknown as { data: Tour[] }).data || [];
        setSearchResults(tours);
      } catch (err) {
        console.error('Tour search error:', err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Select tour and set default prices from first period offer
  const handleSelectTour = (tour: Tour) => {
    setSelectedTour(tour);
    if (tour.periods && tour.periods.length > 0) {
      const period = tour.periods[0];
      setSelectedPeriodId(period.id);
      if (period.offer) {
        const offer = period.offer;
        // Use net_price if available, otherwise calculate from price - discount
        setPriceAdult(offer.net_price_adult ?? (Number(offer.price_adult || 0) - Number(offer.discount_adult || 0)));
        setPriceSingle(offer.net_price_single ?? (Number(offer.price_single || 0) - Number(offer.discount_single || 0)));
        setPriceChildBed(Number(offer.price_child || 0) - Number(offer.discount_child_bed || 0));
        setPriceChildNoBed(Number(offer.price_child_nobed || 0) - Number(offer.discount_child_nobed || 0));
        setPriceInfant(Number(offer.price_infant || 0));
      }
    }
    setStep('form');
  };

  // Submit
  const handleSubmit = async () => {
    if (!selectedTour || !selectedPeriodId) return;
    if (!firstName || !lastName || !email || !phone) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    // Validate total rooms doesn't exceed passengers
    if (isRoomOverCount) {
      setError(`จำนวนห้องพักเกินจำนวนผู้เดินทาง (${totalRooms} ห้อง / ${totalPassengers} คน)`);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await bookingsApi.create({
        tour_id: selectedTour.id,
        period_id: selectedPeriodId,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        qty_adult: qtyAdult,
        qty_adult_single: qtyAdultSingle,
        qty_child_bed: qtyChildBed,
        qty_child_nobed: qtyChildNoBed,
        qty_infant: qtyInfant,
        qty_triple: qtyTriple,
        qty_twin: qtyTwin,
        qty_double: qtyDouble,
        price_adult: priceAdult,
        price_single: priceSingle,
        price_child_bed: priceChildBed,
        price_child_nobed: priceChildNoBed,
        price_infant: priceInfant,
        total_amount: totalAmount,
        sale_code: saleCode || undefined,
        special_request: specialRequest || undefined,
        admin_note: adminNote || undefined,
        status,
      });
      onCreated();
    } catch (err) {
      setError((err as Error).message || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });

  // Compact Stepper
  const Stepper = ({ value, onChange, min = 0, max = 99 }: {
    value: number; onChange: (v: number) => void; min?: number; max?: number;
  }) => (
    <div className="flex items-center gap-0.5">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
        className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-7 text-center font-bold text-sm tabular-nums">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
        className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );

  // Person icon
  const PersonIcon = () => (
    <svg viewBox="0 0 20 32" className="w-3 h-5 flex-shrink-0 fill-blue-500">
      <circle cx="10" cy="6.5" r="5.5" />
      <path d="M10 14C4 14 0 17.5 0 21.5V26c0 1.5 1 3 3 3h14c2 0 3-1.5 3-3v-4.5C20 17.5 16 14 10 14z" />
    </svg>
  );

  // Room icon
  const RoomIcon = ({ count }: { count: number }) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0 fill-blue-500">
          <path d="M7 14c1.66 0 3-1.34 3-3S8.66 8 7 8s-3 1.34-3 3 1.34 3 3 3zm0-4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm12-3h-8v8H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4zm2 8h-8V9h6c1.1 0 2 .9 2 2v4z"/>
        </svg>
      ))}
    </div>
  );

  // Passenger rows config
  const passengerRows = [
    { label: 'ผู้ใหญ่', qty: qtyAdult, setQty: setQtyAdult, price: priceAdult, setPrice: setPriceAdult, min: 1 },
    { label: 'เด็ก (เตียง)', qty: qtyChildBed, setQty: setQtyChildBed, price: priceChildBed, setPrice: setPriceChildBed, min: 0 },
    { label: 'เด็ก (ไม่มีเตียง)', qty: qtyChildNoBed, setQty: setQtyChildNoBed, price: priceChildNoBed, setPrice: setPriceChildNoBed, min: 0 },
    { label: 'ทารก', qty: qtyInfant, setQty: setQtyInfant, price: priceInfant, setPrice: setPriceInfant, min: 0 },
  ];

  // Room rows config - Single has supplement price
  const roomRows = [
    { label: 'Triple (3 ท่าน)', qty: qtyTriple, setQty: setQtyTriple, iconCount: 3, unitPrice: 0 },
    { label: 'Twin (2 ท่าน)', qty: qtyTwin, setQty: setQtyTwin, iconCount: 2, unitPrice: 0 },
    { label: 'Double (2 ท่าน)', qty: qtyDouble, setQty: setQtyDouble, iconCount: 1, unitPrice: 0 },
    { label: 'Single (1 ท่าน)', qty: qtyAdultSingle, setQty: setQtyAdultSingle, iconCount: 1, unitPrice: priceSingle },
  ];

  // Get selected period
  const selectedPeriod = selectedTour?.periods?.find(p => p.id === selectedPeriodId);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-4 px-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      
      <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-[1000px] mx-auto flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* ===== Header ===== */}
        <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 rounded-t-xl px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-sm sm:text-base truncate">
              {step === 'tour' ? 'สร้างใบจอง - เลือกทัวร์' : `สร้างใบจอง - ${selectedTour?.title}`}
            </h2>
            {step === 'form' && selectedTour && (
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-blue-100 text-xs font-mono">{selectedTour.tour_code}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition cursor-pointer flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ===== Tour & Period Info (when form step) ===== */}
        {step === 'form' && selectedTour && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs flex flex-wrap items-center gap-3">
            <button onClick={() => setStep('tour')} className="text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer">
              ← เปลี่ยนทัวร์
            </button>
            <span className="text-gray-300">|</span>
            <span><span className="text-gray-500">รหัสทัวร์:</span> <span className="font-semibold">{selectedTour.tour_code}</span></span>
            {selectedPeriod && (
              <span><span className="text-gray-500">วันเดินทาง:</span> <span className="font-semibold">{formatDate(selectedPeriod.start_date)} - {formatDate(selectedPeriod.end_date)}</span></span>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {step === 'tour' && (
            <div className="p-4 space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="พิมพ์ค้นหาทัวร์ (ชื่อ, รหัส)..."
                  className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400"
                  autoFocus
                />
                {searching ? (
                  <RefreshCw className="w-4 h-4 text-blue-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                ) : (
                  <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {searchResults.map(tour => (
                  <div key={tour.id} className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 cursor-pointer transition" onClick={() => handleSelectTour(tour)}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 truncate">{tour.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{tour.tour_code} • {tour.duration_days}D{tour.duration_nights}N</div>
                        {tour.periods && tour.periods.length > 0 && (
                          <div className="text-xs text-blue-600 mt-1">{tour.periods.length} รอบเดินทาง</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {!searchQuery && !searching && (
                  <div className="text-center py-8 text-gray-400">พิมพ์เพื่อค้นหาทัวร์...</div>
                )}
                {searchResults.length === 0 && searchQuery && !searching && (
                  <div className="text-center py-8 text-gray-400">ไม่พบทัวร์ &quot;{searchQuery}&quot;</div>
                )}
              </div>
            </div>
          )}

          {step === 'form' && selectedTour && (
            <>
              {/* Period selector */}
              <div className="px-4 py-3 border-b border-gray-200">
                <label className="text-xs font-medium text-gray-700 mb-1 block">รอบเดินทาง</label>
                <select
                  value={selectedPeriodId || ''}
                  onChange={e => {
                    const pid = Number(e.target.value);
                    setSelectedPeriodId(pid);
                    const period = selectedTour.periods?.find(p => p.id === pid);
                    if (period?.offer) {
                      const offer = period.offer;
                      setPriceAdult(offer.net_price_adult ?? (Number(offer.price_adult || 0) - Number(offer.discount_adult || 0)));
                      setPriceSingle(offer.net_price_single ?? (Number(offer.price_single || 0) - Number(offer.discount_single || 0)));
                      setPriceChildBed(Number(offer.price_child || 0) - Number(offer.discount_child_bed || 0));
                      setPriceChildNoBed(Number(offer.price_child_nobed || 0) - Number(offer.discount_child_nobed || 0));
                      setPriceInfant(Number(offer.price_infant || 0));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm cursor-pointer"
                >
                  {selectedTour.periods?.map(p => (
                    <option key={p.id} value={p.id}>
                      {formatDate(p.start_date)} - {formatDate(p.end_date)} • ว่าง {p.available}/{p.capacity}
                    </option>
                  ))}
                </select>
              </div>

              {/* ===== Row 1: ผู้เดินทาง + ห้องพัก ===== */}
              <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-gray-200">
                
                {/* ===== LEFT: ผู้เดินทาง & ราคา ===== */}
                <div className="px-4 py-3 lg:border-r border-gray-200">
                  <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-500" />
                    ผู้เดินทาง & ราคา
                  </h3>

                  {/* Table header */}
                  <div className="grid grid-cols-[1fr_70px_90px] items-center bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-lg px-2.5 py-1.5">
                    <span className="text-white font-bold text-xs">ประเภท</span>
                    <span className="text-white font-bold text-xs text-center">จำนวน</span>
                    <span className="text-white font-bold text-xs text-right">ราคา/ท่าน</span>
                  </div>

                  {/* Passenger rows */}
                  <div className="border border-t-0 border-gray-200 rounded-b-lg divide-y divide-gray-100">
                    {passengerRows.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_70px_90px] items-center px-2.5 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <PersonIcon />
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-700">{row.label}</span>
                            <span className="text-[11px] text-blue-500">{row.price > 0 ? `${row.price.toLocaleString()} บาท` : '-'}</span>
                          </div>
                        </div>
                        <div className="flex justify-center">
                          <Stepper value={row.qty} onChange={row.setQty} min={row.min} />
                        </div>
                        <div className="flex justify-end">
                          <input
                            type="number"
                            min={0}
                            value={row.price}
                            onChange={e => row.setPrice(+e.target.value)}
                            className="w-20 px-1.5 py-1 border border-gray-200 rounded text-xs text-right focus:border-blue-400 outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Grand total */}
                  <div className="mt-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg px-3 py-2 flex items-center justify-between">
                    <span className="text-white font-medium text-sm">ยอดรวม</span>
                    <span className="text-white font-bold text-lg">฿{totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* ===== RIGHT: ห้องพัก ===== */}
                <div className="px-4 py-3 border-t lg:border-t-0">
                  <h3 className="text-sm font-bold text-gray-800 mb-2">ห้องพัก</h3>

                  {/* Room header */}
                  <div className="grid grid-cols-[1fr_80px] items-center bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-lg px-2.5 py-1.5">
                    <span className="text-white font-bold text-xs">ประเภทห้อง</span>
                    <span className="text-white font-bold text-xs text-center">จำนวนห้อง</span>
                  </div>

                  {/* Room rows */}
                  <div className="border border-t-0 border-gray-200 rounded-b-lg divide-y divide-gray-100">
                    {roomRows.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_80px] items-center px-2.5 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <RoomIcon count={row.iconCount} />
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-700">{row.label}</span>
                            {row.unitPrice > 0 ? (
                              <span className="text-[11px] text-orange-500">+{row.unitPrice.toLocaleString()} บาท/ห้อง</span>
                            ) : (
                              <span className="text-[11px] text-gray-400">ไม่มีค่าใช้จ่าย</span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-center">
                          <Stepper value={row.qty} onChange={row.setQty} min={0} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Room allocation info */}
                  <div className="mt-2 text-xs text-gray-500">
                    <p>เลือกห้องพัก: {totalRooms} ห้อง / ผู้เดินทาง {totalPassengers} คน</p>
                    {isRoomOverCount && (
                      <p className="text-red-500 font-medium">⚠️ ห้องพักเกินจำนวนผู้เดินทาง {totalRooms - totalPassengers} ห้อง</p>
                    )}
                    {qtyAdultSingle > 0 && priceSingle > 0 && (
                      <p className="text-orange-600 font-medium">ค่าพักเดี่ยว: +{(qtyAdultSingle * priceSingle).toLocaleString()} บาท</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ===== Row 2: ข้อมูลลูกค้า + สถานะ ===== */}
              <div className="grid grid-cols-1 lg:grid-cols-2">
                
                {/* ===== LEFT: ข้อมูลลูกค้า ===== */}
                <div className="px-4 py-3 lg:border-r border-gray-200">
                  <h3 className="text-sm font-bold text-gray-800 mb-2">ข้อมูลลูกค้า</h3>
                  
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-gray-700">ชื่อ <span className="text-red-500">*</span></label>
                        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                          className="mt-1 w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:border-blue-400 outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700">นามสกุล <span className="text-red-500">*</span></label>
                        <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                          className="mt-1 w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:border-blue-400 outline-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-gray-700">อีเมล <span className="text-red-500">*</span></label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                          className="mt-1 w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:border-blue-400 outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700">โทรศัพท์ <span className="text-red-500">*</span></label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                          className="mt-1 w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:border-blue-400 outline-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-gray-700">Sale Code</label>
                        <input type="text" value={saleCode} onChange={e => setSaleCode(e.target.value)}
                          className="mt-1 w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:border-blue-400 outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700">สถานะใบจอง</label>
                        <select
                          value={status}
                          onChange={e => setStatus(e.target.value)}
                          className="mt-1 w-full px-2.5 py-1.5 border border-gray-200 rounded text-sm cursor-pointer focus:border-blue-400 outline-none"
                        >
                          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">คำขอพิเศษ</label>
                      <textarea value={specialRequest} onChange={e => setSpecialRequest(e.target.value)} rows={2}
                        className="mt-1 w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:border-blue-400 outline-none resize-none" />
                    </div>
                  </div>
                </div>

                {/* ===== RIGHT: หมายเหตุแอดมิน ===== */}
                <div className="px-4 py-3 border-t lg:border-t-0">
                  <h3 className="text-sm font-bold text-gray-800 mb-2">หมายเหตุแอดมิน</h3>
                  <textarea
                    value={adminNote}
                    onChange={e => setAdminNote(e.target.value)}
                    rows={6}
                    placeholder="บันทึกข้อความสำหรับแอดมิน..."
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:border-blue-400 outline-none resize-none"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* ===== Footer ===== */}
        {step === 'form' && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl flex items-center justify-between">
            <div>
              {error && (
                <div className="flex items-center gap-1.5 text-red-500 text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />{error}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 cursor-pointer">
                ยกเลิก
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...</>
                ) : (
                  'สร้างใบจอง'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Edit Booking Modal (Website-style UI) ───
function EditBookingModal({ booking, onClose, onSaved }: { booking: AdminBooking; onClose: () => void; onSaved: () => void }) {
  // Form state
  const [firstName, setFirstName] = useState(booking.first_name);
  const [lastName, setLastName] = useState(booking.last_name);
  const [email, setEmail] = useState(booking.email);
  const [phone, setPhone] = useState(booking.phone);
  const [qtyAdult, setQtyAdult] = useState(booking.qty_adult);
  const [qtyAdultSingle, setQtyAdultSingle] = useState(booking.qty_adult_single);
  const [qtyChildBed, setQtyChildBed] = useState(booking.qty_child_bed);
  const [qtyChildNoBed, setQtyChildNoBed] = useState(booking.qty_child_nobed);
  const [qtyInfant, setQtyInfant] = useState(booking.qty_infant || 0);
  const [qtyTriple, setQtyTriple] = useState(booking.qty_triple || 0);
  const [qtyTwin, setQtyTwin] = useState(booking.qty_twin || 0);
  const [qtyDouble, setQtyDouble] = useState(booking.qty_double || 0);
  const [priceAdult, setPriceAdult] = useState(Number(booking.price_adult));
  const [priceSingle, setPriceSingle] = useState(Number(booking.price_single));
  const [priceChildBed, setPriceChildBed] = useState(Number(booking.price_child_bed));
  const [priceChildNoBed, setPriceChildNoBed] = useState(Number(booking.price_child_nobed));
  const [priceInfant, setPriceInfant] = useState(Number(booking.price_infant || 0));
  const [saleCode, setSaleCode] = useState(booking.sale_code || '');
  const [specialRequest, setSpecialRequest] = useState(booking.special_request || '');
  const [adminNote, setAdminNote] = useState(booking.admin_note || '');
  const [status, setStatus] = useState(booking.status);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [statusDropdown, setStatusDropdown] = useState(false);

  // Calculate total - single room adults pay priceAdult + priceSingle (supplement)
  const totalAdultRegular = qtyAdult * priceAdult;
  const totalAdultSingle = qtyAdultSingle * (priceAdult + priceSingle); // Adult price + single supplement
  const totalAmount = totalAdultRegular + totalAdultSingle + (qtyChildBed * priceChildBed) + (qtyChildNoBed * priceChildNoBed) + (qtyInfant * priceInfant);

  // Calculate total passengers and rooms for validation
  // 1 person can use max 1 room (TWIN/DOUBLE fits 1-2, TRIPLE fits 1-3, SINGLE fits 1)
  const totalPassengers = qtyAdult + qtyAdultSingle + qtyChildBed + qtyChildNoBed;
  const totalRooms = qtyTriple + qtyTwin + qtyDouble + qtyAdultSingle;
  const isRoomOverCount = totalRooms > totalPassengers;

  // Compact Stepper
  const Stepper = ({ value, onChange, min = 0, max = 99 }: {
    value: number; onChange: (v: number) => void; min?: number; max?: number;
  }) => (
    <div className="flex items-center gap-0.5">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
        className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-7 text-center font-bold text-sm tabular-nums">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
        className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );

  // Person icon
  const PersonIcon = () => (
    <svg viewBox="0 0 20 32" className="w-3 h-5 flex-shrink-0 fill-blue-500">
      <circle cx="10" cy="6.5" r="5.5" />
      <path d="M10 14C4 14 0 17.5 0 21.5V26c0 1.5 1 3 3 3h14c2 0 3-1.5 3-3v-4.5C20 17.5 16 14 10 14z" />
    </svg>
  );

  // Room icon
  const RoomIcon = ({ count }: { count: number }) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0 fill-blue-500">
          <path d="M7 14c1.66 0 3-1.34 3-3S8.66 8 7 8s-3 1.34-3 3 1.34 3 3 3zm0-4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm12-3h-8v8H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4zm2 8h-8V9h6c1.1 0 2 .9 2 2v4z"/>
        </svg>
      ))}
    </div>
  );

  const handleSubmit = async () => {
    if (!firstName || !lastName || !email || !phone) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    // Validate total rooms doesn't exceed passengers
    if (isRoomOverCount) {
      setError(`จำนวนห้องพักเกินจำนวนผู้เดินทาง (${totalRooms} ห้อง / ${totalPassengers} คน)`);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await bookingsApi.update(booking.id, {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        qty_adult: qtyAdult,
        qty_adult_single: qtyAdultSingle,
        qty_child_bed: qtyChildBed,
        qty_child_nobed: qtyChildNoBed,
        qty_infant: qtyInfant,
        qty_triple: qtyTriple,
        qty_twin: qtyTwin,
        qty_double: qtyDouble,
        price_adult: priceAdult,
        price_single: priceSingle,
        price_child_bed: priceChildBed,
        price_child_nobed: priceChildNoBed,
        price_infant: priceInfant,
        total_amount: totalAmount,
        sale_code: saleCode || undefined,
        special_request: specialRequest || undefined,
        admin_note: adminNote || undefined,
        status,
      });
      onSaved();
    } catch (err) {
      setError((err as Error).message || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });

  // Passenger rows config - show price under label
  const passengerRows = [
    { label: 'ผู้ใหญ่', qty: qtyAdult, setQty: setQtyAdult, price: priceAdult, setPrice: setPriceAdult, min: 1 },
    { label: 'เด็ก (เตียง)', qty: qtyChildBed, setQty: setQtyChildBed, price: priceChildBed, setPrice: setPriceChildBed, min: 0 },
    { label: 'เด็ก (ไม่มีเตียง)', qty: qtyChildNoBed, setQty: setQtyChildNoBed, price: priceChildNoBed, setPrice: setPriceChildNoBed, min: 0 },
    { label: 'ทารก', qty: qtyInfant, setQty: setQtyInfant, price: priceInfant, setPrice: setPriceInfant, min: 0 },
  ];

  // Room rows config - Single has supplement price
  const roomRows = [
    { label: 'Triple (3 ท่าน)', qty: qtyTriple, setQty: setQtyTriple, iconCount: 3, unitPrice: 0 },
    { label: 'Twin (2 ท่าน)', qty: qtyTwin, setQty: setQtyTwin, iconCount: 2, unitPrice: 0 },
    { label: 'Double (2 ท่าน)', qty: qtyDouble, setQty: setQtyDouble, iconCount: 1, unitPrice: 0 },
    { label: 'Single (1 ท่าน)', qty: qtyAdultSingle, setQty: setQtyAdultSingle, iconCount: 1, unitPrice: priceSingle },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-4 px-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      
      <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-[1000px] mx-auto flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* ===== Header ===== */}
        <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 rounded-t-xl px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-sm sm:text-base truncate">
              แก้ไขใบจอง - {booking.tour?.title || 'ไม่ระบุทัวร์'}
            </h2>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-blue-100 text-xs font-mono">{booking.booking_code}</span>
              <SourceBadge source={booking.source} />
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition cursor-pointer flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ===== Tour & Period Info ===== */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs flex flex-wrap items-center gap-3">
          <span><span className="text-gray-500">รหัสทัวร์:</span> <span className="font-semibold">{booking.tour?.tour_code || '-'}</span></span>
          {booking.period && (
            <span><span className="text-gray-500">วันเดินทาง:</span> <span className="font-semibold">{formatDate(booking.period.start_date)} - {formatDate(booking.period.end_date)}</span></span>
          )}
          {booking.flash_sale_item && (
            <span className="flex items-center gap-1 text-red-600"><Zap className="w-3 h-3" /> Flash Sale</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* ===== Row 1: ผู้เดินทาง + ห้องพัก ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-gray-200">
            
            {/* ===== LEFT: ผู้เดินทาง & ราคา ===== */}
            <div className="px-4 py-3 lg:border-r border-gray-200">
              <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-500" />
                ผู้เดินทาง & ราคา
              </h3>

              {/* Table header */}
              <div className="grid grid-cols-[1fr_70px_90px] items-center bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-lg px-2.5 py-1.5">
                <span className="text-white font-bold text-xs">ประเภท</span>
                <span className="text-white font-bold text-xs text-center">จำนวน</span>
                <span className="text-white font-bold text-xs text-right">ราคา/ท่าน</span>
              </div>

              {/* Passenger rows */}
              <div className="border border-t-0 border-gray-200 rounded-b-lg divide-y divide-gray-100">
                {passengerRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_70px_90px] items-center px-2.5 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <PersonIcon />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-700">{row.label}</span>
                        <span className="text-[11px] text-blue-500">{row.price > 0 ? `${row.price.toLocaleString()} บาท` : '-'}</span>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <Stepper value={row.qty} onChange={row.setQty} min={row.min} />
                    </div>
                    <div className="flex justify-end">
                      <input
                        type="number"
                        min={0}
                        value={row.price}
                        onChange={e => row.setPrice(+e.target.value)}
                        className="w-20 px-1.5 py-1 border border-gray-200 rounded text-xs text-right focus:border-blue-400 outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Grand total */}
              <div className="mt-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg px-3 py-2 flex items-center justify-between">
                <span className="text-white font-medium text-sm">ยอดรวม</span>
                <span className="text-white font-bold text-lg">฿{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* ===== RIGHT: ห้องพัก ===== */}
            <div className="px-4 py-3 border-t lg:border-t-0">
              <h3 className="text-sm font-bold text-gray-800 mb-2">ห้องพัก</h3>

              {/* Room header */}
              <div className="grid grid-cols-[1fr_80px] items-center bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-lg px-2.5 py-1.5">
                <span className="text-white font-bold text-xs">ประเภทห้อง</span>
                <span className="text-white font-bold text-xs text-center">จำนวนห้อง</span>
              </div>

              {/* Room rows */}
              <div className="border border-t-0 border-gray-200 rounded-b-lg divide-y divide-gray-100">
                {roomRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_80px] items-center px-2.5 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <RoomIcon count={row.iconCount} />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-700">{row.label}</span>
                        {row.unitPrice > 0 ? (
                          <span className="text-[11px] text-orange-500">+{row.unitPrice.toLocaleString()} บาท/ห้อง</span>
                        ) : (
                          <span className="text-[11px] text-gray-400">ไม่มีค่าใช้จ่าย</span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <Stepper value={row.qty} onChange={row.setQty} min={0} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Room allocation info */}
              <div className="mt-2 text-xs text-gray-500">
                <p>เลือกห้องพัก: {totalRooms} ห้อง / ผู้เดินทาง {totalPassengers} คน</p>
                {isRoomOverCount && (
                  <p className="text-red-500 font-medium">⚠️ ห้องพักเกินจำนวนผู้เดินทาง {totalRooms - totalPassengers} ห้อง</p>
                )}
                {qtyAdultSingle > 0 && priceSingle > 0 && (
                  <p className="text-orange-600 font-medium">ค่าพักเดี่ยว: +{(qtyAdultSingle * priceSingle).toLocaleString()} บาท</p>
                )}
              </div>
            </div>
          </div>

          {/* ===== Row 2: ข้อมูลลูกค้า + สถานะ ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-2">
            
            {/* ===== LEFT: ข้อมูลลูกค้า ===== */}
            <div className="px-4 py-3 lg:border-r border-gray-200">
              <h3 className="text-sm font-bold text-gray-800 mb-2">ข้อมูลลูกค้า</h3>
              
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-700">ชื่อ <span className="text-red-500">*</span></label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                      className="mt-1 w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:border-blue-400 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">นามสกุล <span className="text-red-500">*</span></label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                      className="mt-1 w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:border-blue-400 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-700">อีเมล <span className="text-red-500">*</span></label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      className="mt-1 w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:border-blue-400 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">โทรศัพท์ <span className="text-red-500">*</span></label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      className="mt-1 w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:border-blue-400 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Sale Code</label>
                    <input type="text" value={saleCode} onChange={e => setSaleCode(e.target.value)}
                      className="mt-1 w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:border-blue-400 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">สถานะใบจอง</label>
                    <div className="relative mt-1">
                      <button
                        type="button"
                        onClick={() => setStatusDropdown(!statusDropdown)}
                        className={`w-full px-2.5 py-1.5 border border-gray-200 rounded text-sm flex items-center justify-between cursor-pointer ${STATUS_CONFIG[status]?.color || ''} hover:border-blue-400`}
                      >
                        <span className="flex items-center gap-1.5">
                          {(() => { const Icon = STATUS_CONFIG[status]?.icon || Clock; return <Icon className="w-3.5 h-3.5" />; })()}
                          {STATUS_CONFIG[status]?.label || status}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${statusDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      {statusDropdown && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setStatusDropdown(false)} />
                          <ul className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-gray-200 rounded shadow-lg overflow-hidden">
                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                              const Icon = cfg.icon;
                              return (
                                <li key={key}>
                                  <button
                                    type="button"
                                    onClick={() => { setStatus(key as AdminBooking['status']); setStatusDropdown(false); }}
                                    className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-gray-50 cursor-pointer ${key === status ? 'bg-blue-50 font-semibold' : ''} ${cfg.color}`}
                                  >
                                    <Icon className="w-3.5 h-3.5" />{cfg.label}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">คำขอพิเศษ</label>
                  <textarea value={specialRequest} onChange={e => setSpecialRequest(e.target.value)} rows={2}
                    className="mt-1 w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:border-blue-400 outline-none resize-none" />
                </div>
              </div>
            </div>

            {/* ===== RIGHT: หมายเหตุแอดมิน ===== */}
            <div className="px-4 py-3 border-t lg:border-t-0">
              <h3 className="text-sm font-bold text-gray-800 mb-2">หมายเหตุแอดมิน</h3>
              <textarea
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                rows={6}
                placeholder="บันทึกข้อความสำหรับแอดมิน..."
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:border-blue-400 outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* ===== Footer ===== */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl flex items-center justify-between">
          <div>
            {error && (
              <div className="flex items-center gap-1.5 text-red-500 text-xs">
                <AlertCircle className="w-3.5 h-3.5" />{error}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 cursor-pointer">
              ยกเลิก
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...</>
              ) : (
                'บันทึก'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function BookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [stats, setStats] = useState<BookingStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<AdminBooking | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingsApi.list({
        search: search || undefined,
        status: statusFilter || undefined,
        source: sourceFilter || undefined,
        page,
        per_page: 20,
      });
      // Laravel paginator returns: { data: [...], current_page, last_page, total, ... }
      // apiRequest returns it as-is, so res maps to ApiResponse where res.data = AdminBooking[]
      // and pagination fields are at top level via `meta` or direct properties
      const raw = res as unknown as { data: AdminBooking[]; current_page: number; last_page: number; total: number };
      setBookings(raw.data || []);
      setTotalPages(raw.last_page || 1);
      setTotal(raw.total || 0);
    } catch (err) {
      console.error('Failed to fetch bookings', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sourceFilter, page]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await bookingsApi.statistics();
      // Laravel returns flat JSON: { total, pending, confirmed, ... }
      setStats(res as unknown as BookingStatistics);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleStatusUpdate = async (id: number, status: string, note?: string) => {
    try {
      await bookingsApi.updateStatus(id, { status, admin_note: note });
      fetchBookings();
      fetchStats();
      setSelectedBooking(null);
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
  const formatDateTime = (d: string) => new Date(d).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ใบจอง (Bookings)</h1>
          <p className="text-sm text-gray-500 mt-0.5">จัดการใบจองทัวร์จากเว็บไซต์และ Flash Sale</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 cursor-pointer">
            <Plus className="w-4 h-4" />
            สร้างใบจอง
          </button>
          <button onClick={() => { fetchBookings(); fetchStats(); }} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 cursor-pointer">
            <RefreshCw className="w-4 h-4" />
            รีเฟรช
          </button>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'ทั้งหมด', value: stats.total, color: 'bg-gray-100 text-gray-700' },
            { label: 'รอดำเนินการ', value: stats.pending, color: 'bg-yellow-100 text-yellow-700' },
            { label: 'ยืนยัน', value: stats.confirmed, color: 'bg-blue-100 text-blue-700' },
            { label: 'ชำระแล้ว', value: stats.paid, color: 'bg-green-100 text-green-700' },
            { label: 'ยกเลิก', value: stats.cancelled, color: 'bg-red-100 text-red-700' },
            { label: 'เสร็จ', value: stats.completed, color: 'bg-emerald-100 text-emerald-700' },
            { label: 'เว็บไซต์', value: stats.from_website, color: 'bg-blue-50 text-blue-600' },
            { label: 'Flash Sale', value: stats.from_flash_sale, color: 'bg-red-50 text-red-600' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-xl px-3 py-2.5 text-center`}>
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-[11px] font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="ค้นหา รหัสจอง, ชื่อ, โทร, อีเมล..."
            className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none cursor-pointer"
        >
          <option value="">ทุกสถานะ</option>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        <select
          value={sourceFilter}
          onChange={e => { setSourceFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none cursor-pointer"
        >
          <option value="">ทุกช่องทาง</option>
          <option value="website">เว็บไซต์</option>
          <option value="flash_sale">Flash Sale</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            กำลังโหลด...
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            ไม่พบใบจอง
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">รหัสจอง</th>
                  <th className="px-4 py-3 text-left">ลูกค้า</th>
                  <th className="px-4 py-3 text-left">ทัวร์</th>
                  <th className="px-4 py-3 text-center">จำนวน</th>
                  <th className="px-4 py-3 text-right">ยอดรวม</th>
                  <th className="px-4 py-3 text-center">ช่องทาง</th>
                  <th className="px-4 py-3 text-center">สถานะ</th>
                  <th className="px-4 py-3 text-center">วันจอง</th>
                  <th className="px-4 py-3 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-blue-600">{b.booking_code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{b.first_name} {b.last_name}</div>
                      <div className="text-xs text-gray-400">{b.phone}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="font-medium text-gray-700 truncate">{b.tour?.title || '-'}</div>
                      <div className="text-xs text-gray-400">{b.tour?.tour_code} {b.period ? `• ${formatDate(b.period.start_date)}` : ''}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-gray-700">{b.qty_adult + b.qty_child_bed + b.qty_child_nobed}</span>
                      <span className="text-gray-400 text-xs"> ท่าน</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">
                      ฿{Number(b.total_amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <SourceBadge source={b.source} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-400 whitespace-nowrap">
                      {formatDateTime(b.created_at)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                        title="ดูรายละเอียด"
                      >
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              ทั้งหมด {total} รายการ • หน้า {page}/{totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onStatusUpdate={handleStatusUpdate}
          onEdit={() => {
            setEditingBooking(selectedBooking);
            setSelectedBooking(null);
          }}
        />
      )}

      {/* Create Booking Modal */}
      {showCreateModal && (
        <CreateBookingModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchBookings();
            fetchStats();
          }}
        />
      )}

      {/* Edit Booking Modal */}
      {editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          onClose={() => setEditingBooking(null)}
          onSaved={() => {
            setEditingBooking(null);
            fetchBookings();
          }}
        />
      )}
    </div>
  );
}
