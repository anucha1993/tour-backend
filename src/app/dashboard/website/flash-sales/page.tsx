'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  flashSalesApi,
  FlashSale,
  FlashSaleItem,
  FlashSaleTourSearch,
} from '@/lib/api';
import {
  Zap,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Search,
  X,
  ChevronLeft,
  Clock,
  Package,
  Check,
  Loader2,
  GripVertical,
} from 'lucide-react';

// ─── Types ───
type ModalMode = 'create' | 'edit' | 'items';

interface FormData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

const defaultForm: FormData = {
  title: '',
  description: '',
  start_date: '',
  end_date: '',
  is_active: true,
};

function formatDateTimeLocal(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateTime(isoString: string): string {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusBadge(label: string) {
  switch (label) {
    case 'กำลังดำเนินการ':
      return 'bg-green-100 text-green-700';
    case 'รอเปิด':
      return 'bg-blue-100 text-blue-700';
    case 'หมดเวลา':
      return 'bg-gray-100 text-gray-500';
    case 'ปิดใช้งาน':
      return 'bg-red-100 text-red-600';
    default:
      return 'bg-gray-100 text-gray-500';
  }
}

export default function FlashSalesPage() {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [selectedSale, setSelectedSale] = useState<FlashSale | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [saving, setSaving] = useState(false);

  // Items management state
  const [saleItems, setSaleItems] = useState<FlashSaleItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Tour search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FlashSaleTourSearch[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Add item form
  const [addingTourId, setAddingTourId] = useState<number | null>(null);
  const [addingTourOriginalPrice, setAddingTourOriginalPrice] = useState<number>(0);
  const [addFlashPrice, setAddFlashPrice] = useState('');
  const [addDiscountPercent, setAddDiscountPercent] = useState('');
  const [addQuantityLimit, setAddQuantityLimit] = useState('');

  // Edit item
  const [editingItem, setEditingItem] = useState<FlashSaleItem | null>(null);
  const [editFlashPrice, setEditFlashPrice] = useState('');
  const [editDiscountPercent, setEditDiscountPercent] = useState('');
  const [editQuantityLimit, setEditQuantityLimit] = useState('');

  // Mass update
  const [showMassUpdate, setShowMassUpdate] = useState(false);
  const [massDiscountType, setMassDiscountType] = useState<'percent' | 'amount'>('percent');
  const [massDiscountValue, setMassDiscountValue] = useState('');
  const [massUpdating, setMassUpdating] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());

  const fetchFlashSales = useCallback(async () => {
    try {
      setLoading(true);
      const res = await flashSalesApi.list();
      setFlashSales(res.data || []);
    } catch (err) {
      console.error('Error fetching flash sales:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlashSales();
  }, [fetchFlashSales]);

  // ─── CRUD Handlers ───
  const openCreate = () => {
    setForm(defaultForm);
    setModalMode('create');
    setSelectedSale(null);
  };

  const openEdit = (sale: FlashSale) => {
    setForm({
      title: sale.title,
      description: sale.description || '',
      start_date: formatDateTimeLocal(sale.start_date),
      end_date: formatDateTimeLocal(sale.end_date),
      is_active: sale.is_active,
    });
    setSelectedSale(sale);
    setModalMode('edit');
  };

  const openItems = async (sale: FlashSale) => {
    setSelectedSale(sale);
    setModalMode('items');
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    setAddingTourId(null);
    setEditingItem(null);
    await fetchItems(sale.id);
  };

  const fetchItems = async (saleId: number) => {
    try {
      setLoadingItems(true);
      const res = await flashSalesApi.get(saleId);
      setSaleItems(res.data?.items || []);
    } catch (err) {
      console.error('Error fetching items:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.start_date || !form.end_date) return;
    try {
      setSaving(true);
      if (modalMode === 'create') {
        const res = await flashSalesApi.create(form);
        await fetchFlashSales();
        // Auto-redirect to items management after creating
        const newSale = res.data;
        if (newSale?.id) {
          openItems(newSale);
        } else {
          setModalMode(null);
        }
      } else if (modalMode === 'edit' && selectedSale) {
        await flashSalesApi.update(selectedSale.id, form);
        setModalMode(null);
        await fetchFlashSales();
      }
    } catch (err) {
      console.error('Error saving:', err);
      alert('เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('ยืนยันลบ Flash Sale นี้?')) return;
    try {
      await flashSalesApi.delete(id);
      await fetchFlashSales();
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await flashSalesApi.toggleStatus(id);
      await fetchFlashSales();
    } catch (err) {
      console.error('Error toggling:', err);
    }
  };

  // ─── Items Handlers ───
  const searchTours = async (q: string) => {
    try {
      setSearching(true);
      const res = await flashSalesApi.searchTours(q);
      // Filter out already added tours
      const existingIds = saleItems.map((i) => i.tour_id);
      setSearchResults(
        (res.data || []).filter((t: FlashSaleTourSearch) => !existingIds.includes(t.id))
      );
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchInput = (val: string) => {
    setSearchQuery(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      searchTours(val);
    }, 400);
  };

  const handleSelectTour = (tour: FlashSaleTourSearch) => {
    const origPrice = tour.min_price || 0;
    setAddingTourId(tour.id);
    setAddingTourOriginalPrice(origPrice);
    setAddFlashPrice(origPrice ? String(origPrice) : '');
    setAddDiscountPercent('');
    setAddQuantityLimit('');
  };

  // Auto-calc: discount % → flash price
  const handleAddDiscountChange = (val: string) => {
    setAddDiscountPercent(val);
    if (val && addingTourOriginalPrice > 0) {
      const pct = Math.min(100, Math.max(0, Number(val)));
      const newPrice = Math.round(addingTourOriginalPrice * (1 - pct / 100));
      setAddFlashPrice(String(newPrice));
    }
  };

  // Auto-calc: flash price → discount %
  const handleAddPriceChange = (val: string) => {
    setAddFlashPrice(val);
    if (val && addingTourOriginalPrice > 0) {
      const pct = ((addingTourOriginalPrice - Number(val)) / addingTourOriginalPrice) * 100;
      setAddDiscountPercent(pct > 0 ? String(Math.round(pct * 10) / 10) : '');
    } else {
      setAddDiscountPercent('');
    }
  };

  const handleAddItem = async () => {
    if (!addingTourId || !selectedSale) return;
    try {
      setSaving(true);
      await flashSalesApi.addItem(selectedSale.id, {
        tour_id: addingTourId,
        flash_price: addFlashPrice ? Number(addFlashPrice) : undefined,
        quantity_limit: addQuantityLimit ? Number(addQuantityLimit) : undefined,
      });
      setAddingTourId(null);
      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
      await fetchItems(selectedSale.id);
      await fetchFlashSales();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (!selectedSale || !confirm('ยืนยันลบรายการนี้?')) return;
    try {
      await flashSalesApi.removeItem(selectedSale.id, itemId);
      await fetchItems(selectedSale.id);
      await fetchFlashSales();
    } catch (err) {
      console.error('Remove error:', err);
    }
  };

  const startEditItem = (item: FlashSaleItem) => {
    setEditingItem(item);
    setEditFlashPrice(item.flash_price ? String(item.flash_price) : '');
    setEditDiscountPercent(item.discount_percent ? String(item.discount_percent) : '');
    setEditQuantityLimit(item.quantity_limit ? String(item.quantity_limit) : '');
  };

  // Auto-calc for edit: discount % → flash price
  const handleEditDiscountChange = (val: string) => {
    setEditDiscountPercent(val);
    if (val && editingItem?.original_price) {
      const origPrice = Number(editingItem.original_price);
      const pct = Math.min(100, Math.max(0, Number(val)));
      const newPrice = Math.round(origPrice * (1 - pct / 100));
      setEditFlashPrice(String(newPrice));
    }
  };

  // Auto-calc for edit: flash price → discount %
  const handleEditPriceChange = (val: string) => {
    setEditFlashPrice(val);
    if (val && editingItem?.original_price) {
      const origPrice = Number(editingItem.original_price);
      const pct = ((origPrice - Number(val)) / origPrice) * 100;
      setEditDiscountPercent(pct > 0 ? String(Math.round(pct * 10) / 10) : '');
    } else {
      setEditDiscountPercent('');
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !selectedSale) return;
    try {
      setSaving(true);
      await flashSalesApi.updateItem(selectedSale.id, editingItem.id, {
        flash_price: editFlashPrice ? Number(editFlashPrice) : undefined,
        quantity_limit: editQuantityLimit ? Number(editQuantityLimit) : undefined,
      });
      setEditingItem(null);
      await fetchItems(selectedSale.id);
    } catch (err) {
      console.error('Update error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleItem = async (item: FlashSaleItem) => {
    if (!selectedSale) return;
    try {
      await flashSalesApi.updateItem(selectedSale.id, item.id, {
        is_active: !item.is_active,
      });
      await fetchItems(selectedSale.id);
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  // Mass update discount
  const handleMassUpdateDiscount = async () => {
    if (!selectedSale || !massDiscountValue) return;
    const value = Number(massDiscountValue);
    if (value <= 0) return;
    if (massDiscountType === 'percent' && value > 100) {
      alert('ส่วนลดไม่สามารถเกิน 100%');
      return;
    }
    if (selectedItemIds.size === 0) {
      alert('กรุณาเลือกทัวร์ที่ต้องการอัปเดตส่วนลด');
      return;
    }
    const label = massDiscountType === 'percent' ? `${value}%` : `฿${value.toLocaleString()}`;
    if (!confirm(`ยืนยันอัปเดตส่วนลดเป็น ${label} สำหรับ ${selectedItemIds.size} ทัวร์ที่เลือก?`)) return;
    try {
      setMassUpdating(true);
      await flashSalesApi.massUpdateDiscount(selectedSale.id, {
        discount_type: massDiscountType,
        discount_value: value,
        item_ids: Array.from(selectedItemIds),
      });
      await fetchItems(selectedSale.id);
      setShowMassUpdate(false);
      setMassDiscountValue('');
      setSelectedItemIds(new Set());
    } catch (err) {
      console.error('Mass update error:', err);
      alert('เกิดข้อผิดพลาด');
    } finally {
      setMassUpdating(false);
    }
  };

  // ─── Items Management View ───
  if (modalMode === 'items' && selectedSale) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => { setModalMode(null); setSelectedSale(null); }}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              จัดการรายการ Flash Sale
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {selectedSale.title} • {formatDateTime(selectedSale.start_date)} - {formatDateTime(selectedSale.end_date)}
            </p>
          </div>
        </div>

        {/* Add Tour Button */}
        <div className="mb-6">
          {!showSearch ? (
            <button
              onClick={() => { setShowSearch(true); searchTours(''); }}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
            >
              <Plus className="w-4 h-4" />
              เพิ่มทัวร์
            </button>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">ค้นหาทัวร์</h3>
                <button
                  onClick={() => { setShowSearch(false); setAddingTourId(null); setSearchQuery(''); setSearchResults([]); }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  placeholder="ค้นหาด้วยชื่อทัวร์หรือรหัสทัวร์..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  autoFocus
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && !addingTourId && (
                <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-lg divide-y">
                  {searchResults.map((tour) => (
                    <button
                      key={tour.id}
                      onClick={() => handleSelectTour(tour)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-orange-50 transition text-left"
                    >
                      {tour.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={tour.cover_image_url}
                          alt=""
                          className="w-12 h-12 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {tour.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {tour.tour_code} • ราคา {tour.min_price?.toLocaleString() || '-'} บาท
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchResults.length === 0 && searchQuery && !searching && (
                <p className="text-sm text-gray-500 text-center py-4">
                  ไม่พบทัวร์ที่ค้นหา
                </p>
              )}

              {/* Add Item Form (after selecting a tour) */}
              {addingTourId && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-orange-800">
                      กำหนดส่วนลด Flash Sale
                    </p>
                    {addingTourOriginalPrice > 0 && (
                      <p className="text-xs text-gray-500">
                        ราคาปกติ: <span className="font-semibold text-gray-700">฿{addingTourOriginalPrice.toLocaleString()}</span>
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        ส่วนลด (%)
                      </label>
                      <input
                        type="number"
                        value={addDiscountPercent}
                        onChange={(e) => handleAddDiscountChange(e.target.value)}
                        placeholder="เช่น 20"
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        ราคา Flash Sale (บาท)
                      </label>
                      <input
                        type="number"
                        value={addFlashPrice}
                        onChange={(e) => handleAddPriceChange(e.target.value)}
                        placeholder="ราคาพิเศษ"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        จำนวนจำกัด (ว่าง = ไม่จำกัด)
                      </label>
                      <input
                        type="number"
                        value={addQuantityLimit}
                        onChange={(e) => setAddQuantityLimit(e.target.value)}
                        placeholder="ไม่จำกัด"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  {addDiscountPercent && addFlashPrice && addingTourOriginalPrice > 0 && (
                    <p className="text-xs text-green-600 font-medium">
                      💰 ลูกค้าประหยัด ฿{(addingTourOriginalPrice - Number(addFlashPrice)).toLocaleString()} (ลด {addDiscountPercent}%)
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddItem}
                      disabled={saving}
                      className="flex items-center gap-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 text-sm"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      เพิ่ม
                    </button>
                    <button
                      onClick={() => setAddingTourId(null)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mass Update Discount */}
        {saleItems.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => { setShowMassUpdate(!showMassUpdate); if (!showMassUpdate) setSelectedItemIds(new Set(saleItems.map(i => i.id))); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition"
            >
              <Zap className="w-4 h-4" />
              อัปเดตส่วนลดหลายรายการ
            </button>

            {showMassUpdate && (
              <div className="mt-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-orange-800">
                    อัปเดตส่วนลด
                    <span className="ml-1 text-sm font-normal text-orange-600">
                      (เลือก {selectedItemIds.size}/{saleItems.length} รายการ)
                    </span>
                  </h3>
                  <button
                    onClick={() => setShowMassUpdate(false)}
                    className="p-1 hover:bg-orange-100 rounded"
                  >
                    <X className="w-4 h-4 text-orange-400" />
                  </button>
                </div>

                {/* Select All / Deselect All */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedItemIds.size === saleItems.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItemIds(new Set(saleItems.map(i => i.id)));
                        } else {
                          setSelectedItemIds(new Set());
                        }
                      }}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">เลือกทั้งหมด</span>
                  </label>
                  {selectedItemIds.size > 0 && selectedItemIds.size < saleItems.length && (
                    <span className="text-xs text-gray-400">
                      เลือกบางส่วน ({selectedItemIds.size} รายการ)
                    </span>
                  )}
                </div>

                {/* Item Checkboxes */}
                <div className="max-h-48 overflow-y-auto space-y-1 bg-white/60 rounded-lg p-2 border border-orange-100">
                  {saleItems.map((item) => {
                    const isChecked = selectedItemIds.has(item.id);
                    const origPrice = Number(item.original_price) || 0;
                    const discVal = Number(massDiscountValue) || 0;
                    const newPrice = discVal > 0
                      ? (massDiscountType === 'percent'
                          ? Math.round(origPrice * (1 - discVal / 100))
                          : Math.max(0, origPrice - discVal))
                      : null;
                    return (
                      <label
                        key={item.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition ${
                          isChecked ? 'bg-orange-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const next = new Set(selectedItemIds);
                            if (e.target.checked) {
                              next.add(item.id);
                            } else {
                              next.delete(item.id);
                            }
                            setSelectedItemIds(next);
                          }}
                          className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700 truncate flex-1">
                          {item.tour?.title || `Tour #${item.tour_id}`}
                        </span>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          ฿{origPrice.toLocaleString()}
                        </span>
                        {newPrice !== null && isChecked && (
                          <span className="text-xs text-orange-600 font-bold flex-shrink-0">
                            → ฿{newPrice.toLocaleString()}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>

                {/* Discount Type Tabs */}
                <div className="flex rounded-lg border border-orange-200 overflow-hidden">
                  <button
                    onClick={() => { setMassDiscountType('percent'); setMassDiscountValue(''); }}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium transition ${
                      massDiscountType === 'percent'
                        ? 'bg-orange-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-orange-50'
                    }`}
                  >
                    ลดเป็น % (เปอร์เซ็นต์)
                  </button>
                  <button
                    onClick={() => { setMassDiscountType('amount'); setMassDiscountValue(''); }}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium transition ${
                      massDiscountType === 'amount'
                        ? 'bg-orange-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-orange-50'
                    }`}
                  >
                    ลดเป็นจำนวนเงิน (บาท)
                  </button>
                </div>

                {/* Discount Value Input */}
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1.5">
                      {massDiscountType === 'percent' ? 'ระบุส่วนลด (%)' : 'ระบุจำนวนเงินที่ต้องการลด (บาท)'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={massDiscountValue}
                        onChange={(e) => setMassDiscountValue(e.target.value)}
                        placeholder={massDiscountType === 'percent' ? 'เช่น 20' : 'เช่น 1000'}
                        min="0"
                        max={massDiscountType === 'percent' ? '100' : undefined}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                        {massDiscountType === 'percent' ? '%' : 'บาท'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleMassUpdateDiscount}
                    disabled={massUpdating || !massDiscountValue || Number(massDiscountValue) <= 0 || selectedItemIds.size === 0}
                    className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
                  >
                    {massUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    อัปเดต {selectedItemIds.size} รายการ
                  </button>
                </div>

                {/* Preview removed - inline in checkboxes above */}
              </div>
            )}
          </div>
        )}

        {/* Items List */}
        {loadingItems ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : saleItems.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>ยังไม่มีรายการทัวร์ กดปุ่ม &quot;เพิ่มทัวร์&quot; เพื่อเริ่มต้น</p>
          </div>
        ) : (
          <div className="space-y-3">
            {saleItems.map((item, idx) => (
              <div
                key={item.id}
                className={`bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 transition ${
                  !item.is_active ? 'opacity-50' : ''
                }`}
              >
                <div className="text-gray-300 cursor-grab">
                  <GripVertical className="w-5 h-5" />
                </div>
                <span className="text-sm text-gray-400 font-mono w-6">
                  {idx + 1}
                </span>

                {/* Tour Image */}
                {item.tour?.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.tour.cover_image_url}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-gray-400" />
                  </div>
                )}

                {/* Tour Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {item.tour?.title || `Tour #${item.tour_id}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.tour?.tour_code}
                  </p>
                  {editingItem?.id === item.id ? (
                    <div className="mt-2 space-y-1.5">
                      {item.original_price && (
                        <p className="text-[10px] text-gray-400">ราคาปกติ: ฿{Number(item.original_price).toLocaleString()}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="number"
                            value={editDiscountPercent}
                            onChange={(e) => handleEditDiscountChange(e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm pr-6"
                            placeholder="ส่วนลด"
                            min="0"
                            max="100"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                        </div>
                        <input
                          type="number"
                          value={editFlashPrice}
                          onChange={(e) => handleEditPriceChange(e.target.value)}
                          className="w-28 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="ราคา"
                        />
                        <input
                          type="number"
                          value={editQuantityLimit}
                          onChange={(e) => setEditQuantityLimit(e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="จำนวน"
                        />
                        <button
                          onClick={handleUpdateItem}
                          disabled={saving}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingItem(null)}
                          className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center gap-3 text-xs">
                      <span className="text-orange-600 font-bold">
                        ฿{Number(item.flash_price).toLocaleString()}
                      </span>
                      {item.original_price && Number(item.flash_price) < Number(item.original_price) && (
                        <span className="text-gray-400 line-through">
                          ฿{Number(item.original_price).toLocaleString()}
                        </span>
                      )}
                      {item.discount_percent && Number(item.discount_percent) > 0 && (
                        <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          -{Number(item.discount_percent)}%
                        </span>
                      )}
                      {item.quantity_limit && (
                        <span className="text-gray-500">
                          ขายแล้ว {item.quantity_sold}/{item.quantity_limit}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {editingItem?.id !== item.id && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditItem(item)}
                      title="แก้ไข"
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleItem(item)}
                      title={item.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                      className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                    >
                      {item.is_active ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      title="ลบ"
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Main List View ───
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-orange-500" />
            Flash Sale
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            จัดการแคมเปญ Flash Sale พร้อม Countdown Timer บนหน้าแรก
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          สร้าง Flash Sale
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      ) : flashSales.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Zap className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">ยังไม่มี Flash Sale</p>
          <p className="text-sm mt-1">กด &quot;สร้าง Flash Sale&quot; เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className="space-y-4">
          {flashSales.map((sale) => (
            <div
              key={sale.id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => openItems(sale)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {sale.title}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                        sale.status_label || ''
                      )}`}
                    >
                      {sale.status_label}
                    </span>
                  </div>
                  {sale.description && (
                    <p className="text-sm text-gray-500 mb-2 line-clamp-1">
                      {sale.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDateTime(sale.start_date)} - {formatDateTime(sale.end_date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" />
                      {sale.items_count || 0} ทัวร์
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={() => openItems(sale)}
                    title="จัดการรายการ"
                    className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                  >
                    <Package className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEdit(sale)}
                    title="แก้ไข"
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggle(sale.id)}
                    title={sale.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                  >
                    {sale.is_active ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(sale.id)}
                    title="ลบ"
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {modalMode === 'create' ? 'สร้าง Flash Sale' : 'แก้ไข Flash Sale'}
                </h2>
                <button
                  onClick={() => setModalMode(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อ Flash Sale *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="เช่น Flash Sale วันวาเลนไทน์"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รายละเอียด
                  </label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      เวลาเริ่มต้น *
                    </label>
                    <input
                      type="datetime-local"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      เวลาสิ้นสุด *
                    </label>
                    <input
                      type="datetime-local"
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    เปิดใช้งาน
                  </label>
                </div>
              </div>

                {/* Link to items management (edit mode only) */}
                {modalMode === 'edit' && selectedSale && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-800">ทัวร์และส่วนลด</p>
                      <p className="text-xs text-orange-600 mt-0.5">
                        กำหนดส่วนลดแต่ละทัวร์ได้ที่หน้าจัดการรายการ
                      </p>
                    </div>
                    <button
                      onClick={() => openItems(selectedSale)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium transition"
                    >
                      <Package className="w-4 h-4" />
                      จัดการทัวร์และส่วนลด
                    </button>
                  </div>
                )}

                {modalMode === 'create' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700">
                      💡 หลังจากสร้าง Flash Sale แล้ว ระบบจะพาไปหน้าเพิ่มทัวร์และกำหนดส่วนลดโดยอัตโนมัติ
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.title || !form.start_date || !form.end_date}
                  className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {modalMode === 'create' ? 'สร้าง → จัดการทัวร์' : 'บันทึก'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
