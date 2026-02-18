'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Users,
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

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
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

  // Period selection for adding (batch)
  const [selectedTour, setSelectedTour] = useState<FlashSaleTourSearch | null>(null);
  // Per-period settings: periodId → { checked, flashPrice, discountPercent, flashEndDate }
  const [periodSettings, setPeriodSettings] = useState<Record<number, {
    checked: boolean;
    flashPrice: string;
    discountPercent: string;
    flashEndDate: string;
    originalPrice: number;
  }>>({});
  const [globalDiscountPercent, setGlobalDiscountPercent] = useState('');
  const [globalFlashEndDate, setGlobalFlashEndDate] = useState('');

  // Edit mode (full-tour period table)
  const [editTourData, setEditTourData] = useState<FlashSaleTourSearch | null>(null);
  const [editPeriodSettings, setEditPeriodSettings] = useState<Record<number, {
    isExisting: boolean;
    itemId?: number;
    checked: boolean;
    flashPrice: string;
    discountPercent: string;
    quantityLimit: string;
    flashEndDate: string;
    originalPrice: number;
  }>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null); // which item row triggered edit
  const [editGlobalDiscountPercent, setEditGlobalDiscountPercent] = useState('');
  const [editGlobalFlashEndDate, setEditGlobalFlashEndDate] = useState('');
  const editPanelRef = useRef<HTMLTableRowElement>(null);

  // Mass update
  const [showMassUpdate, setShowMassUpdate] = useState(false);
  const [massDiscountType, setMassDiscountType] = useState<'percent' | 'amount'>('percent');
  const [massDiscountValue, setMassDiscountValue] = useState('');
  const [massFlashEndDate, setMassFlashEndDate] = useState('');
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
    setSelectedTour(null);
    setPeriodSettings({});
    closeEditMode();
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

  // ─── Tour Search & Period Selection ───
  const searchTours = async (q: string) => {
    try {
      setSearching(true);
      const res = await flashSalesApi.searchTours(q);
      setSearchResults(res.data || []);
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
    setSelectedTour(tour);
    // Populate per-period settings from tour.periods
    const settings: typeof periodSettings = {};
    for (const p of tour.periods) {
      const origPrice = p.price_adult || tour.min_price || 0;
      settings[p.id] = {
        checked: false,
        flashPrice: origPrice ? String(origPrice) : '',
        discountPercent: '',
        flashEndDate: selectedSale ? formatDateTimeLocal(selectedSale.end_date) : '',
        originalPrice: origPrice,
      };
    }
    setPeriodSettings(settings);
    setGlobalDiscountPercent('');
    setGlobalFlashEndDate(selectedSale ? formatDateTimeLocal(selectedSale.end_date) : '');
  };

  // Toggle checkbox for a single period
  const handleTogglePeriod = (periodId: number) => {
    setPeriodSettings((prev) => ({
      ...prev,
      [periodId]: { ...prev[periodId], checked: !prev[periodId]?.checked },
    }));
  };

  // Toggle all / none
  const handleToggleAllPeriods = (checked: boolean) => {
    const existingPeriodIds = new Set(saleItems.map((i) => i.period_id));
    setPeriodSettings((prev) => {
      const updated = { ...prev };
      for (const key of Object.keys(updated)) {
        const pid = Number(key);
        if (!existingPeriodIds.has(pid)) {
          updated[pid] = { ...updated[pid], checked };
        }
      }
      return updated;
    });
  };

  // Per-period discount % change → calc flash price
  const handlePeriodDiscountChange = (periodId: number, val: string) => {
    setPeriodSettings((prev) => {
      const s = prev[periodId];
      if (!s) return prev;
      const pct = Math.min(100, Math.max(0, Number(val) || 0));
      const newPrice = s.originalPrice > 0 ? Math.round(s.originalPrice * (1 - pct / 100)) : 0;
      return { ...prev, [periodId]: { ...s, discountPercent: val, flashPrice: String(newPrice) } };
    });
  };

  // Per-period flash price change → calc discount %
  const handlePeriodFlashPriceChange = (periodId: number, val: string) => {
    setPeriodSettings((prev) => {
      const s = prev[periodId];
      if (!s) return prev;
      let pct = '';
      if (val && s.originalPrice > 0) {
        const p = ((s.originalPrice - Number(val)) / s.originalPrice) * 100;
        pct = p > 0 ? String(Math.round(p * 10) / 10) : '';
      }
      return { ...prev, [periodId]: { ...s, flashPrice: val, discountPercent: pct } };
    });
  };

  // Per-period flash end date change
  const handlePeriodFlashEndDateChange = (periodId: number, val: string) => {
    setPeriodSettings((prev) => {
      const s = prev[periodId];
      if (!s) return prev;
      return { ...prev, [periodId]: { ...s, flashEndDate: val } };
    });
  };

  // Apply global discount % to all checked periods
  const handleApplyGlobalDiscount = () => {
    if (!globalDiscountPercent) return;
    const pct = Math.min(100, Math.max(0, Number(globalDiscountPercent) || 0));
    setPeriodSettings((prev) => {
      const updated = { ...prev };
      for (const key of Object.keys(updated)) {
        const pid = Number(key);
        if (updated[pid].checked && updated[pid].originalPrice > 0) {
          const newPrice = Math.round(updated[pid].originalPrice * (1 - pct / 100));
          updated[pid] = { ...updated[pid], discountPercent: String(pct), flashPrice: String(newPrice) };
        }
      }
      return updated;
    });
  };

  // Apply global flash end date to all checked periods
  const handleApplyGlobalEndDate = () => {
    if (!globalFlashEndDate) return;
    setPeriodSettings((prev) => {
      const updated = { ...prev };
      for (const key of Object.keys(updated)) {
        const pid = Number(key);
        if (updated[pid].checked) {
          updated[pid] = { ...updated[pid], flashEndDate: globalFlashEndDate };
        }
      }
      return updated;
    });
  };

  // Batch add all checked periods
  const handleBatchAddItems = async () => {
    if (!selectedSale) return;
    const existingPeriodIds = new Set(saleItems.map((i) => i.period_id));
    const items: Array<{
      period_id: number;
      flash_price?: number;
      flash_end_date?: string;
    }> = [];
    for (const [pidStr, s] of Object.entries(periodSettings)) {
      const pid = Number(pidStr);
      if (s.checked && !existingPeriodIds.has(pid)) {
        items.push({
          period_id: pid,
          flash_price: s.flashPrice ? Number(s.flashPrice) : undefined,
          flash_end_date: s.flashEndDate || undefined,
        });
      }
    }
    if (items.length === 0) {
      alert('กรุณาเลือกรอบเดินทางอย่างน้อย 1 รอบ');
      return;
    }
    try {
      setSaving(true);
      await flashSalesApi.addItems(selectedSale.id, items);
      setSelectedTour(null);
      setPeriodSettings({});
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

  // ─── Edit Mode: Full-tour period table ───
  const startEditItem = async (item: FlashSaleItem) => {
    // Close add panel if open
    setShowSearch(false);
    setSelectedTour(null);
    setEditingItemId(item.id);
    setEditLoading(true);
    try {
      const tourCode = item.tour?.tour_code || '';
      const res = await flashSalesApi.searchTours(tourCode);
      const tour = (res.data || []).find((t) => t.id === item.tour_id);
      if (!tour || !tour.periods?.length) {
        alert('ไม่พบข้อมูลรอบเดินทางของทัวร์นี้');
        return;
      }
      setEditTourData(tour);
      // Build period settings — existing items are editable, new ones can be added
      const existingItems = saleItems.filter((si) => si.tour_id === item.tour_id);
      const settings: typeof editPeriodSettings = {};
      for (const period of tour.periods) {
        const existingItem = existingItems.find((ei) => ei.period_id === period.id);
        if (existingItem) {
          settings[period.id] = {
            isExisting: true,
            itemId: existingItem.id,
            checked: true,
            flashPrice: existingItem.flash_price ? String(existingItem.flash_price) : '',
            discountPercent: existingItem.discount_percent ? String(existingItem.discount_percent) : '',
            quantityLimit: existingItem.quantity_limit ? String(existingItem.quantity_limit) : '',
            flashEndDate: existingItem.flash_end_date ? formatDateTimeLocal(existingItem.flash_end_date) : '',
            originalPrice: Number(existingItem.original_price) || period.price_adult || 0,
          };
        } else {
          settings[period.id] = {
            isExisting: false,
            checked: false,
            flashPrice: period.price_adult ? String(period.price_adult) : '',
            discountPercent: '',
            quantityLimit: '',
            flashEndDate: selectedSale ? formatDateTimeLocal(selectedSale.end_date) : '',
            originalPrice: period.price_adult || 0,
          };
        }
      }
      setEditPeriodSettings(settings);
      setEditGlobalDiscountPercent('');
      setEditGlobalFlashEndDate(selectedSale ? formatDateTimeLocal(selectedSale.end_date) : '');
      // Scroll to inline panel after render
      setTimeout(() => {
        editPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 150);
    } catch (err) {
      console.error('Error loading tour periods:', err);
      alert('โหลดข้อมูลรอบเดินทางไม่สำเร็จ');
    } finally {
      setEditLoading(false);
    }
  };

  const closeEditMode = () => {
    setEditTourData(null);
    setEditPeriodSettings({});
    setEditLoading(false);
    setEditingItemId(null);
  };

  // Toggle checkbox for new period in edit mode
  const handleEditTogglePeriod = (periodId: number) => {
    setEditPeriodSettings((prev) => {
      const s = prev[periodId];
      if (!s || s.isExisting) return prev; // Can't uncheck existing items
      return { ...prev, [periodId]: { ...s, checked: !s.checked } };
    });
  };

  // Toggle all new periods in edit mode
  const handleEditToggleAllNew = (checked: boolean) => {
    setEditPeriodSettings((prev) => {
      const updated = { ...prev };
      for (const key of Object.keys(updated)) {
        const pid = Number(key);
        if (!updated[pid].isExisting) {
          updated[pid] = { ...updated[pid], checked };
        }
      }
      return updated;
    });
  };

  // Per-period discount change in edit mode
  const handleEditPeriodDiscountChange = (periodId: number, val: string) => {
    setEditPeriodSettings((prev) => {
      const s = prev[periodId];
      if (!s) return prev;
      const pct = Math.min(100, Math.max(0, Number(val) || 0));
      const newPrice = s.originalPrice > 0 ? Math.round(s.originalPrice * (1 - pct / 100)) : 0;
      return { ...prev, [periodId]: { ...s, discountPercent: val, flashPrice: String(newPrice) } };
    });
  };

  // Per-period flash price change in edit mode
  const handleEditPeriodFlashPriceChange = (periodId: number, val: string) => {
    setEditPeriodSettings((prev) => {
      const s = prev[periodId];
      if (!s) return prev;
      let pct = '';
      if (val && s.originalPrice > 0) {
        const p = ((s.originalPrice - Number(val)) / s.originalPrice) * 100;
        pct = p > 0 ? String(Math.round(p * 10) / 10) : '';
      }
      return { ...prev, [periodId]: { ...s, flashPrice: val, discountPercent: pct } };
    });
  };

  // Per-period flash end date change in edit mode
  const handleEditPeriodFlashEndDateChange = (periodId: number, val: string) => {
    setEditPeriodSettings((prev) => {
      const s = prev[periodId];
      if (!s) return prev;
      return { ...prev, [periodId]: { ...s, flashEndDate: val } };
    });
  };

  // Per-period quantity limit change in edit mode
  const handleEditPeriodQuantityLimitChange = (periodId: number, val: string) => {
    setEditPeriodSettings((prev) => {
      const s = prev[periodId];
      if (!s) return prev;
      return { ...prev, [periodId]: { ...s, quantityLimit: val } };
    });
  };

  // Apply global discount to checked/existing periods in edit mode
  const handleApplyEditGlobalDiscount = () => {
    if (!editGlobalDiscountPercent) return;
    const pct = Math.min(100, Math.max(0, Number(editGlobalDiscountPercent) || 0));
    setEditPeriodSettings((prev) => {
      const updated = { ...prev };
      for (const key of Object.keys(updated)) {
        const pid = Number(key);
        const s = updated[pid];
        if ((s.isExisting || s.checked) && s.originalPrice > 0) {
          const newPrice = Math.round(s.originalPrice * (1 - pct / 100));
          updated[pid] = { ...s, discountPercent: String(pct), flashPrice: String(newPrice) };
        }
      }
      return updated;
    });
  };

  // Apply global flash end date to checked/existing periods in edit mode
  const handleApplyEditGlobalEndDate = () => {
    if (!editGlobalFlashEndDate) return;
    setEditPeriodSettings((prev) => {
      const updated = { ...prev };
      for (const key of Object.keys(updated)) {
        const pid = Number(key);
        const s = updated[pid];
        if (s.isExisting || s.checked) {
          updated[pid] = { ...s, flashEndDate: editGlobalFlashEndDate };
        }
      }
      return updated;
    });
  };

  // Save: update existing items + add new checked periods
  const handleSaveEdit = async () => {
    if (!selectedSale || !editTourData) return;
    try {
      setSaving(true);
      // 1. Update existing items
      for (const [, s] of Object.entries(editPeriodSettings)) {
        if (s.isExisting && s.itemId) {
          await flashSalesApi.updateItem(selectedSale.id, s.itemId, {
            flash_price: s.flashPrice ? Number(s.flashPrice) : undefined,
            flash_end_date: s.flashEndDate || undefined,
            quantity_limit: s.quantityLimit ? Number(s.quantityLimit) : undefined,
          });
        }
      }
      // 2. Add new checked periods
      const newItems: Array<{ period_id: number; flash_price?: number; flash_end_date?: string }> = [];
      for (const [pidStr, s] of Object.entries(editPeriodSettings)) {
        if (!s.isExisting && s.checked) {
          newItems.push({
            period_id: Number(pidStr),
            flash_price: s.flashPrice ? Number(s.flashPrice) : undefined,
            flash_end_date: s.flashEndDate || undefined,
          });
        }
      }
      if (newItems.length > 0) {
        await flashSalesApi.addItems(selectedSale.id, newItems);
      }
      closeEditMode();
      await fetchItems(selectedSale.id);
      await fetchFlashSales();
    } catch (err) {
      console.error('Save edit error:', err);
      alert('เกิดข้อผิดพลาดในการบันทึก');
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

  // Mass update discount + flash_end_date
  const handleMassUpdate = async () => {
    if (!selectedSale) return;
    const hasDiscount = massDiscountValue && Number(massDiscountValue) > 0;
    const hasEndDate = massFlashEndDate !== '';
    if (!hasDiscount && !hasEndDate) {
      alert('กรุณาระบุส่วนลดหรือวันหมดเวลา Flash');
      return;
    }
    if (hasDiscount && massDiscountType === 'percent' && Number(massDiscountValue) > 100) {
      alert('ส่วนลดไม่สามารถเกิน 100%');
      return;
    }
    if (selectedItemIds.size === 0) {
      alert('กรุณาเลือกรายการที่ต้องการอัปเดต');
      return;
    }
    const parts: string[] = [];
    if (hasDiscount) {
      const v = Number(massDiscountValue);
      parts.push(massDiscountType === 'percent' ? `ส่วนลด ${v}%` : `ส่วนลด ฿${v.toLocaleString()}`);
    }
    if (hasEndDate) parts.push(`วันหมดเวลา Flash`);
    if (!confirm(`ยืนยันอัปเดต ${parts.join(' + ')} สำหรับ ${selectedItemIds.size} รายการ?`)) return;
    try {
      setMassUpdating(true);
      const payload: Parameters<typeof flashSalesApi.massUpdateDiscount>[1] = {
        item_ids: Array.from(selectedItemIds),
      };
      if (hasDiscount) {
        payload.discount_type = massDiscountType;
        payload.discount_value = Number(massDiscountValue);
      }
      if (hasEndDate) {
        payload.flash_end_date = massFlashEndDate || null;
      }
      await flashSalesApi.massUpdateDiscount(selectedSale.id, payload);
      await fetchItems(selectedSale.id);
      setShowMassUpdate(false);
      setMassDiscountValue('');
      setMassFlashEndDate('');
      setSelectedItemIds(new Set());
    } catch (err) {
      console.error('Mass update error:', err);
      alert('เกิดข้อผิดพลาด');
    } finally {
      setMassUpdating(false);
    }
  };

  // ─── Items Management View (TABLE LAYOUT) ───
  if (modalMode === 'items' && selectedSale) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
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
              จัดการรอบเดินทาง Flash Sale
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {selectedSale.title} • {formatDateTime(selectedSale.start_date)} - {formatDateTime(selectedSale.end_date)}
            </p>
          </div>
        </div>

        {/* Add Period Button */}
        <div className="mb-6">
          {!showSearch ? (
            <button
              onClick={() => { setShowSearch(true); searchTours(''); }}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
            >
              <Plus className="w-4 h-4" />
              เพิ่มรอบเดินทาง
            </button>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">ค้นหาทัวร์ → เลือกรอบเดินทาง</h3>
                <button
                  onClick={() => { setShowSearch(false); setSelectedTour(null); setPeriodSettings({}); setSearchQuery(''); setSearchResults([]); }}
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

              {/* Step 1: Tour Search Results */}
              {searchResults.length > 0 && !selectedTour && (
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
                          {tour.tour_code} • {tour.periods?.length || 0} รอบเปิดจอง
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchResults.length === 0 && searchQuery && !searching && !selectedTour && (
                <p className="text-sm text-gray-500 text-center py-4">
                  ไม่พบทัวร์ที่ค้นหา
                </p>
              )}

              {/* Step 2: Period Selection Table (all periods of selected tour) */}
              {selectedTour && (
                <div className="border border-orange-200 rounded-lg overflow-hidden">
                  <div className="bg-orange-50 px-4 py-2 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-orange-800">{selectedTour.title}</p>
                      <p className="text-xs text-orange-600">{selectedTour.tour_code}</p>
                    </div>
                    <button
                      onClick={() => { setSelectedTour(null); setPeriodSettings({}); }}
                      className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-orange-100"
                    >
                      เปลี่ยนทัวร์
                    </button>
                  </div>

                  {selectedTour.periods && selectedTour.periods.length > 0 ? (
                    <>
                      {/* Global controls for checked periods */}
                      <div className="bg-amber-50 px-4 py-3 border-b border-orange-200">
                        <div className="flex flex-wrap items-end gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">ส่วนลดรวม (%)</label>
                            <div className="flex gap-1">
                              <input
                                type="number"
                                value={globalDiscountPercent}
                                onChange={(e) => setGlobalDiscountPercent(e.target.value)}
                                placeholder="เช่น 20"
                                min="0"
                                max="100"
                                className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              />
                              <button
                                onClick={handleApplyGlobalDiscount}
                                className="px-2 py-1.5 bg-orange-100 text-orange-700 text-xs rounded hover:bg-orange-200 whitespace-nowrap"
                              >
                                ใช้กับที่เลือก
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">วันหมดเวลา Flash รวม</label>
                            <div className="flex gap-1">
                              <input
                                type="datetime-local"
                                value={globalFlashEndDate}
                                onChange={(e) => setGlobalFlashEndDate(e.target.value)}
                                className="w-48 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              />
                              <button
                                onClick={handleApplyGlobalEndDate}
                                className="px-2 py-1.5 bg-orange-100 text-orange-700 text-xs rounded hover:bg-orange-200 whitespace-nowrap"
                              >
                                ใช้กับที่เลือก
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Periods Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-3 py-2 text-left w-10">
                                <input
                                  type="checkbox"
                                  checked={(() => {
                                    const existingIds = new Set(saleItems.map((i) => i.period_id));
                                    const checkable = Object.entries(periodSettings).filter(([k]) => !existingIds.has(Number(k)));
                                    return checkable.length > 0 && checkable.every(([, s]) => s.checked);
                                  })()}
                                  onChange={(e) => handleToggleAllPeriods(e.target.checked)}
                                  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                />
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">วันเดินทาง</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">ที่นั่ง</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">ราคาปกติ</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">ส่วนลด %</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">ราคา Flash</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">หมดเวลา Flash</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {selectedTour.periods.map((period) => {
                              const existingIds = new Set(saleItems.map((i) => i.period_id));
                              const alreadyAdded = existingIds.has(period.id);
                              const s = periodSettings[period.id];
                              return (
                                <tr
                                  key={period.id}
                                  className={`${alreadyAdded ? 'bg-gray-50 opacity-50' : s?.checked ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
                                >
                                  <td className="px-3 py-2">
                                    {alreadyAdded ? (
                                      <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">เพิ่มแล้ว</span>
                                    ) : (
                                      <input
                                        type="checkbox"
                                        checked={s?.checked || false}
                                        onChange={() => handleTogglePeriod(period.id)}
                                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                      />
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-gray-800 whitespace-nowrap">
                                    {formatDate(period.start_date)} - {formatDate(period.end_date)}
                                  </td>
                                  <td className="px-3 py-2 text-center text-gray-600">
                                    {period.available}/{period.capacity}
                                  </td>
                                  <td className="px-3 py-2 text-right text-gray-700 font-medium whitespace-nowrap">
                                    {s?.originalPrice ? `฿${s.originalPrice.toLocaleString()}` : '-'}
                                  </td>
                                  <td className="px-3 py-2">
                                    {!alreadyAdded && (
                                      <input
                                        type="number"
                                        value={s?.discountPercent || ''}
                                        onChange={(e) => handlePeriodDiscountChange(period.id, e.target.value)}
                                        placeholder="%"
                                        min="0"
                                        max="100"
                                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-orange-500"
                                      />
                                    )}
                                  </td>
                                  <td className="px-3 py-2">
                                    {!alreadyAdded && (
                                      <input
                                        type="number"
                                        value={s?.flashPrice || ''}
                                        onChange={(e) => handlePeriodFlashPriceChange(period.id, e.target.value)}
                                        placeholder="ราคา"
                                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-orange-500"
                                      />
                                    )}
                                  </td>
                                  <td className="px-3 py-2">
                                    {!alreadyAdded && (
                                      <input
                                        type="datetime-local"
                                        value={s?.flashEndDate || ''}
                                        onChange={(e) => handlePeriodFlashEndDateChange(period.id, e.target.value)}
                                        className="w-44 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                                      />
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Batch Add Button */}
                      <div className="px-4 py-3 bg-orange-50 border-t border-orange-200 flex items-center justify-between">
                        <p className="text-xs text-orange-600">
                          เลือก {Object.values(periodSettings).filter((s) => s.checked).length} รอบ
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setSelectedTour(null); setPeriodSettings({}); }}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                          >
                            ยกเลิก
                          </button>
                          <button
                            onClick={handleBatchAddItems}
                            disabled={saving || Object.values(periodSettings).filter((s) => s.checked).length === 0}
                            className="flex items-center gap-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 text-sm"
                          >
                            {saving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            เพิ่มรอบที่เลือก
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-6">
                      ไม่มีรอบเดินทางที่เปิดจอง
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mass Update */}
        {saleItems.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => { setShowMassUpdate(!showMassUpdate); if (!showMassUpdate) setSelectedItemIds(new Set(saleItems.map(i => i.id))); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition"
            >
              <Zap className="w-4 h-4" />
              อัปเดตรอบเดินทางหลายรายการ
            </button>

            {showMassUpdate && (
              <div className="mt-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-orange-800">
                    อัปเดตรอบเดินทาง
                    <span className="ml-1 text-sm font-normal text-orange-600">
                      (เลือก {selectedItemIds.size}/{saleItems.length} รอบ)
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
                </div>

                {/* Item Checkboxes - period-centric display */}
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
                        <div className="flex-1 min-w-0">
                          {item.period ? (
                            <span className="text-sm font-medium text-orange-700 block">
                              {formatDate(item.period.start_date)} - {formatDate(item.period.end_date)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400 block">ไม่ระบุรอบ</span>
                          )}
                          <span className="text-[11px] text-gray-500 truncate block">
                            {item.tour?.title || `Tour #${item.tour_id}`}
                            {item.flash_end_date && (
                              <span className="ml-2 text-orange-500">
                                หมด: {formatDateTime(item.flash_end_date)}
                              </span>
                            )}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          ฿{origPrice.toLocaleString()}
                        </span>
                        {item.flash_price && (
                          <span className="text-xs text-orange-600 font-bold flex-shrink-0">
                            → ฿{Number(item.flash_price).toLocaleString()}
                          </span>
                        )}
                        {newPrice !== null && isChecked && (
                          <span className="text-xs text-green-600 font-bold flex-shrink-0">
                            ⇒ ฿{newPrice.toLocaleString()}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>

                {/* Discount Section */}
                <div className="bg-white/80 rounded-lg p-4 border border-orange-100 space-y-3">
                  <p className="text-sm font-medium text-gray-700">ส่วนลด (ไม่บังคับ)</p>
                  <div className="flex rounded-lg border border-orange-200 overflow-hidden">
                    <button
                      onClick={() => { setMassDiscountType('percent'); setMassDiscountValue(''); }}
                      className={`flex-1 px-4 py-2 text-sm font-medium transition ${
                        massDiscountType === 'percent'
                          ? 'bg-orange-500 text-white'
                          : 'bg-white text-gray-600 hover:bg-orange-50'
                      }`}
                    >
                      ลดเป็น %
                    </button>
                    <button
                      onClick={() => { setMassDiscountType('amount'); setMassDiscountValue(''); }}
                      className={`flex-1 px-4 py-2 text-sm font-medium transition ${
                        massDiscountType === 'amount'
                          ? 'bg-orange-500 text-white'
                          : 'bg-white text-gray-600 hover:bg-orange-50'
                      }`}
                    >
                      ลดเป็นจำนวนเงิน (บาท)
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                        {massDiscountType === 'percent' ? '%' : 'บาท'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Flash End Date Section */}
                <div className="bg-white/80 rounded-lg p-4 border border-orange-100 space-y-3">
                  <p className="text-sm font-medium text-gray-700">วันหมดเวลา Flash (ไม่บังคับ)</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="datetime-local"
                      value={massFlashEndDate}
                      onChange={(e) => setMassFlashEndDate(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    {massFlashEndDate && (
                      <button
                        onClick={() => setMassFlashEndDate('')}
                        className="px-2 py-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="ล้าง"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400">
                    เว้นว่างไว้หากไม่ต้องการเปลี่ยน / กดล้างเพื่อตั้งค่าเป็น &quot;ตามแคมเปญ&quot;
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleMassUpdate}
                    disabled={massUpdating || selectedItemIds.size === 0 || (!massDiscountValue && !massFlashEndDate)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
                  >
                    {massUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    อัปเดต {selectedItemIds.size} รอบเดินทาง
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Items TABLE */}
        {loadingItems ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : saleItems.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>ยังไม่มีรายการ กดปุ่ม &quot;เพิ่มรอบเดินทาง&quot; เพื่อเริ่มต้น</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-600 w-8">#</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">รอบเดินทาง / ทัวร์</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">ราคาปกติ</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">ราคา Flash</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">ส่วนลด</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">ที่นั่ง</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">หมดเวลา Flash</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">สถานะ</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600 w-28">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {saleItems.map((item, idx) => {
                    const isEditTarget = editingItemId === item.id;
                    const isEditingTour = editTourData?.id === item.tour_id;
                    return (
                      <React.Fragment key={item.id}>
                        <tr
                          className={`hover:bg-gray-50 transition ${!item.is_active ? 'opacity-50 bg-gray-50' : ''} ${isEditingTour ? 'bg-blue-50/40' : ''}`}
                        >
                          <td className="px-4 py-3 text-gray-400">{idx + 1}</td>

                          {/* Period + Tour (period-centric) */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {item.tour?.cover_image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.tour.cover_image_url}
                                  alt=""
                                  className="w-10 h-10 rounded object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                                  <Package className="w-4 h-4 text-gray-400" />
                                </div>
                              )}
                              <div className="min-w-0">
                                {item.period ? (
                                  <p className="text-sm font-semibold text-orange-700">
                                    {formatDate(item.period.start_date)} - {formatDate(item.period.end_date)}
                                  </p>
                                ) : (
                                  <p className="text-sm text-gray-400">ไม่ระบุรอบ</p>
                                )}
                                <p className="text-[11px] text-gray-500 truncate max-w-[250px]">
                                  {item.tour?.title || `Tour #${item.tour_id}`}
                                  <span className="text-gray-400 ml-1">{item.tour?.tour_code}</span>
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Original Price */}
                          <td className="px-4 py-3 text-right">
                            <span className="text-gray-600">
                              ฿{Number(item.original_price).toLocaleString()}
                            </span>
                          </td>

                          {/* Flash Price */}
                          <td className="px-4 py-3 text-right">
                            <span className="font-bold text-orange-600">
                              ฿{Number(item.flash_price).toLocaleString()}
                            </span>
                          </td>

                          {/* Discount */}
                          <td className="px-4 py-3 text-center">
                            {item.discount_percent && Number(item.discount_percent) > 0 ? (
                              <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">
                                -{Number(item.discount_percent)}%
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>

                          {/* Seats / Quantity */}
                          <td className="px-4 py-3 text-center">
                            <div className="text-xs">
                              {item.quantity_limit ? (
                                <span className="text-gray-700">
                                  {item.quantity_sold}/{item.quantity_limit}
                                </span>
                              ) : (
                                <span className="text-gray-400">ไม่จำกัด</span>
                              )}
                              {item.period && (
                                <p className="text-[10px] text-gray-400 flex items-center justify-center gap-0.5 mt-0.5">
                                  <Users className="w-3 h-3" />
                                  {item.period.available}/{item.period.capacity}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Flash End Date */}
                          <td className="px-4 py-3">
                            <span className="text-xs text-gray-600">
                              {item.flash_end_date ? formatDateTime(item.flash_end_date) : (
                                <span className="text-gray-400">ตามแคมเปญ</span>
                              )}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {item.is_active ? 'เปิด' : 'ปิด'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-0.5">
                              <button
                                onClick={() => isEditTarget ? closeEditMode() : startEditItem(item)}
                                title={isEditTarget ? 'ยกเลิกแก้ไข' : 'แก้ไขรอบเดินทาง'}
                                className={`p-1.5 rounded-lg transition ${
                                  isEditTarget
                                    ? 'text-blue-600 bg-blue-100'
                                    : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                                }`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleToggleItem(item)}
                                title={item.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                                className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                              >
                                {item.is_active ? (
                                  <Eye className="w-3.5 h-3.5" />
                                ) : (
                                  <EyeOff className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                title="ลบ"
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* ─── Inline Edit: full-tour periods table ─── */}
                        {isEditTarget && (
                          <tr ref={editPanelRef}>
                            <td colSpan={9} className="p-0 bg-blue-50/30">
                              <div className="border-t-2 border-b-2 border-blue-300">
                                {editLoading ? (
                                  <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                    <span className="ml-2 text-gray-500 text-sm">กำลังโหลดรอบเดินทาง...</span>
                                  </div>
                                ) : editTourData && (
                                  <>
                                    {/* Tour header + global controls */}
                                    <div className="bg-orange-50 px-4 py-2 flex items-center justify-between border-b border-orange-200">
                                      <div className="flex items-center gap-3">
                                        {editTourData.cover_image_url ? (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img src={editTourData.cover_image_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                                        ) : (
                                          <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                                            <Package className="w-3.5 h-3.5 text-gray-400" />
                                          </div>
                                        )}
                                        <div>
                                          <p className="font-medium text-sm text-orange-800">{editTourData.title}</p>
                                          <p className="text-[11px] text-orange-600">{editTourData.tour_code} • {editTourData.periods?.length || 0} รอบ</p>
                                        </div>
                                      </div>
                                      <button onClick={closeEditMode} className="p-1 hover:bg-orange-100 rounded" title="ปิด">
                                        <X className="w-4 h-4 text-gray-500" />
                                      </button>
                                    </div>

                                    {/* Global controls */}
                                    <div className="bg-amber-50/70 px-4 py-2 border-b border-orange-100">
                                      <div className="flex flex-wrap items-end gap-3">
                                        <div>
                                          <label className="block text-[11px] text-gray-500 mb-0.5">ส่วนลดรวม (%)</label>
                                          <div className="flex gap-1">
                                            <input
                                              type="number"
                                              value={editGlobalDiscountPercent}
                                              onChange={(e) => setEditGlobalDiscountPercent(e.target.value)}
                                              placeholder="เช่น 20"
                                              min="0" max="100"
                                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                            <button onClick={handleApplyEditGlobalDiscount} className="px-2 py-1 bg-blue-100 text-blue-700 text-[11px] rounded hover:bg-blue-200 whitespace-nowrap">
                                              ใช้กับทั้งหมด
                                            </button>
                                          </div>
                                        </div>
                                        <div>
                                          <label className="block text-[11px] text-gray-500 mb-0.5">วันหมดเวลา Flash รวม</label>
                                          <div className="flex gap-1">
                                            <input
                                              type="datetime-local"
                                              value={editGlobalFlashEndDate}
                                              onChange={(e) => setEditGlobalFlashEndDate(e.target.value)}
                                              className="w-44 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                            <button onClick={handleApplyEditGlobalEndDate} className="px-2 py-1 bg-blue-100 text-blue-700 text-[11px] rounded hover:bg-blue-200 whitespace-nowrap">
                                              ใช้กับทั้งหมด
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Periods sub-table */}
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-sm">
                                        <thead className="bg-gray-50/80 border-b">
                                          <tr>
                                            <th className="px-3 py-1.5 text-left w-10">
                                              <input
                                                type="checkbox"
                                                checked={(() => {
                                                  const newP = Object.entries(editPeriodSettings).filter(([, s]) => !s.isExisting);
                                                  return newP.length > 0 && newP.every(([, s]) => s.checked);
                                                })()}
                                                onChange={(e) => handleEditToggleAllNew(e.target.checked)}
                                                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                                title="เลือก/ยกเลิกรอบใหม่ทั้งหมด"
                                              />
                                            </th>
                                            <th className="px-3 py-1.5 text-left text-[11px] font-medium text-gray-500">วันเดินทาง</th>
                                            <th className="px-3 py-1.5 text-center text-[11px] font-medium text-gray-500">ที่นั่ง</th>
                                            <th className="px-3 py-1.5 text-right text-[11px] font-medium text-gray-500">ราคาปกติ</th>
                                            <th className="px-3 py-1.5 text-center text-[11px] font-medium text-gray-500">ส่วนลด %</th>
                                            <th className="px-3 py-1.5 text-center text-[11px] font-medium text-gray-500">ราคา Flash</th>
                                            <th className="px-3 py-1.5 text-center text-[11px] font-medium text-gray-500">จำกัดที่นั่ง</th>
                                            <th className="px-3 py-1.5 text-center text-[11px] font-medium text-gray-500">หมดเวลา Flash</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                          {editTourData.periods?.map((period) => {
                                            const s = editPeriodSettings[period.id];
                                            if (!s) return null;
                                            return (
                                              <tr key={period.id} className={`${s.isExisting ? 'bg-blue-50/60' : s.checked ? 'bg-green-50/60' : 'hover:bg-gray-50'}`}>
                                                <td className="px-3 py-1.5">
                                                  {s.isExisting ? (
                                                    <span className="text-[10px] bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded font-medium">แก้ไข</span>
                                                  ) : (
                                                    <input type="checkbox" checked={s.checked} onChange={() => handleEditTogglePeriod(period.id)} className="rounded border-gray-300 text-green-500 focus:ring-green-500" />
                                                  )}
                                                </td>
                                                <td className="px-3 py-1.5 text-gray-800 whitespace-nowrap text-sm">
                                                  {formatDate(period.start_date)} - {formatDate(period.end_date)}
                                                </td>
                                                <td className="px-3 py-1.5 text-center text-gray-600 text-xs">
                                                  {period.available}/{period.capacity}
                                                </td>
                                                <td className="px-3 py-1.5 text-right text-gray-700 font-medium whitespace-nowrap text-xs">
                                                  {s.originalPrice ? `฿${s.originalPrice.toLocaleString()}` : '-'}
                                                </td>
                                                <td className="px-3 py-1.5">
                                                  {(s.isExisting || s.checked) && (
                                                    <input type="number" value={s.discountPercent} onChange={(e) => handleEditPeriodDiscountChange(period.id, e.target.value)}
                                                      placeholder="%" min="0" max="100" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                                  )}
                                                </td>
                                                <td className="px-3 py-1.5">
                                                  {(s.isExisting || s.checked) && (
                                                    <input type="number" value={s.flashPrice} onChange={(e) => handleEditPeriodFlashPriceChange(period.id, e.target.value)}
                                                      placeholder="ราคา" className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                                  )}
                                                </td>
                                                <td className="px-3 py-1.5">
                                                  {(s.isExisting || s.checked) && (
                                                    <input type="number" value={s.quantityLimit} onChange={(e) => handleEditPeriodQuantityLimitChange(period.id, e.target.value)}
                                                      placeholder="ไม่จำกัด" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                                  )}
                                                </td>
                                                <td className="px-3 py-1.5">
                                                  {(s.isExisting || s.checked) && (
                                                    <input type="datetime-local" value={s.flashEndDate} onChange={(e) => handleEditPeriodFlashEndDateChange(period.id, e.target.value)}
                                                      className="w-44 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                                  )}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>

                                    {/* Save / Cancel footer */}
                                    <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 flex items-center justify-between">
                                      <p className="text-xs text-blue-600">
                                        {Object.values(editPeriodSettings).filter(s => s.isExisting).length} รอบแก้ไข
                                        {Object.values(editPeriodSettings).filter(s => !s.isExisting && s.checked).length > 0 && (
                                          <span className="ml-1 text-green-600">
                                            + {Object.values(editPeriodSettings).filter(s => !s.isExisting && s.checked).length} รอบใหม่
                                          </span>
                                        )}
                                      </p>
                                      <div className="flex gap-2">
                                        <button onClick={closeEditMode} className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">
                                          ยกเลิก
                                        </button>
                                        <button
                                          onClick={handleSaveEdit}
                                          disabled={saving}
                                          className="flex items-center gap-1 px-4 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm font-medium"
                                        >
                                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                          บันทึกทั้งหมด
                                        </button>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
            จัดการแคมเปญ Flash Sale — กำหนดส่วนลดระดับรอบเดินทาง พร้อม Countdown Timer
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
                      {sale.items_count || 0} รอบเดินทาง
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
                <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-800">รอบเดินทางและส่วนลด</p>
                    <p className="text-xs text-orange-600 mt-0.5">
                      กำหนดส่วนลดแต่ละรอบเดินทางได้ที่หน้าจัดการรายการ
                    </p>
                  </div>
                  <button
                    onClick={() => openItems(selectedSale)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium transition"
                  >
                    <Package className="w-4 h-4" />
                    จัดการรอบเดินทาง
                  </button>
                </div>
              )}

              {modalMode === 'create' && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700">
                    💡 หลังจากสร้าง Flash Sale แล้ว ระบบจะพาไปหน้าเพิ่มรอบเดินทางและกำหนดส่วนลดโดยอัตโนมัติ
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
                  {modalMode === 'create' ? 'สร้าง → จัดการรอบเดินทาง' : 'บันทึก'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
