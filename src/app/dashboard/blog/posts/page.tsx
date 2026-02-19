'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  FileText, Plus, Search, Eye, Pencil, Trash2,
  Clock, Star, ChevronLeft, ChevronRight, MapPin, Globe,
} from 'lucide-react';
import {
  blogPostsApi, blogCategoriesApi, countriesApi, citiesApi,
  BlogPost, BlogCategory,
} from '@/lib/api';

interface Country { id: number; name_th: string; name_en: string; flag_emoji?: string }
interface City { id: number; name_th: string; name_en: string; country_id: number }

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: 'แบบร่าง', color: 'bg-gray-100 text-gray-600' },
  published: { label: 'เผยแพร่', color: 'bg-green-100 text-green-700' },
  archived: { label: 'เก็บถาวร', color: 'bg-yellow-100 text-yellow-700' },
};

export default function BlogPostsPage() {
  const [items, setItems] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>(undefined);
  const [countryFilter, setCountryFilter] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const res = await blogPostsApi.list({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      category_id: categoryFilter,
      search: search || undefined,
      page,
    });
    const r = (res as unknown) as { data: BlogPost[]; last_page: number; total: number };
    if (r?.data) { setItems(r.data); setTotalPages(r.last_page || 1); setTotal(r.total || 0); }
    setLoading(false);
  }, [statusFilter, categoryFilter, search, page]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    blogCategoriesApi.list().then(res => {
      const d = ((res as unknown) as { data: BlogCategory[] })?.data;
      if (d) setCategories(d);
    });
    countriesApi.list({ is_active: 'true', per_page: '200' }).then(res => {
      const d = ((res as unknown) as { data: Country[] })?.data;
      if (d) setCountries(d);
    });
    citiesApi.list({ per_page: '500', is_active: 'true' }).then(res => {
      const d = ((res as unknown) as { data: City[] })?.data;
      if (d) setCities(d);
    });
  }, []);

  const countryMap = Object.fromEntries(countries.map(c => [c.id, c]));
  const cityMap = Object.fromEntries(cities.map(c => [c.id, c]));

  const filteredItems = countryFilter
    ? items.filter(p => p.country_ids && p.country_ids.includes(countryFilter))
    : items;

  const del = async (id: number) => {
    if (!confirm('ยืนยันลบบทความนี้?')) return;
    await blogPostsApi.delete(id);
    fetchPosts();
  };

  const formatDate = (d: string | null) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <FileText className="w-7 h-7 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">บทความ</h1>
            <p className="text-gray-500 text-sm">รอบรู้เรื่องเที่ยว</p>
          </div>
        </div>
        <Link href="/dashboard/blog/posts/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
          <Plus className="w-4 h-4" />เขียนบทความ
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="ค้นหาบทความ..." className="w-full pl-9 pr-3 py-2 border-1 border-solid border-gray-300 rounded-lg" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border-1 border-solid border-gray-300 rounded-lg">
          <option value="all">ทุกสถานะ</option>
          {Object.entries(STATUS_MAP).map(([k, { label }]) => <option key={k} value={k}>{label}</option>)}
        </select>
        <select value={categoryFilter ?? ''} onChange={e => { setCategoryFilter(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
          className="px-3 py-2 border-1 border-solid border-gray-300 rounded-lg">
          <option value="">ทุกหมวดหมู่</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={countryFilter ?? ''} onChange={e => { setCountryFilter(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
          className="px-3 py-2 border-1 border-solid border-gray-300 rounded-lg">
          <option value="">ทุกประเทศ</option>
          {countries.map(c => <option key={c.id} value={c.id}>{c.flag_emoji} {c.name_th}</option>)}
        </select>
        <span className="text-sm text-gray-500">{total} บทความ</span>
      </div>

      {/* Post List */}
      {loading ? (
        <div className="animate-pulse space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <FileText className="w-16 h-16 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">ยังไม่มีบทความ</p>
          <p className="text-sm mt-1">เริ่มเขียนบทความแรก!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map(post => (
            <div key={post.id} className="bg-white border-1 border-solid border-gray-200 rounded-xl p-4 flex gap-4 items-start">
              {/* Cover image */}
              <div className="w-32 h-20 bg-gray-100 rounded-lg overflow-hidden relative flex-shrink-0">
                {post.cover_image_url ? (
                  <Image src={post.cover_image_url} alt={post.title} fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full"><FileText className="w-8 h-8 text-gray-300" /></div>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 truncate">{post.title}</h3>
                  {post.is_featured && <Star className="w-4 h-4 text-amber-400 fill-current flex-shrink-0" />}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_MAP[post.status]?.color || ''}`}>
                    {STATUS_MAP[post.status]?.label || post.status}
                  </span>
                  {post.category && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{post.category.name}</span>}
                  {post.country_ids && post.country_ids.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-emerald-500" />
                      {post.country_ids.slice(0, 3).map(id => (
                        <span key={id} className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full">
                          {countryMap[id]?.flag_emoji} {countryMap[id]?.name_th || id}
                        </span>
                      ))}
                      {post.country_ids.length > 3 && <span className="text-gray-400">+{post.country_ids.length - 3}</span>}
                    </span>
                  )}
                  {post.city_ids && post.city_ids.length > 0 && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-orange-400" />
                      {post.city_ids.slice(0, 3).map(id => (
                        <span key={id} className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded-full">
                          {cityMap[id]?.name_th || id}
                        </span>
                      ))}
                      {post.city_ids.length > 3 && <span className="text-gray-400">+{post.city_ids.length - 3}</span>}
                    </span>
                  )}
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(post.published_at)}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.view_count}</span>
                  {post.reading_time_min && <span>{post.reading_time_min} นาที</span>}
                </div>
                {post.excerpt && <p className="text-sm text-gray-500 mt-1 line-clamp-1">{post.excerpt}</p>}
              </div>
              {/* Actions */}
              <div className="flex gap-1 flex-shrink-0">
                <Link href={`/dashboard/blog/posts/${post.id}`}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-4 h-4" /></Link>
                <button onClick={() => del(post.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded-lg border-1 border-solid border-gray-200 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm text-gray-600">หน้า {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-2 rounded-lg border-1 border-solid border-gray-200 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}
