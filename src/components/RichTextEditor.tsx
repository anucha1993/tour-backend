'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { useEffect, useCallback, useState, useRef } from 'react';

// Common emojis for quick access
const EMOJI_LIST = [
  '✈️', '🏨', '🍽️', '🛍️', '🎢', '🏖️', '⛷️', '🏔️', '🌸', '🍁',
  '❄️', '🌅', '🌄', '🎭', '🎪', '🚌', '🚂', '🚢', '🛳️', '🚁',
  '🗼', '🏰', '🕌', '⛩️', '🗽', '🎡', '🎠', '🎢', '🛒', '💎',
  '👜', '🎁', '🍜', '🍣', '🍱', '🍲', '🥘', '🍰', '🍦', '☕',
  '✅', '❌', '⭐', '💯', '🔥', '💰', '🎉', '👍', '❤️', '🌟',
];

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  /** ถ้าส่ง prop นี้ ปุ่มแทรกรูปในเนื้อหาจะเปิดใช้งาน */
  onImageUpload?: (file: File) => Promise<string>;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = '',
  className = '',
  rows = 4,
  onImageUpload,
}: RichTextEditorProps) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiPosition, setEmojiPosition] = useState({ top: 0, left: 0 });
  const [uploading, setUploading] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const emojiRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleToggleEmoji = () => {
    if (!showEmoji && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setEmojiPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
    setShowEmoji(!showEmoji);
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none min-h-[${rows * 1.5}rem] p-3`,
      },
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiRef.current &&
        !emojiRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const insertEmoji = useCallback(
    (emoji: string) => {
      if (editor) {
        editor.chain().focus().insertContent(emoji).run();
      }
    },
    [editor]
  );

  // Handle image file selection + upload
  const handleImageFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !onImageUpload) return;
      e.target.value = '';
      setUploading(true);
      try {
        const url = await onImageUpload(file);
        editor?.chain().focus().setImage({ src: url, alt: file.name }).run();
      } catch {
        alert('อัปโหลดรูปไม่สำเร็จ');
      } finally {
        setUploading(false);
      }
    },
    [onImageUpload, editor]
  );

  // Handle link set/unset
  const handleSetLink = useCallback(() => {
    if (!editor) return;
    if (!linkUrl) { editor.chain().focus().unsetLink().run(); setShowLinkInput(false); return; }
    const href = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    editor.chain().focus().setLink({ href }).run();
    setLinkUrl('');
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`border border-gray-300 rounded-lg overflow-visible ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-200 flex-wrap relative">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-gray-200 ${
            editor.isActive('bold') ? 'bg-gray-300' : ''
          }`}
          title="ตัวหนา"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h6a4 4 0 014 4 4 4 0 01-1.5 3.12A4.5 4.5 0 0114 14.5 4.5 4.5 0 019.5 19H4a1 1 0 01-1-1V4zm4 5h2a2 2 0 100-4H7v4zm0 2v4h2.5a2.5 2.5 0 000-5H7z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-gray-200 ${
            editor.isActive('italic') ? 'bg-gray-300' : ''
          }`}
          title="ตัวเอียง"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 3a1 1 0 011-1h6a1 1 0 110 2h-2.268l-2.585 12H12a1 1 0 110 2H6a1 1 0 110-2h2.268l2.585-12H9a1 1 0 01-1-1z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded hover:bg-gray-200 ${
            editor.isActive('strike') ? 'bg-gray-300' : ''
          }`}
          title="ขีดฆ่า"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 3a1 1 0 01.894.553L14.618 10H17a1 1 0 110 2h-2.382l-2.724 5.447a1 1 0 01-1.788 0L7.382 12H3a1 1 0 110-2h4.382l3.724-6.447A1 1 0 0110 3z" />
          </svg>
        </button>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-gray-200 ${
            editor.isActive('bulletList') ? 'bg-gray-300' : ''
          }`}
          title="รายการ"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a1 1 0 100 2 1 1 0 000-2zm3 1a1 1 0 011-1h8a1 1 0 110 2H8a1 1 0 01-1-1zm0 5a1 1 0 011-1h8a1 1 0 110 2H8a1 1 0 01-1-1zm0 5a1 1 0 011-1h8a1 1 0 110 2H8a1 1 0 01-1-1zM4 9a1 1 0 100 2 1 1 0 000-2zm0 5a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded hover:bg-gray-200 ${
            editor.isActive('orderedList') ? 'bg-gray-300' : ''
          }`}
          title="รายการลำดับ"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h.5a.5.5 0 01.5.5v3a.5.5 0 01-1 0V4H3.5a.5.5 0 010-1H4zm4 1a1 1 0 011-1h8a1 1 0 110 2H8a1 1 0 01-1-1zm0 5a1 1 0 011-1h8a1 1 0 110 2H8a1 1 0 01-1-1zm0 5a1 1 0 011-1h8a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* H1/H2/H3 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded hover:bg-gray-200 text-xs font-bold ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''}`}
          title="หัวข้อใหญ่"
        >H1</button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded hover:bg-gray-200 text-xs font-bold ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''}`}
          title="หัวข้อกลาง"
        >H2</button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded hover:bg-gray-200 text-xs font-bold ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''}`}
          title="หัวข้อเล็ก"
        >H3</button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('blockquote') ? 'bg-gray-300' : ''}`}
          title="อ้างอิง"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Link */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              if (editor.isActive('link')) {
                editor.chain().focus().unsetLink().run();
              } else {
                setShowLinkInput(v => !v);
              }
            }}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('link') ? 'bg-blue-100 text-blue-600' : ''}`}
            title="ลิงก์"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
          {showLinkInput && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-1 w-64">
              <input
                type="url"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); handleSetLink(); }
                  if (e.key === 'Escape') setShowLinkInput(false);
                }}
                placeholder="https://..."
                className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded"
                autoFocus
              />
              <button type="button" onClick={handleSetLink} className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">ตกลง</button>
            </div>
          )}
        </div>

        {/* Image Upload */}
        {onImageUpload && (
          <>
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading}
              className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50"
              title="แทรกรูปภาพ"
            >
              {uploading ? (
                <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </button>
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} />
          </>
        )}

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Emoji Button */}
        <div className="relative">
          <button
            ref={buttonRef}
            type="button"
            onClick={handleToggleEmoji}
            className={`p-1.5 rounded hover:bg-gray-200 ${showEmoji ? 'bg-gray-300' : ''}`}
            title="อิโมจิ"
          >
            😀
          </button>
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30"
          title="ย้อนกลับ"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30"
          title="ทำซ้ำ"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.293 3.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 9H9a5 5 0 00-5 5v2a1 1 0 11-2 0v-2a7 7 0 017-7h5.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} className="bg-white rounded-b-lg" />

      {/* Emoji Picker - Portal style fixed position */}
      {showEmoji && (
        <div
          ref={emojiRef}
          className="fixed p-3 bg-white border border-gray-200 rounded-xl shadow-2xl z-[99999] w-80"
          style={{ 
            top: emojiPosition.top,
            left: Math.min(emojiPosition.left, window.innerWidth - 340),
          }}
        >
          <div className="grid grid-cols-10 gap-1.5 max-h-52 overflow-y-auto">
            {EMOJI_LIST.map((emoji, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  insertEmoji(emoji);
                  setShowEmoji(false);
                }}
                className="p-1.5 hover:bg-orange-100 rounded-lg text-xl transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <style jsx global>{`
        .ProseMirror {
          min-height: ${rows * 1.5}rem;
          padding: 0.75rem;
        }
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
        }
        .ProseMirror ul {
          list-style-type: disc;
        }
        .ProseMirror ol {
          list-style-type: decimal;
        }
        .ProseMirror h1,
        .ProseMirror h2,
        .ProseMirror h3 {
          font-weight: 600;
          margin-top: 0.5rem;
          margin-bottom: 0.25rem;
        }
        .ProseMirror h1 {
          font-size: 1.5rem;
        }
        .ProseMirror h2 {
          font-size: 1.25rem;
        }
        .ProseMirror h3 {
          font-size: 1.1rem;
        }
        .ProseMirror blockquote {
          border-left: 3px solid #ddd;
          padding-left: 1rem;
          margin-left: 0;
          color: #666;
        }
        .ProseMirror a {
          color: #2563eb;
          text-decoration: underline;
          cursor: pointer;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
          cursor: pointer;
          display: block;
        }
        .ProseMirror img.ProseMirror-selectednode {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
