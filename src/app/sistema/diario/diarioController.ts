import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "../../../../firebase";

export interface DiaryEntry {
  id: string;
  fecha: string;
  tipo: 'gasto' | 'pago';
  categoria: string;
  descripcion: string;
  amount?: number; // Para compatibilidad con pagos de proyectos
  observaciones?: string;
  activo: boolean;
  source?: 'diary' | 'project';
  projectId?: string;
  projectName?: string;
  customerName?: string;
  metodo?: string;
  createdAt?: Timestamp;
  date?: Timestamp; // Para compatibilidad con proyectos
  updatedAt?: Timestamp;
}

export interface ProjectPayment {
  id: string;
  projectId: string;
  projectName: string;
  customerName: string;
  fecha: string;
  tipo: 'pago';
  categoria: string;
  descripcion: string;
  amount: number;
  metodo: string;
  observaciones: string;
  source: 'project';
  activo: boolean;
}

// Cargar entradas del diario
export const loadDiaryEntries = async (): Promise<DiaryEntry[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "journal"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      source: 'diary'
    } as DiaryEntry));
  } catch (error) {
    console.error("Error loading diary entries:", error);
    throw error;
  }
};

// Cargar payments de proyectos como entradas
export const loadProjectPayments = async (): Promise<ProjectPayment[]> => {
  try {
    const projectsSnapshot = await getDocs(collection(db, "projects"));
    const paymentsData: ProjectPayment[] = [];
    
    projectsSnapshot.docs.forEach(doc => {
      const project = { id: doc.id, ...doc.data() } as {
        id: string;
        name: string;
        customerName: string;
        status: string;
        payments?: Array<{ date: string; amount: number; method: string; description?: string }>;
      };
      
      // Solo considerar proyectos activos (no inactivos)
      if (project.status !== "inactive" && project.payments && Array.isArray(project.payments)) {
        project.payments.forEach((payment: { date: string; amount: number; method: string; description?: string }, index: number) => {
          paymentsData.push({
            id: `${project.id}_${payment.date}_${index}`,
            projectId: project.id,
            projectName: project.name,
            customerName: project.customerName,
            fecha: payment.date.split('T')[0], // Convertir ISO a fecha
            tipo: "pago",
            categoria: "Pagos de Proyectos",
            descripcion: `Pago proyecto: ${project.name} - ${project.customerName}`,
            amount: payment.amount,
            metodo: payment.method,
            observaciones: payment.description || "",
            source: "project",
            activo: true
          });
        });
      }
    });
    
    return paymentsData;
  } catch (error) {
    console.error("Error loading project payments:", error);
    throw error;
  }
};

// Combinar entradas del diario con payments de proyectos
export const getCombinedEntries = async (): Promise<DiaryEntry[]> => {
  try {
    const [diaryEntries, projectPayments] = await Promise.all([
      loadDiaryEntries(),
      loadProjectPayments()
    ]);
    
    return [...diaryEntries, ...projectPayments];
  } catch (error) {
    console.error("Error loading combined entries:", error);
    throw error;
  }
};

// Filtrar entradas combinadas
export const filterCombinedEntries = (
  entries: DiaryEntry[],
  searchQuery: string,
  filterType: string,
  filterCategory: string,
  showInactive: boolean
): DiaryEntry[] => {
  return entries.filter(entry => {
    // Filtrar por búsqueda
    const matchesSearch = entry.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        entry.categoria.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (entry.observaciones && entry.observaciones.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filtrar por tipo
    const matchesType = filterType === "all" || entry.tipo === filterType;
    
    // Filtrar por categoría
    const matchesCategory = filterCategory === "all" || entry.categoria === filterCategory;
    
    // Filtrar por estado activo/inactivo
    const matchesStatus = showInactive ? entry.activo === false : entry.activo !== false;
    
    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });
};

// Obtener todas las categorías únicas
export const getAllCategories = (entries: DiaryEntry[]): string[] => {
  const categories = [...new Set(entries.map(entry => entry.categoria))];
  return categories.sort();
};

// Calcular totales
export const calculateTotals = (entries: DiaryEntry[]) => {
  const activeEntries = entries.filter(entry => entry.activo !== false);
  
  const totalGastos = activeEntries
    .filter(entry => entry.tipo === "gasto")
    .reduce((total, entry) => total + entry.amount, 0);
  
  const totalIngresos = activeEntries
    .filter(entry => entry.tipo === "pago")
    .reduce((total, entry) => total + entry.amount, 0);
  
  // Desglose de ingresos por fuente
  const ingresosDiario = activeEntries
    .filter(entry => entry.tipo === "pago" && entry.source === "diary")
    .reduce((total, entry) => total + entry.amount, 0);
  
  const ingresosProyectos = activeEntries
    .filter(entry => entry.tipo === "pago" && entry.source === "project")
    .reduce((total, entry) => total + entry.amount, 0);
  
  const balance = totalIngresos - totalGastos;
  
  return {
    totalGastos,
    totalIngresos,
    ingresosDiario,
    ingresosProyectos,
    balance,
    totalEntries: activeEntries.length
  };
};

// Crear nueva entrada en el diario
export const createDiaryEntry = async (entryData: Partial<DiaryEntry>): Promise<void> => {
  try {
    const newEntry = {
      ...entryData,
      activo: true,
      source: 'diary',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await addDoc(collection(db, "journal"), newEntry);
  } catch (error) {
    console.error("Error creating diary entry:", error);
    throw error;
  }
};

// Actualizar entrada del diario
export const updateDiaryEntry = async (entryId: string, entryData: Partial<DiaryEntry>): Promise<void> => {
  try {
    const updateData = {
      ...entryData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(doc(db, "journal", entryId), updateData);
  } catch (error) {
    console.error("Error updating diary entry:", error);
    throw error;
  }
};

// Desactivar entrada del diario (soft delete)
export const deactivateDiaryEntry = async (entryId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, "journal", entryId), {
      activo: false,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error deactivating diary entry:", error);
    throw error;
  }
};

// Reactivar entrada del diario
export const reactivateDiaryEntry = async (entryId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, "journal", entryId), {
      activo: true,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error reactivating diary entry:", error);
    throw error;
  }
};

// Formatear moneda
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
};

// Formatear fecha
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Obtener color del tipo
export const getTypeColor = (tipo: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  return tipo === 'gasto' ? 'error' : 'success';
};

// Obtener icono del tipo
export const getTypeIcon = (tipo: string): string => {
  return tipo === 'gasto' ? '💸' : '💰';
};
