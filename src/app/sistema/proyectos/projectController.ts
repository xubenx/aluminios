import { collection, getDocs, getDoc, doc, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
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
  // For models
  dimensions?: {
    height: number;
    width: number;
  };
  selectedGlass?: any;
  selectedColor?: any;
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
  total?: number;
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
      // Use the item's total if available, otherwise calculate from components
      if (item.total !== undefined && item.total !== null) {
        return total + item.total;
      } else {
        // Fallback to calculating from components
        return total + 
               (item.details?.materials?.price || 0) + 
               (item.details?.chapes?.price || 0) + 
               (item.details?.glasses?.price || 0) + 
               (item.laborCostSelected || 0);
      }
    } else if (item.type === 'individual') {
      return total + (item.total || 0);
    }
    return total;
  }, 0);
};

export const updateProjectItem = async (
  projectId: string,
  itemIndex: number,
  itemData: Partial<ProjectItem>
): Promise<void> => {
  try {
    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      throw new Error("Proyecto no encontrado");
    }

    const projectData = projectSnap.data() as Project;
    const updatedItems = [...projectData.items];
    
    // Clean the itemData to remove undefined values before merging
    const cleanedItemData = cleanObjectForFirestore(itemData);
    updatedItems[itemIndex] = { ...updatedItems[itemIndex], ...cleanedItemData };

    // Use the helper function to ensure total is recalculated
    await updateProjectWithRecalculatedTotal(projectId, updatedItems);
  } catch (error) {
    console.error("Error updating project item:", error);
    throw error;
  }
};

export const deleteProjectItem = async (
  projectId: string,
  itemIndex: number
): Promise<void> => {
  try {
    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      throw new Error("Proyecto no encontrado");
    }

    const projectData = projectSnap.data() as Project;
    const updatedItems = projectData.items.filter((_, index) => index !== itemIndex);

    // Use the helper function to ensure total is recalculated
    await updateProjectWithRecalculatedTotal(projectId, updatedItems);
  } catch (error) {
    console.error("Error deleting project item:", error);
    throw error;
  }
};

export const updateAllProjectItemsStatus = async (
  projectId: string,
  newStatus: ProjectItem['status']
): Promise<void> => {
  try {
    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      throw new Error("Proyecto no encontrado");
    }

    const projectData = projectSnap.data() as Project;
    const updatedItems = projectData.items.map(item => ({
      ...item,
      status: newStatus
    }));

    await updateDoc(projectRef, {
      items: updatedItems,
      date: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating all project items status:", error);
    throw error;
  }
};

export const addModelToProject = async (
  projectId: string,
  modelData: {
    modelId: string;
    modelName: string;
    dimensions: { height: number; width: number };
    selectedGlass: any;
    selectedColor: any;
    calculations: any;
  }
): Promise<void> => {
  try {
    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      throw new Error("Proyecto no encontrado");
    }

    const projectData = projectSnap.data() as Project;
    
    // Ensure all calculations have valid values
    const safeCalculations = {
      materials: modelData.calculations?.materials || { price: 0, meterage: 0, items: [] },
      chapes: modelData.calculations?.chapes || { price: 0, pieces: 0, items: [] },
      glasses: modelData.calculations?.glasses || { price: 0, meterage: 0, items: [] },
      laborCost: modelData.calculations?.laborCost || 0,
      laborCostActual: modelData.calculations?.laborCostActual || 0,
      m2: modelData.calculations?.m2 || 100,
      glassLaborCost: modelData.calculations?.glassLaborCost || 0,
      totalLaborActual: modelData.calculations?.totalLaborActual || 0,
      totalGeneral: modelData.calculations?.totalGeneral || 0
    };

    const newItem: ProjectItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'model',
      modelId: modelData.modelId,
      modelName: modelData.modelName,
      dimensions: modelData.dimensions,
      selectedGlass: modelData.selectedGlass,
      selectedColor: modelData.selectedColor,
      status: 'cotizacion',
      laborCostSelected: safeCalculations.laborCost,
      laborCostActual: safeCalculations.laborCostActual,
      m2: safeCalculations.m2,
      total: safeCalculations.totalGeneral,
      details: {
        materials: safeCalculations.materials,
        chapes: safeCalculations.chapes,
        glasses: safeCalculations.glasses,
        laborCost: safeCalculations.laborCost,
        laborCostActual: safeCalculations.laborCostActual
      }
    };

    // Clean the item to remove any undefined values
    const cleanedItem = cleanObjectForFirestore(newItem);
    const updatedItems = [...projectData.items, cleanedItem];

    // Use the helper function to ensure total is recalculated
    await updateProjectWithRecalculatedTotal(projectId, updatedItems);
  } catch (error) {
    console.error("Error adding model to project:", error);
    throw error;
  }
};

