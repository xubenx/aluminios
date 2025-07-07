# Aluminios San Francisco - Sistema de Gestión Integral

## Introducción

Este es un sistema de gestión integral para **Aluminios San Francisco**, desarrollado con Next.js, TypeScript, Material-UI y Firebase. El sistema maneja presupuestos, proyectos, inventarios, contabilidad y cálculos especializados para la industria de aluminios y vidrios.

## Tecnologías y Stack

### Frontend
- **Next.js 15.2.4** - Framework React con App Router
- **React 19** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático para JavaScript
- **Material-UI (MUI) 7.0.1** - Componentes de interfaz
- **Emotion** - CSS-in-JS para estilos
- **TailwindCSS 4** - Framework de utilidades CSS

### Backend y Base de Datos
- **Firebase Firestore** - Base de datos NoSQL en tiempo real
- **Firebase Analytics** - Análisis de uso
- **🆕 Next.js API Routes** - Endpoints serverless para subida de archivos

### Utilidades y Herramientas
- **mathjs** - Evaluación de expresiones matemáticas
- **next-sitemap** - Generación automática de sitemaps
- **ESLint** - Linting y calidad de código
- **🆕 Node.js fs/promises** - Manejo de archivos para subida de imágenes

## Arquitectura del Proyecto

### Estructura de Carpetas
```
src/
├── app/
│   ├── layout.tsx                    # Layout principal de la aplicación
│   ├── globals.css                   # Estilos globales
│   ├── api/                          # 🆕 API Routes serverless
│   │   └── upload-image/             # 🆕 Endpoint para subida de imágenes
│   │       └── route.js              # 🆕 Lógica de manejo de archivos
│   └── sistema/                      # Módulo principal del sistema
│       ├── layout.tsx                # Layout con navegación lateral
│       ├── page.tsx                  # Dashboard principal
│       ├── presupuestos/            # Módulo de cotizaciones (🆕 con sistema dual)
│       ├── proyectos/               # Gestión de proyectos (🆕 con sistema dual)
│       ├── clientes/                # Administración de clientes
│       ├── diario/                  # Contabilidad y finanzas
│       ├── recordatorios/           # Sistema de recordatorios
│       ├── modelos/                 # Catálogo de modelos (🆕 con sistema dual + subida de imágenes)
│       ├── materiales/              # Inventario de materiales
│       ├── herrajes/                # Inventario de herrajes
│       ├── vidrios/                 # Catálogo de vidrios
│       ├── calculadora-vidrios/     # Calculadora especializada
│       ├── colaboradores/           # Gestión de empleados
│       └── ordenes/                 # Órdenes de trabajo
public/
├── images/                          # Imágenes de productos (🆕 con sistema de subida)
├── logo_aluminos.png               # Logo principal
└── [otros archivos estáticos]
```

## Módulos Principales

### 1. Presupuestos (`/sistema/presupuestos`)
**Propósito**: Generación de cotizaciones completas para clientes

**🆕 Sistema Dual de Mano de Obra (Diciembre 2024)**:
- **En cotizaciones**: Siempre usa `manpower` (porcentaje) para calcular y mostrar costos al cliente
- **Para órdenes de trabajo**: Almacena también `manpowerActual` (costo real) para uso interno
- **Cálculo diferenciado**: 
  - `laborCost` = materiales × porcentaje de mano de obra (para mostrar al cliente)
  - `laborCostActual` = costo fijo real (para pagos internos)

**Funcionalidades principales**:
- **Selección de modelos de aluminio** con configuración de dimensiones
- **Agregado de elementos individuales**:
  - **Materiales**: Por metros o tramos con cálculo automático
  - **Herrajes**: Por piezas con precios unitarios
  - **Vidrios**: Por m² directos o calculados por dimensiones
- **Carrito unificado** que combina modelos y elementos individuales
- **Cálculo automático** de materiales, herrajes y mano de obra (dual)
- **Exportación** de presupuestos completos

**Flujo de trabajo optimizado**:
1. **Selección base**: Cliente busca y selecciona modelo principal
2. **Configuración**: Ingresa dimensiones y selecciona vidrios
3. **Elementos adicionales**: Agrega materiales, herrajes o vidrios extras usando botones flotantes
4. **Carrito inteligente**: Revisa elementos combinados con resúmenes automáticos
5. **Proyecto final**: Guarda como proyecto con estructura completa (incluyendo ambos costos de mano de obra)

**Características UX/UI**:
- **Botones flotantes diferenciados** por color para cada tipo de elemento
- **Diálogos intuitivos** con validaciones en tiempo real
- **Vista unificada del carrito** con elementos categorizados
- **Cálculos automáticos** y resúmenes por categoría (con distinción de costos)
- **Feedback visual** inmediato en todas las acciones

### 2. Proyectos (`/sistema/proyectos`)
**Propósito**: Gestión completa del ciclo de vida de proyectos

**🆕 Sistema Dual de Mano de Obra Integrado (Diciembre 2024)**:
- **Almacenamiento dual**: Cada elemento almacena tanto `laborCost` como `laborCostActual`
- **Edición granular**: Permite modificar ambos valores de mano de obra por elemento
- **Visualización clara**: 
  - "Costo de Mano de Obra para Cotización" (lo que se mostró al cliente)
  - "Costo Real de Mano de Obra" (lo que se pagará al trabajador)
- **Cálculos automáticos**: Usa el valor correcto según el contexto
- **Para vidrios**: Mantiene el sistema de pago por m² sin cambios

**🆕 Funcionalidades de Edición de Cotizaciones (Julio 2025)**:
- **Eliminación de modelos**: Permite eliminar modelos de proyectos en estado "Cotización"
- **Re-cotización completa**: Modificación de dimensiones, vidrios y colores con recálculo automático
- **Agregar elementos individuales**: Adición de materiales, herrajes o vidrios por separado
- **Cálculos en tiempo real**: Actualización inmediata de totales y desgloses
- **Validaciones completas**: Prevención de errores con feedback al usuario

**Estados de proyecto**:
- **Cotización** (`quotation`): Proyecto en fase de presupuesto
- **Activo** (`active`): Proyecto aprobado y en ejecución
- **Completado** (`completed`): Proyecto terminado
- **Cancelado** (`cancelled`): Proyecto cancelado
- **Inactivo** (`inactive`): Proyecto archivado

**Sistema de Pagos y Deudas**:
- **Activación automática**: Al cambiar de "Cotización" a "Activo", se sugiere un anticipo del 50%
- **Registro de pagos**: Historial completo con fecha, monto, descripción y método de pago
- **Control de deuda**: Seguimiento automático del saldo pendiente
- **Métodos de pago**: Efectivo, transferencia, tarjeta, cheque

**Gestión por elementos (Per-item Status)**:
- **Estados individuales**: Cada modelo o elemento tiene su propio estado
  - **Pendiente**: Elemento por procesar
  - **En Proceso**: Elemento en fabricación/preparación
  - **Instalado**: Elemento ya instalado
  - **Revisado**: Elemento verificado y aprobado
- **Asignación de trabajadores**: Cada elemento puede ser asignado a un empleado específico
- **Seguimiento granular**: Control detallado del progreso del proyecto

**🆕 Capacidades de Edición en Estado "Cotización"**:

#### Eliminación de Modelos
- **Funcionalidad**: Permite eliminar cualquier modelo o elemento de un proyecto
- **Restricción**: Solo disponible en estado "Cotización"
- **Recálculo automático**: Actualiza el total del proyecto al eliminar elementos
- **Confirmación**: Requiere confirmación antes de eliminar

#### Re-cotización de Modelos
- **Modificación completa**: Cambio de dimensiones, vidrios y colores
- **Cálculo en tiempo real**: Muestra desglose actualizado antes de confirmar
- **Preservación de datos**: Mantiene información del modelo original como referencia
- **Validación**: Verifica que todos los campos requeridos estén completos

