import { collection, getDocs, doc, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { db } from "../../../../firebase";

export interface Payment {
  date: string;
  amount: number;
  method: 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque';
  description: string;
}

export interface ProjectItem {
  id: string;
  type: 'model' | 'individual';
  modelId?: string;
  modelName?: string;
  itemType?: 'material' | 'herraje' | 'vidrio';
  itemId?: string;
  itemName?: string;
  area?: string;
  assignedEmployeeId?: string;
  status: 'pendiente' | 'enProceso' | 'instalado' | 'revisado' | 'cotizacion' | 'pagada';
  laborCostSelected?: number;
  laborCostActual?: number;
  m2?: number;
  details?: {
    materials?: ItemDetails;
    chapes?: ItemDetails;
    glasses?: ItemDetails;
    laborCost?: number;
    laborCostActual?: number;
  };
  // For individual items
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  dimensions?: {
    height: number;
    width: number;
  };
}

export interface ItemDetails {
  price: number;
  meterage?: number;
  pieces?: number;
  items?: unknown[];
}

export interface Project {
  id: string;
  name: string;
  customerName: string;
  status: 'quotation' | 'active' | 'completed' | 'cancelled' | 'inactive';
  createdAt: FirebaseTimestamp;
  date: FirebaseTimestamp;
  total: number;
  debt?: number;
  payments?: Payment[];
  items: ProjectItem[];
}

export interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
}

export const loadProjects = async (): Promise<Project[]> => {
  try {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Project, 'id'>)
    } as Project));
  } catch (error) {
    console.error("Error loading projects:", error);
    throw error;
  }
};

export const loadEmployees = async (): Promise<Employee[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "employees"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Employee, 'id'>)
    } as Employee));
  } catch (error) {
    console.error("Error loading employees:", error);
    return [];
  }
};

export interface Employee {
  id: string;
  name: string;
  [key: string]: unknown;
}

export const loadModels = async (): Promise<Model[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "models"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Model, 'id'>)
    } as Model));
  } catch (error) {
    console.error("Error loading models:", error);
    return [];
  }
};

export interface Model {
  id: string;
  name: string;
  [key: string]: unknown;
}

export const loadGlasses = async (): Promise<Glass[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "glasses"));
    return querySnapshot.docs
      .map(doc => ({ id: doc.id, ...(doc.data() as Omit<Glass, 'id'>) } as Glass))
      .filter((glass: Glass) => glass.status !== "inactive");
  } catch (error) {
    console.error("Error loading glasses:", error);
    return [];
  }
};

export interface Glass {
  id: string;
  name: string;
  status?: string;
  [key: string]: unknown;
}

export const loadMaterials = async (): Promise<Material[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "materials"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Material, 'id'>)
    } as Material));
  } catch (error) {
    console.error("Error loading materials:", error);
    return [];
  }
};

export interface Material {
  id: string;
  name: string;
  [key: string]: unknown;
}

export const loadChapes = async (): Promise<Chape[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "chapes"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Chape, 'id'>)
    } as Chape));
  } catch (error) {
    console.error("Error loading chapes:", error);
    return [];
  }
};

export interface Chape {
  id: string;
  name: string;
  [key: string]: unknown;
}

export const updateProjectStatus = async (projectId: string, newStatus: string): Promise<void> => {
  try {
    const updateData = { 
      status: newStatus,
      date: serverTimestamp()
    };

    // IMPORTANT: When setting a project to 'inactive', we preserve all payment history
    // The project will simply be excluded from financial calculations in dashboard/diario
    // but all data (debt, payments) remains intact for when it's reactivated

    await updateDoc(doc(db, "projects", projectId), updateData);
  } catch (error) {
    console.error("Error updating project status:", error);
    throw error;
  }
};

export const updateProject = async (projectId: string, projectData: Partial<Project>): Promise<void> => {
  try {
    const updateData = {
      ...projectData,
      date: serverTimestamp()
    };
    await updateDoc(doc(db, "projects", projectId), updateData);
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

export const activateProject = async (projectId: string, project: Project, initialPayment?: number): Promise<void> => {
  try {
    const updateData = {
      status: 'active',
      date: serverTimestamp(),
      debt: project.total,
      payments: [] as Payment[]
    };

    if (initialPayment && initialPayment > 0) {
      updateData.debt = Math.max(0, project.total - initialPayment);
      updateData.payments = [{
        date: new Date().toISOString(),
        amount: initialPayment,
        method: 'efectivo' as const,
        description: 'Anticipo inicial'
      }];
    }

    await updateDoc(doc(db, "projects", projectId), updateData);
  } catch (error) {
    console.error("Error activating project:", error);
    throw error;
  }
};

export const addPaymentToProject = async (
  projectId: string, 
  project: Project, 
  payment: Payment
): Promise<void> => {
  try {
    const newDebt = Math.max(0, (project.debt || project.total) - payment.amount);
    const updatedPayments = [...(project.payments || []), payment];

    await updateDoc(doc(db, "projects", projectId), {
      debt: newDebt,
      payments: updatedPayments,
      date: serverTimestamp()
    });
  } catch (error) {
    console.error("Error adding payment:", error);
    throw error;
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
};

export const formatDate = (date: FirebaseTimestamp | string | Date | null | undefined): string => {
  if (!date) return 'Fecha no disponible';
  
  let dateObj: Date;
  if (typeof date === 'object' && date !== null && 'toDate' in date) {
    dateObj = date.toDate();
  } else if (typeof date === 'object' && date !== null && 'seconds' in date) {
    const timestampObj = date as unknown as { seconds: number; nanoseconds: number };
    dateObj = new Date(timestampObj.seconds * 1000);
  } else {
    dateObj = new Date(date as string | Date);
  }
  
  return dateObj.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case 'quotation': return 'warning';
    case 'active': return 'success';
    case 'completed': return 'primary';
    case 'cancelled': return 'error';
    case 'inactive': return 'default';
    default: return 'default';
  }
};

export const getStatusText = (status: string): string => {
  switch (status) {
    case 'quotation': return 'Cotización';
    case 'active': return 'Activo';
    case 'completed': return 'Completado';
    case 'cancelled': return 'Cancelado';
    case 'inactive': return 'Inactivo';
    default: return 'Desconocido';
  }
};

export const filterProjects = (projects: Project[], searchQuery: string, showInactive: boolean): Project[] => {
  return projects.filter(project => {
    // Filter by inactive status
    if (!showInactive && project.status === 'inactive') {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        project.name.toLowerCase().includes(query) ||
        project.customerName.toLowerCase().includes(query)
      );
    }

    return true;
  });
};

export const calculateProjectTotal = (items: ProjectItem[]): number => {
  return items.reduce((total, item) => {
    if (item.type === 'model') {
      return total + 
             (item.details?.materials?.price || 0) + 
             (item.details?.chapes?.price || 0) + 
             (item.details?.glasses?.price || 0) + 
             (item.laborCostSelected || 0);
    } else if (item.type === 'individual') {
      return total + (item.totalPrice || 0);
    }
    return total;
  }, 0);
};
