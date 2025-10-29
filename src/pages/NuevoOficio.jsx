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
import { TextStyle } from '@tiptap/extension-text-style';
import { Underline } from '@tiptap/extension-underline';
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Image as ImageIcon, Link as LinkIcon,
  Table as TableIcon, Undo2, Redo2, Type, Palette,
  FileText, Save, Download, Printer, Eye, Maximize2,
  ChevronDown, MoreHorizontal, Heading1, Heading2, Heading3,
  Indent, Outdent
} from 'lucide-react';
import HeaderInstitucional from '../components/HeaderInstitucional';
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
    { value: '"Roboto", sans-serif', label: 'Roboto' }
  ];
  
  return (
    <select
      className="font-family-selector"
      onChange={(e) => {
        editor.chain().focus().run();
        editor.commands.setMark('textStyle', { fontFamily: e.target.value });
      }}
      defaultValue='"Roboto", sans-serif'
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
        <Palette size={20} />
        <ChevronDown size={14} />
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
      <div className="toolbar-row">
        {/* Selector de fuente y tamaño */}
        <div className="toolbar-group font-controls">
          <FontFamilySelector editor={editor} />
          <FontSizeSelector editor={editor} />
        </div>

        <ToolbarSeparator />

        {/* Formato básico */}
        <div className="toolbar-group">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Negrita (Ctrl+B)"
          >
            <Bold size={20} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Cursiva (Ctrl+I)"
          >
            <Italic size={20} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Subrayado (Ctrl+U)"
          >
            <UnderlineIcon size={20} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Tachado"
          >
            <Strikethrough size={20} />
          </ToolbarButton>
        </div>

        <ToolbarSeparator />

        {/* Alineación */}
        <div className="toolbar-group">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Alinear a la izquierda"
          >
            <AlignLeft size={20} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Centrar"
          >
            <AlignCenter size={20} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Alinear a la derecha"
          >
            <AlignRight size={20} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            isActive={editor.isActive({ textAlign: 'justify' })}
            title="Justificar"
          >
            <AlignJustify size={20} />
          </ToolbarButton>
        </div>

        <ToolbarSeparator />

        {/* Listas */}
        <div className="toolbar-group">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Lista con viñetas"
          >
            <List size={20} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Lista numerada"
          >
            <ListOrdered size={20} />
          </ToolbarButton>
        </div>

        <ToolbarSeparator />

        {/* Sangría */}
        <div className="toolbar-group">
          <ToolbarButton
            onClick={() => {
              // Reducir sangría (mover hacia la izquierda)
              const currentIndent = editor.getAttributes('paragraph').textIndent || '0px';
              const indentValue = parseInt(currentIndent) || 0;
              const newIndent = Math.max(0, indentValue - 40);
              editor.chain().focus().updateAttributes('paragraph', { 
                textIndent: newIndent + 'px' 
              }).run();
            }}
            title="Disminuir sangría"
          >
            <Outdent size={20} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {
              // Aumentar sangría (mover hacia la derecha)
              const currentIndent = editor.getAttributes('paragraph').textIndent || '0px';
              const indentValue = parseInt(currentIndent) || 0;
              const newIndent = indentValue + 40;
              editor.chain().focus().updateAttributes('paragraph', { 
                textIndent: newIndent + 'px' 
              }).run();
            }}
            title="Aumentar sangría"
          >
            <Indent size={20} />
          </ToolbarButton>
        </div>

        <ToolbarSeparator />

        {/* Deshacer/Rehacer */}
        <div className="toolbar-group">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            title="Deshacer (Ctrl+Z)"
            disabled={!editor.can().undo()}
          >
            <Undo2 size={20} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            title="Rehacer (Ctrl+Y)"
            disabled={!editor.can().redo()}
          >
            <Redo2 size={20} />
          </ToolbarButton>
        </div>
      </div>
    </div>
  );
};