#### Agregar Elementos Individuales
- **Materiales**: Adición por metros o tramos con cálculo automático
- **Herrajes**: Adición por piezas con pricing unitario
- **Vidrios**: Adición por m² directos o por dimensiones calculadas
- **Integración**: Se añaden al proyecto junto con los modelos existentes

**Funcionalidades principales**:
- Creación de proyectos con información del cliente
- Vista detallada con desglose de costos (dual)
- Asignación de colaboradores por elemento
- Seguimiento de múltiples modelos por proyecto
- Archivado de proyectos terminados
- Sistema de filtros (archivados, inactivos)
- Gestión de pagos con historial completo
- **🆕 Personalización de costos de mano de obra duales** por elemento
- **🆕 Agregar nuevos modelos a proyectos existentes**
- **🆕 Edición completa de cotizaciones con recálculo automático**
- **🆕 Eliminación y re-cotización de elementos existentes**

**🆕 Interfaz de Usuario Mejorada**:
- **Botones contextuales**: Acciones disponibles según el estado del proyecto
- **Diálogos especializados**: Formularios específicos para cada tipo de edición
- **Feedback visual**: Indicadores de estado y progreso en tiempo real
- **Validación dinámica**: Mensajes de error específicos y ayuda contextual
- **Cálculos transparentes**: Desglose detallado de costos en todas las operaciones

### 3. Calculadora de Vidrios (`/sistema/calculadora-vidrios`)
**Propósito**: Herramienta especializada para cálculo rápido de vidrios

**Características principales**:
- **Layout de dos paneles**: Izquierda (selección), Derecha (tabla resumen)
- **Dimensiones persistentes**: Las dimensiones se mantienen para comparación rápida
- **Selección intuitiva**: Solo muestra opciones después de seleccionar vidrio
- **Edición in-place**: Cambio de modelo/opción desde la tabla resumen
- **Cálculo automático**: Área (m²) y precios en tiempo real

**Flujo optimizado**:
1. Ingresa dimensiones una vez
2. Selecciona vidrio base
3. Aparecen opciones disponibles
4. Agrega con un clic
5. Puede cambiar modelo/opción desde tabla sin reingresar dimensiones

### 4. Diario Contable (`/sistema/diario`)
**Propósito**: Registro y control financiero

**Funcionalidades**:
- Registro de gastos e ingresos (pagos)
- Categorización automática
- Dashboard financiero con métricas
- Filtros por tipo, categoría y estado
- Sistema de soft delete (entradas inactivas)
- Balance en tiempo real

**Categorías predefinidas**:
- **Gastos**: Materiales, transporte, servicios, mantenimiento
- **Pagos**: Ventas, servicios, otros ingresos

### 5. Modelos (`/sistema/modelos`)
**Propósito**: Catálogo maestro de modelos de aluminio

**Estructura de datos**:
- **Información básica**: Nombre, sistema dual de mano de obra, imagen
- **Materiales**: Lista con fórmulas de cálculo
- **Herrajes**: Componentes metálicos con cantidades
- **Vidrios**: Tipos de vidrio compatibles

**🆕 Sistema Dual de Mano de Obra**:
Implementado en Diciembre 2024 para separar costos de cotización y pagos reales:

- **`manpower`** (Porcentaje): Se usa para cálculos de cotización
  - Porcentaje que se aplica sobre el costo de materiales
  - Es lo que se muestra al cliente en el presupuesto
  - Campo obligatorio con validación numérica

- **`manpowerActual`** (Costo Fijo): Se usa para órdenes de trabajo
  - Costo real fijo que se pagará al trabajador
  - Solo para uso interno en órdenes de trabajo
  - No afecta las cotizaciones mostradas al cliente
  - Campo opcional con valor por defecto de "0"

**Funcionalidades del módulo**:
- **Formulario dual**: Permite editar ambos valores de mano de obra
- **Subida de imágenes**: Sistema compatible con Vercel usando API endpoint
- **Validación completa**: Campos obligatorios y tipos de datos
- **Integración con otros módulos**: Todos los cálculos usan el valor correcto según el contexto

**Fórmulas matemáticas**:
Las fórmulas utilizan variables como:
- `ALTO`: Altura del modelo
- `ANCHO`: Ancho del modelo  
- `PRECIO`: Precio unitario del material
- `TRAMO`: Longitud estándar del material

Ejemplo: `(ALTO + ANCHO) * 2 / TRAMO * PRECIO`

### 6. Inventarios

#### Materiales (`/sistema/materiales`)
- Catálogo de perfiles de aluminio
- Precios por metro
- Longitudes estándar (tramos)

#### Herrajes (`/sistema/herrajes`) 
- Componentes metálicos (bisagras, cerraduras, etc.)
- Precios por pieza

#### Vidrios (`/sistema/vidrios`)
- Catálogo de tipos de vidrio
- **Sistema de soft delete**: Estado `active`/`inactive`
- **Reactivación**: Posibilidad de restaurar vidrios inactivos
- Sugerencia automática de precios
- Toggle de vista activos/inactivos

### 7. Gestión de Personal

#### Colaboradores (`/sistema/colaboradores`)
- Registro de empleados
- Asignación a proyectos

#### Recordatorios (`/sistema/recordatorios`)
- Sistema de notificaciones
- Estados: pendiente, completado, vencido
- Fechas de vencimiento

## Modelos de Datos

### Proyecto
```javascript
{
  id: string,
  name: string,
  customerName: string,
  status: "quotation" | "active" | "completed" | "cancelled" | "inactive",
  archived: boolean,
  date: timestamp,
  total: number,
  debt?: number,              // Deuda pendiente (solo proyectos activos)
  payments?: [                // Historial de pagos (solo proyectos activos)
    {
      date: string,           // ISO timestamp
      amount: number,
      description: string,
      method: "efectivo" | "transferencia" | "tarjeta" | "cheque"
    }
  ],
  items: [
    // Elementos de modelo
    {
      type: "model",
      modelId: string,
      modelName: string,
      dimensions: { height: number, width: number },
      selectedGlass: { id: string, name: string },
      status: "pendiente" | "enProceso" | "instalado" | "revisado" | "cotizacion" | "pagada",
      area: string,
      assignedEmployeeId: string,
      laborCostSelected: number,    // 🆕 Costo para cotización (mostrado al cliente)
      laborCostActual: number,      // 🆕 Costo real para trabajador
      total: number,
      details: {
        materials: { items: [], price: number },
        chapes: { items: [], price: number },
        glasses: { items: [], price: number },
        laborCost: number,          // 🆕 Valor de cotización
        laborCostActual: number     // 🆕 Valor real
      }
    },
    // Elementos individuales
    {
      type: "individual",
      itemType: "material" | "herraje" | "vidrio",
      itemId: string,
      itemName: string,
      quantity: number,
      quantityType: "metros" | "tramos" | "piezas" | "m2" | "dimensiones",
      unitPrice: number,
      total: number,
      status: "pendiente" | "enProceso" | "instalado" | "revisado",
      assignedEmployeeId?: string,
      dimensions?: { height: number, width: number }, // Solo para vidrios
      area?: number, // Solo para vidrios
      meters?: number, // Solo para materiales
      tramo?: number // Solo para materiales
    }
  ]
}
```

### Modelo
```javascript
{
  id: string,
  name: string,
  manpower: number,             // 🆕 Porcentaje para cotizaciones
  manpowerActual: number,       // 🆕 Costo real fijo para trabajadores
  m2: number,                   // 🆕 Costo por m² de mano de obra de vidrio (default: 100)
  materials: [
    { id: string, formula: string, name: string }
  ],
  chapes: [
    { id: string, formula: string, name: string }
  ],
  glasses: [
    { id: string, formula: string, name: string }
  ]
}
```

### Vidrio
```javascript
{
  id: string,
  name: string,
  price: number,
  status: "active" | "inactive"  // Para soft delete
}
```

