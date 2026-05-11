import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Link, Minus,
  Heading1, Heading2, Heading3,
  Eye, Code, Type,
  Undo, Redo,
} from 'lucide-react';

interface EmailEditorProps {
  value: string;
  onChange: (html: string) => void;
}

type Mode = 'visual' | 'html' | 'preview';

const VARIABLES = ['{{nombre}}', '{{email}}', '{{empresa}}', '{{telefono}}'];

// Wrap raw HTML body content in a full email template
function wrapInEmailShell(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif; }
    .wrapper { width: 100%; background-color: #f4f4f4; padding: 24px 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); padding: 40px; }
    p { margin: 12px 0; font-size: 15px; line-height: 1.7; color: #333; }
    h1 { font-size: 26px; color: #1a1a1a; margin: 20px 0 12px; }
    h2 { font-size: 20px; color: #1a1a1a; margin: 18px 0 10px; }
    h3 { font-size: 16px; color: #1a1a1a; margin: 16px 0 8px; }
    ul, ol { padding-left: 20px; margin: 12px 0; }
    li { font-size: 15px; line-height: 1.7; color: #333; margin: 4px 0; }
    a { color: #ea580c; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    blockquote { border-left: 3px solid #ea580c; margin: 16px 0; padding-left: 16px; color: #666; font-style: italic; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      ${bodyHtml}
    </div>
  </div>
</body>
</html>`;
}

// Detect if value is a full HTML document vs bare body HTML
function isFullDocument(html: string): boolean {
  return html.includes('<!DOCTYPE') || html.includes('<html') || html.includes('<body');
}

// Extract inner body content from a full document
function extractBody(html: string): string {
  const bodyMatch = html.match(/<div class="container">([\s\S]*?)<\/div>\s*<\/div>/);
  if (bodyMatch) return bodyMatch[1].trim();
  // Fallback: grab content between body tags
  const b = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (b) return b[1].trim();
  return html;
}

// Convert value prop → editable body HTML
function toBodyHtml(value: string): string {
  if (!value) return '';
  if (isFullDocument(value)) return extractBody(value);
  return value;
}

export default function EmailEditor({ value, onChange }: EmailEditorProps) {
  const [mode, setMode] = useState<Mode>('visual');
  const [rawHtml, setRawHtml] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const skipNextSync = useRef(false);

  // Initialise editorRef content and rawHtml from value prop (once on mount or when value changes externally)
  const lastEmitted = useRef<string>('');

  useEffect(() => {
    const body = toBodyHtml(value);
    const full = body ? wrapInEmailShell(body) : '';

    // Only sync in if this is NOT a change we emitted ourselves
    if (full !== lastEmitted.current) {
      setRawHtml(full);
      if (editorRef.current && !skipNextSync.current) {
        editorRef.current.innerHTML = body;
      }
    }
    skipNextSync.current = false;
  }, [value]);

  const emitChange = useCallback(() => {
    if (!editorRef.current) return;
    const body = editorRef.current.innerHTML;
    const full = body.trim() ? wrapInEmailShell(body) : '';
    lastEmitted.current = full;
    skipNextSync.current = true;
    setRawHtml(full);
    onChange(full);
  }, [onChange]);

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    emitChange();
  };

  const handleRawHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const full = e.target.value;
    setRawHtml(full);
    lastEmitted.current = full;
    onChange(full);
    // Sync body back into visual editor
    if (editorRef.current) {
      editorRef.current.innerHTML = toBodyHtml(full);
    }
  };

  const insertLink = () => {
    const url = prompt('URL del enlace:');
    if (url) exec('createLink', url);
  };

  const insertVariable = (v: string) => {
    editorRef.current?.focus();
    document.execCommand('insertText', false, v);
    emitChange();
  };

  const ToolBtn = ({
    onClick, title, children, active = false,
  }: { onClick: () => void; title: string; children: React.ReactNode; active?: boolean }) => (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className={`p-1.5 rounded transition-colors ${active ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-5 bg-gray-200 mx-0.5" />;

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent">

      {/* Mode tabs */}
      <div className="flex items-center gap-1 px-2 pt-2 border-b border-gray-200 bg-gray-50">
        {(['visual', 'html', 'preview'] as Mode[]).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t transition-colors ${
              mode === m
                ? 'bg-white border border-b-white border-gray-200 text-orange-600 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {m === 'visual' && <Type size={12} />}
            {m === 'html'   && <Code size={12} />}
            {m === 'preview' && <Eye size={12} />}
            {m === 'visual' ? 'Visual' : m === 'html' ? 'HTML' : 'Preview'}
          </button>
        ))}
      </div>

      {/* Toolbar — only in visual mode */}
      {mode === 'visual' && (
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
          {/* Undo / Redo */}
          <ToolBtn onClick={() => exec('undo')} title="Deshacer"><Undo size={15} /></ToolBtn>
          <ToolBtn onClick={() => exec('redo')} title="Rehacer"><Redo size={15} /></ToolBtn>
          <Divider />

          {/* Headings */}
          <ToolBtn onClick={() => exec('formatBlock', 'h1')} title="Título 1"><Heading1 size={15} /></ToolBtn>
          <ToolBtn onClick={() => exec('formatBlock', 'h2')} title="Título 2"><Heading2 size={15} /></ToolBtn>
          <ToolBtn onClick={() => exec('formatBlock', 'h3')} title="Título 3"><Heading3 size={15} /></ToolBtn>
          <ToolBtn onClick={() => exec('formatBlock', 'p')} title="Párrafo normal"><Type size={15} /></ToolBtn>
          <Divider />

          {/* Inline formatting */}
          <ToolBtn onClick={() => exec('bold')} title="Negrita (Ctrl+B)"><Bold size={15} /></ToolBtn>
          <ToolBtn onClick={() => exec('italic')} title="Cursiva (Ctrl+I)"><Italic size={15} /></ToolBtn>
          <ToolBtn onClick={() => exec('underline')} title="Subrayado (Ctrl+U)"><Underline size={15} /></ToolBtn>
          <ToolBtn onClick={() => exec('strikeThrough')} title="Tachado"><Strikethrough size={15} /></ToolBtn>
          <Divider />

          {/* Alignment */}
          <ToolBtn onClick={() => exec('justifyLeft')} title="Alinear izquierda"><AlignLeft size={15} /></ToolBtn>
          <ToolBtn onClick={() => exec('justifyCenter')} title="Centrar"><AlignCenter size={15} /></ToolBtn>
          <ToolBtn onClick={() => exec('justifyRight')} title="Alinear derecha"><AlignRight size={15} /></ToolBtn>
          <Divider />

          {/* Lists */}
          <ToolBtn onClick={() => exec('insertUnorderedList')} title="Lista con viñetas"><List size={15} /></ToolBtn>
          <ToolBtn onClick={() => exec('insertOrderedList')} title="Lista numerada"><ListOrdered size={15} /></ToolBtn>
          <Divider />

          {/* Link & HR */}
          <ToolBtn onClick={insertLink} title="Insertar enlace"><Link size={15} /></ToolBtn>
          <ToolBtn onClick={() => exec('insertHorizontalRule')} title="Línea separadora"><Minus size={15} /></ToolBtn>
          <Divider />

          {/* Variable chips */}
          <div className="flex items-center gap-1 ml-1">
            <span className="text-xs text-gray-400 mr-0.5">Variables:</span>
            {VARIABLES.map(v => (
              <button
                key={v}
                type="button"
                onMouseDown={e => { e.preventDefault(); insertVariable(v); }}
                className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded hover:bg-orange-100 transition-colors font-mono"
                title={`Insertar ${v}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Visual editor */}
      {mode === 'visual' && (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emitChange}
          onBlur={emitChange}
          className="min-h-64 max-h-96 overflow-y-auto p-4 text-sm text-gray-800 outline-none"
          style={{
            fontFamily: 'Arial, sans-serif',
            lineHeight: '1.7',
          }}
          data-placeholder="Escribe el contenido del email aquí..."
        />
      )}

      {/* HTML editor */}
      {mode === 'html' && (
        <textarea
          value={rawHtml}
          onChange={handleRawHtmlChange}
          rows={18}
          spellCheck={false}
          className="w-full p-4 font-mono text-xs text-gray-700 outline-none resize-none"
          placeholder="Pega o escribe HTML aquí..."
        />
      )}

      {/* Preview */}
      {mode === 'preview' && (
        <div className="bg-gray-100 p-4">
          {rawHtml.trim() ? (
            <iframe
              srcDoc={rawHtml}
              title="email-preview"
              className="w-full rounded-lg border border-gray-200 bg-white"
              style={{ minHeight: '400px' }}
              sandbox="allow-same-origin"
            />
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400">
              Escribe contenido para ver la vista previa
            </div>
          )}
        </div>
      )}

      {/* Placeholder CSS for empty contenteditable */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
