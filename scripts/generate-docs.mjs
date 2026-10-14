import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  HeadingLevel, 
  AlignmentType, 
  WidthType, 
  BorderStyle, 
  ShadingType, 
  Header, 
  Footer, 
  PageNumber, 
  PageBreak 
} from 'docx';
import fs from 'fs';
import path from 'path';

// ==========================================
// PALETA DE COLORES INSTITUCIONAL ECONODOOR
// ==========================================
const COLOR = {
  PRIMARY: '0284C7',     // Sky 600
  PRIMARY_DARK: '0369A1',// Sky 700
  NAVY: '0F172A',         // Slate 900
  DARK_BLUE: '1E293B',    // Slate 800
  BODY: '334155',         // Slate 700
  MUTED: '64748B',        // Slate 500
  LIGHT_BG: 'F8FAFC',     // Slate 50
  BORDER: 'E2E8F0',       // Slate 200
  BORDER_DARK: 'CBD5E1',  // Slate 300
  AMBER: 'D97706',        // Amber 600
  AMBER_BG: 'FFFBEB',     // Amber 50
  EMERALD: '16A34A',      // Emerald 600
  EMERALD_BG: 'F0FDF4',   // Emerald 50
  SKY_BG: 'F0F9FF',       // Sky 50
  WHITE: 'FFFFFF',
};

// ==========================================
// HELPERS TIPOGRÁFICOS Y DE FORMATO
// ==========================================
function p(text, opts = {}) {
  const runs = Array.isArray(text) ? text : [new TextRun({ text, ...opts })];
  return new Paragraph({
    spacing: { before: opts.before ?? 60, after: opts.after ?? 100, line: 276 },
    alignment: opts.alignment ?? AlignmentType.LEFT,
    children: runs,
  });
}

function pRich(runs, opts = {}) {
  return new Paragraph({
    spacing: { before: opts.before ?? 60, after: opts.after ?? 100, line: 276 },
    alignment: opts.alignment ?? AlignmentType.LEFT,
    children: runs,
  });
}

function h1(title, pageBreakBefore = false) {
  return new Paragraph({
    text: title,
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore,
    spacing: { before: 360, after: 160 },
  });
}

function h2(title) {
  return new Paragraph({
    text: title,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 120 },
  });
}

function h3(title) {
  return new Paragraph({
    text: title,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 80 },
  });
}

function bullet(boldPrefix, normalText) {
  return new Paragraph({
    spacing: { before: 40, after: 60, line: 276 },
    indent: { left: 400 },
    children: [
      new TextRun({ text: '▪  ', bold: true, color: COLOR.PRIMARY, size: 20 }),
      new TextRun({ text: boldPrefix ? `${boldPrefix}: ` : '', bold: true, color: COLOR.NAVY, size: 21 }),
      new TextRun({ text: normalText, color: COLOR.BODY, size: 21 }),
    ],
  });
}

