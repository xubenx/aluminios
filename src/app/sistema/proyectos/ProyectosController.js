"use client";
import { useState, useEffect, useMemo } from "react";
import { db } from "../../../../firebase";
import { evaluate } from "mathjs";
import { collection, getDocs, doc, updateDoc, getDoc, addDoc, query, orderBy } from "firebase/firestore";
import { uploadProjectImage, deleteProjectImage } from "../../../utils/imageStorage";

// Redondear montos a 2 decimales
const round2 = (n) => (typeof n === "number" && !Number.isNaN(n)) ? Math.round(n * 100) / 100 : 0;

// Quitar undefined para Firestore (rechaza undefined)
const stripUndefined = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(stripUndefined);
  if (typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        const cleaned = stripUndefined(v);
        if (cleaned !== undefined) out[k] = cleaned;
      }
    }
    return out;
  }
  return obj;
};

// Helper functions to avoid import issues
const loadProjects = async () => {
  try {
    const q = query(collection(db, "projects"), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error loading projects:", error);
    throw error;
  }
};

const loadEmployees = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "employees"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error loading employees:", error);
    throw error;
  }
};

const loadModels = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "models"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error loading models:", error);
    throw error;
  }
};

const loadGlasses = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "glasses"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error loading glasses:", error);
    throw error;
  }
};

const loadMaterials = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "materials"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error loading materials:", error);
    throw error;
  }
};

const loadChapes = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "chapes"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error loading chapes:", error);
    throw error;
  }
};

const loadExtras = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "extras"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error loading extras:", error);
    return [];
  }
};

const loadColors = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "colors"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error loading colors:", error);
    throw error;
  }
};

const updateProjectStatus = async (projectId, newStatus) => {
  try {
    await updateDoc(doc(db, "projects", projectId), {
      status: newStatus
    });
  } catch (error) {
    console.error("Error updating project status:", error);
    throw error;
  }
};

