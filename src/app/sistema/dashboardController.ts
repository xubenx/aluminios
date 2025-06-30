import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";

// Interfaces
export interface Stats {
  totalProjects: number;
  totalCustomers: number;
  totalModels: number;
  totalMaterials: number;
  totalChapes: number;
  totalGlasses: number;
  totalEmployees: number;
  totalJournalEntries: number;
  projectsValue: {
    total: number;
    quotation: number;
    active: number;
    completed: number;
  };
  projectsStatus: {
    quotation: number;
    active: number;
    completed: number;
    cancelled: number;
    inactive: number;
  };
  financialSummary: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    averageProjectValue: number;
    journalIncome: number;
    projectPaymentsIncome: number;
  };
  duplicates: {
    materials: Array<{ name: string; count: number; ids: string[] }>;
    chapes: Array<{ name: string; count: number; ids: string[] }>;
    glasses: Array<{ name: string; count: number; ids: string[] }>;
    customers: Array<{ name: string; count: number; ids: string[] }>;
  };
  dataQuality: {
    modelsWithoutImage: number;
    modelsIncomplete: number;
    materialsWithoutPrice: number;
    projectsWithoutTotal: number;
    completenessScore: number;
  };
  inventory: {
    materialCategories: { [key: string]: number };
    priceRanges: { [key: string]: number };
    averagePrices: { [key: string]: number };
  };
  performance: {
    topCustomers: Array<{ name: string; projectCount: number; totalValue: number }>;
    mostUsedMaterials: Array<{ name: string; usageCount: number }>;
    recentActivity: Array<{ type: string; description: string; date: string }>;
    monthlyTrends: { [key: string]: number };
  };
  predictions: {
    expectedRevenue: number;
    growthRate: number;
    recommendations: string[];
  };
}

// Función para cargar datos de Firestore
export const loadDashboardData = async (): Promise<Stats> => {
  try {
    // Cargar todas las colecciones en paralelo
    const [
      projectsSnapshot,
      customersSnapshot,
      modelsSnapshot,
      materialsSnapshot,
      chapesSnapshot,
      glassesSnapshot,
      employeesSnapshot,
      journalSnapshot
    ] = await Promise.all([
      getDocs(collection(db, "projects")),
      getDocs(collection(db, "customers")),
      getDocs(collection(db, "models")),
      getDocs(collection(db, "materials")),
      getDocs(collection(db, "chapes")),
      getDocs(collection(db, "glasses")),
      getDocs(collection(db, "employees")),
      getDocs(collection(db, "journal"))
    ]);

    // Convertir a arrays
    const projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const customers = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const models = modelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const materials = materialsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const chapes = chapesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const glasses = glassesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const employees = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const journal = journalSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Realizar análisis
    return analyzeSystemData({
      projects,
      customers,
      models,
      materials,
      chapes,
      glasses,
      employees,
      journal
    });
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    throw new Error("Error al cargar los datos del dashboard");
  }
};

// Función para encontrar duplicados
const findDuplicates = (items: any[], field: string) => {
  const counts: { [key: string]: { count: number; ids: string[] } } = {};
  
  items.forEach(item => {
    const value = item[field]?.toLowerCase().trim();
    if (value) {
      if (!counts[value]) {
        counts[value] = { count: 0, ids: [] };
      }
      counts[value].count++;
      counts[value].ids.push(item.id);
    }
  });

  return Object.entries(counts)
    .filter(([_, data]) => data.count > 1)
    .map(([name, data]) => ({ name, count: data.count, ids: data.ids }))
    .sort((a, b) => b.count - a.count);
};

