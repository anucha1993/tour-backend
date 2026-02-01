'use client';

import { Tour, TOUR_BADGES } from '@/lib/api';
import { 
  X, 
  Calendar, 
  Plane, 
  Flame,
  Star,
  Building2,
  ChevronRight,
  ImageIcon,
} from 'lucide-react';

interface TourPreviewModalProps {
  tour: Tour;
  onClose: () => void;
}

// Format price
const formatPrice = (price: string | null) => {
  if (!price) return '-';
  return new Intl.NumberFormat('th-TH').format(parseFloat(price));
};

// Get travel date range from periods (min start_date - max start_date)
const getTravelDateRange = (periods: { start_date: string }[] | undefined) => {
  if (!periods || periods.length === 0) return null;
  
  const dates = periods.map(p => new Date(p.start_date).getTime());
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  
  const formatDate = (d: Date) => {
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = (d.getFullYear() + 543).toString().slice(-2);
    return `${day} ${month} ${year}`;
  };
  
  return `${formatDate(minDate)} - ${formatDate(maxDate)}`;
};

export default function TourPreviewModal({ tour, onClose }: TourPreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 p-2 bg-white hover:bg-gray-100 rounded-full shadow-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tour Card - เหมือน edit page 100% */}
        <div className="w-[320px]">
          <div className="group bg-white rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            {/* Cover Image - Clean, No Overlay */}
            <div className="relative w-full aspect-square overflow-hidden">
              {tour.cover_image_url ? (
                <img
                  src={tour.cover_image_url}
                  alt={tour.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100">
                  <ImageIcon className="w-16 h-16 text-orange-300" />
                </div>
              )}
              
              {/* Badge - Small, Corner */}
              {tour.promotion_type === 'fire_sale' && (
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 text-white text-xs font-bold rounded-full shadow-md bg-gradient-to-r from-orange-500 to-red-600 animate-pulse flex items-center gap-1">
                    <Flame className="w-3 h-3" /> โปรไฟไหม้
                  </span>
                </div>
              )}
              {tour.badge && tour.promotion_type !== 'fire_sale' && (
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1 text-white text-xs font-bold rounded-full shadow-md ${
                    tour.badge === 'HOT' ? 'bg-red-500' :
                    tour.badge === 'NEW' ? 'bg-green-500' :
                    tour.badge === 'PROMOTION' ? 'bg-orange-500' :
                    'bg-gray-500'
                  }`}>
                    {TOUR_BADGES[tour.badge] || tour.badge}
                  </span>
                </div>
              )}
            </div>

            {/* Content Section - All Info Here */}
            <div className="p-4">
              {/* Country & Duration Row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {tour.countries && tour.countries.slice(0, 2).map(country => (
                    <img
                      key={country.id}
                      src={`https://flagcdn.com/w40/${country.iso2?.toLowerCase()}.png`}
                      alt={country.name_th || country.name_en}
                      className="w-6 h-4 object-cover rounded shadow-sm"
                      loading="lazy"
                    />
                  ))}
                  <span className="text-sm text-gray-600 font-medium">
                    {tour.primary_country?.name_th || tour.primary_country?.name_en || ''}
                  </span>
                  {/* Cities */}
                  {tour.cities && tour.cities.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {tour.cities.slice(0, 2).map((city, idx) => (
                        <span key={idx} className="text-xs text-orange-700 bg-gradient-to-r from-orange-100 to-amber-100 px-2 py-0.5 rounded-full font-medium">
                          {city.name_th || city.name_en}
                        </span>
                      ))}
                      {tour.cities.length > 2 && (
                        <span className="text-xs text-gray-500">+{tour.cities.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <span className="font-semibold">{tour.duration_days} วัน {tour.duration_nights} คืน</span>
                </div>
              </div>

              {/* Title */}
              <h4 className="font-bold text-gray-900 text-base mb-2 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors">
                {tour.title || 'ชื่อทัวร์'}
              </h4>

              {/* Hotel Stars */}
              <div className="flex items-center gap-1 mb-1">
                {(tour.hotel_star_max || tour.hotel_star_min) && (
                  <Building2 className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-xs text-gray-400">โรงแรม</span>
                {[...Array(tour.hotel_star_max || tour.hotel_star_min || 0)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>

              {/* สายการบิน */}
              <div className="flex items-center gap-1 mb-1">
                <Plane className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400">สายการบิน</span>
                {tour.transports && tour.transports.length > 0 ? (
                  <div className="flex items-center gap-1">
                    {tour.transports[0].transport?.image && (
                      <img 
                        src={tour.transports[0].transport.image}
                        alt={tour.transports[0].transport_name}
                        className="h-4 w-auto object-contain"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <span className="text-xs text-gray-700 font-medium">
                      {tour.transports[0].transport_name}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </div>

              {/* วันเดินทาง */}
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400">วันเดินทาง</span>
                {tour.periods && tour.periods.length > 0 ? (
                  <span className="text-xs text-blue-800">
                    <b>{getTravelDateRange(tour.periods)}</b>
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
                    {tour.discount_amount && parseFloat(tour.discount_amount) > 0 && (
                      <span className="text-sm text-gray-400 line-through">
                        ฿{formatPrice(tour.max_price || tour.min_price)}
                      </span>
                    )}
                    <span className="text-2xl font-black text-orange-600">
                      ฿{formatPrice(tour.min_price)}
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
    </div>
  );
}