const updateProject = async (projectId, projectData) => {
  try {
    await updateDoc(doc(db, "projects", projectId), projectData);
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

const activateProject = async (projectId, project, initialPayment = 0, adjustedTotal = null) => {
  try {
    const finalTotal = round2(adjustedTotal !== null ? adjustedTotal : project.total);
    const amountAnticipo = round2(initialPayment);
    const debt = round2(finalTotal - amountAnticipo);

    const updateData = {
      status: "active",
      total: finalTotal,
      debt
    };

    if (amountAnticipo > 0) {
      updateData.payments = [{
        date: new Date().toISOString(),
        amount: amountAnticipo,
        description: "Anticipo inicial",
        method: "efectivo"
      }];
    }

    await updateDoc(doc(db, "projects", projectId), updateData);
  } catch (error) {
    console.error("Error activating project:", error);
    throw error;
  }
};

const addPaymentToProject = async (projectId, project, payment) => {
  try {
    const amount = round2(payment.amount);
    const currentPayments = project.payments || [];
    const newPayments = [...currentPayments, { ...payment, amount }];
    const newDebt = round2(Math.max(0, (project.debt ?? project.total) - amount));

    const updateData = {
      payments: newPayments,
      debt: newDebt
    };
    if (newDebt <= 0) updateData.status = "completed";

    await updateDoc(doc(db, "projects", projectId), updateData);

    // Registrar ingreso en el Diario (journal) para trazabilidad financiera
    const fecha = (payment.date || new Date().toISOString()).split("T")[0];
    await addDoc(collection(db, "journal"), {
      fecha,
      tipo: "pago",
      categoria: "Ingresos de Proyectos",
      descripcion: `Pago proyecto: ${project.name || project.projectName || "Proyecto"} - Cliente: ${project.customerName || project.client || "Sin cliente"}`,
      monto: amount,
      observaciones: payment.description || payment.method || "",
      activo: true,
      source: "project",
      projectId,
      projectName: project.name || project.projectName,
      customerName: project.customerName || project.client,
      metodo: payment.method || "efectivo",
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error adding payment:", error);
    throw error;
  }
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

const calculateProjectTotal = (items) => {
  const sum = items.reduce((sum, item) => sum + (item.total || 0), 0);
  return round2(sum);
};

const updateProjectWithRecalculatedTotal = async (projectId, updatedItems) => {
  try {
    const newTotal = round2(calculateProjectTotal(updatedItems));
    await updateDoc(doc(db, "projects", projectId), stripUndefined({
      items: updatedItems,
      total: newTotal
    }));
  } catch (error) {
    console.error("Error updating project with recalculated total:", error);
    throw error;
  }
};

// Additional helper functions needed
const updateProjectItem = async (projectId, itemIndex, updatedData) => {
  try {
    console.log("Updating project item with data:", updatedData); // Debug log
    const projectDoc = await getDoc(doc(db, "projects", projectId));
    if (!projectDoc.exists()) {
      throw new Error("Project not found");
    }

    const projectData = projectDoc.data();
    const updatedItems = [...(projectData.items || [])];
    
    // Ensure we don't pass undefined values to Firestore
    const cleanedData = {};
    Object.keys(updatedData).forEach(key => {
      if (updatedData[key] !== undefined) {
        cleanedData[key] = updatedData[key];
      }
    });
    
    const merged = { ...updatedItems[itemIndex], ...cleanedData };
    if (merged.assignedEmployeeId && !merged.workOrder) {
      merged.workOrder = { paymentStatus: "unpaid", createdAt: new Date().toISOString() };
    }
    updatedItems[itemIndex] = merged;

    const newTotal = round2(calculateProjectTotal(updatedItems));
    await updateDoc(doc(db, "projects", projectId), stripUndefined({
      items: updatedItems,
      total: newTotal
    }));
    
    console.log("Project updated successfully"); // Debug log
  } catch (error) {
    console.error("Error updating project item:", error);
    throw error;
  }
};

const deleteProjectItem = async (projectId, itemIndex) => {
  try {
    const projectDoc = await getDoc(doc(db, "projects", projectId));
    if (!projectDoc.exists()) {
      throw new Error("Project not found");
    }

    const projectData = projectDoc.data();
    const updatedItems = [...(projectData.items || [])];
    updatedItems.splice(itemIndex, 1);

    const newTotal = round2(calculateProjectTotal(updatedItems));
    await updateDoc(doc(db, "projects", projectId), stripUndefined({
      items: updatedItems,
      total: newTotal
    }));
  } catch (error) {
    console.error("Error deleting project item:", error);
    throw error;
  }
};

const addModelToProjectService = async (projectId, modelData) => {
  try {
    const projectDoc = await getDoc(doc(db, "projects", projectId));
    if (!projectDoc.exists()) {
      throw new Error("Project not found");
    }

    const projectDataFromDB = projectDoc.data();
    const currentItems = projectDataFromDB.items || [];

    const newItem = {
      type: "model",
      modelId: modelData.modelId,
      modelName: modelData.modelName,
      dimensions: modelData.dimensions,
      selectedGlass: modelData.selectedGlass,
      selectedColor: modelData.selectedColor,
      area: "",
      assignedEmployeeId: "",
      status: "cotizacion",
      laborCostSelected: round2(modelData.calculations.laborCost),
      laborCostActual: round2(modelData.calculations.laborCostActual),
      m2: round2(modelData.calculations.m2),
      total: round2(modelData.calculations.totalGeneral),
      details: {
        materials: modelData.calculations.materials,
        chapes: modelData.calculations.chapes,
        glasses: modelData.calculations.glasses,
        laborCost: round2(modelData.calculations.laborCost),
        laborCostActual: round2(modelData.calculations.laborCostActual)
      }
    };

    const updatedItems = [...currentItems, newItem];
    const newTotal = round2(calculateProjectTotal(updatedItems));

    await updateDoc(doc(db, "projects", projectId), stripUndefined({
      items: updatedItems,
      total: newTotal
    }));
  } catch (error) {
    console.error("Error adding model to project:", error);
    throw error;
  }
};

const addIndividualItemToProject = async (projectId, itemData, projectStatus = "quotation") => {
  try {
    const projectDoc = await getDoc(doc(db, "projects", projectId));
    if (!projectDoc.exists()) {
      throw new Error("Project not found");
    }

    const projectDataFromDB = projectDoc.data();
    const currentItems = projectDataFromDB.items || [];
    const status = projectStatus === "active" ? "pendiente" : "cotizacion";

    const newItem = {
      type: "individual",
      itemType: itemData.itemType,
      itemId: itemData.itemId,
      itemName: itemData.itemName,
      quantity: itemData.quantity,
      unitPrice: round2(itemData.unitPrice),
      total: round2(itemData.total),
      dimensions: itemData.dimensions,
      quantityType: itemData.quantityType,
      area: itemData.area,
      meters: itemData.meters,
      tramo: itemData.tramo,
      status
    };

    const updatedItems = [...currentItems, newItem];
    const newTotal = round2(calculateProjectTotal(updatedItems));

    await updateDoc(doc(db, "projects", projectId), stripUndefined({
      items: updatedItems,
      total: newTotal
    }));
  } catch (error) {
    console.error("Error adding individual item to project:", error);
    throw error;
  }
};

const updateAllProjectItemsStatus = async (projectId, newStatus) => {
  try {
    const projectDoc = await getDoc(doc(db, "projects", projectId));
    if (!projectDoc.exists()) {
      throw new Error("Project not found");
    }

    const projectData = projectDoc.data();
    const updatedItems = (projectData.items || []).map(item => ({
      ...item,
      status: newStatus
    }));

    await updateDoc(doc(db, "projects", projectId), stripUndefined({ items: updatedItems }));
  } catch (error) {
    console.error("Error updating all project items status:", error);
    throw error;
  }
};

// Helper functions for formatting
const formatDate = (timestamp) => {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('es-MX');
};

const getStatusColor = (status) => {
  switch (status) {
    case 'quotation': return 'warning';
    case 'active': return 'info';
    case 'completed': return 'success';
    case 'cancelled': return 'error';
    case 'inactive': return 'default';
    default: return 'default';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'quotation': return 'Cotización';
    case 'active': return 'Activo';
    case 'completed': return 'Completado';
    case 'cancelled': return 'Cancelado';
    case 'inactive': return 'Inactivo';
    default: return 'Desconocido';
  }
};

export const useProyectosController = () => {
  // Estados principales
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [isMobile, setIsMobile] = useState(false);

  // Estados para expansión de modelos
  const [expandedModels, setExpandedModels] = useState({});

  // Estados para empleados
  const [employees, setEmployees] = useState([]);

  // Estados para edición de modelos individuales
  const [editingModel, setEditingModel] = useState(null);
  const [showModelEditDialog, setShowModelEditDialog] = useState(false);

  // Estados para sistema de pagos
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentProject, setPaymentProject] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentDescription, setPaymentDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [initialPayment, setInitialPayment] = useState(0);
  const [adjustedTotal, setAdjustedTotal] = useState(0);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [activatingProject, setActivatingProject] = useState(null);

  // Estados para filtros de proyectos - tabulación por status
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'quotation' | 'active' | 'completed' | 'cancelled' | 'inactive'

  // Estados para agregar modelo a proyecto
  const [showAddModelDialog, setShowAddModelDialog] = useState(false);
  const [addingToProject, setAddingToProject] = useState(null);
  const [models, setModels] = useState([]);
  const [filteredModels, setFilteredModels] = useState([]);
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const [selectedModelToAdd, setSelectedModelToAdd] = useState(null);
  const [modelData, setModelData] = useState(null);
  const [materialsOptions, setMaterialsOptions] = useState([]);
  const [chapesOptions, setChapesOptions] = useState([]);
  const [glassesOptions, setGlassesOptions] = useState([]);
  const [extrasOptions, setExtrasOptions] = useState([]);
  const [colorsOptions, setColorsOptions] = useState([]);
  const [dimensions, setDimensions] = useState({ height: "1", width: "1" });
  const [selectedGlass, setSelectedGlass] = useState(null);

  // Estados para re-cotizar modelo en proyectos de cotización
  const [showRecalcDialog, setShowRecalcDialog] = useState(false);
  const [recalcModel, setRecalcModel] = useState(null);
  const [recalcDimensions, setRecalcDimensions] = useState({ height: "1", width: "1" });
  const [recalcSelectedGlass, setRecalcSelectedGlass] = useState(null);
  const [recalcSelectedColor, setRecalcSelectedColor] = useState(null);

  // Estados para re-cotizar elementos individuales
  const [showRecalcIndividualDialog, setShowRecalcIndividualDialog] = useState(false);
  const [recalcIndividualItem, setRecalcIndividualItem] = useState(null);
  const [recalcIndividualQuantity, setRecalcIndividualQuantity] = useState(1);
  const [recalcIndividualQuantityType, setRecalcIndividualQuantityType] = useState("metros");
  const [recalcIndividualDimensions, setRecalcIndividualDimensions] = useState({ height: "", width: "" });
  const [recalcIndividualSelectedMaterial, setRecalcIndividualSelectedMaterial] = useState(null);
  const [recalcIndividualSelectedHerraje, setRecalcIndividualSelectedHerraje] = useState(null);
  const [recalcIndividualSelectedVidrio, setRecalcIndividualSelectedVidrio] = useState(null);
  const [recalcIndividualPriceType, setRecalcIndividualPriceType] = useState("installed");
  // Estados para mostrar el cálculo en tiempo real
  const [recalcIndividualPreview, setRecalcIndividualPreview] = useState({ unitPrice: 0, total: 0, calculation: "" });

  // Estados para agregar elementos individuales
  const [showAddIndividualItemDialog, setShowAddIndividualItemDialog] = useState(false);
  const [individualItemType, setIndividualItemType] = useState("material");
  const [selectedIndividualMaterial, setSelectedIndividualMaterial] = useState(null);
  const [selectedIndividualHerraje, setSelectedIndividualHerraje] = useState(null);
  const [selectedIndividualVidrio, setSelectedIndividualVidrio] = useState(null);
  const [selectedIndividualExtra, setSelectedIndividualExtra] = useState(null);
  const [individualItemQuantity, setIndividualItemQuantity] = useState(1);
  const [individualItemQuantityType, setIndividualItemQuantityType] = useState("metros");
  const [individualItemDimensions, setIndividualItemDimensions] = useState({ height: "", width: "" });
  const [individualItemPriceType, setIndividualItemPriceType] = useState("installed");
  const [individualItemCalculation, setIndividualItemCalculation] = useState("");
  const [individualItemTotal, setIndividualItemTotal] = useState(0);

  // Estado para caché de imágenes
  const [imageCache, setImageCache] = useState(new Set());

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 600);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cargar proyectos al montar el componente
  useEffect(() => {
    fetchProjects();
    fetchEmployees();
    fetchModels();
    fetchOptions();
  }, []);

  // Filtrar proyectos basado en la búsqueda y filtros (tabulación por status)
  useEffect(() => {
    let filtered = projects;
    
    // Filtrar por estado del proyecto (tab seleccionada)
    if (statusFilter !== "all") {
      filtered = filtered.filter(project => project.status === statusFilter);
    }
    
    // Excluir archivados
    filtered = filtered.filter(project => !project.archived);
    
    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(project => {
        const projName = (project.name || project.projectName || "").toLowerCase();
        const projCustomer = (project.customerName || project.client || "").toLowerCase();
        return projName.includes(q) || projCustomer.includes(q);
      });
    }
    
    setFilteredProjects(filtered);
  }, [searchQuery, projects, statusFilter]);

  // Conteo de proyectos por status (para badges en tabs)
  const projectCountByStatus = useMemo(() => {
    const nonArchived = projects.filter(p => !p.archived);
    return {
      all: nonArchived.length,
      quotation: nonArchived.filter(p => p.status === "quotation").length,
      active: nonArchived.filter(p => p.status === "active").length,
      completed: nonArchived.filter(p => p.status === "completed").length,
      cancelled: nonArchived.filter(p => p.status === "cancelled").length,
      inactive: nonArchived.filter(p => p.status === "inactive").length
    };
  }, [projects]);

  // Filtrar modelos para agregar
  useEffect(() => {
    if (modelSearchQuery) {
      setFilteredModels(
        models.filter(model =>
          model.name.toLowerCase().includes(modelSearchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredModels(models);
    }
  }, [modelSearchQuery, models]);

  // Estados para recotización global en proyectos de cotización
  const [quotationGlobalColor, setQuotationGlobalColor] = useState(null);
  const [quotationGlobalGlass, setQuotationGlobalGlass] = useState(null);
  const [isQuotationRecalculating, setIsQuotationRecalculating] = useState(false);

  // Resumen de materiales con optimización de tramos (igual que carrito)
  const getProjectSummaries = (project) => {
    if (!project || !project.items) return { materials: [], chapes: [], glasses: [] };
    const materialsSummary = {};
    const chapesSummary = {};
    const glassesSummary = {};
    const TRAMO_DEFAULT = 6.1;

    const getMaterialStretch = (materialName, materialId) => {
      if (materialId) {
        const mat = materialsOptions.find(m => m.id === materialId);
        if (mat) return parseFloat(mat.stretch || TRAMO_DEFAULT);
      }
      const mat = materialsOptions.find(m => m.name === materialName);
      return mat ? parseFloat(mat.stretch || TRAMO_DEFAULT) : TRAMO_DEFAULT;
    };

    project.items.forEach(item => {
      if (item.type === "individual") {
        switch (item.itemType) {
          case "material":
            const meters = item.meters ?? (item.quantityType === "tramos" ? item.quantity * (item.tramo || TRAMO_DEFAULT) : item.quantity);
            if (materialsSummary[item.itemName]) {
              materialsSummary[item.itemName].meterage += meters;
              materialsSummary[item.itemName].price += item.total || 0;
            } else {
              materialsSummary[item.itemName] = {
                name: item.itemName,
                meterage: meters,
                price: item.total || 0,
                stretch: getMaterialStretch(item.itemName, item.itemId),
                isIndividual: true
              };
            }
            break;
          case "herraje":
            if (chapesSummary[item.itemName]) {
              chapesSummary[item.itemName].pieces += item.quantity || 0;
              chapesSummary[item.itemName].price += item.total || 0;
            } else {
              chapesSummary[item.itemName] = {
                name: item.itemName,
                pieces: item.quantity || 0,
                price: item.total || 0,
                isIndividual: true
              };
            }
            break;
          case "vidrio":
            const area = item.area ?? (item.dimensions ? (item.dimensions.height / 100) * (item.dimensions.width / 100) : item.quantity);
            if (glassesSummary[item.itemName]) {
              glassesSummary[item.itemName].meterage += area;
              glassesSummary[item.itemName].price += item.total || 0;
            } else {
              glassesSummary[item.itemName] = {
                name: item.itemName,
                meterage: area,
                price: item.total || 0,
                isIndividual: true
              };
            }
            break;
        }
      } else {
        (item.details?.materials?.items || []).forEach((material) => {
          const stretch = getMaterialStretch(material?.name, null);
          if (materialsSummary[material?.name]) {
            materialsSummary[material.name].meterage += material.meterage || 0;
            materialsSummary[material.name].price += material.price || 0;
          } else {
            materialsSummary[material.name] = {
              name: material.name,
              meterage: material.meterage || 0,
              price: material.price || 0,
              stretch,
              isIndividual: false
            };
          }
        });
        (item.details?.chapes?.items || []).forEach(chape => {
          if (chapesSummary[chape.name]) {
            chapesSummary[chape.name].pieces += chape.pieces || 0;
            chapesSummary[chape.name].price += chape.price || 0;
          } else {
            chapesSummary[chape.name] = {
              name: chape.name,
              pieces: chape.pieces || 0,
              price: chape.price || 0,
              isIndividual: false
            };
          }
        });
        (item.details?.glasses?.items || []).forEach(glass => {
          if (glassesSummary[glass.name]) {
            glassesSummary[glass.name].meterage += glass.meterage || 0;
            glassesSummary[glass.name].price += glass.price || 0;
          } else {
            glassesSummary[glass.name] = {
              name: glass.name,
              meterage: glass.meterage || 0,
              price: glass.price || 0,
              isIndividual: false
            };
          }
        });
      }
    });

    const materialsWithTramos = Object.values(materialsSummary).map(m => ({
      ...m,
      tramos: Math.ceil(m.meterage / (m.stretch || TRAMO_DEFAULT))
    }));

    return {
      materials: materialsWithTramos,
      chapes: Object.values(chapesSummary),
      glasses: Object.values(glassesSummary)
    };
  };

  // Función para calcular totales por categorías
  const getProjectCategoricalTotals = (project) => {
    if (!project || !project.items) return { materials: 0, herrajes: 0, vidrios: 0, extras: 0, laborCost: 0, total: 0 };
    
    return project.items.reduce((acc, item) => {
      if (item.type === 'individual') {
        // Elementos individuales
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
          case 'extra':
            acc.extras += item.total || 0;
            break;
        }
        // Para elementos individuales, sumar solo el total del item
        acc.total += item.total || 0;
      } else {
        // Modelos completos - sumar componentes para categorías
        acc.materials += item.details?.materials?.price || 0;
        acc.herrajes += item.details?.chapes?.price || 0;
        acc.vidrios += item.details?.glasses?.price || 0;
        acc.laborCost += item.laborCostSelected || item.details?.laborCost || 0;
        
        // Para modelos, usar el total del item si está disponible, sino calcular
        if (item.total !== undefined && item.total !== null) {
          acc.total += item.total;
        } else {
          acc.total += (item.details?.materials?.price || 0) +
                       (item.details?.chapes?.price || 0) +
                       (item.details?.glasses?.price || 0) +
                       (item.laborCostSelected || 0);
        }
      }
      return acc;
    }, { materials: 0, herrajes: 0, vidrios: 0, extras: 0, laborCost: 0, total: 0 });
  };

  // Funciones de carga de datos
  const fetchProjects = async () => {
    try {
      const projectsData = await loadProjects();
      setProjects(projectsData);
      setFilteredProjects(projectsData);
    } catch (error) {
      console.error("Error fetching projects: ", error);
      setSnackbar({
        open: true,
        message: "Error al cargar los proyectos.",
        severity: "error"
      });
    }
  };

  const fetchEmployees = async () => {
    try {
      const employeesData = await loadEmployees();
      setEmployees(employeesData);
    } catch (error) {
      console.error("Error fetching employees: ", error);
    }
  };

  const fetchModels = async () => {
    try {
      const modelsData = await loadModels();
      setModels(modelsData);
      setFilteredModels(modelsData);
    } catch (error) {
      console.error("Error fetching models: ", error);
    }
  };

  const fetchOptions = async () => {
    try {
      const materialsData = await loadMaterials();
      setMaterialsOptions(materialsData);

      const chapesData = await loadChapes();
      setChapesOptions(chapesData);

      const glassesData = await loadGlasses();
      
      // Process glasses data - handle different possible structures
      let glassesList = [];
      
      if (glassesData && glassesData.length > 0) {
        glassesList = glassesData.flatMap(doc => {
          const data = doc;
          
          // If glass has options property with array
          if (data.options && Array.isArray(data.options)) {
            return data.options.map((option, index) => ({
              id: `${doc.id}-${index}`,
              originalId: doc.id,
              name: `${data.name} ${option.tickness || option.thickness || ''}mm`,
              tickness: option.tickness || option.thickness || '',
              priceInstalled: option.priceInstalled || option.price || 0,
              price: option.price || option.priceInstalled || 0
            }));
          } 
          // If glass is a simple object with direct properties
          else {
            return [{
              id: doc.id,
              originalId: doc.id,
              name: data.name,
              tickness: data.tickness || data.thickness || '',
              priceInstalled: data.priceInstalled || data.price || 0,
              price: data.price || data.priceInstalled || 0
            }];
          }
        });
      }
      
      setGlassesOptions(glassesList);

      const extrasData = await loadExtras();
      setExtrasOptions(extrasData);

      // Cargar colores usando la función dedicada
      const colorsData = await loadColors();
      setColorsOptions(colorsData);
      
      console.log("Options loaded:", {
        materials: materialsData?.length || 0,
        chapes: chapesData?.length || 0,
        glasses: glassesList?.length || 0,
        extras: extrasData?.length || 0,
        colors: colorsData?.length || 0
      });
    } catch (error) {
      console.error("Error fetching options: ", error);
      setSnackbar({
        open: true,
        message: "Error al cargar las opciones. Algunos elementos podrían no estar disponibles.",
        severity: "warning"
      });
    }
  };

  // Funciones de utilidad
  const toggleModelExpansion = (projectId, modelIndex) => {
    const key = `${projectId}-${modelIndex}`;
    setExpandedModels(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getModelStatusColor = (status) => {
    switch (status) {
      case 'cotizacion': return 'warning';
      case 'pendiente': return 'default';
      case 'enProceso': return 'info';
      case 'instalado': return 'success';
      case 'revisado': return 'primary';
      case 'pagada': return 'secondary';
      default: return 'default';
    }
  };

  const getModelStatusText = (status) => {
    switch (status) {
      case 'cotizacion': return 'Cotización';
      case 'pendiente': return 'Pendiente';
      case 'enProceso': return 'En Proceso';
      case 'instalado': return 'Instalado';
      case 'revisado': return 'Revisado';
      case 'pagada': return 'Pagada';
      default: return 'Desconocido';
    }
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : 'Sin asignar';
  };

  const getAvailableStatusOptions = (currentStatus) => {
    switch (currentStatus) {
      case 'quotation':
        return [
          { value: 'quotation', label: 'Cotización' },
          { value: 'active', label: 'Activo' },
          { value: 'inactive', label: 'Inactivo' }
        ];
      case 'active':
        return [
          { value: 'active', label: 'Activo' },
          { value: 'completed', label: 'Completado' }
        ];
      case 'completed':
        return [
          { value: 'completed', label: 'Completado' }
        ];
      case 'cancelled':
        return [
          { value: 'cancelled', label: 'Cancelado' }
        ];
      case 'inactive':
        return [
          { value: 'inactive', label: 'Inactivo' }
        ];
      default:
        return [
          { value: 'quotation', label: 'Cotización' },
          { value: 'active', label: 'Activo' },
          { value: 'completed', label: 'Completado' },
          { value: 'cancelled', label: 'Cancelado' },
          { value: 'inactive', label: 'Inactivo' }
        ];
    }
  };

  const canCompleteProject = (project) => {
    if (!project || !project.items || project.items.length === 0) {
      return { canComplete: false, reason: "El proyecto no tiene elementos" };
    }

    const invalidModels = project.items.filter(item => 
      !['instalado', 'revisado', 'pagada'].includes(item.status || 'cotizacion')
    );

    if (invalidModels.length > 0) {
      return { 
        canComplete: false, 
        reason: `${invalidModels.length} elemento(s) no están en estado válido para completar el proyecto` 
      };
    }

    return { canComplete: true, reason: "" };
  };

  // Funciones para manejar proyectos
  const handleViewDetails = (project) => {
    setSelectedProject(project);
    setShowDetailsDialog(true);
  };

  const handleEditProject = (project) => {
    setEditProject({ ...project });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    try {
      const originalProject = projects.find(p => p.id === editProject.id);
      const wasQuotation = originalProject?.status === "quotation";
      const isBecomingActive = editProject.status === "active";
      const wasActive = originalProject?.status === "active";
      const isBecomingCompleted = editProject.status === "completed";
      
      if (originalProject?.status === "active" && editProject.status === "quotation") {
        setSnackbar({
          open: true,
          message: "No se puede volver a cotización desde un proyecto activo.",
          severity: "error"
        });
        return;
      }
      
      if (wasActive && isBecomingCompleted) {
        const validationResult = canCompleteProject(originalProject);
        
        if (!validationResult.canComplete) {
          setSnackbar({
            open: true,
            message: validationResult.reason,
            severity: "warning"
          });
          return;
        }
      }
      
      if (wasQuotation && isBecomingActive) {
        setActivatingProject(editProject);
        setAdjustedTotal(round2(editProject.total));
        setInitialPayment(round2(editProject.total * 0.5));
        setShowActivateDialog(true);
        return;
      }
      
      await updateProject(editProject.id, {
        name: editProject.name,
        status: editProject.status
      });
      
      setSnackbar({
        open: true,
        message: "Proyecto actualizado exitosamente.",
        severity: "success"
      });
      
      setShowEditDialog(false);
      setEditProject(null);
      fetchProjects();
    } catch (error) {
      console.error("Error updating project: ", error);
      setSnackbar({
        open: true,
        message: "Error al actualizar el proyecto.",
        severity: "error"
      });
    }
  };

  const handleActivateProject = async () => {
    try {
      const updatedItems = activatingProject.items.map(item => ({
        ...item,
        status: "pendiente"
      }));

      await activateProject(activatingProject.id, activatingProject, round2(Number(initialPayment)), round2(Number(adjustedTotal)));
      
      await updateProjectWithRecalculatedTotal(activatingProject.id, updatedItems);
      
      const totalWasAdjusted = adjustedTotal !== activatingProject.total;
      const totalMessage = totalWasAdjusted ? `Total ajustado a ${formatCurrency(adjustedTotal)}.` : '';
      const paymentMessage = initialPayment > 0 ? `Anticipo de ${formatCurrency(initialPayment)} registrado.` : '';
      
      setSnackbar({
        open: true,
        message: `Proyecto activado exitosamente. Todos los modelos han sido cambiados a estado "Pendiente". ${totalMessage} ${paymentMessage}`.trim(),
        severity: "success"
      });
      
      setShowActivateDialog(false);
      setShowEditDialog(false);
      setActivatingProject(null);
      setEditProject(null);
      
      await fetchProjects();
    } catch (error) {
      console.error("Error activating project: ", error);
      setSnackbar({
        open: true,
        message: "Error al activar el proyecto.",
        severity: "error"
      });
    }
  };

  const handleInactivateProject = async (projectId, currentStatus) => {
    const newStatus = currentStatus === 'inactive' ? 'quotation' : 'inactive';
    const action = newStatus === 'inactive' ? "inactivar" : "reactivar";
    
    if (newStatus === 'inactive' && currentStatus !== 'quotation') {
      setSnackbar({
        open: true,
        message: "Solo los proyectos en estado 'Cotización' pueden ser inactivados. Los proyectos activos o completados no pueden ser inactivados.",
        severity: "warning"
      });
      return;
    }
    
    if (window.confirm(`¿Está seguro de que desea ${action} este proyecto?`)) {
      try {
        await updateProjectStatus(projectId, newStatus);
        setSnackbar({
          open: true,
          message: `Proyecto ${newStatus === 'inactive' ? 'inactivado' : 'reactivado'} exitosamente.`,
          severity: "success"
        });
        fetchProjects();
      } catch (error) {
        console.error(`Error ${action}ing project: `, error);
        setSnackbar({
          open: true,
          message: `Error al ${action} el proyecto.`,
          severity: "error"
        });
      }
    }
  };

  // Funciones para manejar pagos
  const handleOpenPaymentDialog = (project) => {
    setPaymentProject(project);
    setPaymentAmount(0);
    setPaymentDescription("");
    setPaymentMethod("efectivo");
    setShowPaymentDialog(true);
  };

  const handleClosePaymentDialog = () => {
    setShowPaymentDialog(false);
    setPaymentProject(null);
    setPaymentAmount(0);
    setPaymentDescription("");
    setPaymentMethod("efectivo");
  };

  const handleAddPayment = async () => {
    try {
      const amount = round2(Number(paymentAmount));
      if (amount <= 0) {
        setSnackbar({
          open: true,
          message: "El monto debe ser mayor a 0.",
          severity: "error"
        });
        return;
      }

      const payment = {
        date: new Date().toISOString(),
        amount,
        method: paymentMethod,
        description: paymentDescription || "Pago registrado"
      };

      await addPaymentToProject(paymentProject.id, paymentProject, payment);
      
      // Actualizar el proyecto local en el modal inmediatamente
      const currentPayments = paymentProject.payments || [];
      const newPayments = [...currentPayments, payment];
      const newDebt = round2(Math.max(0, (paymentProject.debt ?? paymentProject.total) - amount));
      
      const updatedPaymentProject = {
        ...paymentProject,
        payments: newPayments,
        debt: newDebt,
        ...(newDebt <= 0 && { status: "completed" })
      };
      
      // Actualizar el estado del proyecto en el modal
      setPaymentProject(updatedPaymentProject);
      
      // Si también está seleccionado en detalles, actualizarlo
      if (selectedProject && selectedProject.id === paymentProject.id) {
        setSelectedProject(updatedPaymentProject);
      }
      
      setSnackbar({
        open: true,
        message: `Pago de ${formatCurrency(amount)} registrado exitosamente.${newDebt <= 0 ? " Proyecto marcado como completado." : ""}`,
        severity: "success"
      });
      
      // Limpiar campos del formulario pero mantener el diálogo abierto
      setPaymentAmount(0);
      setPaymentDescription("");
      setPaymentMethod("efectivo");
      
      // Recargar proyectos en segundo plano para mantener sincronización
      fetchProjects();
    } catch (error) {
      console.error("Error adding payment: ", error);
      setSnackbar({
        open: true,
        message: "Error al registrar el pago.",
        severity: "error"
      });
    }
  };

  // Funciones para manejar modelos
  // Actualizar solo asignación de colaborador (rápido, sin abrir formulario completo)
  const updateProjectItemAssignee = async (projectId, itemIndex, assignedEmployeeId, area = undefined) => {
    try {
      const projectDoc = await getDoc(doc(db, "projects", projectId));
      if (!projectDoc.exists()) return;
      const projectData = projectDoc.data();
      const updatedItems = [...(projectData.items || [])];
      if (!updatedItems[itemIndex]) return;
      const item = updatedItems[itemIndex];
      const updates = {
        ...item,
        assignedEmployeeId: assignedEmployeeId || "",
        ...(area !== undefined && { area })
      };
      if (assignedEmployeeId && !item.workOrder) {
        updates.workOrder = { paymentStatus: "unpaid", createdAt: new Date().toISOString() };
      }
      updatedItems[itemIndex] = updates;
      await updateDoc(doc(db, "projects", projectId), stripUndefined({ items: updatedItems }));
      await fetchProjects();
      if (selectedProject?.id === projectId) {
        const updated = (await loadProjects()).find(p => p.id === projectId);
        if (updated) setSelectedProject(updated);
      }
      setSnackbar({ open: true, message: "Asignación actualizada.", severity: "success" });
    } catch (err) {
      console.error("Error updating assignee:", err);
      setSnackbar({ open: true, message: "Error al actualizar la asignación.", severity: "error" });
    }
  };

  // Galería de fotos del proyecto - subir directamente a Firebase Storage
  const addProjectImage = async (projectId, file) => {
    try {
      const imageId = Date.now().toString();
      const ext = (file.name || "").split(".").pop() || "png";
      const url = await uploadProjectImage(file, projectId, imageId);
      const projectDoc = await getDoc(doc(db, "projects", projectId));
      if (!projectDoc.exists()) return;
      const data = projectDoc.data();
      const path = `${imageId}.${ext}`;
      const images = [...(data.images || []), { id: imageId, url, path, createdAt: new Date().toISOString() }];
      await updateDoc(doc(db, "projects", projectId), { images });
      await fetchProjects();
      if (selectedProject?.id === projectId) {
        const updated = (await loadProjects()).find(p => p.id === projectId);
        if (updated) setSelectedProject(updated);
      }
      setSnackbar({ open: true, message: "Imagen agregada a la galería.", severity: "success" });
    } catch (err) {
      console.error("Error adding project image:", err);
      setSnackbar({ open: true, message: err.message || "Error al subir la imagen.", severity: "error" });
    }
  };

  const removeProjectImage = async (projectId, image) => {
    try {
      const path = image.path || `${image.id}.${(image.url || "").split(".").pop()?.split("?")[0] || "png"}`;
      await deleteProjectImage(projectId, path);
      const projectDoc = await getDoc(doc(db, "projects", projectId));
      if (!projectDoc.exists()) return;
      const data = projectDoc.data();
      const images = (data.images || []).filter(img => img.id !== image.id);
      await updateDoc(doc(db, "projects", projectId), { images });
      await fetchProjects();
      if (selectedProject?.id === projectId) {
        const updated = (await loadProjects()).find(p => p.id === projectId);
        if (updated) setSelectedProject(updated);
      }
      setSnackbar({ open: true, message: "Imagen eliminada.", severity: "success" });
    } catch (err) {
      console.error("Error removing project image:", err);
      setSnackbar({ open: true, message: "Error al eliminar la imagen.", severity: "error" });
    }
  };

  const handleEditModel = (project, modelIndex) => {
    const model = project.items[modelIndex];
    setEditingModel({
      ...model,
      projectId: project.id,
      modelIndex: modelIndex,
      area: model.area || "",
      assignedEmployeeId: model.assignedEmployeeId || "",
      status: model.status || "cotizacion",
      laborCostSelected: model.laborCostSelected || model.details?.laborCost || 0,
      laborCostActual: model.laborCostActual || model.details?.laborCostActual || 0,
      m2: model.m2 || 100
    });
    setShowModelEditDialog(true);
  };

  const handleSaveModelEdit = async () => {
    try {
      const updatedModel = {
        area: editingModel.area,
        assignedEmployeeId: editingModel.assignedEmployeeId,
        status: editingModel.status,
        laborCostSelected: editingModel.laborCostSelected,
        laborCostActual: editingModel.laborCostActual,
        m2: editingModel.m2 || 100
      };

      await updateProjectItem(editingModel.projectId, editingModel.modelIndex, updatedModel);
      
      setSnackbar({
        open: true,
        message: "Modelo actualizado exitosamente.",
        severity: "success"
      });
      
      setShowModelEditDialog(false);
      setEditingModel(null);
      
      // Actualizar datos automáticamente
      await fetchProjects();
      
      // Si hay un proyecto seleccionado, actualizarlo también
      if (selectedProject && selectedProject.id === editingModel.projectId) {
        const updatedProjects = await loadProjects();
        const updatedProject = updatedProjects.find(p => p.id === editingModel.projectId);
        if (updatedProject) {
          setSelectedProject(updatedProject);
        }
      }
    } catch (error) {
      console.error("Error updating model: ", error);
      setSnackbar({
        open: true,
        message: "Error al actualizar el modelo.",
        severity: "error"
      });
    }
  };

  const handleDeleteModel = async (project, itemIndex) => {
    if (project.status !== 'quotation') {
      setSnackbar({
        open: true,
        message: "Solo se pueden eliminar elementos de proyectos en estado 'Cotización'.",
        severity: "warning"
      });
      return;
    }

    if (window.confirm("¿Está seguro de que desea eliminar este elemento?")) {
      try {
        await deleteProjectItem(project.id, itemIndex);
        setSnackbar({
          open: true,
          message: "Elemento eliminado exitosamente.",
          severity: "success"
        });
        
        // Actualizar datos automáticamente
        await fetchProjects();
        
        // Si hay un proyecto seleccionado, actualizarlo también
        if (selectedProject && selectedProject.id === project.id) {
          const updatedProjects = await loadProjects();
          const updatedProject = updatedProjects.find(p => p.id === project.id);
          if (updatedProject) {
            setSelectedProject(updatedProject);
          }
        }
      } catch (error) {
        console.error("Error deleting item: ", error);
        setSnackbar({
          open: true,
          message: "Error al eliminar el elemento.",
          severity: "error"
        });
      }
    }
  };

  // Funciones para agregar modelos
  const handleAddModelToProject = (project) => {
    setAddingToProject(project);
    setShowAddModelDialog(true);
    setModelSearchQuery("");
    setSelectedModelToAdd(null);
    setModelData(null);
    setDimensions({ height: "1", width: "1" });
    setSelectedGlass(null);
  };

  const resolveNames = async (items, collectionName) => {
    return await Promise.all(
      items.map(async (item) => {
        try {
          const docSnapshot = await getDoc(doc(db, collectionName, item.id));
          if (docSnapshot.exists()) {
            return { ...item, name: docSnapshot.data().name };
          }
          return { ...item, name: "Desconocido" };
        } catch (error) {
          console.error(`Error fetching ${collectionName} name for ${item.id}:`, error);
          return { ...item, name: "Error" };
        }
      })
    );
  };

  const handleSelectModelToAdd = async (model) => {
    setSelectedModelToAdd(model);
    try {
      const materialsWithNames = await resolveNames(model.materials || [], "materials");
      const chapesWithNames = await resolveNames(model.chapes || [], "chapes");
      const glassesWithNames = await resolveNames(model.glasses || [], "glasses");
      const colorsWithNames = await resolveNames(model.colors || [], "colors");

      setModelData({
        ...model,
        materials: materialsWithNames,
        chapes: chapesWithNames,
        glasses: glassesWithNames,
        colors: colorsWithNames,
      });
    } catch (error) {
      console.error("Error resolving model names: ", error);
      setSnackbar({
        open: true,
        message: "Error al cargar los detalles del modelo.",
        severity: "error"
      });
    }
  };

  const calculatePrice = (formula, variables) => {
    try {
      const scope = {
        PRECIO: variables.PRECIO || 0,
        ALTO: variables.ALTO || 0,
        ANCHO: variables.ANCHO || 0,
        TRAMO: variables.TRAMO || 1,
      };
      const result = evaluate(formula, scope);
      return typeof result === "number" ? result : 0;
    } catch (error) {
      console.error("Error calculating price:", error);
      return 0;
    }
  };

  const getCalculations = () => {
    if (!modelData) return null;

    const heightInMeters = parseFloat(dimensions.height) / 100;
    const widthInMeters = parseFloat(dimensions.width) / 100;

    // Get selected color from the selected glass if available
    const selectedColor = selectedGlass ? colorsOptions.find(c => c.id === selectedGlass.colorId) : null;
  
    const materialsCalc = modelData.materials?.reduce(
      (acc, material) => {
        const matOption = materialsOptions.find((m) => m.id === material.id);
        const basePrice = matOption ? parseFloat(matOption.price || "0") : 0;
        const tramo = matOption ? parseFloat(matOption.stretch || "6.1") : 6.1;

        // Apply color increment if color is selected
        const colorIncrement = selectedColor ? parseFloat(selectedColor.percentage || "0") : 0;
        const currentPrice = basePrice * (1 + colorIncrement / 100);
  
        const meterage = calculatePrice(material.formula, {
          PRECIO: 1,
          ALTO: heightInMeters,
          ANCHO: widthInMeters,
          TRAMO: 1,
        });

        const basePriceTotal = calculatePrice(material.formula, {
          PRECIO: basePrice,
          ALTO: heightInMeters,
          ANCHO: widthInMeters,
          TRAMO: tramo,
        });

        const priceWithColor = calculatePrice(material.formula, {
          PRECIO: currentPrice,
          ALTO: heightInMeters,
          ANCHO: widthInMeters,
          TRAMO: tramo,
        });
  
        return {
          price: acc.price + priceWithColor,
          basePrice: acc.basePrice + basePriceTotal, // Base price for labor calculation
          meterage: acc.meterage + meterage,
          items: [...acc.items, { 
            name: material.name, 
            meterage, 
            price: priceWithColor,
            basePrice: basePriceTotal,
            colorName: selectedColor?.name || "Natural",
            colorPercentage: colorIncrement
          }],
        };
      },
      { price: 0, basePrice: 0, meterage: 0, items: [] }
    ) || { price: 0, basePrice: 0, meterage: 0, items: [] };
  
    const chapesCalc = modelData.chapes?.reduce(
      (acc, chape) => {
        const chapeOption = chapesOptions.find((c) => c.id === chape.id);
        const currentPrice = chapeOption ? parseFloat(chapeOption.price || "0") : 0;
  
        const pieces = calculatePrice(chape.formula, {
          PRECIO: 1,
          ALTO: heightInMeters,
          ANCHO: widthInMeters,
          TRAMO: 1,
        });
  
        const price = calculatePrice(chape.formula, {
          PRECIO: currentPrice,
          ALTO: heightInMeters,
          ANCHO: widthInMeters,
          TRAMO: 1,
        });
  
        return {
          price: acc.price + price,
          pieces: acc.pieces + pieces,
          items: [...acc.items, { name: chape.name, pieces, price }],
        };
      },
      { price: 0, pieces: 0, items: [] }
    ) || { price: 0, pieces: 0, items: [] };
  
    const glassesCalc = modelData.glasses?.reduce(
      (acc, glass) => {
        const meterage = calculatePrice(glass.formula, {
          PRECIO: 1,
          ALTO: heightInMeters,
          ANCHO: widthInMeters,
        });
  
        const glassPrice = selectedGlass ? parseFloat(selectedGlass.priceInstalled || "0") : 0;
        const price = meterage * glassPrice;
  
        return {
          price: acc.price + price,
          meterage: acc.meterage + meterage,
          items: [...acc.items, { name: selectedGlass ? selectedGlass.name : glass.name, meterage, price }],
        };
      },
      { price: 0, meterage: 0, items: [] }
    ) || { price: 0, meterage: 0, items: [] };

    // Labor cost calculation using basePrice (natural price without color) as in presupuestos
    // IMPORTANT: Use basePrice for labor calculation, NOT the price with color
    const laborCost = parseFloat(modelData.manpower || "0") * materialsCalc.basePrice;
    const laborCostActual = Math.round(parseFloat(modelData.manpowerActual || "0"));
    const glassLaborCostPerM2 = parseFloat(modelData.m2 || "100");
    const glassLaborCost = Math.round(glassesCalc.meterage * glassLaborCostPerM2);
    const totalLaborActual = laborCostActual + glassLaborCost;
    const totalGeneral = materialsCalc.price + chapesCalc.price + glassesCalc.price + laborCost;

    return { 
      materials: materialsCalc, 
      chapes: chapesCalc, 
      glasses: glassesCalc, 
      laborCost: laborCost || 0, 
      laborCostActual: laborCostActual || 0,
      m2: glassLaborCostPerM2,
      glassLaborCost: glassLaborCost || 0,
      totalLaborActual: totalLaborActual || 0,
      totalGeneral: totalGeneral || 0,
      selectedColor: selectedColor
    };
  };

  const addModelToProject = async () => {
    if (!selectedGlass) {
      setSnackbar({
        open: true,
        message: "Debe seleccionar un vidrio antes de agregar el modelo.",
        severity: "error"
      });
      return;
    }

    try {
      const calculations = getCalculations();
      
      await addModelToProjectService(addingToProject.id, {
        modelId: selectedModelToAdd.id,
        modelName: selectedModelToAdd.name,
        dimensions: {
          height: parseFloat(dimensions.height),
          width: parseFloat(dimensions.width)
        },
        selectedGlass,
        selectedColor: calculations?.selectedColor || null,
        calculations
      });

      setSnackbar({
        open: true,
        message: "Modelo agregado exitosamente al proyecto.",
        severity: "success"
      });
      
      setShowAddModelDialog(false);
      setAddingToProject(null);
      setSelectedModelToAdd(null);
      setModelData(null);
      fetchProjects();
      
      // Si hay un proyecto seleccionado, actualizarlo también
      if (selectedProject && selectedProject.id === addingToProject.id) {
        const updatedProjects = await loadProjects();
        const updatedProject = updatedProjects.find(p => p.id === addingToProject.id);
        if (updatedProject) {
          setSelectedProject(updatedProject);
        }
      }
    } catch (error) {
      console.error("Error adding model to project: ", error);
      setSnackbar({
        open: true,
        message: "Error al agregar el modelo al proyecto.",
        severity: "error"
      });
    }
  };

  // Funciones para re-cotizar
  const handleRecalcModel = async (project, modelIndex) => {
    const model = project.items[modelIndex];
    
    // Ensure we have the necessary data
    if (!model || !model.modelId) {
      setSnackbar({
        open: true,
        message: "No se puede re-cotizar este modelo. Datos incompletos.",
        severity: "error"
      });
      return;
    }

    setRecalcModel({ ...model, projectId: project.id, modelIndex });
    setRecalcDimensions({ 
      height: model.dimensions?.height?.toString() || "100", 
      width: model.dimensions?.width?.toString() || "100" 
    });
    setRecalcSelectedGlass(model.selectedGlass || null);
    setRecalcSelectedColor(model.selectedColor || null);
    setShowRecalcDialog(true);
  };

  const getRecalcCalculations = () => {
    if (!recalcModel) return null;

    const heightInMeters = parseFloat(recalcDimensions.height) / 100;
    const widthInMeters = parseFloat(recalcDimensions.width) / 100;
    
    // Get model data from database to recalculate with current prices
    const modelFromDB = models.find(m => m.id === recalcModel.modelId);
    if (!modelFromDB) {
      console.error("Model not found in database");
      return null;
    }
    
    const materialsCalc = modelFromDB.materials?.reduce((acc, material) => {
      const matOption = materialsOptions.find((m) => m.id === material.id);
      if (!matOption) return acc;
      
      const basePrice = parseFloat(matOption.price || "0");
      const tramo = parseFloat(matOption.stretch || "6.1");

      // Apply color increment if color is selected
      const colorIncrement = recalcSelectedColor ? parseFloat(recalcSelectedColor.percentage || "0") : 0;
      const currentPrice = basePrice * (1 + colorIncrement / 100);
      
      // Recalculate with new dimensions using the original formula
      const meterage = calculatePrice(material.formula, {
        PRECIO: 1,
        ALTO: heightInMeters,
        ANCHO: widthInMeters,
        TRAMO: 1,
      });

      const basePriceTotal = calculatePrice(material.formula, {
        PRECIO: basePrice,
        ALTO: heightInMeters,
        ANCHO: widthInMeters,
        TRAMO: tramo,
      });

      const priceWithColor = calculatePrice(material.formula, {
        PRECIO: currentPrice,
        ALTO: heightInMeters,
        ANCHO: widthInMeters,
        TRAMO: tramo,
      });
      
      return {
        price: acc.price + priceWithColor,
        basePrice: acc.basePrice + basePriceTotal, // Price base for labor calculation
        meterage: acc.meterage + meterage,
        items: [...acc.items, { 
          name: material.name, 
          meterage, 
          price: priceWithColor,
          basePrice: basePriceTotal,
          colorName: recalcSelectedColor?.name || "Natural",
          colorPercentage: colorIncrement
        }]
      };
    }, { price: 0, basePrice: 0, meterage: 0, items: [] }) || { price: 0, basePrice: 0, meterage: 0, items: [] };
    
    const chapesCalc = modelFromDB.chapes?.reduce((acc, chape) => {
      const chapeOption = chapesOptions.find((c) => c.id === chape.id);
      if (!chapeOption) return acc;
      
      const currentPrice = parseFloat(chapeOption.price || "0");
      
      const pieces = calculatePrice(chape.formula, {
        PRECIO: 1,
        ALTO: heightInMeters,
        ANCHO: widthInMeters,
        TRAMO: 1,
      });
      
      const price = calculatePrice(chape.formula, {
        PRECIO: currentPrice,
        ALTO: heightInMeters,
        ANCHO: widthInMeters,
        TRAMO: 1,
      });
      
      return {
        price: acc.price + price,
        pieces: acc.pieces + pieces,
        items: [...acc.items, { name: chape.name, pieces, price }]
      };
    }, { price: 0, pieces: 0, items: [] }) || { price: 0, pieces: 0, items: [] };
    
    const glassesCalc = modelFromDB.glasses?.reduce((acc, glass) => {
      const meterage = calculatePrice(glass.formula, {
        PRECIO: 1,
        ALTO: heightInMeters,
        ANCHO: widthInMeters,
      });
      
      const glassPrice = recalcSelectedGlass ? parseFloat(recalcSelectedGlass.priceInstalled || "0") : 0;
      const price = meterage * glassPrice;
      
      return {
        price: acc.price + price,
        meterage: acc.meterage + meterage,
        items: [...acc.items, { name: recalcSelectedGlass ? recalcSelectedGlass.name : glass.name, meterage, price }]
      };
    }, { price: 0, meterage: 0, items: [] }) || { price: 0, meterage: 0, items: [] };
    
    // Labor cost calculation using basePrice (natural price without color) as in presupuestos
    // IMPORTANT: Use basePrice for labor calculation, NOT the price with color
    const laborCost = parseFloat(modelFromDB.manpower || "0") * materialsCalc.basePrice;
    const laborCostActual = Math.round(parseFloat(modelFromDB.manpowerActual || "0")); // Integer

    // Glass labor cost per m² (independent from aluminum)
    const glassLaborCostPerM2 = parseFloat(modelFromDB.m2 || "100");
    const glassLaborCost = Math.round(glassesCalc.meterage * glassLaborCostPerM2); // Integer
    
    // Total actual labor cost that will be paid to the worker
    const totalLaborActual = laborCostActual + glassLaborCost;

    // General total (for quotation only - doesn't include glass labor cost)
    const totalGeneral = materialsCalc.price + chapesCalc.price + glassesCalc.price + laborCost;

    return { 
      materials: materialsCalc, 
      chapes: chapesCalc, 
      glasses: glassesCalc, 
      laborCost: laborCost || 0, 
      laborCostActual: laborCostActual || 0,
      m2: glassLaborCostPerM2,
      glassLaborCost: glassLaborCost || 0,
      totalLaborActual: totalLaborActual || 0,
      totalGeneral: totalGeneral || 0
    };
  };

  // Recalcular item de modelo en proyecto (para color/vidrio global o individual)
  const recalculateProjectModelItem = async (item, newColor, newGlass) => {
    try {
      const modelDoc = await getDoc(doc(db, "models", item.modelId));
      if (!modelDoc.exists()) return item;
      const data = modelDoc.data();
      const materials = data.materials ? await resolveNames(data.materials, "materials") : [];
      const chapes = data.chapes ? await resolveNames(data.chapes, "chapes") : [];
      const glasses = data.glasses ? await resolveNames(data.glasses, "glasses") : [];
      const formulas = { materials, chapes, glasses, manpower: data.manpower, manpowerActual: data.manpowerActual, m2: data.m2 };

      const effectiveColor = newColor !== undefined ? newColor : item.selectedColor;
      const effectiveGlass = newGlass !== undefined ? newGlass : item.selectedGlass;
      const heightInMeters = parseFloat(item.dimensions?.height || 0) / 100;
      const widthInMeters = parseFloat(item.dimensions?.width || 0) / 100;

      const materialsCalc = (formulas.materials || []).reduce((acc, material) => {
        const matOption = materialsOptions.find(m => m.id === material.id);
        const basePrice = matOption ? parseFloat(matOption.price || "0") : 0;
        const tramo = matOption ? parseFloat(matOption.stretch || "6.1") : 6.1;
        const colorIncrement = effectiveColor ? parseFloat(effectiveColor.percentage || "0") : 0;
        const currentPrice = basePrice * (1 + colorIncrement / 100);
        const meterage = calculatePrice(material.formula, { PRECIO: 1, ALTO: heightInMeters, ANCHO: widthInMeters, TRAMO: 1 });
        const basePriceTotal = calculatePrice(material.formula, { PRECIO: basePrice, ALTO: heightInMeters, ANCHO: widthInMeters, TRAMO: tramo });
        const priceWithColor = calculatePrice(material.formula, { PRECIO: currentPrice, ALTO: heightInMeters, ANCHO: widthInMeters, TRAMO: tramo });
        return {
          price: acc.price + priceWithColor,
          basePrice: acc.basePrice + basePriceTotal,
          meterage: acc.meterage + meterage,
          items: [...acc.items, { name: material.name, meterage, price: priceWithColor, basePrice: basePriceTotal }]
        };
      }, { price: 0, basePrice: 0, meterage: 0, items: [] });

      const chapesCalc = (formulas.chapes || []).reduce((acc, chape) => {
        const chapeOption = chapesOptions.find(c => c.id === chape.id);
        const currentPrice = chapeOption ? parseFloat(chapeOption.price || "0") : 0;
        const pieces = calculatePrice(chape.formula, { PRECIO: 1, ALTO: heightInMeters, ANCHO: widthInMeters, TRAMO: 1 });
        const price = calculatePrice(chape.formula, { PRECIO: currentPrice, ALTO: heightInMeters, ANCHO: widthInMeters, TRAMO: 1 });
        return { price: acc.price + price, pieces: acc.pieces + pieces, items: [...acc.items, { name: chape.name, pieces, price }] };
      }, { price: 0, pieces: 0, items: [] });

      const glassesCalc = (formulas.glasses || []).reduce((acc, glass) => {
        const meterage = calculatePrice(glass.formula, { PRECIO: 1, ALTO: heightInMeters, ANCHO: widthInMeters });
        const glassPrice = effectiveGlass ? parseFloat(effectiveGlass.priceInstalled || effectiveGlass.price || "0") : 0;
        const price = meterage * glassPrice;
        return {
          price: acc.price + price,
          meterage: acc.meterage + meterage,
          items: [...acc.items, { name: effectiveGlass ? effectiveGlass.name : glass.name, meterage, price }]
        };
      }, { price: 0, meterage: 0, items: [] });

      const laborCost = parseFloat(formulas.manpower || "0") * materialsCalc.basePrice;
      const laborCostActual = Math.round(parseFloat(formulas.manpowerActual || "0"));
      const glassLaborCost = Math.round((formulas.m2 || 100) * glassesCalc.meterage);
      const totalGeneral = materialsCalc.price + chapesCalc.price + glassesCalc.price + laborCost;

      return {
        ...item,
        selectedColor: effectiveColor,
        selectedGlass: effectiveGlass,
        total: round2(totalGeneral),
        laborCostSelected: round2(laborCost),
        laborCostActual: round2(laborCostActual),
        glassLaborCost: round2(glassLaborCost),
        totalLaborActual: round2(laborCostActual + glassLaborCost),
        details: {
          ...item.details,
          materials: materialsCalc,
          chapes: chapesCalc,
          glasses: glassesCalc,
          laborCost: round2(laborCost),
          laborCostActual: round2(laborCostActual),
          glassLaborCost: round2(glassLaborCost),
          totalLaborActual: round2(laborCostActual + glassLaborCost)
        }
      };
    } catch (err) {
      console.error("Error recalculating project model:", err);
      return item;
    }
  };

  const recalculateProjectIndividualItem = (item, newColor, newGlass) => {
    if (item.itemType === "material" && newColor !== undefined) {
      const matOption = materialsOptions.find(m => m.id === item.itemId);
      if (!matOption) return { ...item, selectedColor: newColor };
      const basePrice = parseFloat(matOption.price || 0);
      const tramo = parseFloat(matOption.stretch || 6.1);
      const colorIncrement = newColor ? parseFloat(newColor.percentage || 0) : 0;
      const adjustedPrice = basePrice * (1 + colorIncrement / 100);
      const quantityType = item.quantityType || "metros";
      const newTotal = quantityType === "tramos"
        ? item.quantity * adjustedPrice
        : (item.quantity / tramo) * adjustedPrice;
      return {
        ...item,
        selectedColor: newColor,
        unitPrice: round2(quantityType === "tramos" ? adjustedPrice : adjustedPrice / tramo),
        total: round2(newTotal)
      };
    }
    if (item.itemType === "vidrio" && newGlass !== undefined && newGlass) {
      const area = item.area ?? (item.dimensions ? (item.dimensions.height / 100) * (item.dimensions.width / 100) : item.quantity);
      const newPrice = parseFloat(newGlass.priceInstalled || newGlass.price || 0);
      return {
        ...item,
        selectedGlass: newGlass,
        itemName: newGlass.name,
        unitPrice: round2(newPrice),
        total: round2(area * newPrice)
      };
    }
    return item;
  };

  const applyGlobalSettingsToProject = async (projectId) => {
    const project = projects.find(p => p.id === projectId) || selectedProject;
    if (!project || project.id !== projectId || !project.items?.length) return;

    setIsQuotationRecalculating(true);
    try {
      const updatedItems = [];
      for (let i = 0; i < project.items.length; i++) {
        const item = project.items[i];
        if (item.type === "individual") {
          let updated = item;
          if (item.itemType === "material" && quotationGlobalColor !== undefined)
            updated = recalculateProjectIndividualItem(updated, quotationGlobalColor, undefined);
          if (item.itemType === "vidrio" && quotationGlobalGlass)
            updated = recalculateProjectIndividualItem(updated, undefined, quotationGlobalGlass);
          updatedItems.push(updated);
        } else {
          updatedItems.push(await recalculateProjectModelItem(item, quotationGlobalColor, quotationGlobalGlass));
        }
      }
      await updateProjectWithRecalculatedTotal(projectId, updatedItems);
      setSnackbar({ open: true, message: "Proyecto recalculado con la configuración global.", severity: "success" });
      await fetchProjects();
      if (selectedProject?.id === projectId) {
        const updated = (await loadProjects()).find(p => p.id === projectId);
        if (updated) setSelectedProject(updated);
      }
    } catch (err) {
      console.error("Error applying global settings:", err);
      setSnackbar({ open: true, message: "Error al recalcular el proyecto.", severity: "error" });
    } finally {
      setIsQuotationRecalculating(false);
    }
  };

  const updateProjectItemColorInProject = async (projectId, itemIndex, newColor) => {
    const project = projects.find(p => p.id === projectId) || selectedProject;
    if (!project || project.id !== projectId) return;

    setIsQuotationRecalculating(true);
    try {
      const items = [...(project.items || [])];
      const item = items[itemIndex];
      if (!item) return;
      if (item.type === "individual")
        items[itemIndex] = recalculateProjectIndividualItem(item, newColor, undefined);
      else
        items[itemIndex] = await recalculateProjectModelItem(item, newColor, undefined);
      await updateProjectWithRecalculatedTotal(projectId, items);
      await fetchProjects();
      if (selectedProject?.id === projectId) {
        const updated = (await loadProjects()).find(p => p.id === projectId);
        if (updated) setSelectedProject(updated);
      }
    } catch (err) {
      console.error("Error updating item color:", err);
    } finally {
      setIsQuotationRecalculating(false);
    }
  };

  const updateProjectItemGlassInProject = async (projectId, itemIndex, newGlass) => {
    const project = projects.find(p => p.id === projectId) || selectedProject;
    if (!project || project.id !== projectId) return;

    setIsQuotationRecalculating(true);
    try {
      const items = [...(project.items || [])];
      const item = items[itemIndex];
      if (!item) return;
      if (item.type === "individual")
        items[itemIndex] = recalculateProjectIndividualItem(item, undefined, newGlass);
      else
        items[itemIndex] = await recalculateProjectModelItem(item, undefined, newGlass);
      await updateProjectWithRecalculatedTotal(projectId, items);
      await fetchProjects();
      if (selectedProject?.id === projectId) {
        const updated = (await loadProjects()).find(p => p.id === projectId);
        if (updated) setSelectedProject(updated);
      }
    } catch (err) {
      console.error("Error updating item glass:", err);
    } finally {
      setIsQuotationRecalculating(false);
    }
  };

  const confirmRecalcModel = async () => {
    try {
      const calculations = getRecalcCalculations();
      
      if (!calculations) {
        setSnackbar({
          open: true,
          message: "Error al calcular los valores del modelo.",
          severity: "error"
        });
        return;
      }
      
      // Ensure all values are defined and clean
      const updatedModel = {
        dimensions: {
          height: parseFloat(recalcDimensions.height) || 0,
          width: parseFloat(recalcDimensions.width) || 0
        },
        selectedGlass: recalcSelectedGlass || null,
        selectedColor: recalcSelectedColor || null,
        laborCostSelected: round2(calculations.laborCost || 0),
        laborCostActual: round2(calculations.laborCostActual || 0),
        m2: round2(calculations.m2 || 100),
        total: round2(calculations.totalGeneral || 0),
        details: {
          materials: calculations.materials || { price: 0, meterage: 0, items: [] },
          chapes: calculations.chapes || { price: 0, pieces: 0, items: [] },
          glasses: calculations.glasses || { price: 0, meterage: 0, items: [] },
          laborCost: calculations.laborCost || 0,
          laborCostActual: calculations.laborCostActual || 0
        }
      };

      console.log("DEBUG - Saving updated model:", {
        selectedColor: recalcSelectedColor,
        selectedGlass: recalcSelectedGlass,
        updatedModel
      });

      await updateProjectItem(recalcModel.projectId, recalcModel.modelIndex, updatedModel);
      
      setSnackbar({
        open: true,
        message: "Modelo re-cotizado exitosamente.",
        severity: "success"
      });
      
      setShowRecalcDialog(false);
      setRecalcModel(null);
      fetchProjects();
      
      // Si hay un proyecto seleccionado, actualizarlo también
      if (selectedProject && selectedProject.id === recalcModel.projectId) {
        const updatedProjects = await loadProjects();
        const updatedProject = updatedProjects.find(p => p.id === recalcModel.projectId);
        if (updatedProject) {
          setSelectedProject(updatedProject);
        }
      }
    } catch (error) {
      console.error("Error recalculating model: ", error);
      setSnackbar({
        open: true,
        message: "Error al re-cotizar el modelo.",
        severity: "error"
      });
    }
  };

  // Funciones para elementos individuales
  const handleAddIndividualItem = (project) => {
    setAddingToProject(project);
    setShowAddIndividualItemDialog(true);
    
    // Reset all states
    setIndividualItemType("material");
    setSelectedIndividualMaterial(null);
    setSelectedIndividualHerraje(null);
    setSelectedIndividualVidrio(null);
    setIndividualItemQuantity(1);
    setIndividualItemQuantityType("metros");
    setIndividualItemDimensions({ height: "", width: "" });
    setIndividualItemPriceType("installed");
    setIndividualItemCalculation("");
    setIndividualItemTotal(0);
  };

  const confirmAddIndividualItem = async () => {
    try {
      let selectedItem = null;
      let unitPrice = 0;
      let total = 0;
      let calculationDetails = "";
      
      switch (individualItemType) {
        case 'material':
          selectedItem = selectedIndividualMaterial;
          unitPrice = parseFloat(selectedItem?.price || "0");
          const tramo = parseFloat(selectedItem?.stretch || "6.1");
          if (individualItemQuantityType === "metros") {
            total = (individualItemQuantity / tramo) * unitPrice;
            calculationDetails = `${individualItemQuantity}m ÷ ${tramo}m/tramo × $${unitPrice} = $${total.toFixed(2)}`;
          } else {
            total = individualItemQuantity * unitPrice;
            calculationDetails = `${individualItemQuantity} tramos × $${unitPrice} = $${total.toFixed(2)}`;
          }
          break;
        case 'herraje':
          selectedItem = selectedIndividualHerraje;
          unitPrice = parseFloat(selectedItem?.price || "0");
          total = individualItemQuantity * unitPrice;
          calculationDetails = `${individualItemQuantity} piezas × $${unitPrice} = $${total.toFixed(2)}`;
          break;
        case 'vidrio':
          selectedItem = selectedIndividualVidrio;
          unitPrice = parseFloat(selectedItem?.[individualItemPriceType === "installed" ? "priceInstalled" : "price"] || "0");
          let area = individualItemQuantity;
          if (individualItemDimensions.height && individualItemDimensions.width) {
            area = (parseFloat(individualItemDimensions.height) / 100) * (parseFloat(individualItemDimensions.width) / 100);
            calculationDetails = `${individualItemDimensions.height}cm × ${individualItemDimensions.width}cm = ${area.toFixed(2)}m² × $${unitPrice} = $${(area * unitPrice).toFixed(2)}`;
          } else {
            calculationDetails = `${area}m² × $${unitPrice} = $${(area * unitPrice).toFixed(2)}`;
          }
          total = area * unitPrice;
          break;
        case 'extra':
          selectedItem = selectedIndividualExtra;
          unitPrice = parseFloat(selectedItem?.price || "0");
          total = individualItemQuantity * unitPrice;
          calculationDetails = `${individualItemQuantity} × $${unitPrice} = $${total.toFixed(2)}`;
          break;
      }

      if (!selectedItem) {
        setSnackbar({
          open: true,
          message: "Debe seleccionar un elemento.",
          severity: "error"
        });
        return;
      }

      let itemPayload = {
        itemType: individualItemType,
        itemId: selectedItem.id || '',
        itemName: selectedItem.name || '',
        quantity: individualItemQuantity || 0,
        unitPrice: round2(unitPrice || 0),
        total: round2(total || 0),
        dimensions: (individualItemDimensions.height && individualItemDimensions.width) ? {
          height: parseFloat(individualItemDimensions.height),
          width: parseFloat(individualItemDimensions.width)
        } : null
      };
      if (individualItemType === "material") {
        const tramoMat = parseFloat(selectedItem?.stretch || "6.1");
        itemPayload.quantityType = individualItemQuantityType;
        itemPayload.tramo = tramoMat;
        itemPayload.meters = individualItemQuantityType === "tramos" ? individualItemQuantity * tramoMat : individualItemQuantity;
      } else if (individualItemType === "herraje") {
        itemPayload.quantityType = "piezas";
      } else if (individualItemType === "vidrio") {
        const areaVid = individualItemDimensions.height && individualItemDimensions.width
          ? (parseFloat(individualItemDimensions.height) / 100) * (parseFloat(individualItemDimensions.width) / 100)
          : individualItemQuantity;
        itemPayload.quantityType = individualItemQuantityType;
        itemPayload.area = areaVid;
      } else if (individualItemType === "extra") {
        itemPayload.quantityType = "unidad";
      }
      await addIndividualItemToProject(addingToProject.id, itemPayload, addingToProject.status);

      setSnackbar({
        open: true,
        message: `Elemento agregado exitosamente. ${calculationDetails}`,
        severity: "success"
      });
      
      setShowAddIndividualItemDialog(false);
      setAddingToProject(null);
      
      // Actualizar datos automáticamente
      await fetchProjects();
      
      // Si hay un proyecto seleccionado, actualizarlo también
      if (selectedProject && selectedProject.id === addingToProject.id) {
        const updatedProjects = await loadProjects();
        const updatedProject = updatedProjects.find(p => p.id === addingToProject.id);
        if (updatedProject) {
          setSelectedProject(updatedProject);
        }
      }
    } catch (error) {
      console.error("Error adding individual item: ", error);
      setSnackbar({
        open: true,
        message: "Error al agregar el elemento.",
        severity: "error"
      });
    }
  };

  const handleRecalcIndividualItem = (project, itemIndex) => {
    const item = project.items[itemIndex];
    console.log("DEBUG - Item to recalc:", item); // Debug log
    setRecalcIndividualItem({ ...item, projectId: project.id, itemIndex });
    setRecalcIndividualQuantity(item.quantity || 1);
    setRecalcIndividualQuantityType("metros");
    setRecalcIndividualDimensions(item.dimensions || { height: "", width: "" });
    setRecalcIndividualPriceType("installed");
    // Reset preview
    setRecalcIndividualPreview({ unitPrice: 0, total: 0, calculation: "" });
    setShowRecalcIndividualDialog(true);
  };

  const confirmRecalcIndividualItem = async () => {
    try {
      let unitPrice = 0;
      let total = 0;
      
      switch (recalcIndividualItem.itemType) {
        case 'material':
          const material = materialsOptions.find(m => m.id === recalcIndividualItem.itemId);
          if (material) {
            unitPrice = parseFloat(material.price || "0");
            if (recalcIndividualQuantityType === "metros") {
              const tramo = parseFloat(material.stretch || "6.1");
              total = (recalcIndividualQuantity / tramo) * unitPrice;
            } else {
              total = recalcIndividualQuantity * unitPrice;
            }
          }
          break;
        case 'herraje':
          const herraje = chapesOptions.find(c => c.id === recalcIndividualItem.itemId);
          if (herraje) {
            unitPrice = parseFloat(herraje.price || "0");
            total = recalcIndividualQuantity * unitPrice;
          }
          break;
        case 'vidrio':
          // Buscar el vidrio por itemId, considerando tanto id como originalId
          const vidrio = glassesOptions.find(g => 
            g.id === recalcIndividualItem.itemId || g.originalId === recalcIndividualItem.itemId
          );
          if (vidrio) {
            unitPrice = parseFloat(vidrio[recalcIndividualPriceType === "installed" ? "priceInstalled" : "price"] || "0");
            let area = recalcIndividualQuantity;
            
            // If dimensions are provided, calculate area from dimensions
            if (recalcIndividualDimensions.height && recalcIndividualDimensions.width) {
              area = (parseFloat(recalcIndividualDimensions.height) / 100) * (parseFloat(recalcIndividualDimensions.width) / 100);
            }
            
            total = area * unitPrice;
            console.log(`Glass found: ${vidrio.name}, unitPrice: ${unitPrice}, area: ${area}, total: ${total}`); // Debug log
          } else {
            console.error(`Glass not found for itemId: ${recalcIndividualItem.itemId}`); // Debug log
            console.log("Available glasses:", glassesOptions.map(g => ({ id: g.id, originalId: g.originalId, name: g.name }))); // Debug log
          }
          break;
        case 'extra':
          const extraItem = extrasOptions.find(e => e.id === recalcIndividualItem.itemId);
          if (extraItem) {
            unitPrice = parseFloat(extraItem.price || "0");
            total = recalcIndividualQuantity * unitPrice;
          }
          break;
      }

      const updatedItem = {
        quantity: recalcIndividualQuantity,
        unitPrice: round2(unitPrice),
        total: round2(total),
        dimensions: recalcIndividualDimensions.height && recalcIndividualDimensions.width ? {
          height: parseFloat(recalcIndividualDimensions.height),
          width: parseFloat(recalcIndividualDimensions.width)
        } : undefined
      };

      console.log("Updating item with:", updatedItem); // Debug log

      await updateProjectItem(recalcIndividualItem.projectId, recalcIndividualItem.itemIndex, updatedItem);
      
      setSnackbar({
        open: true,
        message: `Elemento re-cotizado exitosamente. Nuevo total: ${formatCurrency(total)}`,
        severity: "success"
      });
      
      setShowRecalcIndividualDialog(false);
      setRecalcIndividualItem(null);
      fetchProjects();
      
      // Si hay un proyecto seleccionado, actualizarlo también
      if (selectedProject && selectedProject.id === recalcIndividualItem.projectId) {
        const updatedProjects = await loadProjects();
        const updatedProject = updatedProjects.find(p => p.id === recalcIndividualItem.projectId);
        if (updatedProject) {
          setSelectedProject(updatedProject);
        }
      }
    } catch (error) {
      console.error("Error recalculating individual item: ", error);
      setSnackbar({
        open: true,
        message: "Error al re-cotizar el elemento.",
        severity: "error"
      });
    }
  };

  // Estados para cambio masivo de estados
  const [showMassStatusDialog, setShowMassStatusDialog] = useState(false);
  const [massStatusProject, setMassStatusProject] = useState(null);
  const [massStatusValue, setMassStatusValue] = useState("instalado");

  // Funciones para manejo de cambio de estado masivo
  const handleMassStatusChange = (project) => {
    setMassStatusProject(project);
    setShowMassStatusDialog(true);
  };

  const confirmMassStatusChange = async () => {
    try {
      await updateAllProjectItemsStatus(massStatusProject.id, massStatusValue);
      setSnackbar({
        open: true,
        message: `Todos los elementos del proyecto han sido cambiados a estado "${getModelStatusText(massStatusValue)}".`,
        severity: "success"
      });
      setShowMassStatusDialog(false);
      setMassStatusProject(null);
      
      // Actualizar datos automáticamente
      await fetchProjects();
      
      // Si hay un proyecto seleccionado, actualizarlo también
      if (selectedProject && selectedProject.id === massStatusProject.id) {
        const updatedProjects = await loadProjects();
        const updatedProject = updatedProjects.find(p => p.id === massStatusProject.id);
        if (updatedProject) {
          setSelectedProject(updatedProject);
        }
      }
    } catch (error) {
      console.error("Error updating all items status: ", error);
      setSnackbar({
        open: true,
        message: "Error al cambiar el estado de todos los elementos.",
        severity: "error"
      });
    }
  };

  // Asignar todos los elementos del proyecto a un colaborador
  const [showAssignAllDialog, setShowAssignAllDialog] = useState(false);
  const [assignAllProject, setAssignAllProject] = useState(null);
  const [assignAllEmployeeId, setAssignAllEmployeeId] = useState("");

  const handleAssignAllToCollaborator = (project) => {
    setAssignAllProject(project);
    setAssignAllEmployeeId("");
    setShowAssignAllDialog(true);
  };

  const getAssignAllWarning = () => {
    if (!assignAllProject?.items?.length) return null;
    const withAssignee = assignAllProject.items.filter(i => i.assignedEmployeeId);
    if (withAssignee.length === 0) return null;
    const others = [...new Set(withAssignee.map(i => i.assignedEmployeeId))].filter(Boolean);
    const names = others.map(id => employees.find(e => e.id === id)?.name || employees.find(e => e.id === id)?.displayName || id).join(", ");
    return { count: withAssignee.length, names };
  };

  const confirmAssignAllToCollaborator = async () => {
    if (!assignAllProject || !assignAllEmployeeId) {
      setSnackbar({ open: true, message: "Selecciona un colaborador.", severity: "warning" });
      return;
    }
    try {
      const projectDoc = await getDoc(doc(db, "projects", assignAllProject.id));
      if (!projectDoc.exists()) return;
      const data = projectDoc.data();
      const updatedItems = (data.items || []).map(item => {
        const upd = { ...item, assignedEmployeeId: assignAllEmployeeId };
        if (assignAllEmployeeId && !item.workOrder) {
          upd.workOrder = { paymentStatus: "unpaid", createdAt: new Date().toISOString() };
        }
        return upd;
      });
      await updateDoc(doc(db, "projects", assignAllProject.id), stripUndefined({ items: updatedItems }));
      setSnackbar({
        open: true,
        message: `Todos los elementos han sido asignados a ${employees.find(e => e.id === assignAllEmployeeId)?.name || "el colaborador"}.`,
        severity: "success"
      });
      setShowAssignAllDialog(false);
      setAssignAllProject(null);
      setAssignAllEmployeeId("");
      await fetchProjects();
      if (selectedProject?.id === assignAllProject.id) {
        const updated = (await loadProjects()).find(p => p.id === assignAllProject.id);
        if (updated) setSelectedProject(updated);
      }
    } catch (err) {
      console.error("Error assigning all:", err);
      setSnackbar({ open: true, message: "Error al asignar.", severity: "error" });
    }
  };

  // Calcular precios en tiempo real para elementos individuales
  useEffect(() => {
    const calculatePrice = () => {
      let selectedItem = null;
      let unitPrice = 0;
      let total = 0;
      let calculation = "";

      switch (individualItemType) {
        case 'material':
          selectedItem = selectedIndividualMaterial;
          if (selectedItem) {
            unitPrice = parseFloat(selectedItem.price || "0");
            if (individualItemQuantityType === "metros") {
              const tramo = parseFloat(selectedItem.stretch || "6.1");
              total = (individualItemQuantity / tramo) * unitPrice;
              calculation = `${individualItemQuantity} metros ÷ ${tramo} tramos × ${formatCurrency(unitPrice)} = ${formatCurrency(total)}`;
            } else {
              total = individualItemQuantity * unitPrice;
              calculation = `${individualItemQuantity} tramos × ${formatCurrency(unitPrice)} = ${formatCurrency(total)}`;
            }
          }
          break;
        case 'herraje':
          selectedItem = selectedIndividualHerraje;
          if (selectedItem) {
            unitPrice = parseFloat(selectedItem.price || "0");
            total = individualItemQuantity * unitPrice;
            calculation = `${individualItemQuantity} piezas × ${formatCurrency(unitPrice)} = ${formatCurrency(total)}`;
          }
          break;
        case 'vidrio':
          selectedItem = selectedIndividualVidrio;
          if (selectedItem) {
            unitPrice = parseFloat(selectedItem?.[individualItemPriceType === "installed" ? "priceInstalled" : "price"] || "0");
            let area = individualItemQuantity;
            if (individualItemDimensions.height && individualItemDimensions.width) {
              area = (parseFloat(individualItemDimensions.height) / 100) * (parseFloat(individualItemDimensions.width) / 100);
              calculation = `${individualItemDimensions.height}cm × ${individualItemDimensions.width}cm = ${area.toFixed(2)}m² × ${formatCurrency(unitPrice)} = ${formatCurrency(area * unitPrice)}`;
            } else {
              calculation = `${area}m² × ${formatCurrency(unitPrice)} = ${formatCurrency(area * unitPrice)}`;
            }
            total = area * unitPrice;
          }
          break;
        case 'extra':
          selectedItem = selectedIndividualExtra;
          if (selectedItem) {
            unitPrice = parseFloat(selectedItem.price || "0");
            total = individualItemQuantity * unitPrice;
            calculation = `${individualItemQuantity} × ${formatCurrency(unitPrice)} = ${formatCurrency(total)}`;
          }
          break;
      }

      setIndividualItemCalculation(calculation);
      setIndividualItemTotal(total);
    };

    calculatePrice();
  }, [
    individualItemType,
    selectedIndividualMaterial,
    selectedIndividualHerraje,
    selectedIndividualVidrio,
    selectedIndividualExtra,
    individualItemQuantity,
    individualItemQuantityType,
    individualItemDimensions,
    individualItemPriceType
  ]);

  // Calcular precios en tiempo real para recotización de elementos individuales
  useEffect(() => {
    if (!recalcIndividualItem) {
      setRecalcIndividualPreview({ unitPrice: 0, total: 0, calculation: "" });
      return;
    }

    console.log("DEBUG - Calculating preview for:", recalcIndividualItem); // Debug log
    console.log("DEBUG - Available glasses:", glassesOptions.slice(0, 3)); // Debug log (first 3 items)

    let unitPrice = 0;
    let total = 0;
    let calculation = "";

    try {
      switch (recalcIndividualItem.itemType) {
        case 'material':
          const material = materialsOptions.find(m => m.id === recalcIndividualItem.itemId);
          if (material) {
            unitPrice = parseFloat(material.price || "0");
            if (recalcIndividualQuantityType === "metros") {
              const tramo = parseFloat(material.stretch || "6.1");
              total = (recalcIndividualQuantity / tramo) * unitPrice;
              calculation = `${recalcIndividualQuantity}m ÷ ${tramo}m/tramo × ${formatCurrency(unitPrice)} = ${formatCurrency(total)}`;
            } else {
              total = recalcIndividualQuantity * unitPrice;
              calculation = `${recalcIndividualQuantity} tramos × ${formatCurrency(unitPrice)} = ${formatCurrency(total)}`;
            }
          }
          break;
        case 'herraje':
          const herraje = chapesOptions.find(c => c.id === recalcIndividualItem.itemId);
          if (herraje) {
            unitPrice = parseFloat(herraje.price || "0");
            total = recalcIndividualQuantity * unitPrice;
            calculation = `${recalcIndividualQuantity} piezas × ${formatCurrency(unitPrice)} = ${formatCurrency(total)}`;
          }
          break;
        case 'vidrio':
          // Buscar el vidrio por itemId, considerando tanto id como originalId
          const vidrio = glassesOptions.find(g => 
            g.id === recalcIndividualItem.itemId || g.originalId === recalcIndividualItem.itemId
          );
          if (vidrio) {
            unitPrice = parseFloat(vidrio[recalcIndividualPriceType === "installed" ? "priceInstalled" : "price"] || "0");
            let area = recalcIndividualQuantity;
            
            if (recalcIndividualDimensions.height && recalcIndividualDimensions.width) {
              area = (parseFloat(recalcIndividualDimensions.height) / 100) * (parseFloat(recalcIndividualDimensions.width) / 100);
              calculation = `${recalcIndividualDimensions.height}cm × ${recalcIndividualDimensions.width}cm = ${area.toFixed(2)}m² × ${formatCurrency(unitPrice)} = ${formatCurrency(area * unitPrice)}`;
            } else {
              calculation = `${recalcIndividualQuantity}m² × ${formatCurrency(unitPrice)} = ${formatCurrency(area * unitPrice)}`;
            }
            
            total = area * unitPrice;
          } else {
            console.error(`Glass not found for itemId: ${recalcIndividualItem.itemId} in live preview`);
            calculation = "Vidrio no encontrado";
          }
          break;
        case 'extra':
          const extraRecalc = extrasOptions.find(e => e.id === recalcIndividualItem.itemId);
          if (extraRecalc) {
            unitPrice = parseFloat(extraRecalc.price || "0");
            total = recalcIndividualQuantity * unitPrice;
            calculation = `${recalcIndividualQuantity} × ${formatCurrency(unitPrice)} = ${formatCurrency(total)}`;
          }
          break;
      }
    } catch (error) {
      console.error("Error calculating recalc preview:", error);
    }

    setRecalcIndividualPreview({ unitPrice, total, calculation });
  }, [
    recalcIndividualItem,
    recalcIndividualQuantity,
    recalcIndividualQuantityType,
    recalcIndividualDimensions,
    recalcIndividualPriceType,
    materialsOptions,
    chapesOptions,
    glassesOptions,
    extrasOptions
  ]);

  // Retornar todos los estados y funciones necesarias
  return {
    // Estados
    projects,
    filteredProjects,
    searchQuery,
    setSearchQuery,
    selectedProject,
    setSelectedProject,
    showDetailsDialog,
    setShowDetailsDialog,
    editProject,
    setEditProject,
    showEditDialog,
    setShowEditDialog,
    snackbar,
    setSnackbar,
    isMobile,
    expandedModels,
    employees,
    editingModel,
    setEditingModel,
    showModelEditDialog,
    setShowModelEditDialog,
    showPaymentDialog,
    setShowPaymentDialog,
    paymentProject,
    paymentAmount,
    setPaymentAmount,
    paymentDescription,
    setPaymentDescription,
    paymentMethod,
    setPaymentMethod,
    initialPayment,
    setInitialPayment,
    adjustedTotal,
    setAdjustedTotal,
    showActivateDialog,
    setShowActivateDialog,
    activatingProject,
    statusFilter,
    setStatusFilter,
    projectCountByStatus,
    showAddModelDialog,
    setShowAddModelDialog,
    addingToProject,
    models,
    filteredModels,
    modelSearchQuery,
    setModelSearchQuery,
    selectedModelToAdd,
    setSelectedModelToAdd,
    modelData,
    materialsOptions,
    chapesOptions,
    glassesOptions,
    extrasOptions,
    colorsOptions,
    dimensions,
    setDimensions,
    selectedGlass,
    setSelectedGlass,
    showRecalcDialog,
    setShowRecalcDialog,
    recalcModel,
    recalcDimensions,
    setRecalcDimensions,
    recalcSelectedGlass,
    setRecalcSelectedGlass,
    recalcSelectedColor,
    setRecalcSelectedColor,
    showRecalcIndividualDialog,
    setShowRecalcIndividualDialog,
    recalcIndividualItem,
    recalcIndividualQuantity,
    setRecalcIndividualQuantity,
    recalcIndividualQuantityType,
    setRecalcIndividualQuantityType,
    recalcIndividualDimensions,
    setRecalcIndividualDimensions,
    recalcIndividualSelectedMaterial,
    setRecalcIndividualSelectedMaterial,
    recalcIndividualSelectedHerraje,
    setRecalcIndividualSelectedHerraje,
    recalcIndividualSelectedVidrio,
    setRecalcIndividualSelectedVidrio,
    recalcIndividualPriceType,
    setRecalcIndividualPriceType,
    // Estados para mostrar el cálculo en tiempo real
    recalcIndividualPreview,
    setRecalcIndividualPreview,

    // Estados para agregar elementos individuales
    showAddIndividualItemDialog,
    setShowAddIndividualItemDialog,
    individualItemType,
    setIndividualItemType,
    selectedIndividualMaterial,
    setSelectedIndividualMaterial,
    selectedIndividualHerraje,
    setSelectedIndividualHerraje,
    selectedIndividualVidrio,
    setSelectedIndividualVidrio,
    selectedIndividualExtra,
    setSelectedIndividualExtra,
    individualItemQuantity,
    setIndividualItemQuantity,
    individualItemQuantityType,
    setIndividualItemQuantityType,
    individualItemDimensions,
    setIndividualItemDimensions,
    individualItemPriceType,
    setIndividualItemPriceType,
    individualItemCalculation,
    setIndividualItemCalculation,
    individualItemTotal,
    setIndividualItemTotal,
    imageCache,
    setImageCache,
    quotationGlobalColor,
    setQuotationGlobalColor,
    quotationGlobalGlass,
    setQuotationGlobalGlass,
    isQuotationRecalculating,
    getProjectSummaries,
    applyGlobalSettingsToProject,
    updateProjectItemColorInProject,
    updateProjectItemGlassInProject,
    showMassStatusDialog,
    setShowMassStatusDialog,
    massStatusProject,
    massStatusValue,
    setMassStatusValue,
    individualItemCalculation,
    individualItemTotal,

    // Estados para re-cotizar modelos
    showRecalcDialog,
    setShowRecalcDialog,
    recalcModel,
    setRecalcModel,
    recalcDimensions,
    setRecalcDimensions,
    recalcSelectedGlass,
    setRecalcSelectedGlass,
    recalcSelectedColor,
    setRecalcSelectedColor,

    // Estados para re-cotizar elementos individuales
    showRecalcIndividualDialog,
    setShowRecalcIndividualDialog,
    recalcIndividualItem,
    setRecalcIndividualItem,
    recalcIndividualQuantity,
    setRecalcIndividualQuantity,
    recalcIndividualQuantityType,
    setRecalcIndividualQuantityType,
    recalcIndividualDimensions,
    setRecalcIndividualDimensions,
    recalcIndividualSelectedMaterial,
    setRecalcIndividualSelectedMaterial,
    recalcIndividualSelectedHerraje,
    setRecalcIndividualSelectedHerraje,
    recalcIndividualSelectedVidrio,
    setRecalcIndividualSelectedVidrio,
    recalcIndividualPriceType,
    setRecalcIndividualPriceType,

    // Funciones
    getProjectCategoricalTotals,
    toggleModelExpansion,
    getModelStatusColor,
    getModelStatusText,
    getEmployeeName,
    getAvailableStatusOptions,
    canCompleteProject,
    handleViewDetails,
    handleEditProject,
    handleSaveEdit,
    handleActivateProject,
    handleInactivateProject,
    handleOpenPaymentDialog,
    handleClosePaymentDialog,
    handleAddPayment,
    updateProjectItemAssignee,
    addProjectImage,
    removeProjectImage,
    handleEditModel,
    handleSaveModelEdit,
    handleDeleteModel,
    handleAddModelToProject,
    handleSelectModelToAdd,
    getCalculations,
    addModelToProject,
    handleRecalcModel,
    getRecalcCalculations,
    confirmRecalcModel,
    handleAddIndividualItem,
    confirmAddIndividualItem,
    handleRecalcIndividualItem,
    confirmRecalcIndividualItem,
    formatCurrency,
    formatDate,
    getStatusColor,
    getStatusText,
    handleMassStatusChange,
    confirmMassStatusChange,
    showAssignAllDialog,
    setShowAssignAllDialog,
    assignAllProject,
    assignAllEmployeeId,
    setAssignAllEmployeeId,
    handleAssignAllToCollaborator,
    confirmAssignAllToCollaborator,
    getAssignAllWarning,
  };
};