export const addIndividualItemToProject = async (
  projectId: string,
  itemData: {
    itemType: 'material' | 'herraje' | 'vidrio';
    itemId: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    total: number;
    dimensions?: { height: number; width: number } | null;
  }
): Promise<void> => {
  try {
    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      throw new Error("Proyecto no encontrado");
    }

    const projectData = projectSnap.data() as Project;
    
    // Ensure all values are valid and not undefined
    const newItem: ProjectItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'individual',
      itemType: itemData.itemType,
      itemId: itemData.itemId,
      itemName: itemData.itemName || '',
      quantity: itemData.quantity || 0,
      unitPrice: itemData.unitPrice || 0,
      total: itemData.total || 0,
      status: 'cotizacion'
    };

    // Only add dimensions if they exist and are valid
    if (itemData.dimensions && itemData.dimensions.height && itemData.dimensions.width) {
      newItem.dimensions = itemData.dimensions;
    }

    // Clean the item to remove any undefined values
    const cleanedItem = cleanObjectForFirestore(newItem);
    const updatedItems = [...projectData.items, cleanedItem];

    // Use the helper function to ensure total is recalculated
    await updateProjectWithRecalculatedTotal(projectId, updatedItems);
  } catch (error) {
    console.error("Error adding individual item to project:", error);
    throw error;
  }
};

export const loadColors = async (): Promise<Color[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "colors"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Color, 'id'>)
    } as Color));
  } catch (error) {
    console.error("Error loading colors:", error);
    return [];
  }
};

export interface Color {
  id: string;
  name: string;
  [key: string]: unknown;
}

// Utility function to remove undefined values from objects
const cleanObjectForFirestore = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanObjectForFirestore(item));
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanObjectForFirestore(value);
      }
    }
    return cleaned;
  }
  
  return obj;
};

// Helper function to ensure project total is always updated when items change
export const updateProjectWithRecalculatedTotal = async (
  projectId: string,
  updatedItems: ProjectItem[],
  additionalData: Record<string, any> = {}
): Promise<void> => {
  try {
    const projectRef = doc(db, "projects", projectId);
    
    await updateDoc(projectRef, {
      items: updatedItems,
      total: calculateProjectTotal(updatedItems),
      date: serverTimestamp(),
      ...additionalData
    });
  } catch (error) {
    console.error("Error updating project with recalculated total:", error);
    throw error;
  }
};

// Function to verify and fix project totals if they don't match the calculated total
export const verifyAndFixProjectTotal = async (projectId: string): Promise<boolean> => {
  try {
    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      throw new Error("Proyecto no encontrado");
    }

    const projectData = projectSnap.data() as Project;
    const calculatedTotal = calculateProjectTotal(projectData.items);
    
    // Check if the stored total matches the calculated total
    if (Math.abs(projectData.total - calculatedTotal) > 0.01) { // Allow for small floating point differences
      console.log(`Total mismatch for project ${projectId}: stored=${projectData.total}, calculated=${calculatedTotal}`);
      
      // Fix the total
      await updateDoc(projectRef, {
        total: calculatedTotal,
        date: serverTimestamp()
      });
      
      return true; // Indicates total was fixed
    }
    
    return false; // Indicates total was already correct
  } catch (error) {
    console.error("Error verifying/fixing project total:", error);
    throw error;
  }
};

// Function to verify and fix all project totals
export const verifyAndFixAllProjectTotals = async (): Promise<{ fixed: number; total: number }> => {
  try {
    const projects = await loadProjects();
    let fixedCount = 0;
    
    for (const project of projects) {
      const wasFixed = await verifyAndFixProjectTotal(project.id);
      if (wasFixed) {
        fixedCount++;
      }
    }
    
    return { fixed: fixedCount, total: projects.length };
  } catch (error) {
    console.error("Error verifying/fixing all project totals:", error);
    throw error;
  }
};