### Entrada de Diario
```javascript
{
  id: string,
  fecha: string,
  tipo: "gasto" | "pago",
  categoria: string,
  descripcion: string,
  monto: number,
  activo: boolean  // Para soft delete
}
```

## 🆕 Sistema Dual de Mano de Obra

### Descripción General (Implementado Diciembre 2024)

El sistema implementa una separación clara entre los costos de mano de obra mostrados al cliente en cotizaciones y los costos reales pagados a los trabajadores en órdenes de trabajo.

### Campos del Sistema

#### 1. `manpower` (Porcentaje para Cotizaciones)
- **Uso**: Cálculos de cotización mostrados al cliente
- **Tipo**: Número (porcentaje)
- **Aplicación**: Se multiplica por el costo de materiales
- **Ejemplo**: Si `manpower = 15`, se aplica 15% sobre materiales
- **Obligatorio**: Sí
- **Visible en**: Presupuestos, cotizaciones, vista de cliente

#### 2. `manpowerActual` (Costo Real Fijo)
- **Uso**: Pagos reales a trabajadores en órdenes de trabajo
- **Tipo**: Número (monto fijo)
- **Aplicación**: Valor directo sin cálculos adicionales
- **Ejemplo**: Si `manpowerActual = 500`, se pagan $500 al trabajador
- **Obligatorio**: No (valor por defecto: 0)
- **Visible en**: Órdenes de trabajo, reportes internos

#### 3. `m2` (Costo por m² de Vidrio) - 🆕 Junio 2025
- **Uso**: Costo de mano de obra por metro cuadrado de vidrio
- **Tipo**: Número (monto por m²)
- **Aplicación**: Se multiplica por el área total de vidrio
- **Ejemplo**: Si `m2 = 100`, se cobran $100 por cada m² de vidrio
- **Obligatorio**: No (valor por defecto: 100)
- **Visible en**: Cálculos de vidrio, órdenes de trabajo
- **Reemplaza**: La constante global `GLASS_LABOR_COST_PER_M2`

### Flujo de Implementación

#### En Modelos (`/sistema/modelos`)
```javascript
// Estructura de datos en Firestore
{
  name: "Ventana Corrediza",
  manpower: "15",           // 15% sobre materiales para cotización
  manpowerActual: "450",    // $450 costo real para trabajador
  materials: [...],
  chapes: [...],
  glasses: [...]
}
```

#### En Presupuestos (`/sistema/presupuestos`)
```javascript
// Cálculos diferenciados
const laborCost = parseFloat(modelData.manpower || "0") * materialsCalc.price; // Para cliente
const laborCostActual = parseFloat(modelData.manpowerActual || "0"); // Para interno

// Almacenamiento dual en detalles
details: {
  materials: {...},
  chapes: {...},
  glasses: {...},
  laborCost: laborCost,         // Costo mostrado al cliente
  laborCostActual: laborCostActual  // Costo real del trabajador
}
```

#### En Proyectos (`/sistema/proyectos`)
```javascript
// Edición granular por elemento
<TextField
  label="Costo de Mano de Obra para Cotización"
  value={editingModel.laborCostSelected}
  helperText={`Costo calculado original: $${editingModel.details?.laborCost?.toFixed(2) || '0.00'}`}
/>

<TextField
  label="Costo Real de Mano de Obra"
  value={editingModel.laborCostActual}
  helperText="Costo que se pagará realmente al trabajador (para órdenes de trabajo)"
/>
```

### Características del Sistema

#### ✅ **Separación de Contextos**
- **Cotizaciones**: Solo usa `manpower` (porcentaje)
- **Órdenes de trabajo**: Solo usa `manpowerActual` (costo fijo)
- **Nunca se cruzan**: Cada valor se usa en su contexto apropiado

#### ✅ **Backwards Compatibility**
- **Modelos existentes**: Se asigna valor por defecto "0" a `manpowerActual`
- **Migración suave**: No requiere actualización masiva de datos
- **Funcionalidad previa**: Se mantiene intacta

#### ✅ **Validación y UX**
- **Campos diferenciados**: Labels y helper texts específicos
- **Validación numérica**: Ambos campos validan tipos de datos
- **Feedback visual**: Mensajes de error específicos por campo

#### ✅ **Integración Completa**
- **Todos los módulos**: Presupuestos, proyectos, modelos actualizados
- **Cálculos coherentes**: Cada módulo usa el valor correcto
- **Nomenclatura consistente**: `manpowerActual` en toda la aplicación

### API de Subida de Imágenes

#### Endpoint: `/api/upload-image`
```javascript
// POST /api/upload-image
// Body: FormData with 'file' and 'modelId'
// Response: { message: string, path: string }

// Ejemplo de uso desde frontend:
const uploadImage = async (file, modelId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('modelId', modelId);
  
  const response = await fetch('/api/upload-image', {
    method: 'POST',
    body: formData,
  });
  
  return response.json();
};
```

#### Características
- **Compatible con Vercel**: Usa serverless functions
- **Gestión de errores**: Manejo completo de errores y validaciones
- **Estructura de archivos**: Guarda en `/public/images/{modelId}.png`
- **Creación de directorios**: Crea automáticamente carpetas necesarias
- **Feedback al usuario**: Notificaciones de éxito/error

### Excepciones del Sistema

#### Vidrios
- **Mantiene lógica original**: Pago por m² sin cambios
- **No afectado**: El sistema dual no aplica a productos de vidrio
- **Compatibilidad**: Coexiste sin conflictos con el nuevo sistema

### Beneficios Implementados

1. **📊 Transparencia Financiera**
   - Separación clara entre costos de cotización y reales
   - Mejor control de márgenes y gastos internos

2. **💼 Gestión Empresarial**
   - Cotizaciones competitivas con márgenes controlados
   - Pagos justos a trabajadores basados en costos reales

3. **🔄 Flexibilidad Operativa**
   - Ajuste independiente de precios de venta y costos internos
   - Capacidad de ofrecer descuentos sin afectar pagos de trabajadores

4. **📈 Escalabilidad**
   - Sistema preparado para futuras mejoras
   - Estructura de datos extensible

## Patrones de Desarrollo

### 1. Soft Delete
Implementado en `vidrios` y `diario`:
```javascript
// En lugar de eliminar
await deleteDoc(doc(db, "vidrios", id));

// Se marca como inactivo
await updateDoc(doc(db, "vidrios", id), { 
  status: "inactive" 
});
```

### 2. Navegación Consistente
Layout principal en `/sistema/layout.tsx`:
- AppBar superior con logo
- Drawer lateral con navegación por categorías
- Separación visual entre "Gestión Principal" e "Inventario"

### 3. Gestión de Estado
Uso consistente de React hooks:
```javascript
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(true);
const [snackbar, setSnackbar] = useState({ 
  open: false, 
  message: "", 
  severity: "success" 
});
```

### 4. Cálculos con mathjs
Evaluación segura de fórmulas:
```javascript
import { evaluate } from "mathjs";

const result = evaluate(formula, {
  ALTO: dimensions.height,
  ANCHO: dimensions.width,
  PRECIO: price,
  TRAMO: length
});
```

### 6. Elementos Individuales en Presupuestos
Nuevo patrón para agregar elementos por separado:
```javascript
// Estructura de elemento individual en carrito
const individualItem = {
  id: string,
  type: "individual",
  itemType: "material" | "herraje" | "vidrio",
  itemId: string,
  itemData: {
    name: string,
    quantity: number,
    quantityType: string,
    unitPrice: number,
    total: number,
    // Propiedades específicas según tipo
    meters?: number,        // materiales
    tramo?: number,         // materiales
    dimensions?: object,    // vidrios
    area?: number          // vidrios
  }
};
```

### 7. Carrito Híbrido
Sistema que combina modelos completos y elementos individuales:
```javascript
const getCartTotal = () => {
  return cart.reduce((total, item) => {
    if (item.type === "individual") {
      return total + item.itemData.total;
    } else {
      return total + item.calculations.totalGeneral;
    }
  }, 0);
};
```

