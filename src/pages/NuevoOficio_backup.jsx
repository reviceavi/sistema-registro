import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import './NuevoOficio.css';

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  return (
    <div className="tiptap-menubar">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'active' : ''}>B</button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'active' : ''}>I</button>
  <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'active' : ''}>S</button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
      <button onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</button>
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()}>“”</button>
      <button onClick={() => {
        const url = window.prompt('URL de la imagen');
        if (url) editor.chain().focus().setImage({ src: url }).run();
      }}>Img</button>
      <button onClick={() => {
        const url = window.prompt('URL de enlace');
        if (url) editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      }}>Link</button>
      <button onClick={() => editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run()}>Table</button>
      <button onClick={() => editor.chain().focus().undo().run()}>Undo</button>
      <button onClick={() => editor.chain().focus().redo().run()}>Redo</button>
    </div>
  );
};

const NuevoOficio = () => {
  const [titulo, setTitulo] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: true }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: 'Redacta el oficio aquí...' })
    ],
    content: ''
  });

  const handleGuardar = () => {
    const html = editor ? editor.getHTML() : '';
    console.log('Guardar oficio', { titulo, html });
    alert('Contenido guardado en consola (ver devtools)');
  };

  return (
    <div className="nuevo-oficio-container">
      <div className="header">
        <h2>📝 Nuevo Oficio</h2>
      </div>

      <div className="form-group">
        <label>Título</label>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título del oficio" />
      </div>

      <div className="editor-area">
        <MenuBar editor={editor} />
        <div className="editor-wrapper">
          <EditorContent editor={editor} />
        </div>
      </div>

      <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px'}}>
        <button className="btn-secondary" onClick={() => { if (editor) editor.commands.clearContent(); setTitulo(''); }}>Limpiar</button>
        <button className="btn-primary" onClick={handleGuardar}>Guardar</button>
      </div>
    </div>
  );
};

export default NuevoOficio;
