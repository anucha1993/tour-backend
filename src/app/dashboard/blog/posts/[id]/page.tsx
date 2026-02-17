'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft, Save, Upload, Trash2, Eye, X, FileText,
} from 'lucide-react';
import {
  blogPostsApi, blogCategoriesApi,
  BlogPost, BlogCategory,
} from '@/lib/api';

export default function BlogPostEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = id === 'new';

  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [form, setForm] = useState({
    category_id: null as number | null,
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    author_name: 'Admin',
    status: 'draft' as 'draft' | 'published' | 'archived',
    is_featured: false,
    published_at: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    tags: [] as string[],
  });
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [postId, setPostId] = useState<number | null>(isNew ? null : Number(id));
  const [tagInput, setTagInput] = useState('');
  const [showSeo, setShowSeo] = useState(false);

  // Fetch categories
  useEffect(() => {
    blogCategoriesApi.list().then(res => {
      const d = ((res as unknown) as { data: BlogCategory[] })?.data;
      if (d) setCategories(d);
    });
  }, []);

  // Fetch post data if editing
  useEffect(() => {
    if (!isNew && postId) {
      blogPostsApi.get(postId).then(res => {
        const d = ((res as unknown) as { data: BlogPost })?.data;
        if (d) {
          setForm({
            category_id: d.category_id,
            title: d.title,
            slug: d.slug,
            excerpt: d.excerpt || '',
            content: d.content || '',
            author_name: d.author_name || 'Admin',
            status: d.status,
            is_featured: d.is_featured,
            published_at: d.published_at ? d.published_at.slice(0, 16) : '',
            seo_title: d.seo_title || '',
            seo_description: d.seo_description || '',
            seo_keywords: d.seo_keywords || '',
            tags: d.tags || [],
          });
          setCoverImageUrl(d.cover_image_url);
        }
        setLoading(false);
      });
    }
  }, [isNew, postId]);

  const save = async () => {
    if (!form.title.trim()) { alert('กรุณากรอกหัวข้อบทความ'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        category_id: form.category_id || null,
        published_at: form.published_at || null,
        tags: form.tags.length > 0 ? form.tags : null,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        seo_keywords: form.seo_keywords || null,
      };

      if (postId) {
        await blogPostsApi.update(postId, payload);
      } else {
        const res = await blogPostsApi.create(payload);
        const d = ((res as unknown) as { data: BlogPost })?.data;
        if (d) {
          setPostId(d.id);
          // Update URL without full reload
          window.history.replaceState(null, '', `/dashboard/blog/posts/${d.id}`);
        }
      }
      alert('บันทึกสำเร็จ');
    } catch { alert('เกิดข้อผิดพลาด'); }
    setSaving(false);
  };

  const uploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !postId) {
      if (!postId) alert('กรุณาบันทึกบทความก่อนอัปโหลดรูป');
      return;
    }
    try {
      const res = await blogPostsApi.uploadCoverImage(postId, file);
      if (res.data?.cover_image_url) setCoverImageUrl(res.data.cover_image_url);
    } catch { alert('อัปโหลดไม่สำเร็จ'); }
  };

  const deleteCover = async () => {
    if (!postId || !confirm('ลบรูปปก?')) return;
    await blogPostsApi.deleteCoverImage(postId);
    setCoverImageUrl(null);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm({ ...form, tags: [...form.tags, tag] });
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setForm({ ...form, tags: form.tags.filter(t => t !== tag) });
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="flex items-center gap-3"><FileText className="w-7 h-7 text-blue-600" /><h1 className="text-2xl font-bold text-gray-900">โหลดบทความ...</h1></div>
      <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl" />)}</div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard/blog/posts')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isNew ? 'เขียนบทความใหม่' : 'แก้ไขบทความ'}</h1>
            <p className="text-gray-500 text-sm">รอบรู้เรื่องเที่ยว</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {postId && form.status === 'published' && (
            <a href={`${process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'}/blog/${form.slug}`} target="_blank" rel="noopener"
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              <Eye className="w-4 h-4" />ดูหน้าเว็บ
            </a>
          )}
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60">
            <Save className="w-4 h-4" />{saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - 2 cols */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <div className="bg-white rounded-xl border-1 border-solid border-gray-200 p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อบทความ *</label>
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="เช่น 10 สิ่งที่ต้องรู้ก่อนไปญี่ปุ่น" className="w-full px-4 py-3 border-1 border-solid border-gray-300 rounded-lg text-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
              <input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                placeholder="auto-generate ถ้าไม่กรอก" className="w-full px-3 py-2 border-1 border-solid border-gray-300 rounded-lg text-sm text-gray-600" />
            </div>
          </div>

          {/* Excerpt */}
          <div className="bg-white rounded-xl border-1 border-solid border-gray-200 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">เนื้อหาย่อ</label>
            <textarea value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })}
              rows={3} placeholder="สรุปเนื้อหาสั้นๆ สำหรับแสดงในหน้ารายการ..." className="w-full px-3 py-2 border-1 border-solid border-gray-300 rounded-lg" />
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl border-1 border-solid border-gray-200 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">เนื้อหาบทความ (HTML)</label>
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
              rows={20} placeholder="<p>เขียนเนื้อหาบทความที่นี่...</p>" className="w-full px-3 py-2 border-1 border-solid border-gray-300 rounded-lg font-mono text-sm" />
          </div>

          {/* SEO */}
          <div className="bg-white rounded-xl border-1 border-solid border-gray-200 overflow-hidden">
            <button onClick={() => setShowSeo(!showSeo)} className="w-full flex justify-between items-center p-4 hover:bg-gray-50">
              <span className="font-semibold text-gray-700">SEO Settings</span>
              <span className="text-sm text-gray-400">{showSeo ? '▲' : '▼'}</span>
            </button>
            {showSeo && (
              <div className="p-5 pt-0 space-y-3 border-t border-solid border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SEO Title</label>
                  <input type="text" value={form.seo_title} onChange={e => setForm({ ...form, seo_title: e.target.value })}
                    placeholder="หัวข้อสำหรับ SEO" className="w-full px-3 py-2 border-1 border-solid border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label>
                  <textarea value={form.seo_description} onChange={e => setForm({ ...form, seo_description: e.target.value })}
                    rows={2} placeholder="คำอธิบายสำหรับ SEO" className="w-full px-3 py-2 border-1 border-solid border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SEO Keywords</label>
                  <input type="text" value={form.seo_keywords} onChange={e => setForm({ ...form, seo_keywords: e.target.value })}
                    placeholder="keyword1, keyword2, ..." className="w-full px-3 py-2 border-1 border-solid border-gray-300 rounded-lg" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - 1 col */}
        <div className="space-y-5">
          {/* Status & publish */}
          <div className="bg-white rounded-xl border-1 border-solid border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-700">สถานะ & เผยแพร่</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'draft' | 'published' | 'archived' })}
                className="w-full px-3 py-2 border-1 border-solid border-gray-300 rounded-lg">
                <option value="draft">แบบร่าง</option>
                <option value="published">เผยแพร่</option>
                <option value="archived">เก็บถาวร</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เผยแพร่</label>
              <input type="datetime-local" value={form.published_at} onChange={e => setForm({ ...form, published_at: e.target.value })}
                className="w-full px-3 py-2 border-1 border-solid border-gray-300 rounded-lg" />
              <p className="text-xs text-gray-400 mt-1">ถ้าไม่กรอก จะใช้เวลาปัจจุบัน</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} className="rounded" />
              <span className="text-sm text-gray-700">บทความแนะนำ (Featured)</span>
            </label>
          </div>

          {/* Category */}
          <div className="bg-white rounded-xl border-1 border-solid border-gray-200 p-5 space-y-3">
            <h3 className="font-semibold text-gray-700">หมวดหมู่</h3>
            <select value={form.category_id ?? ''} onChange={e => setForm({ ...form, category_id: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-3 py-2 border-1 border-solid border-gray-300 rounded-lg">
              <option value="">ไม่มีหมวดหมู่</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Cover Image */}
          <div className="bg-white rounded-xl border-1 border-solid border-gray-200 p-5 space-y-3">
            <h3 className="font-semibold text-gray-700">รูปปก</h3>
            {coverImageUrl ? (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                <Image src={coverImageUrl} alt="cover" fill className="object-cover" />
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <label className="p-1.5 bg-black/50 text-white rounded-lg cursor-pointer hover:bg-black/70">
                    <Upload className="w-3.5 h-3.5" /><input type="file" accept="image/*" onChange={uploadCover} className="hidden" />
                  </label>
                  <button onClick={deleteCover} className="p-1.5 bg-red-500/80 text-white rounded-lg hover:bg-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">{postId ? 'อัปโหลดรูปปก' : 'บันทึกบทความก่อน'}</span>
                {postId && <input type="file" accept="image/*" onChange={uploadCover} className="hidden" />}
              </label>
            )}
          </div>

          {/* Author */}
          <div className="bg-white rounded-xl border-1 border-solid border-gray-200 p-5 space-y-3">
            <h3 className="font-semibold text-gray-700">ผู้เขียน</h3>
            <input type="text" value={form.author_name} onChange={e => setForm({ ...form, author_name: e.target.value })}
              placeholder="ชื่อผู้เขียน" className="w-full px-3 py-2 border-1 border-solid border-gray-300 rounded-lg" />
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl border-1 border-solid border-gray-200 p-5 space-y-3">
            <h3 className="font-semibold text-gray-700">Tags</h3>
            <div className="flex gap-2">
              <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="พิมพ์แล้ว Enter" className="flex-1 px-3 py-2 border-1 border-solid border-gray-300 rounded-lg text-sm" />
              <button onClick={addTag} className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm">เพิ่ม</button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
