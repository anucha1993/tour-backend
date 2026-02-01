'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  MapPin,
  Search,
  Building2,
  X,
  Plane,
} from 'lucide-react';
import Link from 'next/link';
import { 
  toursApi, 
  countriesApi,
  citiesApi,
  wholesalersApi,
  transportsApi,
  Country,
  City,
  Wholesaler,
  TOUR_TYPES,
} from '@/lib/api';

export default function CreateTourPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [wholesalers, setWholesalers] = useState<Wholesaler[]>([]);
  const [transports, setTransports] = useState<{ id: number; code: string; name: string; type: string; image?: string }[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // Country/City search state
  const [countrySearch, setCountrySearch] = useState('');
  const [citiesByCountry, setCitiesByCountry] = useState<Record<number, City[]>>({});
  const [loadingCities, setLoadingCities] = useState<number | null>(null);
  const [transportSearch, setTransportSearch] = useState('');
  const [showTransportDropdown, setShowTransportDropdown] = useState(false);

  // Form state - minimal for quick create
  const [formData, setFormData] = useState({
    wholesaler_id: '',
    title: '',
    tour_type: 'join' as 'join' | 'incentive' | 'collective',
    country_ids: [] as number[],
    city_ids: [] as number[],
    duration_days: 5,
    duration_nights: 4,
    hotel_star: 4,
    transport_id: '',
    status: 'draft' as 'draft' | 'active' | 'inactive',
  });

  // Load countries, wholesalers, transports
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [countriesRes, wholesalersRes, transportsRes] = await Promise.all([
          countriesApi.list({ is_active: 'true', per_page: '250' }),
          wholesalersApi.list({ is_active: 'true' }),
          transportsApi.list({ status: 'on', per_page: '100' }),
        ]);
        
        if (countriesRes.success) {
          setCountries(countriesRes.data || []);
        }
        if (wholesalersRes.success) {
          setWholesalers(wholesalersRes.data || []);
        }
        if (transportsRes.success && transportsRes.data) {
          setTransports(transportsRes.data.map(t => ({ id: t.id, code: t.code, name: t.name, type: t.type, image: t.image ?? undefined })));
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // Close transport dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-transport-dropdown]')) {
        setShowTransportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  const handleCountryToggle = async (countryId: number) => {
    const isAdding = !formData.country_ids.includes(countryId);
    
    setFormData(prev => ({
      ...prev,
      country_ids: prev.country_ids.includes(countryId)
        ? prev.country_ids.filter(id => id !== countryId)
        : [...prev.country_ids, countryId],
      // Remove cities of this country when deselecting
      city_ids: prev.country_ids.includes(countryId)
        ? prev.city_ids.filter(cid => {
            const city = Object.values(citiesByCountry).flat().find(c => c.id === cid);
            return city ? city.country_id !== countryId : true;
          })
        : prev.city_ids,
    }));

    // Fetch cities for the country when adding
    if (isAdding && !citiesByCountry[countryId]) {
      setLoadingCities(countryId);
      try {
        const res = await citiesApi.list({ country_id: countryId.toString(), is_active: 'true', per_page: '100' });
        if (res.success) {
          setCitiesByCountry(prev => ({ ...prev, [countryId]: res.data || [] }));
        }
      } catch (err) {
        console.error('Failed to fetch cities:', err);
      } finally {
        setLoadingCities(null);
      }
    }
  };

  const handleCityToggle = (cityId: number) => {
    setFormData(prev => ({
      ...prev,
      city_ids: prev.city_ids.includes(cityId)
        ? prev.city_ids.filter(id => id !== cityId)
        : [...prev.city_ids, cityId],
    }));
  };

  // Filter countries by search
  const filteredCountries = countries.filter(country => {
    if (!countrySearch) return true;
    const search = countrySearch.toLowerCase();
    return (
      country.name_en.toLowerCase().includes(search) ||
      (country.name_th && country.name_th.toLowerCase().includes(search)) ||
      country.iso2.toLowerCase().includes(search)
    );
  });

  // Filter transports
  const filteredTransports = transports.filter(t => {
    if (!transportSearch) return true;
    const search = transportSearch.toLowerCase();
    return t.code.toLowerCase().includes(search) || t.name.toLowerCase().includes(search);
  });

  const selectedTransport = transports.find(t => t.id.toString() === formData.transport_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.country_ids.length === 0) {
      setErrors({ country_ids: ['กรุณาเลือกประเทศอย่างน้อย 1 ประเทศ'] });
      return;
    }

    if (!formData.title.trim()) {
      setErrors({ title: ['กรุณากรอกชื่อทัวร์'] });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const payload = {
        ...formData,
        wholesaler_id: parseInt(formData.wholesaler_id) || undefined,
        transport_id: parseInt(formData.transport_id) || undefined,
      };

      const response = await toursApi.create(payload);
      
      if (response.success && response.data) {
        // Redirect to edit page for full details
        router.push(`/dashboard/tours/${response.data.id}/edit`);
      } else {
        setErrors(response.errors || { general: [response.message || 'Failed to create tour'] });
      }
    } catch (err: unknown) {
      console.error('Create tour error:', err);
      const error = err as { errors?: Record<string, string[]>; message?: string };
      setErrors(error.errors || { general: [error.message || 'Failed to create tour'] });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/tours">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">เพิ่มทัวร์ใหม่</h1>
          <p className="text-gray-500 text-sm">กรอกข้อมูลพื้นฐาน แล้วไปแก้ไขรายละเอียดเพิ่มเติมในหน้าถัดไป</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-6">
          {/* Wholesaler */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Building2 className="w-4 h-4 inline mr-1" /> โฮลเซลเลอร์
            </label>
            <select
              name="wholesaler_id"
              value={formData.wholesaler_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">เลือกโฮลเซลเลอร์</option>
              {wholesalers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อทัวร์ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="ทัวร์ญี่ปุ่น โตเกียว ฟูจิ โอซาก้า 6 วัน 4 คืน"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title[0]}</p>}
          </div>

          {/* Tour Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ประเภททัวร์</label>
            <select
              name="tour_type"
              value={formData.tour_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(TOUR_TYPES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนวัน</label>
              <input
                type="number"
                name="duration_days"
                value={formData.duration_days}
                onChange={handleNumberChange}
                min={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนคืน</label>
              <input
                type="number"
                name="duration_nights"
                value={formData.duration_nights}
                onChange={handleNumberChange}
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Hotel Star */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ระดับโรงแรม (ดาว)</label>
            <select
              name="hotel_star"
              value={formData.hotel_star}
              onChange={(e) => setFormData(prev => ({ ...prev, hotel_star: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={3}>3 ดาว</option>
              <option value={4}>4 ดาว</option>
              <option value={5}>5 ดาว</option>
            </select>
          </div>

          {/* Transport */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Plane className="w-4 h-4 inline mr-1" /> สายการบิน
            </label>
            <div className="relative" data-transport-dropdown>
              <div
                onClick={() => setShowTransportDropdown(!showTransportDropdown)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer flex items-center justify-between hover:border-gray-400"
              >
                {selectedTransport ? (
                  <div className="flex items-center gap-2">
                    {selectedTransport.image && (
                      <img src={selectedTransport.image} alt="" className="w-6 h-6 object-contain" />
                    )}
                    <span>{selectedTransport.code} - {selectedTransport.name}</span>
                  </div>
                ) : (
                  <span className="text-gray-400">เลือกสายการบิน</span>
                )}
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              
              {showTransportDropdown && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
                  <div className="p-2 border-b sticky top-0 bg-white">
                    <input
                      type="text"
                      value={transportSearch}
                      onChange={(e) => setTransportSearch(e.target.value)}
                      placeholder="ค้นหาสายการบิน..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, transport_id: '' }));
                        setShowTransportDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm text-gray-500"
                    >
                      ไม่ระบุ
                    </button>
                    {filteredTransports.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, transport_id: t.id.toString() }));
                          setShowTransportDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-blue-50 rounded flex items-center gap-2 ${
                          formData.transport_id === t.id.toString() ? 'bg-blue-50 text-blue-700' : ''
                        }`}
                      >
                        {t.image && (
                          <img src={t.image} alt="" className="w-6 h-6 object-contain" />
                        )}
                        <span className="font-medium">{t.code}</span>
                        <span className="text-gray-500 text-sm">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Countries & Cities */}
        <Card className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <MapPin className="w-4 h-4 inline mr-1" /> ประเทศและเมือง <span className="text-red-500">*</span>
          </label>
          
          {/* Country search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              placeholder="ค้นหาประเทศ..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Selected countries with cities */}
          {formData.country_ids.length > 0 && (
            <div className="mb-4 space-y-3">
              {formData.country_ids.map(countryId => {
                const country = countries.find(c => c.id === countryId);
                const cities = citiesByCountry[countryId] || [];
                return (
                  <div key={countryId} className="border border-blue-200 bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 font-medium text-blue-700">
                        {country?.iso2 && (
                          <img
                            src={`https://flagcdn.com/w40/${country.iso2.toLowerCase()}.png`}
                            alt=""
                            className="w-6 h-4 object-cover rounded shadow-sm"
                          />
                        )}
                        <span>{country?.name_th || country?.name_en}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCountryToggle(countryId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {loadingCities === countryId ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" /> กำลังโหลดเมือง...
                      </div>
                    ) : cities.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {cities.map(city => (
                          <button
                            key={city.id}
                            type="button"
                            onClick={() => handleCityToggle(city.id)}
                            className={`px-3 py-1 rounded-full text-sm transition-colors ${
                              formData.city_ids.includes(city.id)
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-blue-100'
                            }`}
                          >
                            {city.name_th || city.name_en}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">ไม่มีเมืองในระบบ</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Country list */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
            {filteredCountries.slice(0, 50).map((country) => (
              <button
                key={country.id}
                type="button"
                onClick={() => handleCountryToggle(country.id)}
                disabled={formData.country_ids.includes(country.id)}
                className={`px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                  formData.country_ids.includes(country.id)
                    ? 'bg-blue-100 text-blue-700 cursor-default'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <img
                    src={`https://flagcdn.com/w40/${country.iso2.toLowerCase()}.png`}
                    alt=""
                    className="w-5 h-3.5 object-cover rounded shadow-sm"
                  />
                  <span>{country.name_th || country.name_en}</span>
                </div>
              </button>
            ))}
          </div>
          {errors.country_ids && <p className="text-red-500 text-sm mt-2">{errors.country_ids[0]}</p>}
        </Card>

        {/* Error */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {errors.general[0]}
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-4 pt-4">
          <Link href="/dashboard/tours">
            <Button variant="outline" type="button">ยกเลิก</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                สร้างทัวร์และไปหน้าแก้ไข
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
