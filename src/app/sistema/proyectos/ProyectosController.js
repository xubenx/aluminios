"use client";
import { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../../../firebase";
import { evaluate } from "mathjs";
import { collection, getDocs, doc, updateDoc, getDoc, query, orderBy } from "firebase/firestore";

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

const activateProject = async (projectId, project, initialPayment = 0) => {
  try {
    const updateData = {
      status: "active",
      debt: project.total - initialPayment
    };

    if (initialPayment > 0) {
      updateData.payments = [{
        date: new Date().toISOString(),
        amount: initialPayment,
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
    const currentPayments = project.payments || [];
    const newPayments = [...currentPayments, payment];
    const newDebt = Math.max(0, (project.debt || project.total) - payment.amount);

    await updateDoc(doc(db, "projects", projectId), {
      payments: newPayments,
      debt: newDebt
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
  return items.reduce((sum, item) => sum + (item.total || 0), 0);
};

const updateProjectWithRecalculatedTotal = async (projectId, updatedItems) => {
  try {
    const newTotal = calculateProjectTotal(updatedItems);
    await updateDoc(doc(db, "projects", projectId), {
      items: updatedItems,
      total: newTotal
    });
  } catch (error) {
    console.error("Error updating project with recalculated total:", error);
    throw error;
  }
};

// Additional helper functions needed
const updateProjectItem = async (projectId, itemIndex, updatedData) => {
  try {
    const projectDoc = await getDoc(doc(db, "projects", projectId));
    if (!projectDoc.exists()) {
      throw new Error("Project not found");
    }

    const projectData = projectDoc.data();
    const updatedItems = [...(projectData.items || [])];
    updatedItems[itemIndex] = { ...updatedItems[itemIndex], ...updatedData };

    const newTotal = calculateProjectTotal(updatedItems);
    await updateDoc(doc(db, "projects", projectId), {
      items: updatedItems,
      total: newTotal
    });
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

    const newTotal = calculateProjectTotal(updatedItems);
    await updateDoc(doc(db, "projects", projectId), {
      items: updatedItems,
      total: newTotal
    });
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
      laborCostSelected: modelData.calculations.laborCost,
      laborCostActual: modelData.calculations.laborCostActual,
      m2: modelData.calculations.m2,
      total: modelData.calculations.totalGeneral,
      details: {
        materials: modelData.calculations.materials,
        chapes: modelData.calculations.chapes,
        glasses: modelData.calculations.glasses,
        laborCost: modelData.calculations.laborCost,
        laborCostActual: modelData.calculations.laborCostActual
      }
    };

    const updatedItems = [...currentItems, newItem];
    const newTotal = calculateProjectTotal(updatedItems);

    await updateDoc(doc(db, "projects", projectId), {
      items: updatedItems,
      total: newTotal
    });
  } catch (error) {
    console.error("Error adding model to project:", error);
    throw error;
  }
};

const addIndividualItemToProject = async (projectId, itemData) => {
  try {
    const projectDoc = await getDoc(doc(db, "projects", projectId));
    if (!projectDoc.exists()) {
      throw new Error("Project not found");
    }

    const projectDataFromDB = projectDoc.data();
    const currentItems = projectDataFromDB.items || [];

    const newItem = {
      type: "individual",
      itemType: itemData.itemType,
      itemId: itemData.itemId,
      itemName: itemData.itemName,
      quantity: itemData.quantity,
      unitPrice: itemData.unitPrice,
      total: itemData.total,
      dimensions: itemData.dimensions,
      status: "cotizacion"
    };

    const updatedItems = [...currentItems, newItem];
    const newTotal = calculateProjectTotal(updatedItems);

    await updateDoc(doc(db, "projects", projectId), {
      items: updatedItems,
      total: newTotal
    });
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

    await updateDoc(doc(db, "projects", projectId), {
      items: updatedItems
    });
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
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [activatingProject, setActivatingProject] = useState(null);

  // Estados para filtros de proyectos
  const [showInactive, setShowInactive] = useState(false);

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

  // Estados para agregar elementos individuales
  const [showAddIndividualItemDialog, setShowAddIndividualItemDialog] = useState(false);
  const [individualItemType, setIndividualItemType] = useState("material");
  const [selectedIndividualMaterial, setSelectedIndividualMaterial] = useState(null);
  const [selectedIndividualHerraje, setSelectedIndividualHerraje] = useState(null);
  const [selectedIndividualVidrio, setSelectedIndividualVidrio] = useState(null);
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

  // Filtrar proyectos basado en la búsqueda y filtros
  useEffect(() => {
    let filtered = projects;
    
    // Filtrar por estado inactivo
    if (!showInactive) {
      filtered = filtered.filter(project => 
        project.status !== 'inactive' && !project.archived
      );
    }
    
    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(query) ||
        (project.customerName && project.customerName.toLowerCase().includes(query))
      );
    }
    
    setFilteredProjects(filtered);
  }, [searchQuery, projects, showInactive]);

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

  // Función para calcular totales por categorías
  const getProjectCategoricalTotals = (project) => {
    if (!project || !project.items) return { materials: 0, herrajes: 0, vidrios: 0, laborCost: 0, total: 0 };
    
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
    }, { materials: 0, herrajes: 0, vidrios: 0, laborCost: 0, total: 0 });
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

      // Cargar colores usando la función dedicada
      const colorsData = await loadColors();
      setColorsOptions(colorsData);
      
      console.log("Options loaded:", {
        materials: materialsData?.length || 0,
        chapes: chapesData?.length || 0,
        glasses: glassesList?.length || 0,
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
        setInitialPayment(editProject.total * 0.5);
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

      await activateProject(activatingProject.id, activatingProject, initialPayment);
      
      await updateProjectWithRecalculatedTotal(activatingProject.id, updatedItems);
      
      setSnackbar({
        open: true,
        message: `Proyecto activado exitosamente. Todos los modelos han sido cambiados a estado "Pendiente". ${initialPayment > 0 ? `Anticipo de ${formatCurrency(initialPayment)} registrado.` : ''}`,
        severity: "success"
      });
      
      setShowActivateDialog(false);
      setShowEditDialog(false);
      setActivatingProject(null);
      setEditProject(null);
      fetchProjects();
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

  const handleAddPayment = async () => {
    try {
      if (paymentAmount <= 0) {
        setSnackbar({
          open: true,
          message: "El monto debe ser mayor a 0.",
          severity: "error"
        });
        return;
      }

      const payment = {
        date: new Date().toISOString(),
        amount: paymentAmount,
        method: paymentMethod,
        description: paymentDescription || "Pago registrado"
      };

      await addPaymentToProject(paymentProject.id, paymentProject, payment);
      
      setSnackbar({
        open: true,
        message: `Pago de ${formatCurrency(paymentAmount)} registrado exitosamente.`,
        severity: "success"
      });
      
      setShowPaymentDialog(false);
      setPaymentProject(null);
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
        laborCostSelected: calculations.laborCost || 0,
        laborCostActual: calculations.laborCostActual || 0,
        m2: calculations.m2 || 100,
        total: calculations.totalGeneral || 0,
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
          if (individualItemQuantityType === "metros") {
            const tramo = parseFloat(selectedItem?.stretch || "6.1");
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
      }

      if (!selectedItem) {
        setSnackbar({
          open: true,
          message: "Debe seleccionar un elemento.",
          severity: "error"
        });
        return;
      }

      await addIndividualItemToProject(addingToProject.id, {
        itemType: individualItemType,
        itemId: selectedItem.id || '',
        itemName: selectedItem.name || '',
        quantity: individualItemQuantity || 0,
        unitPrice: unitPrice || 0,
        total: total || 0,
        dimensions: (individualItemDimensions.height && individualItemDimensions.width) ? {
          height: parseFloat(individualItemDimensions.height),
          width: parseFloat(individualItemDimensions.width)
        } : null
      });

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
    setRecalcIndividualItem({ ...item, projectId: project.id, itemIndex });
    setRecalcIndividualQuantity(item.quantity || 1);
    setRecalcIndividualQuantityType("metros");
    setRecalcIndividualDimensions(item.dimensions || { height: "", width: "" });
    setRecalcIndividualPriceType("installed");
    setShowRecalcIndividualDialog(true);
  };

  const confirmRecalcIndividualItem = async () => {
    try {
      let unitPrice = 0;
      let total = 0;
      
      switch (recalcIndividualItem.itemType) {
        case 'material':
          const material = materialsOptions.find(m => m.id === recalcIndividualItem.itemId);
          unitPrice = parseFloat(material?.price || "0");
          if (recalcIndividualQuantityType === "metros") {
            const tramo = parseFloat(material?.stretch || "6.1");
            total = (recalcIndividualQuantity / tramo) * unitPrice;
          } else {
            total = recalcIndividualQuantity * unitPrice;
          }
          break;
        case 'herraje':
          const herraje = chapesOptions.find(c => c.id === recalcIndividualItem.itemId);
          unitPrice = parseFloat(herraje?.price || "0");
          total = recalcIndividualQuantity * unitPrice;
          break;
        case 'vidrio':
          const vidrio = glassesOptions.find(g => g.id === recalcIndividualItem.itemId);
          unitPrice = parseFloat(vidrio?.[recalcIndividualPriceType === "installed" ? "priceInstalled" : "price"] || "0");
          let area = recalcIndividualQuantity;
          if (recalcIndividualDimensions.height && recalcIndividualDimensions.width) {
            area = (parseFloat(recalcIndividualDimensions.height) / 100) * (parseFloat(recalcIndividualDimensions.width) / 100);
          }
          total = area * unitPrice;
          break;
      }

      const updatedItem = {
        quantity: recalcIndividualQuantity,
        unitPrice,
        total,
        dimensions: recalcIndividualDimensions.height && recalcIndividualDimensions.width ? {
          height: parseFloat(recalcIndividualDimensions.height),
          width: parseFloat(recalcIndividualDimensions.width)
        } : undefined
      };

      await updateProjectItem(recalcIndividualItem.projectId, recalcIndividualItem.itemIndex, updatedItem);
      
      setSnackbar({
        open: true,
        message: "Elemento re-cotizado exitosamente.",
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
    individualItemQuantity,
    individualItemQuantityType,
    individualItemDimensions,
    individualItemPriceType
  ]);

  // Función utilitaria para verificar y corregir todos los totales de proyectos

  // Retornar todos los estados y funciones necesarias
  return {
    // Estados
    projects,
    filteredProjects,
    searchQuery,
    setSearchQuery,
    selectedProject,
    showDetailsDialog,
    setShowDetailsDialog,
    editProject,
    showEditDialog,
    setShowEditDialog,
    snackbar,
    setSnackbar,
    isMobile,
    expandedModels,
    employees,
    editingModel,
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
    showActivateDialog,
    setShowActivateDialog,
    activatingProject,
    showInactive,
    setShowInactive,
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
    handleAddPayment,
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
  };
};
