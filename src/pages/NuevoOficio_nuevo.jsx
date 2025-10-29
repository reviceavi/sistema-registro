import React, { useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Image as ImageIcon, Link as LinkIcon,
  Table as TableIcon, Undo2, Redo2, Type, Palette,
  FileText, Save, Download, Printer, Eye, Maximize2,
  ChevronDown, MoreHorizontal, Heading1, Heading2, Heading3
} from 'lucide-react';
import './NuevoOficio.css';

const ToolbarButton = ({ onClick, isActive, children, title, className = "", disabled = false }) => (
  <button
    onClick={onClick}
    className={`toolbar-btn ${isActive ? 'active' : ''} ${disabled ? 'disabled' : ''} ${className}`}
    title={title}
    disabled={disabled}
  >
    {children}
  </button>
);

const ToolbarSeparator = () => <div className="toolbar-separator" />;

const FontSizeSelector = ({ editor }) => {
  const sizes = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '26', '28', '36', '48', '72'];
  
  return (
    <select
      className="font-size-selector"
      onChange={(e) => {
        const size = e.target.value;
        editor.chain().focus().run();
        // TipTap no tiene fontSize nativo, usamos CSS
        editor.commands.setMark('textStyle', { fontSize: size + 'pt' });
      }}
      defaultValue="12"
    >
      {sizes.map(size => (
        <option key={size} value={size}>{size}</option>
      ))}
    </select>
  );
};

const FontFamilySelector = ({ editor }) => {
  const fonts = [
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: '"Times New Roman", serif', label: 'Times New Roman' },
    { value: 'Calibri, sans-serif', label: 'Calibri' },
    { value: 'Helvetica, sans-serif', label: 'Helvetica' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: 'Verdana, sans-serif', label: 'Verdana' }
  ];
  
  return (
    <select
      className="font-family-selector"
      onChange={(e) => {
        editor.chain().focus().run();
        editor.commands.setMark('textStyle', { fontFamily: e.target.value });
      }}
      defaultValue="Arial, sans-serif"
    >
      {fonts.map(font => (
        <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
          {font.label}
        </option>
      ))}
    </select>
  );
};

