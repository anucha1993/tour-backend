'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
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
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = '',
  className = '',
  rows = 4,
}: RichTextEditorProps) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiPosition, setEmojiPosition] = useState({ top: 0, left: 0 });
  const emojiRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
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

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded hover:bg-gray-200 text-sm font-semibold ${
            editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''
          }`}
          title="หัวข้อ"
        >
          H
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded hover:bg-gray-200 ${
            editor.isActive('blockquote') ? 'bg-gray-300' : ''
          }`}
          title="อ้างอิง"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>

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
      `}</style>
    </div>
  );
}
