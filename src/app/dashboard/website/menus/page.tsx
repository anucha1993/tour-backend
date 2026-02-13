'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Input } from '@/components/ui';
import {
  Menu,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  X,
  GripVertical,
  Loader2,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Link2,
  Settings,
  Save,
  Shield,
  CreditCard,
  Headphones,
  AlertTriangle,
  MessageCircle,
} from 'lucide-react';
import { menusApi, MenuItem, footerSettingsApi, FooterConfig, FooterFeature } from '@/lib/api';
import Image from 'next/image';

const LOCATION_LABELS: Record<string, string> = {
  header: 'เมนู Header',
  footer_col1: 'Footer คอลัมน์ 1',
  footer_col2: 'Footer คอลัมน์ 2',
  footer_col3: 'Footer คอลัมน์ 3',
};

const LOCATION_TABS = [
  { key: 'header', label: 'Header' },
  { key: 'footer_col1', label: 'Footer 1' },
  { key: 'footer_col2', label: 'Footer 2' },
  { key: 'footer_col3', label: 'Footer 3' },
  { key: 'footer_settings', label: 'ตั้งค่า Footer' },
];

// Icon mapping for features preview
const FEATURE_ICONS: Record<string, React.ElementType> = {
  Shield, CreditCard, Headphones,
};

const ICON_OPTIONS = [
  { value: 'Shield', label: 'Shield (โล่)' },
  { value: 'CreditCard', label: 'CreditCard (บัตรเครดิต)' },
  { value: 'Headphones', label: 'Headphones (หูฟัง)' },
  { value: 'Phone', label: 'Phone (โทรศัพท์)' },
  { value: 'Mail', label: 'Mail (อีเมล)' },
  { value: 'MapPin', label: 'MapPin (แผนที่)' },
  { value: 'Clock', label: 'Clock (นาฬิกา)' },
  { value: 'Star', label: 'Star (ดาว)' },
  { value: 'Heart', label: 'Heart (หัวใจ)' },
  { value: 'Award', label: 'Award (รางวัล)' },
  { value: 'CheckCircle', label: 'CheckCircle (ถูก)' },
  { value: 'Globe', label: 'Globe (โลก)' },
];

