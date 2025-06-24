"use client";
import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "../../../../firebase";
import { evaluate } from "mathjs";
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
  CardMedia
} from "@mui/material";
import {
  Visibility,
  Edit,
  Delete,
  Person,
  CalendarToday,
  AttachMoney,
  Close,
  ExpandMore,
  ExpandLess,
  Assignment,
  LocationOn,
  Archive,
  Unarchive,
  FilterList,
  Add
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
    // Estados para filtros de proyectos
  const [showArchived, setShowArchived] = useState(false);
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
    let filtered = projects.filter(project => {
      // Filtrar por búsqueda
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filtrar por estado de archivado e inactivo
      const isArchived = project.archived || false;
      const isInactive = project.status === "inactive";
      
      if (!showArchived && isArchived) return false;
      if (!showInactive && isInactive) return false;
      
      return matchesSearch;
    });
    
    setFilteredProjects(filtered);
  }, [searchQuery, projects, showArchived, showInactive]);

  const fetchProjects = async () => {
    try {
      const projectsSnapshot = await getDocs(collection(db, "projects"));
      const projectsData = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Ordenar por fecha de creación (más recientes primero)
      const sortedProjects = projectsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setProjects(sortedProjects);
      setFilteredProjects(sortedProjects);
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
      const employeesSnapshot = await getDocs(collection(db, "employees"));
      const employeesData = employeesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmployees(employeesData);
      console.log("Empleados cargados:", employeesData);
    } catch (error) {
      console.error("Error fetching employees: ", error);
    }
  };

  const fetchModels = async () => {
    try {
      const modelsSnapshot = await getDocs(collection(db, "models"));
      const modelsData = modelsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setModels(modelsData);
      setFilteredModels(modelsData);
    } catch (error) {
      console.error("Error fetching models: ", error);
    }
  };

  const fetchOptions = async () => {
    try {
      const materialsSnap = await getDocs(collection(db, "materials"));
      setMaterialsOptions(materialsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const chapesSnap = await getDocs(collection(db, "chapes"));
      setChapesOptions(chapesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const glassesSnap = await getDocs(collection(db, "glasses"));
      const glassesList = glassesSnap.docs.flatMap(doc => {
        const data = doc.data();
        return data.options.map(option => ({
          id: doc.id,
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
      laborCostSelected: model.laborCostSelected || model.details.laborCost
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
        laborCostSelected: editingModel.laborCostSelected
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
      await updateDoc(doc(db, "projects", editProject.id), {
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
  const handleDeleteProject = async (projectId) => {
    if (window.confirm("¿Está seguro de que desea desactivar este proyecto?")) {
      try {
        await updateDoc(doc(db, "projects", projectId), {
          status: "inactive"
        });
        setSnackbar({
          open: true,
          message: "Proyecto desactivado exitosamente.",
          severity: "success"
        });
        fetchProjects(); // Recargar proyectos
      } catch (error) {
        console.error("Error deactivating project: ", error);
        setSnackbar({
          open: true,
          message: "Error al desactivar el proyecto.",
          severity: "error"
        });
      }
    }
  };

  const handleArchiveProject = async (projectId, archive = true) => {
    const action = archive ? "archivar" : "desarchivar";
    if (window.confirm(`¿Está seguro de que desea ${action} este proyecto?`)) {
      try {
        await updateDoc(doc(db, "projects", projectId), {
          archived: archive
        });
        setSnackbar({
          open: true,
          message: `Proyecto ${archive ? 'archivado' : 'desarchivado'} exitosamente.`,
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const getStatusColor = (status) => {
    switch (status) {
      case 'quotation': return 'default';
      case 'active': return 'success';
      case 'completed': return 'primary';
      case 'cancelled': return 'error';
      case 'inactive': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      case 'inactive': return 'Inactivo';
    case 'quotation': return 'Cotización';
      default: return 'Desconocido';
    }
  };

  const getModelStatusColor = (status) => {
    switch (status) {
      case 'cotizacion': return 'default';
      case 'enProceso': return 'warning';
      case 'pagada': return 'success';
      default: return 'default';
    }
  };

  const getModelStatusText = (status) => {
    switch (status) {
      case 'cotizacion': return 'Cotización';
      case 'enProceso': return 'En Proceso';
      case 'pagada': return 'Pagada';
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
  
    // Mano de obra
    const laborCost = parseFloat(modelData.manpower || "0") * materialsCalc.price;
  
    // Total general
    const totalGeneral = materialsCalc.price + chapesCalc.price + glassesCalc.price + laborCost;
  
    return { materialsCalc, chapesCalc, glassesCalc, laborCost, totalGeneral };
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
        status: "cotizacion",
        laborCostSelected: calculations.laborCost,
        details: {
          materials: calculations.materialsCalc,
          chapes: calculations.chapesCalc,
          glasses: calculations.glassesCalc,
          laborCost: calculations.laborCost
        }
      };

      const updatedItems = [...project.items, newModel];
      const newTotal = updatedItems.reduce((sum, item) => sum + item.total, 0);

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
            variant={showArchived ? "contained" : "outlined"}
            size="small"
            startIcon={<Archive />}
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? 'Ocultar Archivados' : 'Mostrar Archivados'}
          </Button>
          {/*<Button
            variant={showInactive ? "contained" : "outlined"}
            size="small"
            onClick={() => setShowInactive(!showInactive)}
            color="error"
          >
            {showInactive ? 'Ocultar Inactivos' : 'Mostrar Inactivos'}
          </Button>*/}
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
                    {project.archived && (
                      <Chip 
                        label="Archivado" 
                        color="warning" 
                        size="small" 
                        sx={{ ml: 1 }} 
                      />
                    )}
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
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'green' }}>
                    ${project.total.toFixed(2)}
                  </Typography>
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
                  {project.status !== 'inactive' && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={project.archived ? <Unarchive /> : <Archive />}
                      onClick={() => handleArchiveProject(project.id, !project.archived)}
                    >
                      {project.archived ? 'Desarchivar' : 'Archivar'}
                    </Button>
                  )}
                  {/*<Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => handleDeleteProject(project.id)}
                  >
                    {project.status === 'inactive' ? 'Inactivo' : 'Desactivar'}
                  </Button>*/}
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
          <Typography variant="h5">
            Detalles del Proyecto: {selectedProject?.name}
          </Typography>
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
                </Grid>
              </Paper>              {/* Lista de modelos en el proyecto */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Modelos en el Proyecto ({selectedProject.items.length})
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleAddModelToProject(selectedProject)}
                  size="small"
                >
                  Agregar Modelo
                </Button>
              </Box>
              
              {selectedProject.items.map((item, index) => {
                const expansionKey = `${selectedProject.id}-${index}`;
                const isExpanded = expandedModels[expansionKey];
                
                return (
                  <Paper key={index} sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" sx={{ color: 'primary.main' }}>
                        {item.modelName}
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
                    
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="subtitle2" color="textSecondary">Dimensiones:</Typography>
                        <Typography>{item.dimensions.height} x {item.dimensions.width}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="subtitle2" color="textSecondary">Vidrio:</Typography>
                        <Typography>{item.selectedGlass.name}</Typography>
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
                          ${item.total.toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>

                    {/* Desglose expandible */}
                    <Collapse in={isExpanded}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                        Desglose de Costos:
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="subtitle2" color="textSecondary">Materiales:</Typography>
                          <Typography>${item.details.materials.price.toFixed(2)}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="subtitle2" color="textSecondary">Herrajes:</Typography>
                          <Typography>${item.details.chapes.price.toFixed(2)}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="subtitle2" color="textSecondary">Vidrios:</Typography>
                          <Typography>${item.details.glasses.price.toFixed(2)}</Typography>
                        </Grid>                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="subtitle2" color="textSecondary">Mano de Obra:</Typography>
                          <Typography>${item.details.laborCost.toFixed(2)}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="subtitle2" color="textSecondary">Costo Final M.O.:</Typography>
                          <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            ${(item.laborCostSelected || item.details.laborCost).toFixed(2)}
                          </Typography>
                        </Grid>
                      </Grid>

                      {/* Detalle de materiales */}
                      {item.details.materials.items.length > 0 && (
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
                                    <TableCell>{material.name}</TableCell>
                                    <TableCell align="right">{material.meterage.toFixed(2)}</TableCell>
                                    <TableCell align="right">${material.price.toFixed(2)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </>
                      )}

                      {/* Detalle de herrajes */}
                      {item.details.chapes.items.length > 0 && (
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
                                    <TableCell>{chape.name}</TableCell>
                                    <TableCell align="right">{chape.pieces.toFixed(2)}</TableCell>
                                    <TableCell align="right">${chape.price.toFixed(2)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </>
                      )}
                    </Collapse>
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
              >
                <option value="quotation">Cotización</option>
                <option value="active">Activo</option>
                <option value="completed">Completado</option>
                <option value="cancelled">Cancelado</option>
                <option value="inactive">Inactivo</option>
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
                label="Costo de Mano de Obra Personalizado"
                fullWidth
                variant="outlined"
                type="number"
                value={editingModel.laborCostSelected}
                onChange={(e) => setEditingModel({...editingModel, laborCostSelected: parseFloat(e.target.value) || 0})}
                sx={{ mb: 2 }}
                helperText={`Costo calculado original: $${editingModel.details?.laborCost?.toFixed(2) || '0.00'}`}
                InputProps={{
                  startAdornment: <AttachMoney sx={{ mr: 1, color: 'gray' }} />
                }}
              />
              
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
                <option value="cotizacion">Cotización</option>
                <option value="enProceso">En Proceso</option>
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
                  onChange={(e) => setDimensions({
                    ...dimensions,
                    height: e.target.value
                  })}
                  inputProps={{ min: "0", step: "0.01" }}
                />
                <TextField
                  label="Ancho"
                  type="number"
                  value={dimensions.width}
                  onChange={(e) => setDimensions({
                    ...dimensions,
                    width: e.target.value
                  })}
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
                        <Typography>Mano de Obra: ${calculations.laborCost.toFixed(2)}</Typography>
                        <Typography variant="h6" sx={{ color: "primary.main", mt: 1 }}>
                          Total: ${calculations.totalGeneral.toFixed(2)}
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