const NuevoOficio = () => {
  const [numeroOficio, setNumeroOficio] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Generar título automáticamente basado en el número
  const titulo = numeroOficio ? `OficioRELOVI_${numeroOficio}` : 'OficioRELOVI_';

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
      <p style="text-align: right; margin-bottom: 20px;">Ciudad de México, a <strong>{{fecha}}</strong></p>
      
      <p style="text-align: right; margin-bottom: 20px;"><strong>CEAVICDMX/DFVCDMX/RELOVI/{{número_oficio}}/2025</strong></p>
      
      <p style="margin-bottom: 20px;"><strong>Asunto:</strong> Atención a oficio <strong>{{oficio_entrada}}</strong></p>
      
      <div style="margin-bottom: 30px;">
        <p><strong>{{nombre}}</strong></p>
        <p><strong>{{cargo}}</strong></p>
        <p><strong>{{institución}}</strong></p>
        <p style="text-align: center; margin-top: 10px;"><strong>P R E S E N T E</strong></p>
      </div>
      
      <p style="margin-bottom: 20px; text-align: justify;">En atención a su oficio <strong>{{oficio_entrada}}</strong>, se informa lo siguiente:</p>
      
      <p style="margin: 40px 0; text-align: justify;">[Desarrolle aquí el contenido principal del oficio]</p>
      
      <p style="margin-bottom: 20px; text-align: justify;">Finalmente, se hace de su conocimiento que la información contenida en el presente oficio, así como en los documentos anexos, contiene datos personales, por lo que su difusión es responsabilidad de quien los transmite y quien los recibe, en términos de las disposiciones vigentes en materia de datos personales, acceso a la información pública, transparencia y rendición de cuentas.</p>
      
      <p style="margin-bottom: 20px; text-align: justify;">Sin más por el momento, agradezco de antemano la atención sobre el presente asunto.</p>
      
      <p style="text-align: center; margin: 40px 0 20px 0;"><strong>A T E N T A M E N T E</strong></p>
      
      <div style="text-align: center; margin-top: 60px;">
        <p style="margin-bottom: 5px;"><strong>LIC. EDGAR ALEJANDRO GÓMEZ JAIMES</strong></p>
        <p style="margin-bottom: 5px;"><strong>COORDINADOR DEL REGISTRO LOCAL DE VÍCTIMAS</strong></p>
        <p style="margin-bottom: 20px;"><strong>COMISIÓN EJECUTIVA DE ATENCIÓN A VÍCTIMAS DE LA CIUDAD DE MÉXICO</strong></p>
        <p><strong>BMCH</strong></p>
      </div>
    `,
    editorProps: {
      attributes: {
        class: 'editor-content',
        style: 'line-height: 1.15;',
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
      {!isFullscreen && <HeaderInstitucional />}

      <div className="document-metadata-compact">
        <div className="oficio-number-input-group">
          <span className="oficio-prefix">OficioRELOVI_</span>
          <input 
            value={numeroOficio} 
            onChange={(e) => {
              // Solo permitir números enteros
              const value = e.target.value.replace(/[^0-9]/g, '');
              setNumeroOficio(value);
            }} 
            placeholder="001"
            className="document-number-input-compact"
            type="text"
            maxLength="6"
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
                  <p style="text-align: right; margin-bottom: 20px;">Ciudad de México, a <strong>{{fecha}}</strong></p>
                  
                  <p style="text-align: right; margin-bottom: 20px;"><strong>CEAVICDMX/DFVCDMX/RELOVI/{{número_oficio}}/2025</strong></p>
                  
                  <p style="margin-bottom: 20px;"><strong>Asunto:</strong> Atención a oficio <strong>{{oficio_entrada}}</strong></p>
                  
                  <div style="margin-bottom: 30px;">
                    <p><strong>{{nombre}}</strong></p>
                    <p><strong>{{cargo}}</strong></p>
                    <p><strong>{{institución}}</strong></p>
                    <p style="text-align: center; margin-top: 10px;"><strong>P R E S E N T E</strong></p>
                  </div>
                  
                  <p style="margin-bottom: 20px; text-align: justify;">En atención a su oficio <strong>{{oficio_entrada}}</strong>, se informa lo siguiente:</p>
                  
                  <p style="margin: 40px 0; text-align: justify;">[Desarrolle aquí el contenido principal del oficio]</p>
                  
                  <p style="margin-bottom: 20px; text-align: justify;">Finalmente, se hace de su conocimiento que la información contenida en el presente oficio, así como en los documentos anexos, contiene datos personales, por lo que su difusión es responsabilidad de quien los transmite y quien los recibe, en términos de las disposiciones vigentes en materia de datos personales, acceso a la información pública, transparencia y rendición de cuentas.</p>
                  
                  <p style="margin-bottom: 20px; text-align: justify;">Sin más por el momento, agradezco de antemano la atención sobre el presente asunto.</p>
                  
                  <p style="text-align: center; margin: 40px 0 20px 0;"><strong>A T E N T A M E N T E</strong></p>
                  
                  <div style="text-align: center; margin-top: 60px;">
                    <p style="margin-bottom: 5px;"><strong>LIC. EDGAR ALEJANDRO GÓMEZ JAIMES</strong></p>
                    <p style="margin-bottom: 5px;"><strong>COORDINADOR DEL REGISTRO LOCAL DE VÍCTIMAS</strong></p>
                    <p style="margin-bottom: 20px;"><strong>COMISIÓN EJECUTIVA DE ATENCIÓN A VÍCTIMAS DE LA CIUDAD DE MÉXICO</strong></p>
                    <p><strong>BMCH</strong></p>
                  </div>
                `);
              }
              setNumeroOficio(''); 
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