### 8. Interfaz Flotante para Elementos Individuales
Sistema de botones flotantes categorizados:
```javascript
// Botones con colores específicos por tipo
const buttonConfig = {
  material: { color: "#4caf50", label: "Material" },
  herraje: { color: "#ff9800", label: "Herraje" }, 
  vidrio: { color: "#2196f3", label: "Vidrio" }
};
```

### 9. Validación Dinámica por Tipo
Validaciones específicas según el tipo de elemento:
```javascript
const validateItem = (type, data) => {
  switch(type) {
    case "material":
      return data.selectedMaterial && data.quantity > 0;
    case "herraje":
      return data.selectedHerraje && data.quantity >= 1;
    case "vidrio":
      return data.selectedVidrio && 
        (data.quantityType === "m2" ? data.quantity > 0 : 
         data.dimensions.height > 0 && data.dimensions.width > 0);
  }
};
```
- Diálogos de confirmación
- Tablas con acciones CRUD
- Snackbars para feedback
- Cards para visualización de datos

### 10. Flujo de Activación de Proyectos
Workflow específico para activar proyectos con gestión de pagos:

```javascript
// 1. Cambio de estado de "Cotización" a "Activo"
const handleStatusChange = async (projectId, newStatus) => {
  if (originalStatus === "quotation" && newStatus === "active") {
    // Mostrar diálogo de activación con pago inicial
    setActivatingProject(project);
    setInitialPayment(project.total * 0.5); // 50% sugerido
    setShowActivateDialog(true);
  }
};

// 2. Activación con pago inicial
const activateProject = async () => {
  const activatedProject = {
    ...project,
    status: "active",
    debt: project.total - initialPayment,
    payments: initialPayment > 0 ? [{
      date: new Date().toISOString(),
      amount: initialPayment,
      description: "Anticipo inicial",
      method: "efectivo"
    }] : []
  };
  
  await updateDoc(doc(db, "projects", projectId), activatedProject);
};

// 3. Gestión de pagos posteriores
const addPayment = async (payment) => {
  const newDebt = Math.max(0, currentDebt - payment.amount);
  const updatedPayments = [...project.payments, payment];
  
  await updateDoc(doc(db, "projects", projectId), {
    debt: newDebt,
    payments: updatedPayments
  });
};
```

### 11. Estados de Elementos (Per-item Status)
Sistema granular de seguimiento por elemento:

```javascript
// Estados disponibles para cada elemento
const ITEM_STATUSES = {
  pendiente: "Pendiente",      // Elemento sin iniciar
  enProceso: "En Proceso",     // En fabricación/preparación
  instalado: "Instalado",     // Ya instalado en sitio
  revisado: "Revisado"        // Verificado y aprobado
};

// Estructura de elemento con estado
const projectItem = {
  ...itemData,
  status: "pendiente",
  assignedEmployeeId: "employee123",
  area: "Sala principal"
};

// Actualización de estado de elemento
const updateItemStatus = async (projectId, itemIndex, newStatus, assignedEmployee) => {
  const updatedItems = [...project.items];
  updatedItems[itemIndex] = {
    ...updatedItems[itemIndex],
    status: newStatus,
    assignedEmployeeId: assignedEmployee
  };
  
  await updateDoc(doc(db, "projects", projectId), {
    items: updatedItems
  });
};
```

### 13. 🆕 Sistema Dual de Mano de Obra
Patrón implementado para separar costos de cotización y pagos reales:

```javascript
// Cálculo diferenciado en presupuestos
const calculateLaborCosts = (modelData, materialsPrice) => {
  const laborCost = parseFloat(modelData.manpower || "0") * materialsPrice; // Para cotización
  const laborCostActual = parseFloat(modelData.manpowerActual || "0"); // Para trabajador
  
  return {
    laborCost,      // Se muestra al cliente
    laborCostActual // Se usa internamente
  };
};

// Almacenamiento dual en proyectos
const projectItem = {
  ...itemData,
  laborCostSelected: laborCost,     // Costo de cotización
  laborCostActual: laborCostActual, // Costo real
  details: {
    materials: {...},
    laborCost: laborCost,           // Valor original de cotización
    laborCostActual: laborCostActual // Valor real para trabajador
  }
};

// Validación específica por contexto
const validateLaborCosts = (formData) => {
  const errors = [];
  
  if (!formData.manpower || isNaN(formData.manpower)) {
    errors.push("La mano de obra (porcentaje) es obligatoria y debe ser numérica");
  }
  
  if (formData.manpowerActual && isNaN(formData.manpowerActual)) {
    errors.push("La mano de obra real debe ser un número válido");
  }
  
  return errors;
};
```

### 14. 🆕 API de Subida de Archivos para Vercel
Patrón para manejo de archivos en entornos serverless:

```javascript
// Endpoint API compatible con Vercel
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const modelId = formData.get('modelId');
    
    // Validación de entrada
    if (!file || !modelId) {
      return NextResponse.json({ error: 'File and modelId are required' }, { status: 400 });
    }
    
    // Procesamiento del archivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Estructura de carpetas automática
    const publicPath = path.join(process.cwd(), 'public', 'images');
    await mkdir(publicPath, { recursive: true });
    
    // Guardado con nombre consistente
    const filePath = path.join(publicPath, `${modelId}.png`);
    await writeFile(filePath, buffer);
    
    return NextResponse.json({
      message: 'Image uploaded successfully',
      path: `/images/${modelId}.png`
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}

// Integración desde frontend
const handleImageUpload = async (file, modelId) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('modelId', modelId);
    
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) throw new Error('Upload failed');
    
    const result = await response.json();
    console.log('Image uploaded:', result.path);
  } catch (error) {
    console.error('Error uploading image:', error);
    // Manejo de errores con feedback al usuario
  }
};
```

### 15. 🆕 Validación y UX Diferenciada
Patrón para manejar campos relacionados con diferentes propósitos:

```javascript
// Configuración de campos con contexto específico
const fieldConfigs = {
  manpower: {
    label: "Mano de Obra (% sobre materiales)",
    helperText: "Porcentaje que se aplicará sobre el costo de materiales para la cotización",
    required: true,
    type: "percentage"
  },
  manpowerActual: {
    label: "Mano de Obra Real (Costo Fijo)",
    helperText: "Costo real que se pagará al trabajador (solo para órdenes de trabajo)",
    required: false,
    type: "currency"
  }
};

// Renderizado dinámico con configuración
const renderLaborFields = () => {
  return Object.entries(fieldConfigs).map(([fieldName, config]) => (
    <TextField
      key={fieldName}
      name={fieldName}
      label={config.label}
      helperText={config.helperText}
      required={config.required}
      type="number"
      inputProps={{
        step: config.type === "percentage" ? "0.01" : "0.01",
        min: "0"
      }}
      // ... otros props
    />
  ));
};
```

## Convenciones de Código

### Nomenclatura
- **Archivos**: kebab-case (`calculadora-vidrios/`)
- **Componentes**: PascalCase (`ModelsPage`)
- **Variables**: camelCase (`selectedProject`)
- **Constantes**: UPPER_CASE (`DEFAULT_DIMENSIONS`)

### Estructura de Componentes
```javascript
"use client";
import React, { useState, useEffect } from "react";
import { /* Firebase imports */ } from "firebase/firestore";
import { db } from "../../../../firebase";
import { /* MUI imports */ } from "@mui/material";

export default function ComponentName() {
  // Estados
  const [data, setData] = useState([]);
  
  // Efectos
  useEffect(() => {
    fetchData();
  }, []);
  
  // Funciones
  const fetchData = async () => {
    // Lógica de Firebase
  };
  
  // Render
  return (
    <Box sx={{ padding: 3 }}>
      {/* JSX */}
    </Box>
  );
}
```

