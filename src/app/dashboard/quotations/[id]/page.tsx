'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { quotationsApi, Quotation, QuotationItem } from '@/lib/api';
import { ArrowLeft, Plus, Trash2, Send, Save, Ban } from 'lucide-react';

export default function QuotationDetailAdminPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [validUntil, setValidUntil] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await quotationsApi.get(id);
    if (res.success && res.data) {
      const q = res.data as Quotation;
      setQuotation(q);
      setTitle(q.title || '');
      setDescription(q.description || '');
      setItems(q.items || []);
      setDiscount(Number(q.discount) || 0);
      setValidUntil(q.valid_until ? q.valid_until.substring(0, 10) : '');
      setAdminNotes(q.admin_notes || '');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  const subtotal = items.reduce((sum, it) => sum + Number(it.qty) * Number(it.unit_price), 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0));

  const addItem = () => {
    setItems([...items, { description: '', qty: 1, unit_price: 0, amount: 0 }]);
  };

  const updateItem = (idx: number, key: keyof QuotationItem, value: string | number) => {
    const next = [...items];
    next[idx] = { ...next[idx], [key]: value };
    if (key === 'qty' || key === 'unit_price') {
      next[idx].amount = Number(next[idx].qty) * Number(next[idx].unit_price);
    }
    setItems(next);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    const res = await quotationsApi.update(id, {
      title,
      description,
      items: items.map((it) => ({
        description: it.description,
        qty: Number(it.qty),
        unit_price: Number(it.unit_price),
        amount: Number(it.qty) * Number(it.unit_price),
      })),
      discount: Number(discount) || 0,
      valid_until: validUntil || null,
      admin_notes: adminNotes,
    });
    setSaving(false);
    if (res.success) {
      setMessage({ type: 'success', text: 'บันทึกแล้ว' });
      await load();
    } else {
      setMessage({ type: 'error', text: res.message || 'บันทึกไม่สำเร็จ' });
    }
  };

  const handleSend = async () => {
    if (!confirm('ส่งใบเสนอราคาให้ลูกค้า?')) return;
    setSaving(true);
    await handleSave();
    const res = await quotationsApi.send(id);
    setSaving(false);
    if (res.success) {
      setMessage({ type: 'success', text: 'ส่งใบเสนอราคาเรียบร้อย' });
      await load();
    } else {
      setMessage({ type: 'error', text: res.message || 'ส่งไม่สำเร็จ' });
    }
  };

  const handleCancel = async () => {
    if (!confirm('ยกเลิกใบเสนอราคา?')) return;
    const res = await quotationsApi.cancel(id);
    if (res.success) {
      await load();
    } else {
      setMessage({ type: 'error', text: res.message || 'ยกเลิกไม่สำเร็จ' });
    }
  };

  const formatMoney = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) {
    return <div className="p-6 text-center text-gray-400">กำลังโหลด...</div>;
  }
  if (!quotation) {
    return <div className="p-6 text-center text-gray-400">ไม่พบข้อมูล</div>;
  }

  const isLocked = ['accepted', 'cancelled'].includes(quotation.status);
  const canSend = ['requested', 'draft'].includes(quotation.status);

  return (
    <div className="p-6 max-w-5xl">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> กลับ
      </button>

      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{quotation.quotation_number}</h1>
          <p className="text-sm text-gray-500">สถานะ: <span className="font-medium">{quotation.status}</span></p>
        </div>
        <div className="flex gap-2">
          {!isLocked && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> บันทึก
            </button>
          )}
          {canSend && (
            <button
              onClick={handleSend}
              disabled={saving || subtotal <= 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> ส่งให้ลูกค้า
            </button>
          )}
          {!isLocked && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg flex items-center gap-2 cursor-pointer"
            >
              <Ban className="w-4 h-4" /> ยกเลิก
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg mb-4 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Customer info */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-3">ข้อมูลลูกค้า</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">ชื่อ:</span> {quotation.customer_name}</div>
          <div><span className="text-gray-500">โทร:</span> <a href={`tel:${quotation.customer_phone}`} className="text-blue-600">{quotation.customer_phone}</a></div>
          <div><span className="text-gray-500">อีเมล:</span> {quotation.customer_email || '-'}</div>
          <div><span className="text-gray-500">ผู้ใหญ่/เด็ก/ทารก:</span> {quotation.pax_adult} / {quotation.pax_child} / {quotation.pax_infant}</div>
          <div><span className="text-gray-500">ทัวร์อ้างอิง:</span> {quotation.tour?.title || '-'}</div>
          <div><span className="text-gray-500">ช่วงเวลาที่ต้องการ:</span> {quotation.travel_date_preference || '-'}</div>
        </div>
        {quotation.notes && (
          <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
            <div className="text-xs text-gray-500 mb-1">หมายเหตุจากลูกค้า:</div>
            {quotation.notes}
          </div>
        )}
      </div>

      {/* Quotation editor */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-3">รายละเอียดใบเสนอราคา</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">ชื่อ/หัวข้อ</label>
            <input
              type="text"
              value={title}
              disabled={isLocked}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">รายละเอียด</label>
            <textarea
              value={description}
              disabled={isLocked}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
            />
          </div>

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">รายการ</label>
              {!isLocked && (
                <button onClick={addItem} className="text-sm text-blue-600 hover:underline flex items-center gap-1 cursor-pointer">
                  <Plus className="w-3 h-3" /> เพิ่มรายการ
                </button>
              )}
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">รายการ</th>
                    <th className="px-3 py-2 w-20 text-right">จำนวน</th>
                    <th className="px-3 py-2 w-32 text-right">ราคา/หน่วย</th>
                    <th className="px-3 py-2 w-32 text-right">รวม</th>
                    {!isLocked && <th className="px-3 py-2 w-12"></th>}
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">ยังไม่มีรายการ</td></tr>
                  ) : (
                    items.map((it, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2">
                          <input
                            value={it.description}
                            disabled={isLocked}
                            onChange={(e) => updateItem(idx, 'description', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-200 rounded disabled:bg-gray-50"
                            placeholder="รายละเอียด"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={it.qty}
                            disabled={isLocked}
                            onChange={(e) => updateItem(idx, 'qty', Number(e.target.value))}
                            className="w-full px-2 py-1 border border-gray-200 rounded text-right disabled:bg-gray-50"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={it.unit_price}
                            disabled={isLocked}
                            onChange={(e) => updateItem(idx, 'unit_price', Number(e.target.value))}
                            className="w-full px-2 py-1 border border-gray-200 rounded text-right disabled:bg-gray-50"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {formatMoney(Number(it.qty) * Number(it.unit_price))}
                        </td>
                        {!isLocked && (
                          <td className="px-3 py-2">
                            <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 cursor-pointer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-gray-50 font-medium">
                  <tr><td colSpan={3} className="px-3 py-2 text-right">รวม</td><td className="px-3 py-2 text-right">฿{formatMoney(subtotal)}</td>{!isLocked && <td></td>}</tr>
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right">ส่วนลด</td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={discount}
                        disabled={isLocked}
                        onChange={(e) => setDiscount(Number(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-right disabled:bg-gray-50"
                      />
                    </td>
                    {!isLocked && <td></td>}
                  </tr>
                  <tr className="text-base"><td colSpan={3} className="px-3 py-2 text-right">ยอดรวมสุทธิ</td><td className="px-3 py-2 text-right text-blue-600">฿{formatMoney(total)}</td>{!isLocked && <td></td>}</tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">ใบเสนอราคามีอายุถึง</label>
              <input
                type="date"
                value={validUntil}
                disabled={isLocked}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">เงื่อนไข/หมายเหตุ (ลูกค้าจะเห็น)</label>
            <textarea
              value={adminNotes}
              disabled={isLocked}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
            />
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        ลิงก์สำหรับลูกค้า:{' '}
        <Link href={`/member/quotations/${quotation.id}`} className="text-blue-600 hover:underline">
          /member/quotations/{quotation.id}
        </Link>
      </div>
    </div>
  );
}
