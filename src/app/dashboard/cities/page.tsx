'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card } from '@/components/ui';
import { 
  Plus, 
  Search, 
  MapPin,
  Star,
  Loader2,
  ChevronRight,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import { citiesApi, CountryWithCities, COUNTRY_REGIONS } from '@/lib/api';

// Function to convert ISO2 code to flag URL
const getFlagUrl = (iso2: string): string => {
  if (!iso2 || iso2.length !== 2) return '';
  return `https://flagcdn.com/w80/${iso2.toLowerCase()}.png`;
};

export default function CitiesPage() {
  const [search, setSearch] = useState('');
  const [countries, setCountries] = useState<CountryWithCities[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [totalCities, setTotalCities] = useState(0);

  const fetchCountries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: Record<string, string> = {};
      
      if (search) params.search = search;
      if (filterRegion !== 'all') params.region = filterRegion;

      const response = await citiesApi.getCountriesWithCities(params);
      
      if (response.success) {
        setCountries(response.data || []);
        setTotalCities(response.meta?.total_cities || 0);
      } else {
        setError(response.message || 'Failed to load countries');
      }
    } catch (err: any) {
      console.error('API error:', err);
      setError(err.message || 'Failed to load countries');
    } finally {
      setLoading(false);
    }
  }, [search, filterRegion]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCountries();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Group countries by region
  const groupedCountries = countries.reduce((acc, country) => {
    const region = country.region || 'Other';
    if (!acc[region]) acc[region] = [];
    acc[region].push(country);
    return acc;
  }, {} as Record<string, CountryWithCities[]>);

  // Sort regions: Asia first
  const sortedRegions = Object.keys(groupedCountries).sort((a, b) => {
    if (a === 'Asia') return -1;
    if (b === 'Asia') return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-7 h-7" />
            เมือง
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            จัดการข้อมูลเมือง/จุดหมายปลายทาง ({totalCities} เมือง ใน {countries.length} ประเทศ)
          </p>
        </div>
        <Link href="/dashboard/cities/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มเมือง
          </Button>
        </Link>
      </div>

      {/* Search & Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาประเทศ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Region Filter */}
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">ทุกภูมิภาค</option>
            {Object.entries(COUNTRY_REGIONS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={fetchCountries}
          >
            ลองใหม่
          </Button>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      )}

      {/* Countries List - Grouped by Region */}
      {!loading && !error && (
        <div className="space-y-8">
          {sortedRegions.map((region) => (
            <div key={region}>
              {/* Region Header */}
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {COUNTRY_REGIONS[region] || region}
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({groupedCountries[region].length} ประเทศ)
                </span>
              </div>

              {/* Countries Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {groupedCountries[region].map((country) => (
                  <Link 
                    key={country.id} 
                    href={`/dashboard/cities/country/${country.id}`}
                  >
                    <Card className="p-4 hover:shadow-lg transition-all cursor-pointer group hover:border-primary-500 dark:hover:border-primary-400">
                      <div className="flex items-center gap-4">
                        {/* Flag */}
                        <div className="flex-shrink-0 w-16 h-12 rounded overflow-hidden shadow-sm bg-gray-100 dark:bg-gray-700">
                          {country.iso2 && (
                            <img
                              src={getFlagUrl(country.iso2)}
                              alt={`${country.name_en} flag`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-primary-600">
                            {country.name_th || country.name_en}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {country.name_en}
                          </p>
                          
                          {/* Stats */}
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {country.cities_count} เมือง
                            </span>
                            {country.popular_count > 0 && (
                              <span className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current" />
                                {country.popular_count}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* Empty State */}
          {countries.length === 0 && (
            <Card className="p-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                ไม่พบข้อมูลเมือง
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                ยังไม่มีเมืองในระบบ หรือไม่พบตามเงื่อนไขที่ค้นหา
              </p>
              <Link href="/dashboard/cities/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่มเมืองใหม่
                </Button>
              </Link>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