### Gestión de Errores
```javascript
try {
  await operacionFirebase();
  setSnackbar({
    open: true,
    message: "Operación exitosa",
    severity: "success"
  });
} catch (error) {
  console.error("Error:", error);
  setSnackbar({
    open: true,
    message: "Error en la operación",
    severity: "error"
  });
}
```

## Configuración y Despliegue

### Variables de Entorno
Firebase está configurado directamente en `firebase.js` (en producción debería usar variables de entorno).

### Scripts Disponibles
```bash
npm run dev        # Desarrollo con Turbopack
npm run build      # Construcción para producción
npm run start      # Servidor de producción
npm run lint       # Verificación de código
```

### Archivos de Configuración
- `.eslintignore`: Excluye `.next/`, `node_modules/`, etc.
- `next.config.ts`: Configuración de Next.js
- `postcss.config.mjs`: Configuración de PostCSS
- `tsconfig.json`: Configuración de TypeScript

## Mejores Prácticas

### 1. Seguridad
- Validación de datos en frontend
- Manejo de errores apropiado
- No exposición de claves sensibles

### 2. Performance
- Uso de React.memo para componentes pesados
- Lazy loading de imágenes
- Paginación en listas grandes

### 3. UX/UI
- Feedback inmediato con Snackbars
- Estados de carga
- Confirmaciones para acciones destructivas
- Diseño responsivo

### 4. Mantenibilidad
- Separación de lógica de negocio
- Componentes reutilizables
- Documentación en código
- Convenciones consistentes

## Puntos de Extensión

### Agregar Nuevo Módulo
1. Crear carpeta en `/src/app/sistema/[modulo]/`
2. Implementar `page.js` siguiendo convenciones
3. Agregar entrada en `layout.tsx` (menuItems)
4. Actualizar icono en dashboard principal

### Nueva Colección de Firebase
1. Definir estructura de datos
2. Implementar CRUD básico
3. Agregar validaciones
4. Integrar con módulos existentes

### Nuevos Cálculos
1. Extender fórmulas en modelos
2. Actualizar lógica de evaluación
3. Validar resultados
4. Documentar variables disponibles

## Solución de Problemas Comunes

### Error de Build
- Verificar que `.eslintignore` excluya `.next/`
- Revisar imports de TypeScript
- Validar sintaxis en archivos modificados

### Problemas de Firebase
- Verificar conexión a internet
- Revisar configuración en `firebase.js`
- Validar permisos de Firestore

### Errores de Cálculo
- Verificar sintaxis de fórmulas matemáticas
- Validar que todas las variables estén definidas
- Revisar tipos de datos (string vs number)

## Contacto y Mantenimiento

Este sistema fue diseñado para ser intuitivo y fácil de mantener. Para modificaciones:

1. **Cambios menores**: Actualizar directamente los archivos correspondientes
2. **Nuevas funcionalidades**: Seguir los patrones establecidos
3. **Problemas críticos**: Revisar logs de consola y Firebase

La arquitectura modular permite extensiones sin afectar módulos existentes. Cada página es independiente pero comparte componentes y servicios comunes.

---

**Fecha de documentación**: Diciembre 2024  
**Última actualización**: Julio 2025 - Sistema de Edición Completa de Proyectos implementado  
**Versión del sistema**: 0.4.0  
**Nuevas características**: Resumen por categorías, dimensiones en centímetros, selección de precios de vidrio, totales corregidos  
**Mantenido por**: Equipo de desarrollo Aluminios San Francisco

### 🆕 Changelog v0.4.0 (Julio 2025)

#### Nuevas Funcionalidades Implementadas
- ✅ **Resumen por Categorías**: Nuevo panel que muestra totales reales por materiales, herrajes, vidrios y mano de obra
- ✅ **Dimensiones en Centímetros**: Los modelos ahora se agregan con dimensiones en centímetros (se convierten automáticamente a metros para cálculos)
- ✅ **Selección de Precio para Vidrios**: Al agregar vidrios individuales, permite elegir entre "precio instalado" y "precio de corte"
- ✅ **Imagen de Modelo**: Muestra la imagen del modelo al agregarlo a un proyecto
- ✅ **Totales Corregidos**: Los totales por categorías ahora se calculan y muestran correctamente (no más ceros)
- ✅ **Cálculo de Materiales Corregido**: Los materiales individuales ahora se calculan y almacenan correctamente (precio por metro × metros o precio por tramo × tramos)

#### Mejoras Técnicas Implementadas
- **Función `getProjectCategoricalTotals()`**: Calcula correctamente los totales por categoría tanto para modelos completos como elementos individuales
- **Conversión automática de unidades**: Las dimensiones se almacenan en cm pero se convierten a metros para los cálculos de fórmulas
- **Manejo dual de precios**: Los vidrios individuales pueden usar precio instalado o de corte según la selección
- **Interfaz mejorada**: Campos con helper text específicos y validación adecuada
- **Cálculo de área preciso**: Para vidrios por dimensiones, convierte cm² a m² automáticamente
- **Cálculo de materiales corregido**: En `confirmAddIndividualItem`, ahora calcula correctamente el `unitPrice` según el tipo de cantidad (metros/tramos)

#### Funcionalidades de Edición Preservadas
- ✅ **Eliminación de modelos**: Solo en proyectos de "Cotización"
- ✅ **Re-cotización completa**: Modificación de dimensiones, vidrios y colores con recálculo automático
- ✅ **Agregar elementos individuales**: Materiales, herrajes y vidrios por separado
- ✅ **Restricciones de edición**: Solo área, ubicación, colaborador y estado en modelos existentes

#### Beneficios de Negocio
- 📊 **Transparencia Visual**: Resumen claro de costos por categoría en cada proyecto
- 🎯 **Precisión en Dimensiones**: Entrada intuitiva en centímetros para mayor precisión
- 💰 **Flexibilidad de Precios**: Selección apropiada entre precios de corte e instalación para vidrios
- 🖼️ **Referencia Visual**: Imagen del modelo durante la configuración para evitar errores
- ✅ **Totales Correctos**: Eliminación de los totales en cero que causaban confusión
- 🔢 **Cálculos Precisos**: Materiales individuales ahora se calculan y almacenan correctamente según su tipo

#### 🎯 Funcionalidades de Edición Avanzada - COMPLETADO
Todas las funcionalidades solicitadas han sido implementadas exitosamente:

1. **✅ Selección de Precio para Vidrios**: Al agregar vidrios individuales, permite elegir entre "precio instalado" y "precio de corte"
2. **✅ Dimensiones en Centímetros**: Los modelos se agregan con dimensiones en centímetros y muestran la imagen del modelo
3. **✅ Totales Corregidos**: Los totales para materiales, herrajes y vidrios se calculan y muestran correctamente
4. **✅ Eliminación Restringida**: Solo se pueden eliminar modelos de proyectos en estado "Cotización"
5. **✅ Edición Limitada**: Solo se puede editar área, ubicación, colaborador asignado y estado del modelo
6. **✅ Cálculos de Materiales**: Los materiales individuales se calculan y almacenan correctamente según el tipo de cantidad

### 🆕 Changelog v0.3.0 (Julio 2025)

#### Nuevas Funcionalidades - Módulo de Proyectos
- ✅ **Edición Completa de Cotizaciones**: Capacidad total de edición para proyectos en estado "Cotización"
- ✅ **Eliminación de Modelos**: Permite eliminar cualquier modelo/elemento de proyectos en cotización
- ✅ **Re-cotización Avanzada**: Modificación completa de dimensiones, vidrios y colores con recálculo automático
- ✅ **Agregar Elementos Individuales**: Adición de materiales, herrajes y vidrios por separado
- ✅ **Cálculos en Tiempo Real**: Actualización inmediata de totales y desgloses durante la edición
- ✅ **Validaciones Exhaustivas**: Prevención de errores con feedback específico al usuario
- ✅ **Interfaz Contextual**: Botones y acciones disponibles según el estado del proyecto

