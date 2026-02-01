'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Card } from '@/components/ui';
import {
  ArrowLeft, 
  Save, 
  Loader2, 
  Star,
  MapPin,
  ShoppingBag,
  Utensils,
  Sparkles,
  Hash,
  FileText,
  Search,
  X,
  Calendar,
  Plus,
  Upload,
  ImageIcon,
  Globe,
  Tag,
  Info,
  Trash2,
  Eye,
  Check,
  Edit,
  Clock,
  Plane,
  Building2,
  ChevronRight,
  Code,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { 
  toursApi, 
  countriesApi,
  citiesApi,
  wholesalersApi,
  periodsApi,
  promotionsApi,
  transportsApi,
  galleryApi,
  itinerariesApi,
  Country,
  City,
  Wholesaler,
  Tour,
  Period,
  Promotion,
  TourItinerary as ApiTourItinerary,
  TOUR_BADGES,
  TOUR_STATUS,
  TOUR_TYPES,
  SALE_STATUS,
  PROMOTION_TYPES,
} from '@/lib/api';
import { getTravelDateRange } from '@/lib/date-utils';
import RichTextEditor from '@/components/RichTextEditor';

// Predefined tour categories
const TOUR_CATEGORIES = [
  'ทะเล/ชายหาด',
  'ภูเขา/ธรรมชาติ',
  'วัฒนธรรม/ประวัติศาสตร์',
  'สวนสนุก',
  'หิมะ/สกี',
  'ชิมอาหาร',
  'ช้อปปิ้ง',
  'ฮันนีมูน',
  'ครอบครัว',
  'ผจญภัย',
  'เมืองโบราณ',
  'เทศกาล',
  'ซากุระ',
  'ใบไม้เปลี่ยนสี',
];

// Tab definitions
const TABS = [
  { id: 'basic', label: 'ข้อมูลพื้นฐาน', icon: Info },
  { id: 'location', label: 'สถานที่', icon: MapPin },
  { id: 'periods', label: 'รอบเดินทาง', icon: Calendar },
  { id: 'itinerary', label: 'โปรแกรมรายวัน', icon: FileText },
  { id: 'media', label: 'สื่อและการตลาด', icon: ImageIcon },
  { id: 'seo', label: 'SEO', icon: Globe },
  { id: 'view', label: 'ตัวอย่าง', icon: Eye },
  { id: 'json', label: 'JSON', icon: Code },
] as const;

type TabId = typeof TABS[number]['id'];

// Itinerary interface
interface TourItinerary {
  id?: number;
  tour_id?: number;
  day_number: number;
  title: string;
  description: string;
  places: string[];
  has_breakfast: boolean;
  has_lunch: boolean;
  has_dinner: boolean;
  meals_note: string;
  accommodation: string;
  hotel_star: number | null;
  images: string[];
}

// Period form interface
interface PeriodFormData {
  start_date: string;
  end_date: string;
  capacity: number;
  booked: number;
  status: string;
  is_visible: boolean;
  sale_status: string;
  price_adult: string;
  discount_adult: string;
  price_single_surcharge: string;
  discount_single: string;
  price_child: string;
  discount_child_bed: string;
  price_child_nobed: string;
  discount_child_nobed: string;
  promo_name: string;
  promo_start_date: string;
  promo_end_date: string;
  promo_quota: string;
  deposit: string;
  cancellation_policy: string;
}

const emptyPeriodForm: PeriodFormData = {
  start_date: '',
  end_date: '',
  capacity: 30,
  booked: 0,
  status: 'open',
  is_visible: true,
  sale_status: 'available',
  price_adult: '',
  discount_adult: '0',
  price_single_surcharge: '',
  discount_single: '0',
  price_child: '',
  discount_child_bed: '0',
  price_child_nobed: '',
  discount_child_nobed: '0',
  promo_name: '',
  promo_start_date: '',
  promo_end_date: '',
  promo_quota: '',
  deposit: '',
  cancellation_policy: 'สามารถยกเลิกได้ภายใน 30 วันก่อนเดินทาง',
};

// ItineraryEditForm component
interface ItineraryEditFormProps {
  itinerary: TourItinerary;
  onSave: (itinerary: TourItinerary) => void;
  onCancel: () => void;
  saving: boolean;
  placeInput: string;
  setPlaceInput: (value: string) => void;
  onAddPlace: (itinerary: TourItinerary, setItinerary: (i: TourItinerary) => void) => void;
  onRemovePlace: (itinerary: TourItinerary, setItinerary: (i: TourItinerary) => void, index: number) => void;
  isNew?: boolean;
}

function ItineraryEditForm({ 
  itinerary: initialItinerary, 
  onSave, 
  onCancel, 
  saving,
  placeInput,
  setPlaceInput,
  onAddPlace,
  onRemovePlace,
  isNew = false 
}: ItineraryEditFormProps) {
  const [itinerary, setItinerary] = useState<TourItinerary>(initialItinerary);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-teal-500 text-white rounded-lg flex flex-col items-center justify-center">
          <span className="text-xs">วันที่</span>
          <input
            type="number"
            value={itinerary.day_number}
            onChange={(e) => setItinerary({ ...itinerary, day_number: parseInt(e.target.value) || 1 })}
            className="w-8 bg-transparent text-center text-lg font-bold border-none focus:outline-none"
            min={1}
          />
        </div>
        <input
          type="text"
          value={itinerary.title}
          onChange={(e) => setItinerary({ ...itinerary, title: e.target.value })}
          placeholder="หัวข้อวัน เช่น สนามบินสุวรรณภูมิ-ศาลเจ้าดาไซฟุ"
          className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
      </div>

      {/* Places */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">สถานที่เที่ยว</label>
        <div className="flex flex-wrap gap-1 mb-2">
          {itinerary.places.map((place, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-700 text-sm rounded-full">
              {place}
              <button 
                type="button" 
                onClick={() => onRemovePlace(itinerary, setItinerary, i)}
                className="hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={placeInput}
            onChange={(e) => setPlaceInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onAddPlace(itinerary, setItinerary);
              }
            }}
            placeholder="พิมพ์ชื่อสถานที่แล้ว Enter"
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />
          <Button type="button" variant="outline" size="sm" onClick={() => onAddPlace(itinerary, setItinerary)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Meals */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">มื้ออาหาร</label>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={itinerary.has_breakfast}
              onChange={(e) => setItinerary({ ...itinerary, has_breakfast: e.target.checked })}
              className="w-4 h-4 text-teal-500 rounded"
            />
            <span className="text-sm">เช้า</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={itinerary.has_lunch}
              onChange={(e) => setItinerary({ ...itinerary, has_lunch: e.target.checked })}
              className="w-4 h-4 text-teal-500 rounded"
            />
            <span className="text-sm">กลางวัน</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={itinerary.has_dinner}
              onChange={(e) => setItinerary({ ...itinerary, has_dinner: e.target.checked })}
              className="w-4 h-4 text-teal-500 rounded"
            />
            <span className="text-sm">เย็น</span>
          </label>
          <input
            type="text"
            value={itinerary.meals_note}
            onChange={(e) => setItinerary({ ...itinerary, meals_note: e.target.value })}
            placeholder="หมายเหตุอาหาร"
            className="flex-1 px-3 py-1 border rounded-lg text-sm min-w-[150px]"
          />
        </div>
      </div>

      {/* Accommodation */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ที่พัก</label>
          <input
            type="text"
            value={itinerary.accommodation}
            onChange={(e) => setItinerary({ ...itinerary, accommodation: e.target.value })}
            placeholder="ชื่อโรงแรม"
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ระดับดาว</label>
          <select
            value={itinerary.hotel_star || ''}
            onChange={(e) => setItinerary({ ...itinerary, hotel_star: e.target.value ? parseInt(e.target.value) : null })}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">ไม่ระบุ</option>
            <option value="3">3 ดาว</option>
            <option value="4">4 ดาว</option>
            <option value="5">5 ดาว</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียดกิจกรรม</label>
        <textarea
          value={itinerary.description}
          onChange={(e) => setItinerary({ ...itinerary, description: e.target.value })}
          placeholder="รายละเอียดกิจกรรมของวันนี้..."
          rows={3}
          className="w-full px-3 py-2 border rounded-lg text-sm"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          ยกเลิก
        </Button>
        <Button 
          type="button" 
          onClick={() => onSave(itinerary)} 
          disabled={saving}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
          {isNew ? 'เพิ่มวัน' : 'บันทึก'}
        </Button>
      </div>
    </div>
  );
}

export default function EditTourPage() {
  const router = useRouter();
  const params = useParams();
  const tourId = params.id as string;
  
  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [wholesalers, setWholesalers] = useState<Wholesaler[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [tour, setTour] = useState<Tour | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    wholesaler_id: '',
    tour_code: '',
    wholesaler_tour_code: '',
    title: '',
    tour_type: 'join' as 'join' | 'incentive' | 'collective',
    country_ids: [] as number[],
    duration_days: 5,
    duration_nights: 4,
    hotel_star: 4,
    min_price: '',
    price_adult: '',
    discount_adult: '',
    highlights: [] as string[],
    shopping_highlights: [] as string[],
    food_highlights: [] as string[],
    special_highlights: [] as string[],
    inclusions: '',
    exclusions: '',
    conditions: '',
    hashtags: [] as string[],
    themes: [] as string[],
    tour_category: '' as '' | 'budget' | 'premium',
    status: 'draft' as 'draft' | 'active' | 'inactive',
    promotion_type: 'none' as 'none' | 'normal' | 'fire_sale',
    sync_locked: false,
    cover_image_url: '',
    cover_image_alt: '',
    pdf_url: '',
    slug: '',
    meta_title: '',
    meta_description: '',
    keywords: [] as string[],
    city_ids: [] as number[],
    transport_id: '',
    description: '',
  });

  const [hashtagInput, setHashtagInput] = useState('');
  const [themeInput, setThemeInput] = useState('');
  const [highlightInput, setHighlightInput] = useState('');
  const [shoppingHighlightInput, setShoppingHighlightInput] = useState('');
  const [foodHighlightInput, setFoodHighlightInput] = useState('');
  const [specialHighlightInput, setSpecialHighlightInput] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [citiesByCountry, setCitiesByCountry] = useState<Record<number, City[]>>({});
  const [loadingCities, setLoadingCities] = useState<number | null>(null);
  const [newCityInputs, setNewCityInputs] = useState<Record<number, string>>({});
  const [creatingCity, setCreatingCity] = useState<number | null>(null);
  const [deletingCity, setDeletingCity] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [transports, setTransports] = useState<{ id: number; code: string; name: string; type: string; image?: string }[]>([]);
  const [transportSearch, setTransportSearch] = useState('');
  const [showTransportDropdown, setShowTransportDropdown] = useState(false);

  // Period states
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [savingPeriod, setSavingPeriod] = useState(false);
  const [editPeriod, setEditPeriod] = useState<Period | null>(null);
  const [isCreatingPeriod, setIsCreatingPeriod] = useState(false);
  const [showNewPeriodRow, setShowNewPeriodRow] = useState(false);
  const [newPeriodData, setNewPeriodData] = useState({
    start_date: '',
    end_date: '',
    capacity: 30,
    price_adult: '',
    discount_adult: '',
    price_single_surcharge: '',
    discount_single: '',
    price_child: '',
    discount_child_bed: '',
    price_child_nobed: '',
    discount_child_nobed: '',
    promotion_id: null as number | null,
  });
  const [periodForm, setPeriodForm] = useState<PeriodFormData>(emptyPeriodForm);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [selectedPeriodIds, setSelectedPeriodIds] = useState<number[]>([]);
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [massUpdateType, setMassUpdateType] = useState<'visibility' | 'sale_status' | 'promo' | 'discount'>('visibility');
  const [massUpdateValue, setMassUpdateValue] = useState<string>('');
  const [massDiscount, setMassDiscount] = useState({
    discount_adult: '',
    discount_single: '',
    discount_child_bed: '',
    discount_child_nobed: '',
  });

  // Promotions list
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  // Itinerary states
  const [itineraries, setItineraries] = useState<TourItinerary[]>([]);
  const [loadingItineraries, setLoadingItineraries] = useState(false);
  const [savingItinerary, setSavingItinerary] = useState(false);
  const [editingItineraryId, setEditingItineraryId] = useState<number | null>(null);
  const [showNewItineraryRow, setShowNewItineraryRow] = useState(false);
  const [newItinerary, setNewItinerary] = useState<TourItinerary>({
    day_number: 1,
    title: '',
    description: '',
    places: [],
    has_breakfast: false,
    has_lunch: false,
    has_dinner: false,
    meals_note: '',
    accommodation: '',
    hotel_star: null,
    images: [],
  });
  const [placeInput, setPlaceInput] = useState('');

  // Debug data from backend API
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [debugData, setDebugData] = useState<any>(null);
  const [loadingDebug, setLoadingDebug] = useState(false);

  // Gallery images for preview
  const [galleryImages, setGalleryImages] = useState<{ id?: number; url: string; thumbnail_url: string; alt: string; caption: string }[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<number>(-1); // -1 = cover image, 0+ = gallery index

  // Debounce ref for pending API updates
  const pendingUpdates = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Load tour, countries and wholesalers
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tourRes, countriesRes, wholesalersRes, transportsRes] = await Promise.all([
          toursApi.get(parseInt(tourId)),
          countriesApi.list({ is_active: 'true', per_page: '250' }),
          wholesalersApi.list({ is_active: 'true' }),
          transportsApi.list({ status: 'on', per_page: '100' }),
        ]);
        
        if (transportsRes.success && transportsRes.data) {
          setTransports(transportsRes.data.map(t => ({ id: t.id, code: t.code, name: t.name, type: t.type, image: t.image ?? undefined })));
        }
        
        if (tourRes.success && tourRes.data) {
          setTour(tourRes.data);
          
          const t = tourRes.data;
          const tourData = t as unknown as { 
            tour_category?: string; 
            description?: string;
            price_adult?: number | string;
            discount_adult?: number | string;
            hotel_star?: number;
            transport_id?: number;
            promotion_type?: 'none' | 'normal' | 'fire_sale';
            sync_locked?: boolean;
          };
          setFormData({
            wholesaler_id: t.wholesaler_id?.toString() || '',
            tour_code: t.tour_code || '',
            wholesaler_tour_code: t.wholesaler_tour_code || '',
            title: t.title || '',
            tour_type: t.tour_type || 'join',
            country_ids: t.countries?.map(c => c.id) || [],
            duration_days: t.duration_days || 5,
            duration_nights: t.duration_nights || 4,
            hotel_star: tourData.hotel_star || t.hotel_star_max || t.hotel_star_min || 4,
            min_price: t.min_price || '',
            price_adult: tourData.price_adult?.toString() || '',
            discount_adult: tourData.discount_adult?.toString() || '',
            highlights: Array.isArray(t.highlights) ? t.highlights : [],
            shopping_highlights: Array.isArray(t.shopping_highlights) ? t.shopping_highlights : [],
            food_highlights: Array.isArray(t.food_highlights) ? t.food_highlights : [],
            special_highlights: Array.isArray(t.special_highlights) ? t.special_highlights : [],
            inclusions: t.inclusions || '',
            exclusions: t.exclusions || '',
            conditions: t.conditions || '',
            hashtags: Array.isArray(t.hashtags) ? t.hashtags : [],
            themes: Array.isArray(t.themes) ? t.themes : [],
            tour_category: (tourData.tour_category || '') as '' | 'budget' | 'premium',
            status: t.status || 'draft',
            promotion_type: t.promotion_type || tourData.promotion_type || 'none',
            sync_locked: t.sync_locked || tourData.sync_locked || false,
            cover_image_url: t.cover_image_url || '',
            cover_image_alt: t.cover_image_alt || '',
            pdf_url: t.pdf_url || '',
            slug: t.slug || '',
            meta_title: t.meta_title || '',
            meta_description: t.meta_description || '',
            keywords: t.keywords || [],
            city_ids: t.cities?.map(c => c.id) || [],
            transport_id: tourData.transport_id?.toString() || t.transports?.[0]?.id?.toString() || '',
            description: tourData.description || '',
          });
          
          // Load cities for each selected country (non-blocking)
          if (t.countries && t.countries.length > 0) {
            t.countries.forEach(async (country) => {
              try {
                const citiesRes = await citiesApi.list({ 
                  country_id: country.id.toString(),
                  is_active: 'true',
                  per_page: '100'
                });
                if (citiesRes.success && citiesRes.data) {
                  setCitiesByCountry(prev => ({ ...prev, [country.id]: citiesRes.data || [] }));
                }
              } catch (err) {
                console.error(`Failed to load cities for country ${country.id}:`, err);
              }
            });
          }
        }
        
        if (countriesRes.success) {
          setCountries(countriesRes.data || []);
        }
        if (wholesalersRes.success) {
          setWholesalers(wholesalersRes.data || []);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [tourId]);

  // Load periods when tab changes to periods or view (for preview)
  useEffect(() => {
    if ((activeTab === 'periods' || activeTab === 'view') && tour) {
      fetchPeriods();
      if (activeTab === 'periods') {
        fetchPromotions();
      }
    }
  }, [activeTab, tour?.id]);

  // Load itineraries when tab changes to itinerary
  useEffect(() => {
    if (activeTab === 'itinerary' && tour) {
      fetchItineraries();
    }
  }, [activeTab, tour?.id]);

  const fetchItineraries = async () => {
    if (!tour?.id) return;
    setLoadingItineraries(true);
    try {
      const response = await itinerariesApi.list(tour.id);
      if (response.success && response.data) {
        setItineraries(response.data.map(item => ({
          id: item.id,
          tour_id: item.tour_id,
          day_number: item.day_number,
          title: item.title || '',
          description: item.description || '',
          places: Array.isArray(item.places) ? item.places : [],
          has_breakfast: item.has_breakfast,
          has_lunch: item.has_lunch,
          has_dinner: item.has_dinner,
          meals_note: item.meals_note || '',
          accommodation: item.accommodation || '',
          hotel_star: item.hotel_star,
          images: Array.isArray(item.images) ? item.images : [],
        })));
      }
    } catch (err) {
      console.error('Failed to fetch itineraries:', err);
    } finally {
      setLoadingItineraries(false);
    }
  };

  // Load gallery images when tab changes to view
  useEffect(() => {
    if (activeTab === 'view') {
      fetchGalleryImages();
    }
  }, [activeTab, formData.country_ids, formData.city_ids, formData.hashtags]);

  const fetchGalleryImages = async () => {
    setLoadingGallery(true);
    try {
      const response = await galleryApi.getForTour(
        formData.city_ids,
        formData.country_ids,
        formData.hashtags,
        3 // Limit to 3 images
      );
      if (response.success && response.data) {
        setGalleryImages(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch gallery images:', err);
    } finally {
      setLoadingGallery(false);
    }
  };

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

  const fetchPeriods = async () => {
    if (!tour) return;
    setLoadingPeriods(true);
    try {
      const response = await periodsApi.list(tour.id);
      if (response.success) {
        setPeriods(response.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch periods:', err);
    } finally {
      setLoadingPeriods(false);
    }
  };

  const fetchPromotions = async () => {
    try {
      const response = await promotionsApi.list({ is_active: 'true' });
      if (response.success) {
        setPromotions(response.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch promotions:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // If title changes and slug exists, show a reminder
    if (name === 'title' && formData.slug) {
      // Set a flag to remind user about slug update (optional notification)
      // This is handled in SEO tab with warning message
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  const handleAddTheme = () => {
    if (themeInput.trim() && !formData.themes.includes(themeInput.trim())) {
      setFormData(prev => ({ ...prev, themes: [...prev.themes, themeInput.trim()] }));
      setThemeInput('');
    }
  };

  const handleRemoveTheme = (theme: string) => {
    setFormData(prev => ({ ...prev, themes: prev.themes.filter(t => t !== theme) }));
  };

  const handleCountryToggle = async (countryId: number) => {
    const isRemoving = formData.country_ids.includes(countryId);
    
    setFormData(prev => ({
      ...prev,
      country_ids: isRemoving
        ? prev.country_ids.filter(id => id !== countryId)
        : [...prev.country_ids, countryId],
      city_ids: isRemoving
        ? prev.city_ids.filter(cityId => !citiesByCountry[countryId]?.some(c => c.id === cityId))
        : prev.city_ids,
    }));
    
    if (!isRemoving && !citiesByCountry[countryId]) {
      setLoadingCities(countryId);
      try {
        const citiesRes = await citiesApi.list({ 
          country_id: countryId.toString(),
          is_active: 'true',
          per_page: '100'
        });
        if (citiesRes.success && citiesRes.data) {
          setCitiesByCountry(prev => ({ ...prev, [countryId]: citiesRes.data || [] }));
        }
      } catch (err) {
        console.error('Failed to load cities:', err);
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

  const handleCreateCity = async (countryId: number) => {
    const cityName = newCityInputs[countryId]?.trim();
    if (!cityName) return;

    setCreatingCity(countryId);
    try {
      const response = await citiesApi.create({
        name_th: cityName,
        name_en: cityName,
        country_id: countryId,
        is_active: true,
      });

      if (response.success && response.data) {
        // Add new city to citiesByCountry
        setCitiesByCountry(prev => ({
          ...prev,
          [countryId]: [...(prev[countryId] || []), response.data!],
        }));
        // Auto-select the new city
        setFormData(prev => ({
          ...prev,
          city_ids: [...prev.city_ids, response.data!.id],
        }));
        // Clear input
        setNewCityInputs(prev => ({ ...prev, [countryId]: '' }));
      } else {
        alert(response.message || 'เพิ่มเมืองไม่สำเร็จ');
      }
    } catch (err) {
      console.error('Failed to create city:', err);
      alert('เกิดข้อผิดพลาดในการเพิ่มเมือง');
    } finally {
      setCreatingCity(null);
    }
  };

  const handleDeleteCity = async (cityId: number, countryId: number) => {
    if (!confirm('ต้องการลบเมืองนี้หรือไม่?')) return;

    setDeletingCity(cityId);
    try {
      const response = await citiesApi.delete(cityId);
      if (response.success) {
        // Remove city from citiesByCountry
        setCitiesByCountry(prev => ({
          ...prev,
          [countryId]: (prev[countryId] || []).filter(c => c.id !== cityId),
        }));
        // Remove from selected city_ids if selected
        setFormData(prev => ({
          ...prev,
          city_ids: prev.city_ids.filter(id => id !== cityId),
        }));
      } else {
        alert(response.message || 'ลบเมืองไม่สำเร็จ');
      }
    } catch (err) {
      console.error('Failed to delete city:', err);
      alert('เกิดข้อผิดพลาดในการลบเมือง');
    } finally {
      setDeletingCity(null);
    }
  };

  const handleAddHashtag = () => {
    if (hashtagInput.trim()) {
      const tag = hashtagInput.trim().replace(/^#/, '');
      if (!formData.hashtags.includes(tag)) {
        setFormData(prev => ({ ...prev, hashtags: [...prev.hashtags, tag] }));
      }
      setHashtagInput('');
    }
  };

  const handleRemoveHashtag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter(t => t !== tag),
    }));
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tour) return;

    setUploadingImage(true);
    try {
      // สร้างชื่อไฟล์จาก tour_code + title เช่น NT202601003-FUKUOKA KUMAMOTO.webp
      const customName = `${formData.tour_code}-${formData.title}`;
      const alt = `${formData.tour_code}-${formData.title}`;
      
      const result = await toursApi.uploadCoverImage(tour.id, file, customName, alt);
      if (result.success && result.data) {
        setFormData(prev => ({ 
          ...prev, 
          cover_image_url: result.data!.cover_image_url,
          cover_image_alt: result.data!.cover_image_alt || alt
        }));
        setTour(prev => prev ? { 
          ...prev, 
          cover_image_url: result.data!.cover_image_url,
          cover_image_alt: result.data!.cover_image_alt || alt
        } : null);
      } else {
        alert(result.message || 'อัปโหลดรูปภาพล้มเหลว');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tour) return;

    setUploadingPdf(true);
    try {
      const result = await toursApi.uploadPdf(tour.id, file);
      if (result.success && result.data) {
        setFormData(prev => ({ ...prev, pdf_url: result.data!.pdf_url }));
        setTour(prev => prev ? { ...prev, pdf_url: result.data!.pdf_url } : null);
      } else {
        alert(result.message || 'อัปโหลด PDF ล้มเหลว');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('เกิดข้อผิดพลาดในการอัปโหลด PDF');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.country_ids.length === 0) {
      setErrors({ country_ids: ['กรุณาเลือกประเทศอย่างน้อย 1 ประเทศ'] });
      setActiveTab('location');
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const payload = {
        ...formData,
        wholesaler_id: parseInt(formData.wholesaler_id) || undefined,
        transport_id: formData.transport_id ? parseInt(formData.transport_id) : null,
        hotel_star: formData.hotel_star || null,
        price_adult: formData.price_adult ? parseFloat(formData.price_adult) : null,
        discount_adult: formData.discount_adult ? parseFloat(formData.discount_adult) : null,
      };

      const response = await toursApi.update(parseInt(tourId), payload);
      
      if (response.success) {
        // แสดง toast หรือ notification แทนการ redirect
        alert('บันทึกข้อมูลสำเร็จ');
        // อยู่หน้าเดิม ไม่ต้อง redirect
      } else {
        setErrors(response.errors || { general: [response.message || 'Failed to update tour'] });
      }
    } catch (err: unknown) {
      console.error('Update tour error:', err);
      const error = err as { errors?: Record<string, string[]>; message?: string };
      setErrors(error.errors || { general: [error.message || 'Failed to update tour'] });
    } finally {
      setLoading(false);
    }
  };

  // Period handlers - inline row creation
  const handleCreatePeriod = () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 14);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (tour?.duration_days || 5) - 1);
    
    setNewPeriodData({
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      capacity: 30,
      price_adult: '',
      discount_adult: '',
      price_single_surcharge: '',
      discount_single: '',
      price_child: '',
      discount_child_bed: '',
      price_child_nobed: '',
      discount_child_nobed: '',
      promotion_id: null,
    });
    setShowNewPeriodRow(true);
  };

  const handleSaveNewPeriod = async () => {
    if (!tour) return;
    
    setSavingPeriod(true);
    try {
      const payload = {
        start_date: newPeriodData.start_date,
        end_date: newPeriodData.end_date,
        capacity: newPeriodData.capacity,
        booked: 0,
        status: 'open',
        is_visible: true,
        sale_status: 'available',
        price_adult: parseFloat(newPeriodData.price_adult) || 0,
        discount_adult: parseFloat(newPeriodData.discount_adult) || 0,
        price_single_surcharge: parseFloat(newPeriodData.price_single_surcharge) || 0,
        discount_single: parseFloat(newPeriodData.discount_single) || 0,
        price_child: parseFloat(newPeriodData.price_child) || 0,
        discount_child_bed: parseFloat(newPeriodData.discount_child_bed) || 0,
        price_child_nobed: parseFloat(newPeriodData.price_child_nobed) || 0,
        discount_child_nobed: parseFloat(newPeriodData.discount_child_nobed) || 0,
        promotion_id: newPeriodData.promotion_id,
        cancellation_policy: 'สามารถยกเลิกได้ภายใน 30 วันก่อนเดินทาง',
      };

      await periodsApi.create(tour.id, payload);
      fetchPeriods();
      setShowNewPeriodRow(false);
    } catch (err) {
      console.error('Failed to create period:', err);
    } finally {
      setSavingPeriod(false);
    }
  };

  const handleCancelNewPeriod = () => {
    setShowNewPeriodRow(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEditPeriod = (period: Period) => {
    setEditPeriod(period);
    setIsCreatingPeriod(false);
    setPeriodForm({
      start_date: period.start_date,
      end_date: period.end_date,
      capacity: period.capacity,
      booked: period.booked,
      status: period.status,
      is_visible: period.is_visible ?? true,
      sale_status: period.sale_status || 'available',
      price_adult: period.offer?.price_adult || '',
      discount_adult: period.offer?.discount_adult || '0',
      price_single_surcharge: period.offer?.price_single_surcharge || '',
      discount_single: period.offer?.discount_single || '0',
      price_child: period.offer?.price_child || '',
      discount_child_bed: period.offer?.discount_child_bed || '0',
      price_child_nobed: period.offer?.price_child_nobed || '',
      discount_child_nobed: period.offer?.discount_child_nobed || '0',
      promo_name: period.offer?.promo_name || '',
      promo_start_date: period.offer?.promo_start_date || '',
      promo_end_date: period.offer?.promo_end_date || '',
      promo_quota: period.offer?.promo_quota?.toString() || '',
      deposit: period.offer?.deposit || '',
      cancellation_policy: period.offer?.cancellation_policy || '',
    });
  };

  const handleSavePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tour) return;
    
    setSavingPeriod(true);
    try {
      const payload = {
        ...periodForm,
        price_adult: parseFloat(periodForm.price_adult) || 0,
        discount_adult: parseFloat(periodForm.discount_adult) || 0,
        price_child: periodForm.price_child ? parseFloat(periodForm.price_child) : null,
        discount_child_bed: parseFloat(periodForm.discount_child_bed) || 0,
        price_child_nobed: periodForm.price_child_nobed ? parseFloat(periodForm.price_child_nobed) : null,
        discount_child_nobed: parseFloat(periodForm.discount_child_nobed) || 0,
        price_single_surcharge: periodForm.price_single_surcharge ? parseFloat(periodForm.price_single_surcharge) : null,
        discount_single: parseFloat(periodForm.discount_single) || 0,
        deposit: periodForm.deposit ? parseFloat(periodForm.deposit) : null,
        promo_quota: periodForm.promo_quota ? parseInt(periodForm.promo_quota) : null,
      };

      if (isCreatingPeriod) {
        await periodsApi.create(tour.id, payload);
      } else if (editPeriod) {
        await periodsApi.update(tour.id, editPeriod.id, payload);
      }

      fetchPeriods();
      setIsCreatingPeriod(false);
      setEditPeriod(null);
      setPeriodForm(emptyPeriodForm);
    } catch (err) {
      console.error('Failed to save period:', err);
    } finally {
      setSavingPeriod(false);
    }
  };

  const handleDeletePeriod = async (periodId: number) => {
    if (!tour) return;
    try {
      await periodsApi.delete(tour.id, periodId);
      fetchPeriods();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete period:', err);
    }
  };

  const handlePeriodStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startDate = new Date(e.target.value);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (tour?.duration_days || 5) - 1);
    
    setPeriodForm(prev => ({
      ...prev,
      start_date: e.target.value,
      end_date: endDate.toISOString().split('T')[0],
    }));
  };

  const togglePeriodSelect = (id: number) => {
    setSelectedPeriodIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllPeriods = () => {
    if (selectedPeriodIds.length === periods.length) {
      setSelectedPeriodIds([]);
    } else {
      setSelectedPeriodIds(periods.map(p => p.id));
    }
  };

  const handleMassUpdate = async () => {
    if (selectedPeriodIds.length === 0 || !tour) return;
    
    setSavingPeriod(true);
    try {
      if (massUpdateType === 'promo') {
        // Mass update promotion_id
        const promotionId = massUpdateValue === 'clear' ? null : parseInt(massUpdateValue) || null;
        for (const periodId of selectedPeriodIds) {
          await periodsApi.update(tour.id, periodId, { promotion_id: promotionId });
        }
      } else if (massUpdateType === 'discount') {
        // Mass update discount - need to update offers
        await periodsApi.massUpdateDiscount(tour.id, {
          period_ids: selectedPeriodIds,
          discount_adult: parseFloat(massDiscount.discount_adult) || 0,
          discount_single: parseFloat(massDiscount.discount_single) || 0,
          discount_child_bed: parseFloat(massDiscount.discount_child_bed) || 0,
          discount_child_nobed: parseFloat(massDiscount.discount_child_nobed) || 0,
        });
      } else {
        const updates: Record<string, unknown> = {};
        if (massUpdateType === 'visibility') {
          updates.is_visible = massUpdateValue === 'on';
        } else if (massUpdateType === 'sale_status') {
          updates.sale_status = massUpdateValue;
        }
        
        await periodsApi.bulkUpdate(tour.id, {
          period_ids: selectedPeriodIds,
          updates: updates as { is_visible?: boolean; sale_status?: string; promo_name?: string },
        });
      }
      
      fetchPeriods();
      setSelectedPeriodIds([]);
      setMassUpdateValue('');
      setMassDiscount({ discount_adult: '', discount_single: '', discount_child_bed: '', discount_child_nobed: '' });
    } catch (err) {
      console.error('Failed to mass update:', err);
    } finally {
      setSavingPeriod(false);
    }
  };

  // Inline update handlers for table editor - with debounce for better UX
  const debouncedApiUpdate = useCallback((
    periodId: number, 
    field: string, 
    value: unknown, 
    isOffer: boolean = false
  ) => {
    if (!tour) return;
    
    const key = `${periodId}-${field}`;
    
    // Cancel previous pending update for this field
    if (pendingUpdates.current.has(key)) {
      clearTimeout(pendingUpdates.current.get(key)!);
    }
    
    // Schedule new update with 300ms debounce
    const timeout = setTimeout(async () => {
      try {
        const updateData: Record<string, unknown> = { [field]: value };
        await periodsApi.update(tour.id, periodId, updateData);
        pendingUpdates.current.delete(key);
      } catch (err) {
        console.error('Failed to update:', err);
        fetchPeriods(); // Revert on error
      }
    }, 300);
    
    pendingUpdates.current.set(key, timeout);
  }, [tour]);

  const handleInlineUpdate = useCallback((periodId: number, field: string, value: unknown) => {
    if (!tour) return;
    // Update local state first (optimistic)
    setPeriods(prev => prev.map(p => 
      p.id === periodId ? { ...p, [field]: value } : p
    ));
    // Debounced API call
    debouncedApiUpdate(periodId, field, value);
  }, [tour, debouncedApiUpdate]);

  const handleInlineOfferUpdate = useCallback((periodId: number, field: string, value: unknown) => {
    if (!tour) return;
    
    // For promotion_id, also update the promotion object for display
    if (field === 'promotion_id') {
      const selectedPromo = value ? promotions.find(p => p.id === value) : null;
      setPeriods(prev => prev.map(p => 
        p.id === periodId 
          ? { 
              ...p, 
              offer: p.offer 
                ? { ...p.offer, promotion_id: value as number | null, promotion: selectedPromo || undefined } 
                : undefined 
            } 
          : p
      ));
    } else {
      // Update local state first (optimistic)
      setPeriods(prev => prev.map(p => 
        p.id === periodId 
          ? { ...p, offer: p.offer ? { ...p.offer, [field]: value } : undefined } 
          : p
      ));
    }
    
    // Debounced API call
    debouncedApiUpdate(periodId, field, value, true);
  }, [tour, promotions, debouncedApiUpdate]);

  const filteredCountries = countrySearch
    ? countries.filter(c => 
        c.name_th?.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.name_en.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.iso2.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : countries;

  // Get selected countries for display
  const selectedCountries = countries.filter(c => formData.country_ids.includes(c.id));

  // Utility functions for display (can be used if needed)
  const _formatPrice = (price: string | null | undefined) => {
    if (!price || price === '0' || price === '0.00') return '-';
    return new Intl.NumberFormat('th-TH').format(parseFloat(price));
  };
  void _formatPrice; // Prevent unused warning

  const _formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
    });
  };
  void _formatDate; // Prevent unused warning

  const getSaleStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700';
      case 'booking': return 'bg-blue-100 text-blue-700';
      case 'sold_out': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">ไม่พบทัวร์ที่ต้องการแก้ไข</p>
        <Link href="/dashboard/tours">
          <Button className="mt-4">กลับหน้าทัวร์</Button>
        </Link>
      </div>
    );
  }

  // Tab Content Components
  const renderBasicTab = () => (
    <div className="space-y-6">
      {/* ===== ข้อมูลรหัสทัวร์ Section ===== */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {/* Row 1 */}
          <div className="flex items-center">
            <label className="w-40 text-sm font-medium text-gray-700 text-right pr-4 shrink-0">
               รหัสทัวร์รภายใน (NT)
            </label>
            <div className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg font-mono font-bold text-blue-600">
              {formData.tour_code || 'รอสร้างอัตโนมัติ'}
            </div>
          </div>
          <div className="flex items-center">
            <label className="w-40 text-sm font-medium text-gray-700 text-right pr-4 shrink-0">
             รหัสทัวร์ภายนอก
            </label>
            <input
              type="text"
              name="wholesaler_tour_code"
              value={formData.wholesaler_tour_code}
              onChange={handleChange}
              placeholder="รหัสจาก Wholesaler เช่น TH-JP-001"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Row 2 */}
          <div className="flex items-center">
            <label className="w-40 text-sm font-medium text-gray-700 text-right pr-4 shrink-0">
              Wholesaler <span className="text-red-500">*</span>
            </label>
            <select
              name="wholesaler_id"
              value={formData.wholesaler_id}
              onChange={handleChange}
              required
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">เลือก Wholesaler</option>
              {wholesalers.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <label className="w-40 text-sm font-medium text-gray-700 text-right pr-4 shrink-0">
              ชื่อทัวร์ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="ทัวร์ญี่ปุ่น โตเกียว ฟูจิ โอซาก้า"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Row 3 */}
          <div className="flex items-center">
            <label className="w-40 text-sm font-medium text-gray-700 text-right pr-4 shrink-0">
              กลุ่มทัวร์
            </label>
            <select
              name="tour_type"
              value={formData.tour_type}
              onChange={handleChange}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(TOUR_TYPES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <label className="w-40 text-sm font-medium text-gray-700 text-right pr-4 shrink-0">
               ระดับโรงแรม
            </label>
            <select
              name="hotel_star"
              value={formData.hotel_star}
              onChange={(e) => setFormData(prev => ({ ...prev, hotel_star: parseInt(e.target.value) }))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n}>
                  {'⭐'.repeat(n)} {n} ดาว
                </option>
              ))}
            </select>
          </div>

          {/* Row 4 */}
          <div className="flex items-center">
            <label className="w-40 text-sm font-medium text-gray-700 text-right pr-4 shrink-0">
              จำนวนวัน
            </label>
            <input
              type="number"
              name="duration_days"
              value={formData.duration_days}
              onChange={handleNumberChange}
              min={1}
              max={30}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 "
            />
          </div>
          <div className="flex items-center">
            <label className="w-40 text-sm font-medium text-gray-700 text-right pr-4 shrink-0">
              จำนวนคืน
            </label>
            <input
              type="number"
              name="duration_nights"
              value={formData.duration_nights}
              onChange={handleNumberChange}
              min={0}
              max={30}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Row 5 */}
          <div className="flex items-center">
            <label className="w-40 text-sm font-medium text-gray-700 text-right pr-4 shrink-0">
              สถานะ
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(TOUR_STATUS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <label className="w-40 text-sm font-medium text-gray-700 text-right pr-4 shrink-0">
              ประเภทโปร
            </label>
            <select
              name="promotion_type"
              value={formData.promotion_type}
              onChange={handleChange}
              className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                formData.promotion_type === 'fire_sale' 
                  ? 'border-red-300 bg-red-50 text-red-700' 
                  : formData.promotion_type === 'normal'
                  ? 'border-orange-300 bg-orange-50 text-orange-700'
                  : 'border-gray-300'
              }`}
            >
              {Object.entries(PROMOTION_TYPES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Row 5.5 - Sync Lock (only for API tours) */}
          {tour?.data_source === 'api' && (
            <>
              <div className="flex items-center">
                <label className="w-40 text-sm font-medium text-gray-700 text-right pr-4 shrink-0">
                  ล็อค Sync
                </label>
                <div className="flex-1 flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sync_locked}
                      onChange={(e) => setFormData(prev => ({ ...prev, sync_locked: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                  <span className={`text-sm ${formData.sync_locked ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                    {formData.sync_locked ? '🔒 ไม่ sync จาก API' : '🔓 sync ปกติ'}
                  </span>
                </div>
              </div>
              <div className="flex items-center">
                <label className="w-40 text-sm font-medium text-gray-700 text-right pr-4 shrink-0">
                  ประเภททัวร์
                </label>
                <select
                  name="tour_category"
                  value={formData.tour_category || ''}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">เลือกประเภททัวร์</option>
                  <option value="budget">ทัวร์ราคาถูก</option>
                  <option value="premium">ทัวร์พรีเมียม</option>
                </select>
              </div>
            </>
          )}
          {tour?.data_source !== 'api' && (
            <div className="flex items-center">
              <label className="w-40 text-sm font-medium text-gray-700 text-right pr-4 shrink-0">
                ประเภททัวร์
              </label>
              <select
                name="tour_category"
                value={formData.tour_category || ''}
                onChange={handleChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">เลือกประเภททัวร์</option>
                <option value="budget">ทัวร์ราคาถูก</option>
                <option value="premium">ทัวร์พรีเมียม</option>
              </select>
            </div>
          )}

          {/* Row 6 */}
          <div className="flex items-center">
            <label className="w-40 text-sm font-medium text-gray-700 text-right pr-4 shrink-0">
              ราคาผู้ใหญ่
            </label>
            <input
              type="number"
              name="price_adult"
              value={formData.price_adult || ''}
              onChange={handleChange}
              placeholder="0"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center">
            <label className="w-40 text-sm font-medium text-gray-700 text-right pr-4 shrink-0">
              ส่วนลด
            </label>
            <input
              type="number"
              name="discount_adult"
              value={formData.discount_adult || ''}
              onChange={handleChange}
              placeholder="0"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500  text-red-600"
            />
          </div>

          {/* Row 7 - Transport with Search */}
          <div className="flex items-start md:col-span-1" data-transport-dropdown>
            <label className="w-40 text-sm font-medium text-gray-700 text-right pr-4 shrink-0 pt-2">
              ผู้ให้บริการขนส่ง
            </label>
            <div className="flex-1 relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={showTransportDropdown ? transportSearch : (formData.transport_id ? (() => {
                    const selected = transports.find(t => t.id.toString() === formData.transport_id);
                    return selected ? `[${selected.code}] ${selected.name}` : '';
                  })() : transportSearch)}
                  onChange={(e) => {
                    setTransportSearch(e.target.value);
                    setShowTransportDropdown(true);
                  }}
                  onFocus={() => {
                    setTransportSearch('');
                    setShowTransportDropdown(true);
                  }}
                  placeholder="ค้นหาผู้ให้บริการ..."
                  className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    formData.transport_id && !showTransportDropdown ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                  }`}
                />
                {formData.transport_id && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, transport_id: '' }));
                      setTransportSearch('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Dropdown List */}
              {showTransportDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {transports
                    .filter(t => 
                      transportSearch === '' || 
                      t.name.toLowerCase().includes(transportSearch.toLowerCase()) ||
                      t.code.toLowerCase().includes(transportSearch.toLowerCase()) ||
                      t.type.toLowerCase().includes(transportSearch.toLowerCase())
                    )
                    .slice(0, 50)
                    .map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, transport_id: t.id.toString() }));
                          setTransportSearch('');
                          setShowTransportDropdown(false);
                        }}
                        className={`w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center justify-between ${
                          formData.transport_id === t.id.toString() ? 'bg-blue-100' : ''
                        }`}
                      >
                        <span>
                          <span className="font-mono text-blue-600 mr-2">[{t.code}]</span>
                          {t.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {t.type === 'airline' ? '✈️' : t.type === 'bus' ? '🚌' : t.type === 'boat' ? '🚢' : t.type === 'train' ? '🚂' : t.type === 'van' ? '🚐' : '🚗'}
                        </span>
                      </button>
                    ))}
                  {transports.filter(t => 
                    transportSearch === '' || 
                    t.name.toLowerCase().includes(transportSearch.toLowerCase()) ||
                    t.code.toLowerCase().includes(transportSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="px-4 py-3 text-gray-500 text-sm text-center">
                      ไม่พบผู้ให้บริการ
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

         
        </div>
      </div>

      {/* ===== รายละเอียดทัวร์ Section ===== */}
      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          <FileText className="w-5 h-5 inline mr-2 text-blue-500" />
          รายละเอียดทัวร์
        </h3>
        <RichTextEditor
          value={formData.description}
          onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
          placeholder="รายละเอียดทัวร์ทั้งหมด เช่น โปรแกรมการเดินทาง สถานที่ท่องเที่ยว กิจกรรม..."
          rows={8}
        />
      </div>

      {/* ===== ไฮไลท์ Section ===== */}
      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          <Sparkles className="w-5 h-5 inline mr-2 text-yellow-500" />
          ไฮไลท์ทัวร์
        </h3>
        
        {/* Highlights - 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ไฮไลท์ทัวร์ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Sparkles className="w-4 h-4 inline text-yellow-500" /> ไฮไลท์ทัวร์
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={highlightInput}
                onChange={(e) => setHighlightInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && highlightInput.trim()) {
                    e.preventDefault();
                    setFormData(prev => ({ ...prev, highlights: [...prev.highlights, highlightInput.trim()] }));
                    setHighlightInput('');
                  }
                }}
                placeholder="พิมพ์ไฮไลท์แล้วกด Enter"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => {
                if (highlightInput.trim()) {
                  setFormData(prev => ({ ...prev, highlights: [...prev.highlights, highlightInput.trim()] }));
                  setHighlightInput('');
                }
              }}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg bg-yellow-50 min-h-[60px]">
              {formData.highlights.map((item, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                  {item}
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, highlights: prev.highlights.filter((_, i) => i !== idx) }))} className="hover:text-yellow-900">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              {formData.highlights.length === 0 && <span className="text-gray-400 text-sm">ยังไม่มีไฮไลท์</span>}
            </div>
          </div>

          {/* ไฮไลท์ช้อปปิ้ง */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ShoppingBag className="w-4 h-4 inline text-pink-500" /> ไฮไลท์ช้อปปิ้ง
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={shoppingHighlightInput}
                onChange={(e) => setShoppingHighlightInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && shoppingHighlightInput.trim()) {
                    e.preventDefault();
                    setFormData(prev => ({ ...prev, shopping_highlights: [...prev.shopping_highlights, shoppingHighlightInput.trim()] }));
                    setShoppingHighlightInput('');
                  }
                }}
                placeholder="พิมพ์ไฮไลท์แล้วกด Enter"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => {
                if (shoppingHighlightInput.trim()) {
                  setFormData(prev => ({ ...prev, shopping_highlights: [...prev.shopping_highlights, shoppingHighlightInput.trim()] }));
                  setShoppingHighlightInput('');
                }
              }}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg bg-pink-50 min-h-[60px]">
              {formData.shopping_highlights.map((item, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-3 py-1.5 bg-pink-100 text-pink-700 rounded-full text-sm">
                  {item}
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, shopping_highlights: prev.shopping_highlights.filter((_, i) => i !== idx) }))} className="hover:text-pink-900">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              {formData.shopping_highlights.length === 0 && <span className="text-gray-400 text-sm">ยังไม่มีไฮไลท์</span>}
            </div>
          </div>

          {/* ไฮไลท์อาหาร */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Utensils className="w-4 h-4 inline text-orange-500" /> ไฮไลท์อาหาร
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={foodHighlightInput}
                onChange={(e) => setFoodHighlightInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && foodHighlightInput.trim()) {
                    e.preventDefault();
                    setFormData(prev => ({ ...prev, food_highlights: [...prev.food_highlights, foodHighlightInput.trim()] }));
                    setFoodHighlightInput('');
                  }
                }}
                placeholder="พิมพ์ไฮไลท์แล้วกด Enter"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => {
                if (foodHighlightInput.trim()) {
                  setFormData(prev => ({ ...prev, food_highlights: [...prev.food_highlights, foodHighlightInput.trim()] }));
                  setFoodHighlightInput('');
                }
              }}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg bg-orange-50 min-h-[60px]">
              {formData.food_highlights.map((item, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm">
                  {item}
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, food_highlights: prev.food_highlights.filter((_, i) => i !== idx) }))} className="hover:text-orange-900">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              {formData.food_highlights.length === 0 && <span className="text-gray-400 text-sm">ยังไม่มีไฮไลท์</span>}
            </div>
          </div>

          {/* ไฮไลท์พิเศษ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Star className="w-4 h-4 inline text-purple-500" /> ไฮไลท์พิเศษ
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={specialHighlightInput}
                onChange={(e) => setSpecialHighlightInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && specialHighlightInput.trim()) {
                    e.preventDefault();
                    setFormData(prev => ({ ...prev, special_highlights: [...prev.special_highlights, specialHighlightInput.trim()] }));
                    setSpecialHighlightInput('');
                  }
                }}
                placeholder="พิมพ์ไฮไลท์แล้วกด Enter"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => {
                if (specialHighlightInput.trim()) {
                  setFormData(prev => ({ ...prev, special_highlights: [...prev.special_highlights, specialHighlightInput.trim()] }));
                  setSpecialHighlightInput('');
                }
              }}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg bg-purple-50 min-h-[60px]">
              {formData.special_highlights.map((item, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm">
                  {item}
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, special_highlights: prev.special_highlights.filter((_, i) => i !== idx) }))} className="hover:text-purple-900">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              {formData.special_highlights.length === 0 && <span className="text-gray-400 text-sm">ยังไม่มีไฮไลท์</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ===== หมวดหมู่และ Hashtags Section ===== */}
      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          <Tag className="w-5 h-5 inline mr-2 text-purple-500" />
          หมวดหมู่และ Hashtags
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* หมวดหมู่ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              หมวดหมู่ทัวร์
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={themeInput}
                onChange={(e) => setThemeInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTheme())}
                placeholder="เพิ่มหมวดหมู่เอง..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddTheme}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {TOUR_CATEGORIES.filter(cat => !formData.themes.includes(cat)).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, themes: [...prev.themes, cat] }))}
                  className="px-3 py-1.5 text-sm border border-purple-200 text-purple-600 rounded-full hover:bg-purple-50 hover:border-purple-400 transition-colors"
                >
                  + {cat}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50 min-h-[60px]">
              {formData.themes.map(theme => (
                <span key={theme} className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm">
                  {theme}
                  <button type="button" onClick={() => handleRemoveTheme(theme)} className="hover:text-purple-900">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              {formData.themes.length === 0 && <span className="text-gray-400 text-sm">ยังไม่มีหมวดหมู่</span>}
            </div>
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash className="w-4 h-4 inline text-blue-500" /> Hashtags
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddHashtag())}
                placeholder="พิมพ์ hashtag แล้วกด Enter"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddHashtag}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg bg-blue-50 min-h-[60px]">
              {formData.hashtags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm">
                  #{tag}
                  <button type="button" onClick={() => handleRemoveHashtag(tag)} className="hover:text-blue-900">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              {formData.hashtags.length === 0 && <span className="text-gray-400 text-sm">ยังไม่มี hashtag</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLocationTab = () => (
    <div className="space-y-6">
      {errors.country_ids && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {errors.country_ids[0]}
        </div>
      )}

      {/* Selected Countries with Cities */}
      {formData.country_ids.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-900 mb-3">ประเทศที่เลือก ({formData.country_ids.length})</h3>
          <div className="space-y-4">
            {formData.country_ids.map((cid, idx) => {
              const country = countries.find(c => c.id === cid);
              const cities = citiesByCountry[cid] || [];
              
              return country ? (
                <div 
                  key={cid} 
                  className={`p-4 rounded-lg border-2 ${idx === 0 ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://flagcdn.com/w40/${country.iso2.toLowerCase()}.png`}
                        alt={country.iso2}
                        className="w-8 h-5 rounded shadow-sm"
                        loading="lazy"
                      />
                      <span className="font-medium text-gray-900">
                        {country.name_th || country.name_en}
                      </span>
                      {idx === 0 && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">ประเทศหลัก</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCountryToggle(cid)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {loadingCities === cid ? (
                    <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      กำลังโหลดเมือง...
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">เลือกเมืองที่เดินทาง:</label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {cities.map(city => (
                          <div key={city.id} className="group relative inline-flex">
                            <button
                              type="button"
                              onClick={() => handleCityToggle(city.id)}
                              className={`px-3 py-1.5 rounded-full text-sm transition-colors pr-7 ${
                                formData.city_ids.includes(city.id)
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {city.name_th || city.name_en}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCity(city.id, cid);
                              }}
                              disabled={deletingCity === city.id}
                              className={`absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                                formData.city_ids.includes(city.id)
                                  ? 'text-white/70 hover:text-white hover:bg-white/20'
                                  : 'text-gray-400 hover:text-red-500 hover:bg-red-100'
                              }`}
                              title="ลบเมือง"
                            >
                              {deletingCity === city.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <X className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ))}
                        {cities.length === 0 && (
                          <span className="text-gray-400 text-sm">ยังไม่มีเมือง - เพิ่มเมืองใหม่ด้านล่าง</span>
                        )}
                      </div>
                      
                      {/* Add New City Input */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                        <input
                          type="text"
                          value={newCityInputs[cid] || ''}
                          onChange={(e) => setNewCityInputs(prev => ({ ...prev, [cid]: e.target.value }))}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCreateCity(cid);
                            }
                          }}
                          placeholder="พิมพ์ชื่อเมืองใหม่..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleCreateCity(cid)}
                          disabled={creatingCity === cid || !newCityInputs[cid]?.trim()}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          {creatingCity === cid ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                          เพิ่มเมือง
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Search and Add Countries */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">เพิ่มประเทศ</h3>
        <div className="relative mb-4">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={countrySearch}
            onChange={(e) => setCountrySearch(e.target.value)}
            placeholder="ค้นหาประเทศ..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          {countrySearch && (
            <button
              type="button"
              onClick={() => setCountrySearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-64 overflow-y-auto p-1">
          {filteredCountries
            .filter(c => !formData.country_ids.includes(c.id))
            .slice(0, 50)
            .map(country => (
              <button
                key={country.id}
                type="button"
                onClick={() => handleCountryToggle(country.id)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://flagcdn.com/w20/${country.iso2.toLowerCase()}.png`}
                  alt={country.iso2}
                  className="w-5 h-3.5 rounded shadow-sm"
                  loading="lazy"
                />
                <span className="text-sm truncate">{country.name_th || country.name_en}</span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );

  const renderPeriodsTab = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between ">
        <h3 className="font-medium text-gray-900">
          รอบเดินทาง ({periods.length} รอบ)
        </h3>
        <div className="flex gap-2">
          {!showNewPeriodRow && (
            <Button type="button" size="sm" onClick={handleCreatePeriod}>
              <Plus className="w-4 h-4" />
              เพิ่มรอบ
            </Button>
          )}
          {editingRowId === -1 ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setEditingRowId(null)} className="text-green-600 border-green-300 hover:bg-green-50">
              <Check className="w-4 h-4" />
              เสร็จสิ้น
            </Button>
          ) : (
            <Button type="button" size="sm" variant="outline" onClick={() => setEditingRowId(-1)} className="text-blue-600 border-blue-300 hover:bg-blue-50">
              <Edit className="w-4 h-4" />
              แก้ไขทั้งตาราง
            </Button>
          )}
        </div>
      </div>

      {/* Create/Edit Form */}
      {(isCreatingPeriod || editPeriod) && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h4 className="font-medium text-gray-900 mb-4">
            {isCreatingPeriod ? 'เพิ่มรอบเดินทางใหม่' : 'แก้ไขรอบเดินทาง'}
          </h4>
          <form onSubmit={handleSavePeriod} className="space-y-4">
            {/* Row 1: Dates, Capacity, Status */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  วันเริ่มต้น <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={periodForm.start_date}
                  onChange={handlePeriodStartDateChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  วันสิ้นสุด <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={periodForm.end_date}
                  onChange={(e) => setPeriodForm(prev => ({ ...prev, end_date: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ที่นั่ง</label>
                <input
                  type="number"
                  value={periodForm.capacity}
                  onChange={(e) => setPeriodForm(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                  min={1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">สถานะแสดง</label>
                <select
                  value={periodForm.is_visible ? 'on' : 'off'}
                  onChange={(e) => setPeriodForm(prev => ({ ...prev, is_visible: e.target.value === 'on' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="on">On</option>
                  <option value="off">Off</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">สถานะวางขาย</label>
                <select
                  value={periodForm.sale_status}
                  onChange={(e) => setPeriodForm(prev => ({ ...prev, sale_status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {Object.entries(SALE_STATUS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Pricing - Adult & Single */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  ผู้ใหญ่(พัก 2-3) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={periodForm.price_adult}
                  onChange={(e) => setPeriodForm(prev => ({ ...prev, price_adult: e.target.value }))}
                  required
                  placeholder="29,900"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ลดราคา</label>
                <input
                  type="number"
                  value={periodForm.discount_adult}
                  onChange={(e) => setPeriodForm(prev => ({ ...prev, discount_adult: e.target.value }))}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-yellow-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ผู้ใหญ่พักเดี่ยว</label>
                <input
                  type="number"
                  value={periodForm.price_single_surcharge}
                  onChange={(e) => setPeriodForm(prev => ({ ...prev, price_single_surcharge: e.target.value }))}
                  placeholder="5,000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ลดราคา</label>
                <input
                  type="number"
                  value={periodForm.discount_single}
                  onChange={(e) => setPeriodForm(prev => ({ ...prev, discount_single: e.target.value }))}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-yellow-50"
                />
              </div>
            </div>

            {/* Row 3: Pricing - Child */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">เด็ก(มีเตียง)</label>
                <input
                  type="number"
                  value={periodForm.price_child}
                  onChange={(e) => setPeriodForm(prev => ({ ...prev, price_child: e.target.value }))}
                  placeholder="27,900"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ลดราคา</label>
                <input
                  type="number"
                  value={periodForm.discount_child_bed}
                  onChange={(e) => setPeriodForm(prev => ({ ...prev, discount_child_bed: e.target.value }))}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-yellow-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">เด็ก(ไม่มีเตียง)</label>
                <input
                  type="number"
                  value={periodForm.price_child_nobed}
                  onChange={(e) => setPeriodForm(prev => ({ ...prev, price_child_nobed: e.target.value }))}
                  placeholder="25,900"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ลดราคา</label>
                <input
                  type="number"
                  value={periodForm.discount_child_nobed}
                  onChange={(e) => setPeriodForm(prev => ({ ...prev, discount_child_nobed: e.target.value }))}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-yellow-50"
                />
              </div>
            </div>

            {/* Row 4: Promo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-purple-50 p-3 rounded-lg">
              <div>
                <label className="block text-xs font-medium text-purple-700 mb-1">
                  <Tag className="w-3 h-3 inline" /> ชื่อโปรโมชั่น
                </label>
                <input
                  type="text"
                  value={periodForm.promo_name}
                  onChange={(e) => setPeriodForm(prev => ({ ...prev, promo_name: e.target.value }))}
                  placeholder="Early Bird"
                  className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-700 mb-1">โปรฯ เริ่ม</label>
                <input
                  type="date"
                  value={periodForm.promo_start_date}
                  onChange={(e) => setPeriodForm(prev => ({ ...prev, promo_start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-700 mb-1">โปรฯ สิ้นสุด</label>
                <input
                  type="date"
                  value={periodForm.promo_end_date}
                  onChange={(e) => setPeriodForm(prev => ({ ...prev, promo_end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-700 mb-1">จำนวนโปรฯ</label>
                <input
                  type="number"
                  value={periodForm.promo_quota}
                  onChange={(e) => setPeriodForm(prev => ({ ...prev, promo_quota: e.target.value }))}
                  placeholder="10"
                  className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setIsCreatingPeriod(false); setEditPeriod(null); setPeriodForm(emptyPeriodForm); }}
              >
                ยกเลิก
              </Button>
              <Button type="submit" size="sm" disabled={savingPeriod}>
                {savingPeriod ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                บันทึก
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Mass Update Controls - แสดงเลยเมื่อเลือก record */}
      {selectedPeriodIds.length > 0 && !isCreatingPeriod && !editPeriod && (
        <Card className="p-4 bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-orange-800">
              ✓ เลือกแล้ว {selectedPeriodIds.length} รอบ - Mass Update
            </span>
            <Button type="button" size="sm" variant="outline" onClick={() => setSelectedPeriodIds([])}>
              <X className="w-4 h-4" />
              ยกเลิกเลือก
            </Button>
          </div>
          
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">อัปเดตประเภท</label>
              <select
                value={massUpdateType}
                onChange={(e) => setMassUpdateType(e.target.value as 'visibility' | 'sale_status' | 'promo' | 'discount')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="visibility">สถานะแสดง</option>
                <option value="sale_status">สถานะวางขาย</option>
                <option value="promo">โปรโมชั่น</option>
                <option value="discount">ส่วนลดราคา</option>
              </select>
            </div>
            
            {massUpdateType === 'visibility' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">เปลี่ยนเป็น</label>
                <select
                  value={massUpdateValue}
                  onChange={(e) => setMassUpdateValue(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="">เลือก...</option>
                  <option value="on">On (แสดง)</option>
                  <option value="off">Off (ซ่อน)</option>
                </select>
              </div>
            )}
            
            {massUpdateType === 'sale_status' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">เปลี่ยนเป็น</label>
                <select
                  value={massUpdateValue}
                  onChange={(e) => setMassUpdateValue(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="">เลือก...</option>
                  {Object.entries(SALE_STATUS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            )}
            
            {massUpdateType === 'promo' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-purple-700 mb-1">เลือกโปรโมชั่น</label>
                  <select
                    value={massUpdateValue}
                    onChange={(e) => setMassUpdateValue(e.target.value)}
                    className="px-3 py-2 border border-purple-300 rounded-lg text-sm bg-purple-50"
                  >
                    <option value="">เลือก...</option>
                    <option value="clear">❌ ล้างโปรโมชั่น</option>
                    {promotions.map(promo => (
                      <option key={promo.id} value={promo.id.toString()}>{promo.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            
            {massUpdateType === 'discount' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-yellow-700 mb-1">ลดผู้ใหญ่(พัก2-3)</label>
                  <input
                    type="number"
                    value={massDiscount.discount_adult}
                    onChange={(e) => setMassDiscount(prev => ({ ...prev, discount_adult: e.target.value }))}
                    placeholder="1000"
                    className="w-24 px-3 py-2 border border-yellow-300 rounded-lg text-sm bg-yellow-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-yellow-700 mb-1">ลดพักเดี่ยว</label>
                  <input
                    type="number"
                    value={massDiscount.discount_single}
                    onChange={(e) => setMassDiscount(prev => ({ ...prev, discount_single: e.target.value }))}
                    placeholder="500"
                    className="w-24 px-3 py-2 border border-yellow-300 rounded-lg text-sm bg-yellow-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-yellow-700 mb-1">ลดเด็ก(เตียง)</label>
                  <input
                    type="number"
                    value={massDiscount.discount_child_bed}
                    onChange={(e) => setMassDiscount(prev => ({ ...prev, discount_child_bed: e.target.value }))}
                    placeholder="500"
                    className="w-24 px-3 py-2 border border-yellow-300 rounded-lg text-sm bg-yellow-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-yellow-700 mb-1">ลดเด็ก(ไม่เตียง)</label>
                  <input
                    type="number"
                    value={massDiscount.discount_child_nobed}
                    onChange={(e) => setMassDiscount(prev => ({ ...prev, discount_child_nobed: e.target.value }))}
                    placeholder="500"
                    className="w-24 px-3 py-2 border border-yellow-300 rounded-lg text-sm bg-yellow-50"
                  />
                </div>
              </>
            )}
            
            <Button
              type="button"
              size="sm"
              onClick={handleMassUpdate}
              disabled={savingPeriod || (massUpdateType === 'visibility' && !massUpdateValue) || (massUpdateType === 'sale_status' && !massUpdateValue) || (massUpdateType === 'promo' && !massUpdateValue) || (massUpdateType === 'discount' && !massDiscount.discount_adult && !massDiscount.discount_single && !massDiscount.discount_child_bed && !massDiscount.discount_child_nobed)}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {savingPeriod ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              อัปเดต {selectedPeriodIds.length} รอบ
            </Button>
          </div>
        </Card>
      )}

      {/* Periods Table - Inline Editable */}
      {loadingPeriods ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : periods.length === 0 && !showNewPeriodRow ? (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>ยังไม่มีรอบเดินทาง</p>
          <Button type="button" size="sm" className="mt-4" onClick={handleCreatePeriod}>
            <Plus className="w-4 h-4" />
            เพิ่มรอบแรก
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-xs">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="w-8 px-1 py-2">
                  <input
                    type="checkbox"
                    checked={selectedPeriodIds.length === periods.length && periods.length > 0}
                    onChange={selectAllPeriods}
                    className="rounded w-3.5 h-3.5"
                  />
                </th>
                <th className="text-center px-2 py-2 font-medium text-gray-700 whitespace-nowrap">วันเริ่ม</th>
                <th className="text-center px-2 py-2 font-medium text-gray-700 whitespace-nowrap">วันสิ้นสุด</th>
                <th className="text-center px-2 py-2 font-medium text-gray-700">แสดง</th>
                <th className="text-center px-2 py-2 font-medium text-gray-700">วางขาย</th>
                <th className="text-right px-2 py-2 font-medium text-gray-700 whitespace-nowrap">ผู้ใหญ่(2-3)</th>
                <th className="text-right px-2 py-2 font-medium text-gray-700 whitespace-nowrap">พักเดี่ยว</th>
                <th className="text-right px-2 py-2 font-medium text-gray-700 whitespace-nowrap">เด็ก(เตียง)</th>
                <th className="text-right px-2 py-2 font-medium text-gray-700 whitespace-nowrap">เด็ก(ไม่เตียง)</th>
                <th className="text-center px-2 py-2 font-medium text-gray-700 bg-purple-50">โปรโมชั่น</th>
                <th className="text-center px-2 py-2 font-medium text-gray-700">ที่นั่ง</th>
                <th className="text-center px-2 py-2 font-medium text-gray-700">จอง</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {/* New Period Row - Insert at top */}
              {showNewPeriodRow && (
                <tr className="border-b-2 border-green-300 bg-green-50">
                  <td className="px-1 py-1 text-center">
                    <span className="text-green-600 font-bold">+</span>
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="date"
                      value={newPeriodData.start_date}
                      onChange={(e) => setNewPeriodData(prev => ({ ...prev, start_date: e.target.value }))}
                      className="w-32 px-1 py-1 border border-green-400 rounded text-xs bg-white focus:border-green-500"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="date"
                      value={newPeriodData.end_date}
                      onChange={(e) => setNewPeriodData(prev => ({ ...prev, end_date: e.target.value }))}
                      className="w-32 px-1 py-1 border border-green-400 rounded text-xs bg-white focus:border-green-500"
                    />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <span className="text-xs text-green-600">On</span>
                  </td>
                  <td className="px-2 py-1 text-center">
                    <span className="text-xs text-green-600">พร้อม</span>
                  </td>
                  {/* ผู้ใหญ่(2-3) */}
                  <td className="px-1 py-1">
                    <div className="flex flex-col gap-0.5">
                      <input
                        type="number"
                        value={newPeriodData.price_adult}
                        onChange={(e) => setNewPeriodData(prev => ({ ...prev, price_adult: e.target.value }))}
                        className="w-24 px-1 py-0.5 border border-green-400 rounded text-xs text-right bg-white"
                        placeholder="ราคา"
                      />
                      <input
                        type="number"
                        value={newPeriodData.discount_adult}
                        onChange={(e) => setNewPeriodData(prev => ({ ...prev, discount_adult: e.target.value }))}
                        className="w-24 px-1 py-0.5 border border-yellow-400 rounded text-xs text-right bg-yellow-50"
                        placeholder="ส่วนลด"
                      />
                    </div>
                  </td>
                  {/* พักเดี่ยว */}
                  <td className="px-1 py-1">
                    <div className="flex flex-col gap-0.5">
                      <input
                        type="number"
                        value={newPeriodData.price_single_surcharge}
                        onChange={(e) => setNewPeriodData(prev => ({ ...prev, price_single_surcharge: e.target.value }))}
                        className="w-20 px-1 py-0.5 border border-green-400 rounded text-xs text-right bg-white"
                        placeholder="ราคา"
                      />
                      <input
                        type="number"
                        value={newPeriodData.discount_single}
                        onChange={(e) => setNewPeriodData(prev => ({ ...prev, discount_single: e.target.value }))}
                        className="w-20 px-1 py-0.5 border border-yellow-400 rounded text-xs text-right bg-yellow-50"
                        placeholder="ส่วนลด"
                      />
                    </div>
                  </td>
                  {/* เด็ก(เตียง) */}
                  <td className="px-1 py-1">
                    <div className="flex flex-col gap-0.5">
                      <input
                        type="number"
                        value={newPeriodData.price_child}
                        onChange={(e) => setNewPeriodData(prev => ({ ...prev, price_child: e.target.value }))}
                        className="w-20 px-1 py-0.5 border border-green-400 rounded text-xs text-right bg-white"
                        placeholder="ราคา"
                      />
                      <input
                        type="number"
                        value={newPeriodData.discount_child_bed}
                        onChange={(e) => setNewPeriodData(prev => ({ ...prev, discount_child_bed: e.target.value }))}
                        className="w-20 px-1 py-0.5 border border-yellow-400 rounded text-xs text-right bg-yellow-50"
                        placeholder="ส่วนลด"
                      />
                    </div>
                  </td>
                  {/* เด็ก(ไม่เตียง) */}
                  <td className="px-1 py-1">
                    <div className="flex flex-col gap-0.5">
                      <input
                        type="number"
                        value={newPeriodData.price_child_nobed}
                        onChange={(e) => setNewPeriodData(prev => ({ ...prev, price_child_nobed: e.target.value }))}
                        className="w-20 px-1 py-0.5 border border-green-400 rounded text-xs text-right bg-white"
                        placeholder="ราคา"
                      />
                      <input
                        type="number"
                        value={newPeriodData.discount_child_nobed}
                        onChange={(e) => setNewPeriodData(prev => ({ ...prev, discount_child_nobed: e.target.value }))}
                        className="w-20 px-1 py-0.5 border border-yellow-400 rounded text-xs text-right bg-yellow-50"
                        placeholder="ส่วนลด"
                      />
                    </div>
                  </td>
                  <td className="px-2 py-1 bg-purple-50">
                    <select
                      value={newPeriodData.promotion_id?.toString() || ''}
                      onChange={(e) => setNewPeriodData(prev => ({ ...prev, promotion_id: e.target.value ? parseInt(e.target.value) : null }))}
                      className="w-32 px-1 py-1 border border-purple-300 rounded text-xs bg-white"
                    >
                      <option value="">ไม่มี</option>
                      {promotions.map(promo => (
                        <option key={promo.id} value={promo.id}>{promo.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1 text-center">
                    <input
                      type="number"
                      value={newPeriodData.capacity}
                      onChange={(e) => setNewPeriodData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                      className="w-12 px-1 py-1 border border-green-400 rounded text-xs text-center bg-white"
                      min={0}
                    />
                  </td>
                  <td className="px-2 py-1 text-center text-gray-400">0</td>
                  <td className="px-2 py-1">
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleSaveNewPeriod}
                        disabled={savingPeriod || !newPeriodData.start_date || !newPeriodData.price_adult}
                        className="text-green-600 hover:bg-green-100 h-6 w-6 p-0"
                      >
                        {savingPeriod ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelNewPeriod}
                        className="text-gray-500 hover:bg-gray-100 h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
              {periods.map((period) => {
                const isEditing = editingRowId === period.id || editingRowId === -1;
                const formatPrice = (val: string | number | null | undefined) => {
                  if (val === null || val === undefined || val === '') return '-';
                  const num = parseFloat(String(val));
                  if (isNaN(num) || num === 0) return '-';
                  return new Intl.NumberFormat('th-TH').format(num);
                };
                const formatDiscount = (val: string | number | null | undefined) => {
                  if (val === null || val === undefined || val === '') return '-';
                  const num = parseFloat(String(val));
                  if (isNaN(num) || num === 0) return '-';
                  return '-' + new Intl.NumberFormat('th-TH').format(num);
                };
                const formatDate = (date: string) => {
                  if (!date) return '-';
                  const d = new Date(date);
                  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
                };
                
                return (
                <tr
                  key={period.id}
                  className={`border-b border-gray-100 hover:bg-blue-50 ${!period.is_visible ? 'opacity-60 bg-gray-50' : ''} ${selectedPeriodIds.includes(period.id) ? 'bg-orange-50' : ''} ${isEditing ? 'bg-blue-50 ring-2 ring-blue-300' : ''}`}
                >
                  <td className="px-1 py-1 text-center">
                    <input
                      type="checkbox"
                      checked={selectedPeriodIds.includes(period.id)}
                      onChange={() => togglePeriodSelect(period.id)}
                      className="rounded w-3.5 h-3.5"
                    />
                  </td>
                  {/* วันเริ่ม */}
                  <td className="px-2 py-1">
                    {isEditing ? (
                      <input
                        type="date"
                        value={period.start_date ? period.start_date.split('T')[0] : ''}
                        onChange={(e) => handleInlineUpdate(period.id, 'start_date', e.target.value)}
                        className="w-32 px-1 py-1 border border-blue-400 rounded text-xs focus:border-blue-500"
                      />
                    ) : (
                      <span className="text-sm whitespace-nowrap">{formatDate(period.start_date)}</span>
                    )}
                  </td>
                  {/* วันสิ้นสุด */}
                  <td className="px-2 py-1">
                    {isEditing ? (
                      <input
                        type="date"
                        value={period.end_date ? period.end_date.split('T')[0] : ''}
                        onChange={(e) => handleInlineUpdate(period.id, 'end_date', e.target.value)}
                        className="w-32 px-1 py-1 border border-blue-400 rounded text-xs focus:border-blue-500"
                      />
                    ) : (
                      <span className="text-sm whitespace-nowrap">{formatDate(period.end_date)}</span>
                    )}
                  </td>
                  {/* แสดง */}
                  <td className="px-2 py-1 text-center">
                    {isEditing ? (
                      <select
                        value={period.is_visible ? 'on' : 'off'}
                        onChange={(e) => handleInlineUpdate(period.id, 'is_visible', e.target.value === 'on')}
                        className={`px-1 py-1 border rounded text-xs ${period.is_visible ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-500'}`}
                      >
                        <option value="on">On</option>
                        <option value="off">Off</option>
                      </select>
                    ) : (
                      <span className={`text-sm px-2 py-0.5 rounded ${period.is_visible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {period.is_visible ? 'On' : 'Off'}
                      </span>
                    )}
                  </td>
                  {/* วางขาย */}
                  <td className="px-2 py-1 text-center">
                    {isEditing ? (
                      <select
                        value={period.sale_status || 'available'}
                        onChange={(e) => handleInlineUpdate(period.id, 'sale_status', e.target.value)}
                        className={`px-1 py-1 border rounded text-xs ${getSaleStatusColor(period.sale_status)}`}
                      >
                        {Object.entries(SALE_STATUS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`text-sm px-2 py-0.5 rounded ${getSaleStatusColor(period.sale_status)}`}>
                        {SALE_STATUS[period.sale_status as keyof typeof SALE_STATUS] || period.sale_status}
                      </span>
                    )}
                  </td>
                  {/* ผู้ใหญ่(2-3) */}
                  <td className="px-1 py-1">
                    {isEditing ? (
                      <div className="flex flex-col gap-0.5">
                        <input
                          type="number"
                          key={`adult-${period.id}-${period.offer?.price_adult}`}
                          defaultValue={period.offer?.price_adult || ''}
                          onBlur={(e) => handleInlineOfferUpdate(period.id, 'price_adult', e.target.value)}
                          className="w-24 px-1 py-0.5 border border-blue-400 rounded text-xs text-right"
                          placeholder="ราคา"
                        />
                        <input
                          type="number"
                          key={`disc-adult-${period.id}-${period.offer?.discount_adult}`}
                          defaultValue={period.offer?.discount_adult || ''}
                          onBlur={(e) => handleInlineOfferUpdate(period.id, 'discount_adult', e.target.value)}
                          className="w-24 px-1 py-0.5 border border-yellow-400 rounded text-xs text-right bg-yellow-50"
                          placeholder="ส่วนลด"
                        />
                      </div>
                    ) : (
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{formatPrice(period.offer?.price_adult)}</div>
                        <div className="text-sm text-red-500">{formatDiscount(period.offer?.discount_adult)}</div>
                      </div>
                    )}
                  </td>
                  {/* พักเดี่ยว */}
                  <td className="px-1 py-1">
                    {isEditing ? (
                      <div className="flex flex-col gap-0.5">
                        <input
                          type="number"
                          key={`single-${period.id}-${period.offer?.price_single_surcharge}`}
                          defaultValue={period.offer?.price_single_surcharge || ''}
                          onBlur={(e) => handleInlineOfferUpdate(period.id, 'price_single_surcharge', e.target.value)}
                          className="w-20 px-1 py-0.5 border border-blue-400 rounded text-xs text-right"
                          placeholder="ราคา"
                        />
                        <input
                          type="number"
                          key={`disc-single-${period.id}-${period.offer?.discount_single}`}
                          defaultValue={period.offer?.discount_single || ''}
                          onBlur={(e) => handleInlineOfferUpdate(period.id, 'discount_single', e.target.value)}
                          className="w-20 px-1 py-0.5 border border-yellow-400 rounded text-xs text-right bg-yellow-50"
                          placeholder="ส่วนลด"
                        />
                      </div>
                    ) : (
                      <div className="text-right">
                        <div className="text-sm text-gray-900">{formatPrice(period.offer?.price_single_surcharge)}</div>
                        <div className="text-sm text-red-500">{formatDiscount(period.offer?.discount_single)}</div>
                      </div>
                    )}
                  </td>
                  {/* เด็ก(เตียง) */}
                  <td className="px-1 py-1">
                    {isEditing ? (
                      <div className="flex flex-col gap-0.5">
                        <input
                          type="number"
                          key={`child-${period.id}-${period.offer?.price_child}`}
                          defaultValue={period.offer?.price_child || ''}
                          onBlur={(e) => handleInlineOfferUpdate(period.id, 'price_child', e.target.value)}
                          className="w-20 px-1 py-0.5 border border-blue-400 rounded text-xs text-right"
                          placeholder="ราคา"
                        />
                        <input
                          type="number"
                          key={`disc-child-${period.id}-${period.offer?.discount_child_bed}`}
                          defaultValue={period.offer?.discount_child_bed || ''}
                          onBlur={(e) => handleInlineOfferUpdate(period.id, 'discount_child_bed', e.target.value)}
                          className="w-20 px-1 py-0.5 border border-yellow-400 rounded text-xs text-right bg-yellow-50"
                          placeholder="ส่วนลด"
                        />
                      </div>
                    ) : (
                      <div className="text-right">
                        <div className="text-sm text-gray-900">{formatPrice(period.offer?.price_child)}</div>
                        <div className="text-sm text-red-500">{formatDiscount(period.offer?.discount_child_bed)}</div>
                      </div>
                    )}
                  </td>
                  {/* เด็ก(ไม่เตียง) */}
                  <td className="px-1 py-1">
                    {isEditing ? (
                      <div className="flex flex-col gap-0.5">
                        <input
                          type="number"
                          key={`nobed-${period.id}-${period.offer?.price_child_nobed}`}
                          defaultValue={period.offer?.price_child_nobed || ''}
                          onBlur={(e) => handleInlineOfferUpdate(period.id, 'price_child_nobed', e.target.value)}
                          className="w-20 px-1 py-0.5 border border-blue-400 rounded text-xs text-right"
                          placeholder="ราคา"
                        />
                        <input
                          type="number"
                          key={`disc-nobed-${period.id}-${period.offer?.discount_child_nobed}`}
                          defaultValue={period.offer?.discount_child_nobed || ''}
                          onBlur={(e) => handleInlineOfferUpdate(period.id, 'discount_child_nobed', e.target.value)}
                          className="w-20 px-1 py-0.5 border border-yellow-400 rounded text-xs text-right bg-yellow-50"
                          placeholder="ส่วนลด"
                        />
                      </div>
                    ) : (
                      <div className="text-right">
                        <div className="text-sm text-gray-900">{formatPrice(period.offer?.price_child_nobed)}</div>
                        <div className="text-sm text-red-500">{formatDiscount(period.offer?.discount_child_nobed)}</div>
                      </div>
                    )}
                  </td>
                  {/* โปรโมชั่น */}
                  <td className="px-2 py-1 bg-purple-50 text-center">
                    {isEditing ? (
                      <select
                        value={period.offer?.promotion_id?.toString() || ''}
                        onChange={(e) => handleInlineOfferUpdate(period.id, 'promotion_id', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-32 px-1 py-1 border border-purple-300 rounded text-xs bg-white"
                      >
                        <option value="">ไม่มี</option>
                        {promotions.map(promo => (
                          <option className="" key={promo.id} value={promo.id}>{promo.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm text-purple-700">
                        {period.offer?.promotion?.name || '-'}
                      </span>
                    )}
                  </td>
                  {/* ที่นั่ง */}
                  <td className="px-2 py-1 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        key={`cap-${period.id}-${period.capacity}`}
                        defaultValue={period.capacity}
                        onBlur={(e) => handleInlineUpdate(period.id, 'capacity', parseInt(e.target.value) || 0)}
                        className="w-12 px-1 py-1 border border-blue-400 rounded text-xs text-center"
                        min={0}
                      />
                    ) : (
                      <span className="text-sm">{period.capacity}</span>
                    )}
                  </td>
                  {/* จอง */}
                  <td className="px-2 py-1 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        key={`book-${period.id}-${period.booked}`}
                        defaultValue={period.booked}
                        onBlur={(e) => handleInlineUpdate(period.id, 'booked', parseInt(e.target.value) || 0)}
                        className="w-12 px-1 py-1 border border-blue-400 rounded text-xs text-center"
                        min={0}
                      />
                    ) : (
                      <span className="text-sm">{period.booked}/{period.capacity}</span>
                    )}
                  </td>
                  {/* Actions */}
                  <td className="px-2 py-1">
                    <div className="flex gap-1">
                      {isEditing && editingRowId !== -1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingRowId(null)}
                          className="text-green-600 hover:bg-green-100 h-6 w-6 p-0"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                      ) : editingRowId !== -1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingRowId(period.id)}
                          className="text-blue-600 hover:bg-blue-100 h-6 w-6 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(period.id)}
                        className="text-red-600 hover:bg-red-50 h-6 w-6 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {periods.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500 pt-2">
          <span>ทั้งหมด {periods.length} รอบ</span>
          <div className="flex items-center gap-4">
            <span className="text-green-600">
              <Eye className="w-4 h-4 inline" /> แสดง {periods.filter(p => p.is_visible).length}
            </span>
            <span>
              ที่นั่งว่าง {periods.reduce((sum, p) => sum + p.available, 0)}
            </span>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">ยืนยันการลบ</h3>
            <p className="text-gray-600 mb-4">คุณต้องการลบรอบเดินทางนี้หรือไม่?</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>ยกเลิก</Button>
              <Button variant="danger" onClick={() => handleDeletePeriod(deleteConfirm)}>ลบ</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  // Itinerary CRUD handlers
  const handleSaveItinerary = async (itinerary: TourItinerary, isNew: boolean) => {
    if (!tour?.id) return;
    setSavingItinerary(true);
    try {
      const data = {
        day_number: itinerary.day_number,
        title: itinerary.title || undefined,
        description: itinerary.description || undefined,
        places: itinerary.places.length > 0 ? itinerary.places : undefined,
        has_breakfast: itinerary.has_breakfast,
        has_lunch: itinerary.has_lunch,
        has_dinner: itinerary.has_dinner,
        meals_note: itinerary.meals_note || undefined,
        accommodation: itinerary.accommodation || undefined,
        hotel_star: itinerary.hotel_star,
        images: itinerary.images.length > 0 ? itinerary.images : undefined,
      };

      if (isNew) {
        const response = await itinerariesApi.create(tour.id, data);
        if (response.success && response.data) {
          setItineraries([...itineraries, {
            ...itinerary,
            id: response.data.id,
            tour_id: tour.id,
          }]);
          setShowNewItineraryRow(false);
          setNewItinerary({
            day_number: itineraries.length + 2,
            title: '',
            description: '',
            places: [],
            has_breakfast: false,
            has_lunch: false,
            has_dinner: false,
            meals_note: '',
            accommodation: '',
            hotel_star: null,
            images: [],
          });
        }
      } else if (itinerary.id) {
        const response = await itinerariesApi.update(tour.id, itinerary.id, data);
        if (response.success) {
          setItineraries(itineraries.map(i => 
            i.id === itinerary.id ? { ...itinerary } : i
          ));
          setEditingItineraryId(null);
        }
      }
    } catch (err) {
      console.error('Failed to save itinerary:', err);
    } finally {
      setSavingItinerary(false);
    }
  };

  const handleDeleteItinerary = async (itineraryId: number) => {
    if (!tour?.id) return;
    if (!confirm('ต้องการลบโปรแกรมวันนี้?')) return;
    
    try {
      const response = await itinerariesApi.delete(tour.id, itineraryId);
      if (response.success) {
        setItineraries(itineraries.filter(i => i.id !== itineraryId));
      }
    } catch (err) {
      console.error('Failed to delete itinerary:', err);
    }
  };

  const handleAddPlace = (itinerary: TourItinerary, setItinerary: (i: TourItinerary) => void) => {
    if (!placeInput.trim()) return;
    setItinerary({
      ...itinerary,
      places: [...itinerary.places, placeInput.trim()],
    });
    setPlaceInput('');
  };

  const handleRemovePlace = (itinerary: TourItinerary, setItinerary: (i: TourItinerary) => void, index: number) => {
    setItinerary({
      ...itinerary,
      places: itinerary.places.filter((_, i) => i !== index),
    });
  };

  const renderItineraryTab = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-500" />
          <h3 className="text-lg font-semibold text-gray-900">โปรแกรมทัวร์รายวัน</h3>
          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">{itineraries.length} วัน</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setShowNewItineraryRow(true);
            setNewItinerary({
              ...newItinerary,
              day_number: itineraries.length + 1,
            });
          }}
          disabled={showNewItineraryRow}
        >
          <Plus className="w-4 h-4 mr-1" />
          เพิ่มวัน
        </Button>
      </div>

      {loadingItineraries ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : itineraries.length === 0 && !showNewItineraryRow ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">ยังไม่มีโปรแกรมรายวัน</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowNewItineraryRow(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            เพิ่มวันที่ 1
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Existing Itineraries */}
          {itineraries.map((itinerary) => (
            <div key={itinerary.id} className="border rounded-lg overflow-hidden">
              {editingItineraryId === itinerary.id ? (
                /* Edit Mode */
                <ItineraryEditForm
                  itinerary={itinerary}
                  onSave={(updated) => handleSaveItinerary(updated, false)}
                  onCancel={() => setEditingItineraryId(null)}
                  saving={savingItinerary}
                  placeInput={placeInput}
                  setPlaceInput={setPlaceInput}
                  onAddPlace={handleAddPlace}
                  onRemovePlace={handleRemovePlace}
                />
              ) : (
                /* View Mode */
                <div className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-teal-500 text-white rounded-lg flex flex-col items-center justify-center">
                        <span className="text-xs">วันที่</span>
                        <span className="text-lg font-bold">{itinerary.day_number}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{itinerary.title || `วันที่ ${itinerary.day_number}`}</h4>
                        {itinerary.places.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {itinerary.places.map((place, i) => (
                              <span key={i} className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full">
                                {place}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Utensils className="w-3 h-3" />
                            {itinerary.has_breakfast && 'เช้า '}
                            {itinerary.has_lunch && 'กลางวัน '}
                            {itinerary.has_dinner && 'เย็น '}
                            {!itinerary.has_breakfast && !itinerary.has_lunch && !itinerary.has_dinner && '-'}
                          </span>
                          {itinerary.accommodation && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {itinerary.accommodation}
                              {itinerary.hotel_star && ` (${itinerary.hotel_star}★)`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingItineraryId(itinerary.id!)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItinerary(itinerary.id!)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* New Itinerary Form */}
          {showNewItineraryRow && (
            <div className="border border-teal-200 rounded-lg overflow-hidden bg-teal-50">
              <ItineraryEditForm
                itinerary={newItinerary}
                onSave={(updated) => handleSaveItinerary(updated, true)}
                onCancel={() => setShowNewItineraryRow(false)}
                saving={savingItinerary}
                placeInput={placeInput}
                setPlaceInput={setPlaceInput}
                onAddPlace={handleAddPlace}
                onRemovePlace={handleRemovePlace}
                isNew
              />
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderMediaTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cover Image Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900">รูปปก (Cover Image)</h4>
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">600×600</span>
              <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">WebP</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mb-4">รูปจะถูก resize และแปลงเป็น WebP อัตโนมัติ</p>
          
          {/* ชื่อไฟล์ที่จะใช้ */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-600 mb-1">ชื่อไฟล์และ Alt ที่จะใช้:</p>
            <p className="text-sm font-medium text-blue-900 break-all">
              {formData.tour_code && formData.title 
                ? `${formData.tour_code}-${formData.title}.webp`
                : 'กรุณากรอก รหัสทัวร์ และ ชื่อทัวร์ ก่อน'}
            </p>
          </div>
          
          {/* Preview */}
          {(formData.cover_image_url || tour?.cover_image_url) ? (
            <div className="mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={formData.cover_image_url || tour?.cover_image_url || ''}
                alt="Cover preview"
                className="w-48 h-48 object-cover rounded-lg border border-gray-200"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          ) : (
            <div className="mb-4 w-48 h-48 bg-gray-50 rounded-lg border border-gray-200 border-dashed flex flex-col items-center justify-center">
              <ImageIcon className="w-10 h-10 text-gray-300" />
              <span className="text-gray-400 text-sm mt-2">ยังไม่มีรูป</span>
            </div>
          )}
          
          {/* Upload Zone */}
          <label className="block cursor-pointer">
            <input type="file" accept="image/*" onChange={handleUploadImage} disabled={uploadingImage} className="hidden" />
            <div className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
              uploadingImage 
                ? 'border-gray-300 bg-gray-50' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}>
              {uploadingImage ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                  <span className="text-gray-600">กำลังอัปโหลด...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">คลิกเพื่ออัปโหลดรูปภาพ</span>
                </div>
              )}
            </div>
          </label>
          
          {/* URL Input */}
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">หรือใส่ URL</label>
              <input
                type="url"
                name="cover_image_url"
                value={formData.cover_image_url}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Alt Text</label>
              <input
                type="text"
                name="cover_image_alt"
                value={formData.cover_image_alt}
                onChange={handleChange}
                placeholder="คำอธิบายรูปภาพ"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* PDF Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-gray-600" />
            <h4 className="font-semibold text-gray-900">ไฟล์ PDF โปรแกรมทัวร์</h4>
          </div>
          
          <p className="text-sm text-gray-500 mb-4">อัปโหลดไฟล์ PDF รายละเอียดโปรแกรมทัวร์</p>
          
          {/* Preview */}
          {(formData.pdf_url || tour?.pdf_url) ? (
            <a
              href={formData.pdf_url || tour?.pdf_url || ''}
              target="_blank"
              rel="noopener noreferrer"
              className="block mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-red-500" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">โปรแกรมทัวร์.pdf</p>
                  <p className="text-sm text-gray-500">คลิกเพื่อเปิดดู</p>
                </div>
                <Eye className="w-5 h-5 text-gray-400" />
              </div>
            </a>
          ) : (
            <div className="mb-4 p-6 bg-gray-50 rounded-lg border border-gray-200 border-dashed text-center">
              <FileText className="w-10 h-10 text-gray-300 mx-auto" />
              <span className="text-gray-400 text-sm mt-2 block">ยังไม่มีไฟล์ PDF</span>
            </div>
          )}
          
          {/* Upload Zone */}
          <label className="block cursor-pointer">
            <input type="file" accept=".pdf" onChange={handleUploadPdf} disabled={uploadingPdf} className="hidden" />
            <div className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
              uploadingPdf 
                ? 'border-gray-300 bg-gray-50' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}>
              {uploadingPdf ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                  <span className="text-gray-600">กำลังอัปโหลด...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">คลิกเพื่ออัปโหลด PDF</span>
                </div>
              )}
            </div>
          </label>
          
          {/* URL Input */}
          <div className="mt-4">
            <label className="block text-sm text-gray-600 mb-1">หรือใส่ URL</label>
            <input
              type="url"
              name="pdf_url"
              value={formData.pdf_url}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );


  
  const renderViewTab = () => (
    <div className="space-y-8">
      {/* Tour Card Preview */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-orange-500" />
          ตัวอย่าง Card ทัวร์
        </h3>
        
        {/* Clean Tour Card - Image First, Info Below */}
        <div className="w-[320px]">
          <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            {/* Cover Image - Clean, No Overlay */}
            <div className="relative w-full aspect-square overflow-hidden">
              {formData.cover_image_url ? (
                <img
                  src={formData.cover_image_url}
                  alt={formData.cover_image_alt || formData.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100">
                  <ImageIcon className="w-16 h-16 text-orange-300" />
                </div>
              )}
              
              {/* Tour Category Badge - Small, Corner */}
              {formData.tour_category && (
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1 text-white text-xs font-bold rounded-full shadow-md ${
                    formData.tour_category === 'premium' 
                      ? 'bg-purple-500' 
                      : 'bg-emerald-500'
                  }`}>
                    {formData.tour_category === 'premium' ? '✨ พรีเมียม' : '💰 ราคาดี'}
                  </span>
                </div>
              )}
            </div>

            {/* Content Section - All Info Here */}
            <div className="p-4">
              {/* Country & Duration Row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {selectedCountries.slice(0, 2).map(country => (
                    <img
                      key={country.id}
                      src={`https://flagcdn.com/w40/${country.iso2?.toLowerCase()}.png`}
                      alt={country.name_th || country.name_en}
                      className="w-6 h-4 object-cover rounded shadow-sm"
                      loading="lazy"
                    />
                  ))}

                  <span className="text-sm text-gray-600 font-medium">
                    {selectedCountries.map(c => c.name_th || c.name_en).slice(0, 1).join('')}
                  </span>
                  {/* Cities */}
                  {formData.city_ids.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {Object.values(citiesByCountry).flat().filter(c => formData.city_ids.includes(c.id)).slice(0, 2).map((city, idx) => (
                        <span key={idx} className="text-xs text-orange-700 bg-gradient-to-r from-orange-100 to-amber-100 px-2 py-0.5 rounded-full font-medium">
                          {city.name_th || city.name_en}
                        </span>
                      ))}
                      {formData.city_ids.length > 2 && (
                        <span className="text-xs text-gray-500">+{formData.city_ids.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <span className="font-semibold">{formData.duration_days} วัน {formData.duration_nights} คืน</span>
                </div>
                
              </div>

              {/* Title */}
              <h4 className="font-bold text-gray-900 text-base mb-2 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors">
                {formData.title || 'ชื่อทัวร์'}
              </h4>

              {/* Hotel Stars */}
              <div className="flex items-center gap-1 mb-1">
                  {formData.hotel_star && (
                  <Building2 className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-xs text-gray-400">โรงแรม</span>
                {[...Array(Number(formData.hotel_star) || 0)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              
              </div>
              {/* สายการบิน*/}
              <div className="flex items-center gap-1 mb-1">
                <Plane className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400">สายการบิน</span>
                {(() => {
                  const selectedTransport = transports.find(t => t.id.toString() === formData.transport_id);
                  if (selectedTransport) {
                    return (
                      <div className="flex items-center gap-1">
                        {selectedTransport.image && (
                          <img 
                            src={selectedTransport.image}
                            alt={selectedTransport.name}
                            className="h-4 w-auto object-contain"
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </div>
                    );
                  }
                  return <span className="text-xs text-gray-400">-</span>;
                })()}
              </div>
              {/* วันเดินทาง*/}
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                 <span className="text-xs text-gray-400">วันเดินทาง</span>
                {periods && periods.length > 0 ? (
                  <span className="text-xs text-blue-800">
                    <b>{getTravelDateRange(periods) || '-'}</b>
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </div>

              {/* Price Section */}
              <div className="flex items-end justify-between pt-3 border-t border-gray-100">
                <div>
                  <span className="text-xs text-gray-400">เริ่มต้น</span>
                  <div className="flex items-baseline gap-2">
                    {formData.discount_adult && Number(formData.discount_adult) > 0 && Number(formData.discount_adult) < Number(formData.price_adult) && (
                      <span className="text-sm text-gray-400 line-through">฿{Number(formData.price_adult).toLocaleString()}</span>
                    )}
                    <span className="text-2xl font-black text-orange-600">
                      ฿{(() => {
                        const price = Number(formData.price_adult) || 0;
                        const discount = Number(formData.discount_adult) || 0;
                        // ถ้ามีส่วนลดและส่วนลดน้อยกว่าราคา แสดง ราคา - ส่วนลด
                        if (discount > 0 && discount < price) {
                          return (price - discount).toLocaleString();
                        }
                        return price.toLocaleString();
                      })()}
                    </span>
                  </div>
                </div>
                <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-md flex items-center gap-1">
                  รายละเอียด
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      

      {/* Tour Detail Preview - Viator Style */}
      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-orange-500" />
          ตัวอย่างหน้ารายละเอียดทัวร์
        </h3>
        
        {/* Viator-Style Layout */}
        <div className="max-w-4xl bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Title Section */}
          <div className="p-4 border-b border-gray-100">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {formData.title || 'ชื่อทัวร์'}
            </h1>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Building2 className="w-4 h-4 text-gray-400" />
                {[...Array(Number(formData.hotel_star) || 0)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
                {[...Array(5 - (Number(formData.hotel_star) || 0))].map((_, i) => (
                  <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
                ))}
              </div>
              <span className="text-blue-600 hover:underline cursor-pointer">822 จำนวนผู้ชม</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {selectedCountries.map(c => c.name_th || c.name_en).slice(0, 1).join(', ') || 'ประเทศ'}
                {formData.city_ids.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {Object.values(citiesByCountry).flat().filter(c => formData.city_ids.includes(c.id)).slice(0, 3).map((city, idx) => (
                      <span key={idx} className="text-xs text-orange-700 bg-gradient-to-r from-orange-100 to-amber-100 px-2 py-0.5 rounded-full font-medium">
                        {city.name_th || city.name_en}
                      </span>
                    ))}
                    {formData.city_ids.length > 3 && (
                      <span className="text-xs text-gray-500">+{formData.city_ids.length - 3}</span>
                    )}
                  </div>
                )}
              </span>
              <span className={`ml-auto px-2 py-0.5 text-xs font-medium rounded ${
                formData.tour_category === 'premium' 
                  ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                  : formData.tour_category === 'budget'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-300'
              }`}>
                {formData.tour_category === 'premium' ? '✨ พรีเมียม' : formData.tour_category === 'budget' ? '💰 ราคาดี' : 'ทั่วไป'}
              </span>
            </div>
          </div>

          {/* Main Content - 2 Columns */}
          <div className="flex">
            {/* Left: Image Gallery */}
            <div className="flex">
              {/* Thumbnails - Show cover + gallery images */}
              <div className="w-20 flex flex-col gap-1 p-1 bg-gray-50">
                {/* Cover image as first thumbnail */}
                {formData.cover_image_url && (
                  <div 
                    onClick={() => setSelectedPreviewImage(-1)}
                    className={`aspect-square rounded overflow-hidden cursor-pointer border-2 ${selectedPreviewImage === -1 ? 'border-orange-500' : 'border-transparent hover:border-orange-300'}`}
                  >
                    <img src={formData.cover_image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                {/* Gallery images */}
                {galleryImages.slice(0, 3).map((img, idx) => (
                  <div 
                    key={img.id || img.url}
                    onClick={() => setSelectedPreviewImage(idx)}
                    className={`aspect-square rounded overflow-hidden cursor-pointer border-2 ${selectedPreviewImage === idx ? 'border-orange-500' : 'border-transparent hover:border-orange-300'}`}
                  >
                    <img 
                      src={img.thumbnail_url || img.url} 
                      alt={img.alt || ''} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ))}
                {/* Placeholder if no gallery images */}
                {galleryImages.length < 3 && [...Array(3 - galleryImages.length)].map((_, idx) => (
                  <div 
                    key={`placeholder-${idx}`} 
                    className="aspect-square rounded overflow-hidden cursor-pointer border-2 border-transparent"
                  >
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
               
              </div>

              {/* Main Image */}
              <div className="w-72 h-72 relative flex-shrink-0">
                {/* Show selected image */}
                {selectedPreviewImage === -1 && formData.cover_image_url ? (
                  <img
                    src={formData.cover_image_url}
                    alt={formData.cover_image_alt || formData.title}
                    className="w-72 h-72 object-cover"
                  />
                ) : selectedPreviewImage >= 0 && galleryImages[selectedPreviewImage] ? (
                  <img
                    src={galleryImages[selectedPreviewImage].url}
                    alt={galleryImages[selectedPreviewImage].alt || formData.title}
                    className="w-72 h-72 object-cover"
                  />
                ) : galleryImages.length > 0 ? (
                  <img
                    src={galleryImages[0].url}
                    alt={galleryImages[0].alt || formData.title}
                    className="w-72 h-72 object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-200 to-amber-300">
                    <ImageIcon className="w-16 h-16 text-white/50" />
                  </div>
                )}
                {/* Share & Wishlist */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button type="button" className="px-3 py-1.5 bg-white rounded-full text-sm flex items-center gap-1 shadow">
                    แชร์ ▾
                  </button>
                  <button type="button" className="px-3 py-1.5 bg-white rounded-full text-sm flex items-center gap-1 shadow">
                    ♡ รายการโปรด
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Price & Booking */}
            <div className="flex-1 p-4 border-l border-gray-100">
              {/* Promo Badge */}
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-xs rounded mb-3">
                <Clock className="w-3 h-3" />
                หมดเขต 28 ก.พ.
              </div>

              {/* Price */}
              <div className="mb-3">
                <span className="text-sm text-gray-500">เริ่มต้น</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-red-500 text-sm font-medium">-10%</span>
                  <span className="text-2xl font-bold text-gray-900">
                    ฿{(() => {
                      const price = Number(formData.price_adult) || 0;
                      const discount = Number(formData.discount_adult) || 0;
                      if (discount > 0 && discount < price) {
                        return (price - discount).toLocaleString();
                      }
                      return price.toLocaleString();
                    })()}
                  </span>
                  <span className="text-sm text-gray-500">ต่อท่าน</span>
                </div>
                {formData.discount_adult && Number(formData.discount_adult) > 0 && (
                  <div className="text-sm text-gray-400">
                    ราคาปกติ <span className="line-through">฿{Number(formData.price_adult).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Discounted rates badge */}
              <div className="flex items-center gap-1 text-xs text-green-600 mb-4">
                <Check className="w-3 h-3" />
                ราคาพิเศษสำหรับเด็ก
              </div>

              {/* Date & Travelers */}
              <div className="flex gap-2 mb-3">
                <div className="flex-1 p-2 border border-gray-200 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">วันเดินทาง</div>
                  <div className="text-sm font-medium flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    พุธ, 28 ม.ค.
                  </div>
                </div>
                <div className="flex-1 p-2 border border-gray-200 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">ผู้เดินทาง</div>
                  <div className="text-sm font-medium flex items-center gap-1">
                    👤 13 ท่าน
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <button className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg mb-4 transition-colors">
                ตรวจสอบที่ว่าง
              </button>

              {/* Benefits */}
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-orange-500 mt-0.5" />
                  <div>
                    <span className="font-medium">ยกเลิกฟรี</span>
                    <span className="text-gray-600"> ล่วงหน้า 24 ชม. ก่อนเดินทาง</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-orange-500 mt-0.5" />
                  <div>
                    <span className="font-medium">จองก่อน จ่ายทีหลัง</span>
                    <span className="text-gray-600"> - มั่นใจได้ พร้อมความยืดหยุ่น</span>
                  </div>
                </div>
              </div>

              {/* Book ahead */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <div className="font-medium text-sm">จองล่วงหน้า!</div>
                  <div className="text-xs text-gray-500">โดยเฉลี่ย ทัวร์นี้ถูกจองล่วงหน้า 23 วัน</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Features Row */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center gap-6 text-sm text-gray-600 flex-wrap">
              <span className="flex items-center gap-2 font-mono bg-gray-200 px-2 py-1 rounded">
                🏷️ {formData.tour_code || 'รหัสทัวร์'}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {formData.duration_days} วัน {formData.duration_nights} คืน
              </span>
              <span className="flex items-center gap-2">
                <Plane className="w-4 h-4" />
                {(() => {
                  const selectedTransport = transports.find(t => t.id.toString() === formData.transport_id);
                  if (selectedTransport) {
                    return (
                      <span className="flex items-center gap-1">
                        {selectedTransport.image && (
                          <img 
                            src={selectedTransport.image}
                            alt={selectedTransport.name}
                            className="h-5 w-auto object-contain"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <span>{selectedTransport.name}</span>
                      </span>
                    );
                  }
                  return <span className="text-gray-400">ยังไม่ได้เลือก</span>;
                })()}
              </span>
              
              <span className="flex items-center gap-2">
                👥 ที่นั่ง: {periods.reduce((sum, p) => sum + p.booked, 0)}/{periods.reduce((sum, p) => sum + p.capacity, 0)}
              </span>
            </div>
          </div>

          {/* Tour Details Section */}
          <div className="p-6 border-t border-gray-200">
            {/* Tabs */}
            <div className="flex gap-6 border-b border-gray-200 mb-6">
              <button className="pb-3 text-orange-600 font-semibold border-b-2 border-orange-500">
                รายละเอียดทัวร์
              </button>
              <button className="pb-3 text-gray-500 hover:text-gray-700">
                ช่วงเวลาการเดินทาง
              </button>
              <button className="pb-3 text-gray-500 hover:text-gray-700">
                เงื่อนไข
              </button>
              <button className="pb-3 text-gray-500 hover:text-gray-700">
                รีวิว
              </button>
            </div>

            {/* Highlights */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                ไฮไลท์ทัวร์
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {formData.highlights.slice(0, 6).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-gray-700">
                    <Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
                {formData.highlights.length === 0 && (
                  <div className="col-span-2 text-gray-400 text-sm">
                    ยังไม่มีไฮไลท์ - เพิ่มได้ที่แท็บข้อมูลทั่วไป
                  </div>
                )}
              </div>
            </div>

            {/* Shopping & Food */}
            {(formData.shopping_highlights.length > 0 || formData.food_highlights.length > 0) && (
              <div className="grid grid-cols-2 gap-6 mb-6">
                {formData.shopping_highlights.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      🛍️ ช้อปปิ้ง
                    </h4>
                    <div className="space-y-2">
                      {formData.shopping_highlights.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-gray-600 text-sm">
                          <Check className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {formData.food_highlights.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      🍜 อาหาร
                    </h4>
                    <div className="space-y-2">
                      {formData.food_highlights.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-gray-600 text-sm">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Special Highlights */}
            {formData.special_highlights.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  ✨ ไฮไลท์พิเศษ
                </h4>
                <div className="flex flex-wrap gap-2">
                  {formData.special_highlights.map((item, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 rounded-full text-sm font-medium">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {formData.description && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  รายละเอียด
                </h3>
                <div 
                  className="prose prose-sm max-w-none text-gray-600"
                  dangerouslySetInnerHTML={{ __html: formData.description }}
                />
              </div>
            )}

            {/* Hashtags */}
            {formData.hashtags.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {formData.hashtags.map((tag, idx) => (
                    <span key={idx} className="text-blue-600 text-sm hover:underline cursor-pointer">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSeoTab = () => {
    // Function to generate slug from title
    const generateSlug = () => {
      if (!formData.title) {
        alert('กรุณากรอกชื่อทัวร์ก่อน');
        return;
      }
      
      // Confirm before changing slug (if already has slug)
      if (formData.slug && !confirm('ต้องการเปลี่ยน Slug ใหม่หรือไม่? การเปลี่ยน Slug อาจทำให้ลิงก์เดิมใช้งานไม่ได้')) {
        return;
      }
      
      // Convert Thai and English title to slug
      const slug = formData.title
        .toLowerCase()
        .trim()
        .replace(/[ก-๙]/g, '') // Remove Thai characters for cleaner URL
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/-+/g, '-') // Replace multiple - with single -
        .replace(/^-|-$/g, ''); // Remove leading/trailing -
      
      // If slug is empty (Thai-only title), use tour_code
      const finalSlug = slug || formData.tour_code?.toLowerCase().replace(/_/g, '-') || 'tour';
      
      setFormData(prev => ({ ...prev, slug: finalSlug }));
    };

    return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Slug (URL)</label>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm shrink-0">nexttripholiday.com/tours/</span>
          <div className="flex-1 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg font-mono text-gray-700">
            {formData.slug || <span className="text-gray-400">ยังไม่มี slug</span>}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateSlug}
            className="shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            {formData.slug ? 'สร้างใหม่' : 'สร้าง Slug'}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Slug จะถูกสร้างจากชื่อทัวร์ และไม่สามารถซ้ำกับทัวร์อื่นได้
        </p>
        {formData.slug && (
          <p className="text-xs text-orange-600 mt-1">
            ⚠️ หากเปลี่ยน Slug ลิงก์เดิมจะใช้งานไม่ได้
          </p>
        )}
        {/* Check if title changed but slug not updated */}
        {formData.slug && formData.title && (() => {
          const expectedSlug = formData.title
            .toLowerCase()
            .trim()
            .replace(/[ก-๙]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') || formData.tour_code?.toLowerCase().replace(/_/g, '-');
          
          // Check if current slug doesn't match expected (might have been changed)
          const slugBase = formData.slug.replace(/-\d+$/, ''); // Remove trailing number like -2, -3
          if (expectedSlug && slugBase !== expectedSlug && !formData.slug.startsWith(expectedSlug)) {
            return (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  💡 <strong>ชื่อทัวร์อาจไม่ตรงกับ Slug</strong>
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  ชื่อทัวร์ปัจจุบัน: &quot;{formData.title}&quot;<br/>
                  Slug แนะนำ: <code className="bg-yellow-100 px-1 rounded">{expectedSlug}</code>
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  คลิก &quot;สร้างใหม่&quot; หากต้องการอัปเดต Slug ให้ตรงกับชื่อทัวร์
                </p>
              </div>
            );
          }
          return null;
        })()}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Meta Title</label>
        <input
          type="text"
          name="meta_title"
          value={formData.meta_title}
          onChange={handleChange}
          placeholder="ทัวร์ญี่ปุ่น โตเกียว ฟูจิ | NextTrip"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          ความยาว: {formData.meta_title.length}/60 ตัวอักษร
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
        <textarea
          name="meta_description"
          value={formData.meta_description}
          onChange={handleChange}
          rows={3}
          placeholder="คำอธิบายสำหรับ SEO..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          ความยาว: {formData.meta_description.length}/160 ตัวอักษร
        </p>
      </div>

      {/* Preview */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-500 mb-2">ตัวอย่างผลการค้นหา:</p>
        <div className="bg-white p-4 rounded border">
          <p className="text-blue-600 text-lg hover:underline cursor-pointer">
            {formData.meta_title || formData.title || 'ชื่อทัวร์'}
          </p>
          <p className="text-green-700 text-sm">
            nexttrip.com/tours/{formData.slug || 'tour-slug'}
          </p>
          <p className="text-gray-600 text-sm mt-1">
            {formData.meta_description || formData.highlights?.slice(0, 150) || 'คำอธิบายทัวร์...'}
          </p>
        </div>
      </div>
    </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/tours">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">แก้ไขทัวร์</h1>
            <p className="text-gray-500 text-sm">
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{tour.tour_code}</span>
              <span className="mx-2">·</span>
              {tour.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/tours">
            <Button variant="outline" type="button">ยกเลิก</Button>
          </Link>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                บันทึกการแก้ไข
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {errors.general[0]}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'periods' && periods.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 rounded-full">{periods.length}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <form onSubmit={handleSubmit}>
        <Card className="p-6">
          {activeTab === 'basic' && renderBasicTab()}
          {activeTab === 'location' && renderLocationTab()}
          {activeTab === 'periods' && renderPeriodsTab()}
          {activeTab === 'itinerary' && renderItineraryTab()}
          {activeTab === 'media' && renderMediaTab()}
          {activeTab === 'seo' && renderSeoTab()}
          {activeTab === 'view' && renderViewTab()}
          {activeTab === 'json' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Code className="w-5 h-5 text-purple-500" />
                  Response จาก Backend
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!tour) return;
                    setLoadingDebug(true);
                    try {
                      const res = await toursApi.debug(tour.id);
                      if (res.success) {
                        setDebugData(res.data);
                      }
                    } catch (err) {
                      console.error('Failed to load debug:', err);
                    } finally {
                      setLoadingDebug(false);
                    }
                  }}
                  disabled={loadingDebug}
                >
                  {loadingDebug ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  โหลดข้อมูล
                </Button>
              </div>

              {debugData ? (
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-[700px] text-xs font-mono">
                  {JSON.stringify(debugData, null, 2)}
                </pre>
              ) : (
                <div className="bg-gray-100 p-8 rounded-lg text-center text-gray-500">
                  กดปุ่ม &quot;โหลดข้อมูล&quot; เพื่อดู Response จาก Backend API
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Bottom Save Button */}
        <div className="flex justify-end mt-6 gap-3">
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
                บันทึกการแก้ไข
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