const ColorPicker = ({ editor, type = 'text' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#808080',
    '#C0C0C0', '#FF8000', '#00FF80', '#8000FF', '#FF0080', '#80FF00', '#0080FF'
  ];

  return (
    <div className="color-picker-container">
      <ToolbarButton 
        onClick={() => setIsOpen(!isOpen)}
        title={type === 'text' ? 'Color de texto' : 'Color de fondo'}
        className="color-picker-btn"
      >
        <Palette size={16} />
        <ChevronDown size={12} />
      </ToolbarButton>
      {isOpen && (
        <div className="color-palette">
          {colors.map(color => (
            <button
              key={color}
              className="color-option"
              style={{ backgroundColor: color }}
              onClick={() => {
                editor.chain().focus().setColor(color).run();
                setIsOpen(false);
              }}
              title={color}
            />
          ))}
          <div className="color-palette-footer">
            <button
              className="color-reset-btn"
              onClick={() => {
                editor.chain().focus().unsetColor().run();
                setIsOpen(false);
              }}
            >
              Automático
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  const addImage = useCallback(() => {
    const url = window.prompt('URL de la imagen:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL del enlace:', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="word-toolbar">
      {/* Primera fila: Archivo y acciones principales */}
      <div className="toolbar-row">
        <div className="toolbar-group">
          <ToolbarButton title="Nuevo documento">
            <FileText size={16} />
          </ToolbarButton>
          <ToolbarButton title="Guardar">
            <Save size={16} />
          </ToolbarButton>
          <ToolbarButton title="Descargar como PDF">
            <Download size={16} />
          </ToolbarButton>
          <ToolbarButton title="Imprimir">
            <Printer size={16} />
          </ToolbarButton>
        </div>
        
        <ToolbarSeparator />
        
        <div className="toolbar-group">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            title="Deshacer (Ctrl+Z)"
            disabled={!editor.can().undo()}
          >
            <Undo2 size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            title="Rehacer (Ctrl+Y)"
            disabled={!editor.can().redo()}
          >
            <Redo2 size={16} />
          </ToolbarButton>
        </div>

        <ToolbarSeparator />

        <div className="toolbar-group">
          <ToolbarButton title="Vista previa">
            <Eye size={16} />
          </ToolbarButton>
          <ToolbarButton title="Modo pantalla completa">
            <Maximize2 size={16} />
          </ToolbarButton>
        </div>
      </div>

      {/* Segunda fila: Formato de texto */}
      <div className="toolbar-row">
        <div className="toolbar-group font-controls">
          <FontFamilySelector editor={editor} />
          <FontSizeSelector editor={editor} />
        </div>

        <ToolbarSeparator />

        <div className="toolbar-group">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Negrita (Ctrl+B)"
          >
            <Bold size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Cursiva (Ctrl+I)"
          >
            <Italic size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Subrayado (Ctrl+U)"
          >
            <UnderlineIcon size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Tachado"
          >
            <Strikethrough size={16} />
          </ToolbarButton>
        </div>

        <ToolbarSeparator />

        <div className="toolbar-group">
          <ColorPicker editor={editor} type="text" />
        </div>

        <ToolbarSeparator />

        <div className="toolbar-group">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Alinear a la izquierda"
          >
            <AlignLeft size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Centrar"
          >
            <AlignCenter size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Alinear a la derecha"
          >
            <AlignRight size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            isActive={editor.isActive({ textAlign: 'justify' })}
            title="Justificar"
          >
            <AlignJustify size={16} />
          </ToolbarButton>
        </div>

        <ToolbarSeparator />

        <div className="toolbar-group">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Lista con viñetas"
          >
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Lista numerada"
          >
            <ListOrdered size={16} />
          </ToolbarButton>
        </div>
      </div>

      {/* Tercera fila: Estilos y elementos */}
      <div className="toolbar-row">
        <div className="toolbar-group">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Título 1"
          >
            <Heading1 size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Título 2"
          >
            <Heading2 size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Título 3"
          >
            <Heading3 size={16} />
          </ToolbarButton>
        </div>

        <ToolbarSeparator />

        <div className="toolbar-group">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Cita"
          >
            <Quote size={16} />
          </ToolbarButton>
        </div>

        <ToolbarSeparator />

        <div className="toolbar-group">
          <ToolbarButton onClick={setLink} title="Insertar/editar enlace">
            <LinkIcon size={16} />
          </ToolbarButton>
          <ToolbarButton onClick={addImage} title="Insertar imagen">
            <ImageIcon size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title="Insertar tabla"
          >
            <TableIcon size={16} />
          </ToolbarButton>
        </div>
      </div>
    </div>
  );
};

const NuevoOficio = () => {
  const [titulo, setTitulo] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ 
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link'
        }
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'editor-image'
        }
      }),
      Table.configure({ 
        resizable: true,
        HTMLAttributes: {
          class: 'editor-table'
        }
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Underline,
      Placeholder.configure({ 
        placeholder: 'Redacta tu oficio aquí...\n\nUtiliza la barra de herramientas para dar formato a tu texto.' 
      })
    ],
    content: `
      <h2>Oficio No. [Número]</h2>
      <p>Ciudad de México, [Fecha]</p>
      <br>
      <p><strong>Para:</strong> [Destinatario]</p>
      <p><strong>De:</strong> [Remitente]</p>
      <p><strong>Asunto:</strong> [Asunto del oficio]</p>
      <br>
      <p>Estimado/a [Destinatario],</p>
      <br>
      <p>Por medio del presente, me dirijo a usted para...</p>
    `,
    editorProps: {
      attributes: {
        class: 'editor-content',
      },
    },
  });

  const handleGuardar = () => {
    const html = editor ? editor.getHTML() : '';
    const plainText = editor ? editor.getText() : '';
    
    const documentData = {
      titulo,
      html,
      plainText,
      wordCount: plainText.split(/\s+/).filter(word => word.length > 0).length,
      createdAt: new Date().toISOString()
    };
    
    console.log('Guardar oficio:', documentData);
    
    // Simular guardado
    localStorage.setItem('ultimo_oficio', JSON.stringify(documentData));
    
    alert(`Oficio guardado exitosamente.\n\nPalabras: ${documentData.wordCount}\nCaracteres: ${plainText.length}`);
  };

  const handleExportPDF = () => {
    alert('Función de exportación a PDF en desarrollo');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const html = editor ? editor.getHTML() : '';
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${titulo || 'Oficio'}</title>
          <style>
            body { 
              font-family: 'Times New Roman', serif; 
              font-size: 12pt; 
              line-height: 1.6; 
              max-width: 21cm; 
              margin: 2cm auto; 
              padding: 0;
            }
            h1, h2, h3 { color: #333; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f5f5f5; }
            .editor-image { max-width: 100%; height: auto; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <h1>${titulo}</h1>
          ${html}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`nuevo-oficio-container ${isFullscreen ? 'fullscreen' : ''}`}>
      {!isFullscreen && (
        <div className="document-header">
          <div className="document-title">
            <FileText size={24} className="document-icon" />
            <div>
              <h2>📝 Editor de Oficios</h2>
              <p>Crear y editar documentos oficiales</p>
            </div>
          </div>
          <div className="document-stats">
            <span className="stat-item">
              Palabras: {editor ? editor.storage.characterCount?.words() || 0 : 0}
            </span>
            <span className="stat-item">
              Caracteres: {editor ? editor.getText().length : 0}
            </span>
          </div>
        </div>
      )}

      <div className="document-metadata">
        <div className="form-group">
          <input 
            value={titulo} 
            onChange={(e) => setTitulo(e.target.value)} 
            placeholder="Título del documento (ej: Oficio CEAVI-001-2025)"
            className="document-title-input"
          />
        </div>
      </div>

      <div className="editor-container">
        <MenuBar editor={editor} />
        
        <div className="editor-wrapper">
          <div className="page-container">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      <div className="document-actions">
        <div className="action-group-left">
          <button 
            className="btn-secondary" 
            onClick={() => { 
              if (editor) {
                editor.commands.clearContent();
                editor.commands.setContent(`
                  <h2>Oficio No. [Número]</h2>
                  <p>Ciudad de México, [Fecha]</p>
                  <br>
                  <p><strong>Para:</strong> [Destinatario]</p>
                  <p><strong>De:</strong> [Remitente]</p>
                  <p><strong>Asunto:</strong> [Asunto del oficio]</p>
                  <br>
                  <p>Estimado/a [Destinatario],</p>
                  <br>
                  <p>Por medio del presente, me dirijo a usted para...</p>
                `);
              }
              setTitulo(''); 
            }}
          >
            <FileText size={16} />
            Nuevo
          </button>
          
          <button 
            className="btn-secondary" 
            onClick={toggleFullscreen}
          >
            <Maximize2 size={16} />
            {isFullscreen ? 'Salir' : 'Pantalla completa'}
          </button>
        </div>

        <div className="action-group-right">
          <button 
            className="btn-outline" 
            onClick={handleExportPDF}
          >
            <Download size={16} />
            Exportar PDF
          </button>
          
          <button 
            className="btn-outline" 
            onClick={handlePrint}
          >
            <Printer size={16} />
            Imprimir
          </button>
          
          <button 
            className="btn-primary" 
            onClick={handleGuardar}
          >
            <Save size={16} />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default NuevoOficio;
