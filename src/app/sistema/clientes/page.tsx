"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { evaluate } from "mathjs";
import { collection, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../../../../firebase";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  Fab,
  Paper,
  Typography,
  Chip,
  Card,
  CardContent,
  Box,
  Divider,
  IconButton,
  Collapse,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Add, Edit, Delete, Restore, Visibility, ExpandMore, ExpandLess, Payment as PaymentIcon, Person } from "@mui/icons-material";
import { 
  updateProject, 
  addPaymentToProject, 
  updateProjectStatus,
  activateProject,
  loadEmployees,
  loadModels,
  loadMaterials,
  loadChapes,
  loadGlasses,
  type Project as ProjectType,
  type Payment,
  type Employee,
  type Model,
  type Material,
  type Chape,
  type Glass,
  type ProjectItem
} from "../proyectos/projectController";


interface Customer {
  id: string;
  name: string;
  phone?: string;
  status: "available" | "deleted";
}

interface Project {
  id: string;
  name: string;
  customerName: string;
  status: 'quotation' | 'active' | 'completed' | 'cancelled' | 'inactive';
  total: number;
  debt?: number;
  payments?: Array<{ date: string; amount: number; method: 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque'; description: string }>;
  createdAt?: { seconds?: number; toDate?: () => Date } | Date | string;
  date?: { seconds?: number; toDate?: () => Date } | Date | string;
  items?: ProjectItem[];
}

interface CustomerBalance {
  totalProjects: number;
  totalValue: number;
  totalPaid: number;
  totalDebt: number;
  projectsByStatus: {
    quotation: number;
    active: number;
    completed: number;
    cancelled: number;
    inactive: number;
  };
  projects: Project[];
}

interface FormData {
  name: string;
  phone: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "warning" | "info";
}

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchText, setSearchText] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<FormData>({ name: "", phone: "" });
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: "", severity: "success" });
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedCustomerBalance, setSelectedCustomerBalance] = useState<CustomerBalance | null>(null);
  const [openBalanceDialog, setOpenBalanceDialog] = useState(false);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  
  // Estados para gestión de proyectos
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [paymentForm, setPaymentForm] = useState<Payment>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    method: 'efectivo',
    description: ''
  });
  const [openEditProjectDialog, setOpenEditProjectDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // Estados para gestión detallada de proyectos
  const [expandedModels, setExpandedModels] = useState<{[key: string]: boolean}>({});
  const [editingModel, setEditingModel] = useState<ProjectItem | null>(null);
  const [showModelEditDialog, setShowModelEditDialog] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [activatingProject, setActivatingProject] = useState<Project | null>(null);
  const [initialPayment, setInitialPayment] = useState(0);
  
  // Estados para opciones de materiales
  const [models, setModels] = useState<Model[]>([]);
  
  // Estados para agregar modelo a proyecto
  const [showAddModelDialog, setShowAddModelDialog] = useState(false);
  const [addingToProject, setAddingToProject] = useState<Project | null>(null);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const [selectedModelToAdd, setSelectedModelToAdd] = useState<Model | null>(null);
  const [modelData, setModelData] = useState<{
    materials?: Material[];
    chapes?: Chape[];
    glasses?: Glass[];
  } | null>(null);
  const [glassesOptions, setGlassesOptions] = useState<Glass[]>([]);
  const [dimensions, setDimensions] = useState({ height: "1", width: "1" });
  const [selectedGlass, setSelectedGlass] = useState<Glass | null>(null);
  
  // Estado para caché de imágenes
  const [imageCache, setImageCache] = useState(new Set<string>());

  useEffect(() => {
    fetchCustomers();
    fetchEmployees();
    fetchAllData();
  }, []);

  const fetchEmployees = async () => {
    try {
      const employeesData = await loadEmployees();
      setEmployees(employeesData);
    } catch (error) {
      console.error("Error loading employees:", error);
    }
  };

  const fetchAllData = async () => {
    try {
      const [modelsData, , , glassesData] = await Promise.all([
        loadModels(),
        loadMaterials(),
        loadChapes(),
        loadGlasses()
      ]);
      
      setModels(modelsData);
      setGlassesOptions(glassesData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  // Filtrar modelos para agregar
  useEffect(() => {
    if (modelSearchQuery) {
      const filtered = models.filter(model =>
        model.name.toLowerCase().includes(modelSearchQuery.toLowerCase())
      );
      setFilteredModels(filtered);
    } else {
      setFilteredModels(models);
    }
  }, [modelSearchQuery, models]);

  // Componente de imagen con caché mejorado
  const CachedImage = ({ modelId, modelName, height = 200, width = "100%" }: {
    modelId: string;
    modelName: string;
    height?: number;
    width?: string | number;
  }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [imageUrl, setImageUrl] = useState<string>('');

    useEffect(() => {
      if (imageCache.has(modelId)) {
        setImageLoaded(true);
        setImageUrl(`/images/${modelId}.png`);
        return;
      }

      const img = new Image();
      img.onload = () => {
        setImageCache(prev => new Set([...prev, modelId]));
        setImageLoaded(true);
        setImageUrl(`/images/${modelId}.png`);
      };
      img.onerror = () => {
        setImageError(true);
      };
      img.src = `/images/${modelId}.png`;
    }, [modelId]);

    if (imageError) {
      return (
        <Box
          sx={{
            width,
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',  
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: 1
          }}
        >
          <Typography variant="body2" color="textSecondary">
            {modelName}
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ position: 'relative', width, height }}>
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={modelName}
            width={typeof width === 'number' ? width : 200}
            height={typeof height === 'number' ? height : 200}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '4px',
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.3s'
            }}
            unoptimized
          />
        )}
        {!imageLoaded && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f5f5f5',
              borderRadius: 1
            }}
          >
            <Typography variant="body2" color="textSecondary">
              Cargando...
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  useEffect(() => {
    // Filtrar clientes en base al texto de búsqueda y estado
    const filtered = customers.filter((customer) => {
      const matchesSearch = customer.name.toLowerCase().includes(searchText.toLowerCase()) ||
                           (customer.phone && customer.phone.toLowerCase().includes(searchText.toLowerCase()));
      const matchesStatus = showDeleted ? customer.status === "deleted" : customer.status === "available";
      return matchesSearch && matchesStatus;
    });
    setFilteredCustomers(filtered);
  }, [searchText, customers, showDeleted]);
  const fetchCustomers = async () => {
    try {
      const customersSnapshot = await getDocs(collection(db, "customers"));
      const customersData = customersSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "",
          phone: data.phone || "",
          status: (data.status as "available" | "deleted") || "available"
        } as Customer;
      });
      setCustomers(customersData);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setSnackbar({ open: true, message: "Error al cargar los clientes.", severity: "error" });
    }
  };

  const fetchCustomerBalance = async (customerName: string): Promise<CustomerBalance> => {
    try {
      const projectsSnapshot = await getDocs(collection(db, "projects"));
      const allProjects = projectsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];

      // Filtrar proyectos del cliente específico
      const customerProjects = allProjects.filter(project => 
        project.customerName?.toLowerCase() === customerName.toLowerCase()
      );

      // Calcular estadísticas
      const totalValue = customerProjects.reduce((sum, project) => sum + (project.total || 0), 0);
      const totalPaid = customerProjects.reduce((sum, project) => {
        if (project.payments && Array.isArray(project.payments)) {
          return sum + project.payments.reduce((paySum, payment) => paySum + (payment.amount || 0), 0);
        }
        return sum;
      }, 0);
      const totalDebt = customerProjects.reduce((sum, project) => sum + (project.debt || 0), 0);

      // Contar proyectos por estado
      const projectsByStatus = {
        quotation: customerProjects.filter(p => p.status === 'quotation').length,
        active: customerProjects.filter(p => p.status === 'active').length,
        completed: customerProjects.filter(p => p.status === 'completed').length,
        cancelled: customerProjects.filter(p => p.status === 'cancelled').length,
        inactive: customerProjects.filter(p => p.status === 'inactive').length,
      };

      return {
        totalProjects: customerProjects.length,
        totalValue,
        totalPaid,
        totalDebt,
        projectsByStatus,
        projects: customerProjects.sort((a, b) => {
          const dateA = a.createdAt?.seconds || a.date?.seconds || 0;
          const dateB = b.createdAt?.seconds || b.date?.seconds || 0;
          return dateB - dateA; // Más recientes primero
        })
      };
    } catch (error) {
      console.error("Error fetching customer balance:", error);
      throw error;
    }
  };

  const handleViewBalance = async (customer: Customer) => {
    try {
      setSnackbar({ open: true, message: "Cargando balance del cliente...", severity: "info" });
      const balance = await fetchCustomerBalance(customer.name);
      setSelectedCustomerBalance(balance);
      setCurrentCustomer(customer);
      setOpenBalanceDialog(true);
    } catch (err) {
      console.error("Error loading customer balance:", err);
      setSnackbar({ open: true, message: "Error al cargar el balance del cliente.", severity: "error" });
    }
  };

  // Funciones para gestión de proyectos
  const handleAddPayment = (project: Project) => {
    setSelectedProject(project);
    setPaymentForm({
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      method: 'efectivo',
      description: ''
    });
    setOpenPaymentDialog(true);
  };

  const handleSavePayment = async () => {
    if (!selectedProject || paymentForm.amount <= 0) {
      setSnackbar({ open: true, message: "Debe ingresar un monto válido.", severity: "error" });
      return;
    }

    try {
      await addPaymentToProject(selectedProject.id, selectedProject as ProjectType, paymentForm);
      setSnackbar({ open: true, message: "Pago agregado correctamente.", severity: "success" });
      setOpenPaymentDialog(false);
      // Recargar balance del cliente
      if (currentCustomer) {
        const updatedBalance = await fetchCustomerBalance(currentCustomer.name);
        setSelectedCustomerBalance(updatedBalance);
      }
    } catch (error) {
      console.error("Error adding payment:", error);
      setSnackbar({ open: true, message: "Error al agregar el pago.", severity: "error" });
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject({ ...project });
    setOpenEditProjectDialog(true);
  };

  const handleUpdateProjectStatus = async (projectId: string, newStatus: string) => {
    try {
      const project = selectedCustomerBalance?.projects.find(p => p.id === projectId);
      
      // Si cambia de cotización a activo, mostrar diálogo de activación
      if (project && project.status === 'quotation' && newStatus === 'active') {
        setActivatingProject(project);
        setInitialPayment(project.total * 0.5); // Sugerir 50% como anticipo
        setShowActivateDialog(true);
        return;
      }
      
      await updateProjectStatus(projectId, newStatus);
      setSnackbar({ open: true, message: "Estado del proyecto actualizado.", severity: "success" });
      
      // Recargar balance del cliente
      if (currentCustomer) {
        const updatedBalance = await fetchCustomerBalance(currentCustomer.name);
        setSelectedCustomerBalance(updatedBalance);
      }
    } catch (error) {
      console.error("Error updating project status:", error);
      setSnackbar({ open: true, message: "Error al actualizar el estado.", severity: "error" });
    }
  };

  const handleSaveProjectEdit = async () => {
    if (!editingProject) return;

    try {
      await updateProject(editingProject.id, editingProject as Partial<ProjectType>);
      setSnackbar({ open: true, message: "Proyecto actualizado correctamente.", severity: "success" });
      setOpenEditProjectDialog(false);
      // Recargar balance del cliente
      if (currentCustomer) {
        const updatedBalance = await fetchCustomerBalance(currentCustomer.name);
        setSelectedCustomerBalance(updatedBalance);
      }
    } catch (error) {
      console.error("Error updating project:", error);
      setSnackbar({ open: true, message: "Error al actualizar el proyecto.", severity: "error" });
    }
  };

  // Funciones para gestión de modelos
  const toggleModelExpansion = (projectId: string, modelIndex: number) => {
    const key = `${projectId}_${modelIndex}`;
    setExpandedModels(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleEditModel = (project: Project, modelIndex: number) => {
    const model = project.items?.[modelIndex];
    if (model) {
      setEditingModel({
        ...model,
        projectId: project.id,
        modelIndex
      });
      setShowModelEditDialog(true);
    }
  };

  const handleSaveModelEdit = async () => {
    if (!editingModel || !selectedCustomerBalance) return;

    try {
      const project = selectedCustomerBalance.projects.find(p => p.id === editingModel.projectId);
      if (!project || !project.items) return;

      const updatedItems = [...project.items];
      updatedItems[editingModel.modelIndex] = editingModel;

      await updateProject(editingModel.projectId, { items: updatedItems });
      setSnackbar({ open: true, message: "Modelo actualizado correctamente.", severity: "success" });
      setShowModelEditDialog(false);
      
      // Recargar balance del cliente
      if (currentCustomer) {
        const updatedBalance = await fetchCustomerBalance(currentCustomer.name);
        setSelectedCustomerBalance(updatedBalance);
      }
    } catch (error) {
      console.error("Error updating model:", error);
      setSnackbar({ open: true, message: "Error al actualizar el modelo.", severity: "error" });
    }
  };

  // Funciones para agregar modelo
  const handleAddModelToProject = (project: Project) => {
    setAddingToProject(project);
    setShowAddModelDialog(true);
    setModelSearchQuery("");
    setSelectedModelToAdd(null);
    setModelData(null);
    setDimensions({ height: "1", width: "1" });
    setSelectedGlass(null);
  };

  const resolveNames = async (items: (string | { id: string; name: string })[], collectionName: string) => {
    const resolvedItems = await Promise.all(
      items.map(async (item) => {
        if (typeof item === 'string') {
          try {
            const snapshot = await getDocs(collection(db, collectionName));
            const doc = snapshot.docs.find(d => d.id === item);
            return doc ? { id: doc.id, name: doc.data().name } : { id: item, name: 'Desconocido' };
          } catch (err) {
            console.error("Error loading item:", err);
            return { id: item, name: 'Error al cargar' };
          }
        }
        return item;
      })
    );
    return resolvedItems;
  };

  const handleSelectModelToAdd = async (model: Model) => {
    setSelectedModelToAdd(model);
    try {
      // Resolver nombres de materiales, chapes y cristales
      const resolvedMaterials = await resolveNames(Array.isArray(model.materials) ? model.materials : [], 'materials');
      const resolvedChapes = await resolveNames(Array.isArray(model.chapes) ? model.chapes : [], 'chapes');
      const resolvedGlasses = await resolveNames(Array.isArray(model.glasses) ? model.glasses : [], 'glasses');

      setModelData({
        ...model,
        materials: resolvedMaterials,
        chapes: resolvedChapes,
        glasses: resolvedGlasses
      });
    } catch (error) {
      console.error('Error resolving model data:', error);
      setSnackbar({ open: true, message: 'Error al cargar datos del modelo', severity: 'error' });
    }
  };

  const calculatePrice = (formula: string, variables: Record<string, number>) => {
    try {
      let processedFormula = formula;
      
      // Reemplazar variables en la fórmula
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        processedFormula = processedFormula.replace(regex, variables[key].toString());
      });
      
      // Evaluar la fórmula
      const result = evaluate(processedFormula);
      return typeof result === 'number' && !isNaN(result) ? result : 0;
    } catch (err) {
      console.error('Error calculating price:', err);
      return 0;
    }
  };

  const getCalculations = () => {
    if (!selectedModelToAdd || !selectedGlass) return { area: 0, totalPrice: 0 };
    
    const height = parseFloat(dimensions.height) || 0;
    const width = parseFloat(dimensions.width) || 0;
    const area = height * width;
    
    const variables = {
      area: area,
      height: height,
      width: width,
      glassPrice: selectedGlass.price || 0
    };
    
    const totalPrice = calculatePrice(typeof selectedModelToAdd.formula === 'string' ? selectedModelToAdd.formula : '0', variables);
    
    return { area, totalPrice };
  };

  const addModelToProject = async () => {
    if (!addingToProject || !selectedModelToAdd || !selectedGlass) {
      setSnackbar({ open: true, message: 'Faltan datos requeridos', severity: 'error' });
      return;
    }

    try {
      const { area, totalPrice } = getCalculations();
      
      const newItem = {
        modelId: selectedModelToAdd.id,
        modelName: selectedModelToAdd.name,
        dimensions: dimensions,
        area: area,
        price: totalPrice,
        selectedGlass: selectedGlass,
        status: 'pendiente',
        assignedEmployee: null,
        createdAt: new Date(),
        laborPrice: 0
      };

      // Obtener el proyecto actual
      const projectRef = doc(db, 'projects', addingToProject.id);
      const currentItems = addingToProject.items || [];
      const updatedItems = [...currentItems, newItem];

      await updateDoc(projectRef, { 
        items: updatedItems,
        total: (addingToProject.total || 0) + totalPrice
      });

      setSnackbar({ open: true, message: 'Modelo agregado al proyecto correctamente', severity: 'success' });
      setShowAddModelDialog(false);
      
      // Recargar balance del cliente
      if (currentCustomer) {
        const updatedBalance = await fetchCustomerBalance(currentCustomer.name);
        setSelectedCustomerBalance(updatedBalance);
      }
    } catch (error) {
      console.error('Error adding model to project:', error);
      setSnackbar({ open: true, message: 'Error al agregar modelo al proyecto', severity: 'error' });
    }
  };

  // Función para obtener opciones de estado permitidas
  const getAvailableStatusOptions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'quotation':
        return ['quotation', 'active', 'cancelled'];
      case 'active':
        return ['active', 'completed', 'cancelled', 'inactive'];
      case 'completed':
        return ['completed', 'inactive'];
      case 'cancelled':
        return ['cancelled', 'quotation'];
      case 'inactive':
        return ['inactive', 'active'];
      default:
        return ['quotation', 'active', 'completed', 'cancelled', 'inactive'];
    }
  };

  // Función para validar si un proyecto puede ser completado
  const canCompleteProject = (project: Project) => {
    if (!project.items || project.items.length === 0) return false;
    return project.items.every((item: ProjectItem) => item.status === 'revisado');
  };

  // Funciones de utilidad para modelos
  const getModelStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case 'pendiente': return 'default';
      case 'enProceso': return 'warning';
      case 'instalado': return 'info';
      case 'revisado': return 'success';
      case 'cotizacion': return 'secondary';
      case 'pagada': return 'primary';
      default: return 'default';
    }
  };

  const getModelStatusText = (status: string): string => {
    switch (status) {
      case 'pendiente': return 'Pendiente';
      case 'enProceso': return 'En Proceso';
      case 'instalado': return 'Instalado';
      case 'revisado': return 'Revisado';
      case 'cotizacion': return 'Cotización';
      case 'pagada': return 'Pagada';
      default: return 'Desconocido';
    }
  };

  const getEmployeeName = (employeeId: string): string => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : 'Sin asignar';
  };

  // Función para activar proyecto con pago inicial
  const handleActivateProject = async () => {
    if (!activatingProject) return;

    try {
      await activateProject(activatingProject.id, activatingProject as ProjectType, initialPayment);
      setSnackbar({ open: true, message: "Proyecto activado correctamente.", severity: "success" });
      setShowActivateDialog(false);
      setInitialPayment(0);
      
      // Recargar balance del cliente
      if (currentCustomer) {
        const updatedBalance = await fetchCustomerBalance(currentCustomer.name);
        setSelectedCustomerBalance(updatedBalance);
      }
    } catch (error) {
      console.error("Error activating project:", error);
      setSnackbar({ open: true, message: "Error al activar el proyecto.", severity: "error" });
    }
  };

  // Funciones de utilidad
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (timestamp: { toDate?: () => Date; seconds?: number } | Date | string | null | undefined): string => {
    if (!timestamp) return 'Fecha no disponible';
    
    let date: Date;
    if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp && timestamp.toDate) {
      date = timestamp.toDate();
    } else if (typeof timestamp === 'object' && timestamp !== null && 'seconds' in timestamp && timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case 'quotation': return 'warning';
      case 'active': return 'success';
      case 'completed': return 'primary';
      case 'cancelled': return 'error';
      case 'inactive': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'quotation': return 'Cotización';
      case 'active': return 'Activo';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      case 'inactive': return 'Inactivo';
      default: return 'Desconocido';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleOpenDialog = (customer: Customer | null = null) => {
    setCurrentCustomer(customer);
    setFormData(customer ? { name: customer.name, phone: customer.phone || "" } : { name: "", phone: "" });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentCustomer(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setSnackbar({ open: true, message: "El nombre es obligatorio.", severity: "error" });
      return;
    }

    try {
      const customerData = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || "",
        status: "available"
      };

      if (currentCustomer) {
        await updateDoc(doc(db, "customers", currentCustomer.id), customerData);
        setSnackbar({ open: true, message: "Cliente actualizado correctamente.", severity: "success" });
      } else {
        await addDoc(collection(db, "customers"), customerData);
        setSnackbar({ open: true, message: "Cliente agregado correctamente.", severity: "success" });
      }
      fetchCustomers();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving customer:", error);
      setSnackbar({ open: true, message: "Error al guardar el cliente.", severity: "error" });
    }
  };
  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de marcar este cliente como eliminado?")) {
      try {
        await updateDoc(doc(db, "customers", id), { status: "deleted" });
        setSnackbar({ open: true, message: "Cliente marcado como eliminado.", severity: "success" });
        fetchCustomers();
      } catch (error) {
        console.error("Error deleting customer:", error);
        setSnackbar({ open: true, message: "Error al eliminar el cliente.", severity: "error" });
      }
    }
  };

  const handleRestore = async (id: string) => {
    if (confirm("¿Estás seguro de restaurar este cliente?")) {
      try {
        await updateDoc(doc(db, "customers", id), { status: "available" });
        setSnackbar({ open: true, message: "Cliente restaurado correctamente.", severity: "success" });
        fetchCustomers();
      } catch (error) {
        console.error("Error restoring customer:", error);
        setSnackbar({ open: true, message: "Error al restaurar el cliente.", severity: "error" });
      }
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: "black" }}>
        Clientes
      </Typography>

      {/* Controles de filtrado */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", alignItems: "center" }}>
        <TextField
          fullWidth
          label="Buscar Cliente (nombre o teléfono)"
          variant="outlined"
          value={searchText}
          onChange={handleSearchChange}
        />
        <Button
          variant={showDeleted ? "contained" : "outlined"}
          color={showDeleted ? "secondary" : "primary"}
          onClick={() => setShowDeleted(!showDeleted)}
          sx={{ minWidth: "150px" }}
        >
          {showDeleted ? "Ver Activos" : "Ver Eliminados"}
        </Button>
      </div>

      <Paper elevation={3} sx={{ padding: "1rem", marginBottom: "1rem" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Teléfono</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.phone || "Sin teléfono"}</TableCell>
                  <TableCell>
                    <Chip
                      label={customer.status === "available" ? "Disponible" : "Eliminado"}
                      color={customer.status === "available" ? "success" : "error"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {customer.status === "available" ? (
                      <>
                        <Button
                          color="info"
                          startIcon={<Visibility />}
                          onClick={() => handleViewBalance(customer)}
                          sx={{ marginRight: "0.5rem" }}
                          size="small"
                        >
                          Balance
                        </Button>
                        <Button
                          color="primary"
                          startIcon={<Edit />}
                          onClick={() => handleOpenDialog(customer)}
                          sx={{ marginRight: "0.5rem" }}
                          size="small"
                        >
                          Editar
                        </Button>
                        <Button
                          color="secondary"
                          startIcon={<Delete />}
                          onClick={() => handleDelete(customer.id)}
                          size="small"
                        >
                          Eliminar
                        </Button>
                      </>
                    ) : (
                      <Button
                        color="success"
                        startIcon={<Restore />}
                        onClick={() => handleRestore(customer.id)}
                        size="small"
                      >
                        Restaurar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body2" color="textSecondary">
                      {showDeleted ? "No hay clientes eliminados" : "No hay clientes disponibles"}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Botón flotante - solo visible cuando no se muestran eliminados */}
      {!showDeleted && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => handleOpenDialog()}
          sx={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
          }}
        >
          <Add />
        </Fab>
      )}

      {/* Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{currentCustomer ? "Editar Cliente" : "Agregar Cliente"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Nombre *"
            type="text"
            fullWidth
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          <TextField
            margin="dense"
            name="phone"
            label="Teléfono (opcional)"
            type="tel"
            fullWidth
            value={formData.phone}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} color="primary" variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Balance del Cliente */}
      <Dialog 
        open={openBalanceDialog} 
        onClose={() => setOpenBalanceDialog(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          Balance General - {currentCustomer?.name}
        </DialogTitle>
        <DialogContent>
          {selectedCustomerBalance && (
            <Box>
              {/* Resumen General */}
              <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Resumen Financiero
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={2}>
                  <Card sx={{ minWidth: 200 }}>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total de Proyectos
                      </Typography>
                      <Typography variant="h5" component="div">
                        {selectedCustomerBalance.totalProjects}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card sx={{ minWidth: 200 }}>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Valor Total
                      </Typography>
                      <Typography variant="h5" component="div" color="primary">
                        {formatCurrency(selectedCustomerBalance.totalValue)}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card sx={{ minWidth: 200 }}>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Pagado
                      </Typography>
                      <Typography variant="h5" component="div" color="success.main">
                        {formatCurrency(selectedCustomerBalance.totalPaid)}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card sx={{ minWidth: 200 }}>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Deuda Pendiente
                      </Typography>
                      <Typography variant="h5" component="div" color="error.main">
                        {formatCurrency(selectedCustomerBalance.totalDebt)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Paper>

              {/* Estados de Proyectos */}
              <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Proyectos por Estado
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {Object.entries(selectedCustomerBalance.projectsByStatus).map(([status, count]) => (
                    <Chip
                      key={status}
                      label={`${getStatusText(status)}: ${count}`}
                      color={getStatusColor(status)}
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Paper>

              {/* Lista Detallada de Proyectos */}
              <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Detalle de Proyectos ({selectedCustomerBalance.projects.length})
                </Typography>
                {selectedCustomerBalance.projects.map((project) => (
                  <Box key={project.id} sx={{ mb: 2 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box flex={1}>
                            <Typography variant="h6" component="div">
                              {project.name}
                            </Typography>
                            <Typography color="textSecondary" gutterBottom>
                              Creado: {formatDate(project.createdAt || project.date)}
                            </Typography>
                            <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                              <Chip
                                label={getStatusText(project.status)}
                                color={getStatusColor(project.status)}
                                size="small"
                              />
                              <Typography variant="body2">
                                <strong>Total:</strong> {formatCurrency(project.total)}
                              </Typography>
                              {project.debt !== undefined && (
                                <Typography variant="body2" color="error.main">
                                  <strong>Deuda:</strong> {formatCurrency(project.debt)}
                                </Typography>
                              )}
                              {project.payments && project.payments.length > 0 && (
                                <Typography variant="body2" color="success.main">
                                  <strong>Pagado:</strong> {formatCurrency(
                                    project.payments.reduce((sum, p) => sum + p.amount, 0)
                                  )}
                                </Typography>
                              )}
                            </Box>
                            
                            {/* Botones de acción del proyecto */}
                            <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                              {project.status === 'active' && (
                                <>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="success"
                                    startIcon={<PaymentIcon />}
                                    onClick={() => handleAddPayment(project)}
                                  >
                                    Agregar Pago
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="secondary"
                                    startIcon={<Add />}
                                    onClick={() => handleAddModelToProject(project)}
                                  >
                                    Agregar Modelo
                                  </Button>
                                </>
                              )}
                              <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                startIcon={<Edit />}
                                onClick={() => handleEditProject(project)}
                              >
                                Editar
                              </Button>
                              <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Estado</InputLabel>
                                <Select
                                  value={project.status}
                                  label="Estado"
                                  onChange={(e) => handleUpdateProjectStatus(project.id, e.target.value)}
                                  disabled={project.status === 'completed' && !canCompleteProject(project)}
                                >
                                  {getAvailableStatusOptions(project.status).map(status => (
                                    <MenuItem key={status} value={status}>
                                      {getStatusText(status)}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Box>
                          </Box>
                          <IconButton
                            onClick={() => setExpandedProject(
                              expandedProject === project.id ? null : project.id
                            )}
                          >
                            {expandedProject === project.id ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </Box>
                        
                        <Collapse in={expandedProject === project.id}>
                          <Divider sx={{ my: 2 }} />
                          
                          {/* Modelos del proyecto */}
                          {project.items && project.items.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle1" gutterBottom color="primary">
                                Modelos/Elementos del Proyecto:
                              </Typography>
                              {project.items.map((item: ProjectItem, itemIndex: number) => (
                                <Card key={itemIndex} variant="outlined" sx={{ mb: 1 }}>
                                  <CardContent sx={{ py: 1 }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                      <Box flex={1}>
                                        <Box display="flex" gap={2} alignItems="center">
                                          {/* Imagen del modelo */}
                                          {item.type === 'model' && item.modelId && (
                                            <CachedImage
                                              modelId={item.modelId}
                                              modelName={item.modelName}
                                              height={60}
                                              width={80}
                                            />
                                          )}
                                          <Box>
                                            <Typography variant="subtitle2">
                                              {item.type === 'model' ? item.modelName : `${item.itemType}: ${item.itemName}`}
                                            </Typography>
                                            <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                                              <Chip
                                                label={getModelStatusText(item.status)}
                                                color={getModelStatusColor(item.status)}
                                                size="small"
                                              />
                                              {item.assignedEmployeeId && (
                                                <Chip
                                                  label={`Asignado: ${getEmployeeName(item.assignedEmployeeId)}`}
                                                  variant="outlined"
                                                  size="small"
                                                  icon={<Person />}
                                                />
                                              )}
                                              {item.area && (
                                                <Typography variant="caption" color="textSecondary">
                                                  Área: {item.area}m²
                                                </Typography>
                                              )}
                                              {item.dimensions && (
                                                <Typography variant="caption" color="textSecondary">
                                                  Dimensiones: {item.dimensions.height}x{item.dimensions.width}
                                                </Typography>
                                              )}
                                              <Typography variant="caption" color="primary">
                                                <strong>Precio: {formatCurrency(item.price || item.totalPrice || 0)}</strong>
                                              </Typography>
                                            </Box>
                                          </Box>
                                        </Box>
                                      </Box>
                                      <Box display="flex" gap={1} alignItems="center">
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          startIcon={<Edit />}
                                          onClick={() => handleEditModel(project, itemIndex)}
                                        >
                                          Editar
                                        </Button>
                                        <IconButton
                                          size="small"
                                          onClick={() => toggleModelExpansion(project.id, itemIndex)}
                                        >
                                          {expandedModels[`${project.id}_${itemIndex}`] ? <ExpandLess /> : <ExpandMore />}
                                        </IconButton>
                                      </Box>
                                    </Box>
                                    
                                    <Collapse in={expandedModels[`${project.id}_${itemIndex}`]}>
                                      <Divider sx={{ my: 1 }} />
                                      <Box>
                                        {item.type === 'model' && item.details && (
                                          <Box>
                                            <Typography variant="caption" display="block" gutterBottom>
                                              <strong>Desglose de Costos:</strong>
                                            </Typography>
                                            <Box display="flex" gap={2} flexWrap="wrap">
                                              {item.details.materials && (
                                                <Typography variant="caption">
                                                  Materiales: {formatCurrency(item.details.materials.price)}
                                                </Typography>
                                              )}
                                              {item.details.chapes && (
                                                <Typography variant="caption">
                                                  Herrajes: {formatCurrency(item.details.chapes.price)}
                                                </Typography>
                                              )}
                                              {item.details.glasses && (
                                                <Typography variant="caption">
                                                  Vidrios: {formatCurrency(item.details.glasses.price)}
                                                </Typography>
                                              )}
                                              {item.laborCostSelected && (
                                                <Typography variant="caption">
                                                  Mano de Obra: {formatCurrency(item.laborCostSelected)}
                                                </Typography>
                                              )}
                                            </Box>
                                          </Box>
                                        )}
                                        {item.type === 'individual' && (
                                          <Typography variant="caption">
                                            Precio Total: {formatCurrency(item.totalPrice || 0)}
                                          </Typography>
                                        )}
                                      </Box>
                                    </Collapse>
                                  </CardContent>
                                </Card>
                              ))}
                            </Box>
                          )}
                          
                          {/* Historial de pagos */}
                          {project.payments && project.payments.length > 0 ? (
                            <Box>
                              <Typography variant="subtitle2" gutterBottom>
                                Historial de Pagos:
                              </Typography>
                              <TableContainer>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Fecha</TableCell>
                                      <TableCell>Monto</TableCell>
                                      <TableCell>Método</TableCell>
                                      <TableCell>Descripción</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {project.payments.map((payment, index) => (
                                      <TableRow key={index}>
                                        <TableCell>
                                          {new Date(payment.date).toLocaleDateString('es-ES')}
                                        </TableCell>
                                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                                        <TableCell>{payment.method}</TableCell>
                                        <TableCell>{payment.description}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="textSecondary">
                              Sin pagos registrados
                            </Typography>
                          )}
                        </Collapse>
                      </CardContent>
                    </Card>
                  </Box>
                ))}
                
                {selectedCustomerBalance.projects.length === 0 && (
                  <Typography variant="body2" color="textSecondary" align="center">
                    Este cliente no tiene proyectos registrados
                  </Typography>
                )}
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBalanceDialog(false)} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para Agregar Pago */}
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar Pago - {selectedProject?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Fecha"
                type="date"
                value={paymentForm.date}
                onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Monto"
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Box>
            <FormControl fullWidth>
              <InputLabel>Método de Pago</InputLabel>
              <Select
                value={paymentForm.method}
                label="Método de Pago"
                onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value as Payment['method'] })}
              >
                <MenuItem value="efectivo">Efectivo</MenuItem>
                <MenuItem value="transferencia">Transferencia</MenuItem>
                <MenuItem value="tarjeta">Tarjeta</MenuItem>
                <MenuItem value="cheque">Cheque</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Descripción"
              multiline
              rows={3}
              value={paymentForm.description}
              onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
            />
            {selectedProject && (
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Información del Proyecto:
                </Typography>
                <Typography variant="body2">
                  <strong>Total:</strong> {formatCurrency(selectedProject.total)}
                </Typography>
                <Typography variant="body2" color="error.main">
                  <strong>Deuda Actual:</strong> {formatCurrency(selectedProject.debt || 0)}
                </Typography>
                <Typography variant="body2" color="success.main">
                  <strong>Nueva Deuda:</strong> {formatCurrency(Math.max(0, (selectedProject.debt || 0) - paymentForm.amount))}
                </Typography>
              </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)}>Cancelar</Button>
          <Button onClick={handleSavePayment} color="primary" variant="contained">
            Agregar Pago
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para Editar Proyecto */}
      <Dialog open={openEditProjectDialog} onClose={() => setOpenEditProjectDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Editar Proyecto - {editingProject?.name}</DialogTitle>
        <DialogContent>
          {editingProject && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Nombre del Proyecto"
                  value={editingProject.name}
                  onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Cliente"
                  value={editingProject.customerName}
                  onChange={(e) => setEditingProject({ ...editingProject, customerName: e.target.value })}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={editingProject.status}
                    label="Estado"
                    onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value as Project['status'] })}
                  >
                    <MenuItem value="quotation">Cotización</MenuItem>
                    <MenuItem value="active">Activo</MenuItem>
                    <MenuItem value="completed">Completado</MenuItem>
                    <MenuItem value="cancelled">Cancelado</MenuItem>
                    <MenuItem value="inactive">Inactivo</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Total"
                  type="number"
                  value={editingProject.total}
                  onChange={(e) => setEditingProject({ ...editingProject, total: parseFloat(e.target.value) || 0 })}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Box>
              {editingProject.status === 'active' && (
                <TextField
                  fullWidth
                  label="Deuda"
                  type="number"
                  value={editingProject.debt || 0}
                  onChange={(e) => setEditingProject({ ...editingProject, debt: parseFloat(e.target.value) || 0 })}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditProjectDialog(false)}>Cancelar</Button>
          <Button onClick={handleSaveProjectEdit} color="primary" variant="contained">
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para Activar Proyecto */}
      <Dialog open={showActivateDialog} onClose={() => setShowActivateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Activar Proyecto - {activatingProject?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body1">
              Para activar este proyecto, ingrese el pago inicial que realizará el cliente.
            </Typography>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>
                Información del Proyecto:
              </Typography>
              <Typography variant="body2">
                <strong>Total del Proyecto:</strong> {formatCurrency(activatingProject?.total || 0)}
              </Typography>
              <Typography variant="body2">
                <strong>Pago Inicial Sugerido (50%):</strong> {formatCurrency((activatingProject?.total || 0) * 0.5)}
              </Typography>
            </Paper>
            <TextField
              fullWidth
              label="Pago Inicial"
              type="number"
              value={initialPayment}
              onChange={(e) => setInitialPayment(parseFloat(e.target.value) || 0)}
              inputProps={{ min: 0, step: 0.01 }}
              helperText="Este pago se registrará automáticamente al activar el proyecto"
            />
            {activatingProject && (
              <Typography variant="body2" color="primary">
                <strong>Deuda Restante:</strong> {formatCurrency(Math.max(0, (activatingProject.total || 0) - initialPayment))}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowActivateDialog(false)}>Cancelar</Button>
          <Button onClick={handleActivateProject} color="primary" variant="contained">
            Activar Proyecto
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para Editar Modelo */}
      <Dialog open={showModelEditDialog} onClose={() => setShowModelEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Editar Modelo - {editingModel?.modelName || editingModel?.itemName}</DialogTitle>
        <DialogContent>
          {editingModel && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              {/* Imagen del modelo si existe */}
              {editingModel.type === 'model' && editingModel.modelId && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <CachedImage
                    modelId={editingModel.modelId}
                    modelName={editingModel.modelName}
                    height={150}
                    width={200}
                  />
                </Box>
              )}
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={editingModel.status || 'pendiente'}
                    label="Estado"
                    onChange={(e) => setEditingModel({ ...editingModel, status: e.target.value })}
                  >
                    <MenuItem value="pendiente">Pendiente</MenuItem>
                    <MenuItem value="enProceso">En Proceso</MenuItem>
                    <MenuItem value="instalado">Instalado</MenuItem>
                    <MenuItem value="revisado">Revisado</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Empleado Asignado</InputLabel>
                  <Select
                    value={editingModel.assignedEmployeeId || ''}
                    label="Empleado Asignado"
                    onChange={(e) => setEditingModel({ ...editingModel, assignedEmployeeId: e.target.value })}
                  >
                    <MenuItem value="">Sin asignar</MenuItem>
                    {employees.map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              {editingModel.dimensions && (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Alto (m)"
                    type="number"
                    value={editingModel.dimensions.height || 1}
                    onChange={(e) => setEditingModel({
                      ...editingModel,
                      dimensions: { ...editingModel.dimensions, height: e.target.value }
                    })}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                  <TextField
                    fullWidth
                    label="Ancho (m)"
                    type="number"
                    value={editingModel.dimensions.width || 1}
                    onChange={(e) => setEditingModel({
                      ...editingModel,
                      dimensions: { ...editingModel.dimensions, width: e.target.value }
                    })}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                  <TextField
                    fullWidth
                    label="Área (m²)"
                    type="number"
                    value={editingModel.area || 0}
                    onChange={(e) => setEditingModel({ ...editingModel, area: parseFloat(e.target.value) || 0 })}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Box>
              )}
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Precio del Modelo"
                  type="number"
                  value={editingModel.price || editingModel.totalPrice || 0}
                  onChange={(e) => setEditingModel({ 
                    ...editingModel, 
                    price: parseFloat(e.target.value) || 0,
                    totalPrice: parseFloat(e.target.value) || 0
                  })}
                  inputProps={{ min: 0, step: 0.01 }}
                />
                <TextField
                  fullWidth
                  label="Costo de Mano de Obra"
                  type="number"
                  value={editingModel.laborCostSelected || editingModel.laborPrice || 0}
                  onChange={(e) => setEditingModel({ 
                    ...editingModel, 
                    laborCostSelected: parseFloat(e.target.value) || 0,
                    laborPrice: parseFloat(e.target.value) || 0
                  })}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Box>
              
              {/* Información de materiales */}
              {editingModel.details && (
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>Desglose de Costos:</Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    {editingModel.details.materials && (
                      <Typography variant="body2">
                        <strong>Materiales:</strong> {formatCurrency(editingModel.details.materials.price || 0)}
                      </Typography>
                    )}
                    {editingModel.details.chapes && (
                      <Typography variant="body2">
                        <strong>Herrajes:</strong> {formatCurrency(editingModel.details.chapes.price || 0)}
                      </Typography>
                    )}
                    {editingModel.details.glasses && (
                      <Typography variant="body2">
                        <strong>Vidrios:</strong> {formatCurrency(editingModel.details.glasses.price || 0)}
                      </Typography>
                    )}
                  </Box>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowModelEditDialog(false)}>Cancelar</Button>
          <Button onClick={handleSaveModelEdit} color="primary" variant="contained">
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para Agregar Modelo al Proyecto */}
      <Dialog open={showAddModelDialog} onClose={() => setShowAddModelDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Agregar Modelo al Proyecto - {addingToProject?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Búsqueda de modelos */}
            <TextField
              fullWidth
              label="Buscar Modelo"
              value={modelSearchQuery}
              onChange={(e) => setModelSearchQuery(e.target.value)}
              placeholder="Escriba para filtrar modelos..."
            />
            
            {/* Lista de modelos */}
            <Paper sx={{ maxHeight: 300, overflow: 'auto', p: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Seleccionar Modelo:</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                {filteredModels.map((model) => (
                  <Card
                    key={model.id}
                    sx={{
                      width: 200,
                      cursor: 'pointer',
                      border: selectedModelToAdd?.id === model.id ? '2px solid' : '1px solid',
                      borderColor: selectedModelToAdd?.id === model.id ? 'primary.main' : 'grey.300'
                    }}
                    onClick={() => handleSelectModelToAdd(model)}
                  >
                    <CardContent sx={{ p: 1 }}>
                      <CachedImage
                        modelId={model.id}
                        modelName={model.name}
                        height={100}
                        width="100%"
                      />
                      <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                        {model.name}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Paper>
            
            {/* Configuración del modelo seleccionado */}
            {selectedModelToAdd && modelData && (
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Configurar: {selectedModelToAdd.name}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    label="Alto (m)"
                    type="number"
                    value={dimensions.height}
                    onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                    inputProps={{ min: 0.1, step: 0.01 }}
                    sx={{ width: 150 }}
                  />
                  <TextField
                    label="Ancho (m)"
                    type="number"
                    value={dimensions.width}
                    onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                    inputProps={{ min: 0.1, step: 0.01 }}
                    sx={{ width: 150 }}
                  />
                </Box>
                
                {modelData.glasses && modelData.glasses.length > 0 && (
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Tipo de Vidrio</InputLabel>
                    <Select
                      value={selectedGlass?.id || ''}
                      label="Tipo de Vidrio"
                      onChange={(e) => {
                        const glass = glassesOptions.find(g => g.id === e.target.value);
                        setSelectedGlass(glass || null);
                      }}
                    >
                      {glassesOptions.map((glass) => (
                        <MenuItem key={glass.id} value={glass.id}>
                          {glass.name} - {formatCurrency(typeof glass.price === 'number' ? glass.price : 0)}/m²
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                
                {selectedGlass && (
                  <Paper sx={{ p: 2, bgcolor: 'white' }}>
                    <Typography variant="subtitle2" gutterBottom>Cálculos:</Typography>
                    <Typography variant="body2">
                      <strong>Área:</strong> {getCalculations().area.toFixed(2)} m²
                    </Typography>
                    <Typography variant="body2" color="primary">
                      <strong>Precio Total:</strong> {formatCurrency(getCalculations().totalPrice)}
                    </Typography>
                  </Paper>
                )}
              </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddModelDialog(false)}>Cancelar</Button>
          <Button 
            onClick={addModelToProject} 
            color="primary" 
            variant="contained"
            disabled={!selectedModelToAdd || !selectedGlass}
          >
            Agregar al Proyecto
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