#### Funcionalidades Específicas Implementadas
- **Gestión de Materiales Individuales**: Adición por metros o tramos con cálculo automático
- **Gestión de Herrajes Individuales**: Adición por piezas con pricing unitario
- **Gestión de Vidrios Individuales**: Adición por m² directos o por dimensiones calculadas
- **Recálculo Automático**: Todos los totales del proyecto se actualizan automáticamente
- **Preservación de Datos**: Información original mantenida como referencia durante ediciones
- **Diálogos Especializados**: Formularios específicos para cada tipo de operación

#### Mejoras Técnicas
- ✅ **Estados Granulares**: Cada dialog mantiene su propio estado independiente
- ✅ **Validación Dinámica**: Verificación de datos en cada paso del proceso
- ✅ **Integración Completa**: Funciona con todos los tipos de elementos existentes
- ✅ **Feedback Inmediato**: Notificaciones de éxito/error para cada operación
- ✅ **Cálculos Consistentes**: Misma lógica de cálculo que el módulo de presupuestos
- ✅ **Manejo de Errores**: Captura y manejo apropiado de errores con mensajes informativos

#### Beneficios de Negocio
- 🔄 **Flexibilidad Total**: Modificación completa de cotizaciones sin perder datos
- 📊 **Control Preciso**: Gestión granular de cada elemento en los proyectos
- 💼 **Eficiencia Operativa**: Reducción de tiempo en modificaciones de cotizaciones
- 🎯 **Precisión**: Cálculos exactos y actualizados en tiempo real
- 📈 **Escalabilidad**: Base sólida para futuras expansiones del sistema

### 🆕 Changelog v0.2.0 (Junio 2025)

#### Nuevas Funcionalidades
- ✅ **Sistema Dual de Mano de Obra**: Separación entre costos de cotización (`manpower`) y costos reales (`manpowerActual`)
- ✅ **Costo por m² de Vidrio Personalizable**: Campo `m2` por modelo que reemplaza la constante global
- ✅ **API de Subida de Imágenes**: Endpoint `/api/upload-image` compatible con Vercel
- ✅ **Validaciones Mejoradas**: Campos específicos con helper text y validación por contexto
- ✅ **Integración Completa**: Todos los módulos (modelos, presupuestos, proyectos) actualizados

#### Mejoras Técnicas
- ✅ **Backwards Compatibility**: Compatibilidad total con datos existentes
- ✅ **Nomenclatura Consistente**: Uso de `manpowerActual` y `m2` en toda la aplicación
- ✅ **Eliminación de Constantes Globales**: Reemplazo de `GLASS_LABOR_COST_PER_M2` por valores por modelo
- ✅ **Serverless Functions**: Implementación de API Routes para Vercel
- ✅ **UX Diferenciada**: Interfaces específicas para cada tipo de costo

#### Beneficios de Negocio
- 📊 **Control Financiero**: Mejor gestión de márgenes y costos internos
- 💼 **Transparencia**: Separación clara entre costos de venta y pagos reales
- 🔄 **Flexibilidad**: Ajustes independientes de precios y costos laborales por modelo
- 🎯 **Personalización**: Cada modelo puede tener su propio costo de vidrio por m²
- 📈 **Escalabilidad**: Base preparada para futuras expansiones del sistema

### 17. 🆕 Gestión de Dimensiones y Precios Mejorada (Julio 2025)
Implementación de mejoras en la interfaz y cálculos para mayor precisión y usabilidad:

#### Dimensiones en Centímetros
```javascript
// Al agregar modelos, las dimensiones se ingresan en centímetros
const addModelToProject = async () => {
  const newModel = {
    modelId: modelData.id,
    modelName: modelData.name,
    dimensions: { 
      height: dimensions.height, 
      width: dimensions.width,
      unit: "cm" // Marcador de unidad
    },
    // ... otros campos
  };
};

// En cálculos, se convierten automáticamente a metros
const getCalculations = () => {
  const heightInMeters = parseFloat(dimensions.height) / 100;
  const widthInMeters = parseFloat(dimensions.width) / 100;
  
  // Usar en fórmulas
  const meterage = calculatePrice(material.formula, {
    ALTO: heightInMeters,
    ANCHO: widthInMeters,
    // ...
  });
};
```

#### Selección de Precios para Vidrios
```javascript
// Estado para tipo de precio
const [individualItemPriceType, setIndividualItemPriceType] = useState("installed");

// Cálculo según tipo seleccionado
const vidrioPrice = parseFloat(individualItemPriceType === "installed" 
  ? (selectedItem.priceInstalled || "0") 
  : (selectedItem.price || "0"));

// Para elementos individuales por dimensiones (cm² → m²)
if (individualItemQuantityType === "dimensiones") {
  area = (parseFloat(individualItemDimensions.height) * parseFloat(individualItemDimensions.width)) / 10000;
  vidrioTotal = area * vidrioPrice;
}
```

#### Resumen por Categorías
```javascript
// Función para calcular totales reales por categoría
const getProjectCategoricalTotals = (project) => {
  if (!project || !project.items) return { materials: 0, herrajes: 0, vidrios: 0, laborCost: 0, total: 0 };
  
  return project.items.reduce((acc, item) => {
    if (item.type === 'individual') {
      // Elementos individuales por tipo
      switch (item.itemType) {
        case 'material':
          acc.materials += item.total || 0;
          break;
        case 'herraje':
          acc.herrajes += item.total || 0;
          break;
        case 'vidrio':
          acc.vidrios += item.total || 0;
          break;
      }
    } else {
      // Modelos completos - desglose por categoría
      acc.materials += item.details?.materials?.price || 0;
      acc.herrajes += item.details?.chapes?.price || 0;
      acc.vidrios += item.details?.glasses?.price || 0;
      acc.laborCost += item.laborCostSelected || item.details?.laborCost || 0;
    }
    acc.total += item.total || 0;
    return acc;
  }, { materials: 0, herrajes: 0, vidrios: 0, laborCost: 0, total: 0 });
};

// Renderizado en interfaz
const totals = getProjectCategoricalTotals(selectedProject);
// Muestra totales reales para cada categoría
```

#### Interfaz de Usuario Mejorada
```javascript
// Campos con helper text específico
<TextField
  label="Alto (centímetros)"
  type="number"
  inputProps={{ min: "1", step: "1" }}
  helperText="Ingrese las dimensiones en centímetros"
/>

// Selección de tipo de precio con feedback visual
<TextField
  select
  label="Tipo de Precio"
  value={individualItemPriceType || "installed"}
>
  <MenuItem value="installed">Precio Instalado</MenuItem>
  <MenuItem value="cut">Precio de Corte</MenuItem>
</TextField>

// Cálculo dinámico con área convertida
<Typography variant="body2">
  Área calculada: {(parseFloat(height || 0) * parseFloat(width || 0) / 10000).toFixed(2)} m²
</Typography>
```

### 16. 🆕 Patrones de Edición de Proyectos (Julio 2025)
Implementación completa de capacidades de edición para proyectos en estado "Cotización":

#### Gestión de Estado para Edición
```javascript
// Estados para re-cotización de modelos
const [showRecalcDialog, setShowRecalcDialog] = useState(false);
const [recalcModel, setRecalcModel] = useState(null);
const [recalcDimensions, setRecalcDimensions] = useState({ height: "", width: "" });
const [recalcSelectedGlass, setRecalcSelectedGlass] = useState(null);
const [recalcSelectedColor, setRecalcSelectedColor] = useState(null);

// Estados para elementos individuales
const [showAddIndividualItemDialog, setShowAddIndividualItemDialog] = useState(false);
const [individualItemType, setIndividualItemType] = useState("material");
const [selectedIndividualMaterial, setSelectedIndividualMaterial] = useState(null);
const [selectedIndividualHerraje, setSelectedIndividualHerraje] = useState(null);
const [selectedIndividualVidrio, setSelectedIndividualVidrio] = useState(null);
const [individualItemQuantity, setIndividualItemQuantity] = useState(1);
const [individualItemQuantityType, setIndividualItemQuantityType] = useState("metros");
```

