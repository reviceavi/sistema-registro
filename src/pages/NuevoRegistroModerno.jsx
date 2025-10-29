import React, { useState, useEffect, useRef } from 'react';
import { 
  DocumentIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  UserPlusIcon,
  FolderPlusIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CalendarIcon,
  IdentificationIcon,
  ScaleIcon,
  TrashIcon,
  PlusIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import HeaderInstitucional from '../components/HeaderInstitucional';
import { useAuth } from '../contexts/AuthContext';
import { createOficioEntrada, createSolicitud, createVictimasLote, fetchExpedientes } from '../services/registroSupabase';
import { supabase } from '../services/supabaseClient';
import '../styles/NuevoRegistroModerno.css';
import '../styles/fileUpload.css';

const NuevoRegistroModerno = () => {
  const { user, loading: authLoading } = useAuth(); // Eliminado authenticatedFetch
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [createdRecord, setCreatedRecord] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Estados para validación y animaciones
  const [fieldErrors, setFieldErrors] = useState({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Estados para búsqueda y selección de expedientes
  const [expedientes, setExpedientes] = useState([]);
  const [filteredExpedientes, setFilteredExpedientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const searchDebounceRef = useRef(null);
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [loadingExpedientes, setLoadingExpedientes] = useState(false);
  const [showExpedienteSelector, setShowExpedienteSelector] = useState(false);

  // DEBUG: solo se ejecuta si la URL tiene ?debug_sup=true
  useEffect(() => {
    if (!window || !window.location) return;
    try {
      const params = new URLSearchParams(window.location.search);
      if (!params.get('debug_sup')) return;

      (async () => {
        console.log('🔎 Debug Supabase: iniciando pruebas');
        try {
          const session = await supabase.auth.getSession();
          console.log('Debug session:', session);
        } catch (e) {
          console.error('Error obteniendo session:', e);
        }

        try {
          const userResp = await supabase.auth.getUser();
          console.log('Debug user:', userResp);
        } catch (e) {
          console.error('Error obteniendo user:', e);
        }

        try {
          const r = await supabase
            .from('oficios_entrada')
            .insert([{ año: 2025, remitente: 'Prueba debug desde app', alfanumerica_entrada: 'DBG-CLIENT' }])
            .select();
          console.log('Debug insert result:', r);
        } catch (e) {
          console.error('Error insert debug:', e);
        }
      })();
    } catch (e) {
      console.error('Debug setup error:', e);
    }
  }, []);
  
  // PASO 1: Datos del oficio de entrada
  const [oficioData, setOficioData] = useState({
    anio: '2025',
    alfanumerica_entrada: '',
    autoridad_dependencia: '',
    cargo: '',
    remitente: '',
    asunto: '',
    atiende_oficio: '',
    recepcion_relovi: '',
    recepcion_ceavi: '',
  archivo_adjunto: null,
  archivo_adjunto_name: ''
  });

  // PASO 2: Tipo de acción
  const [selectedAction, setSelectedAction] = useState('');

  // PASO 3: Información General de la Solicitud (tabla solicitudes_registro)
  const [solicitudData, setSolicitudData] = useState({
    anio: '2025',
    identificaciones: '',
    fecha_solicitud: '',
    recomendacion: '',
    tipo_resolucion: '',
    estatus_solicitud: 'En proceso',
    reconocimiento_victima: '',
    delito: '',
    actas: '',
    fecha_completo: '',
    fuds: '',
    curp: '',
    fecha_resolucion: '',
    solicitante: '',
    aceptacion: '',
    tiempo_resolucion: '',
    solicitud: '',
    persona_usuaria: ''
  });

  // Asegurar que el año de la solicitud refleje el año actual del sistema
  useEffect(() => {
    const currentYear = new Date().getFullYear().toString();
    setSolicitudData(prev => ({ ...prev, anio: currentYear }));
  }, []);

  // Gestión de víctimas usando campos de PadronTemporal
  const [activeTab, setActiveTab] = useState('directas');
  const [victimasDirectas, setVictimasDirectas] = useState([]);
  const [victimasIndirectas, setVictimasIndirectas] = useState([]);

  // Handler to restart the form by resetting internal state (no full reload)
  const handleRestart = () => {
    // Reset oficio data to defaults
    setOficioData({
      anio: '2025',
      alfanumerica_entrada: '',
      autoridad_dependencia: '',
      cargo: '',
      remitente: '',
      asunto: '',
      atiende_oficio: '',
      recepcion_relovi: '',
      recepcion_ceavi: '',
      archivo_adjunto: null
    });

    // Reset action and solicitud data
    setSelectedAction('');
    setSolicitudData({
      anio: '2025',
      identificaciones: '',
      fecha_solicitud: '',
      recomendacion: '',
      tipo_resolucion: '',
      estatus_solicitud: 'En proceso',
      reconocimiento_victima: '',
      delito: '',
      actas: '',
      fecha_completo: '',
      fuds: '',
      curp: '',
      fecha_resolucion: '',
      solicitante: '',
      aceptacion: '',
      tiempo_resolucion: '',
      solicitud: '',
      persona_usuaria: ''
    });

    // Clear victims and selection UI
    setVictimasDirectas([]);
    setVictimasIndirectas([]);
    setSelectedExpediente(null);
    setFilteredExpedientes(expedientes || []);
    setSearchTerm('');
    setShowExpedienteSelector(false);

    // Clear errors and status
    setFieldErrors({});
    setError(null);
    setSuccess(false);
    setLoading(false);
    setIsTransitioning(false);

    // Return to the first step
    setCurrentStep(1);

    // Scroll to top of form
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { /* noop */ }
  };

  // Helpers for recommendation handling
  const victimHasRecommendationPrefix = (v) => {
    if (!v || !v.tipo_violacion_dh) return false;
    return String(v.tipo_violacion_dh).trim().startsWith('Recomendación');
  };

  const getRecommendationInputValue = (v) => {
    if (!v) return '';
    // Prefer temporal input if present
    if (v.recomendacion_input !== undefined && v.recomendacion_input !== null) return v.recomendacion_input;
    const m = String(v.tipo_violacion_dh || '').match(/^Recomendación\s*(.*)$/);
    return m && m[1] ? m[1] : '';
  };

  // Helper: format a name so each word is capitalized (initial uppercase, rest lowercase).
  // Rules: no leading spaces, collapse multiple consecutive spaces into one, allow a single
  // space between words and preserve a single trailing space while typing.
  const formatNameInput = (raw) => {
    if (raw === undefined || raw === null) return '';
    let s = String(raw);

    // Remove disallowed characters but keep letters (including accents), spaces and common name punctuation
    s = s.replace(/[^\p{L} \-'.]/gu, '');

    // Remove leading spaces
    s = s.replace(/^\s+/, '');

    // Collapse multiple spaces to one
    s = s.replace(/\s{2,}/g, ' ');

    // Detect if user left a trailing space so we can preserve it while typing
    const hasTrailingSpace = / $/.test(s);

    // Capitalize each word (respecting hyphens/apostrophes)
    const parts = s.split(' ');
    const capitalized = parts.map(word => word.split(/([-'.])/).map(part => {
      if (/[-'.]/.test(part)) return part;
      return part.length > 0 ? part[0].toUpperCase() + part.slice(1).toLowerCase() : '';
    }).join('')).join(' ');

    return hasTrailingSpace ? capitalized + ' ' : capitalized;
  };

  // Sanitiza claves alfanuméricas: permite dígitos, letras mayúsculas, '/' y '-'.
  // Además evita espacios dobles (los colapsa a uno) y remueve caracteres no permitidos.
  const sanitizeAlfanumerica = (raw) => {
    if (raw === undefined || raw === null) return '';
    const original = String(raw);
    // Preserve a single trailing space while typing
    const hasTrailingSpace = / $/.test(original);
    let s = original.toUpperCase();
    // Permitir solo A-Z, 0-9, slash, guion y espacio
    s = s.replace(/[^A-Z0-9\/\- ]+/g, '');
    // Colapsar múltiples caracteres de espacio (incluye tabs) a uno
    s = s.replace(/\s{2,}/g, ' ');
    // Quitar espacios iniciales
    s = s.replace(/^\s+/, '');
    // Quitar espacios finales que no sean el que el usuario está escribiendo
    s = s.replace(/\s+$/g, '');
    return hasTrailingSpace ? (s + ' ') : s;
  };

  // Sanitiza y formatea el campo "Nombre Recomendación":
  // - colapsa espacios múltiples a uno
  // - elimina espacios iniciales/finales
  // - quita puntuación final (. , ;)
  // - convierte a minúsculas y deja solo la primera letra en mayúscula
  const sanitizeNombreRecomendacion = (raw) => {
    if (raw === undefined || raw === null) return '';
    const original = String(raw);
    // preserve a single trailing space while typing
    const hasTrailingSpace = / $/.test(original);

    // collapse multiple whitespace to one (spaces, tabs, etc.)
    let s = original.replace(/\s{2,}/g, ' ');

    // remove leading spaces
    s = s.replace(/^\s+/, '');

    // Some keyboards insert a period when the user types double space (".<space>").
    // Remove any isolated dots (or sequences of dots) followed by optional space, replacing with a single space.
    s = s.replace(/\.{1,}\s*/g, ' ');

    // remove any trailing punctuation or symbol characters (.,;:!?—… etc.)
    s = s.replace(/[\p{P}\p{S}]+$/u, '');

    // remove trailing spaces that could remain after stripping punctuation
    s = s.replace(/\s+$/g, '');

    // Normalize case: lowercase then uppercase first character
    s = s.toLowerCase();
    const formatted = s ? (s.charAt(0).toUpperCase() + s.slice(1)) : '';

    return hasTrailingSpace ? formatted + ' ' : formatted;
  };

  // Sanitiza texto libre: colapsa espacios múltiples a uno y quita espacios iniciales/finales
  const sanitizeTextoLibre = (raw) => {
    if (raw === undefined || raw === null) return '';
    const original = String(raw);
    // preserve a single trailing space while typing
    const hasTrailingSpace = / $/.test(original);
    // Some keyboards insert a period when the user types double space (".<space>").
    // Remove any isolated dots (or sequences of dots) followed by optional space, replacing with a single space.
    let s = original.replace(/\.{1,}\s*/g, ' ');
    // collapse multiple whitespace characters to a single space (spaces, tabs, etc.)
    s = s.replace(/\s+/g, ' ');
    // remove leading and trailing spaces
    s = s.replace(/^\s+/, '').replace(/\s+$/, '');
    return hasTrailingSpace ? (s + ' ') : s;
  };

  // Sanitiza la clave de víctima de recomendación: quita acentos, permite a-z y dígitos,
  // colapsa espacios, elimina espacios iniciales, y preserva un espacio final mientras se escribe.
  const sanitizeClaveVictima = (raw) => {
    if (raw === undefined || raw === null) return '';
    const original = String(raw);
    const hasTrailingSpace = / $/.test(original);
    // remove accents
    const noAccents = original.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let s = noAccents.toLowerCase();
    // keep only a-z, digits and spaces
    s = s.replace(/[^a-z0-9 ]/g, '');
    // collapse spaces and remove leading/trailing
    s = s.replace(/\s+/g, ' ').replace(/^\s+/, '');
    const cleaned = s.replace(/\s+$/, '');
    return hasTrailingSpace ? cleaned + ' ' : cleaned;
  };

  // sanitizeTelefono: permite prefijos (letras + punto, e.g. "Ext."), luego sólo dígitos y guiones.
  // colapsa espacios múltiples a uno y limita a un único espacio entre prefijo y número.
  const sanitizeTelefono = (raw) => {
    if (raw === null || raw === undefined) return '';
    let s = String(raw).trim();
    // collapse multiple spaces to single
    s = s.replace(/\s+/g, ' ');
    // limit to at most two parts (optional prefix + number)
    const parts = s.split(' ');
    if (parts.length > 2) {
      s = parts.slice(0, 2).join(' ');
    }
    // detect a leading prefix (letters + optional dot), e.g. "Ext." or "Int." (including spanish accented letters)
    const prefixMatch = s.match(/^([A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+\.?)[ ]+(.*)$/);
    let prefix = '';
    let rest = s;
    if (prefixMatch) {
      prefix = prefixMatch[1];
      rest = prefixMatch[2];
    }
    // keep only digits and hyphens in the rest
    rest = rest.replace(/[^0-9-]/g, '');
    // collapse multiple hyphens
    rest = rest.replace(/-+/g, '-');
    // trim hyphens at ends
    rest = rest.replace(/^-+|-+$/g, '');
    // return prefix + (space) + rest, or just rest
    return (prefix ? (prefix + ' ') : '') + rest;
  };

  // Estado para errores de correo por víctima
  const [emailErrors, setEmailErrors] = useState({});
  const [curpErrors, setCurpErrors] = useState({});

  // Validador básico de correo electrónico (permite TLDs comunes). No sustituye validación del backend.
  const isValidEmail = (value) => {
    if (!value) return false;
    const s = String(value).trim().toLowerCase();
    // simple regex: local@domain.tld (domain can have subdomains)
    const re = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
    return re.test(s);
  };

  // sanitizeCurp: mayúsculas, eliminar espacios y caracteres no alfanuméricos, máximo 18 caracteres
  const sanitizeCurp = (raw) => {
    if (raw === null || raw === undefined) return '';
    let s = String(raw).toUpperCase();
    // remove any character that's not A-Z or 0-9
    s = s.replace(/[^A-Z0-9]/g, '');
    // limit to max 18 characters
    if (s.length > 18) s = s.slice(0, 18);
    return s;
  };

  // isValidCurp: exact 18 chars A-Z or 0-9 (basic structural check)
  const isValidCurp = (value) => {
    if (!value) return false;
    const s = String(value).trim();
    const re = /^[A-Z0-9]{18}$/;
    return re.test(s);
  };

  // Cargar expedientes después de que la verificación de autenticación termine.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      console.warn('Usuario no autenticado: no se cargan expedientes');
      setExpedientes([]);
      setFilteredExpedientes([]);
      return;
    }
    loadExpedientes();
  }, [authLoading, user]);

  // Verificar autenticación
  useEffect(() => {
    console.log('🔍 Estado de autenticación:', { user, loading });
    if (!user) {
      console.log('⚠️ Usuario no autenticado');
      // Para desarrollo, permitir continuar sin autenticación
      // En producción, descomentar la siguiente línea:
      // window.location.href = '/firebase-login';
    }
  }, [user]);

  const loadExpedientes = async () => {
    try {
      setLoadingExpedientes(true);
      console.log('🔄 Iniciando carga de expedientes desde Supabase...');
      
      const data = await fetchExpedientes();
      setExpedientes(data);
      setFilteredExpedientes(data);
    } catch (error) {
      console.error('❌ Error cargando expedientes:', error);
      setExpedientes([]);
      setFilteredExpedientes([]);
    } finally {
      setLoadingExpedientes(false);
    }
  };

  // Navegación entre pasos
  const nextStep = () => {
    if (validateCurrentStep()) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsTransitioning(false);
      }, 200);
    }
  };

  const prevStep = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(currentStep - 1);
      setIsTransitioning(false);
    }, 200);
  };

  // Validación de pasos
  const validateCurrentStep = () => {
    const errors = {};
    
    if (currentStep === 1) {
  if (!oficioData.anio) errors.anio = 'Campo requerido';
  if (!oficioData.alfanumerica_entrada) errors.alfanumerica_entrada = 'Campo requerido';
  if (!oficioData.autoridad_dependencia) errors.autoridad_dependencia = 'Campo requerido';
  if (!oficioData.cargo) errors.cargo = 'Campo requerido';
  if (!oficioData.remitente) errors.remitente = 'Campo requerido';
  if (!oficioData.recepcion_ceavi) errors.recepcion_ceavi = 'Campo requerido';
  if (!oficioData.atiende_oficio) errors.atiende_oficio = 'Campo requerido';
    }
    
    if (currentStep === 2) {
      if (!selectedAction) errors.selectedAction = 'Debe seleccionar una acción';
      if (selectedAction === 'agregar_expediente' && !selectedExpediente) {
        errors.selectedExpediente = 'Debe seleccionar un expediente';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Gestión de víctimas usando estructura completa de PadronTemporal
  const addVictima = (tipo) => {
    const nuevaVictima = {
      // Datos personales básicos
      id: '',
      anio: '',
      numero_registro: '',
      alfanumerica_registro: '',
      nombre_victima: '',
      fecha_registro: '',
      tipo_violacion_dh: '',
      tipo_delito: '',
      tipo_victima: '', // ej. 'Directa' o 'Indirecta'
      expediente_judicial: '',
      reconocimiento_calidad_victima: '',
      post_mortem: '',
      alcaldia_hecho_victimizante: '',
      nna: '',
      sexo: '',
      telefono: '',
      correo_electronico: '',
      gap: '',
      curp: '',
      tiempo_modo_lugar: '',
      parentesco: '',
      carpeta_investigacion: '',
      nombre_recomendacion: '',
  derechos_humanos_violados: [],
      clave_victima_recomendacion: ''
    };

    if (tipo === 'directas') {
      setVictimasDirectas([...victimasDirectas, nuevaVictima]);
    } else {
      setVictimasIndirectas([...victimasIndirectas, nuevaVictima]);
    }
  };

  const removeVictima = (tipo, index) => {
    if (tipo === 'directas') {
      setVictimasDirectas(victimasDirectas.filter((_, i) => i !== index));
    } else {
      setVictimasIndirectas(victimasIndirectas.filter((_, i) => i !== index));
    }
  };

  const updateVictima = (tipo, index, campo, valor) => {
    if (tipo === 'directas') {
      const nuevasVictimas = [...victimasDirectas];
      nuevasVictimas[index][campo] = valor;
      setVictimasDirectas(nuevasVictimas);
    } else {
      const nuevasVictimas = [...victimasIndirectas];
      nuevasVictimas[index][campo] = valor;
      setVictimasIndirectas(nuevasVictimas);
    }
  };

  // Manejo de archivos
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    // limpiar error previo
    const prevErrors = { ...(fieldErrors || {}) };
    delete prevErrors.archivo_adjunto;

    if (!file) {
      setFieldErrors(prevErrors);
      setOficioData({ ...oficioData, archivo_adjunto: null, archivo_adjunto_name: '' });
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf'];
    const isPdf = allowedTypes.includes(file.type) || /\.pdf$/i.test(file.name);

    if (!isPdf) {
      setFieldErrors({ ...prevErrors, archivo_adjunto: 'Tipo de archivo no permitido. Solo PDF.' });
      setOficioData({ ...oficioData, archivo_adjunto: null, archivo_adjunto_name: '' });
      return;
    }

    if (file.size > maxSize) {
      setFieldErrors({ ...prevErrors, archivo_adjunto: 'Archivo demasiado grande. Máx. 10MB.' });
      setOficioData({ ...oficioData, archivo_adjunto: null, archivo_adjunto_name: '' });
      return;
    }

    // válido
    setFieldErrors(prevErrors);
    setOficioData({ ...oficioData, archivo_adjunto: file, archivo_adjunto_name: file.name });
  };

  // Enhanced file upload helpers for drag-and-drop and removal
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) || null;
    if (!file) return;
    // reuse same validation logic: create a fake input event-like object
    const fakeEvent = { target: { files: [file] } };
    handleFileUpload(fakeEvent);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeArchivoAdjunto = () => {
    const prevErrors = { ...(fieldErrors || {}) };
    delete prevErrors.archivo_adjunto;
    setFieldErrors(prevErrors);
    setOficioData({ ...oficioData, archivo_adjunto: null });
  };

  // Normaliza cadenas: elimina acentos, minúsculas y trim
  const normalizeString = (s) => {
    if (s === null || s === undefined) return '';
    try {
      return String(s).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
    } catch (e) {
      // Fallback (older envs)
      return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    }
  };

  // Búsqueda de expedientes (opera sobre términos normalizados)
  const handleSearchExpedientes = (term) => {
    const q = normalizeString(term || '');
    if (q === '' || !expedientes) {
      setFilteredExpedientes(expedientes || []);
      return;
    }

    const valueIncludes = (value) => {
      if (value === null || value === undefined) return false;
      if (Array.isArray(value)) {
        return value.some(v => valueIncludes(v));
      }
      if (typeof value === 'object') {
        try {
          return normalizeString(JSON.stringify(value)).includes(q);
        } catch (e) {
          return false;
        }
      }
      return normalizeString(value).includes(q);
    };

    const filtered = (expedientes || []).filter(exp => (
      valueIncludes(exp.solicitud) ||
      valueIncludes(exp.numero_registro) ||
      valueIncludes(exp.numeros_registro) ||
      valueIncludes(exp.alfanumerica_registro) ||
      valueIncludes(exp.victimas_directas) ||
      valueIncludes(exp.victimas_indirectas) ||
      valueIncludes(exp.victimas) ||
      valueIncludes(exp.nombre) ||
      valueIncludes(exp.nombre_victima)
    ));

    setFilteredExpedientes(filtered);
  };

  // Handler para el input que aplica debounce y actualiza searchTerm
  const handleSearchInputChange = (term) => {
    setSearchTerm(term);
    const delay = 250; // ms
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      handleSearchExpedientes(term);
    }, delay);
  };

  // limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  // Envío de formularios
  const submitOficio = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Iniciando envío de oficio a Supabase...');
      
      // Crear oficio en Supabase
      const createdOficio = await createOficioEntrada(oficioData);
      
      // Guardar resultado para mostrar en UI
      setCreatedRecord({ oficio: createdOficio });
      setSuccess(true);
      
      console.log('✅ Oficio registrado exitosamente:', createdOficio);

    } catch (error) {
      console.error('❌ Error al procesar el oficio:', error);
      setError(error?.message || 'Error al registrar el oficio');
    } finally {
      setLoading(false);
    }
  };

  const submitSolicitudCompleta = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Iniciando registro completo en Supabase...');

      // 1) Crear Oficio de Entrada
      let createdOficio = null;
      try {
        createdOficio = await createOficioEntrada(oficioData);
        console.log('✅ Oficio entrada creado:', createdOficio?.ID);
      } catch (oficioErr) {
        console.warn('⚠️ Error creando oficio (continuando):', oficioErr);
      }

      // 2) Crear Solicitud
      const createdSolicitud = await createSolicitud(solicitudData);
      console.log('✅ Solicitud creada:', createdSolicitud?.ID);

      // 3) Crear Víctimas
      const victimsToCreate = [];
      
      // Agregar víctimas directas
      (victimasDirectas || []).forEach(v => {
        victimsToCreate.push({ 
          ...v, 
          tipo_victima: 'DIRECTA',
          tipo_relacion: 'directa' 
        });
      });
      
      // Agregar víctimas indirectas
      (victimasIndirectas || []).forEach(v => {
        victimsToCreate.push({ 
          ...v, 
          tipo_victima: 'INDIRECTA',
          tipo_relacion: 'indirecta' 
        });
      });

      let createdVictims = [];
      if (victimsToCreate.length > 0) {
        createdVictims = await createVictimasLote(victimsToCreate);
        console.log('✅ Víctimas creadas:', createdVictims.length);
      }

      // Guardar info para mostrar en UI
      setCreatedRecord({ 
        oficio: createdOficio,
        solicitud: createdSolicitud, 
        victimas: createdVictims 
      });
      setSuccess(true);

    } catch (error) {
      console.error('❌ Error en registro completo:', error);
      const msg = error?.message || error?.details || 'Error al procesar la solicitud';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Función para login rápido durante desarrollo (DESHABILITADA - migración a Supabase)
  const quickLogin = async () => {
    console.warn('⚠️ Login rápido deshabilitado - usar autenticación de Supabase');
    alert('Login rápido deshabilitado. Use la autenticación normal.');
  };

  // Verificar si el usuario está autenticado
  if (!user) {
    return (
      <div className="nuevo-registro-moderno">
        <HeaderInstitucional />
        <div className="main-container">
          <div className="auth-warning">
            <ExclamationTriangleIcon className="warning-icon" />
            <h2>Acceso Restringido</h2>
            <p>Necesita estar autenticado para acceder a esta página.</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <Link to="/firebase-login" className="btn btn-primary">
                Iniciar Sesión
              </Link>
              <button onClick={quickLogin} className="btn btn-secondary">
                Login Rápido (Dev)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nuevo-registro-moderno">
      <HeaderInstitucional />
      
      <div className="main-container">
        {/* Header de la página */}
        <div className="page-header">
          <div className="page-title">
            <DocumentIcon className="page-title-icon" />
            Nuevo Registro de Víctimas
          </div>
          <p className="page-description">
            Complete el proceso de registro en tres pasos: datos del oficio de entrada, 
            selección del tipo de acción y registro detallado de víctimas
          </p>
        </div>

        {/* Indicador de progreso */}
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
          
          <div className="progress-steps">
            <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
              <div className="step-circle">
                {currentStep > 1 ? <CheckCircleIcon className="step-icon" /> : '1'}
              </div>
              <div className="step-info">
                <div className="step-title">Oficio de Entrada</div>
                <div className="step-subtitle">Información básica</div>
              </div>
            </div>

            <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
              <div className="step-circle">
                {currentStep > 2 ? <CheckCircleIcon className="step-icon" /> : '2'}
              </div>
              <div className="step-info">
                <div className="step-title">Tipo de Acción</div>
                <div className="step-subtitle">Selección de proceso</div>
              </div>
            </div>

            <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
              <div className="step-circle">3</div>
              <div className="step-info">
                <div className="step-title">Información General y Víctimas</div>
                <div className="step-subtitle">Solicitud completa</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mensajes de estado */}
        {error && (
          <div className="alert alert-error">
            <ExclamationTriangleIcon className="alert-icon" />
            <div>
              <h4>Error en el proceso</h4>
              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <CheckCircleIcon className="alert-icon" />
            <div>
              <h4>¡Proceso completado!</h4>
              <p>La información ha sido registrada correctamente.</p>
              <div className="success-actions" style={{ marginTop: '0.5rem' }}>
                <button
                  onClick={handleRestart}
                  className="btn btn-success"
                >
                  <CheckCircleIcon className="btn-icon" />
                  Registrar Otro Oficio
                </button>
                <Link to="/" className="btn btn-outline" style={{ marginLeft: '0.5rem' }}>
                  Ir al Inicio
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* PASO 1: Oficio de Entrada */}
        {currentStep === 1 && (
          <div className="section-card fade-enter-active">

            <div className="fields-grid two-columns">
              <div className="field-group">
                <label className="field-label">
                  <CalendarIcon className="field-icon" />
                  Año *
                </label>
                <input
                  type="number"
                  className={`field-input ${fieldErrors.anio ? 'error' : ''}`}
                  value={oficioData.anio}
                  onChange={(e) => setOficioData({...oficioData, anio: e.target.value})}
                  placeholder="2025"
                />
                {fieldErrors.anio && <span className="field-error">{fieldErrors.anio}</span>}
              </div>

              <div className="field-group">
                <label className="field-label">
                  <BuildingOfficeIcon className="field-icon" />
                  Alfanúmerica Entrada *
                </label>
                <input
                  type="text"
                  className={`field-input ${fieldErrors.alfanumerica_entrada ? 'error' : ''}`}
                  value={oficioData.alfanumerica_entrada}
                  onChange={(e) => setOficioData({...oficioData, alfanumerica_entrada: e.target.value})}
                  placeholder="La clave alfanúmerica del oficio de entrada ej. FGJCDMX/XXX/2025"
                />
                {fieldErrors.alfanumerica_entrada && <span className="field-error">{fieldErrors.alfanumerica_entrada}</span>}
              </div>

              <div className="field-group">
                <label className="field-label">
                  <DocumentTextIcon className="field-icon" />
                  Dependencia Autoridad *
                </label>
                <input
                  type="text"
                  className={`field-input ${fieldErrors.autoridad_dependencia ? 'error' : ''}`}
                  value={oficioData.autoridad_dependencia}
                  onChange={(e) => setOficioData({...oficioData, autoridad_dependencia: e.target.value})}
                  placeholder="Dependencia donde labora el funcionario público que remite el oficio ej. FGJCDMX"
                />
                {fieldErrors.autoridad_dependencia && <span className="field-error">{fieldErrors.autoridad_dependencia}</span>}
              </div>

              <div className="field-group">
                <label className="field-label">
                  <UserGroupIcon className="field-icon" />
                  Cargo del Funcionario *
                </label>
                <input
                  type="text"
                  className={`field-input ${fieldErrors.cargo ? 'error' : ''}`}
                  value={oficioData.cargo}
                  onChange={(e) => setOficioData({...oficioData, cargo: e.target.value})}
                  placeholder="Cargo del funcionario que remite el oficio ej. Fiscal / Director"
                />
              </div>

              <div className="field-group">
                <label className="field-label">
                  <UserGroupIcon className="field-icon" />
                  Remitente *
                </label>
                <input
                  type="text"
                  className={`field-input ${fieldErrors.remitente ? 'error' : ''}`}
                  value={oficioData.remitente}
                  onChange={(e) => setOficioData({...oficioData, remitente: e.target.value})}
                  placeholder="Nombre completo del funcionario que remite el oficio"
                />
                {fieldErrors.remitente && <span className="field-error">{fieldErrors.remitente}</span>}
              </div>
              
              <div className="field-group">
                <label className="field-label">
                  <CalendarIcon className="field-icon" />
                  Recepción RELOVI
                </label>
                <input
                  type="date"
                  className="field-input"
                  value={oficioData.recepcion_relovi}
                  onChange={(e) => setOficioData({...oficioData, recepcion_relovi: e.target.value})}
                    max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="field-group">
                <label className="field-label">
                  <CalendarIcon className="field-icon" />
                  Recepción CEAVI *
                </label>
                <input
                  type="date"
                  className={`field-input ${fieldErrors.recepcion_ceavi ? 'error' : ''}`}
                  value={oficioData.recepcion_ceavi}
                  onChange={(e) => setOficioData({...oficioData, recepcion_ceavi: e.target.value})}
                    max={new Date().toISOString().split('T')[0]}
                />
                {fieldErrors.recepcion_ceavi && <span className="field-error">{fieldErrors.recepcion_ceavi}</span>}
              </div>

              <div className="field-group">
                <label className="field-label">
                  <InformationCircleIcon className="field-icon" />
                  Atiende Oficio *
                </label>
                <input
                  type="text"
                  className="field-input"
                  value={oficioData.atiende_oficio}
                  onChange={(e) => setOficioData({...oficioData, atiende_oficio: e.target.value})}
                  placeholder="Nombre del funcionario del RELOVI que dará respuesta y atención al oficio"
                />
              </div>

            </div>

            <div className="field-group full-width">
              <label className="field-label">
                <CloudArrowUpIcon className="field-icon" />
                Archivo Adjunto
              </label>
              <div className={`file-upload-area ${isDragOver ? 'drag-over' : ''}`} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
                <input
                  type="file"
                  id="archivo_adjunto"
                  className="file-input"
                  onChange={handleFileUpload}
                  accept=".pdf"
                />
                <label htmlFor="archivo_adjunto" className="file-upload-label">
                  <CloudArrowUpIcon className="upload-icon" />
                  <div style={{display: 'flex', flexDirection: 'column'}}>
                    <span>Seleccionar archivo</span>
                    <span className="file-upload-hint">PDF (máx. 10MB) — arrastra aquí para soltar</span>
                  </div>
                </label>
                {oficioData.archivo_adjunto && (
                  <div className="file-selected">
                    <DocumentIcon className="file-icon" />
                    <span>{oficioData.archivo_adjunto_name}</span>
                  </div>
                )}
                {fieldErrors.archivo_adjunto && (
                  <span className="field-error">{fieldErrors.archivo_adjunto}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PASO 2: Tipo de Acción */}
        {currentStep === 2 && (
          <div className="section-card fade-enter-active">
            <div className="section-title">
              <FolderPlusIcon className="section-title-icon" />
              Seleccione el Tipo de Acción
            </div>
            <p className="section-description">
              Determine cómo desea procesar este oficio de entrada en el sistema.
            </p>

            <div className="action-options">
              <div 
                className={`action-card ${selectedAction === 'solo_oficio' ? 'selected' : ''}`}
                onClick={() => setSelectedAction('solo_oficio')}
              >
                <div className="action-icon">
                  <DocumentIcon className="action-icon-svg" />
                </div>
                <div className="action-content">
                  <h3 className="action-title">Solo Registrar Oficio</h3>
                  <p className="action-description">
                    Registrar únicamente los datos del oficio de entrada sin crear una nueva solicitud o asociar a un expediente existente.
                  </p>
                </div>
              </div>

              <div 
                className={`action-card ${selectedAction === 'nueva_solicitud' ? 'selected' : ''}`}
                onClick={() => setSelectedAction('nueva_solicitud')}
              >
                <div className="action-icon">
                  <UserPlusIcon className="action-icon-svg" />
                </div>
                <div className="action-content">
                  <h3 className="action-title">Nueva Solicitud Completa</h3>
                  <p className="action-description">
                    Crear un nuevo expediente de Registro de Víctimas asociado a este oficio de entrada.
                  </p>
                  <ul className="action-features">
                  </ul>
                </div>
              </div>

              <div 
                className={`action-card ${selectedAction === 'agregar_expediente' ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedAction('agregar_expediente');
                  setShowExpedienteSelector(true);
                }}
              >
                <div className="action-icon">
                  <FolderPlusIcon className="action-icon-svg" />
                </div>
                <div className="action-content">
                  <h3 className="action-title">Agregar a Expediente Existente</h3>
                  <p className="action-description">
                    Asociar este oficio a un expediente de víctimas ya existente en el sistema.
                  </p>
                  <ul className="action-features">
                  </ul>
                </div>
              </div>
            </div>

            {fieldErrors.selectedAction && (
              <div className="field-error text-center">{fieldErrors.selectedAction}</div>
            )}

            {/* Selector de expedientes */}
            {showExpedienteSelector && selectedAction === 'agregar_expediente' && (
              <div className="expediente-selector">
                <h4 className="selector-title">Seleccionar Expediente Existente</h4>
                
                <div className="search-box">
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Buscar por número de solicitud o nombre de víctima..."
                    value={searchTerm}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                  />
                </div>

                <div className="expedientes-list">
                  {loadingExpedientes ? (
                    <div className="loading-state">Cargando expedientes...</div>
                  ) : (filteredExpedientes || []).length === 0 ? (
                    <div className="empty-state">No se encontraron expedientes</div>
                  ) : (
                    (filteredExpedientes || []).map(expediente => (
                      <div
                        key={expediente.id}
                        className={`expediente-item ${selectedExpediente?.id === expediente.id ? 'selected' : ''}`}
                        onClick={() => setSelectedExpediente(expediente)}
                      >
                        <div className="expediente-info">
                          <h5 className="expediente-numero">{expediente.solicitud || 'Sin número'}</h5>
                          <p className="expediente-victimas">
                            Víctimas: {expediente.victimas_directas || 'No especificadas'}
                          </p>
                          <p className="expediente-victimas">
                            Víctimas Indirectas: {expediente.victimas_indirectas || 'No especificadas'}
                          </p>
                          <p className="expediente-estatus">
                            Estatus: {expediente.estatus || 'Sin estatus'}
                          </p>
                          <p className="expediente-fecha">
                            Creado: {new Date(expediente.fecha_creacion).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {fieldErrors.selectedExpediente && (
                  <div className="field-error">{fieldErrors.selectedExpediente}</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PASO 3: Información General y Registro de Víctimas */}
        {currentStep === 3 && (
          <div className="section-card fade-enter-active">
            <div className="section-title">
              <DocumentTextIcon className="section-title-icon" />
              Información General de la Solicitud
            </div>
            <p className="section-description">
              Complete la información general de la solicitud de registro y los datos de las víctimas en el Formato Único de Declaración.
            </p>

            {/* Información General de la Solicitud */}
            <div className="section-card">
              <h5 className="section-title">
                <InformationCircleIcon className="section-title-icon" />
                Datos Generales de la Solicitud
              </h5>
              
              <div className="fields-grid three-columns">
                <div className="field-group">
                  <label className="field-label">
                    <CalendarIcon className="field-icon" />
                    Año *
                  </label>
                    <input
                      type="text"
                      className="field-input bg-gray-100 cursor-not-allowed"
                      value={new Date().getFullYear()}
                      readOnly
                      aria-readonly="true"
                      title="Año actual"
                    />
                </div>

                <div className="field-group">
                  <label className="field-label">
                    <CalendarIcon className="field-icon" />
                    Fecha de Solicitud
                  </label>
                  <input
                    type="date"
                    className="field-input"
                    value={solicitudData.fecha_solicitud}
                    onChange={(e) => setSolicitudData({...solicitudData, fecha_solicitud: e.target.value})}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">
                    <UserGroupIcon className="field-icon" />
                    Solicitante
                  </label>
                  <select
                    className="field-select"
                    value={solicitudData.solicitante}
                    onChange={(e) => setSolicitudData({...solicitudData, solicitante: e.target.value})}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Ministerio Público">Ministerio Público</option>
                    <option value="CDHCM">CDHCM</option>
                    <option value="Poder Judicial">Poder Judicial</option>
                    <option value="UPC">UPC</option>
                  </select>
                </div>

                <div className="field-group">
                  <label className="field-label">
                    <UserGroupIcon className="field-icon" />
                    Persona Usuaria / Negativa
                  </label>
                  <input
                    type="text"
                    className="field-input"
                    value={solicitudData.persona_usuaria}
                    onChange={(e) => setSolicitudData({...solicitudData, persona_usuaria: formatNameInput(e.target.value)})}
                    placeholder="Solo en caso de posible Negativa"
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">
                    <ScaleIcon className="field-icon" />
                    Delito
                  </label>
                  <select
                    className="field-select"
                    value={solicitudData.delito}
                    onChange={(e) => setSolicitudData({...solicitudData, delito: e.target.value})}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Homicidio">Homicidio</option>
                    <option value="Homicidio - Tentativa">Homicidio - Tentativa</option>
                    <option value="Feminicidio">Feminicidio</option>
                    <option value="Feminicidio - Tentativa">Feminicidio - Tentativa</option>
                    <option value="Lesiones">Lesiones</option>
                    <option value="Secuestro">Secuestro</option>
                    <option value="Trata de Personas">Trata de Personas</option>
                    <option value="Abuso Sexual">Delitos contra la libertad sexual</option>
                    <option value="Desaparición por particular">Desaparición por particular</option>
                  </select>
                </div>

                <div className="field-group">
                  <label className="field-label">
                    <DocumentIcon className="field-icon" />
                    Recomendación
                  </label>
                  <input
                    type="text"
                    className={`field-input ${fieldErrors.recomendacion ? 'error' : ''}`}
                    value={solicitudData.recomendacion}
                    onChange={(e) => {
                      // permitir solo dígitos y '/'
                      const raw = e.target.value;
                      let sanitized = raw.replace(/[^0-9\/]/g, '');

                      // Evitar más de un '/'
                      const parts = sanitized.split('/');
                      if (parts.length > 2) {
                        sanitized = parts.slice(0, 2).join('/');
                      }

                      // Si el usuario escribió más de 2 dígitos antes de la barra, insertar barra automáticamente
                      if (!sanitized.includes('/') && sanitized.length > 2) {
                        sanitized = sanitized.slice(0, 2) + '/' + sanitized.slice(2);
                      }

                      // Limitar longitud a 7 (MM/YYYY)
                      if (sanitized.length > 7) sanitized = sanitized.slice(0, 7);

                      setSolicitudData({ ...solicitudData, recomendacion: sanitized });

                      // Validación final (acepta años 1900-2099)
                      const validRe = /^\d{2}\/(19|20)\d{2}$/;
                      setFieldErrors({ ...fieldErrors, recomendacion: sanitized === '' || validRe.test(sanitized) ? undefined : 'Formato requerido: XX/AAAA (ej. 08/2024)' });
                    }}
                    placeholder="El número de Recomendación. Ej: 08/2024"
                  />
                  {fieldErrors.recomendacion && <span className="field-error">{fieldErrors.recomendacion}</span>}
                </div>

                <div className="field-group">
                  <label className="field-label">
                    <InformationCircleIcon className="field-icon" />
                    Aceptación Recomendación
                  </label>
                  <select
                    className="field-select"
                    value={solicitudData.aceptacion}
                    onChange={(e) => setSolicitudData({...solicitudData, aceptacion: e.target.value})}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Aceptada">Aceptada</option>
                    <option value="Rechazada">No Aceptada</option>
                    <option value="Pendiente">Pendiente</option>
                  </select>
                </div>


                <div className="field-group">
                  <label className="field-label">
                    <InformationCircleIcon className="field-icon" />
                    Tipo de Resolución Tentativa
                  </label>
                  <select
                    className="field-select"
                    value={solicitudData.tipo_resolucion}
                    onChange={(e) => setSolicitudData({...solicitudData, tipo_resolucion: e.target.value})}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Registro">Registro</option>
                    <option value="Negativa">Negativa</option>
                    <option value="Opinión Técnica">Opinión Técnica</option>
                    <option value="Acuerdo Incompetencia">Acuerdo Incompetencia</option>
                  </select>
                </div>

                <div className="field-group">
                  <label className="field-label">
                    <ScaleIcon className="field-icon" />
                    Reconocimiento de Víctima
                  </label>
                  <select
                    className="field-select"
                    value={solicitudData.reconocimiento_victima}
                    onChange={(e) => setSolicitudData({...solicitudData, reconocimiento_victima: e.target.value})}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Completo">Completo</option>
                    <option value="Incompleto">Incompleto</option>
                  </select>
                </div>

                <div className="field-group">
                  <label className="field-label">
                    <DocumentIcon className="field-icon" />
                    Actas
                  </label>
                  <select
                    className="field-select"
                    value={solicitudData.actas}
                    onChange={(e) => setSolicitudData({...solicitudData, actas: e.target.value})}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Completo">Completo</option>
                    <option value="Incompleto">Incompleto</option>
                  </select>
                </div>

                <div className="field-group">
                  <label className="field-label">
                    <DocumentIcon className="field-icon" />
                    FUDS
                  </label>
                  <select
                    className="field-select"
                    value={solicitudData.fuds}
                    onChange={(e) => setSolicitudData({...solicitudData, fuds: e.target.value})}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Completo">Completo</option>
                    <option value="Incompleto">Incompleto</option>
                  </select>
                </div>

                <div className="field-group">
                  <label className="field-label">
                    <IdentificationIcon className="field-icon" />
                    CURP
                  </label>
                  <select
                    className="field-select"
                    value={solicitudData.curp}
                    onChange={(e) => setSolicitudData({...solicitudData, curp: e.target.value})}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Completo">Completo</option>
                    <option value="Incompleto">Incompleto</option>
                  </select>
                </div>

                <div className="field-group">
                  <label className="field-label">
                    <IdentificationIcon className="field-icon" />
                    Identificaciones
                  </label>
                  <select
                    className="field-select"
                    value={solicitudData.identificaciones}
                    onChange={(e) => setSolicitudData({...solicitudData, identificaciones: e.target.value})}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Completo">Completo</option>
                    <option value="Incompleto">Incompleto</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Registro de Víctimas */}
            <div className="section-card">
              <h5 className="section-title">
                <UserGroupIcon className="section-title-icon" />
                Registro de Víctimas
              </h5>

              {/* Tabs para Víctimas */}
              <div className="victimas-tabs">
                <button
                  className={`victima-tab ${activeTab === 'directas' ? 'active' : ''}`}
                  onClick={() => setActiveTab('directas')}
                >
                  <UserGroupIcon className="tab-icon" />
                  Víctimas Directas ({(victimasDirectas || []).length})
                </button>
                <button
                  className={`victima-tab ${activeTab === 'indirectas' ? 'active' : ''}`}
                  onClick={() => setActiveTab('indirectas')}
                >
                  <UserPlusIcon className="tab-icon" />
                  Víctimas Indirectas ({(victimasIndirectas || []).length})
                </button>
              </div>

              {/* Botones para agregar víctimas */}
              <div className="add-victima-buttons">
                <button
                  onClick={() => addVictima('directas')}
                  className="btn btn-primary"
                >
                  <PlusIcon className="btn-icon" />
                  Agregar Víctima Directa
                </button>
                <button
                  onClick={() => addVictima('indirectas')}
                  className="btn btn-secondary"
                >
                  <PlusIcon className="btn-icon" />
                  Agregar Víctima Indirecta
                </button>
              </div>

              {/* Lista de Víctimas */}
              <div className="victimas-content">
                {activeTab === 'directas' && (victimasDirectas || []).length === 0 && (
                  <div className="empty-state">
                    <UserGroupIcon className="empty-icon" />
                    <h3>No hay víctimas directas registradas</h3>
                    <p>Haga clic en "Agregar Víctima Directa" para comenzar</p>
                  </div>
                )}

                {activeTab === 'indirectas' && (victimasIndirectas || []).length === 0 && (
                  <div className="empty-state">
                    <UserPlusIcon className="empty-icon" />
                    <h3>No hay víctimas indirectas registradas</h3>
                    <p>Haga clic en "Agregar Víctima Indirecta" para comenzar</p>
                  </div>
                )}

                {activeTab === 'directas' && (victimasDirectas || []).map((victima, index) => (
                  <div key={`directa-${index}`} className="victima-card">
                    <div className="victima-header">
                      <h4 className="victima-title">Víctima Directa #{index + 1}</h4>
                      <button
                        onClick={() => removeVictima('directas', index)}
                        className="victima-remove-btn"
                      >
                        <TrashIcon className="btn-icon" />
                        Eliminar
                      </button>
                    </div>

                    {/* Sección completa basada en modelo Victima (3 columnas) */}
                    <div className="section-card">
                      <h6 className="section-title">
                        <IdentificationIcon className="section-title-icon" />
                        Datos del Registro (Padrón de Víctimas)
                      </h6>

                      <div className="fields-grid three-columns">
                        {/* Comentado: líneas 1314-1334 - se conservan aquí pero no se ejecutan
                        <div className="field-group">
                          <label className="field-label">ID</label>
                          <input type="text" className="field-input" value={victima.id || ''} onChange={(e) => updateVictima('directas', index, 'id', e.target.value)} />
                        </div>

                        <div className="field-group">
                          <label className="field-label">Año</label>
                          <input type="text" className="field-input" value={victima.anio || ''} onChange={(e) => updateVictima('directas', index, 'anio', e.target.value)} />
                        </div>

                        <div className="field-group">
                          <label className="field-label">Número de Registro</label>
                          <input type="number" className="field-input" value={victima.numero_registro || ''} onChange={(e) => updateVictima('directas', index, 'numero_registro', e.target.value)} />
                        </div>

                        <div className="field-group">
                          <label className="field-label">Registro Alfanumérico</label>
                          <input type="text" className="field-input" value={victima.alfanumerica_registro || ''} onChange={(e) => updateVictima('directas', index, 'alfanumerica_registro', e.target.value)} />
                        </div>
                        */}

                        <div className="field-group">
                          <label className="field-label">Nombre Víctima</label>
                          <input
                            type="text"
                            className="field-input"
                            value={victima.nombre_victima || ''}
                            onChange={(e) => updateVictima('directas', index, 'nombre_victima', formatNameInput(e.target.value))}
                          />
                        </div>

                        {/*<div className="field-group">
                          <label className="field-label">Fecha de Registro (DD/MM/YYYY)</label>
                          <input type="text" className="field-input" value={victima.fecha_registro || ''} onChange={(e) => updateVictima('directas', index, 'fecha_registro', e.target.value)} placeholder="DD/MM/YYYY" />
                        </div>
                        */}

                        <div className="field-group">
                          <label className="field-label">Número Recomendación</label>
                          <input
                            type="text"
                            className="field-input"
                            value={victima.tipo_violacion_dh || ''}
                            onChange={(e) => {
                              let raw = e.target.value || '';
                              // Allow only digits and slash
                              raw = raw.replace(/[^0-9\/]/g, '');
                              // Prevent leading slash
                              raw = raw.replace(/^\//, '');
                              // Keep only first slash
                              const parts = raw.split('/');
                              if (parts.length > 2) raw = parts.slice(0,2).join('/');
                              // Auto-insert slash after two digits if missing
                              if (!raw.includes('/') && raw.length > 2) raw = raw.slice(0,2) + '/' + raw.slice(2);
                              // Limit length to 7 (MM/YYYY)
                              if (raw.length > 7) raw = raw.slice(0,7);
                              // Update victim field with sanitized value (only MM/YYYY visible)
                              updateVictima('directas', index, 'tipo_violacion_dh', raw);
                            }}
                          />
                        </div>

                        <div className="field-group">
                          <label className="field-label">Tipo Delito</label>
                          <select
                            className="field-select"
                            value={victima.tipo_delito || ''}
                            onChange={(e) => updateVictima('directas', index, 'tipo_delito', e.target.value)}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Homicidio">Homicidio</option>
                            <option value="Homicidio - Tentativa">Homicidio - Tentativa</option>
                            <option value="Feminicidio">Feminicidio</option>
                            <option value="Feminicidio - Tentativa">Feminicidio - Tentativa</option>
                            <option value="Lesiones">Lesiones</option>
                            <option value="Secuestro">Secuestro</option>
                            <option value="Trata de Personas">Trata de Personas</option>
                            <option value="Abuso Sexual">Delitos contra la libertad sexual</option>
                            <option value="Desaparición por particular">Desaparición por particular</option>
                          </select>
                        </div>

                        <div className="field-group">
                          <label className="field-label">Tipo Víctima</label>
                          <input
                            type="text"
                            className="field-input"
                            value={victima.tipo_victima || 'Directa'}
                            readOnly
                            disabled
                          />
                        </div>

                        <div className="field-group">
                          <label className="field-label">Expediente Judicial</label>
                          <input
                            type="text"
                            className="field-input"
                            value={victima.expediente_judicial || ''}
                            onChange={(e) => updateVictima('directas', index, 'expediente_judicial', sanitizeAlfanumerica(e.target.value))}
                          />
                        </div>

                        <div className="field-group">
                          <label className="field-label">Reconocimiento Calidad Víctima</label>
                          <select
                            className="field-select"
                            value={victima.reconocimiento_calidad_victima || ''}
                            onChange={(e) => updateVictima('directas', index, 'reconocimiento_calidad_victima', e.target.value)}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Delito － MP">Delito － MP</option>
                            <option value="Delito － Judicial">Delito － Judicial</option>
                            <option value="Violación DH">Violación DH</option>
                          </select>
                        </div>

                        <div className="field-group">
                          <label className="field-label">Post Mortem</label>
                          <select
                            className="field-select"
                            value={victima.post_mortem || ''}
                            onChange={(e) => updateVictima('directas', index, 'post_mortem', e.target.value)}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Sí">Sí</option>
                            <option value="No">No</option>
                          </select>
                        </div>

                        <div className="field-group">
                          <label className="field-label">Alcaldía Hecho Victimizante</label>
                          <select
                            className="field-select"
                            value={victima.alcaldia_hecho_victimizante || ''}
                            onChange={(e) => updateVictima('directas', index, 'alcaldia_hecho_victimizante', e.target.value)}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Álvaro Obregón">Álvaro Obregón</option>
                            <option value="Azcapotzalco">Azcapotzalco</option>
                            <option value="Benito Juárez">Benito Juárez</option>
                            <option value="Coyoacán">Coyoacán</option>
                            <option value="Cuajimalpa de Morelos">Cuajimalpa de Morelos</option>
                            <option value="Cuauhtémoc">Cuauhtémoc</option>
                            <option value="Gustavo A. Madero">Gustavo A. Madero</option>
                            <option value="Iztacalco">Iztacalco</option>
                            <option value="Iztapalapa">Iztapalapa</option>
                            <option value="La Magdalena Contreras">La Magdalena Contreras</option>
                            <option value="Miguel Hidalgo">Miguel Hidalgo</option>
                            <option value="Milpa Alta">Milpa Alta</option>
                            <option value="Tláhuac">Tláhuac</option>
                            <option value="Tlalpan">Tlalpan</option>
                            <option value="Venustiano Carranza">Venustiano Carranza</option>
                            <option value="Xochimilco">Xochimilco</option>
                          </select>
                        </div>

                        <div className="field-group">
                          <label className="field-label">¿Es Niño, Niña o Adolescente?</label>
                          <select
                            className="field-select"
                            value={victima.nna || ''}
                            onChange={(e) => updateVictima('directas', index, 'nna', e.target.value)}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Sí">Sí</option>
                            <option value="No">No</option>
                          </select>
                        </div>

                        <div className="field-group">
                          <label className="field-label">Sexo</label>
                          <select
                            className="field-select"
                            value={victima.sexo || ''}
                            onChange={(e) => updateVictima('directas', index, 'sexo', e.target.value)}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Hombre">Hombre</option>
                            <option value="Mujer">Mujer</option>
                            <option value="Non Binarie">Non Binarie</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>

                        <div className="field-group">
                          <label className="field-label">Teléfono</label>
                          <input type="text" className="field-input" value={victima.telefono || ''} onChange={(e) => updateVictima('directas', index, 'telefono', sanitizeTelefono(e.target.value))} />
                        </div>

                        <div className="field-group">
                          <label className="field-label">Correo Electrónico</label>
                          <input
                            type="email"
                            className="field-input"
                            value={victima.correo_electronico || ''}
                            onChange={(e) => updateVictima('directas', index, 'correo_electronico', e.target.value.replace(/\s+/g, '').toLowerCase())}
                            onBlur={(e) => { 
                              const val = e.target.value.replace(/\s+/g, ''); 
                              const ok = val === '' || isValidEmail(val); 
                              setEmailErrors(prev => ({...prev, [`directas-${index}`]: ok ? '' : 'Correo inválido'})); 
                            }}
                          />
                          {emailErrors[`directas-${index}`] && <span className="field-error">{emailErrors[`directas-${index}`]}</span>}
                        </div>

                        <div className="field-group">
                          <label className="field-label">GAP</label>
                          <select
                            className="field-select"
                            value={victima.gap || 'NA'}
                            onChange={(e) => updateVictima('directas', index, 'gap', e.target.value)}
                          >
                            <option value="NA">NA</option>
                            <option value="NNA">NNA</option>
                            <option value="Persona Adulta Mayor">Persona Adulta Mayor</option>
                            <option value="Discapacidad">Discapacidad</option>
                            <option value="Migrante">Migrante</option>
                            <option value="No Español">No Español</option>
                            <option value="Indígena">Indígena</option>
                            <option value="Refugiado">Refugiado</option>
                            <option value="Asiliado Político">Asiliado Político</option>
                            <option value="Defensor DH">Defensor DH</option>
                            <option value="Periodista">Periodista</option>
                            <option value="Desplazado">Desplazado</option>
                          </select>
                        </div>

                        <div className="field-group">
                          <label className="field-label">CURP</label>
                          <input type="text" className="field-input" value={victima.curp || ''} onChange={(e) => updateVictima('directas', index, 'curp', sanitizeCurp(e.target.value))} onBlur={(e) => { const val = e.target.value.trim(); const ok = val === '' || isValidCurp(val); setCurpErrors(prev => ({...prev, [`directas-${index}`]: ok ? '' : 'CURP inválida (18 caracteres, mayúsculas y dígitos)'})); }} />
                          {curpErrors[`directas-${index}`] && <span className="field-error">{curpErrors[`directas-${index}`]}</span>}
                        </div>

                        <div className="field-group">
                          <label className="field-label">Tiempo/Modo/Lugar</label>
                          <input type="text" className="field-input" value={victima.tiempo_modo_lugar || ''} onChange={(e) => updateVictima('directas', index, 'tiempo_modo_lugar', sanitizeTextoLibre(e.target.value))} />
                        </div>

                        {/*<div className="field-group">
                          <label className="field-label">Parentesco</label>
                          <input type="text" className="field-input" value={victima.parentesco || ''} onChange={(e) => updateVictima('directas', index, 'parentesco', e.target.value)} />
                        </div>
                        */}

                        <div className="field-group">
                          <label className="field-label">Carpeta Investigación</label>
                          <input
                            type="text"
                            className="field-input"
                            value={victima.carpeta_investigacion || ''}
                            onChange={(e) => updateVictima('directas', index, 'carpeta_investigacion', sanitizeAlfanumerica(e.target.value))}
                          />
                        </div>

                        <div className="field-group">
                          <label className="field-label">Nombre Recomendación</label>
                          <input
                            type="text"
                            className="field-input"
                            value={victima.nombre_recomendacion || ''}
                            onChange={(e) => updateVictima('directas', index, 'nombre_recomendacion', sanitizeNombreRecomendacion(e.target.value))}
                          />
                        </div>

                        <div className="field-group">
                          <label className="field-label">Clave Víctima Recomendación</label>
                          <input
                            type="text"
                            className="field-input"
                            value={victima.clave_victima_recomendacion || ''}
                            onChange={(e) => updateVictima('directas', index, 'clave_victima_recomendacion', sanitizeClaveVictima(e.target.value))}
                          />
                        </div>

                        <div className="field-group">
                          <label className="field-label">Derechos Humanos Violados</label>
                          <div className="checkbox-group">
                            {[
                              'A la vida',
                              'A la integridad personal',
                              'A la libertad personal',
                              'Al debido proceso',
                              'A la verdad',
                              'A la seguridad jurídica',
                              'A la salud',
                              'A la integridad moral',
                              'A la protección de la familia',
                              'A la no discriminación',
                              'Otro'
                            ].map(option => (
                              <label key={option} className="checkbox-item">
                                <input
                                  type="checkbox"
                                  checked={(victima.derechos_humanos_violados || []).includes(option)}
                                  onChange={(e) => {
                                    const current = Array.isArray(victima.derechos_humanos_violados) ? [...victima.derechos_humanos_violados] : [];
                                    if (e.target.checked) {
                                      if (!current.includes(option)) current.push(option);
                                    } else {
                                      const idx = current.indexOf(option);
                                      if (idx > -1) current.splice(idx, 1);
                                    }
                                    updateVictima('directas', index, 'derechos_humanos_violados', current);
                                  }}
                                />
                                {option}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                ))}

                {activeTab === 'indirectas' && (victimasIndirectas || []).map((victima, index) => (
                  <div key={`indirecta-${index}`} className="victima-card">
                    <div className="victima-header">
                      <h4 className="victima-title">Víctima Indirecta #{index + 1}</h4>
                      <button
                        onClick={() => removeVictima('indirectas', index)}
                        className="victima-remove-btn"
                      >
                        <TrashIcon className="btn-icon" />
                        Eliminar
                      </button>
                    </div>

                    {/* Sección completa basada en modelo Victima (3 columnas) */}
                    <div className="section-card">
                      <h6 className="section-title">
                        <IdentificationIcon className="section-title-icon" />
                        Datos del Registro (Padrón de Víctimas)
                      </h6>

                      <div className="fields-grid three-columns">
                        {/*<div className="field-group">
                          <label className="field-label">ID</label>
                          <input type="text" className="field-input" value={victima.id || ''} onChange={(e) => updateVictima('indirectas', index, 'id', e.target.value)} />
                        </div>

                        <div className="field-group">
                          <label className="field-label">Año</label>
                          <input type="text" className="field-input" value={victima.anio || ''} onChange={(e) => updateVictima('indirectas', index, 'anio', e.target.value)} />
                        </div>

                        <div className="field-group">
                          <label className="field-label">Número de Registro</label>
                          <input type="number" className="field-input" value={victima.numero_registro || ''} onChange={(e) => updateVictima('indirectas', index, 'numero_registro', e.target.value)} />
                        </div>

                        <div className="field-group">
                          <label className="field-label">Registro Alfanumérico</label>
                          <input type="text" className="field-input" value={victima.alfanumerica_registro || ''} onChange={(e) => updateVictima('indirectas', index, 'alfanumerica_registro', e.target.value)} />
                        </div>
                        */}

                        <div className="field-group">
                          <label className="field-label">Nombre Víctima</label>
                          <input
                            type="text"
                            className="field-input"
                            value={victima.nombre_victima || ''}
                            onChange={(e) => updateVictima('indirectas', index, 'nombre_victima', formatNameInput(e.target.value))}
                          />
                        </div>

                        {/*<div className="field-group">
                          <label className="field-label">Fecha de Registro (DD/MM/YYYY)</label>
                          <input type="text" className="field-input" value={victima.fecha_registro || ''} onChange={(e) => updateVictima('indirectas', index, 'fecha_registro', e.target.value)} placeholder="DD/MM/YYYY" />
                        </div>
                        */}

                        <div className="field-group">
                          <label className="field-label">Número Recomendación</label>
                          <input
                            type="text"
                            className="field-input"
                            value={victima.tipo_violacion_dh || ''}
                            onChange={(e) => {
                              let raw = e.target.value || '';
                              raw = raw.replace(/[^0-9\/]/g, '');
                              raw = raw.replace(/^\//, '');
                              const parts = raw.split('/');
                              if (parts.length > 2) raw = parts.slice(0,2).join('/');
                              if (!raw.includes('/') && raw.length > 2) raw = raw.slice(0,2) + '/' + raw.slice(2);
                              if (raw.length > 7) raw = raw.slice(0,7);
                              updateVictima('indirectas', index, 'tipo_violacion_dh', raw);
                            }}
                          />
                        </div>

                        <div className="field-group">
                          <label className="field-label">Tipo Delito</label>
                          <select
                            className="field-select"
                            value={victima.tipo_delito || ''}
                            onChange={(e) => updateVictima('indirectas', index, 'tipo_delito', e.target.value)}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Homicidio">Homicidio</option>
                            <option value="Homicidio - Tentativa">Homicidio - Tentativa</option>
                            <option value="Feminicidio">Feminicidio</option>
                            <option value="Feminicidio - Tentativa">Feminicidio - Tentativa</option>
                            <option value="Lesiones">Lesiones</option>
                            <option value="Secuestro">Secuestro</option>
                            <option value="Trata de Personas">Trata de Personas</option>
                            <option value="Abuso Sexual">Delitos contra la libertad sexual</option>
                            <option value="Desaparición por particular">Desaparición por particular</option>
                          </select>
                        </div>

                        <div className="field-group">
                          <label className="field-label">Tipo Víctima</label>
                          <input
                            type="text"
                            className="field-input"
                            value={victima.tipo_victima || 'Indirecta'}
                            readOnly
                            disabled
                          />
                        </div>

                        <div className="field-group">
                          <label className="field-label">Expediente Judicial</label>
                          <input
                            type="text"
                            className="field-input"
                            value={victima.expediente_judicial || ''}
                            onChange={(e) => updateVictima('indirectas', index, 'expediente_judicial', sanitizeAlfanumerica(e.target.value))}
                          />
                        </div>

                        <div className="field-group">
                          <label className="field-label">Reconocimiento Calidad Víctima</label>
                          <select
                            className="field-select"
                            value={victima.reconocimiento_calidad_victima || ''}
                            onChange={(e) => updateVictima('indirectas', index, 'reconocimiento_calidad_victima', e.target.value)}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Delito － MP">Delito － MP</option>
                            <option value="Delito － Judicial">Delito － Judicial</option>
                            <option value="Violación DH">Violación DH</option>
                          </select>
                        </div>

                        <div className="field-group">
                          <label className="field-label">Post Mortem</label>
                          <select
                            className="field-select"
                            value={victima.post_mortem || ''}
                            onChange={(e) => updateVictima('indirectas', index, 'post_mortem', e.target.value)}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Sí">Sí</option>
                            <option value="No">No</option>
                          </select>
                        </div>

                        <div className="field-group">
                          <label className="field-label">Alcaldía Hecho Victimizante</label>
                          <select
                            className="field-select"
                            value={victima.alcaldia_hecho_victimizante || ''}
                            onChange={(e) => updateVictima('indirectas', index, 'alcaldia_hecho_victimizante', e.target.value)}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Álvaro Obregón">Álvaro Obregón</option>
                            <option value="Azcapotzalco">Azcapotzalco</option>
                            <option value="Benito Juárez">Benito Juárez</option>
                            <option value="Coyoacán">Coyoacán</option>
                            <option value="Cuajimalpa de Morelos">Cuajimalpa de Morelos</option>
                            <option value="Cuauhtémoc">Cuauhtémoc</option>
                            <option value="Gustavo A. Madero">Gustavo A. Madero</option>
                            <option value="Iztacalco">Iztacalco</option>
                            <option value="Iztapalapa">Iztapalapa</option>
                            <option value="La Magdalena Contreras">La Magdalena Contreras</option>
                            <option value="Miguel Hidalgo">Miguel Hidalgo</option>
                            <option value="Milpa Alta">Milpa Alta</option>
                            <option value="Tláhuac">Tláhuac</option>
                            <option value="Tlalpan">Tlalpan</option>
                            <option value="Venustiano Carranza">Venustiano Carranza</option>
                            <option value="Xochimilco">Xochimilco</option>
                          </select>
                        </div>

                        <div className="field-group">
                          <label className="field-label">NNA</label>
                          <select
                            className="field-select"
                            value={victima.nna || ''}
                            onChange={(e) => updateVictima('indirectas', index, 'nna', e.target.value)}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Sí">Sí</option>
                            <option value="No">No</option>
                          </select>
                        </div>

                        <div className="field-group">
                          <label className="field-label">Sexo</label>
                          <select
                            className="field-select"
                            value={victima.sexo || ''}
                            onChange={(e) => updateVictima('indirectas', index, 'sexo', e.target.value)}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Hombre">Hombre</option>
                            <option value="Mujer">Mujer</option>
                            <option value="Non Binarie">Non Binarie</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>

                        <div className="field-group">
                          <label className="field-label">Teléfono</label>
                          <input type="text" className="field-input" value={victima.telefono || ''} onChange={(e) => updateVictima('indirectas', index, 'telefono', sanitizeTelefono(e.target.value))} />
                        </div>

                        <div className="field-group">
                          <label className="field-label">Correo Electrónico</label>
                          <input
                            type="email"
                            className="field-input"
                            value={victima.correo_electronico || ''}
                            onChange={(e) => updateVictima('indirectas', index, 'correo_electronico', e.target.value.replace(/\s+/g, '').toLowerCase())}
                            onBlur={(e) => { 
                              const val = e.target.value.replace(/\s+/g, ''); 
                              const ok = val === '' || isValidEmail(val); 
                              setEmailErrors(prev => ({...prev, [`indirectas-${index}`]: ok ? '' : 'Correo inválido'})); 
                            }}
                          />
                          {emailErrors[`indirectas-${index}`] && <span className="field-error">{emailErrors[`indirectas-${index}`]}</span>}
                        </div>

                        <div className="field-group">
                          <label className="field-label">GAP</label>
                          <select
                            className="field-select"
                            value={victima.gap || 'NA'}
                            onChange={(e) => updateVictima('indirectas', index, 'gap', e.target.value)}
                          >
                            <option value="NA">NA</option>
                            <option value="NNA">NNA</option>
                            <option value="Persona Adulta Mayor">Persona Adulta Mayor</option>
                            <option value="Discapacidad">Discapacidad</option>
                            <option value="Migrante">Migrante</option>
                            <option value="No Español">No Español</option>
                            <option value="Indígena">Indígena</option>
                            <option value="Refugiado">Refugiado</option>
                            <option value="Asiliado Político">Asiliado Político</option>
                            <option value="Defensor DH">Defensor DH</option>
                            <option value="Periodista">Periodista</option>
                            <option value="Desplazado">Desplazado</option>
                          </select>
                        </div>

                        <div className="field-group">
                          <label className="field-label">CURP</label>
                          <input type="text" className="field-input" value={victima.curp || ''} onChange={(e) => updateVictima('indirectas', index, 'curp', sanitizeCurp(e.target.value))} onBlur={(e) => { const val = e.target.value.trim(); const ok = val === '' || isValidCurp(val); setCurpErrors(prev => ({...prev, [`indirectas-${index}`]: ok ? '' : 'CURP inválida (18 caracteres, mayúsculas y dígitos)'})); }} />
                          {curpErrors[`indirectas-${index}`] && <span className="field-error">{curpErrors[`indirectas-${index}`]}</span>}
                        </div>

                        <div className="field-group">
                          <label className="field-label">Tiempo/Modo/Lugar</label>
                          <input type="text" className="field-input" value={victima.tiempo_modo_lugar || ''} onChange={(e) => updateVictima('indirectas', index, 'tiempo_modo_lugar', sanitizeTextoLibre(e.target.value))} />
                        </div>

                        <div className="field-group">
                          <label className="field-label">Parentesco con VD</label>
                          <select
                            className="field-select"
                            value={victima.parentesco || ''}
                            onChange={(e) => updateVictima('indirectas', index, 'parentesco', e.target.value)}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Madre">Madre</option>
                            <option value="Padre">Padre</option>
                            <option value="Hijo">Hijo</option>
                            <option value="Hija">Hija</option>
                            <option value="Hermano">Hermano</option>
                            <option value="Hermana">Hermana</option>
                            <option value="Cónyuge">Cónyuge</option>
                            <option value="Pareja">Pareja</option>
                            <option value="Abuelo">Abuelo</option>
                            <option value="Abuela">Abuela</option>
                            <option value="Tío">Tío</option>
                            <option value="Tía">Tía</option>
                            <option value="Primo">Primo</option>
                            <option value="Prima">Prima</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>

                        <div className="field-group">
                          <label className="field-label">Carpeta Investigación</label>
                          <input
                            type="text"
                            className="field-input"
                            value={victima.carpeta_investigacion || ''}
                            onChange={(e) => updateVictima('indirectas', index, 'carpeta_investigacion', sanitizeAlfanumerica(e.target.value))}
                          />
                        </div>

                        <div className="field-group">
                          <label className="field-label">Nombre Recomendación</label>
                          <input
                            type="text"
                            className="field-input"
                            value={victima.nombre_recomendacion || ''}
                            onChange={(e) => updateVictima('indirectas', index, 'nombre_recomendacion', sanitizeNombreRecomendacion(e.target.value))}
                          />
                        </div>

                        <div className="field-group">
                          <label className="field-label">Clave Víctima Recomendación</label>
                          <input
                            type="text"
                            className="field-input"
                            value={victima.clave_victima_recomendacion || ''}
                            onChange={(e) => updateVictima('indirectas', index, 'clave_victima_recomendacion', sanitizeClaveVictima(e.target.value))}
                          />
                        </div>

                        <div className="field-group">
                          <label className="field-label">Derechos Humanos Violados</label>
                          <div className="checkbox-group">
                            {[
                              'A la vida',
                              'A la integridad personal',
                              'A la libertad personal',
                              'Al debido proceso',
                              'A la verdad',
                              'A la seguridad jurídica',
                              'A la salud',
                              'A la integridad moral',
                              'A la protección de la familia',
                              'A la no discriminación',
                              'Otro'
                            ].map(option => (
                              <label key={option} className="checkbox-item">
                                <input
                                  type="checkbox"
                                  checked={(victima.derechos_humanos_violados || []).includes(option)}
                                  onChange={(e) => {
                                    const current = Array.isArray(victima.derechos_humanos_violados) ? [...victima.derechos_humanos_violados] : [];
                                    if (e.target.checked) {
                                      if (!current.includes(option)) current.push(option);
                                    } else {
                                      const idx = current.indexOf(option);
                                      if (idx > -1) current.splice(idx, 1);
                                    }
                                    updateVictima('indirectas', index, 'derechos_humanos_violados', current);
                                  }}
                                />
                                {option}
                              </label>
                            ))}
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Controles del formulario */}
        <div className="form-controls">
          <div className="form-controls-left">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="btn btn-outline"
                disabled={loading}
              >
                <ChevronLeftIcon className="btn-icon" />
                Paso Anterior
              </button>
            )}
          </div>

          <div className="form-controls-right">
            {currentStep < 3 && !(currentStep === 2 && selectedAction === 'solo_oficio') && (
              <button
                onClick={nextStep}
                className="btn btn-primary"
                disabled={loading || isTransitioning}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner" />
                    Procesando...
                  </>
                ) : (
                  <>
                    Siguiente Paso
                    <ChevronRightIcon className="btn-icon" />
                  </>
                )}
              </button>
            )}

            {currentStep === 3 && (
              <button
                onClick={submitSolicitudCompleta}
                className="btn btn-success"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="btn-icon" />
                    Finalizar Registro
                  </>
                )}
              </button>
            )}

            {currentStep === 2 && selectedAction === 'solo_oficio' && (
              <button
                onClick={submitOficio}
                className="btn btn-success"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="btn-icon" />
                    Registrar Oficio
                  </>
                )}
              </button>
            )}

            {currentStep === 2 && selectedAction === 'agregar_expediente' && selectedExpediente && (
              <button
                onClick={submitOficio}
                className="btn btn-success"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="btn-icon" />
                    Agregar a Expediente
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NuevoRegistroModerno;