// Función principal de análisis
const analyzeSystemData = (data: any): Stats => {
  const { projects, customers, models, materials, chapes, glasses, employees, journal } = data;

  // Filtrar proyectos activos (excluir inactivos)
  const activeProjects = projects.filter((p: any) => p.status !== "inactive");

  // Calcular ingresos de payments de proyectos
  const projectPaymentsIncome = activeProjects.reduce((total: number, project: any) => {
    if (project.payments && Array.isArray(project.payments)) {
      return total + project.payments.reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);
    }
    return total;
  }, 0);

  // Análisis financiero del diario
  const activeJournal = journal.filter((entry: any) => entry.activo !== false);
  const journalIncome = activeJournal
    .filter((entry: any) => entry.tipo === "pago")
    .reduce((sum: number, entry: any) => sum + (entry.monto || 0), 0);
  
  const totalExpenses = activeJournal
    .filter((entry: any) => entry.tipo === "gasto")
    .reduce((sum: number, entry: any) => sum + (entry.monto || 0), 0);

  // Total de ingresos combinados
  const totalIncome = journalIncome + projectPaymentsIncome;

  // Análisis de proyectos (solo activos)
  const projectsValue = {
    total: activeProjects.reduce((sum: number, p: any) => sum + (p.total || 0), 0),
    quotation: activeProjects.filter((p: any) => p.status === "quotation").reduce((sum: number, p: any) => sum + (p.total || 0), 0),
    active: activeProjects.filter((p: any) => p.status === "active").reduce((sum: number, p: any) => sum + (p.total || 0), 0),
    completed: activeProjects.filter((p: any) => p.status === "completed").reduce((sum: number, p: any) => sum + (p.total || 0), 0)
  };

  const projectsStatus = {
    quotation: activeProjects.filter((p: any) => p.status === "quotation").length,
    active: activeProjects.filter((p: any) => p.status === "active").length,
    completed: activeProjects.filter((p: any) => p.status === "completed").length,
    cancelled: activeProjects.filter((p: any) => p.status === "cancelled").length,
    inactive: projects.filter((p: any) => p.status === "inactive").length
  };

  // Análisis de calidad de datos
  const modelsWithoutImage = models.filter((m: any) => !m.image || m.image === "").length;
  const modelsIncomplete = models.filter((m: any) => 
    !m.name || !m.manpower || (!m.materials || m.materials.length === 0)
  ).length;
  const materialsWithoutPrice = materials.filter((m: any) => !m.price || m.price <= 0).length;
  const projectsWithoutTotal = projects.filter((p: any) => !p.total || p.total <= 0).length;

  const totalFields = (models.length * 3) + materials.length + projects.length;
  const completeFields = totalFields - (modelsIncomplete + materialsWithoutPrice + projectsWithoutTotal);
  const completenessScore = totalFields > 0 ? Math.round((completeFields / totalFields) * 100) : 100;

  // Análisis de inventario
  const materialCategories: { [key: string]: number } = {};
  materials.forEach((m: any) => {
    const category = m.category || "Sin categoría";
    materialCategories[category] = (materialCategories[category] || 0) + 1;
  });

  // Top customers
  const customerProjects: { [key: string]: { count: number; value: number; name: string } } = {};
  projects.forEach((p: any) => {
    const customerId = p.customerId || p.customerName || "Desconocido";
    if (!customerProjects[customerId]) {
      customerProjects[customerId] = { count: 0, value: 0, name: p.customerName || "Cliente desconocido" };
    }
    customerProjects[customerId].count++;
    customerProjects[customerId].value += p.total || 0;
  });

  const topCustomers = Object.entries(customerProjects)
    .map(([id, data]) => ({ name: data.name, projectCount: data.count, totalValue: data.value }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5);

  // Materiales más usados
  const materialUsage: { [key: string]: number } = {};
  models.forEach((model: any) => {
    if (model.materials) {
      model.materials.forEach((mat: any) => {
        const matName = mat.name || "Material desconocido";
        materialUsage[matName] = (materialUsage[matName] || 0) + 1;
      });
    }
  });

  const mostUsedMaterials = Object.entries(materialUsage)
    .map(([name, count]) => ({ name, usageCount: count }))
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 5);

  // Actividad reciente
  const recentActivity = [
    ...projects.slice(-3).map((p: any) => ({
      type: "Proyecto",
      description: `Proyecto "${p.name}" - ${p.status}`,
      date: p.createdAt || p.updatedAt || new Date().toISOString()
    })),
    ...journal.slice(-3).map((j: any) => ({
      type: j.tipo === "gasto" ? "Gasto" : "Ingreso",
      description: j.descripcion,
      date: j.fecha || new Date().toISOString()
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  // Predicciones
  const completedProjects = projects.filter((p: any) => p.status === "completed");
  const averageProjectValue = completedProjects.length > 0 
    ? completedProjects.reduce((sum: number, p: any) => sum + (p.total || 0), 0) / completedProjects.length
    : 0;

  const activeProjectsValue = projects
    .filter((p: any) => p.status === "active")
    .reduce((sum: number, p: any) => sum + (p.total || 0), 0);

  const quotationProjectsValue = projects
    .filter((p: any) => p.status === "quotation")
    .reduce((sum: number, p: any) => sum + (p.total || 0), 0);

  const expectedRevenue = activeProjectsValue + (quotationProjectsValue * 0.3);

  // Tasa de crecimiento
  const thisMonthProjects = projects.filter((p: any) => {
    const date = new Date(p.createdAt || p.updatedAt || 0);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const lastMonthProjects = projects.filter((p: any) => {
    const date = new Date(p.createdAt || p.updatedAt || 0);
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
  }).length;

  const growthRate = lastMonthProjects > 0 ? ((thisMonthProjects - lastMonthProjects) / lastMonthProjects) * 100 : 0;

  // Recomendaciones
  const recommendations = [];
  if (projectsStatus.quotation > projectsStatus.active * 2) {
    recommendations.push("Alto número de cotizaciones pendientes. Revisar proceso de conversión.");
  }
  if (totalExpenses > totalIncome * 0.8) {
    recommendations.push("Gastos altos relativos a ingresos. Revisar eficiencia operativa.");
  }
  if (completenessScore < 80) {
    recommendations.push("Completar información faltante en base de datos para mejor análisis.");
  }
  if (materialsWithoutPrice > materials.length * 0.1) {
    recommendations.push("Actualizar precios de materiales sin precio asignado.");
  }

  return {
    totalProjects: activeProjects.length,
    totalCustomers: customers.length,
    totalModels: models.length,
    totalMaterials: materials.length,
    totalChapes: chapes.length,
    totalGlasses: glasses.filter((g: any) => g.status !== "inactive").length,
    totalEmployees: employees.length,
    totalJournalEntries: activeJournal.length,
    projectsValue,
    projectsStatus,
    financialSummary: {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      averageProjectValue,
      journalIncome,
      projectPaymentsIncome
    },
    duplicates: {
      materials: findDuplicates(materials, "name"),
      chapes: findDuplicates(chapes, "name"),
      glasses: findDuplicates(glasses, "name"),
      customers: findDuplicates(customers, "name")
    },
    dataQuality: {
      modelsWithoutImage,
      modelsIncomplete,
      materialsWithoutPrice,
      projectsWithoutTotal,
      completenessScore
    },
    inventory: {
      materialCategories,
      priceRanges: {},
      averagePrices: {}
    },
    performance: {
      topCustomers,
      mostUsedMaterials,
      recentActivity,
      monthlyTrends: {}
    },
    predictions: {
      expectedRevenue,
      growthRate,
      recommendations
    }
  };
};

// Funciones de utilidad
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getStatusColor = (status: string): string => {
  const colors: { [key: string]: string } = {
    quotation: '#ff9800',
    active: '#4caf50',
    completed: '#2196f3',
    cancelled: '#f44336',
    inactive: '#9e9e9e'
  };
  return colors[status] || '#9e9e9e';
};

export const getStatusLabel = (status: string): string => {
  const labels: { [key: string]: string } = {
    quotation: 'Cotizaciones',
    active: 'Activos',
    completed: 'Completados',
    cancelled: 'Cancelados',
    inactive: 'Inactivos'
  };
  return labels[status] || 'Desconocido';
};
