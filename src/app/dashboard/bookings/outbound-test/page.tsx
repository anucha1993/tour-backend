'use client';

/**
 * Outbound Booking Test Page
 *
 * แอดมินใช้หน้านี้ทดสอบ booking flow (quote → hold → confirm → cancel)
 * โดยไม่ต้องเปิด customer-facing flow
 */

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/Card';
import { Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

interface BookingPassengerForm {
  type: 'adult' | 'child' | 'infant';
  title: string;
  first_name: string;
  last_name: string;
  dob?: string;
  passport_no?: string;
  nationality?: string;
  passport_expiry?: string;
  is_lead?: boolean;
}

interface BookingResponse {
  id: number;
  booking_code: string;
  status: string;
  provider: string | null;
  provider_status: string | null;
  provider_quote_ref: string | null;
  provider_booking_ref: string | null;
  hold_expires_at: string | null;
  total_amount: string | number | null;
  currency: string | null;
  admin_note: string | null;
  provider_payload?: Record<string, unknown> | null;
  passengers?: unknown[];
}

const emptyPassenger = (type: BookingPassengerForm['type'] = 'adult'): BookingPassengerForm => ({
  type,
  title: 'Mr',
  first_name: '',
  last_name: '',
  passport_no: '',
  nationality: 'TH',
});

export default function OutboundBookingTestPage() {
  // Inputs for quote step
  const [periodId, setPeriodId] = useState<number | ''>('');
  const [qtyAdult, setQtyAdult] = useState(1);
  const [qtyAdultSingle, setQtyAdultSingle] = useState(0);
  const [qtyChildBed, setQtyChildBed] = useState(0);
  const [qtyChildNoBed, setQtyChildNoBed] = useState(0);
  const [qtyInfant, setQtyInfant] = useState(0);

  // Customer info
  const [customerFirstName, setCustomerFirstName] = useState('Test');
  const [customerLastName, setCustomerLastName] = useState('User');
  const [customerEmail, setCustomerEmail] = useState('test@nexttrip.asia');
  const [customerPhone, setCustomerPhone] = useState('0812345678');

  // Booking state
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [passengers, setPassengers] = useState<BookingPassengerForm[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'quote' | 'hold' | 'confirm' | 'done'>('quote');

  const totalPax = qtyAdult + qtyAdultSingle + qtyChildBed + qtyChildNoBed + qtyInfant;

  const buildPassengerSlots = () => {
    const slots: BookingPassengerForm[] = [];
    for (let i = 0; i < qtyAdult + qtyAdultSingle; i++) slots.push(emptyPassenger('adult'));
    for (let i = 0; i < qtyChildBed + qtyChildNoBed; i++) slots.push(emptyPassenger('child'));
    for (let i = 0; i < qtyInfant; i++) slots.push(emptyPassenger('infant'));
    if (slots.length > 0) {
      slots[0].is_lead = true;
      slots[0].first_name = customerFirstName;
      slots[0].last_name = customerLastName;
    }
    return slots;
  };

  const handleQuote = async () => {
    setError('');
    setLoading(true);
    try {
      const payload = {
        period_id: Number(periodId),
        pax: {
          adult: qtyAdult,
          adult_single: qtyAdultSingle,
          child_bed: qtyChildBed,
          child_nobed: qtyChildNoBed,
          infant: qtyInfant,
        },
        customer: {
          first_name: customerFirstName,
          last_name: customerLastName,
          email: customerEmail,
          phone: customerPhone,
        },
      };
      const res = await apiClient.post<BookingResponse>('/bookings/outbound/quote', payload);
      // Laravel returns raw booking object on success — wrapped client sometimes preserves it
      const data = (res as unknown as BookingResponse).id
        ? (res as unknown as BookingResponse)
        : res.data;
      if (!data || !('id' in data)) {
        setError(res.message || 'Quote failed');
        return;
      }
      setBooking(data);
      setPassengers(buildPassengerSlots());
      setStep('hold');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Quote failed');
    } finally {
      setLoading(false);
    }
  };

  const handleHold = async () => {
    if (!booking) return;
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post<BookingResponse>(`/bookings/outbound/${booking.id}/hold`, {
        passengers: passengers.map((p) => ({
          type: p.type,
          title: p.title,
          first_name: p.first_name,
          last_name: p.last_name,
          dob: p.dob || null,
          passport_no: p.passport_no || null,
          nationality: p.nationality || null,
          passport_expiry: p.passport_expiry || null,
          is_lead: !!p.is_lead,
        })),
      });
      const data = (res as unknown as BookingResponse).id
        ? (res as unknown as BookingResponse)
        : res.data;
      if (!data || !('id' in data)) {
        setError(res.message || 'Hold failed');
        return;
      }
      setBooking(data);
      setStep('confirm');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hold failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!booking) return;
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post<BookingResponse>(`/bookings/outbound/${booking.id}/confirm`, {});
      const data = (res as unknown as BookingResponse).id
        ? (res as unknown as BookingResponse)
        : res.data;
      if (!data || !('id' in data)) {
        setError(res.message || 'Confirm failed');
        return;
      }
      setBooking(data);
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Confirm failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    if (!confirm('ยกเลิก booking นี้ใช่หรือไม่?')) return;
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post<BookingResponse>(`/bookings/outbound/${booking.id}/cancel`, {
        reason: 'Admin test cancellation',
      });
      const data = (res as unknown as BookingResponse).id
        ? (res as unknown as BookingResponse)
        : res.data;
      if (!data || !('id' in data)) {
        setError(res.message || 'Cancel failed');
        return;
      }
      setBooking(data);
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cancel failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setBooking(null);
    setPassengers([]);
    setError('');
    setStep('quote');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Outbound Booking Test</h1>
        <p className="text-sm text-gray-500 mt-1">
          ทดสอบ booking flow (quote → hold → confirm) กับ provider จริงผ่าน Integration Settings
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 text-sm">
        {(['quote', 'hold', 'confirm', 'done'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
                step === s
                  ? 'bg-orange-500 text-white'
                  : (['quote', 'hold', 'confirm', 'done'] as const).indexOf(step) > i
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {i + 1}
            </div>
            <span className={step === s ? 'font-semibold' : 'text-gray-500'}>{s.toUpperCase()}</span>
            {i < 3 && <span className="text-gray-300 mx-1">→</span>}
          </div>
        ))}
        <button
          onClick={handleReset}
          className="ml-auto inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
        >
          <RefreshCw className="w-3 h-3" /> Reset
        </button>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">{error}</div>
        </Card>
      )}

      {/* STEP 1: Quote */}
      {step === 'quote' && (
        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold">1. Quote</h2>
          <p className="text-xs text-gray-500">
            ใส่ <code className="bg-gray-100 px-1 rounded">period_id</code> ของ period ที่ทัวร์มี wholesaler และเปิด Booking ไว้แล้ว
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="col-span-2 sm:col-span-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Period ID</label>
              <input
                type="number"
                value={periodId}
                onChange={(e) => setPeriodId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="e.g. 1234"
              />
            </div>

            {[
              ['Adult', qtyAdult, setQtyAdult],
              ['Adult Single', qtyAdultSingle, setQtyAdultSingle],
              ['Child (with bed)', qtyChildBed, setQtyChildBed],
              ['Child (no bed)', qtyChildNoBed, setQtyChildNoBed],
              ['Infant', qtyInfant, setQtyInfant],
            ].map(([label, val, set]) => (
              <div key={label as string}>
                <label className="block text-xs font-medium text-gray-700 mb-1">{label as string}</label>
                <input
                  type="number"
                  min={0}
                  value={val as number}
                  onChange={(e) => (set as (n: number) => void)(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">First name</label>
              <input
                value={customerFirstName}
                onChange={(e) => setCustomerFirstName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Last name</label>
              <input
                value={customerLastName}
                onChange={(e) => setCustomerLastName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="text-xs text-gray-600">รวมผู้เดินทาง: {totalPax} คน</div>

          <button
            onClick={handleQuote}
            disabled={loading || !periodId || totalPax === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Request Quote
          </button>
        </Card>
      )}

      {/* Booking summary shown after quote */}
      {booking && (
        <Card className="p-4 sm:p-6 space-y-2 bg-blue-50/40">
          <h2 className="text-base font-semibold">Booking #{booking.booking_code} (id={booking.id})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <Field label="Status" value={booking.status} />
            <Field label="Provider Status" value={booking.provider_status || '-'} />
            <Field label="Provider" value={booking.provider || '-'} />
            <Field label="Currency" value={booking.currency || 'THB'} />
            <Field label="Quote Ref" value={booking.provider_quote_ref || '-'} />
            <Field label="Booking Ref" value={booking.provider_booking_ref || '-'} />
            <Field label="Hold Expires" value={booking.hold_expires_at ? new Date(booking.hold_expires_at).toLocaleString('th-TH') : '-'} />
            <Field label="Amount" value={booking.total_amount ? `฿${Number(booking.total_amount).toLocaleString()}` : '-'} />
          </div>
          {booking.admin_note && (
            <div className="text-xs text-red-600 pt-2 border-t">{booking.admin_note}</div>
          )}
          {booking.provider_payload && (
            <details className="text-xs pt-2">
              <summary className="cursor-pointer text-gray-600">Provider payload (raw)</summary>
              <pre className="mt-2 bg-white p-2 rounded text-[10px] overflow-x-auto max-h-64">
                {JSON.stringify(booking.provider_payload, null, 2)}
              </pre>
            </details>
          )}
        </Card>
      )}

      {/* STEP 2: Hold (Passengers) */}
      {step === 'hold' && booking && (
        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold">2. Hold — กรอกข้อมูลผู้เดินทาง</h2>
          {passengers.map((p, idx) => (
            <div key={idx} className="border rounded-lg p-3 space-y-2 bg-white">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">
                  Pax #{idx + 1} ({p.type}) {p.is_lead && <span className="text-orange-600">(lead)</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-gray-600">คำนำหน้า <span className="text-red-500">*</span></span>
                  <select
                    value={p.title}
                    onChange={(e) => updatePassenger(passengers, setPassengers, idx, { title: e.target.value })}
                    className="px-2 py-1.5 border rounded text-xs"
                  >
                    <option>Mr</option>
                    <option>Mrs</option>
                    <option>Ms</option>
                    <option>Mstr</option>
                    <option>Miss</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-gray-600">ชื่อ (EN) <span className="text-red-500">*</span></span>
                  <input
                    placeholder="เช่น Test"
                    value={p.first_name}
                    onChange={(e) => updatePassenger(passengers, setPassengers, idx, { first_name: e.target.value })}
                    className="px-2 py-1.5 border rounded text-xs"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-gray-600">นามสกุล (EN) <span className="text-red-500">*</span></span>
                  <input
                    placeholder="เช่น User"
                    value={p.last_name}
                    onChange={(e) => updatePassenger(passengers, setPassengers, idx, { last_name: e.target.value })}
                    className="px-2 py-1.5 border rounded text-xs"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-gray-600">เลขพาสปอร์ต</span>
                  <input
                    placeholder="เช่น AA1234567"
                    value={p.passport_no || ''}
                    onChange={(e) => updatePassenger(passengers, setPassengers, idx, { passport_no: e.target.value })}
                    className="px-2 py-1.5 border rounded text-xs"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-gray-600">สัญชาติ (ISO 2 ตัว)</span>
                  <input
                    placeholder="TH"
                    maxLength={2}
                    value={p.nationality || ''}
                    onChange={(e) => updatePassenger(passengers, setPassengers, idx, { nationality: e.target.value.toUpperCase() })}
                    className="px-2 py-1.5 border rounded text-xs uppercase"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-gray-600">วันเกิด (DOB)</span>
                  <input
                    type="date"
                    value={p.dob || ''}
                    onChange={(e) => updatePassenger(passengers, setPassengers, idx, { dob: e.target.value })}
                    className="px-2 py-1.5 border rounded text-xs"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-gray-600">วันหมดอายุพาสปอร์ต</span>
                  <input
                    type="date"
                    value={p.passport_expiry || ''}
                    onChange={(e) => updatePassenger(passengers, setPassengers, idx, { passport_expiry: e.target.value })}
                    className="px-2 py-1.5 border rounded text-xs"
                  />
                </label>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                * จำเป็น • วันหมดอายุพาสปอร์ตควรเหลือ &gt; 6 เดือนนับจากวันเดินทาง • ชื่อ-นามสกุลต้องตรงกับพาสปอร์ต
              </p>
            </div>
          ))}

          <div className="flex gap-2">
            <button
              onClick={handleHold}
              disabled={loading || passengers.some((p) => !p.first_name.trim() || !p.last_name.trim())}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Hold Booking
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 border text-sm rounded-lg text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </Card>
      )}

      {/* STEP 3: Confirm */}
      {step === 'confirm' && booking && (
        <Card className="p-4 sm:p-6 space-y-3">
          <h2 className="text-lg font-semibold">3. Confirm</h2>
          <p className="text-sm text-gray-600">
            จอง hold เรียบร้อย → กด Confirm เพื่อยืนยันการจองขั้นสุดท้ายกับ provider
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirm Booking
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 border text-sm rounded-lg text-gray-600 hover:bg-gray-50"
            >
              Cancel Hold
            </button>
          </div>
        </Card>
      )}

      {/* DONE */}
      {step === 'done' && booking && (
        <Card className="p-4 sm:p-6 bg-green-50 border-green-200 space-y-2">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold">Flow completed</span>
          </div>
          <p className="text-sm text-gray-700">
            Final status: <code className="bg-white px-2 py-0.5 rounded">{booking.status}</code> /{' '}
            <code className="bg-white px-2 py-0.5 rounded">{booking.provider_status}</code>
          </p>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg mt-2"
          >
            <RefreshCw className="w-4 h-4" /> ทดสอบใหม่
          </button>
        </Card>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-gray-500">{label}</div>
      <div className="font-medium truncate" title={value}>
        {value}
      </div>
    </div>
  );
}

function updatePassenger(
  list: BookingPassengerForm[],
  setList: (l: BookingPassengerForm[]) => void,
  idx: number,
  patch: Partial<BookingPassengerForm>,
) {
  const next = [...list];
  next[idx] = { ...next[idx], ...patch };
  setList(next);
}
