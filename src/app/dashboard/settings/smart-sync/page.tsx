'use client';

import { useState, useEffect } from 'react';
import { Button, Card } from '@/components/ui';
import {
  ArrowLeft,
  Save,
  Loader2,
  Shield,
  Clock,
  Plus,
  X,
  Play,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { systemSettingsApi, type SyncSettings, type AutoCloseSettings } from '@/lib/api';

export default function SmartSyncSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingSync, setSavingSync] = useState(false);
  const [savingAutoClose, setSavingAutoClose] = useState(false);
  const [runningAutoClose, setRunningAutoClose] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sync Settings
  const [syncSettings, setSyncSettings] = useState<SyncSettings>({
    respect_manual_overrides: true,
    always_sync_fields: [],
    never_sync_fields: [],
    skip_past_periods: true,
    skip_disabled_tours: true,
  });

  // Auto-Close Settings
  const [autoCloseSettings, setAutoCloseSettings] = useState<AutoCloseSettings>({
    enabled: false,
    periods: true,
    tours: true,
    threshold_days: 0,
    run_time: '01:00',
  });

  // Field input states
  const [newAlwaysSyncField, setNewAlwaysSyncField] = useState('');
  const [newNeverSyncField, setNewNeverSyncField] = useState('');

  // Load settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const [syncRes, autoCloseRes] = await Promise.all([
          systemSettingsApi.getSyncSettings(),
          systemSettingsApi.getAutoCloseSettings(),
        ]);

        if (syncRes.success && syncRes.data) {
          setSyncSettings(syncRes.data);
        }
        if (autoCloseRes.success && autoCloseRes.data) {
          setAutoCloseSettings(autoCloseRes.data);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        setError('ไม่สามารถโหลดการตั้งค่าได้');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Save Sync Settings
  const handleSaveSync = async () => {
    setSavingSync(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await systemSettingsApi.updateSyncSettings(syncSettings);
      if (result.success) {
        setSuccess('บันทึกการตั้งค่า Sync สำเร็จ');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || 'ไม่สามารถบันทึกการตั้งค่าได้');
      }
    } catch (err) {
      console.error('Failed to save sync settings:', err);
      setError('ไม่สามารถบันทึกการตั้งค่า Sync ได้');
    } finally {
      setSavingSync(false);
    }
  };

  // Save Auto-Close Settings
  const handleSaveAutoClose = async () => {
    setSavingAutoClose(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await systemSettingsApi.updateAutoCloseSettings(autoCloseSettings);
      if (result.success) {
        setSuccess('บันทึกการตั้งค่า Auto-Close สำเร็จ');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || 'ไม่สามารถบันทึกการตั้งค่าได้');
      }
    } catch (err) {
      console.error('Failed to save auto-close settings:', err);
      setError('ไม่สามารถบันทึกการตั้งค่า Auto-Close ได้');
    } finally {
      setSavingAutoClose(false);
    }
  };

  // Run Auto-Close manually
  const handleRunAutoClose = async () => {
    if (!confirm('ต้องการรันการปิดรอบเดินทาง/ทัวร์ที่หมดอายุหรือไม่?\n\nระบบจะ:\n- ปิดรอบเดินทางที่วันเดินทางผ่านไปแล้ว\n- ปิดทัวร์ที่ไม่มีรอบเดินทางที่เปิดอยู่')) return;

    setRunningAutoClose(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await systemSettingsApi.runAutoClose();
      if (result.success && result.data) {
        setSuccess(`ปิดรอบเดินทาง/ทัวร์สำเร็จ - รอบเดินทาง: ${result.data.periods_closed}, ทัวร์: ${result.data.tours_closed}`);
      } else {
        setError(result.message || 'ไม่สามารถรันการปิดได้');
      }
    } catch (err) {
      console.error('Failed to run auto-close:', err);
      setError('ไม่สามารถรันการปิดรอบเดินทาง/ทัวร์ได้');
    } finally {
      setRunningAutoClose(false);
    }
  };

  // Add field to always sync
  const addAlwaysSyncField = () => {
    const field = newAlwaysSyncField.trim();
    if (field && !syncSettings.always_sync_fields.includes(field)) {
      setSyncSettings(prev => ({
        ...prev,
        always_sync_fields: [...prev.always_sync_fields, field],
      }));
      setNewAlwaysSyncField('');
    }
  };

  // Add field to never sync
  const addNeverSyncField = () => {
    const field = newNeverSyncField.trim();
    if (field && !syncSettings.never_sync_fields.includes(field)) {
      setSyncSettings(prev => ({
        ...prev,
        never_sync_fields: [...prev.never_sync_fields, field],
      }));
      setNewNeverSyncField('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
          <p className="mt-2 text-gray-500">กำลังโหลดการตั้งค่า...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Smart Sync Settings</h1>
          <p className="text-gray-500">ตั้งค่าการ Sync อัจฉริยะและปิดอัตโนมัติ (Global Settings)</p>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sync Settings Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Smart Sync</h2>
            </div>
            <Button onClick={handleSaveSync} disabled={savingSync}>
              {savingSync ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              บันทึก
            </Button>
          </div>
          <p className="text-sm text-gray-500 mb-6">ป้องกันการเขียนทับข้อมูลที่แก้ไขด้วยมือ</p>

          <div className="space-y-6">
            {/* Respect Manual Overrides */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-blue-800">ข้ามเมื่อถูกแก้ไขด้วยมือ</h3>
                  <p className="text-sm text-blue-600 mt-1">
                    ฟิลด์ที่ Admin แก้ไขด้วยมือจะไม่ถูกเขียนทับจาก API
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncSettings.respect_manual_overrides}
                    onChange={(e) => setSyncSettings(prev => ({ ...prev, respect_manual_overrides: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Always Sync Fields */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-800 mb-2">ฟิลด์ที่ Sync ทุกครั้ง</h3>
              <p className="text-sm text-green-600 mb-3">
                ฟิลด์เหล่านี้จะถูก update ทุกรอบ sync แม้ว่าจะถูกแก้ไขด้วยมือ
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {syncSettings.always_sync_fields.map((field, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                    {field}
                    <button
                      type="button"
                      onClick={() => setSyncSettings(prev => ({
                        ...prev,
                        always_sync_fields: prev.always_sync_fields.filter((_, i) => i !== idx)
                      }))}
                      className="text-green-500 hover:text-green-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ชื่อฟิลด์ เช่น cover_image_url"
                  value={newAlwaysSyncField}
                  onChange={(e) => setNewAlwaysSyncField(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAlwaysSyncField())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                />
                <Button variant="outline" size="sm" onClick={addAlwaysSyncField} className="text-green-600 border-green-300">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Never Sync Fields */}
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h3 className="font-medium text-red-800 mb-2">ฟิลด์ที่ไม่ Sync เลย</h3>
              <p className="text-sm text-red-600 mb-3">
                ฟิลด์เหล่านี้จะไม่ถูก update จาก API ไม่ว่ากรณีใดๆ
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {syncSettings.never_sync_fields.map((field, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-sm rounded-full">
                    {field}
                    <button
                      type="button"
                      onClick={() => setSyncSettings(prev => ({
                        ...prev,
                        never_sync_fields: prev.never_sync_fields.filter((_, i) => i !== idx)
                      }))}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ชื่อฟิลด์ เช่น status"
                  value={newNeverSyncField}
                  onChange={(e) => setNewNeverSyncField(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addNeverSyncField())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                />
                <Button variant="outline" size="sm" onClick={addNeverSyncField} className="text-red-600 border-red-300">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Skip Settings */}
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h3 className="font-medium text-amber-800 mb-4">ข้ามการ Sync</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">ข้ามรอบเดินทางที่ผ่านไปแล้ว</p>
                    <p className="text-xs text-gray-500">ไม่สร้าง/อัปเดต Period ที่วันเดินทางผ่านไปแล้ว</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncSettings.skip_past_periods}
                      onChange={(e) => setSyncSettings(prev => ({ ...prev, skip_past_periods: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">ข้ามทัวร์ที่ปิดใช้งาน</p>
                    <p className="text-xs text-gray-500">ไม่อัปเดตทัวร์ที่มี status = disabled หรือ closed</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncSettings.skip_disabled_tours}
                      onChange={(e) => setSyncSettings(prev => ({ ...prev, skip_disabled_tours: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Auto-Close Settings Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold">Auto-Close</h2>
            </div>
            <Button onClick={handleSaveAutoClose} disabled={savingAutoClose}>
              {savingAutoClose ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              บันทึก
            </Button>
          </div>
          <p className="text-sm text-gray-500 mb-6">ปิดรอบเดินทาง/ทัวร์ที่หมดอายุอัตโนมัติ</p>

          <div className="space-y-6">
            {/* Enable Auto-Close */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-purple-800">เปิดใช้งาน Auto-Close</h3>
                  <p className="text-sm text-purple-600 mt-1">
                    ระบบจะตรวจสอบและปิดรอบเดินทาง/ทัวร์ที่หมดอายุอัตโนมัติ
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCloseSettings.enabled}
                    onChange={(e) => setAutoCloseSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>

            {autoCloseSettings.enabled && (
              <>
                {/* Close Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">ปิดรอบเดินทางที่หมดอายุ</p>
                      <p className="text-xs text-gray-500">เปลี่ยนสถานะ Period เป็น Closed</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoCloseSettings.periods}
                        onChange={(e) => setAutoCloseSettings(prev => ({ ...prev, periods: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">ปิดทัวร์เมื่อรอบเดินทางหมด</p>
                      <p className="text-xs text-gray-500">เปลี่ยนสถานะ Tour เป็น Closed</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoCloseSettings.tours}
                        onChange={(e) => setAutoCloseSettings(prev => ({ ...prev, tours: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>

                {/* Threshold Days */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    จำนวนวันก่อนถือว่าหมดอายุ
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={autoCloseSettings.threshold_days}
                    onChange={(e) => setAutoCloseSettings(prev => ({ ...prev, threshold_days: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    0 = วันนี้เป็นเกณฑ์, 7 = รอบที่เดินทาง 7 วันก่อนหน้ายังถือว่าไม่ผ่าน
                  </p>
                </div>

                {/* Run Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เวลาที่รัน Auto-Close
                  </label>
                  <input
                    type="time"
                    value={autoCloseSettings.run_time}
                    onChange={(e) => setAutoCloseSettings(prev => ({ ...prev, run_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    รันอัตโนมัติทุกวันตามเวลาที่กำหนด
                  </p>
                </div>

                {/* Run Now Button */}
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={handleRunAutoClose}
                    disabled={runningAutoClose}
                    className="w-full text-purple-600 border-purple-300 hover:bg-purple-50"
                  >
                    {runningAutoClose ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        กำลังประมวลผล...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        รันปิดรอบเดินทาง/ทัวร์เดี๋ยวนี้
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    คลิกเพื่อรันการปิดรอบเดินทาง/ทัวร์ที่หมดอายุทันที
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Info Box */}
      <Card className="p-6 bg-gray-50">
        <h3 className="font-medium text-gray-800 mb-3">วิธีการทำงาน</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" />
              Smart Sync
            </h4>
            <ul className="space-y-1">
              <li>• เมื่อ Admin แก้ไขฟิลด์ใดๆ ระบบจะบันทึกลงใน manual_override_fields</li>
              <li>• เมื่อ Sync ระบบจะตรวจสอบฟิลด์นี้ก่อน update</li>
              <li>• ถ้าฟิลด์ถูก override จะข้าม (ยกเว้นฟิลด์ใน always_sync_fields)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500" />
              Auto-Close
            </h4>
            <ul className="space-y-1">
              <li>• ระบบจะตรวจสอบและปิด Period/Tour ที่หมดอายุอัตโนมัติ</li>
              <li>• รันตามเวลาที่กำหนด หรือรันด้วยมือได้</li>
              <li>• เป็น Global Setting ใช้กับทุก Integration</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