#### Función de Eliminación de Modelos
```javascript
const handleDeleteModel = async (project, modelIndex) => {
  if (project.status !== 'quotation') {
    setSnackbar({
      open: true,
      message: "Solo se pueden eliminar modelos en proyectos de cotización.",
      severity: "error"
    });
    return;
  }

  const updatedItems = [...project.items];
  updatedItems.splice(modelIndex, 1);
  const newTotal = updatedItems.reduce((sum, item) => sum + (item.total || 0), 0);

  await updateDoc(doc(db, "projects", project.id), {
    items: updatedItems,
    total: newTotal
  });

  setSnackbar({
    open: true,
    message: "Modelo eliminado del proyecto exitosamente.",
    severity: "success"
  });
};
```

#### Función de Re-cotización
```javascript
const handleRecalcModel = async (project, modelIndex) => {
  if (project.status !== 'quotation') return;

  const modelToRecalc = project.items[modelIndex];
  const modelDoc = await getDoc(doc(db, "models", modelToRecalc.modelId));
  
  if (modelDoc.exists()) {
    setRecalcModel({ ...modelToRecalc, index: modelIndex, projectId: project.id });
    setModelData(modelDoc.data());
    setRecalcDimensions(modelToRecalc.dimensions || { height: "1", width: "1" });
    setRecalcSelectedGlass(modelToRecalc.selectedGlass || null);
    setRecalcSelectedColor(modelToRecalc.selectedColor || null);
    setShowRecalcDialog(true);
  }
};

const confirmRecalcModel = async () => {
  try {
    const project = projects.find(p => p.id === recalcModel.projectId);
    if (!project) return;

    const calculations = getRecalcCalculations();
    if (!calculations) return;

    const updatedItems = [...project.items];
    updatedItems[recalcModel.index] = {
      ...recalcModel,
      dimensions: { ...recalcDimensions },
      selectedGlass: recalcSelectedGlass,
      selectedColor: recalcSelectedColor,
      total: calculations.totalGeneral,
      details: {
        materials: calculations.materialsCalc,
        chapes: calculations.chapesCalc,
        glasses: calculations.glassesCalc,
        laborCost: calculations.laborCost,
        laborCostActual: calculations.laborCostActual
      }
    };

    const newTotal = updatedItems.reduce((sum, item) => sum + (item.total || 0), 0);

    await updateDoc(doc(db, "projects", recalcModel.projectId), {
      items: updatedItems,
      total: newTotal
    });

    setSnackbar({
      open: true,
      message: "Modelo re-cotizado exitosamente.",
      severity: "success"
    });
    
    setShowRecalcDialog(false);
    fetchProjects();
  } catch (error) {
    console.error("Error re-cotizando modelo:", error);
    setSnackbar({
      open: true,
      message: "Error al re-cotizar el modelo.",
      severity: "error"
    });
  }
};
```

#### Función para Agregar Elementos Individuales
```javascript
const handleAddIndividualItem = (project) => {
  if (project.status !== 'quotation') {
    setSnackbar({
      open: true,
      message: "Solo se pueden agregar elementos a proyectos en cotización.",
      severity: "error"
    });
    return;
  }

  setAddingToProject(project);
  setShowAddIndividualItemDialog(true);
};

const confirmAddIndividualItem = async () => {
  try {
    let itemData;
    let selectedItem;

    switch (individualItemType) {
      case "material":
        if (!selectedIndividualMaterial) {
          setSnackbar({ open: true, message: "Selecciona un material.", severity: "error" });
          return;
        }
        selectedItem = selectedIndividualMaterial;
        const materialPrice = parseFloat(selectedItem.price || "0");
        const materialLength = parseFloat(selectedItem.length || "6");
        
        let meters, tramos, materialTotal;
        if (individualItemQuantityType === "metros") {
          meters = individualItemQuantity;
          tramos = meters / materialLength;
          materialTotal = tramos * materialPrice;
        } else {
          tramos = individualItemQuantity;
          meters = tramos * materialLength;
          materialTotal = tramos * materialPrice;
        }

        itemData = {
          type: "individual",
          itemType: "material",
          itemId: selectedItem.id,
          itemName: selectedItem.name,
          quantity: individualItemQuantity,
          quantityType: individualItemQuantityType,
          unitPrice: materialPrice,
          total: materialTotal,
          meters: meters,
          tramo: materialLength,
          status: "cotizacion"
        };
        break;

      case "herraje":
        if (!selectedIndividualHerraje) {
          setSnackbar({ open: true, message: "Selecciona un herraje.", severity: "error" });
          return;
        }
        selectedItem = selectedIndividualHerraje;
        const herrajePrice = parseFloat(selectedItem.price || "0");
        
        itemData = {
          type: "individual",
          itemType: "herraje",
          itemId: selectedItem.id,
          itemName: selectedItem.name,
          quantity: individualItemQuantity,
          quantityType: "piezas",
          unitPrice: herrajePrice,
          total: individualItemQuantity * herrajePrice,
          status: "cotizacion"
        };
        break;

      case "vidrio":
        if (!selectedIndividualVidrio) {
          setSnackbar({ open: true, message: "Selecciona un vidrio.", severity: "error" });
          return;
        }
        selectedItem = selectedIndividualVidrio;
        const vidrioPrice = parseFloat(selectedItem.priceInstalled || "0");
        
        let area, vidrioTotal;
        if (individualItemQuantityType === "m2") {
          area = individualItemQuantity;
          vidrioTotal = individualItemQuantity * vidrioPrice;
        } else {
          if (!individualItemDimensions.height || !individualItemDimensions.width) {
            setSnackbar({ open: true, message: "Ingresa las dimensiones del vidrio.", severity: "error" });
            return;
          }
          area = (parseFloat(individualItemDimensions.height) * parseFloat(individualItemDimensions.width));
          vidrioTotal = area * vidrioPrice;
        }

        itemData = {
          type: "individual",
          itemType: "vidrio",
          itemId: selectedItem.id,
          itemName: selectedItem.name,
          quantity: individualItemQuantity,
          quantityType: individualItemQuantityType,
          unitPrice: vidrioPrice,
          total: vidrioTotal,
          status: "cotizacion",
          dimensions: individualItemQuantityType === "dimensiones" ? { ...individualItemDimensions } : null,
          area: area
        };
        break;

      default:
        setSnackbar({ open: true, message: "Tipo de elemento no válido.", severity: "error" });
        return;
    }

    const project = projects.find(p => p.id === addingToProject.id);
    if (!project) return;

    const updatedItems = [...project.items, itemData];
    const newTotal = updatedItems.reduce((sum, item) => sum + (item.total || 0), 0);

    await updateDoc(doc(db, "projects", addingToProject.id), {
      items: updatedItems,
      total: newTotal
    });

    setSnackbar({
      open: true,
      message: "Elemento agregado al proyecto exitosamente.",
      severity: "success"
    });

    setShowAddIndividualItemDialog(false);
    setAddingToProject(null);
    fetchProjects();
  } catch (error) {
    console.error("Error adding individual item to project:", error);
    setSnackbar({
      open: true,
      message: "Error al agregar el elemento al proyecto.",
      severity: "error"
    });
  }
};
```

#### Interfaz de Usuario Contextual
```javascript
// Botones que solo aparecen en estado "Cotización"
{selectedProject.status === 'quotation' && (
  <>
    {item.type !== 'individual' && (
      <Button
        size="small"
        variant="outlined"
        color="primary"
        onClick={() => handleRecalcModel(selectedProject, index)}
      >
        Re-cotizar
      </Button>
    )}
    <Button
      size="small"
      variant="outlined"
      color="error"
      onClick={() => handleDeleteModel(selectedProject, index)}
    >
      Eliminar
    </Button>
  </>
)}

// Botón para agregar elementos individuales
{selectedProject.status === 'quotation' && (
  <Button
    variant="outlined"
    color="secondary"
    startIcon={<Add />}
    onClick={() => handleAddIndividualItem(selectedProject)}
    size="small"
  >
    Agregar Elemento
  </Button>
)}
```