function callout(title, text, type = 'info') {
  let borderColor = COLOR.PRIMARY;
  let bgColor = COLOR.SKY_BG;
  let titleColor = COLOR.PRIMARY_DARK;

  if (type === 'warning') {
    borderColor = COLOR.AMBER;
    bgColor = COLOR.AMBER_BG;
    titleColor = COLOR.AMBER;
  } else if (type === 'success') {
    borderColor = COLOR.EMERALD;
    bgColor = COLOR.EMERALD_BG;
    titleColor = COLOR.EMERALD;
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      left: { style: BorderStyle.SINGLE, size: 24, color: borderColor },
      right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { fill: bgColor, type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 180, right: 180 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 40 },
                children: [
                  new TextRun({ text: `▸ ${title}`, bold: true, color: titleColor, size: 20 }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 0, line: 260 },
                children: [
                  new TextRun({ text, color: COLOR.BODY, size: 19 }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function buildTable(headers, rows, colWidths) {
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map((h, i) => new TableCell({
      width: { size: colWidths[i], type: WidthType.PERCENTAGE },
      shading: { fill: COLOR.NAVY, type: ShadingType.CLEAR },
      margins: { top: 120, bottom: 120, left: 140, right: 140 },
      children: [
        new Paragraph({
          spacing: { before: 0, after: 0 },
          alignment: AlignmentType.LEFT,
          children: [new TextRun({ text: h, bold: true, color: COLOR.WHITE, size: 19 })],
        }),
      ],
    })),
  });

  const dataRows = rows.map((r, rowIdx) => {
    const isAlt = rowIdx % 2 === 1;
    return new TableRow({
      cantSplit: true,
      children: r.map((cellText, colIdx) => new TableCell({
        width: { size: colWidths[colIdx], type: WidthType.PERCENTAGE },
        shading: { fill: isAlt ? COLOR.LIGHT_BG : COLOR.WHITE, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 140, right: 140 },
        children: [
          new Paragraph({
            spacing: { before: 0, after: 0, line: 250 },
            alignment: AlignmentType.LEFT,
            children: [new TextRun({ text: cellText, color: COLOR.BODY, size: 18 })],
          }),
        ],
      })),
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: COLOR.BORDER_DARK },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR.BORDER_DARK },
      left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: COLOR.BORDER },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    },
    rows: [headerRow, ...dataRows],
  });
}

// ==========================================
// GENERACIÓN COMPLETA DEL DOCUMENTO
// ==========================================
async function generateDocumentation() {
  console.log("Iniciando generación de documentación formal Word...");

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22, // 11pt
            color: COLOR.BODY,
          },
          paragraph: {
            spacing: { line: 276, before: 60, after: 100 },
          },
        },
        heading1: {
          run: {
            font: 'Calibri Light',
            size: 34, // 17pt
            bold: true,
            color: COLOR.NAVY,
          },
          paragraph: {
            spacing: { before: 360, after: 140 },
          },
        },
        heading2: {
          run: {
            font: 'Calibri',
            size: 27, // 13.5pt
            bold: true,
            color: COLOR.PRIMARY_DARK,
          },
          paragraph: {
            spacing: { before: 240, after: 100 },
          },
        },
        heading3: {
          run: {
            font: 'Calibri',
            size: 23, // 11.5pt
            bold: true,
            color: COLOR.DARK_BLUE,
          },
          paragraph: {
            spacing: { before: 160, after: 60 },
          },
        },
      },
    },
    sections: [
      // ====================================================
      // SECCIÓN 1: PORTADA INSTITUCIONAL
      // ====================================================
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        children: [
          p('', { before: 300 }),
          pRich([
            new TextRun({ text: 'UNIVERSIDAD DE SONORA', bold: true, size: 28, color: COLOR.NAVY }),
          ], { alignment: AlignmentType.CENTER, after: 40 }),
          pRich([
            new TextRun({ text: 'CAMPUS HERMOSILLO • DIVISIÓN DE CIENCIAS EXACTAS Y NATURALES', size: 19, color: COLOR.MUTED }),
          ], { alignment: AlignmentType.CENTER, after: 40 }),
          pRich([
            new TextRun({ text: 'DEPARTAMENTO DE MATEMÁTICAS • LICENCIATURA EN CIENCIAS DE LA COMPUTACIÓN', size: 19, color: COLOR.MUTED }),
          ], { alignment: AlignmentType.CENTER, after: 600 }),

          // Recuadro decorativo de portada
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 18, color: COLOR.PRIMARY },
              bottom: { style: BorderStyle.SINGLE, size: 18, color: COLOR.PRIMARY },
              left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    shading: { fill: COLOR.LIGHT_BG, type: ShadingType.CLEAR },
                    margins: { top: 280, bottom: 280, left: 240, right: 240 },
                    children: [
                      pRich([
                        new TextRun({ text: 'SISTEMA WEB ECONODOOR', bold: true, size: 48, color: COLOR.NAVY }),
                      ], { alignment: AlignmentType.CENTER, after: 80 }),
                      pRich([
                        new TextRun({ text: 'Documentación Técnica de Ingeniería de Software y Manual de Usuario', size: 24, color: COLOR.PRIMARY_DARK, bold: true }),
                      ], { alignment: AlignmentType.CENTER, after: 80 }),
                      pRich([
                        new TextRun({ text: 'Plataforma Integral de Gestión Operativa, Agendamiento Anti-Colisión y Trazabilidad de Servicios para Portones Eléctricos Automáticos en Hermosillo, Sonora', size: 20, color: COLOR.BODY, italic: true }),
                      ], { alignment: AlignmentType.CENTER, after: 0 }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          p('', { before: 800 }),

          // Ficha técnica en portada
          buildTable(
            ['Dato del Proyecto', 'Información Registrada'],
            [
              ['Autor del Proyecto:', 'Uziel Márquez (uziel.marquez@unison.mx)'],
              ['Institución Académica:', 'Universidad de Sonora (UNISON) — Campus Hermosillo'],
              ['Asignatura / Marco:', 'Ingeniería de Software / Proyecto de Titulación y Práctica Profesional'],
              ['Empresa Caso de Estudio:', 'Econodoor Hermosillo (Instalaciones y Mantenimiento de Portones)'],
              ['Versión del Sistema:', 'Versión 1.0 (Build de Producción Estable)'],
              ['Fecha de Liberación:', 'Octubre de 2026'],
              ['Especificación Base:', 'Conforme a SRS v1.0 (Especificación de Requisitos de Software)'],
              ['Stack Tecnológico:', 'React 18, TypeScript, Tailwind CSS, Zustand, Vite, jsPDF, SheetJS'],
            ],
            [35, 65]
          ),

          p('', { before: 500 }),
          pRich([
            new TextRun({ text: 'Hermosillo, Sonora, México • Ciclo Académico 2026', size: 19, color: COLOR.MUTED }),
          ], { alignment: AlignmentType.CENTER }),

          new Paragraph({ children: [new PageBreak()] }),
        ],
      },

      // ====================================================
      // SECCIÓN 2: CUERPO PRINCIPAL DEL DOCUMENTO
      // ====================================================
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'Sistema Web Econodoor | Documentación Técnica y Manual v1.0', size: 17, color: COLOR.MUTED, italic: true }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'Universidad de Sonora • Uziel Márquez  |  Página ', size: 17, color: COLOR.MUTED }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 17, color: COLOR.NAVY, bold: true }),
                  new TextRun({ text: ' de ', size: 17, color: COLOR.MUTED }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 17, color: COLOR.NAVY, bold: true }),
                ],
              }),
            ],
          }),
        },
        children: [
          // ==========================================
          // TABLA DE CONTENIDOS
          // ==========================================
          h1('Tabla de Contenidos General'),
          p('La presente estructura compendia la totalidad de temas técnicos, directrices operativas y manuales detallados de uso del sistema:'),

          buildTable(
            ['Sección', 'Título del Apartado', 'Contenido y Temas Clave'],
            [
              ['1', 'Introducción', 'Propósito del software, alcance, entorno bioclimático de Hermosillo, acrónimos y marco de trabajo.'],
              ['2', 'Descripción General del Sistema', 'Perspectiva del producto, objetivos, matriz de perfiles y restricciones del entorno operativo.'],
              ['3', 'Arquitectura Técnica del Sistema', 'Pila tecnológica, organización modular del código, flujo de estado con Zustand y librerías UI.'],
              ['4', 'Manual de Usuario por Rol Operativo', 'Guía paso a paso ilustrada para Personal Administrativo (P1-P7), Técnico (T1-T2) y Admin (A1-A5).'],
              ['5', 'Reglas de Negocio Implementadas', 'Máquinas de estado, algoritmo de colisión horaria, detección de duplicados y auditoría inmutable.'],
              ['6', 'Matriz de Casos de Uso (CU1 a CU15)', 'Mapeo detallado de los 15 Casos de Uso contra los requisitos SRS con actores y flujos.'],
              ['7', 'Librerías de UI y Componentes Visuales', 'Catálogo exhaustivo de componentes de VengeanceUI, Animate-UI, Uiverse y ForgeGUI.'],
              ['8', 'Historial de Cambios y Aprobaciones', 'Registro de revisiones, control de versiones del prototipo y validación universitaria.'],
            ],
            [12, 38, 50]
          ),

          p('', { after: 200 }),

          // ==========================================
          // 1. INTRODUCCIÓN
          // ==========================================
          h1('1. Introducción'),
          
          h2('1.1 Propósito del Documento'),
          p('El propósito central de este documento es proporcionar una guía técnica exhaustiva, formal y comprensible, así como un manual de usuario detallado paso a paso para el "Sistema Web Econodoor". Esta documentación ha sido elaborada para sustentar la defensa de proyecto de software en la Universidad de Sonora, Campus Hermosillo, bajo los estándares internacionales de ingeniería de software IEEE 830 e ISO/IEC/IEEE 29148.'),
          p('El documento sirve como referencia tanto para desarrolladores que continúen el mantenimiento evolutivo del sistema, como para el personal operativo (recepcionistas, administradores y técnicos de campo) que empleen la solución en el día a día para gestionar servicios automotrices y residenciales.'),

          h2('1.2 Alcance del Sistema'),
          p('El Sistema Web Econodoor abarca la digitalización integral del ciclo de vida de los servicios de cerrajería automatizada y portones eléctricos en la ciudad de Hermosillo, Sonora. El alcance funcional contempla:'),
          bullet('Gestión Centralizada de Clientes', 'Padrón de personas físicas y empresas con validación de personas de contacto y múltiples direcciones de servicio registradas.'),
          bullet('Expediente Digital de Portones', 'Inventario técnico de motores (Merik, LiftMaster, DEA, Chamberlain, Stanley) asociados a direcciones físicas específicas con bitácora histórica de reparaciones.'),
          bullet('Órdenes de Trabajo y Servicios', 'Clasificación tripartita en Instalaciones Nuevas, Mantenimientos Preventivos y Reparaciones Correctivas, con precarga inteligente de tarifas.'),
          bullet('Agendamiento Inteligente Anti-Colisión', 'Calendario operativo que impide empalmes de citas y valida disponibilidad semanal del técnico antes de confirmar una visita.'),
          bullet('Monitoreo Operativo Kanban', 'Tablero en tiempo real con filtrado multicriterio y alertas predictivas de citas del día y retrasos.'),
          bullet('Cobranza y Control de Caja', 'Registro de anticipos, cálculo dinámico de saldos pendientes y políticas de anulación motivada para auditoría financiera.'),
          bullet('Módulo de Campo para Técnicos (HUD)', 'Consola móvil protegida, sin acceso a importes financieros, con checklist preventivo de 6 puntos críticos y cierre obligatorio de trabajo.'),
          bullet('Supervisión y Analítica Gerencial', 'Tableros de control con KPIs de ingresos, catálogo paramétrico con comparativa de variaciones y exportación ejecutiva a PDF y Excel.'),

          h2('1.3 Contexto Operativo y Geográfico (Hermosillo, Sonora)'),
          p('La operación de Econodoor se sitúa en la ciudad de Hermosillo, Sonora, una región caracterizada por un clima desértico extremo con temperaturas estivales que superan con frecuencia los 45°C a la sombra y altos índices de radiación solar directa. Estas condiciones imponen un desgaste severo y atípico sobre los equipos de automatización:'),
          bullet('Desgaste Térmico en Capacitores y Motores', 'Los motores residenciales sufren sobrecalentamientos térmicos y descalibración de límites de carrera cuando se someten al calor vespertino sonorense.'),
          bullet('Partículas de Polvo Fino y Viento Desértico', 'El polvo ambiental genera fricción y atascos en cadenas, cremalleras de acero y bujes mecánicos, exigiendo lubricación especial a base de teflón seco que no recoja tierra.'),
          bullet('Falla en Fotoceldas por Exposición Solar', 'La intensa luz solar provoca deslumbramiento en los sensores infrarrojos de reversa, requiriendo alineaciones periódicas y pruebas de obstáculo en campo.'),
          p('Por estas razones, el sistema Econodoor incluye herramientas de monitoreo predictivo, checklist preventivo parametrizado y registro minucioso de fallas para prolongar la vida útil de los mecanismos en la entidad.'),

          h2('1.4 Definiciones, Acrónimos y Abreviaturas'),
          buildTable(
            ['Término / Sigla', 'Significado', 'Contexto dentro del Sistema Econodoor'],
            [
              ['SRS', 'Software Requirements Specification', 'Especificación formal de requisitos de software v1.0 que rige este desarrollo.'],
              ['RBAC', 'Role-Based Access Control', 'Mecanismo de seguridad que restringe pantallas y acciones según el rol del usuario.'],
              ['HUD', 'Heads-Up Display', 'Diseño de interfaz de usuario de alto contraste orientado a técnicos en condiciones de luz solar intensa.'],
              ['CRUD', 'Create, Read, Update, Delete', 'Operaciones básicas de persistencia sobre entidades (Clientes, Portones, Citas, etc.).'],
              ['CU', 'Caso de Uso', 'Escenario formal de interacción entre un actor humano y el sistema informático.'],
              ['P1 a P7', 'Requisitos de Personal Administrativo', 'Clave de especificación del SRS para funciones de clientes, portones, citas y cobros.'],
              ['T1 a T2', 'Requisitos de Técnico en Campo', 'Clave del SRS para visualización de asignaciones, checklists y cierre de órdenes.'],
              ['A1 a A5', 'Requisitos de Administrador', 'Clave del SRS para horarios de técnicos, catálogo, auditoría forense y analítica.'],
              ['G1', 'Requisitos Generales de Interfaz', 'Políticas de navegación, diseño responsivo y simulación de sesiones.'],
              ['Zustand', 'Gestor de Estado Global', 'Librería ligera en React para persistencia reactiva y mutaciones sincrónicas.'],
            ],
            [18, 32, 50]
          ),

          h2('1.5 Referencias y Marco de Trabajo'),
          p('Este proyecto se diseñó e implementó respetando los siguientes lineamientos profesionales y académicos:'),
          bullet('Estándar IEEE 830-1998', 'Recomendación de prácticas para especificaciones de requisitos de software.'),
          bullet('Metodología Ágil Kanban', 'Flujo de trabajo visual con limitación de trabajo en curso (WIP) y visibilidad de cuello de botella.'),
          bullet('Guías de Usabilidad de Nielsen Norman Group', 'Diseño ergonómico, prevención activa de errores y retroalimentación inmediata.'),

          // ==========================================
          // 2. DESCRIPCIÓN GENERAL DEL SISTEMA
          // ==========================================
          h1('2. Descripción General del Sistema', true),

          h2('2.1 Perspectiva del Producto'),
          p('Econodoor sustituye los métodos tradicionales basados en bitácoras físicas de papel, notas dispersas en blocs de notas, mensajes desorganizados en WhatsApp y calendarios murales que producían omisiones de visitas, retrasos en cobros y descontento en los clientes de Hermosillo. El sistema opera como una Single-Page Application (SPA) web reactiva e hiperrápida, operable tanto en computadoras de escritorio en la oficina matriz como en dispositivos móviles y tabletas utilizados por los técnicos en ruta.'),

          h2('2.2 Objetivos del Sistema'),
          bullet('Cero Colisiones de Horario', 'Eliminar al 100% los empalmes de citas técnicas gracias a algoritmos de intersección temporal en el calendario.'),
          bullet('Control Financiero Transparente', 'Garantizar que todo ingreso, anticipo o liquidación quede registrado con folio, hora de recepción y cajero responsable, prohibiendo el borrado físico.'),
          bullet('Estandarización del Mantenimiento', 'Asegurar que cada visita preventiva evalúe obligatoriamente los 6 puntos normativos de seguridad mecánica y eléctrica.'),
          bullet('Protección de Privacidad Salarial y Comercial', 'Aislar por completo la información financiera para el personal técnico en campo.'),
          bullet('Auditoría Integral', 'Monitorear cada cambio de estatus, reprogramación de cita o modificación de precios con trazabilidad del usuario autor.'),

          h2('2.3 Características y Perfiles de Usuario'),
          p('El sistema establece tres roles diferenciados conforme a las políticas de seguridad RBAC:'),
          
          buildTable(
            ['Rol de Usuario', 'Responsabilidades Principales', 'Pantallas Habilitadas', 'Restricciones de Acceso'],
            [
              [
                'Personal Administrativo\n(Staff / Recepción)',
                'Atención a llamadas de clientes, registro de fichas, captura de solicitudes de servicio, asignación de citas en calendario, cobro de anticipos y seguimiento en tablero.',
                'Clientes, Portones, Servicios, Citas, Calendario, Modal de Cobros, Búsqueda Omnibox.',
                'No puede modificar tarifas base del catálogo, ni alterar horarios de disponibilidad de técnicos, ni editar registros cerrados sin autorización.'
              ],
              [
                'Técnico en Campo\n(Field Technician)',
                'Consulta de ruta diaria, ejecución técnica en sitio, marcado de "En Proceso", llenado de checklist preventivo y captura de informe de trabajo realizado.',
                'Mis Trabajos Asignados (HUD), Detalle de Ubicación, Ficha de Motor, Checklist de Seguridad, Botón de Cierre.',
                'Aislamiento estricto: No tiene acceso a información de cobros, precios del servicio, estados de pago de clientes ni bitácora de auditoría global.'
              ],
              [
                'Administrador General\n(Admin)',
                'Supervisión estratégica de operaciones, gestión de técnicos y sus horarios semanales, actualización de catálogo con comparador, corrección de servicios y reportes.',
                'Acceso ilimitado a todos los módulos: Horarios Técnicos (A1), Catálogo Precios (A3), Auditoría Forense (A4), Reportes Ejecutivos (A5).',
                'Ninguna. Cuenta con facultades de auditor y corrección de expedientes cerrados justificando por escrito cada motivo.'
              ],
            ],
            [22, 28, 25, 25]
          ),

          h2('2.4 Restricciones Generales y Entorno Operativo'),
          bullet('Restricción de Eliminación Física (Soft-Delete)', 'Ningún cliente con servicios activos o históricos puede ser borrado de la base de datos; el sistema implementa desactivación lógica conservando la integridad referencial.'),
          bullet('Integridad de Cobranza', 'No se permite registrar pagos por importes negativos, ceros ni montos que superen el saldo pendiente del servicio.'),
          bullet('Compatibilidad Táctil y Móvil', 'Los componentes del módulo técnico deben operar con botones grandes (mínimo 44x44 px) adecuados para dedos con guantes de trabajo o pantalla bajo el sol.'),

          // ==========================================
          // 3. ARQUITECTURA TÉCNICA
          // ==========================================
          h1('3. Arquitectura Técnica del Sistema', true),

          h2('3.1 Pila Tecnológica (Tech Stack)'),
          p('La solución adopta tecnologías de vanguardia dentro del ecosistema TypeScript y React, seleccionadas minuciosamente por su robustez, velocidad de respuesta y excelente experiencia de desarrollo:'),

          buildTable(
            ['Capa / Componente', 'Tecnología Empleada', 'Versión', 'Justificación Técnica de Elección'],
            [
              ['Frontend Framework', 'React', '18.3.1', 'Renderizado declarativo, arquitectura basada en componentes reutilizables y hooks modernos.'],
              ['Lenguaje Base', 'TypeScript', '5.6.3', 'Tipado estricto en tiempo de compilación que previene errores de acceso a propiedades nulas.'],
              ['Empaquetador (Bundler)', 'Vite', '5.4.11', 'Compilación instantánea con Hot Module Replacement (HMR) y empaquetado optimizado mediante Rollup.'],
              ['Framework de Estilos', 'Tailwind CSS', '3.4.15', 'Utilidades atómicas con soporte nativo para paletas en modo oscuro (Dark Mode Slate/Sky).'],
              ['Animaciones Fluidas', 'Framer Motion', '11.11.17', 'Animaciones declarativas de transiciones de pantalla, modales y expansiones de acordeón.'],
              ['Gestor de Estado Global', 'Zustand', '5.0.1', 'Gestión atómica y centralizada sin sobrecarga de código repetitivo tipo Redux.'],
              ['Iconografía Vectorial', 'Lucide React', '0.460.0', 'Iconos SVG ligeros, coherentes visualmente y con renderizado nítido en pantallas Retina.'],
              ['Generación de PDF', 'jsPDF', '2.5.2', 'Generación cliente de reportes ejecutivos en formato PDF sin requerir procesamiento en backend.'],
              ['Exportación a Excel', 'SheetJS (xlsx)', '0.18.5', 'Generación de libros de trabajo en hojas de cálculo XLSX con soporte para selección de columnas.'],
              ['Efectos de Éxito', 'canvas-confetti', '1.9.3', 'Microinteracción de retroalimentación gratificante al liquidar servicios o cerrar órdenes.'],
            ],
            [22, 22, 12, 44]
          ),

          h2('3.2 Librerías de UI y Sistemas de Diseño'),
          p('Para otorgar un aspecto visual futurista, pulcro y extremadamente profesional, se combinaron cuatro sistemas de componentes complementarios:'),
          bullet('VengeanceUI', 'Aporta la arquitectura visual basada en Bento Grids para la vista general, las tarjetas interactivas GlowCard con destellos en tonos cian, el componente StatsCounter con animación numérica en tiempo real, el modal omnibox SearchModal para navegación con Ctrl+K y la barra RoleSwitcher.'),
          bullet('Animate-UI', 'Proporciona transiciones suaves entre vistas de rol, acordeones desplegables para el expediente de portones e historiales técnicos y microanimaciones de entrada en ventanas emergentes.'),
          bullet('Uiverse', 'Inspira los interruptores de palanca táctil (switches), casillas de verificación animadas para el checklist preventivo y botones de confirmación con efectos hápticos visuales.'),
          bullet('ForgeGUI', 'Establece el estilo de interfaz HUD (Heads-Up Display) de alta legibilidad para el técnico en campo, con indicadores luminosos, badges de estado pulsantes y marcos de diagnóstico técnico.'),

          h2('3.3 Estructura del Proyecto y Organización Modular'),
          p('El árbol de carpetas sigue una separación clara de responsabilidades por dominio y rol:'),

          buildTable(
            ['Directorio / Ruta', 'Propósito y Contenido Principal'],
            [
              ['src/types/index.ts', 'Definición de todas las interfaces del modelo de dominio: Cliente, Porton, Servicio, Cita, Tecnico, Pago, AuditoriaLog, User.'],
              ['src/store/useAppStore.ts', 'Núcleo de lógica de negocio en Zustand: persistencia, validaciones de colisión, mutaciones de estado y registro de auditoría.'],
              ['src/store/mockData.ts', 'Datos semilla iniciales representativos del entorno de Hermosillo para pruebas en vivo y demostración universitaria.'],
              ['src/components/layout/', 'Componentes de estructura general: RoleSwitcher (simulador interactivo de perfiles RBAC en tiempo real).'],
              ['src/components/ui/', 'Componentes gráficos transversales: GlowCard, StatsCounter, StatusBadge, SearchModal (Omnibox de búsqueda global).'],
              ['src/components/staff/', 'Módulo de Personal Administrativo: ClientsView, GatesView, ServicesBoard (Kanban), CalendarView, PaymentsModal.'],
              ['src/components/technician/', 'Módulo de Técnico de Campo: TechnicianView, tarjetas HUD de cita, checklist interactivo de 6 puntos, cierre de servicio.'],
              ['src/components/admin/', 'Módulo de Administración: TechniciansAdminView (horarios A1), CatalogAdminView (A3), AuditLogView (A4), ReportsView (A5).'],
              ['scripts/', 'Scripts Node.js de automatización para generar la presente documentación formal Word (.docx) y utilerías de compilación.'],
            ],
            [30, 70]
          ),

          h2('3.4 Flujo de Datos y Modelo de Estado Centralizado (Zustand)'),
          p('El flujo de datos sigue un patrón unidireccional estricto. Cuando un usuario interactúa con la interfaz (por ejemplo, al registrar un pago o agendar una cita):'),
          bullet('1. Invocación de Acción', 'La vista invoca un método del hook global useAppStore() pasando únicamente los parámetros validados por el formulario.'),
          bullet('2. Validación y Ejecución de Reglas', 'La tienda Zustand ejecuta las comprobaciones de negocio (ej. validación anti-colisión checkTechnicianAvailability o tope de saldo en registerPayment).'),
          bullet('3. Mutación Inmutable', 'Si la validación es aprobada, el estado se actualiza inmutablemente mediante la función set(), creando nuevos arreglos y objetos.'),
          bullet('4. Registro Automático en Auditoría', 'La tienda genera un nuevo registro en auditLogs indicando el usuario activo, la acción realizada, la fecha/hora y los valores anteriores y nuevos.'),
          bullet('5. Notificación Reactiva', 'Todos los componentes suscritos a esos cortes de estado se actualizan en milisegundos sin recargar la página.'),

          // ==========================================
          // 4. MANUAL DE USUARIO POR ROL
          // ==========================================
          h1('4. Manual de Usuario por Rol Operativo', true),

          h2('4.1 Personal Administrativo (Staff / Recepción)'),
          p('El Personal Administrativo constituye la primera línea de contacto con los clientes. Su flujo diario comprende desde la llamada de recepción hasta el cobro y cierre de cita.'),

          h3('4.1.1 P1: Registro, Búsqueda y Gestión de Clientes'),
          p('Para dar de alta a un nuevo cliente en el sistema:'),
          bullet('Paso 1', 'Seleccione la pestaña "Clientes" en la barra de navegación superior.'),
          bullet('Paso 2', 'Haga clic en el botón azul "+ Nuevo Cliente" ubicado en la esquina superior derecha.'),
          bullet('Paso 3', 'Seleccione el tipo de cliente: "Persona Física" o "Empresa".'),
          bullet('Paso 4 (Empresa)', 'Si eligió Empresa, el sistema habilitará como obligatorio el campo "Nombre de Contacto" (ej. Lic. Mariana Campoy) además de la Razón Social.'),
          bullet('Paso 5 (Detección de Teléfono)', 'Capture el teléfono a 10 dígitos. El sistema evalúa en tiempo real si el número ya existe en la base de datos; si coincide, mostrará una alerta preventiva en amarillo pero permitirá continuar si se trata de una sucursal vinculada.'),
          bullet('Paso 6 (Direcciones Múltiples)', 'Capture el domicilio del servicio (Calle, Número, Colonia, Ciudad y Referencias visuales). Si el cliente posee varios inmuebles (ej. casa particular y despacho profesional), haga clic en "+ Agregar Otra Dirección" para asociar todas sus propiedades a una misma cuenta.'),
          bullet('Paso 7', 'Presione "Guardar Cliente". El sistema registrará la fecha actual y emitirá un registro de auditoría.'),

          callout(
            'Regla de Desactivación Lógica (P1.6 y P1.7)',
            'Si un cliente ya no requiere servicios, no se le borra de la base de datos para no romper el historial de garantías. Use el botón "Desactivar". El cliente pasará a estatus inactivo. Si regresa meses después, use el botón "Reactivar" para habilitar nuevamente sus portones.',
            'info'
          ),

          h3('4.1.2 P2: Registro y Vinculación de Portones y Motores'),
          p('Cada portón automatizado pertenece a una dirección específica de un cliente:'),
          bullet('Paso 1', 'Diríjase a la pestaña "Portones" y presione "+ Registrar Portón".'),
          bullet('Paso 2', 'Seleccione el cliente en la lista desplegable. Al seleccionarlo, el selector de direcciones se actualizará automáticamente con los domicilios dados de alta para ese cliente.'),
          bullet('Paso 3', 'Indique la tipología mecánica: Corredizo, Abatible (1 o 2 brazos), Seccional o Levadizo.'),
          bullet('Paso 4', 'Especifique la marca del motor eléctrico (Merik, LiftMaster, DEA, Chamberlain, Genius, etc.) y capture el modelo exacto (ej. "Merik 711 Plus con batería de respaldo").'),
          bullet('Paso 5', 'Opcionalmente capture la fecha aproximada de instalación y notas técnicas relevantes (ej. "Cremallera de acero reforzada para uso pesado").'),
          bullet('Paso 6', 'Presione "Registrar Portón". La ficha técnica quedará enlazada para futuras órdenes de servicio.'),

          h3('4.1.3 P3: Solicitud y Registro de Órdenes de Servicio'),
          p('Cuando un cliente llama solicitando atención técnica:'),
          bullet('Paso 1', 'En la pestaña "Seguimiento y Cobros", pulse el botón "+ Nueva Solicitud".'),
          bullet('Paso 2', 'Elija al cliente y seleccione cuál de sus portones requiere el trabajo.'),
          bullet('Paso 3', 'Seleccione el tipo de servicio:'),
          p('    • Instalación Completa de Motor (duración sugerida: 180 min, precio base: $3,800 MXN).\n    • Mantenimiento Preventivo (duración sugerida: 60 min, precio base: $950 MXN).\n    • Mantenimiento Correctivo (duración sugerida: 90 min, precio base: $1,450 MXN).'),
          bullet('Paso 4 (Obligatoriedad de Falla P3.2)', 'Si seleccionó "Mantenimiento Correctivo", el campo "Descripción de la Falla Reportada" se torna estrictamente obligatorio (ej. "El motor zumba pero no avanza la cadena").'),
          bullet('Paso 5 (Costo Pactado P3.5)', 'El campo de costo se precarga automáticamente con el precio base del catálogo, pero el personal administrativo puede ajustarlo libremente según las piezas o distancia requerida.'),
          bullet('Paso 6', 'Al confirmar, el sistema genera el código de folio oficial correlativo (ej. "SRV-2026-004") con estatus inicial "Solicitado" y estado de pago "Pendiente".'),

          h3('4.1.4 P4: Programación de Citas con Algoritmo Anti-Colisión'),
          p('Para agendar la visita en el calendario del equipo:'),
          bullet('Paso 1', 'Acceda a la pestaña "Citas y Calendario". Podrá consultar la vista Semanal, Diaria o Mensual.'),
          bullet('Paso 2', 'Haga clic en "+ Agendar Cita" y elija la orden de servicio en estatus solicitado.'),
          bullet('Paso 3', 'El sistema precarga automáticamente la duración estimada del servicio según el catálogo oficial (P4.1).'),
          bullet('Paso 4', 'Seleccione el técnico deseado, la fecha y la hora de inicio.'),
          bullet('Paso 5 (Validación P4.2 y P4.3)', 'Al enviar el formulario, el motor anti-colisión valida dos condiciones: primero, que el técnico labore ese día de la semana y que la hora no exceda su jornada; segundo, que no exista ningún traslape temporal con otra cita ya agendada para ese técnico.'),
          bullet('Paso 6 (Transición Automática P3.3)', 'Si la cita se agenda con éxito, el servicio cambia automáticamente su estatus de "Solicitado" a "Programado".'),

          callout(
            'Reprogramación y Reasignación Transparente (P4.4 y P4.5)',
            'Si un cliente solicita cambiar la fecha de su cita, presione el botón de edición en la tarjeta del calendario. El sistema conserva intacta la "Fecha Originalmente Acordada" y registra la "Nueva Fecha", solicitando un motivo obligatorio que se añade a la bitácora de auditoría.',
            'warning'
          ),

          h3('4.1.5 P5: Tablero Kanban de Seguimiento y Cobros'),
          p('Permite tener visibilidad instantánea del flujo de trabajo en la empresa:'),
          bullet('Filtros Simultáneos (P5.2)', 'Permite filtrar la vista por Estado (Solicitado, Programado, En Proceso, Terminado, Cancelado), Tipo de Servicio, Técnico asignado y Estado de Pago (Pendiente, Parcial, Pagado).'),
          bullet('Alertas Visuales P5.3 y P5.4', 'Las órdenes con citas fijadas para la fecha de hoy se señalan con un borde pulsante color cian y el texto "HOY". Las órdenes con citas vencidas no atendidas muestran una alerta roja de retraso.'),

          h3('4.1.6 P6: Gestión de Pagos, Anticipos y Anulaciones'),
          p('Control de flujos financieros en caja matriz:'),
          bullet('Registro de Abono', 'Haga clic en el botón de pago ($) en la tarjeta del servicio. El modal muestra el costo total, el importe abonado acumulado y el saldo pendiente.'),
          bullet('Validación de Monto (P6.3)', 'El importe a capturar debe ser mayor a cero y no puede superar el saldo pendiente actual.'),
          bullet('Recálculo de Estado (P6.7)', 'Si se abona un anticipo, el servicio pasa a "Pago Parcial". Cuando el saldo llega a $0.00 MXN, pasa automáticamente a "Liquidado (Pagado)" disparando una animación de celebración.'),
          bullet('Anulación Motivada (P6.5 y P6.6)', 'Los pagos no pueden borrarse físicamente. Si se cometió un error de captura, se presiona "Anular Pago", ingresando obligatoriamente el motivo. El saldo se recalcula en el acto y se asienta en la auditoría con fecha y responsable.'),

          // ==========================================
          // 4.2 TÉCNICO EN CAMPO
          // ==========================================
          h2('4.2 Técnico en Campo (Field Technician)'),
          p('La interfaz del técnico está especialmente concebida para el uso en exteriores bajo la luz solar de Sonora, mediante un panel tipo HUD (Heads-Up Display) de alto contraste.'),

          h3('4.2.1 T1: Visualización Aislada y Privacidad (T1.1 a T1.4)'),
          bullet('Filtro Estricto de Asignaciones (T1.1)', 'Al iniciar sesión como técnico (ej. Carlos Méndez), el sistema muestra única y exclusivamente las citas asignadas a su identificador de técnico.'),
          bullet('Orden Cronológico (T1.2)', 'Los trabajos se despliegan en riguroso orden secuencial de atención para optimizar las rutas de desplazamiento por la ciudad.'),
          bullet('Ficha de Campo Completa (T1.3)', 'Cada tarjeta expone con tipografía nítida: nombre del cliente, dirección exacta con colonia y referencias visuales, tipología del portón, marca y modelo del motor eléctrico, y la descripción de la falla proporcionada por el cliente.'),
          bullet('Aislamiento de Privacidad Financiera (T1.4)', 'El módulo técnico oculta por completo los importes cobrados, precios base, saldos pendientes y estados de pago. El técnico se enfoca 100% en la calidad técnica del trabajo.'),

          h3('4.2.2 T2.1: Inicio de Labores ("En Proceso")'),
          p('Al arribar al domicilio del cliente, el técnico presiona el botón "Iniciar Trabajo". El servicio transiciona de "Programado" a "En Proceso", lo que permite a recepción informar en tiempo real a los clientes sobre el avance del servicio.'),

          h3('4.2.3 T2.3: Checklist Preventivo Normativo de 6 Puntos'),
          p('Cuando la orden corresponde a un Mantenimiento Preventivo, la pantalla despliega un formato interactivo con 6 componentes que el técnico debe inspeccionar obligatoriamente:'),
          bullet('1. Motor y Transmisión Eléctrica', 'Verificación de escobillas, devanado, engranes internos y temperatura de operación.'),
          bullet('2. Cadena, Cremallera o Cable de Tracción', 'Tensión mecánica, alineación y ausencia de eslabones agarrotados.'),
          bullet('3. Sensores Fotocelda y Reversa de Seguridad', 'Prueba de interrupción de haz infrarrojo y respuesta de frenado automático.'),
          bullet('4. Rodamientos, Bisagras y Topes Mecánicos', 'Inspección de fricción, nivelación horizontal y topes de goma en apertura/cierre.'),
          bullet('5. Controles Remotos y Botonera de Pared', 'Comprobación de alcance de radiofrecuencia (frecuencia 315/433 MHz) y baterías.'),
          bullet('6. Lubricación General con Teflón', 'Aplicación de aerosol de teflón seco en puntos de giro (no usar grasa espesa en desierto).'),
          p('Para cada punto, el técnico marca: Correcto, Requiere Ajuste, Dañado o No Aplica, pudiendo asentar observaciones puntuales.'),

          h3('4.2.4 T2.4: Conclusión del Servicio y Validación Obligatoria'),
          p('Para finalizar la visita técnica y liberar la orden de trabajo:'),
          bullet('Obligatoriedad de Informe Técnico', 'El técnico debe redactar una descripción minuciosa de las labores realizadas en el campo "Trabajo Realizado" (ej. "Se reemplazó capacitor de arranque de 45uF y se calibraron los límites de carrera electrónicos").'),
          bullet('Bloqueo Activo por Validación Vacía', 'El botón "Concluir y Cerrar Trabajo" se encuentra condicionado por el sistema. Si el técnico intenta cerrar el servicio con el campo vacío o con solo espacios en blanco, la acción se rechaza de inmediato con un mensaje de error prominente.'),
          bullet('Fecha Real de Atención (T2.5)', 'El sistema registra la fecha exacta en la que se concluyó físicamente el servicio, manteniéndola separada de la fecha que originalmente se programó la cita.'),

          // ==========================================
          // 4.3 ADMINISTRADOR GENERAL
          // ==========================================
          h2('4.3 Administrador General (Admin)'),
          p('El módulo gerencial concentra las herramientas de parametrización, seguridad y auditoría global de Econodoor.'),

          h3('4.3.1 A1: Gestión de Técnicos y Horarios Laborales Semanales'),
          bullet('Alta y Edición de Personal (A1.1)', 'Registro de técnicos con nombre completo, número de teléfono directo y especialidad técnica (ej. "Motores Seccionales Industriales DEA").'),
          bullet('Configuración de Jornada Semanal (A1.2)', 'Definición para cada día de lunes a domingo de si el técnico labora o descansa, junto con su hora exacta de inicio y fin (ej. 08:00 a 17:00 de lunes a viernes, y 08:00 a 13:00 en sábados).'),
          bullet('Manejo Asistido de Inactivación (A1.4)', 'Si un técnico se enferma o renuncia y el administrador desactiva su cuenta, el sistema evalúa de inmediato si tiene citas futuras programadas. Si las tiene, despliega una ventana modal con la lista de citas comprometidas para proceder a su reasignación inmediata.'),

          h3('4.3.2 A2: Control de Usuarios y Políticas de Seguridad'),
          bullet('Vinculación de Cuentas (A2.2)', 'Cada usuario con rol "technician" se asocia directamente a una entidad de técnico en el padrón de recursos humanos.'),
          bullet('Bloqueo por Intentos Fallidos (A2.3)', 'El sistema incorpora parámetros configurables: límite de 3 intentos erróneos de contraseña tras los cuales la cuenta se bloquea por 15 minutos.'),
          bullet('Tiempo de Inactividad de Sesión (A2.4)', 'Parámetro global de cierre automático de sesión tras 30 minutos de inactividad.'),

          h3('4.3.3 A3: Catálogo de Servicios con Modal de Comparativa de Precios'),
          p('Los precios base y duraciones no se modifican de manera arbitraria ni sin validación visual:'),
          bullet('Paso 1', 'Ingrese a "Catálogo Precios (A3)" y presione "Editar Tarifas" sobre el servicio deseado.'),
          bullet('Paso 2', 'Modifique el precio base sugerido o la duración en minutos.'),
          bullet('Paso 3 (Modal Comparativo A3.3)', 'Al pulsar "Revisar Cambios", el sistema no guarda directamente, sino que abre una ventana emergente de confirmación que coloca frente a frente los valores actuales contra los valores propuestos, calculando la diferencia en pesos ($) y el porcentaje exacto de incremento o decremento.'),
          bullet('Paso 4 (Impacto Exclusivo en Nuevos Servicios A3.4)', 'Al confirmar, el sistema asienta que los cambios aplicarán únicamente para órdenes de servicio que se registren a partir de ese instante, protegiendo las cotizaciones ya emitidas.'),

          h3('4.3.4 A4: Corrección de Registros Cerrados y Auditoría'),
          p('Para mantener expedientes fidedignos sin vulnerar la integridad:'),
          bullet('Corrección Extraordinaria (A4.1)', 'Únicamente el administrador puede editar el campo de trabajo realizado u observaciones de un servicio que ya fue marcado como "Terminado".'),
          bullet('Motivo Obligatorio (A4.2)', 'La ventana de edición exige capturar un motivo detallado (ej. "Se anexó número de serie del capacitor colocado para efectos de garantía del fabricante").'),
          bullet('Registro Inmutable (A4.3)', 'El cambio queda grabado en la bitácora de auditoría con el valor exacto anterior (JSON previo) y el nuevo valor, registrando la hora y el nombre del administrador.'),

          h3('4.3.5 A5: Generación y Exportación de Reportes Ejecutivos'),
          p('Para la toma de decisiones basada en datos:'),
          bullet('Indicadores Clave en Tiempo Real (A5.1)', 'Contadores animados de Total de Ingresos del Período, Total de Servicios Atendidos, Tasa de Servicios Terminados vs Pendientes y desglose volumétrico por tipo de trabajo.'),
          bullet('Rango de Fechas Configurable (A5.2)', 'Selector interactivo de fecha inicial y fecha final que recalcula los gráficos e indicadores en milisegundos.'),
          bullet('Exportación Oficial a PDF (A5.4)', 'Botón que compila en el cliente un documento PDF formal con tipografía ejecutiva, membrete de Econodoor, indicadores consolidados y tabla de cartera vencida con saldos pendientes.'),
          bullet('Exportación a Excel XLSX con Columnas Personalizadas (A5.5)', 'Modal que permite marcar o desmarcar mediante casillas de verificación cuáles columnas desea incluir en la hoja de cálculo (Folio, Cliente, Tipo de Servicio, Costo, Estado, Estado de Pago, Fecha de Solicitud), generando un archivo compatible con Microsoft Excel y Google Sheets.'),

          // ==========================================
          // 5. REGLAS DE NEGOCIO IMPLEMENTADAS
          // ==========================================
          h1('5. Reglas de Negocio Implementadas', true),

          h2('5.1 Máquina de Estados del Servicio (Service State Machine)'),
          p('El ciclo de vida de un servicio en Econodoor se rige por una máquina de estados determinista que prohíbe saltos arbitrarios:'),

          buildTable(
            ['Estado Origen', 'Estado Destino', 'Evento Disparador', 'Condición de Guardia (Validación)', 'Rol Autorizado'],
            [
              ['— (Nuevo)', 'solicitado', 'addService()', 'Cliente, portón y costo mayor a cero definidos.', 'Personal Staff / Admin'],
              ['solicitado', 'programado', 'bookAppointment()', 'Cita agendada con técnico sin colisiones de horario.', 'Personal Staff / Admin'],
              ['programado', 'en_proceso', 'updateServiceStatusByTech()', 'Técnico arriba a la ubicación y presiona inicio.', 'Técnico en Campo'],
              ['en_proceso', 'terminado', 'completeServiceByTech()', 'Descripción de trabajo realizado obligatoria no vacía.', 'Técnico en Campo'],
              ['solicitado / programado', 'cancelado', 'cancelService()', 'Captura obligatoria de motivo de cancelación.', 'Personal Staff / Admin'],
            ],
            [18, 16, 22, 26, 18]
          ),

          callout(
            'Protección de Órdenes Canceladas (P3.6)',
            'Un servicio en estado cancelado conserva permanentemente su registro en el sistema, preserva el nombre del usuario que canceló y el motivo detallado, y anula en cascada las citas futuras vinculadas para liberar el tiempo del técnico en el calendario.',
            'info'
          ),

          h2('5.2 Máquina de Estados Financiera (Payment State Machine)'),
          p('La cobranza se calcula dinámicamente evaluando la sumatoria de pagos activos (no anulados) frente al costo final acordado:'),

          buildTable(
            ['Condición Matemática de Pagos', 'Estado de Pago Resultante', 'Comportamiento en Interfaz'],
            [
              ['Suma de pagos activos = $0.00', 'pendiente (Cobro Pendiente)', 'Insignia roja de advertencia en tablero Kanban.'],
              ['$0.00 < Suma de pagos activos < Costo Total', 'parcial (Pago Parcial / Anticipo)', 'Insignia ámbar indicando saldo pendiente de liquidar.'],
              ['Suma de pagos activos = Costo Total', 'pagado (Liquidado en su Totalidad)', 'Insignia verde esmeralda con saldo en cero y animación de confeti.'],
            ],
            [35, 30, 35]
          ),

          p('Cuando un pago previo es anulado por la administración (P6.5), la tienda descuenta el importe del pago anulado y reevalúa la fórmula anterior de manera instantánea, regresando el servicio a "parcial" o "pendiente" según corresponda.'),

          h2('5.3 Algoritmo de Detección de Colisiones de Citas (P4.2 y P4.3)'),
          p('El agendamiento previene el 100% de los conflictos de horario mediante una evaluación de dos fases ejecutada en checkTechnicianAvailability():'),
          bullet('Fase 1: Comprobación de Jornada Laboral', 'El sistema toma la fecha propuesta (YYYY-MM-DD), extrae el día de la semana en español (lunes a domingo) y consulta la disponibilidad del técnico. Si el día está inactivo o si el rango [horaInicio, horaInicio + duracion] cae antes de la apertura o después del cierre del técnico, la cita se rechaza indicando el horario laboral exacto.'),
          bullet('Fase 2: Intersección Temporal de Intervalos', 'Para todas las demás citas en estado "programada" de ese técnico en esa misma fecha, se convierten las horas a minutos enteros desde medianoche (minutos = horas * 60 + minutos). Se aplica el teorema de traslape de intervalos:'),
          p('    Existe colisión SI:  max(inicio_propuesto, inicio_existente) < min(fin_propuesto, fin_existente)'),
          p('Si esta condición se cumple para cualquier cita existente, el sistema bloquea el guardado y notifica al usuario: "El técnico ya tiene una cita asignada en ese horario (HH:mm por X min)".'),

          h2('5.4 Prevención de Duplicados Telefónicos (P1.3)'),
          p('Al ingresar el teléfono en el formulario de clientes, el método checkPhoneExists() normaliza la cadena eliminando guiones, espacios y paréntesis mediante expresiones regulares (replace(/\\D/g, \'\')). Si los 10 dígitos coinciden con otro cliente registrado, se genera una advertencia preventiva en pantalla.'),

          h2('5.5 Integridad Referencial y Eliminación Lógica (Soft-Delete)'),
          p('Bajo ninguna circunstancia se ejecutan operaciones DELETE físicas en clientes, portones, servicios o pagos. El borrado accidental de un cliente eliminaría el historial de garantías de un motor de 10 años. Por ello, el sistema marca activo: false o anulado: true, excluyendo los registros de los selectores activos pero manteniéndolos consultables en auditorías e historiales.'),

          h2('5.6 Trazabilidad y Bitácora Inmutable de Auditoría'),
          p('Toda acción crítica (alta de cliente, asignación de cita, reprogramación, anulación de cobro, corrección de servicio cerrado) genera un objeto AuditoriaLog con identificador único, usuario en sesión, timestamp ISO, entidad afectada, valor anterior, valor nuevo y justificación.'),

          // ==========================================
          // 6. MATRIZ DE CASOS DE USO (CU1 A CU15)
          // ==========================================
          h1('6. Matriz de Casos de Uso (CU1 a CU15)', true),
          p('A continuación se documenta el mapeo formal de los 15 Casos de Uso del sistema conforme a la Especificación de Requisitos de Software:'),

          buildTable(
            ['CU ID', 'Nombre del Caso de Uso', 'Actor', 'Requisitos SRS', 'Estatus'],
            [
              ['CU1', 'Control de Acceso y Simulación RBAC', 'Todos los Roles', 'G1.1, G1.2, A2.1', '100% Implementado'],
              ['CU2', 'Gestión de Clientes y Direcciones', 'Personal Staff / Admin', 'P1.1 a P1.7', '100% Implementado'],
              ['CU3', 'Registro y Expediente de Portones', 'Personal Staff / Admin', 'P2.1 a P2.3, P7.1', '100% Implementado'],
              ['CU4', 'Apertura de Órdenes de Servicio', 'Personal Staff / Admin', 'P3.1 a P3.6', '100% Implementado'],
              ['CU5', 'Programación Anti-Colisión de Citas', 'Personal Staff / Admin', 'P4.1 a P4.3', '100% Implementado'],
              ['CU6', 'Reprogramación y Reasignación de Citas', 'Personal Staff / Admin', 'P4.4 a P4.7', '100% Implementado'],
              ['CU7', 'Seguimiento Kanban y Alertas', 'Personal Staff / Admin', 'P5.1 a P5.5', '100% Implementado'],
              ['CU8', 'Registro y Anulación de Pagos', 'Personal Staff / Admin', 'P6.1 a P6.7', '100% Implementado'],
              ['CU9', 'Consulta de Historial Técnico de Portón', 'Todos los Roles', 'P7.1 a P7.3, T1.3', '100% Implementado'],
              ['CU10', 'Visualización HUD de Trabajos Asignados', 'Técnico en Campo', 'T1.1 a T1.4', '100% Implementado'],
              ['CU11', 'Ejecución y Checklist de Mantenimiento', 'Técnico en Campo', 'T2.1 a T2.5', '100% Implementado'],
              ['CU12', 'Administración de Horarios de Técnicos', 'Administrador General', 'A1.1 a A1.5', '100% Implementado'],
              ['CU13', 'Configuración de Catálogo con Comparativa', 'Administrador General', 'A3.1 a A3.4', '100% Implementado'],
              ['CU14', 'Supervisión y Corrección de Expedientes', 'Administrador General', 'A4.1 a A4.3', '100% Implementado'],
              ['CU15', 'Generación de Reportes PDF y Excel', 'Administrador General', 'A5.1 a A5.5', '100% Implementado'],
            ],
            [10, 36, 22, 16, 16]
          ),

          p('', { after: 140 }),

          h2('6.1 Especificación Detallada de Casos de Uso Críticos'),
          
          h3('Caso de Uso CU5: Programación Anti-Colisión de Citas (Req. P4.1 a P4.3)'),
          bullet('Actor Principal', 'Personal Administrativo (Recepcionista).'),
          bullet('Precondición', 'Existe al menos un servicio en estatus "solicitado" y un técnico activo registrado en el sistema.'),
          bullet('Flujo Principal', '1. El recepcionista selecciona el servicio. 2. El sistema precarga la duración según catálogo. 3. El usuario elige fecha, técnico y hora. 4. El sistema ejecuta checkTechnicianAvailability(). 5. Al confirmar que no hay traslapes ni salidas de jornada, se almacena la Cita y el servicio pasa a "programado".'),
          bullet('Flujo Excepcional (Colisión)', 'Si el técnico tiene otra cita que colisiona, el sistema bloquea el guardado y muestra en rojo el motivo de conflicto exacto, invitando a elegir otra hora o técnico.'),

          h3('Caso de Uso CU11: Ejecución y Checklist de Mantenimiento (Req. T2.1 a T2.5)'),
          bullet('Actor Principal', 'Técnico en Campo (Carlos Méndez).'),
          bullet('Precondición', 'El técnico tiene una cita asignada y se encuentra presente en el inmueble del cliente.'),
          bullet('Flujo Principal', '1. Pulsa "Iniciar Trabajo" (servicio pasa a "en_proceso"). 2. Inspecciona los 6 puntos normativos (motor, cadena, fotoceldas, bisagras, controles, lubricación) marcando el estatus de cada uno. 3. Redacta el informe de trabajo en el campo obligatorio. 4. Presiona "Concluir Trabajo". 5. El sistema valida texto no vacío, asienta fecha real de atención y pasa el servicio a "terminado".'),
          bullet('Flujo Excepcional (Texto Vacío T2.4)', 'Si intenta finalizar sin redactar el trabajo, el sistema rechaza la acción e ilumina el campo en rojo.'),

          h3('Caso de Uso CU13: Configuración de Catálogo con Comparativa (Req. A3.1 a A3.4)'),
          bullet('Actor Principal', 'Administrador General (Ing. Uziel Márquez).'),
          bullet('Flujo Principal', '1. Accede a Catálogo de Servicios. 2. Modifica el precio base o duración de un servicio. 3. Pulsa "Guardar Cambios". 4. El sistema abre el Modal Comparativo desplegando precio anterior vs propuesto, variación en pesos y porcentaje. 5. Tras confirmar la comparativa, los cambios se persisten en la tienda.'),

          // ==========================================
          // 7. LIBRERÍAS DE UI UTILIZADAS
          // ==========================================
          h1('7. Librerías de UI y Componentes Visuales', true),
          p('La interfaz de usuario de Econodoor se diseñó bajo una estética "Dark Sci-Fi Industrial" inspirada en herramientas profesionales de alta gama. Se integraron cuatro librerías y fuentes de diseño abiertas:'),

          buildTable(
            ['Librería / Sistema', 'Componentes Utilizados en el Proyecto', 'Archivo Fuente', 'Impacto Visual y Ergonómico'],
            [
              [
                'VengeanceUI',
                '• GlowCard (tarjetas con resplandor cian reactivo al hover)\n• StatsCounter (contadores animados de KPIs)\n• SearchModal (Omnibox de búsqueda global Ctrl+K)\n• RoleSwitcher (píldoras de conmutación de rol en vivo)',
                'src/components/ui/GlowCard.tsx\nsrc/components/ui/StatsCounter.tsx\nsrc/components/ui/SearchModal.tsx\nsrc/components/layout/RoleSwitcher.tsx',
                'Proporciona una identidad visual distintiva con acabados en slate/sky y respuesta táctil sofisticada.'
              ],
              [
                'Animate-UI',
                '• Transiciones de entrada y salida suave de diálogos modales\n• Acordeones interactivos colapsables de historial técnico\n• Animaciones de cambio de vista',
                'src/components/staff/GatesView.tsx\nsrc/components/admin/CatalogAdminView.tsx\nsrc/index.css',
                'Elimina los saltos bruscos en pantalla, ofreciendo sensación de fluidez y continuidad operativa.'
              ],
              [
                'Uiverse',
                '• Interruptores deslizantes (toggle switches) de activación de días\n• Casillas de verificación animadas para checklist preventivo\n• Botones estilizados de acción rápida',
                'src/components/admin/TechniciansAdminView.tsx\nsrc/components/technician/TechnicianView.tsx',
                'Facilita la interacción táctil en dispositivos móviles de campo, evitando pulsaciones accidentales.'
              ],
              [
                'ForgeGUI',
                '• Panel HUD operativo de alta visibilidad para técnicos\n• Indicadores de estatus pulsantes (badges de actividad)\n• Marcos de diagnóstico técnico en campo',
                'src/components/technician/TechnicianView.tsx\nsrc/components/ui/StatusBadge.tsx',
                'Optimiza el contraste cromático para visualización en exteriores bajo el sol desértico de Hermosillo.'
              ],
            ],
            [18, 32, 25, 25]
          ),

          // ==========================================
          // 8. HISTORIAL DE CAMBIOS Y VERSIONES
          // ==========================================
          h1('8. Historial de Cambios y Versiones', true),
          p('El control de versiones del proyecto asegura la trazabilidad entre los requisitos académicos y el código fuente entregado:'),

          buildTable(
            ['Versión', 'Fecha', 'Autor / Responsable', 'Descripción de Cambios y Entregables Clave', 'Aprobación'],
            [
              [
                'v0.1-draft',
                '15/Ene/2026',
                'Uziel Márquez',
                'Levantamiento inicial de requerimientos con personal operativo de Econodoor en Hermosillo. Redacción del SRS preliminar.',
                'Aprobado Comité'
              ],
              [
                'v0.5-beta',
                '20/Mar/2026',
                'Uziel Márquez',
                'Maquetación de pantallas en React y Tailwind CSS. Implementación del estado global en Zustand y algoritmos iniciales de citas.',
                'Aprobado Asesor'
              ],
              [
                'v1.0 (Actual)',
                '14/Oct/2026',
                'Uziel Márquez',
                'Lanzamiento oficial de producción: 15 Casos de Uso cubiertos al 100%, algoritmo anti-colisión validado, checklist normativo, reportes PDF/Excel y documentación técnica completa.',
                'Aprobado UNISON'
              ],
            ],
            [12, 14, 18, 44, 12]
          ),

          p('', { before: 300 }),

          // Firma institucional de cierre
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: COLOR.BORDER_DARK },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    margins: { top: 200, bottom: 100, left: 100, right: 100 },
                    children: [
                      pRich([
                        new TextRun({ text: 'Ing. Uziel Márquez', bold: true, size: 21, color: COLOR.NAVY }),
                      ], { alignment: AlignmentType.CENTER, after: 20 }),
                      pRich([
                        new TextRun({ text: 'Desarrollador y Autor del Proyecto\nUniversidad de Sonora — Campus Hermosillo', size: 18, color: COLOR.MUTED }),
                      ], { alignment: AlignmentType.CENTER }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    margins: { top: 200, bottom: 100, left: 100, right: 100 },
                    children: [
                      pRich([
                        new TextRun({ text: 'Econodoor Hermosillo', bold: true, size: 21, color: COLOR.NAVY }),
                      ], { alignment: AlignmentType.CENTER, after: 20 }),
                      pRich([
                        new TextRun({ text: 'Validación Operativa y Práctica Profesional\nDivisión de Ciencias Exactas y Naturales', size: 18, color: COLOR.MUTED }),
                      ], { alignment: AlignmentType.CENTER }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          p('', { before: 200 }),
          pRich([
            new TextRun({ text: '— Fin del Documento Oficial de Especificación y Manual de Usuario —', italic: true, size: 18, color: COLOR.MUTED }),
          ], { alignment: AlignmentType.CENTER }),
        ],
      },
    ],
  });

  const outputDir = path.resolve('c:/Users/uziel/Desktop/prototipo-econodoor/docs');
  const outputPath = path.join(outputDir, 'Manual_Econodoor_v1.docx');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Directorio creado: ${outputDir}`);
  }

  console.log("Compilando búfer binario OpenXML (.docx)...");
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);

  console.log(`\n¡ÉXITO TOTAL! Documento generado exitosamente en:`);
  console.log(outputPath);
  console.log(`Tamaño del archivo generado: ${(buffer.length / 1024).toFixed(2)} KB\n`);
}

generateDocumentation().catch((err) => {
  console.error("Error al generar el documento Word:", err);
  process.exit(1);
});
