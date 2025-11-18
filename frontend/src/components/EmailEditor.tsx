import { useState, useEffect } from 'react';

interface EmailEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export default function EmailEditor({ value, onChange }: EmailEditorProps) {
  const [mode, setMode] = useState<'visual' | 'html'>('visual');
  const [content, setContent] = useState('');

  // Extract plain text from HTML when value changes
  useEffect(() => {
    if (value && value.includes('<html>')) {
      // Extract content from HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = value;
      const paragraphs = tempDiv.querySelectorAll('p');
      const textContent = Array.from(paragraphs)
        .map(p => p.textContent)
        .filter(t => t && !t.includes('Variables disponibles'))
        .join('\n\n');
      setContent(textContent);
    } else if (value) {
      setContent(value);
    }
  }, [value]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Convert simple text to HTML
    const html = convertTextToHTML(newContent);
    onChange(html);
  };

  const convertTextToHTML = (text: string): string => {
    // Split by double line breaks to create paragraphs
    const paragraphs = text.split('\n\n');

    let html = '';

    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;

      // Check for emoji headings (common pattern: emoji at start)
      if (trimmed.match(/^[🔹🔢✍️🧲🤖⭐💼🧾]/)) {
        html += `<p style="margin: 16px 0; font-size: 16px; line-height: 1.6;">${trimmed}</p>\n`;
      }
      // Check for greeting (starts with "Hola")
      else if (trimmed.startsWith('Hola')) {
        html += `<p style="margin: 16px 0; font-size: 16px; line-height: 1.6;">${trimmed}</p>\n`;
      }
      // Check for closing/signature
      else if (trimmed.match(/^(Un saludo|Gracias|Saludos|El equipo)/)) {
        html += `<p style="margin: 24px 0 8px 0; font-size: 16px;">${trimmed}</p>\n`;
      }
      // Regular paragraphs
      else {
        html += `<p style="margin: 16px 0; font-size: 16px; line-height: 1.6;">${trimmed}</p>\n`;
      }
    }

    // Wrap in email container with better styling
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px;">
              ${html}

              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
                <p>Variables disponibles: {{nombre}}, {{empresa}}, {{email}}, {{telefono}}</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
  };

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => setMode('visual')}
          className={`px-4 py-2 rounded ${mode === 'visual' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Editor Visual
        </button>
        <button
          type="button"
          onClick={() => setMode('html')}
          className={`px-4 py-2 rounded ${mode === 'html' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          HTML
        </button>
      </div>

      {mode === 'visual' ? (
        <div>
          <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <p className="font-semibold mb-1">Consejos:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Escribe normalmente, el sistema convertirá tu texto a HTML automáticamente</li>
              <li>Usa doble salto de línea para separar párrafos</li>
              <li>Puedes usar emojis: 🔹 💼 ✍️ 🧲 🤖 ⭐</li>
              <li>Variables disponibles: {'{{nombre}}'}, {'{{empresa}}'}, {'{{email}}'}, {'{{telefono}}'}</li>
            </ul>
          </div>
          <textarea
            value={content}
            onChange={handleContentChange}
            rows={15}
            className="w-full px-4 py-3 border rounded-lg text-sm"
            placeholder={`Hola {{nombre}},

Sabemos que dirigir una empresa no es tarea fácil...

🔹 Beneficio 1
🔹 Beneficio 2
🔹 Beneficio 3

☑️ ¿Lo vemos en acción?
👉 [Reservar cita](https://tulink.com)

Un saludo,
El equipo de Tu Empresa`}
          />
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={15}
          className="w-full px-4 py-3 border rounded-lg font-mono text-xs"
          placeholder="<h1>Hola {{nombre}}</h1>"
        />
      )}
    </div>
  );
}