#### Validación y Cálculos en Tiempo Real
```javascript
const getRecalcCalculations = () => {
  if (!modelData || !recalcSelectedGlass || !recalcDimensions.height || !recalcDimensions.width) {
    return null;
  }

  try {
    const dimensionsObj = {
      height: parseFloat(recalcDimensions.height),
      width: parseFloat(recalcDimensions.width)
    };

    // Cálculo de materiales
    const materialsCalc = calculateMaterials(modelData.materials, dimensionsObj);
    
    // Cálculo de herrajes
    const chapesCalc = calculateChapes(modelData.chapes, dimensionsObj);
    
    // Cálculo de vidrios
    const glassesCalc = calculateGlasses(modelData.glasses, dimensionsObj, recalcSelectedGlass);
    
    // Cálculo de mano de obra
    const laborCost = materialsCalc.price * (parseFloat(modelData.manpower) / 100);
    const laborCostActual = parseFloat(modelData.manpowerActual || "0");
    
    // Cálculo de mano de obra de vidrio
    const glassLaborCost = glassesCalc.meterage * (parseFloat(modelData.m2) || 100);
    
    // Total general
    const totalGeneral = materialsCalc.price + chapesCalc.price + glassesCalc.price + laborCost + glassLaborCost;
    const totalLaborActual = laborCostActual + glassLaborCost;

    return {
      materialsCalc,
      chapesCalc,
      glassesCalc,
      laborCost,
      laborCostActual,
      glassLaborCost,
      totalGeneral,
      totalLaborActual
    };
  } catch (error) {
    console.error("Error calculating:", error);
    return null;
  }
};
```

#### Características Técnicas Implementadas
- **Estado granular**: Cada dialog y operación mantiene su propio estado
- **Validación exhaustiva**: Verificación de datos en cada paso
- **Cálculos consistentes**: Misma lógica de cálculo que presupuestos
- **Actualización reactiva**: Todos los totales se actualizan automáticamente
- **Feedback inmediato**: Notificaciones de éxito/error para cada operación
- **Preservación de datos**: Información original mantenida como referencia
- **Integración completa**: Funciona con todos los tipos de elementos existentes

## 🆕 Mejoras Implementadas en Presupuestos - Julio 2025

### Persistencia del Carrito con localStorage

#### Funcionalidad Implementada
- **Guardado automático**: El carrito se guarda automáticamente en localStorage cada vez que se modifica
- **Restauración automática**: Al cargar la página, el carrito se restaura desde localStorage
- **Persistencia entre sesiones**: El carrito mantiene su contenido aunque se cierre el navegador
- **Limpieza inteligente**: Se limpia automáticamente al guardar un proyecto exitosamente

#### Implementación Técnica
```javascript
// Funciones de persistencia
const saveCartToStorage = (cartData) => {
  localStorage.setItem('aluminios-cart', JSON.stringify(cartData));
};

const loadCartFromStorage = () => {
  const savedCart = localStorage.getItem('aluminios-cart');
  if (savedCart) {
    setCart(JSON.parse(savedCart));
  }
};

// Hook para persistir cambios
useEffect(() => {
  saveCartToStorage(cart);
}, [cart]);
```

### Recotización de Productos en el Carrito

#### Funcionalidad Implementada
- **Botón de edición**: Cada producto de modelo en el carrito tiene un botón para recotizar
- **Diálogo completo**: Interfaz para cambiar dimensiones, vidrio y color
- **Recálculo automático**: Los nuevos valores se calculan usando la lógica existente
- **Vista previa**: Muestra información del producto antes de confirmar
- **Validación**: Solo permite recotizar si todos los campos están completos

#### Estados y Funciones Agregadas
```javascript
// Nuevos estados para recotización
const [showRequoteDialog, setShowRequoteDialog] = useState(false);
const [requoteItem, setRequoteItem] = useState(null);
const [requoteDimensions, setRequoteDimensions] = useState({ height: "", width: "" });
const [requoteGlass, setRequoteGlass] = useState(null);
const [requoteColor, setRequoteColor] = useState(null);

// Función principal de recotización
const handleRequoteConfirm = async () => {
  // Obtiene datos del modelo con nombres resueltos
  // Calcula nuevos valores usando getRecalcCalculations
  // Actualiza el item en el carrito
  // Muestra feedback al usuario
};
```

### Mejoras en la Interfaz de Usuario

#### Carrito Mejorado
- **Indicador de persistencia**: Texto que informa sobre el guardado automático
- **Botón de limpieza**: Opción para vaciar todo el carrito con confirmación
- **Iconos de acción**: Botones diferenciados para editar y eliminar
- **Información de color**: Muestra el color aplicado cuando corresponde
- **Tooltips**: Ayuda contextual en botones de acción

#### Diálogo de Recotización
- **Interfaz intuitiva**: Formulario claro con campos separados por secciones
- **Validación visual**: Campos requeridos marcados y validados
- **Vista previa**: Cálculo de área y resumen de selecciones
- **Consistencia**: Misma lógica de cálculo que el cotizador principal

### Características Técnicas

#### Robustez
- **Manejo de errores**: Captura y muestra errores de manera amigable
- **Validación completa**: Verificación de datos en cada operación
- **Recuperación**: Funciona aunque localStorage no esté disponible
- **Compatibilidad**: Mantiene compatibilidad con carrito existente

#### Performance
- **Persistencia eficiente**: Solo guarda cuando hay cambios reales
- **Cálculos optimizados**: Reutiliza lógica existente sin duplicar código
- **Carga rápida**: Restauración inmediata del carrito al iniciar
- **Memoria mínima**: Limpieza automática para evitar acumulación

### Beneficios Implementados

1. **📱 Continuidad de Trabajo**
   - Los usuarios pueden pausar y continuar su trabajo sin perder datos
   - Navegación libre entre módulos sin pérdida de contexto

2. **✏️ Flexibilidad de Corrección**
   - Corrección inmediata de errores sin rehacer todo el trabajo
   - Comparación fácil entre diferentes opciones

3. **🎯 Mejora en la Experiencia**
   - Feedback visual claro sobre persistencia
   - Confirmaciones para prevenir pérdidas accidentales

4. **🔄 Eficiencia Operativa**
   - Menos tiempo perdido rehaciendo cotizaciones
   - Flujo de trabajo más natural y flexible

### Flujo de Trabajo Actualizado

#### Nuevo Flujo con Persistencia
1. **Agregar productos** → Se guardan automáticamente
2. **Navegar a otros módulos** → Carrito persiste
3. **Regresar a presupuestos** → Carrito restaurado
4. **Modificar productos** → Cambios guardados automáticamente
5. **Guardar proyecto** → Carrito se limpia automáticamente

#### Flujo de Recotización
1. **Abrir carrito** → Ver productos agregados
2. **Clic en editar** → Diálogo con datos actuales
3. **Modificar valores** → Vista previa actualizada
4. **Confirmar cambios** → Producto actualizado en carrito
5. **Continuar trabajo** → Cambios persistidos automáticamente

### Compatibilidad y Migración

#### Retrocompatibilidad
- **Carrito existente**: Funciona con productos ya agregados
- **Proyectos guardados**: Mantiene estructura de datos existente
- **Funcionalidad previa**: Todas las características anteriores intactas

#### Migración Suave
- **Sin cambios requeridos**: Implementación transparente
- **Datos preservados**: Información existente se mantiene
- **Funcionalidad incremental**: Nuevas características se añaden sin afectar las existentes