// ==================== Footer Settings Panel ====================
function FooterSettingsPanel() {
  const [footerConfig, setFooterConfig] = useState<FooterConfig | null>(null);
  const [loadingFooter, setLoadingFooter] = useState(true);
  const [savingFooter, setSavingFooter] = useState(false);
  const [footerDirty, setFooterDirty] = useState(false);

  // Form state
  const [newsletterTitle, setNewsletterTitle] = useState('');
  const [newsletterShow, setNewsletterShow] = useState(true);
  const [scamWarningTitle, setScamWarningTitle] = useState('');
  const [scamWarningText, setScamWarningText] = useState('');
  const [scamWarningShow, setScamWarningShow] = useState(true);
  const [companyDescription, setCompanyDescription] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [lineId, setLineId] = useState('');
  const [lineUrl, setLineUrl] = useState('');
  const [lineQrImage, setLineQrImage] = useState('');
  const [uploadingQr, setUploadingQr] = useState(false);
  const [col1Title, setCol1Title] = useState('');
  const [col2Title, setCol2Title] = useState('');
  const [col3Title, setCol3Title] = useState('');
  const [featuresList, setFeaturesList] = useState<FooterFeature[]>([]);

  const fetchFooterConfig = useCallback(async () => {
    setLoadingFooter(true);
    try {
      const response = await footerSettingsApi.get();
      if (response.success && response.data) {
        const data = response.data;
        setFooterConfig(data);
        setNewsletterTitle(data.newsletter_title || '');
        setNewsletterShow(data.newsletter_show ?? true);
        setScamWarningTitle(data.scam_warning_title || '');
        setScamWarningText(data.scam_warning_text || '');
        setScamWarningShow(data.scam_warning_show ?? true);
        setCompanyDescription(data.company_description || '');
        setLicenseNumber(data.license_number || '');
        setLineId(data.line_id || '');
        setLineUrl(data.line_url || '');
        setLineQrImage(data.line_qr_image || '');
        setCol1Title(data.col1_title || '');
        setCol2Title(data.col2_title || '');
        setCol3Title(data.col3_title || '');
        setFeaturesList(data.features || []);
        setFooterDirty(false);
      }
    } catch (error) {
      console.error('Failed to fetch footer config:', error);
    } finally {
      setLoadingFooter(false);
    }
  }, []);

  useEffect(() => {
    fetchFooterConfig();
  }, [fetchFooterConfig]);

  const markDirty = () => setFooterDirty(true);

  const handleSaveFooter = async () => {
    setSavingFooter(true);
    try {
      await footerSettingsApi.update({
        newsletter_title: newsletterTitle,
        newsletter_show: newsletterShow,
        scam_warning_title: scamWarningTitle,
        scam_warning_text: scamWarningText,
        scam_warning_show: scamWarningShow,
        company_description: companyDescription,
        license_number: licenseNumber,
        line_id: lineId,
        line_url: lineUrl,
        col1_title: col1Title,
        col2_title: col2Title,
        col3_title: col3Title,
        features: featuresList,
      });
      setFooterDirty(false);
      alert('บันทึกการตั้งค่า Footer สำเร็จ');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'บันทึกล้มเหลว');
    } finally {
      setSavingFooter(false);
    }
  };

  const addFeature = () => {
    setFeaturesList([...featuresList, { icon: 'Shield', label: '' }]);
    markDirty();
  };

  const removeFeature = (index: number) => {
    setFeaturesList(featuresList.filter((_, i) => i !== index));
    markDirty();
  };

  const updateFeature = (index: number, field: keyof FooterFeature, value: string) => {
    const updated = [...featuresList];
    updated[index] = { ...updated[index], [field]: value };
    setFeaturesList(updated);
    markDirty();
  };

  if (loadingFooter) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Save button bar */}
      <div className="flex items-center justify-between">
        <div className="bg-blue-50 border border-gray-300 rounded-lg px-4 py-3 text-sm text-blue-700 flex-1 mr-4">
          <strong>ตั้งค่า Footer</strong> — จัดการข้อความ, แบนเนอร์เตือน, และแถบคุณสมบัติด้านล่างเว็บไซต์
        </div>
        <Button onClick={handleSaveFooter} disabled={savingFooter || !footerDirty}>
          {savingFooter ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              บันทึกการตั้งค่า
            </>
          )}
        </Button>
      </div>

      {/* Newsletter Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-500" />
            ส่วน Newsletter & LINE
          </h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-gray-600">แสดง</span>
            <button
              type="button"
              onClick={() => { setNewsletterShow(!newsletterShow); markDirty(); }}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                newsletterShow ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  newsletterShow ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </label>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อ Newsletter</label>
            <Input
              value={newsletterTitle}
              onChange={(e) => { setNewsletterTitle(e.target.value); markDirty(); }}
              placeholder="ติดตามเพื่อรับโปรโมชั่น"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LINE ID</label>
              <Input
                value={lineId}
                onChange={(e) => { setLineId(e.target.value); markDirty(); }}
                placeholder="@nexttripholiday"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LINE URL</label>
              <Input
                value={lineUrl}
                onChange={(e) => { setLineUrl(e.target.value); markDirty(); }}
                placeholder="https://line.me/R/ti/p/@nexttripholiday"
              />
            </div>
          </div>

          {/* QR Code Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ภาพ QR Code LINE</label>
            <div className="flex items-start gap-4">
              {lineQrImage ? (
                <div className="relative w-[100px] h-[100px] rounded-lg border border-gray-200 overflow-hidden bg-white flex-shrink-0">
                  <Image
                    src={lineQrImage}
                    alt="LINE QR Code"
                    width={100}
                    height={100}
                    className="w-full h-full object-contain"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => { setLineQrImage(''); markDirty(); }}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    title="ลบภาพ"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-[100px] h-[100px] rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 flex-shrink-0">
                  <MessageCircle className="w-8 h-8" />
                </div>
              )}
              <div className="flex-1">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm font-medium transition-colors">
                  {uploadingQr ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      กำลังอัปโหลด...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      อัปโหลดภาพ QR Code
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingQr}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingQr(true);
                      try {
                        const res = await footerSettingsApi.uploadQrImage(file);
                        if (res.success && res.data) {
                          setLineQrImage(res.data.line_qr_image);
                        } else {
                          alert('อัปโหลดไม่สำเร็จ');
                        }
                      } catch {
                        alert('อัปโหลดไม่สำเร็จ');
                      } finally {
                        setUploadingQr(false);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">รองรับ: JPEG, PNG, WebP (ไม่เกิน 2MB)</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Scam Warning Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            แบนเนอร์เตือนมิจฉาชีพ
          </h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-gray-600">แสดง</span>
            <button
              type="button"
              onClick={() => { setScamWarningShow(!scamWarningShow); markDirty(); }}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                scamWarningShow ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  scamWarningShow ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </label>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อแบนเนอร์</label>
            <Input
              value={scamWarningTitle}
              onChange={(e) => { setScamWarningTitle(e.target.value); markDirty(); }}
              placeholder="ระวัง !! กลุ่มมิจฉาชีพขายทัวร์และบริการอื่นๆ"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ข้อความเตือน</label>
            <textarea
              value={scamWarningText}
              onChange={(e) => { setScamWarningText(e.target.value); markDirty(); }}
              placeholder="โดยแอบอ้างใช้ชื่อบริษัท..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {/* Preview */}
          {scamWarningShow && (
            <div className="border-2 border-yellow-300 bg-yellow-50 rounded-xl px-6 py-4 text-center">
              <p className="text-red-600 font-bold text-sm flex items-center justify-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4" />
                {scamWarningTitle || 'หัวข้อ...'}
              </p>
              <p className="text-gray-600 text-xs leading-relaxed">
                {scamWarningText || 'ข้อความเตือน...'}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Company & License Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-500" />
          ข้อมูลบริษัท
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบายบริษัท</label>
            <textarea
              value={companyDescription}
              onChange={(e) => { setCompanyDescription(e.target.value); markDirty(); }}
              placeholder="บริษัททัวร์ชั้นนำ..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เลขที่ใบอนุญาตนำเที่ยว</label>
            <Input
              value={licenseNumber}
              onChange={(e) => { setLicenseNumber(e.target.value); markDirty(); }}
              placeholder="TAT: 11/07440"
            />
          </div>
        </div>
      </Card>

      {/* Column Titles */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Menu className="w-5 h-5 text-blue-500" />
          หัวข้อคอลัมน์ Footer
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">คอลัมน์ 1</label>
            <Input
              value={col1Title}
              onChange={(e) => { setCol1Title(e.target.value); markDirty(); }}
              placeholder="ทัวร์ยอดนิยม"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">คอลัมน์ 2</label>
            <Input
              value={col2Title}
              onChange={(e) => { setCol2Title(e.target.value); markDirty(); }}
              placeholder="บริษัท"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">คอลัมน์ 3</label>
            <Input
              value={col3Title}
              onChange={(e) => { setCol3Title(e.target.value); markDirty(); }}
              placeholder="ช่วยเหลือ"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          เมนูลิงก์ในแต่ละคอลัมน์จัดการได้ที่แท็บ Footer 1, 2, 3
        </p>
      </Card>

      {/* Features Bar */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            แถบคุณสมบัติ (Features Bar)
          </h3>
          <Button variant="outline" size="sm" onClick={addFeature} disabled={featuresList.length >= 6}>
            <Plus className="w-4 h-4 mr-1" />
            เพิ่ม
          </Button>
        </div>
        {featuresList.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">ยังไม่มีรายการ</p>
        ) : (
          <div className="space-y-3">
            {featuresList.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-400 text-sm font-medium w-6">{index + 1}.</span>
                <select
                  value={feature.icon}
                  onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48"
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <Input
                  value={feature.label}
                  onChange={(e) => updateFeature(index, 'label', e.target.value)}
                  placeholder="ข้อความ..."
                  className="flex-1"
                />
                <button
                  onClick={() => removeFeature(index)}
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  title="ลบ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Features preview */}
        {featuresList.length > 0 && (
          <div className="mt-4 bg-blue-600 rounded-lg p-4">
            <div className="flex flex-wrap justify-center gap-6">
              {featuresList.map((feature, index) => {
                const IconComp = FEATURE_ICONS[feature.icon];
                return (
                  <div key={index} className="flex items-center gap-2 text-white">
                    {IconComp ? <IconComp className="w-5 h-5 text-blue-200" /> : <Shield className="w-5 h-5 text-blue-200" />}
                    <span className="text-sm font-medium">{feature.label || '...'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Bottom save button */}
      {footerDirty && (
        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={handleSaveFooter} disabled={savingFooter} className="shadow-lg">
            {savingFooter ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                บันทึกการตั้งค่า Footer
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function MenuManagementPage() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLocation, setActiveLocation] = useState('header');

  // Create/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formTarget, setFormTarget] = useState('_self');
  const [formIcon, setFormIcon] = useState('');
  const [formParentId, setFormParentId] = useState<string>('');
  const [formCssClass, setFormCssClass] = useState('');
  const [saving, setSaving] = useState(false);

  // Drag and drop
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const fetchMenus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await menusApi.list({ location: activeLocation });
      if (response.success && response.data) {
        setMenus(response.data);
        // Auto-expand all
        const ids = new Set<number>();
        response.data.forEach((m: MenuItem) => {
          if (m.all_children && m.all_children.length > 0) ids.add(m.id);
        });
        setExpandedIds(ids);
      }
    } catch (error) {
      console.error('Failed to fetch menus:', error);
    } finally {
      setLoading(false);
    }
  }, [activeLocation]);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const openCreateModal = (parentId?: number) => {
    setEditItem(null);
    setFormTitle('');
    setFormUrl('');
    setFormTarget('_self');
    setFormIcon('');
    setFormParentId(parentId ? String(parentId) : '');
    setFormCssClass('');
    setShowModal(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditItem(item);
    setFormTitle(item.title);
    setFormUrl(item.url || '');
    setFormTarget(item.target || '_self');
    setFormIcon(item.icon || '');
    setFormParentId(item.parent_id ? String(item.parent_id) : '');
    setFormCssClass(item.css_class || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      alert('กรุณากรอกชื่อเมนู');
      return;
    }
    setSaving(true);
    try {
      const data: Partial<MenuItem> = {
        location: activeLocation as MenuItem['location'],
        title: formTitle,
        url: formUrl || null,
        target: formTarget as '_self' | '_blank',
        icon: formIcon || null,
        parent_id: formParentId ? parseInt(formParentId) : null,
        css_class: formCssClass || null,
      };

      if (editItem) {
        await menusApi.update(editItem.id, data);
      } else {
        await menusApi.create(data);
      }
      setShowModal(false);
      fetchMenus();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'บันทึกล้มเหลว');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: MenuItem) => {
    const childCount = item.all_children?.length || 0;
    const msg = childCount > 0
      ? `ต้องการลบเมนู "${item.title}" และเมนูย่อย ${childCount} รายการ หรือไม่?`
      : `ต้องการลบเมนู "${item.title}" หรือไม่?`;
    if (!confirm(msg)) return;
    try {
      await menusApi.delete(item.id);
      fetchMenus();
    } catch {
      alert('ลบล้มเหลว');
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await menusApi.toggleStatus(id);
      fetchMenus();
    } catch {
      alert('เปลี่ยนสถานะล้มเหลว');
    }
  };

  // Drag & reorder
  const handleDragStart = (id: number) => setDraggedId(id);
  const handleDragEnd = () => setDraggedId(null);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = async (targetId: number) => {
    if (draggedId === null || draggedId === targetId) return;
    const flatList = flattenMenus(menus);
    const dragIndex = flatList.findIndex((m) => m.id === draggedId);
    const dropIndex = flatList.findIndex((m) => m.id === targetId);
    if (dragIndex === -1 || dropIndex === -1) return;

    const [dragged] = flatList.splice(dragIndex, 1);
    flatList.splice(dropIndex, 0, dragged);

    try {
      await menusApi.reorder(
        flatList.map((m, i) => ({ id: m.id, sort_order: i + 1, parent_id: m.parent_id }))
      );
      fetchMenus();
    } catch {
      fetchMenus();
    }
    setDraggedId(null);
  };

  const flattenMenus = (items: MenuItem[]): MenuItem[] => {
    const flat: MenuItem[] = [];
    items.forEach((item) => {
      flat.push(item);
      if (item.all_children) {
        flat.push(...flattenMenus(item.all_children));
      }
    });
    return flat;
  };

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Get root-level items for parent select
  const rootMenus = menus.filter((m) => !m.parent_id);

  const renderMenuItem = (item: MenuItem, depth = 0) => {
    const hasChildren = item.all_children && item.all_children.length > 0;
    const isExpanded = expandedIds.has(item.id);

    return (
      <div key={item.id}>
        <div
          className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-300 ${
            draggedId === item.id ? 'opacity-50' : ''
          }`}
          style={{ paddingLeft: `${16 + depth * 32}px` }}
          draggable
          onDragStart={() => handleDragStart(item.id)}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(item.id)}
        >
          <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
            <GripVertical className="w-4 h-4" />
          </div>

          {hasChildren ? (
            <button
              onClick={() => toggleExpand(item.id)}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}

          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{item.title}</span>
              {item.url && (
                <span className="text-xs text-gray-400 flex items-center gap-1 truncate max-w-[200px]">
                  <Link2 className="w-3 h-3" />
                  {item.url}
                </span>
              )}
              {item.target === '_blank' && (
                <ExternalLink className="w-3 h-3 text-gray-400" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {activeLocation === 'header' && (
              <button
                onClick={() => openCreateModal(item.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-blue-500 transition-colors"
                title="เพิ่มเมนูย่อย"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleToggleStatus(item.id)}
              className={`p-1.5 rounded-lg transition-colors ${
                item.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'
              }`}
              title={item.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
            >
              {item.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => openEditModal(item)}
              className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
              title="แก้ไข"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(item)}
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
              title="ลบ"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {item.all_children!.map((child) => renderMenuItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // ==================== Footer Settings Tab Check ====================
  const isFooterSettings = activeLocation === 'footer_settings';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการเมนู</h1>
          <p className="text-gray-600 mt-1">จัดการเมนู Header และ Footer ของเว็บไซต์</p>
        </div>
        {!isFooterSettings && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchMenus} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </Button>
            <Button onClick={() => openCreateModal()}>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มเมนู
            </Button>
          </div>
        )}
      </div>

      {/* Location Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {LOCATION_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveLocation(tab.key)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeLocation === tab.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.key === 'footer_settings' && <Settings className="w-4 h-4 inline mr-1" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Footer Settings Panel */}
      {isFooterSettings ? (
        <FooterSettingsPanel />
      ) : (
        <>
          {/* Info */}
          <div className="bg-blue-50 border border-gray-300 rounded-lg px-4 py-3 text-sm text-blue-700">
            <strong>{LOCATION_LABELS[activeLocation]}</strong>
            {activeLocation === 'header' && ' — เมนูด้านบนของเว็บไซต์ รองรับเมนูย่อย (submenu)'}
            {activeLocation.startsWith('footer') && ' — เมนูด้านล่างของเว็บไซต์'}
          </div>

          {/* Menu List */}
          <Card className="overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : menus.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Menu className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>ยังไม่มีเมนูใน {LOCATION_LABELS[activeLocation]}</p>
                <Button onClick={() => openCreateModal()} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่มเมนูแรก
                </Button>
              </div>
            ) : (
              <div>{menus.map((item) => renderMenuItem(item))}</div>
            )}
          </Card>

          {/* Create/Edit Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
                <div className="flex items-center justify-between p-6 border-b border-gray-300">
                  <h2 className="text-lg font-semibold">
                    {editItem ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}
                  </h2>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ชื่อเมนู <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="เช่น ทัวร์ต่างประเทศ"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL ลิงก์</label>
                    <Input
                      value={formUrl}
                      onChange={(e) => setFormUrl(e.target.value)}
                      placeholder="/tours/international หรือ https://..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">เปิดลิงก์</label>
                      <select
                        value={formTarget}
                        onChange={(e) => setFormTarget(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="_self">หน้าเดียวกัน</option>
                        <option value="_blank">แท็บใหม่</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ไอคอน</label>
                      <Input
                        value={formIcon}
                        onChange={(e) => setFormIcon(e.target.value)}
                        placeholder="ชื่อไอคอน (ไม่บังคับ)"
                      />
                    </div>
                  </div>
                  {activeLocation === 'header' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">เมนูหลัก (สำหรับ submenu)</label>
                      <select
                        value={formParentId}
                        onChange={(e) => setFormParentId(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="">-- เมนูระดับบนสุด --</option>
                        {rootMenus
                          .filter((m) => m.id !== editItem?.id)
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.title}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CSS Class (ไม่บังคับ)</label>
                    <Input
                      value={formCssClass}
                      onChange={(e) => setFormCssClass(e.target.value)}
                      placeholder="custom-class"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 p-6 border-t border-gray-300">
                  <Button variant="outline" onClick={() => setShowModal(false)}>
                    ยกเลิก
                  </Button>
                  <Button onClick={handleSave} disabled={saving || !formTitle.trim()}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        กำลังบันทึก...
                      </>
                    ) : (
                      'บันทึก'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
