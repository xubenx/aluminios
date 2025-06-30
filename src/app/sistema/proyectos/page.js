"use client";
import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../firebase";
import { evaluate } from "mathjs";
import {
  loadProjects,
  loadEmployees,
  loadModels,
  loadGlasses,
  loadMaterials,
  loadChapes,
  updateProjectStatus,
  updateProject,
  activateProject,
  addPaymentToProject,
  addModelToProject,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusText,
  filterProjects,
  calculateProjectTotal
} from "./projectController";

import Image from "next/image";
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  Divider,
  Paper,
  Collapse,
  Autocomplete,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from "@mui/material";
import {
  Visibility,
  Edit,
  Person,
  CalendarToday,
  AttachMoney,
  Close,
  ExpandMore,
  ExpandLess,
  Assignment,
  LocationOn,
  FilterList,
  Add,
  Block,
  Delete
} from "@mui/icons-material";

export default function ProyectosPage() {  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  
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
  const [chapesOptions, setChapesOptions] = useState([]);  const [glassesOptions, setGlassesOptions] = useState([]);
  const [dimensions, setDimensions] = useState({ height: "1", width: "1" });
  const [selectedGlass, setSelectedGlass] = useState(null);
  
  // Estado para caché de imágenes
  const [imageCache, setImageCache] = useState(new Set());  // Componente de imagen con caché mejorado
  const CachedImage = ({ modelId, modelName, height = 200, width = "100%" }) => {
    const [imageLoaded, setImageLoaded] = useState(imageCache.has(modelId));
    const [imageError, setImageError] = useState(false);
    const imageSrc = `/images/${modelId}.png`;

    const handleImageLoad = () => {
      if (!imageLoaded) {
        setImageLoaded(true);
        setImageCache(prev => new Set([...prev, modelId]));
      }
    };

    const handleImageError = () => {
      setImageError(true);
    };

    if (imageError) {
      return (
        <Box sx={{ 
          height, 
          width, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'grey.100',
          borderRadius: 1
        }}>
          <Typography variant="body2" color="textSecondary">
            Sin imagen
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ position: 'relative', height, width, overflow: 'hidden', borderRadius: 1 }}>
        <Image
          src={imageSrc}
          alt={`Imagen de ${modelName}`}
          fill
          style={{ objectFit: 'cover' }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          priority={imageCache.has(modelId)}
          loading={imageCache.has(modelId) ? "eager" : "lazy"}
        />
        {!imageLoaded && !imageCache.has(modelId) && (
          <Box sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'grey.100'
          }}>
            <Typography variant="body2" color="textSecondary">
              Cargando...
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  // Cargar proyectos al montar el componente
  useEffect(() => {
    fetchProjects();
    fetchEmployees();
    fetchModels();
    fetchOptions();
  }, []);

  // Filtrar proyectos basado en la búsqueda y filtros
  useEffect(() => {
    const filtered = filterProjects(projects, searchQuery, showInactive);
    setFilteredProjects(filtered);
  }, [searchQuery, projects, showInactive]);

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
      console.log("Empleados cargados:", employeesData);
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
      const glassesList = glassesData.flatMap(doc => {
        const data = doc;
        return (data.options || []).map((option, index) => ({
          id: `${doc.id}-${index}`,
          originalId: doc.id,
          name: `${data.name} ${option.tickness}mm`,
          tickness: option.tickness,
          priceInstalled: option.priceInstalled,
        }));
      });
      setGlassesOptions(glassesList);
    } catch (error) {
      console.error("Error fetching options: ", error);
    }
  };

  const toggleModelExpansion = (projectId, modelIndex) => {
    const key = `${projectId}-${modelIndex}`;
    setExpandedModels(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
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
      laborCostActual: model.laborCostActual || model.details?.laborCostActual || 0
    });
    setShowModelEditDialog(true);
  };
  const handleSaveModelEdit = async () => {
    try {
      // Buscar el proyecto
      const project = projects.find(p => p.id === editingModel.projectId);
      if (!project) return;

      // Actualizar el modelo específico
      const updatedItems = [...project.items];
      updatedItems[editingModel.modelIndex] = {
        ...updatedItems[editingModel.modelIndex],
        area: editingModel.area,
        assignedEmployeeId: editingModel.assignedEmployeeId,
        status: editingModel.status,
        laborCostSelected: editingModel.laborCostSelected,
        laborCostActual: editingModel.laborCostActual
      };

      // Actualizar en Firestore
      await updateDoc(doc(db, "projects", editingModel.projectId), {
        items: updatedItems
      });

      setSnackbar({
        open: true,
        message: "Modelo actualizado exitosamente.",
        severity: "success"
      });

      setShowModelEditDialog(false);
      setEditingModel(null);
      fetchProjects(); // Recargar proyectos
    } catch (error) {
      console.error("Error updating model: ", error);
      setSnackbar({
        open: true,
        message: "Error al actualizar el modelo.",
        severity: "error"
      });
    }
  };

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
      // Verificar si se está cambiando de "quotation" a "active"
      const originalProject = projects.find(p => p.id === editProject.id);
      const wasQuotation = originalProject?.status === "quotation";
      const isBecomingActive = editProject.status === "active";
      const wasActive = originalProject?.status === "active";
      const isBecomingCompleted = editProject.status === "completed";
      
      // Validar que no se pueda volver a cotización desde activo
      if (originalProject?.status === "active" && editProject.status === "quotation") {
        setSnackbar({
          open: true,
          message: "No se puede volver a cotización desde un proyecto activo.",
          severity: "error"
        });
        return;
      }
      
      // Validar que se pueda completar solo si todos los modelos están en estados finales
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
        // Mostrar diálogo para activar proyecto con pago inicial
        setActivatingProject(editProject);
        setInitialPayment(editProject.total * 0.5); // 50% por defecto
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
      fetchProjects(); // Recargar proyectos
    } catch (error) {
      console.error("Error updating project: ", error);
      setSnackbar({
        open: true,
        message: "Error al actualizar el proyecto.",
        severity: "error"
      });
    }
  };

  // Función para activar proyecto con pago inicial
  const handleActivateProject = async () => {
    try {
      // Cambiar todos los modelos del proyecto a estado "pendiente"
      const updatedItems = activatingProject.items.map(item => ({
        ...item,
        status: "pendiente"
      }));

      await activateProject(activatingProject.id, activatingProject, initialPayment);
      
      // Actualizar los estados de los modelos
      await updateDoc(doc(db, "projects", activatingProject.id), {
        items: updatedItems
      });
      
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

  // Función para abrir diálogo de pagos
  const handleOpenPaymentDialog = (project) => {
    setPaymentProject(project);
    setPaymentAmount(0);
    setPaymentDescription("");
    setPaymentMethod("efectivo");
    setShowPaymentDialog(true);
  };

  // Función para registrar pago
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

  const handleInactivateProject = async (projectId, currentStatus) => {
    const newStatus = currentStatus === 'inactive' ? 'quotation' : 'inactive';
    const action = newStatus === 'inactive' ? "inactivar" : "reactivar";
    
    // Validar que solo proyectos en "cotización" puedan ser inactivados
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
        fetchProjects(); // Recargar proyectos
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

  const getModelStatusColor = (status) => {
    switch (status) {
      case 'cotizacion': return 'default';
      case 'enProceso': return 'warning';
      case 'pagada': return 'success';
      case 'pendiente': return 'default';
      case 'instalado': return 'info';
      case 'revisado': return 'success';
      default: return 'default';
    }
  };

  const getModelStatusText = (status) => {
    switch (status) {
      case 'cotizacion': return 'Cotización';
      case 'enProceso': return 'En Proceso';
      case 'pagada': return 'Pagada';
      case 'pendiente': return 'Pendiente';
      case 'instalado': return 'Instalado';
      case 'revisado': return 'Revisado';
      default: return 'Sin Estado';
    }
  };
  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : 'Sin asignar';
  };

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

  // Funciones para agregar modelo
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
        if (!item.id) return item;
        try {
          const itemDoc = await getDoc(doc(db, collectionName, item.id));
          return itemDoc.exists() ? { ...item, name: itemDoc.data().name } : item;
        } catch (error) {
          console.error(`Error fetching ${collectionName} item:`, error);
          return item;
        }
      })
    );
  };

  const handleSelectModelToAdd = async (model) => {
    setSelectedModelToAdd(model);
    try {
      const modelDoc = await getDoc(doc(db, "models", model.id));
      if (modelDoc.exists()) {
        const data = modelDoc.data();
        const materials = data.materials ? await resolveNames(data.materials, "materials") : [];
        const chapes = data.chapes ? await resolveNames(data.chapes, "chapes") : [];
        const glasses = data.glasses ? await resolveNames(data.glasses, "glasses") : [];
        setModelData({
          id: model.id,
          ...data,
          materials,
          chapes,
          glasses,
        });
      } else {
        setModelData(null);
      }
    } catch (error) {
      console.error("Error fetching model details:", error);
    }
  };

  const calculatePrice = (formula, variables) => {
    try {
      return evaluate(formula, variables);
    } catch (error) {
      console.error("Error evaluating formula:", error);
      return 0;
    }
  };

  const getCalculations = () => {
    if (!modelData) return null;
  
    // MATERIALS
    const materialsCalc = modelData.materials?.reduce(
      (acc, material) => {
        const matOption = materialsOptions.find((m) => m.id === material.id);
        const currentPrice = matOption ? parseFloat(matOption.price || "0") : 0;
        const tramo = matOption ? parseFloat(matOption.stretch || "6.1") : 6.1;
  
        const meterage = calculatePrice(material.formula, {
          PRECIO: 1,
          ALTO: dimensions.height,
          ANCHO: dimensions.width,
          TRAMO: 1,
        });
  
        const price = calculatePrice(material.formula, {
          PRECIO: currentPrice,
          ALTO: dimensions.height,
          ANCHO: dimensions.width,
          TRAMO: tramo,
        });
  
        return {
          price: acc.price + price,
          meterage: acc.meterage + meterage,
          items: [...acc.items, { name: material.name, meterage, price }],
        };
      },
      { price: 0, meterage: 0, items: [] }
    ) || { price: 0, meterage: 0, items: [] };
  
    // CHAPES (herrajes)
    const chapesCalc = modelData.chapes?.reduce(
      (acc, chape) => {
        const chapeOption = chapesOptions.find((c) => c.id === chape.id);
        const currentPrice = chapeOption ? parseFloat(chapeOption.price || "0") : 0;
  
        const pieces = calculatePrice(chape.formula, {
          PRECIO: 1,
          ALTO: dimensions.height,
          ANCHO: dimensions.width,
          TRAMO: 1,
        });
  
        const price = calculatePrice(chape.formula, {
          PRECIO: currentPrice,
          ALTO: dimensions.height,
          ANCHO: dimensions.width,
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
  
    // VIDRIOS
    const glassesCalc = modelData.glasses?.reduce(
      (acc, glass) => {
        const meterage = calculatePrice(glass.formula, {
          PRECIO: 1,
          ALTO: dimensions.height,
          ANCHO: dimensions.width,
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
    // Mano de obra para aluminio (independiente del vidrio)
    const laborCost = parseFloat(modelData.manpower || "0") * materialsCalc.price;
    const laborCostActual = Math.round(parseFloat(modelData.manpowerActual || "0")); // Entero

    // Mano de obra para vidrio (por m² - independiente del aluminio)
    const glassLaborCostPerM2 = modelData.m2 || 100; // Usar el valor del modelo o default 100
    const glassLaborCost = Math.round(glassesCalc.meterage * glassLaborCostPerM2); // Entero
    
    // Total de mano de obra real que se pagará al trabajador
    const totalLaborActual = laborCostActual + glassLaborCost;

    // Total general (solo para cotización - no incluye mano de obra de vidrio)
    const totalGeneral = materialsCalc.price + chapesCalc.price + glassesCalc.price + laborCost;

    return { 
      materialsCalc, 
      chapesCalc, 
      glassesCalc, 
      laborCost, 
      laborCostActual,
      glassLaborCost,
      totalLaborActual,
      totalGeneral 
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

    const calculations = getCalculations();
    if (!calculations) return;

    try {
      const project = projects.find(p => p.id === addingToProject.id);
      if (!project) return;

      const newModel = {
        modelId: modelData.id,
        modelName: modelData.name,
        dimensions: { ...dimensions },
        selectedGlass: { ...selectedGlass },
        total: calculations.totalGeneral,
        area: "",
        status: project.status === "active" ? "pendiente" : "cotizacion", // Set appropriate status based on project status
        laborCostSelected: calculations.laborCost,
        laborCostActual: calculations.laborCostActual,
        glassLaborCost: calculations.glassLaborCost,
        totalLaborActual: calculations.totalLaborActual,
        details: {
          materials: calculations.materialsCalc,
          chapes: calculations.chapesCalc,
          glasses: calculations.glassesCalc,
          laborCost: calculations.laborCost,
          laborCostActual: calculations.laborCostActual,
          glassLaborCost: calculations.glassLaborCost,
          totalLaborActual: calculations.totalLaborActual
        }
      };

      const updatedItems = [...project.items, newModel];
      const newTotal = updatedItems.reduce((sum, item) => sum + (item.total || 0), 0);

      // Actualizar en Firestore
      await updateDoc(doc(db, "projects", addingToProject.id), {
        items: updatedItems,
        total: newTotal
      });

      setSnackbar({
        open: true,
        message: "Modelo agregado al proyecto exitosamente.",
        severity: "success"
      });

      setShowAddModelDialog(false);
      setAddingToProject(null);
      fetchProjects(); // Recargar proyectos
    } catch (error) {
      console.error("Error adding model to project: ", error);
      setSnackbar({
        open: true,
        message: "Error al agregar el modelo al proyecto.",
        severity: "error"
      });
    }
  };

  // Función para obtener opciones de estado permitidas
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

  // Función para validar si un proyecto puede ser completado
  const canCompleteProject = (project) => {
    if (!project || !project.items || project.items.length === 0) {
      return { canComplete: false, reason: "El proyecto no tiene modelos" };
    }

    const invalidModels = project.items.filter(item => 
      !['instalado', 'revisado', 'pagada'].includes(item.status || 'cotizacion')
    );

    if (invalidModels.length > 0) {
      const modelNames = invalidModels.map(item => 
        item.type === 'individual' ? `${item.itemName} (Individual)` : item.modelName
      ).join(', ');
      
      return { 
        canComplete: false, 
        reason: `Los siguientes modelos deben estar en estado "Instalado", "Revisado" o "Pagada": ${modelNames}` 
      };
    }

    return { canComplete: true, reason: "" };
  };

  return (
    <Box sx={{ padding: 3, maxWidth: "1400px", margin: "0 auto" }}>
      <Typography variant="h4" align="center" sx={{ mb: 3, color: "black" }}>
        Gestión de Proyectos
      </Typography>      {/* Barra de búsqueda y filtros */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Buscar proyectos por nombre o cliente"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FilterList sx={{ color: 'gray' }} />
          <Button
            variant={showInactive ? "contained" : "outlined"}
            size="small"
            startIcon={<Block />}
            onClick={() => setShowInactive(!showInactive)}
            color="error"
          >
            {showInactive ? 'Ocultar Inactivos' : 'Mostrar Inactivos'}
          </Button>
        </Box>
      </Box>

      {/* Lista de proyectos */}
      <Grid container spacing={3}>
        {filteredProjects.map((project) => (
          <Grid item xs={12} sm={6} lg={4} key={project.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: "black", fontWeight: 'bold' }}>
                    {project.name}
                  </Typography>
                  <Chip 
                    label={getStatusText(project.status)} 
                    color={getStatusColor(project.status)}
                    size="small"
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Person sx={{ mr: 1, fontSize: 20, color: 'gray' }} />
                  <Typography variant="body2" color="textSecondary">
                    {project.customerName}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarToday sx={{ mr: 1, fontSize: 20, color: 'gray' }} />
                  <Typography variant="body2" color="textSecondary">
                    {formatDate(project.createdAt)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AttachMoney sx={{ mr: 1, fontSize: 20, color: 'gray' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'green' }}>
                      Total: ${project.total.toFixed(2)}
                    </Typography>
                    {project.debt !== undefined && (
                      <Typography variant="body2" sx={{ color: project.debt > 0 ? 'orange' : 'green' }}>
                        {project.debt > 0 ? `Deuda: $${project.debt.toFixed(2)}` : 'Pagado completamente'}
                      </Typography>
                    )}
                    {project.payments && project.payments.length > 0 && (
                      <Typography variant="body2" color="textSecondary">
                        {project.payments.length} pago{project.payments.length !== 1 ? 's' : ''} registrado{project.payments.length !== 1 ? 's' : ''}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {project.items.length} modelo{project.items.length !== 1 ? 's' : ''}
                </Typography>                {/* Botones de acción */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => handleViewDetails(project)}
                  >
                    Ver Detalles
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={() => handleEditProject(project)}
                  >
                    Editar
                  </Button>
                  {project.status === 'active' && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      startIcon={<AttachMoney />}
                      onClick={() => handleOpenPaymentDialog(project)}
                    >
                      Pagos
                    </Button>
                  )}
                  {project.status === 'quotation' && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<Block />}
                      onClick={() => handleInactivateProject(project.id, project.status)}
                    >
                      Inactivar
                    </Button>
                  )}
                  {project.status === 'inactive' && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      startIcon={<Add />}
                      onClick={() => handleInactivateProject(project.id, project.status)}
                    >
                      Reactivar
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredProjects.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="textSecondary">
            {searchQuery ? 'No se encontraron proyectos con ese criterio' : 'No hay proyectos disponibles'}
          </Typography>
        </Box>
      )}

      {/* Diálogo de detalles del proyecto */}
      <Dialog 
        open={showDetailsDialog} 
        onClose={() => setShowDetailsDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Detalles del Proyecto: {selectedProject?.name}
          <IconButton onClick={() => setShowDetailsDialog(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedProject && (
            <Box>
              {/* Información general del proyecto */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">Cliente:</Typography>
                    <Typography variant="h6">{selectedProject.customerName}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">Estado:</Typography>
                    <Chip 
                      label={getStatusText(selectedProject.status)} 
                      color={getStatusColor(selectedProject.status)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">Fecha de Creación:</Typography>
                    <Typography>{formatDate(selectedProject.createdAt)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">Total del Proyecto:</Typography>
                    <Typography variant="h5" sx={{ color: 'green', fontWeight: 'bold' }}>
                      ${selectedProject.total.toFixed(2)}
                    </Typography>
                  </Grid>
                  {selectedProject.debt !== undefined && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="textSecondary">Deuda:</Typography>
                      <Typography variant="h6" sx={{ color: selectedProject.debt > 0 ? 'orange' : 'green', fontWeight: 'bold' }}>
                        ${selectedProject.debt.toFixed(2)}
                      </Typography>
                    </Grid>
                  )}
                  {selectedProject.payments && selectedProject.payments.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="textSecondary">Pagos registrados:</Typography>
                      <Typography>
                        {selectedProject.payments.length} pago{selectedProject.payments.length !== 1 ? 's' : ''} por un total de $
                        {selectedProject.payments.reduce((sum, payment) => sum + payment.amount, 0).toFixed(2)}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>              {/* Lista de modelos en el proyecto */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Modelos en el Proyecto ({selectedProject.items.length})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {selectedProject.status === 'active' && (
                    <Button
                      variant="outlined"
                      color="success"
                      startIcon={<AttachMoney />}
                      onClick={() => handleOpenPaymentDialog(selectedProject)}
                      size="small"
                    >
                      Gestionar Pagos
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleAddModelToProject(selectedProject)}
                    size="small"
                  >
                    Agregar Modelo
                  </Button>
                </Box>
              </Box>
              
              {selectedProject.items.map((item, index) => {
                const expansionKey = `${selectedProject.id}-${index}`;
                const isExpanded = expandedModels[expansionKey];
                
                return (
                  <Paper key={index} sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" sx={{ color: 'primary.main' }}>
                        {item.type === 'individual' ? `${item.itemName} (Individual)` : item.modelName}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip 
                          label={getModelStatusText(item.status || 'cotizacion')} 
                          color={getModelStatusColor(item.status || 'cotizacion')}
                          size="small"
                        />
                        <Button
                          size="small"
                          startIcon={<Edit />}
                          onClick={() => handleEditModel(selectedProject, index)}
                        >
                          Editar
                        </Button>
                        <IconButton
                          onClick={() => toggleModelExpansion(selectedProject.id, index)}
                          size="small"
                        >
                          {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Box>
                    </Box>
                    
                    {item.type === 'individual' ? (
                      // Renderizado para elementos individuales
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">Tipo:</Typography>
                          <Typography>{item.itemType?.charAt(0).toUpperCase() + item.itemType?.slice(1)}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">Cantidad:</Typography>
                          <Typography>{item.quantity || 1}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">Precio Unitario:</Typography>
                          <Typography>{formatCurrency(item.unitPrice || 0)}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">Total:</Typography>
                          <Typography variant="h6" sx={{ color: 'green' }}>
                            {formatCurrency(item.totalPrice || 0)}
                          </Typography>
                        </Grid>
                        {item.dimensions && (
                          <>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="subtitle2" color="textSecondary">Dimensiones:</Typography>
                              <Typography>
                                {item.dimensions.height} x {item.dimensions.width}
                              </Typography>
                            </Grid>
                          </>
                        )}
                        <Grid item xs={6} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">Área/Ubicación:</Typography>
                          <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                            <LocationOn sx={{ fontSize: 16, mr: 0.5, color: 'gray' }} />
                            {item.area || 'Sin especificar'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">Colaborador:</Typography>
                          <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                            <Assignment sx={{ fontSize: 16, mr: 0.5, color: 'gray' }} />
                            {getEmployeeName(item.assignedEmployeeId)}
                          </Typography>
                        </Grid>
                      </Grid>
                    ) : (
                      // Renderizado para modelos completos
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">Dimensiones:</Typography>
                          <Typography>
                            {item.dimensions ? `${item.dimensions.height} x ${item.dimensions.width}` : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">Vidrio:</Typography>
                          <Typography>
                            {item.selectedGlass ? item.selectedGlass.name : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">Área/Ubicación:</Typography>
                          <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                            <LocationOn sx={{ fontSize: 16, mr: 0.5, color: 'gray' }} />
                            {item.area || 'Sin especificar'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">Colaborador:</Typography>
                          <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                            <Assignment sx={{ fontSize: 16, mr: 0.5, color: 'gray' }} />
                            {getEmployeeName(item.assignedEmployeeId)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="textSecondary">Total:</Typography>
                          <Typography variant="h6" sx={{ color: 'green' }}>
                            {formatCurrency(item.total || 0)}
                          </Typography>
                        </Grid>
                      </Grid>
                    )}

                    {/* Desglose expandible - Solo para modelos completos */}
                    {item.type !== 'individual' && (
                      <Collapse in={isExpanded}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                          Desglose de Costos:
                        </Typography>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="subtitle2" color="textSecondary">Materiales:</Typography>
                            <Typography>{formatCurrency(item.details?.materials?.price || 0)}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="subtitle2" color="textSecondary">Herrajes:</Typography>
                            <Typography>{formatCurrency(item.details?.chapes?.price || 0)}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="subtitle2" color="textSecondary">Vidrios:</Typography>
                            <Typography>{formatCurrency(item.details?.glasses?.price || 0)}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="subtitle2" color="textSecondary">Mano de Obra (Cotización):</Typography>
                            <Typography>{formatCurrency(item.details?.laborCost || 0)}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="subtitle2" color="textSecondary">Costo Final M.O.:</Typography>
                            <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                              {formatCurrency(item.laborCostSelected || item.details?.laborCost || 0)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="subtitle2" color="textSecondary">M.O. Real (Trabajador):</Typography>
                            <Box>
                              <Typography sx={{ fontSize: '0.9em', color: 'orange' }}>
                                • Aluminio: {formatCurrency(item.laborCostActual || item.details?.laborCostActual || 0)}
                              </Typography>
                              {(item.details?.glasses?.meterage || 0) > 0 && (
                                <Typography sx={{ fontSize: '0.9em', color: 'orange' }}>
                                  • Vidrio ({(item.details.glasses.meterage || 0).toFixed(2)} m²): {formatCurrency((item.details.glasses.meterage || 0) * (item.m2 || 100))}
                                </Typography>
                              )}
                              <Typography sx={{ fontWeight: 'bold', color: 'orange', borderTop: '1px solid orange', pt: 0.5 }}>
                                Total: {formatCurrency((item.laborCostActual || item.details?.laborCostActual || 0) + ((item.details?.glasses?.meterage || 0) * (item.m2 || 100)))}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        {/* Detalle de materiales */}
                        {item.details?.materials?.items?.length > 0 && (
                          <>
                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Materiales:</Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Nombre</TableCell>
                                    <TableCell align="right">Metraje</TableCell>
                                    <TableCell align="right">Precio</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {item.details.materials.items.map((material, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell>{material?.name || 'N/A'}</TableCell>
                                      <TableCell align="right">{(material?.meterage || 0).toFixed(2)}</TableCell>
                                      <TableCell align="right">{formatCurrency(material?.price || 0)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </>
                        )}

                        {/* Detalle de herrajes */}
                        {item.details?.chapes?.items?.length > 0 && (
                          <>
                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Herrajes:</Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Nombre</TableCell>
                                    <TableCell align="right">Piezas</TableCell>
                                    <TableCell align="right">Precio</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {item.details.chapes.items.map((chape, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell>{chape?.name || 'N/A'}</TableCell>
                                      <TableCell align="right">{(chape?.pieces || 0).toFixed(2)}</TableCell>
                                      <TableCell align="right">{formatCurrency(chape?.price || 0)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </>
                        )}
                      </Collapse>
                    )}
                  </Paper>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de edición */}
      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Proyecto</DialogTitle>
        <DialogContent>
          {editProject && (
            <>
              <TextField
                autoFocus
                margin="dense"
                label="Nombre del Proyecto"
                fullWidth
                variant="outlined"
                value={editProject.name}
                onChange={(e) => setEditProject({...editProject, name: e.target.value})}
                sx={{ mb: 2 }}
              />              <TextField
                select
                margin="dense"
                label="Estado"
                fullWidth
                variant="outlined"
                value={editProject.status}
                onChange={(e) => setEditProject({...editProject, status: e.target.value})}
                SelectProps={{
                  native: true,
                }}
                helperText={
                  editProject.status === 'quotation' ? 'Desde cotización puede ir a Activo o Inactivo' :
                  editProject.status === 'active' ? 'Desde activo solo puede ir a Completado (si todos los modelos están finalizados)' :
                  editProject.status === 'completed' ? 'Proyecto completado - no se puede cambiar' :
                  editProject.status === 'cancelled' ? 'Proyecto cancelado - no se puede cambiar' :
                  editProject.status === 'inactive' ? 'Proyecto inactivo - use el botón Reactivar para volver a cotización' : ''
                }
              >
                {getAvailableStatusOptions(editProject.status).map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </TextField>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>Cancelar</Button>          <Button variant="contained" onClick={handleSaveEdit}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para editar modelo individual */}
      <Dialog open={showModelEditDialog} onClose={() => setShowModelEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Modelo: {editingModel?.modelName}</DialogTitle>
        <DialogContent>
          {editingModel && (
            <>
              <TextField
                margin="dense"
                label="Área/Ubicación"
                fullWidth
                variant="outlined"
                value={editingModel.area}
                onChange={(e) => setEditingModel({...editingModel, area: e.target.value})}
                sx={{ mb: 2 }}
                placeholder="Ej: Sala, Cocina, Dormitorio principal..."
                InputProps={{
                  startAdornment: <LocationOn sx={{ mr: 1, color: 'gray' }} />
                }}
              />
                <Autocomplete
                options={employees}
                getOptionLabel={(option) => option.name || ''}
                value={employees.find(emp => emp.id === editingModel.assignedEmployeeId) || null}
                onChange={(event, newValue) => 
                  setEditingModel({...editingModel, assignedEmployeeId: newValue ? newValue.id : ''})
                }
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Colaborador Asignado" 
                    variant="outlined"
                    sx={{ mb: 2 }}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <Assignment sx={{ mr: 1, color: 'gray' }} />
                    }}
                  />
                )}
              />
              
              <TextField
                margin="dense"
                label="Costo de Mano de Obra para Cotización"
                fullWidth
                variant="outlined"
                type="number"
                value={editingModel.laborCostSelected}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
                    setEditingModel({...editingModel, laborCostSelected: value === '' ? 0 : parseFloat(value)});
                  }
                }}
                sx={{ mb: 2 }}
                helperText={`Costo calculado original: $${editingModel.details?.laborCost?.toFixed(2) || '0.00'}`}
                InputProps={{
                  startAdornment: <AttachMoney sx={{ mr: 1, color: 'gray' }} />
                }}
              />

              <TextField
                margin="dense"
                label="Costo Real de Mano de Obra"
                fullWidth
                variant="outlined"
                type="number"
                value={editingModel.laborCostActual || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
                    setEditingModel({...editingModel, laborCostActual: value === '' ? 0 : parseFloat(value)});
                  }
                }}
                sx={{ mb: 2 }}
                helperText="Costo que se pagará realmente al trabajador (para órdenes de trabajo)"
                InputProps={{
                  startAdornment: <AttachMoney sx={{ mr: 1, color: 'gray' }} />
                }}
              />

              {/* Información de mano de obra de vidrio */}
              {editingModel.details?.glasses?.meterage > 0 && (
                <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Mano de Obra de Vidrio:
                  </Typography>
                  <Typography variant="body2">
                    Área de vidrio: {editingModel.details.glasses.meterage.toFixed(2)} m²
                  </Typography>
                  <Typography variant="body2">
                    Costo por m²: $${editingModel.m2 || 100}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'orange' }}>
                    Total mano de obra vidrio: ${Math.round(editingModel.details.glasses.meterage * (editingModel.m2 || 100))}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'primary.main', mt: 1 }}>
                    TOTAL PARA TRABAJADOR: ${(editingModel.laborCostActual || 0) + Math.round(editingModel.details.glasses.meterage * (editingModel.m2 || 100))}
                  </Typography>
                </Paper>
              )}
              
              <TextField
                select
                margin="dense"
                label="Estado del Modelo"
                fullWidth
                variant="outlined"
                value={editingModel.status}
                onChange={(e) => setEditingModel({...editingModel, status: e.target.value})}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="pendiente">Pendiente</option>
                <option value="enProceso">En Proceso</option>
                <option value="instalado">Instalado</option>
                <option value="revisado">Revisado</option>
                <option value="cotizacion">Cotización</option>
                <option value="pagada">Pagada</option>
              </TextField>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowModelEditDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveModelEdit}>Guardar</Button>
        </DialogActions>      </Dialog>

      {/* Diálogo para agregar modelo al proyecto */}
      <Dialog open={showAddModelDialog} onClose={() => setShowAddModelDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Agregar Modelo al Proyecto: {addingToProject?.name}</DialogTitle>
        <DialogContent>
          {!selectedModelToAdd ? (
            <Box>
              <TextField
                fullWidth
                label="Buscar modelos"
                variant="outlined"
                value={modelSearchQuery}
                onChange={(e) => setModelSearchQuery(e.target.value)}
                sx={{ mb: 2 }}
              />              <Grid container spacing={2}>
                {filteredModels.map((model) => (
                  <Grid item xs={12} sm={6} md={4} key={model.id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 3 },
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                      onClick={() => handleSelectModelToAdd(model)}
                    >
                      <CachedImage 
                        modelId={model.id}
                        modelName={model.name}
                        height={200}
                      />
                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Typography variant="h6" sx={{ color: "black", mb: 1 }}>
                          {model.name}
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          fullWidth
                        >
                          Seleccionar
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
                Configurar: {selectedModelToAdd.name}
              </Typography>
              
              {/* Dimensiones */}
              <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                <TextField
                  label="Alto"
                  type="number"
                  value={dimensions.height}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
                      setDimensions({
                        ...dimensions,
                        height: value
                      });
                    }
                  }}
                  inputProps={{ min: "0", step: "0.01" }}
                />
                <TextField
                  label="Ancho"
                  type="number"
                  value={dimensions.width}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
                      setDimensions({
                        ...dimensions,
                        width: value
                      });
                    }
                  }}
                  inputProps={{ min: "0", step: "0.01" }}
                />
              </Box>

              {/* Selección de vidrio */}
              <Autocomplete
                options={glassesOptions}
                getOptionLabel={(option) => option.name || ""}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={selectedGlass}
                onChange={(event, newValue) => setSelectedGlass(newValue)}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    {option.name}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField {...params} label="Seleccionar Vidrio" variant="outlined" />
                )}
                sx={{ mb: 3 }}
              />

              {/* Cálculo */}
              {modelData && selectedGlass && (
                <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Cálculo:
                  </Typography>
                  {(() => {
                    const calculations = getCalculations();
                    return calculations ? (
                      <Box>
                        <Typography>Materiales: ${calculations.materialsCalc.price.toFixed(2)}</Typography>
                        <Typography>Herrajes: ${calculations.chapesCalc.price.toFixed(2)}</Typography>
                        <Typography>Vidrios: ${calculations.glassesCalc.price.toFixed(2)}</Typography>
                        <Typography>Mano de Obra (Cotización): ${calculations.laborCost.toFixed(2)}</Typography>
                        <Typography variant="h6" sx={{ color: 'primary.main', mt: 1, mb: 1 }}>
                          Total Cotización: ${calculations.totalGeneral.toFixed(2)}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'orange' }}>
                          Desglose de Mano de Obra Real:
                        </Typography>
                        <Typography sx={{ color: 'orange', ml: 2 }}>
                          • Aluminio: ${calculations.laborCostActual}
                        </Typography>
                        {calculations.glassLaborCost > 0 && (
                          <Typography sx={{ color: 'orange', ml: 2 }}>
                            • Vidrio ({calculations.glassesCalc.meterage.toFixed(2)} m²): ${calculations.glassLaborCost}
                          </Typography>
                        )}
                        <Typography variant="h6" sx={{ color: 'orange', mt: 1, fontWeight: 'bold' }}>
                          Total para Trabajador: ${calculations.totalLaborActual}
                        </Typography>
                      </Box>
                    ) : null;
                  })()}
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddModelDialog(false)}>Cancelar</Button>
          {selectedModelToAdd && (
            <Button onClick={() => {
              setSelectedModelToAdd(null);
              setModelData(null);
            }}>
              Cambiar Modelo
            </Button>
          )}
          {selectedModelToAdd && modelData && selectedGlass && (
            <Button variant="contained" onClick={addModelToProject}>
              Agregar al Proyecto
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Diálogo para activar proyecto con pago inicial */}
      <Dialog open={showActivateDialog} onClose={() => setShowActivateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Activar Proyecto</DialogTitle>
        <DialogContent>
          {activatingProject && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {activatingProject.name}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Total del proyecto: <strong>${activatingProject.total.toFixed(2)}</strong>
              </Typography>
              <TextField
                label="Pago inicial (Anticipo)"
                type="number"
                fullWidth
                variant="outlined"
                value={initialPayment || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
                    setInitialPayment(value === '' ? 0 : parseFloat(value));
                  }
                }}
                sx={{ mb: 2 }}
                inputProps={{ min: "0", max: activatingProject?.total || 0, step: "0.01" }}
                helperText={`Sugerido: $${((activatingProject?.total || 0) * 0.5).toFixed(2)} (50%)`}
              />
              <Typography variant="body2" color="textSecondary">
                Deuda restante: ${((activatingProject?.total || 0) - (initialPayment || 0)).toFixed(2)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowActivateDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleActivateProject}>
            Activar Proyecto
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para gestionar pagos */}
      <Dialog open={showPaymentDialog} onClose={() => setShowPaymentDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Gestionar Pagos - {paymentProject?.name}</DialogTitle>
        <DialogContent>
          {paymentProject && (
            <Box>
              {/* Información del proyecto */}
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" color="textSecondary">Total:</Typography>
                    <Typography variant="h6" sx={{ color: 'green' }}>
                      ${paymentProject.total.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" color="textSecondary">Pagado:</Typography>
                    <Typography variant="h6" sx={{ color: 'blue' }}>
                      ${(paymentProject.payments || []).reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" color="textSecondary">Deuda:</Typography>
                    <Typography variant="h6" sx={{ color: (paymentProject.debt || 0) > 0 ? 'orange' : 'green' }}>
                      ${(paymentProject.debt || 0).toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Historial de pagos */}
              {paymentProject.payments && paymentProject.payments.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Historial de Pagos</Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Fecha</TableCell>
                          <TableCell>Descripción</TableCell>
                          <TableCell>Método</TableCell>
                          <TableCell align="right">Monto</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paymentProject.payments.map((payment, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {new Date(payment.date).toLocaleDateString('es-ES')}
                            </TableCell>
                            <TableCell>{payment.description}</TableCell>
                            <TableCell style={{ textTransform: 'capitalize' }}>
                              {payment.method}
                            </TableCell>
                            <TableCell align="right" sx={{ color: 'green', fontWeight: 'bold' }}>
                              ${payment.amount.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Formulario para nuevo pago */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Registrar Nuevo Pago</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Monto"
                      type="number"
                      fullWidth
                      variant="outlined"
                      value={paymentAmount || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
                          setPaymentAmount(value === '' ? 0 : parseFloat(value));
                        }
                      }}
                      inputProps={{ min: "0", step: "0.01" }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      label="Método de Pago"
                      fullWidth
                      variant="outlined"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      SelectProps={{ native: true }}
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="cheque">Cheque</option>
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Descripción"
                      fullWidth
                      variant="outlined"
                      value={paymentDescription}
                      onChange={(e) => setPaymentDescription(e.target.value)}
                      placeholder="Descripción del pago (opcional)"
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPaymentDialog(false)}>Cerrar</Button>
          <Button 
            variant="contained" 
            onClick={handleAddPayment}
            disabled={paymentAmount <= 0}
          >
            Registrar Pago
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensajes */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
