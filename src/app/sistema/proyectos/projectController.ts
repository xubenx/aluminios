import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
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
    materials?: any;
    chapes?: any;
    glasses?: any;
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

export interface Project {
  id: string;
  name: string;
  customerName: string;
  status: 'quotation' | 'active' | 'completed' | 'cancelled' | 'inactive';
  createdAt: any;
  date: any;
  total: number;
  debt?: number;
  payments?: Payment[];
  items: ProjectItem[];
}

export const loadProjects = async (): Promise<Project[]> => {
  try {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Project));
  } catch (error) {
    console.error("Error loading projects:", error);
    throw error;
  }
};

export const loadEmployees = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "employees"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error loading employees:", error);
    return [];
  }
};

export const loadModels = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "models"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error loading models:", error);
    return [];
  }
};

export const loadGlasses = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "glasses"));
    return querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((glass: any) => glass.status !== "inactive");
  } catch (error) {
    console.error("Error loading glasses:", error);
    return [];
  }
};

export const loadMaterials = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "materials"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error loading materials:", error);
    return [];
  }
};

export const loadChapes = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "chapes"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error loading chapes:", error);
    return [];
  }
};

export const updateProjectStatus = async (projectId: string, newStatus: string) => {
  try {
    const updateData: any = { 
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

export const updateProject = async (projectId: string, projectData: Partial<Project>) => {
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

export const activateProject = async (projectId: string, project: Project, initialPayment?: number) => {
  try {
    const updateData: any = {
      status: 'active',
      date: serverTimestamp(),
      debt: project.total,
      payments: []
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
) => {
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

export const addModelToProject = async (projectId: string, modelData: any) => {
  try {
    const projectRef = doc(db, "projects", projectId);
    const projectDoc = await getDocs(query(collection(db, "projects")));
    const project = projectDoc.docs.find(doc => doc.id === projectId);
    
    if (project) {
      const currentItems = project.data().items || [];
      const updatedItems = [...currentItems, modelData];
      const newTotal = updatedItems.reduce((sum, item) => {
        if (item.type === 'model') {
          return sum + (item.details?.materials?.price || 0) + 
                     (item.details?.chapes?.price || 0) + 
                     (item.details?.glasses?.price || 0) + 
                     (item.laborCostSelected || 0);
        } else if (item.type === 'individual') {
          return sum + (item.totalPrice || 0);
        }
        return sum;
      }, 0);

      await updateDoc(projectRef, {
        items: updatedItems,
        total: newTotal,
        date: serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Error adding model to project:", error);
    throw error;
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
};

export const formatDate = (date: any): string => {
  if (!date) return 'Fecha no disponible';
  
  let dateObj;
  if (date.toDate) {
    dateObj = date.toDate();
  } else if (date.seconds) {
    dateObj = new Date(date.seconds * 1000);
  } else {
    dateObj = new Date(date);
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
