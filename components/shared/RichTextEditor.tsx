import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { Highlight } from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';

// Custom Font Size Extension
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) return {}
              return { style: `font-size: ${attributes.fontSize}` }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }: any) => {
        return chain().setMark('textStyle', { fontSize }).run()
      },
      unsetFontSize: () => ({ chain }: any) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run()
      },
    } as any
  },
});

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  height?: string;
}

const RichTextEditor: React.FC<Props> = ({ content, onChange, placeholder, height = '300px' }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [showSpecialCharPicker, setShowSpecialCharPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const toolbarRef = useRef<HTMLDivElement>(null);

  // Close all menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setShowTableMenu(false);
        setShowSpecialCharPicker(false);
        setShowEmojiPicker(false);
        setShowColorPicker(false);
        setShowHighlightPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Simple toast helper for shared component
  const showToast = (msg: string) => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm z-[99999] animate-bounce shadow-2xl';
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  // Stability fix for Tiptap: use a ref for onChange to avoid stale closures
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
      Subscript,
      Superscript,
      FontSize,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChangeRef.current(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] px-8 py-8 text-[16px] leading-relaxed text-gray-700 h-full',
      },
    },
  });

  const addImage = useCallback(() => {
    const url = window.prompt('Image URL');
    if (url) editor?.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const handleSearch = () => {
    if (!editor || !searchQuery) return;
    (window as any).find(searchQuery);
  };

  const handleCopy = async () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, ' ');
    if (text) {
      await navigator.clipboard.writeText(text);
    }
  };

  const handleCut = async () => {
    if (!editor) return;
    await handleCopy();
    editor.chain().focus().deleteSelection().run();
  };

  const handlePaste = async () => {
    if (!editor) return;
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        editor.chain().focus().insertContent(text).run();
      }
    } catch (err) {
      showToast('Please use Ctrl+V / Cmd+V to paste content.');
    }
  };

  const insertSpecialChar = (char: string) => {
    editor?.chain().focus().insertContent(char).run();
    setShowSpecialCharPicker(false);
  };

  const insertEmoji = (emoji: string) => {
    editor?.chain().focus().insertContent(emoji).run();
    setShowEmojiPicker(false);
  };

  if (!editor) return null;

  const colors = ['#000000', '#4B5563', '#9CA3AF', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'];
  const highlights = ['#FFFF00', '#00FF00', '#00FFFF', '#FF00FF', '#FF0000', '#C0C0C0', '#F3F4F6', '#D1D5DB'];
  const specialChars = [
    '©', '®', '™', '€', '£', '¥', '§', '¶', '†', '‡', '•', '…', '‰', '′', '″', '‹', '›', '«', '»', '–', '—',
    '±', '×', '÷', '≈', '≠', '≤', '≥', '∞', 'µ', 'π', 'Ω', '∑', '∫', 'Δ', 'θ', 'λ', 'α', 'β', 'γ', 'δ', 'ε',
    'ζ', 'η', 'ι', 'κ', 'ν', 'ξ', 'ο', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω', '←', '↑', '→', '↓', '↔', '↵',
    '⇐', '⇑', '⇒', '⇓', '⇔', '∀', '∂', '∃', '∅', '∇', '∈', '∉', '∋', '∏', '∝', '∠', '∧', '∨', '∩', '∪', '∴',
    '∼', '≅', '≈', '≠', '≡', '≤', '≥', '⊂', '⊃', '⊄', '⊆', '⊇', '⊕', '⊗', '⊥', '⋅', '⌈', '⌉', '⌊', '⌋'
  ];
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈', '🙉', '🙊', '💋', '💌', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣', '💔', '❤', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💯', '💢', '💥', '💫', '💦', '💨', '🕳', '💣', '💬', '👁‍🗨', '🗨', '🗯', '💭', '💤', '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁', '👅', '👄'
  ];

  return (
    <div className={`border border-gray-200 rounded-[14px] overflow-hidden bg-white shadow-sm ring-1 ring-black/[0.02] flex flex-col ${isFullscreen ? 'fixed inset-0 z-[10000] rounded-none h-screen w-screen' : ''}`}>

      {/* Search Bar Overlay */}
      {showSearchBar && (
        <div className="bg-indigo-50 border-b border-indigo-100 p-2 flex items-center gap-3 animate-slide-down">
          <span className="material-symbols-outlined text-indigo-400 ml-2">search</span>
          <input
            type="text"
            placeholder="Find in text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 bg-transparent border-none outline-none text-[14px] font-bold text-indigo-900 placeholder:text-indigo-300"
          />
          <button onClick={handleSearch} className="px-3 py-1 bg-indigo-600 text-white rounded-md text-[12px] font-bold">Find Next</button>
          <button onClick={() => setShowSearchBar(false)} className="material-symbols-outlined text-indigo-300 hover:text-indigo-600 mr-2">close</button>
        </div>
      )}

      {/* Premium Toolbar Grid Layout */}
      <div ref={toolbarRef} className="bg-[#f8f9fa] border-b border-[#d1d5db] flex flex-col shrink-0 select-none shadow-sm rounded-t-xl relative z-[100]">

        {/* Row 1: Compact Operations Toolbar */}
        <div className="flex items-center h-[38px] px-2 bg-white border-b border-[#e9ecef]">
          {/* Clipboard Group */}
          <div className="flex items-center px-0.5">
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={handleCut} className="w-[30px] h-[30px] flex items-center justify-center hover:bg-gray-100 rounded transition-all text-gray-400 hover:text-gray-900" title="Cut"><span className="material-symbols-outlined text-[18px]">content_cut</span></button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={handleCopy} className="w-[30px] h-[30px] flex items-center justify-center hover:bg-gray-100 rounded transition-all text-gray-400 hover:text-gray-900" title="Copy"><span className="material-symbols-outlined text-[18px]">content_copy</span></button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={handlePaste} className="w-[30px] h-[30px] flex items-center justify-center hover:bg-gray-100 rounded transition-all text-gray-400 hover:text-gray-900" title="Paste"><span className="material-symbols-outlined text-[18px]">content_paste</span></button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => showToast('Paste as text')} className="w-[30px] h-[30px] flex items-center justify-center hover:bg-gray-100 rounded transition-all text-gray-400" title="Paste Text"><span className="material-symbols-outlined text-[18px]">assignment_turned_in</span></button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => showToast('Paste from Word')} className="w-[30px] h-[30px] flex items-center justify-center hover:bg-gray-100 rounded transition-all text-gray-400" title="Paste Word"><span className="material-symbols-outlined text-[18px]">description</span></button>
          </div>

          <div className="w-[1px] h-[18px] bg-gray-200 mx-1.5"></div>

          {/* History Group */}
          <div className="flex items-center px-0.5">
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="w-[30px] h-[30px] flex items-center justify-center hover:bg-gray-100 rounded transition-all text-gray-400 disabled:opacity-20" title="Undo"><span className="material-symbols-outlined text-[19px]">undo</span></button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="w-[30px] h-[30px] flex items-center justify-center hover:bg-gray-100 rounded transition-all text-gray-400 disabled:opacity-20" title="Redo"><span className="material-symbols-outlined text-[19px]">redo</span></button>
          </div>

          <div className="w-[1px] h-[18px] bg-gray-200 mx-1.5"></div>

          {/* Spell check */}
          <div className="flex items-center px-0.5 relative">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setSpellCheckEnabled(!spellCheckEnabled);
                showToast(`Spellcheck ${!spellCheckEnabled ? 'Enabled' : 'Disabled'}`);
              }}
              className={`flex items-center h-[30px] hover:bg-gray-100 rounded transition-all font-bold group px-1 ${spellCheckEnabled ? 'text-gray-900' : 'text-gray-400'}`}
            >
              <div className="flex items-center relative pr-1.5">
                <span className="text-[12px] tracking-tight uppercase">abc</span>
                {spellCheckEnabled && <span className="material-symbols-outlined text-[14px] text-green-500 absolute -bottom-0.5 -right-0 font-bold">check</span>}
              </div>
              <span className="material-symbols-outlined text-[13px] text-gray-400">expand_more</span>
            </button>
          </div>

          <div className="w-[1px] h-[18px] bg-gray-200 mx-1.5"></div>

          {/* Links Group */}
          <div className="flex items-center px-0.5">
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={setLink} className={`w-[30px] h-[30px] flex items-center justify-center rounded transition-all ${editor.isActive('link') ? 'bg-gray-100 text-blue-600' : 'hover:bg-gray-100 text-gray-400'}`} title="Link"><span className="material-symbols-outlined text-[18px]">link</span></button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().unsetLink().run()} className="w-[30px] h-[30px] flex items-center justify-center hover:bg-gray-100 rounded transition-all text-gray-400" title="Unlink"><span className="material-symbols-outlined text-[18px]">link_off</span></button>
          </div>

          <div className="w-[1px] h-[18px] bg-gray-200 mx-1.5"></div>

          {/* Assets Group */}
          <div className="flex items-center px-0.5 gap-0.5">
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => {
              const name = window.prompt('Anchor');
              if (name) editor.chain().focus().insertContent(`<a id="${name}"></a>`).run();
            }} className="w-[30px] h-[30px] flex items-center justify-center hover:bg-gray-100 rounded transition-all text-gray-400" title="Anchor"><span className="material-symbols-outlined text-[18px]">flag</span></button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={addImage} className="w-[30px] h-[30px] flex items-center justify-center hover:bg-gray-100 rounded transition-all text-gray-400" title="Image"><span className="material-symbols-outlined text-[18px]">image</span></button>
            <div className="relative">
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setShowTableMenu(!showTableMenu); setShowSpecialCharPicker(false); setShowEmojiPicker(false); setShowColorPicker(false); setShowHighlightPicker(false); }} className={`w-[30px] h-[30px] flex items-center justify-center rounded transition-all ${editor.isActive('table') ? 'bg-gray-100 text-gray-900 border border-gray-200' : 'hover:bg-gray-100 text-gray-400'}`} title="Table"><span className="material-symbols-outlined text-[18px]">grid_on</span></button>

              {/* Table Menu positioned below Button */}
              {showTableMenu && (
                <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 shadow-2xl rounded-xl p-2 z-[300] flex flex-col gap-1 min-w-[220px] animate-in zoom-in-95">
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); setShowTableMenu(false); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 rounded-lg text-sm text-gray-700 transition-colors">
                    <span className="material-symbols-outlined text-indigo-500 text-[18px]">add_table</span>
                    Insert Table
                  </button>
                  <div className="h-[1px] bg-gray-100 my-1"></div>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { editor.chain().focus().addColumnBefore().run(); setShowTableMenu(false); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg text-sm text-gray-600">
                    <span className="material-symbols-outlined text-[18px]">view_column</span>
                    Add Column Before
                  </button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { editor.chain().focus().addColumnAfter().run(); setShowTableMenu(false); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg text-sm text-gray-600">
                    <span className="material-symbols-outlined text-[18px]">view_column</span>
                    Add Column After
                  </button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { editor.chain().focus().deleteColumn().run(); setShowTableMenu(false); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 rounded-lg text-sm text-red-600">
                    <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                    Delete Column
                  </button>
                  <div className="h-[1px] bg-gray-100 my-1"></div>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { editor.chain().focus().addRowBefore().run(); setShowTableMenu(false); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg text-sm text-gray-600">
                    <span className="material-symbols-outlined text-[18px]">view_stream</span>
                    Add Row Before
                  </button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { editor.chain().focus().addRowAfter().run(); setShowTableMenu(false); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg text-sm text-gray-600">
                    <span className="material-symbols-outlined text-[18px]">view_stream</span>
                    Add Row After
                  </button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { editor.chain().focus().deleteRow().run(); setShowTableMenu(false); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 rounded-lg text-sm text-red-600">
                    <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                    Delete Row
                  </button>
                  <div className="h-[1px] bg-gray-100 my-1"></div>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { editor.chain().focus().deleteTable().run(); setShowTableMenu(false); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-red-600 hover:text-white rounded-lg text-sm text-red-600 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                    Delete Table
                  </button>
                </div>
              )}
            </div>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setHorizontalRule().run()} className="w-[30px] h-[30px] flex items-center justify-center hover:bg-gray-100 rounded transition-all text-gray-400" title="Line"><span className="material-symbols-outlined text-[18px]">horizontal_rule</span></button>
          </div>

          <div className="w-[1px] h-[18px] bg-gray-200 mx-1.5"></div>

          {/* Symbols & Emoji */}
          <div className="flex items-center px-0.5 gap-0.5 relative">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setShowSpecialCharPicker(!showSpecialCharPicker); setShowEmojiPicker(false); }}
              className={`text-[17px] font-serif w-[30px] h-[30px] flex items-center justify-center rounded hover:bg-gray-100 transition-all ${showSpecialCharPicker ? 'bg-gray-100 text-black shadow-inner' : 'text-gray-500'}`}
              title="Special Char"
            >
              Ω
            </button>
            {showSpecialCharPicker && (
              <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 shadow-xl rounded-lg p-2 z-[200] grid grid-cols-10 gap-1 w-[320px] max-h-[300px] overflow-y-auto custom-scrollbar animate-in zoom-in-95">
                {specialChars.map(char => (
                  <button key={char} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertSpecialChar(char)} className="w-7 h-7 flex items-center justify-center hover:bg-indigo-50 rounded text-[15px]">{char}</button>
                ))}
              </div>
            )}

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowSpecialCharPicker(false); setShowTableMenu(false); setShowColorPicker(false); setShowHighlightPicker(false); }}
              className={`flex items-center h-[30px] hover:bg-gray-100 rounded transition-all px-1 ${showEmojiPicker ? 'bg-gray-100 text-black shadow-inner' : 'text-gray-400'}`}
            >
              <span className="material-symbols-outlined text-[19px]">sentiment_satisfied</span>
              <span className="material-symbols-outlined text-[13px] text-gray-300">expand_more</span>
            </button>
            {showEmojiPicker && (
              <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 shadow-xl rounded-lg p-2 z-[200] grid grid-cols-8 gap-1 w-[280px] max-h-[300px] overflow-y-auto custom-scrollbar animate-in zoom-in-95">
                {emojis.map(emoji => (
                  <button key={emoji} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertEmoji(emoji)} className="w-8 h-8 flex items-center justify-center hover:bg-yellow-50 rounded text-[18px]">{emoji}</button>
                ))}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center px-1 gap-1">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`w-[32px] h-[32px] flex items-center justify-center hover:bg-gray-100 rounded transition-colors ${isFullscreen ? 'text-indigo-600 bg-indigo-50 border border-indigo-100' : 'text-gray-400'}`}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              <span className="material-symbols-outlined text-[20px]">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Formatting Boxes */}
        <div className="flex items-stretch h-[60px] bg-white">

          {/* Box 1: Styles */}
          <div className="flex flex-col border-r border-[#e9ecef] w-[100px]">
            <div className="flex items-center justify-center gap-1 h-[34px] px-1.5">
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBold().run()} className={`w-[26px] h-[26px] flex items-center justify-center rounded ${editor.isActive('bold') ? 'bg-white shadow-sm ring-1 ring-gray-200 text-black' : 'text-gray-600 hover:bg-gray-50'}`}><span className="text-[14px] font-black">B</span></button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleItalic().run()} className={`w-[26px] h-[26px] flex items-center justify-center rounded ${editor.isActive('italic') ? 'bg-white shadow-sm ring-1 ring-gray-200 text-black' : 'text-gray-600 font-serif italic hover:bg-gray-50'}`}><span className="text-[14px] italic font-serif">I</span></button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleStrike().run()} className={`w-[26px] h-[26px] flex items-center justify-center rounded ${editor.isActive('strike') ? 'bg-white shadow-sm ring-1 ring-gray-200 text-black' : 'text-gray-600 line-through hover:bg-gray-50'}`}><span className="text-[12px]">S</span></button>
            </div>
            <div className="flex-1 flex items-center px-2.5 border-t border-gray-50 relative group cursor-pointer hover:bg-gray-50 transition-colors">
              <span className="text-[11px] font-bold text-gray-400 group-hover:text-gray-900 transition-colors">Styles</span>
              <span className="material-symbols-outlined text-[14px] text-gray-300 ml-auto transition-colors group-hover:text-gray-500">expand_more</span>
              <select className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                const v = e.target.value;
                if (v === 'p') editor.chain().focus().setParagraph().run();
                else editor.chain().focus().toggleHeading({ level: parseInt(v.charAt(1)) as any }).run();
              }}>
                <option value="p">Styles</option>
                <option value="h1">Heading 1</option>
                <option value="h2">Heading 2</option>
                <option value="h3">Heading 3</option>
              </select>
            </div>
          </div>

          {/* Box 2: Format */}
          <div className="flex flex-col border-r border-[#e9ecef] w-[115px]">
            <div className="flex items-center justify-center gap-1.5 h-[34px] px-1.5">
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} className="w-[26px] h-[26px] flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded" title="Clear Formatting"><span className="material-symbols-outlined text-[19px]">format_clear</span></button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`w-[26px] h-[26px] flex items-center justify-center rounded ${editor.isActive('orderedList') ? 'bg-white shadow-sm ring-1 ring-gray-200 text-black' : 'text-gray-600 hover:bg-gray-50'}`}><span className="material-symbols-outlined text-[19px]">format_list_numbered</span></button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBulletList().run()} className={`w-[26px] h-[26px] flex items-center justify-center rounded ${editor.isActive('bulletList') ? 'bg-white shadow-sm ring-1 ring-gray-200 text-black' : 'text-gray-600 hover:bg-gray-50'}`}><span className="material-symbols-outlined text-[19px]">format_list_bulleted</span></button>
            </div>
            <div className="flex-1 flex items-center px-2.5 border-t border-gray-50 relative group cursor-pointer hover:bg-gray-50 transition-colors">
              <span className="text-[11px] font-bold text-gray-400 group-hover:text-gray-900 transition-colors">Format</span>
              <span className="material-symbols-outlined text-[14px] text-gray-300 ml-auto group-hover:text-gray-500">expand_more</span>
              <select className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                const val = e.target.value;
                if (val === 'clear') editor.chain().focus().unsetAllMarks().clearNodes().run();
                if (val === 'tasks') editor.chain().focus().toggleTaskList().run();
                if (val === 'code') editor.chain().focus().toggleCodeBlock().run();
                if (val === 'sub') editor.chain().focus().toggleSubscript().run();
                if (val === 'sup') editor.chain().focus().toggleSuperscript().run();
              }}>
                <option value="">Format</option>
                <option value="clear">Clear Formatting</option>
                <option value="tasks">Task List</option>
                <option value="code">Code Block</option>
                <option value="sub">Subscript</option>
                <option value="sup">Superscript</option>
              </select>
            </div>
          </div>

          {/* Box 3: Font */}
          <div className="flex flex-col border-r border-[#e9ecef] w-[115px]">
            <div className="flex items-center justify-center gap-1.5 h-[34px] px-1.5">
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().sinkListItem('listItem').run()} className="w-[26px] h-[26px] flex items-center justify-center text-gray-500 hover:bg-gray-50 rounded"><span className="material-symbols-outlined text-[19px]">format_indent_increase</span></button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().liftListItem('listItem').run()} className="w-[26px] h-[26px] flex items-center justify-center text-gray-500 hover:bg-gray-50 rounded"><span className="material-symbols-outlined text-[19px]">format_indent_decrease</span></button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`w-[26px] h-[26px] flex items-center justify-center rounded ${editor.isActive('blockquote') ? 'bg-white shadow-sm ring-1 ring-gray-200 text-black' : 'text-gray-600 hover:bg-gray-50'}`}><span className="material-symbols-outlined text-[19px]">format_quote</span></button>
            </div>
            <div className="flex-1 flex items-center px-2.5 border-t border-gray-50 relative group cursor-pointer hover:bg-gray-50 transition-colors">
              <span className="text-[11px] font-bold text-gray-400 group-hover:text-gray-900 transition-colors">Font</span>
              <span className="material-symbols-outlined text-[14px] text-gray-300 ml-auto group-hover:text-gray-500">expand_more</span>
              <select className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}>
                <option value="Inter">Inter</option>
                <option value="Arial">Arial</option>
                <option value="Courier New">Courier New</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Verdana">Verdana</option>
              </select>
            </div>
          </div>

          {/* Box 4: Size */}
          <div className="flex flex-col border-r border-[#e9ecef] w-[140px]">
            <div className="flex items-center justify-center gap-1 h-[34px] px-1.5">
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`w-[26px] h-[26px] flex items-center justify-center transition-all ${editor.isActive({ textAlign: 'left' }) ? 'text-black font-bold' : 'text-gray-400 hover:text-gray-600'}`}><span className="material-symbols-outlined text-[19px]">format_align_left</span></button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`w-[26px] h-[26px] flex items-center justify-center transition-all ${editor.isActive({ textAlign: 'center' }) ? 'text-black font-bold' : 'text-gray-400 hover:text-gray-600'}`}><span className="material-symbols-outlined text-[19px]">format_align_center</span></button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`w-[26px] h-[26px] flex items-center justify-center transition-all ${editor.isActive({ textAlign: 'right' }) ? 'text-black font-bold' : 'text-gray-400 hover:text-gray-600'}`}><span className="material-symbols-outlined text-[19px]">format_align_right</span></button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={`w-[26px] h-[26px] flex items-center justify-center transition-all ${editor.isActive({ textAlign: 'justify' }) ? 'text-black font-bold' : 'text-gray-400 hover:text-gray-600'}`}><span className="material-symbols-outlined text-[19px]">format_align_justify</span></button>
            </div>
            <div className="flex-1 flex items-center px-2.5 border-t border-gray-50 relative group cursor-pointer hover:bg-gray-50 transition-colors">
              <span className="text-[11px] font-bold text-gray-400 group-hover:text-gray-900 transition-colors">Size</span>
              <span className="material-symbols-outlined text-[14px] text-gray-300 ml-auto group-hover:text-gray-500">expand_more</span>
              <select className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => (editor as any).chain().focus().setFontSize(e.target.value).run()}>
                <option value="12px">12px</option>
                <option value="14px">14px</option>
                <option value="16px">16px</option>
                <option value="18px">18px</option>
                <option value="20px">20px</option>
                <option value="24px">24px</option>
                <option value="28px">28px</option>
                <option value="32px">32px</option>
              </select>
            </div>
          </div>

          {/* Box 5: Colors */}
          <div className="flex-1 flex items-center justify-between px-4 relative">
            <div className="flex items-center gap-4">
              {/* Text Color */}
              <div className="relative group">
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setShowColorPicker(!showColorPicker); setShowHighlightPicker(false); setShowTableMenu(false); }} className="flex items-center gap-1 px-1 py-1 hover:bg-gray-100 rounded transition-colors group">
                  <div className="flex flex-col items-center">
                    <span className="text-[16px] font-black leading-none text-gray-800">A</span>
                    <div className="h-[2px] w-[14px] bg-red-600 mt-[1px]"></div>
                  </div>
                  <span className="material-symbols-outlined text-[14px] text-gray-400 group-hover:text-gray-600">expand_more</span>
                </button>
                {showColorPicker && (
                  <div className="absolute top-9 left-0 bg-white border border-gray-200 shadow-2xl rounded-lg p-2 z-[100] grid grid-cols-5 gap-1 min-w-[120px] animate-in zoom-in-95">
                    {colors.map(c => <button key={c} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { editor.chain().focus().setColor(c).run(); setShowColorPicker(false); }} className="w-5 h-5 rounded border border-gray-100 shadow-sm" style={{ backgroundColor: c }} />)}
                  </div>
                )}
              </div>

              {/* Highlight */}
              <div className="relative group">
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setShowHighlightPicker(!showHighlightPicker); setShowColorPicker(false); setShowTableMenu(false); }} className="flex items-center gap-1 px-1 py-1 hover:bg-gray-100 rounded transition-colors group">
                  <div className="w-[18px] h-[18px] bg-yellow-400 rounded-sm flex items-center justify-center ring-1 ring-black/10">
                    <span className="text-[11px] font-black text-black">A</span>
                  </div>
                  <span className="material-symbols-outlined text-[14px] text-gray-400 group-hover:text-gray-600">expand_more</span>
                </button>
                {showHighlightPicker && (
                  <div className="absolute top-9 left-0 bg-white border border-gray-200 shadow-2xl rounded-lg p-2 z-[100] grid grid-cols-4 gap-1 min-w-[100px] animate-in zoom-in-95">
                    {highlights.map(c => <button key={c} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { editor.chain().focus().toggleHighlight({ color: c }).run(); setShowHighlightPicker(false); }} className="w-5 h-5 rounded border border-gray-100 shadow-sm" style={{ backgroundColor: c }} />)}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowHelpModal(true)}
              className="w-[32px] h-[32px] flex items-center justify-center hover:bg-gray-100 rounded text-gray-400 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">help_outline</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className={`bg-white overflow-hidden custom-scrollbar ${isFullscreen ? 'flex-1' : ''}`} style={isFullscreen ? {} : { height }}>
        <style>{`
          .ProseMirror {
            outline: none !important;
            height: 100%;
            overflow-y: auto;
            color: #374151;
            padding: 24px;
          }
          .ProseMirror p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: #9ca3af;
            pointer-events: none;
            height: 0;
          }
          .ProseMirror blockquote {
            border-left: 4px solid #f3f4f6;
            background: #fafafa;
            padding: 1.25rem 2rem;
            margin: 1.5rem 0;
            border-radius: 0 16px 16px 0;
            font-style: italic;
            color: #4b5563;
            position: relative;
          }
          .ProseMirror blockquote::before {
            content: '“';
            position: absolute;
            left: 0.5rem;
            top: 0;
            font-size: 3rem;
            color: #e5e7eb;
            line-height: 1;
            font-family: serif;
          }
          .ProseMirror ul { list-style-type: disc; padding-left: 1.5rem; margin: 1em 0; }
          .ProseMirror ol { list-style-type: decimal; padding-left: 1.5rem; margin: 1em 0; }
          .ProseMirror table { border-collapse: collapse; table-layout: fixed; width: 100%; margin: 1.5rem 0; overflow: hidden; border: 1px solid #e5e7eb; }
          .ProseMirror table td, .ProseMirror table th { min-width: 1em; border: 1px solid #e5e7eb; padding: 12px 15px; vertical-align: top; box-sizing: border-box; position: relative; }
          .ProseMirror table th { font-weight: bold; text-align: left; background-color: #f9fafb; color: #111827; }
          .ProseMirror table .selectedCell:after { z-index: 2; position: absolute; content: ""; left: 0; right: 0; top: 0; bottom: 0; background: rgba(0,0,0,0.05); pointer-events: none; }
          .ProseMirror img { max-width: 100%; height: auto; border-radius: 20px; margin: 2rem auto; display: block; shadow: 0 10px 30px rgba(0,0,0,0.1); }
          .animate-slide-down { animation: slideDown 0.2s ease-out; }
          @keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
        `}</style>
        <EditorContent editor={editor} className="h-full" spellCheck={spellCheckEnabled} />
      </div>

      {/* Floating Exit Button for Fullscreen */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="fixed top-6 right-6 z-[20001] w-12 h-12 bg-white/90 backdrop-blur-md shadow-2xl rounded-full flex items-center justify-center text-gray-900 border border-white hover:bg-red-50 hover:text-red-600 transition-all animate-in fade-in zoom-in duration-300 group"
          title="Exit Fullscreen"
        >
          <span className="material-symbols-outlined text-[24px] group-hover:rotate-90 transition-transform">close</span>
        </button>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHelpModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-gray-900">Editor Shortcuts</h3>
                <button onClick={() => setShowHelpModal(false)} className="material-symbols-outlined text-gray-400 hover:text-gray-900">close</button>
              </div>
              <div className="space-y-4">
                {[
                  { k: 'Ctrl + B', d: 'Bold' },
                  { k: 'Ctrl + I', d: 'Italic' },
                  { k: 'Ctrl + U', d: 'Underline' },
                  { k: 'Ctrl + K', d: 'Insert Link' },
                  { k: 'Ctrl + Shift + 7', d: 'Numbered List' },
                  { k: 'Ctrl + Shift + 8', d: 'Bullet List' },
                  { k: 'Ctrl + /', d: 'Horizontal Rule' },
                ].map(item => (
                  <div key={item.k} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-sm font-bold text-gray-600">{item.d}</span>
                    <kbd className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-[10px] font-black uppercase text-gray-500 shadow-sm">{item.k}</kbd>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full mt-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
