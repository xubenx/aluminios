"use client";
import { useState, useEffect } from "react";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  addDoc,
  updateDoc
} from "firebase/firestore";
import { db } from "../../../../firebase";

export function useOrdenesController() {
  // Estados principales
  const [activeProjects, setActiveProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para la orden de trabajo
  const [workOrder, setWorkOrder] = useState({
    projectId: "",
    projectName: "",
    client: "",
    employee: "",
    laborCost: 0,
    totalLaborCost: 0,
    items: [],
    date: new Date().toISOString().split('T')[0],
    status: "pending", // pending, completed, cancelled
    paymentStatus: "unpaid" // unpaid, paid
  });

  // Estados para gestión de órdenes (ahora desde projects)
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrdersManagement, setShowOrdersManagement] = useState(false);
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState("");
  const [confirmPaymentDialog, setConfirmPaymentDialog] = useState({
    open: false,
    projectId: null,
    itemIndex: null,
    itemData: null
  });

  // Estados del diálogo
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState(""); // "create", "view", "print"
  
  // Estado para snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  // Cargar proyectos activos al inicializar
  useEffect(() => {
    loadActiveProjects();
    loadEmployees();
  }, []);

  // Función para cargar proyectos activos (estatus "active")
  const loadActiveProjects = async () => {
    try {
      setLoading(true);
      const projectsRef = collection(db, "projects");
      const q = query(projectsRef, where("status", "==", "active"));
      const snapshot = await getDocs(q);
      
      const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setActiveProjects(projects);
    } catch (error) {
      console.error("Error loading active projects:", error);
      setError("Error al cargar proyectos activos");
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar empleados (desde la colección employees)
  const loadEmployees = async () => {
    try {
      const employeesRef = collection(db, "employees");
      const snapshot = await getDocs(employeesRef);
      
      const employeesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setEmployees(employeesList);
    } catch (error) {
      console.error("Error loading employees:", error);
      setError("Error al cargar empleados");
    }
  };

  // Función para obtener todas las órdenes desde los proyectos
  const getAllOrdersFromProjects = () => {
    const allOrders = [];
    
    activeProjects.forEach(project => {
      if (project.items) {
        project.items.forEach((item, itemIndex) => {
          // Solo incluir items que tienen orden de trabajo creada
          if (item.workOrder && item.assignedEmployeeId) {
            const aluminumLaborCost = item.laborCostActual || item.details?.laborCostActual || 0;
            const glassLaborCost = item.details?.glassLaborCost || 0;
            const totalLaborCost = aluminumLaborCost + glassLaborCost;
            
            allOrders.push({
              id: `${project.id}_${itemIndex}`, // ID único combinando proyecto e índice
              projectId: project.id,
              projectName: project.name || project.projectName || "Sin nombre",
              client: project.customerName || project.client || "Sin cliente",
              employeeId: item.assignedEmployeeId,
              employee: getEmployeeName(item.assignedEmployeeId),
              itemIndex: itemIndex,
              itemName: item.modelName || item.itemName || "Item sin nombre",
              area: item.area || "Sin área especificada",
              totalLaborCost: totalLaborCost,
              aluminumLaborCost: aluminumLaborCost,
              glassLaborCost: glassLaborCost,
              paymentStatus: item.workOrder.paymentStatus || "unpaid",
              paidDate: item.workOrder.paidDate || null,
              paidBy: item.workOrder.paidBy || null,
              createdAt: item.workOrder.createdAt || new Date(),
              status: item.status || "pendiente"
            });
          }
        });
      }
    });
    
    // Ordenar por fecha de creación (más recientes primero)
    allOrders.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return dateB - dateA;
    });
    
    return allOrders;
  };

  // Función para calcular el costo de mano de obra por empleado (items sin orden de trabajo)
  const calculateLaborCostForEmployee = (project, employeeId) => {
    if (!project || !project.items) return 0;
    
    let totalLaborCost = 0;
    
    project.items.forEach(item => {
      // Solo incluir items asignados al empleado que NO tengan orden de trabajo
      if (item.assignedEmployeeId === employeeId && !item.workOrder) {
        // Usar laborCostActual para el costo real de mano de obra de aluminio
        const aluminumLaborCost = item.laborCostActual || item.details?.laborCostActual || 0;
        
        // Agregar el costo de mano de obra de vidrio
        const glassLaborCost = item.details?.glassLaborCost || 0;
        
        // Total de mano de obra (aluminio + vidrio)
        totalLaborCost += aluminumLaborCost + glassLaborCost;
      }
    });
    
    return totalLaborCost;
  };

  // Función para obtener items de trabajo por empleado (sin orden de trabajo)
  const getItemsForEmployee = (project, employeeId) => {
    if (!project || !project.items) return [];
    
    return project.items.filter(item => 
      item.assignedEmployeeId === employeeId && !item.workOrder
    ).map((item) => {
      const aluminumLaborCost = item.laborCostActual || item.details?.laborCostActual || 0;
      const glassLaborCost = item.details?.glassLaborCost || 0;
      const totalLaborCost = aluminumLaborCost + glassLaborCost;
      
      return {
        ...item,
        originalIndex: project.items.indexOf(item), // Índice original en el proyecto
        employeeLaborCost: totalLaborCost,
        aluminumLaborCost: aluminumLaborCost,
        glassLaborCost: glassLaborCost,
        employeeName: item.modelName || item.itemName || "Item sin nombre",
        area: item.area || "Sin área especificada",
        status: item.status || "pendiente"
      };
    });
  };

  // Función para obtener items con orden de trabajo por empleado
  const getOrderItemsForEmployee = (project, employeeId) => {
    if (!project || !project.items) return [];
    
    return project.items.filter(item => 
      item.assignedEmployeeId === employeeId && item.workOrder
    ).map((item) => {
      const aluminumLaborCost = item.laborCostActual || item.details?.laborCostActual || 0;
      const glassLaborCost = item.details?.glassLaborCost || 0;
      const totalLaborCost = aluminumLaborCost + glassLaborCost;
      
      return {
        ...item,
        originalIndex: project.items.indexOf(item), // Índice original en el proyecto
        employeeLaborCost: totalLaborCost,
        aluminumLaborCost: aluminumLaborCost,
        glassLaborCost: glassLaborCost,
        employeeName: item.modelName || item.itemName || "Item sin nombre",
        area: item.area || "Sin área especificada",
        status: item.status || "pendiente"
      };
    });
  };

  // Función para crear orden de trabajo para un item específico
  const createWorkOrderForItem = async (project, employee, itemIndex) => {
    try {
      if (!project.items || !project.items[itemIndex]) {
        setSnackbar({
          open: true,
          message: "Item no encontrado en el proyecto",
          severity: "error"
        });
        return;
      }

      const item = project.items[itemIndex];
      
      // Verificar que el item esté asignado al empleado
      if (item.assignedEmployeeId !== employee.id) {
        setSnackbar({
          open: true,
          message: "Este item no está asignado al empleado seleccionado",
          severity: "warning"
        });
        return;
      }

      // Verificar si ya tiene una orden de trabajo
      if (item.workOrder) {
        const statusText = item.workOrder.paymentStatus === "paid" ? "pagada" : "sin pagar";
        setSnackbar({
          open: true,
          message: `Este item ya tiene una orden de trabajo ${statusText}`,
          severity: "warning"
        });
        return;
      }

      // Crear la orden de trabajo en el item
      const updatedItems = [...project.items];
      updatedItems[itemIndex] = {
        ...item,
        workOrder: {
          paymentStatus: "unpaid",
          createdAt: new Date(),
          createdBy: employee.id
        }
      };

      // Actualizar el proyecto en Firebase
      const projectRef = doc(db, "projects", project.id);
      await updateDoc(projectRef, {
        items: updatedItems
      });

      // Recargar proyectos para actualizar la vista
      loadActiveProjects();

      setSnackbar({
        open: true,
        message: `Orden de trabajo creada para el item "${item.modelName || item.itemName}"`,
        severity: "success"
      });

    } catch (error) {
      console.error("Error creating work order for item:", error);
      setSnackbar({
        open: true,
        message: "Error al crear orden de trabajo",
        severity: "error"
      });
    }
  };

  // Función para crear órdenes para todos los items de un empleado en un proyecto
  const createWorkOrder = (project, employee) => {
    const employeeItems = getItemsForEmployee(project, employee.id);
    
    if (employeeItems.length === 0) {
      setSnackbar({
        open: true,
        message: `El empleado ${employee.name || employee.displayName} no tiene items sin orden de trabajo en este proyecto.`,
        severity: "warning"
      });
      return;
    }

    // Mostrar diálogo de confirmación con los items que se crearán
    const itemNames = employeeItems.map(item => item.modelName || item.itemName || "Item sin nombre");
    const laborCost = calculateLaborCostForEmployee(project, employee.id);
    
    const workOrderData = {
      projectId: project.id,
      projectName: project.name || project.projectName || "Sin nombre",
      client: project.customerName || project.client || "Sin cliente",
      employee: employee.name || employee.displayName || "Sin nombre",
      employeeId: employee.id,
      items: employeeItems,
      itemNames: itemNames,
      totalLaborCost: laborCost,
      date: new Date().toISOString().split('T')[0],
      status: "pending"
    };
    
    setWorkOrder(workOrderData);
    setDialogType("create");
    setOpenDialog(true);
  };

  // Función para confirmar y guardar órdenes de trabajo en los items
  const confirmWorkOrder = async () => {
    try {
      setLoading(true);
      
      const project = activeProjects.find(p => p.id === workOrder.projectId);
      if (!project) {
        throw new Error("Proyecto no encontrado");
      }

      // Actualizar cada item sin orden con la nueva orden
      const updatedItems = project.items.map(item => {
        const hasWorkOrder = workOrder.items.some(workItem => 
          workItem.assignedEmployeeId === workOrder.employeeId && 
          (workItem.modelName === item.modelName || workItem.itemName === item.itemName) &&
          item.assignedEmployeeId === workOrder.employeeId
        );

        if (hasWorkOrder && !item.workOrder) {
          return {
            ...item,
            workOrder: {
              paymentStatus: "unpaid",
              createdAt: new Date(),
              createdBy: workOrder.employeeId
            }
          };
        }
        return item;
      });

      // Actualizar el proyecto en Firebase
      const projectRef = doc(db, "projects", workOrder.projectId);
      await updateDoc(projectRef, {
        items: updatedItems
      });
      
      setOpenDialog(false);
      setWorkOrder({
        projectId: "",
        projectName: "",
        client: "",
        employee: "",
        laborCost: 0,
        totalLaborCost: 0,
        items: [],
        date: new Date().toISOString().split('T')[0],
        status: "pending",
        paymentStatus: "unpaid"
      });
      
      // Recargar proyectos para actualizar la lista
      loadActiveProjects();
      
      // Mostrar mensaje de éxito
      setSnackbar({
        open: true,
        message: `Órdenes de trabajo creadas exitosamente para ${workOrder.items.length} items`,
        severity: "success"
      });
      
    } catch (error) {
      console.error("Error creating work orders:", error);
      setSnackbar({
        open: true,
        message: "Error al crear órdenes de trabajo",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para imprimir orden de trabajo
  const printWorkOrder = () => {
    window.print();
  };

  // Función para filtrar proyectos por empleado
  const getProjectsForEmployee = (employeeId) => {
    return activeProjects.filter(project => {
      if (!project.items) return false;
      
      return project.items.some(item => 
        item.assignedEmployeeId === employeeId
      );
    });
  };

  // Función para obtener el nombre del empleado
  const getEmployeeName = (employeeId) => {
    if (!employeeId) return "Sin asignar";
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? (employee.name || employee.displayName || "Sin nombre") : "Empleado no encontrado";
  };

  // Función para verificar si ya existe una orden para el empleado y proyecto
  const checkDuplicateOrder = (projectId, employeeId) => {
    const project = activeProjects.find(p => p.id === projectId);
    if (!project || !project.items) return false;
    
    return project.items.some(item => 
      item.assignedEmployeeId === employeeId && 
      item.workOrder && 
      (item.workOrder.paymentStatus === "unpaid" || item.workOrder.paymentStatus === "paid")
    );
  };

  // Función para obtener orden existente
  const getExistingOrder = (projectId, employeeId) => {
    const project = activeProjects.find(p => p.id === projectId);
    if (!project || !project.items) return null;
    
    const item = project.items.find(item => 
      item.assignedEmployeeId === employeeId && 
      item.workOrder && 
      (item.workOrder.paymentStatus === "unpaid" || item.workOrder.paymentStatus === "paid")
    );
    
    if (item) {
      return {
        projectId: projectId,
        projectName: project.name || project.projectName,
        employeeId: employeeId,
        paymentStatus: item.workOrder.paymentStatus,
        paidDate: item.workOrder.paidDate,
        itemName: item.modelName || item.itemName || "Item sin nombre"
      };
    }
    
    return null;
  };

  // Función para mostrar confirmación de pago
  const showPaymentConfirmation = async (projectId, itemIndex) => {
    try {
      const project = activeProjects.find(p => p.id === projectId);
      if (!project || !project.items || !project.items[itemIndex]) {
        setSnackbar({
          open: true,
          message: "Item no encontrado",
          severity: "error"
        });
        return;
      }
      
      const item = project.items[itemIndex];
      
      // Validar que el item tenga una orden de trabajo y no esté pagada
      if (!item.workOrder) {
        setSnackbar({
          open: true,
          message: "Este item no tiene una orden de trabajo",
          severity: "warning"
        });
        return;
      }

      if (item.workOrder.paymentStatus === "paid") {
        setSnackbar({
          open: true,
          message: "Esta orden ya está marcada como pagada",
          severity: "warning"
        });
        return;
      }
      
      setConfirmPaymentDialog({
        open: true,
        projectId: projectId,
        itemIndex: itemIndex,
        itemData: {
          ...item,
          projectName: project.name || project.projectName,
          employeeName: getEmployeeName(item.assignedEmployeeId)
        }
      });
      
    } catch (error) {
      console.error("Error loading item for confirmation:", error);
      setSnackbar({
        open: true,
        message: "Error al cargar información del item",
        severity: "error"
      });
    }
  };

  // Función para marcar item como pagado (después de confirmación)
  const markOrderAsPaid = async () => {
    try {
      const { projectId, itemIndex, itemData } = confirmPaymentDialog;
      
      if (!projectId || itemIndex === null || !itemData) {
        throw new Error("Datos de item incompletos");
      }

      const project = activeProjects.find(p => p.id === projectId);
      if (!project) {
        throw new Error("Proyecto no encontrado");
      }

      // Calcular el costo de mano de obra del item
      const aluminumLaborCost = itemData.laborCostActual || itemData.details?.laborCostActual || 0;
      const glassLaborCost = itemData.details?.glassLaborCost || 0;
      const totalLaborCost = aluminumLaborCost + glassLaborCost;

      // Actualizar el estado de pago en el item
      const updatedItems = [...project.items];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        workOrder: {
          ...updatedItems[itemIndex].workOrder,
          paymentStatus: "paid",
          paidDate: new Date().toISOString(),
          paidBy: "admin" // Aquí podrías poner el ID del usuario actual
        }
      };

      // Actualizar el proyecto en Firebase
      const projectRef = doc(db, "projects", projectId);
      await updateDoc(projectRef, {
        items: updatedItems
      });
      
      // Registrar el gasto en el diario contable
      const diaryRef = collection(db, "diary");
      await addDoc(diaryRef, {
        fecha: new Date().toISOString().split('T')[0],
        tipo: "gasto",
        categoria: "Mano de Obra",
        descripcion: `Pago de mano de obra - ${itemData.employeeName} - Item: ${itemData.modelName || itemData.itemName} - Proyecto: ${itemData.projectName}`,
        monto: totalLaborCost,
        activo: true,
        projectId: projectId,
        itemIndex: itemIndex, // Referencia al item específico
        createdAt: new Date()
      });
      
      // Cerrar diálogo de confirmación
      setConfirmPaymentDialog({
        open: false,
        projectId: null,
        itemIndex: null,
        itemData: null
      });
      
      // Recargar proyectos
      loadActiveProjects();
      
      setSnackbar({
        open: true,
        message: "Item marcado como pagado y registrado en gastos",
        severity: "success"
      });
      
    } catch (error) {
      console.error("Error marking item as paid:", error);
      setSnackbar({
        open: true,
        message: "Error al marcar item como pagado",
        severity: "error"
      });
    }
  };

  // Función para validar si se puede deshacer un pago (solo items recién pagados)
  const canUndoPayment = (item) => {
    if (!item || !item.workOrder || item.workOrder.paymentStatus !== "paid" || !item.workOrder.paidDate) {
      return false;
    }
    
    // Solo permitir deshacer pagos realizados en las últimas 24 horas
    const paidDate = new Date(item.workOrder.paidDate);
    const now = new Date();
    const diffHours = (now - paidDate) / (1000 * 60 * 60);
    
    return diffHours <= 24; // 24 horas para deshacer
  };

  // Función para deshacer el pago de un item (con validaciones estrictas)
  const undoOrderPayment = async (projectId, itemIndex) => {
    try {
      const project = activeProjects.find(p => p.id === projectId);
      if (!project || !project.items || !project.items[itemIndex]) {
        throw new Error("Item no encontrado");
      }
      
      const item = project.items[itemIndex];
      
      // Validación: Solo permitir deshacer pagos recientes
      if (!canUndoPayment(item)) {
        setSnackbar({
          open: true,
          message: "No se puede deshacer este pago. Solo se pueden deshacer pagos realizados en las últimas 24 horas.",
          severity: "error"
        });
        return;
      }
      
      const employeeName = getEmployeeName(item.assignedEmployeeId);
      const itemName = item.modelName || item.itemName || "Item sin nombre";
      
      // Confirmar con el usuario
      if (!window.confirm(`¿Estás seguro de que quieres deshacer el pago del item "${itemName}" de ${employeeName}?\n\nEsto eliminará el registro de gasto del diario contable.`)) {
        return;
      }
      
      // Actualizar estado de pago en el item
      const updatedItems = [...project.items];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        workOrder: {
          ...updatedItems[itemIndex].workOrder,
          paymentStatus: "unpaid",
          paidDate: null,
          paidBy: null
        }
      };

      // Actualizar el proyecto en Firebase
      const projectRef = doc(db, "projects", projectId);
      await updateDoc(projectRef, {
        items: updatedItems
      });
      
      // Buscar y eliminar el gasto correspondiente en el diario
      const diaryRef = collection(db, "diary");
      const q = query(diaryRef, where("projectId", "==", projectId), where("itemIndex", "==", itemIndex));
      const snapshot = await getDocs(q);
      
      for (const docSnap of snapshot.docs) {
        await updateDoc(doc(db, "diary", docSnap.id), {
          activo: false // Soft delete
        });
      }
      
      // Recargar proyectos
      loadActiveProjects();
      
      setSnackbar({
        open: true,
        message: "Pago deshecho y gasto eliminado del diario",
        severity: "success"
      });
      
    } catch (error) {
      console.error("Error undoing item payment:", error);
      setSnackbar({
        open: true,
        message: "Error al deshacer el pago",
        severity: "error"
      });
    }
  };

  // Función para filtrar órdenes por empleado
  const getFilteredOrders = () => {
    const allOrders = getAllOrdersFromProjects();
    
    if (!selectedEmployeeFilter) {
      return allOrders;
    }
    
    return allOrders.filter(order => order.employeeId === selectedEmployeeFilter);
  };

  // Función para obtener estadísticas de órdenes
  const getOrdersStats = () => {
    const filteredOrders = getFilteredOrders();
    const totalOrders = filteredOrders.length;
    const paidOrders = filteredOrders.filter(order => order.paymentStatus === "paid").length;
    const unpaidOrders = totalOrders - paidOrders;
    const totalAmount = filteredOrders.reduce((sum, order) => sum + (order.totalLaborCost || 0), 0);
    const paidAmount = filteredOrders
      .filter(order => order.paymentStatus === "paid")
      .reduce((sum, order) => sum + (order.totalLaborCost || 0), 0);
    const unpaidAmount = totalAmount - paidAmount;
    
    return {
      totalOrders,
      paidOrders,
      unpaidOrders,
      totalAmount,
      paidAmount,
      unpaidAmount
    };
  };

  // Función para obtener estadísticas por empleado
  const getEmployeeOrderStats = (employeeId) => {
    const allOrders = getAllOrdersFromProjects();
    const employeeOrders = allOrders.filter(order => order.employeeId === employeeId);
    const totalOrders = employeeOrders.length;
    const paidOrders = employeeOrders.filter(order => order.paymentStatus === "paid").length;
    const unpaidOrders = totalOrders - paidOrders;
    const activeProjects = [...new Set(employeeOrders.map(order => order.projectId))].length;
    
    return {
      totalOrders,
      paidOrders,
      unpaidOrders,
      activeProjects
    };
  };

  // Handler para cerrar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      open: false,
      message: "",
      severity: "success"
    });
  };

  // Handlers para el diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDialogType("");
  };

  // Handler para seleccionar proyecto
  const handleSelectProject = (project) => {
    setSelectedProject(project);
  };

  // Handler para seleccionar empleado
  const handleSelectEmployee = (employeeId) => {
    setSelectedEmployee(employeeId);
  };

  // Handlers para gestión de órdenes
  const handleShowOrdersManagement = () => {
    setShowOrdersManagement(true);
  };

  const handleHideOrdersManagement = () => {
    setShowOrdersManagement(false);
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
  };

  // Handlers para filtros
  const handleEmployeeFilterChange = (employeeId) => {
    setSelectedEmployeeFilter(employeeId);
  };

  // Handlers para confirmaciones
  const handleClosePaymentConfirmation = () => {
    setConfirmPaymentDialog({
      open: false,
      projectId: null,
      itemIndex: null,
      itemData: null
    });
  };

  return {
    // Estados
    activeProjects,
    employees,
    selectedProject,
    selectedEmployee,
    selectedOrder,
    showOrdersManagement,
    selectedEmployeeFilter,
    confirmPaymentDialog,
    loading,
    error,
    workOrder,
    openDialog,
    dialogType,
    snackbar,
    
    // Funciones
    loadActiveProjects,
    loadEmployees,
    calculateLaborCostForEmployee,
    getItemsForEmployee,
    getOrderItemsForEmployee,
    createWorkOrder,
    createWorkOrderForItem,
    confirmWorkOrder,
    printWorkOrder,
    getProjectsForEmployee,
    getEmployeeName,
    getAllOrdersFromProjects,
    showPaymentConfirmation,
    markOrderAsPaid,
    undoOrderPayment,
    canUndoPayment,
    getFilteredOrders,
    getOrdersStats,
    getEmployeeOrderStats,
    checkDuplicateOrder,
    getExistingOrder,
    handleCloseDialog,
    handleCloseSnackbar,
    handleSelectProject,
    handleSelectEmployee,
    handleShowOrdersManagement,
    handleHideOrdersManagement,
    handleSelectOrder,
    handleEmployeeFilterChange,
    handleClosePaymentConfirmation,
    
    // Setters
    setSelectedProject,
    setSelectedEmployee,
    setWorkOrder
  };
}
