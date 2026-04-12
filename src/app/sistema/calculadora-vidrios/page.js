"use client";
import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../firebase";
import {
  Box,
  Button,
  Typography,
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
  Paper,
  Autocomplete,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent
} from "@mui/material";
import {
  m2FromCmDimensions,
  normalizeLegacyDimensionsToCm,
} from "../../../utils/units";
import {
  Add,
  Delete,
  Save,
  History,
  Calculate,
  Clear,
  Edit,
  ViewList,
  ChevronRight,
  ChevronLeft
} from "@mui/icons-material";

export default function GlassCalculatorPage() {
  // Estados principales
  const [glasses, setGlasses] = useState([]);
  const [selectedGlass, setSelectedGlass] = useState(null);
  const [selectedGlassOption, setSelectedGlassOption] = useState(null);
  const [dimensions, setDimensions] = useState({ height: "", width: "" });
  const [priceType, setPriceType] = useState("priceInstalled"); // priceInstalled o priceCut
  const [calculatorItems, setCalculatorItems] = useState([]);  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  
  // Estados para diálogos
  const [showSaveProjectDialog, setShowSaveProjectDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showChangeGlassDialog, setShowChangeGlassDialog] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [history, setHistory] = useState([]);
  const [itemToEdit, setItemToEdit] = useState(null);
  
  // Estados para clientes
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [createNewCustomer, setCreateNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);

  useEffect(() => {
    fetchGlasses();
    fetchCustomers();
    fetchHistory();
  }, []);

  const fetchGlasses = async () => {
    try {
      const glassesSnapshot = await getDocs(collection(db, "glasses"));
      const glassesData = glassesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(glass => glass.status !== "inactive"); // Solo vidrios activos
      setGlasses(glassesData);
    } catch (error) {
      console.error("Error fetching glasses: ", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const customersSnapshot = await getDocs(collection(db, "customers"));
      const customersData = customersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(customer => customer.status === "available");
      setCustomers(customersData);
    } catch (error) {
      console.error("Error fetching customers: ", error);
    }
  };

  const fetchHistory = async () => {
    try {
      const historySnapshot = await getDocs(collection(db, "history"));
      const historyData = historySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Ordenar por fecha más reciente
      const sortedHistory = historyData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setHistory(sortedHistory);
    } catch (error) {
      console.error("Error fetching history: ", error);
    }
  };
  const calculateGlassArea = () => m2FromCmDimensions(dimensions.height, dimensions.width);

  const addToCalculator = (glass = selectedGlass, option = selectedGlassOption) => {
    if (!glass || !option) {
      setSnackbar({
        open: true,
        message: "Debe seleccionar un vidrio y una opción.",
        severity: "error"
      });
      return;
    }

    if (!dimensions.height || !dimensions.width || parseFloat(dimensions.height) <= 0 || parseFloat(dimensions.width) <= 0) {
      setSnackbar({
        open: true,
        message: "Las dimensiones deben ser válidas y mayores a 0.",
        severity: "error"
      });
      return;
    }

    const area = calculateGlassArea();
    const price = area * (parseFloat(option[priceType]) || 0);
    const priceTypeText = priceType === "priceInstalled" ? "Instalado" : "Corte";

    const newItem = {
      id: Date.now().toString(),
      glassName: glass.name,
      thickness: option.tickness,
      dimensions: normalizeLegacyDimensionsToCm({ ...dimensions, unit: "cm" }),
      area: area,
      priceType: priceTypeText,
      pricePerUnit: parseFloat(option[priceType]) || 0,
      total: price,
      timestamp: new Date().toISOString()
    };

    setCalculatorItems(prev => [...prev, newItem]);
    setSnackbar({
      open: true,
      message: `${glass.name} ${option.tickness}mm agregado al cálculo.`,
      severity: "success"
    });

    // Mantener las dimensiones para facilitar agregar más elementos
  };

  const removeFromCalculator = (itemId) => {
    setCalculatorItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Función para cambiar el vidrio de un elemento existente
  const openChangeGlassDialog = (item) => {
    setItemToEdit(item);
    setShowChangeGlassDialog(true);
  };

  // Función para actualizar un elemento con nuevo vidrio/opción
  const updateCalculatorItem = (newGlass, newOption) => {
    if (!itemToEdit || !newGlass || !newOption) return;

    const normalizedDims = normalizeLegacyDimensionsToCm(itemToEdit.dimensions);
    const area = m2FromCmDimensions(normalizedDims?.height, normalizedDims?.width);
    const price = area * (parseFloat(newOption[priceType]) || 0);
    const priceTypeText = priceType === "priceInstalled" ? "Instalado" : "Corte";

    const updatedItem = {
      ...itemToEdit,
      glassName: newGlass.name,
      thickness: newOption.tickness,
      priceType: priceTypeText,
      pricePerUnit: parseFloat(newOption[priceType]) || 0,
      total: price,
      timestamp: new Date().toISOString()
    };

    setCalculatorItems(prev => prev.map(item => 
      item.id === itemToEdit.id ? updatedItem : item
    ));

    setSnackbar({
      open: true,
      message: `Elemento actualizado a ${newGlass.name} ${newOption.tickness}mm.`,
      severity: "success"
    });

    setShowChangeGlassDialog(false);
    setItemToEdit(null);
  };

  const clearCalculator = () => {
    setCalculatorItems([]);
    resetForm();
  };
  const resetForm = () => {
    setDimensions({ height: "", width: "" });
    setSelectedGlass(null);
    setSelectedGlassOption(null);
  };

  const getTotalArea = () => {
    return calculatorItems.reduce((total, item) => total + item.area, 0);
  };

  const gettotal = () => {
    return calculatorItems.reduce((total, item) => total + item.total, 0);
  };

  const getAveragePricePerSqm = () => {
    const area = getTotalArea();
    if (area <= 0) return 0;
    return gettotal() / area;
  };

  const getSummaryByGlass = () => {
    const map = {};
    calculatorItems.forEach((item) => {
      const key = `${item.glassName} ${item.thickness}mm`;
      if (!map[key]) map[key] = { name: key, area: 0, total: 0, count: 0 };
      map[key].area += item.area;
      map[key].total += item.total;
      map[key].count += 1;
    });
    return Object.values(map);
  };

  const saveToHistory = async () => {
    if (calculatorItems.length === 0) {
      setSnackbar({
        open: true,
        message: "No hay elementos para guardar en el historial.",
        severity: "error"
      });
      return;
    }

    try {
      const historyData = {
        items: calculatorItems,
        totalArea: getTotalArea(),
        total: gettotal(),
        createdAt: new Date().toISOString(),
        type: "glass_calculation"
      };

      await addDoc(collection(db, "history"), historyData);
      setSnackbar({
        open: true,
        message: "Cálculo guardado en el historial.",
        severity: "success"
      });
      fetchHistory();
    } catch (error) {
      console.error("Error saving to history: ", error);
      setSnackbar({
        open: true,
        message: "Error al guardar en el historial.",
        severity: "error"
      });
    }
  };

  const saveAsProject = async () => {
    if (!projectName.trim()) {
      setSnackbar({
        open: true,
        message: "El nombre del proyecto es obligatorio.",
        severity: "error"
      });
      return;
    }

    if (calculatorItems.length === 0) {
      setSnackbar({
        open: true,
        message: "No hay elementos para crear el proyecto.",
        severity: "error"
      });
      return;
    }

    let finalCustomerId = null;

    try {
      // Si se va a crear un nuevo cliente
      if (createNewCustomer) {
        if (!newCustomerName.trim()) {
          setSnackbar({
            open: true,
            message: "El nombre del cliente es obligatorio.",
            severity: "error"
          });
          return;
        }

        const customerData = {
          name: newCustomerName.trim(),
          phone: newCustomerPhone.trim() || "",
          status: "available"
        };

        const customerDoc = await addDoc(collection(db, "customers"), customerData);
        finalCustomerId = customerDoc.id;
      } else if (selectedCustomer) {
        finalCustomerId = selectedCustomer.id;
      } else {
        setSnackbar({
          open: true,
          message: "Debe seleccionar un cliente o crear uno nuevo.",
          severity: "error"
        });
        return;
      }

      // Redondear a 2 decimales (misma convención que presupuestos)
      const round2 = (n) => (typeof n === "number" && !Number.isNaN(n)) ? Math.round(n * 100) / 100 : 0;

      // Estructura alineada con presupuestos y compatible con proyectos/diario
      const projectData = {
        name: projectName.trim(),
        customerId: finalCustomerId,
        customerName: createNewCustomer ? newCustomerName.trim() : selectedCustomer.name,
        items: calculatorItems.map(item => ({
          type: "model",
          modelId: "glass-calculator",
          modelName: `${item.glassName} ${item.thickness}mm`,
          dimensions: item.dimensions,
          selectedGlass: {
            name: `${item.glassName} ${item.thickness}mm`,
            priceInstalled: item.pricePerUnit
          },
          selectedColor: null,
          total: round2(item.total),
          m2: round2(item.area || 0),
          details: {
            materials: { price: 0, items: [] },
            chapes: { price: 0, items: [] },
            glasses: {
              price: round2(item.total),
              items: [{
                name: `${item.glassName} ${item.thickness}mm`,
                meterage: round2(item.area),
                price: round2(item.total)
              }]
            },
            laborCost: 0,
            laborCostActual: 0,
            glassLaborCost: 0,
            totalLaborActual: 0
          },
          laborCostSelected: 0,
          laborCostActual: 0,
          glassLaborCost: 0,
          totalLaborActual: 0,
          status: "cotizacion",
          area: round2(item.area || 0),
          assignedEmployeeId: ""
        })),
        total: round2(gettotal()),
        createdAt: new Date().toISOString(),
        date: serverTimestamp(),
        status: "quotation",
        payments: []
      };

      await addDoc(collection(db, "projects"), projectData);

      // Guardar también en el historial
      await saveToHistory();

      setSnackbar({
        open: true,
        message: "Proyecto creado exitosamente.",
        severity: "success"
      });

      // Limpiar estados
      setProjectName("");
      setSelectedCustomer(null);
      setNewCustomerName("");
      setNewCustomerPhone("");
      setCreateNewCustomer(false);
      setShowSaveProjectDialog(false);
      clearCalculator();

    } catch (error) {
      console.error("Error saving project: ", error);
      setSnackbar({
        open: true,
        message: "Error al crear el proyecto.",
        severity: "error"
      });
    }
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header fijo */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}>
        <Typography variant="h5" align="center" sx={{ color: "black", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Calculate sx={{ mr: 1 }} />
          Calculadora de Vidrios
        </Typography>
      </Box>

      {/* Panel de configuración: flujo claro para agregar vidrio */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider", bgcolor: "grey.50" }}>
        <Stepper activeStep={0} sx={{ mb: 2, "& .MuiStepLabel-root": { cursor: "default" } }}>
          <Step completed={!!(dimensions.height && dimensions.width)}>
            <StepLabel>1. Dimensiones (cm)</StepLabel>
          </Step>
          <Step completed={!!priceType}>
            <StepLabel>2. Tipo de precio</StepLabel>
          </Step>
          <Step completed={!!(selectedGlass && selectedGlassOption)}>
            <StepLabel>3. Vidrio y grosor</StepLabel>
          </Step>
        </Stepper>
        <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* Dimensiones con mejor feedback */}
          <Card variant="outlined" sx={{ minWidth: 200 }}>
            <CardContent sx={{ "&:last-child": { pb: 1.5 }, py: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                Alto × Ancho
              </Typography>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <TextField
                  size="small"
                  type="number"
                  placeholder="0"
                  value={dimensions.height}
                  onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                  inputProps={{ min: "0", step: "0.1" }}
                  InputProps={{ endAdornment: <InputAdornment position="end">cm</InputAdornment> }}
                  sx={{ width: "100px" }}
                  error={dimensions.height !== "" && (parseFloat(dimensions.height) <= 0 || isNaN(parseFloat(dimensions.height)))}
                  helperText={dimensions.height !== "" && parseFloat(dimensions.height) <= 0 ? "Debe ser > 0" : " "}
                />
                <Typography variant="body2" color="text.secondary">×</Typography>
                <TextField
                  size="small"
                  type="number"
                  placeholder="0"
                  value={dimensions.width}
                  onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                  inputProps={{ min: "0", step: "0.1" }}
                  InputProps={{ endAdornment: <InputAdornment position="end">cm</InputAdornment> }}
                  sx={{ width: "100px" }}
                  error={dimensions.width !== "" && (parseFloat(dimensions.width) <= 0 || isNaN(parseFloat(dimensions.width)))}
                  helperText={dimensions.width !== "" && parseFloat(dimensions.width) <= 0 ? "Debe ser > 0" : " "}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Tipo de precio */}
          <FormControl component="fieldset" sx={{ mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
              Tipo de cotización
            </Typography>
            <RadioGroup
              row
              value={priceType}
              onChange={(e) => setPriceType(e.target.value)}
              sx={{ gap: 2 }}
            >
              <FormControlLabel value="priceInstalled" control={<Radio size="small" />} label="Instalado" sx={{ margin: 0 }} />
              <FormControlLabel value="priceCut" control={<Radio size="small" />} label="Corte" sx={{ margin: 0 }} />
            </RadioGroup>
          </FormControl>

          {/* Área en tiempo real */}
          <Card variant="outlined" sx={{ bgcolor: "primary.50", borderColor: "primary.200", minWidth: 120 }}>
            <CardContent sx={{ "&:last-child": { pb: 1.5 }, py: 1.5, textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">Área</Typography>
              <Typography variant="h6" sx={{ color: "primary.main", fontWeight: "bold" }}>
                {calculateGlassArea().toFixed(2)} m²
              </Typography>
            </CardContent>
          </Card>

          <Button size="small" onClick={clearCalculator} startIcon={<Clear />} variant="outlined" color="error" sx={{ mt: 0.5 }}>
            Limpiar Todo
          </Button>
        </Box>
      </Box>

      {/* Contenido principal */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden", minWidth: 0 }}>
        {/* Panel izquierdo - Selección de vidrios (colapsable) */}
        <Box
          sx={{
            width: leftPanelCollapsed ? 0 : { xs: "100%", md: "38%" },
            minWidth: leftPanelCollapsed ? 0 : undefined,
            borderRight: leftPanelCollapsed ? 0 : 1,
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            transition: "min-width 0.25s, width 0.25s",
            flexShrink: 0,
            ...(leftPanelCollapsed && { overflow: "hidden" })
          }}
        >
          {/* Lista de vidrios */}
          <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
              Seleccionar Vidrio
            </Typography>
            
            {glasses.map((glass) => (
              <Paper 
                key={glass.id} 
                sx={{ 
                  mb: 2, 
                  p: 2,
                  cursor: "pointer",
                  border: selectedGlass?.id === glass.id ? 2 : 1,
                  borderColor: selectedGlass?.id === glass.id ? "primary.main" : "divider",
                  bgcolor: selectedGlass?.id === glass.id ? "primary.light" : "background.paper",
                  transition: "all 0.2s",
                  "&:hover": {
                    bgcolor: selectedGlass?.id === glass.id ? "primary.light" : "grey.50",
                    transform: "translateY(-1px)",
                    boxShadow: 2
                  }
                }}
                onClick={() => {
                  setSelectedGlass(selectedGlass?.id === glass.id ? null : glass);
                  setSelectedGlassOption(null);
                }}
              >
                <Typography variant="h6" sx={{ color: selectedGlass?.id === glass.id ? "primary.contrastText" : "text.primary" }}>
                  {glass.name}
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: selectedGlass?.id === glass.id ? "primary.contrastText" : "text.secondary",
                  opacity: 0.8 
                }}>
                  {glass.options.length} opción{glass.options.length !== 1 ? 'es' : ''} disponible{glass.options.length !== 1 ? 's' : ''}
                </Typography>
              </Paper>
            ))}
          </Box>

          {/* Panel de opciones (solo si hay vidrio seleccionado) */}
          {selectedGlass && (
            <Box sx={{ 
              borderTop: 1, 
              borderColor: "divider", 
              p: 2, 
              bgcolor: "background.paper",
              maxHeight: "80%",
              overflow: "auto"
            }}>
              <Typography variant="subtitle1" sx={{ mb: 0.5, color: "primary.main" }}>
                Opciones de {selectedGlass.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                {parseFloat(dimensions.height) > 0 && parseFloat(dimensions.width) > 0
                  ? `Área actual: ${calculateGlassArea().toFixed(2)} m² — Elige grosor y pulsa Agregar.`
                  : "Ingresa alto y ancho arriba para ver precios y agregar."}
              </Typography>
              
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {selectedGlass.options.map((option, index) => {
                  const price = parseFloat(option[priceType]) || 0;
                  const total = calculateGlassArea() * price;
                  const isValidDimensions = parseFloat(dimensions.height) > 0 && parseFloat(dimensions.width) > 0;
                  
                  return (
                    <Paper
                      key={index}
                      sx={{
                        p: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        border: 1,
                        borderColor: "divider",
                        bgcolor: !isValidDimensions ? "grey.100" : "background.paper",
                        opacity: !isValidDimensions ? 0.6 : 1
                      }}
                    >
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                          Grosor: {option.tickness}mm
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ${price.toFixed(2)}/m² = ${isValidDimensions ? total.toFixed(2) : "0.00"}
                        </Typography>
                      </Box>
                      
                      <Button
                        variant="contained"
                        size="small"
                        disabled={!isValidDimensions}
                        onClick={() => {
                          setSelectedGlassOption(option);
                          addToCalculator(selectedGlass, option);
                        }}
                        startIcon={<Add />}
                        sx={{ minWidth: "100px" }}
                      >
                        Agregar
                      </Button>
                    </Paper>
                  );
                })}
              </Box>
            </Box>
          )}
        </Box>

        {/* Panel derecho - Listado y sumatoria (más espacio, tabla densa) */}
        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header: título, botón colapsar selector, acciones */}
          <Box sx={{ p: 1.5, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper", display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <IconButton
              size="small"
              onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
              title={leftPanelCollapsed ? "Mostrar selector de vidrios" : "Ocultar selector para ver solo listado"}
              sx={{ mr: 0.5 }}
            >
              {leftPanelCollapsed ? <ChevronRight /> : <ChevronLeft />}
            </IconButton>
            <Typography variant="h6" sx={{ color: "primary.main", flex: 1 }}>
              Listado de vidrios ({calculatorItems.length})
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button size="small" onClick={() => setShowHistoryDialog(true)} startIcon={<History />} variant="outlined">
                Historial
              </Button>
              {calculatorItems.length > 0 && (
                <>
                  <Button size="small" onClick={saveToHistory} startIcon={<Save />} variant="outlined">
                    Guardar
                  </Button>
                  <Button size="small" onClick={() => setShowSaveProjectDialog(true)} startIcon={<Save />} variant="contained">
                    Proyecto
                  </Button>
                </>
              )}
            </Box>
          </Box>

          {/* Resumen compacto en una línea */}
          {calculatorItems.length > 0 && (
            <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: "divider", bgcolor: "grey.50", display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
              <Typography variant="body2"><strong>Metraje:</strong> {getTotalArea().toFixed(2)} m²</Typography>
              <Typography variant="body2"><strong>Piezas:</strong> {calculatorItems.length}</Typography>
              <Typography variant="body2"><strong>Prom. /m²:</strong> ${getAveragePricePerSqm().toFixed(2)}</Typography>
              <Typography variant="body2" color="primary.main"><strong>Total:</strong> ${gettotal().toFixed(2)}</Typography>
              {getSummaryByGlass().length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center" }}>
                  {getSummaryByGlass().map((row) => (
                    <Chip key={row.name} size="small" label={`${row.name}: ${row.area.toFixed(2)} m²`} variant="outlined" sx={{ height: 22 }} />
                  ))}
                </Box>
              )}
            </Box>
          )}

          {/* Listado en tabla densa con cabecera fija */}
          <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
            {calculatorItems.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6, px: 2, border: "2px dashed", borderColor: "grey.300", borderRadius: 2, m: 2, bgcolor: "grey.50" }}>
                <ViewList sx={{ fontSize: 48, color: "grey.400", mb: 1 }} />
                <Typography color="textSecondary" variant="h6" sx={{ mb: 0.5 }}>Sin vidrios en la cotización</Typography>
                <Typography color="textSecondary" variant="body2">
                  Usa el panel izquierdo: dimensiones → tipo de precio → vidrio y grosor → Agregar
                </Typography>
                {leftPanelCollapsed && (
                  <Button size="small" startIcon={<ChevronRight />} onClick={() => setLeftPanelCollapsed(false)} sx={{ mt: 2 }}>
                    Mostrar selector
                  </Button>
                )}
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: "100%", overflow: "auto" }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: "grey.100", whiteSpace: "nowrap" }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: "grey.100" }}>Vidrio</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: "grey.100", whiteSpace: "nowrap" }}>Grosor</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: "grey.100" }}>Tipo</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: "grey.100", whiteSpace: "nowrap" }}>Dimensiones</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, bgcolor: "grey.100" }}>m²</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, bgcolor: "grey.100" }}>$/m²</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, bgcolor: "grey.100" }}>Total</TableCell>
                      <TableCell padding="none" sx={{ fontWeight: 600, bgcolor: "grey.100", width: 88 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {calculatorItems.map((item, index) => (
                      <TableRow key={item.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                        <TableCell sx={{ color: "text.secondary" }}>{index + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{item.glassName}</TableCell>
                        <TableCell>{item.thickness} mm</TableCell>
                        <TableCell>{item.priceType}</TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{item.dimensions.height} × {item.dimensions.width} cm</TableCell>
                        <TableCell align="right">{item.area.toFixed(2)}</TableCell>
                        <TableCell align="right">${item.pricePerUnit.toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: "primary.main" }}>${item.total.toFixed(2)}</TableCell>
                        <TableCell padding="none">
                          <IconButton size="small" onClick={() => openChangeGlassDialog(item)} title="Cambiar vidrio"><Edit fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => removeFromCalculator(item.id)} title="Eliminar"><Delete fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>

          {/* Panel de totales fijo en la parte inferior */}
          {calculatorItems.length > 0 && (
            <Box sx={{ 
              p: 2, 
              borderTop: 1, 
              borderColor: "divider", 
              bgcolor: "primary.main",
              color: "primary.contrastText"
            }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 2, flexWrap: "wrap" }}>
                  <Typography variant="h6">Metraje total: {getTotalArea().toFixed(2)} m²</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>·</Typography>
                  <Typography variant="body1">{calculatorItems.length} pieza{calculatorItems.length !== 1 ? "s" : ""}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>·</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Promedio ${getAveragePricePerSqm().toFixed(2)}/m²</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                  ${gettotal().toFixed(2)}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Diálogo para guardar proyecto */}
      <Dialog open={showSaveProjectDialog} onClose={() => setShowSaveProjectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Guardar como Proyecto</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre del Proyecto"
            fullWidth
            variant="outlined"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ mb: 2 }}>
            <Button
              variant={createNewCustomer ? "outlined" : "contained"}
              onClick={() => setCreateNewCustomer(false)}
              sx={{ mr: 1 }}
            >
              Cliente Existente
            </Button>
            <Button
              variant={createNewCustomer ? "contained" : "outlined"}
              onClick={() => setCreateNewCustomer(true)}
            >
              Nuevo Cliente
            </Button>
          </Box>

          {createNewCustomer ? (
            <>
              <TextField
                margin="dense"
                label="Nombre del Cliente"
                fullWidth
                variant="outlined"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Teléfono del Cliente (opcional)"
                fullWidth
                variant="outlined"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
              />
            </>
          ) : (
            <Autocomplete
              options={customers}
              getOptionLabel={(option) => `${option.name}${option.phone ? ` - ${option.phone}` : ''}`}
              value={selectedCustomer}
              onChange={(event, newValue) => setSelectedCustomer(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Seleccionar Cliente" variant="outlined" />
              )}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveProjectDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={saveAsProject}>
            Crear Proyecto
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de historial */}
      <Dialog open={showHistoryDialog} onClose={() => setShowHistoryDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Historial de Cálculos</DialogTitle>
        <DialogContent>
          {history.length === 0 ? (
            <Typography>No hay historial disponible</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Elementos</TableCell>
                    <TableCell>Área Total</TableCell>
                    <TableCell>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {new Date(record.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>{record.items?.length || 0}</TableCell>
                      <TableCell>{record.totalArea?.toFixed(2) || 0} m²</TableCell>
                      <TableCell>${record.total?.toFixed(2) || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHistoryDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para cambiar vidrio */}
      <Dialog open={showChangeGlassDialog} onClose={() => setShowChangeGlassDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Cambiar Vidrio - {itemToEdit?.dimensions.height} × {itemToEdit?.dimensions.width} cm
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Elemento actual: {itemToEdit?.glassName} {itemToEdit?.thickness}mm - ${itemToEdit?.total.toFixed(2)}
          </Typography>
          
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: "60vh", overflow: "auto" }}>
            {glasses.map((glass) => (
              <Paper key={glass.id} sx={{ p: 2, border: 1, borderColor: "divider" }}>
                <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
                  {glass.name}
                </Typography>
                
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {glass.options.map((option, index) => {
                    if (!itemToEdit) return null;
                    
                    const normalizedDims = normalizeLegacyDimensionsToCm(itemToEdit.dimensions);
                    const area = m2FromCmDimensions(normalizedDims?.height, normalizedDims?.width);
                    const price = parseFloat(option[priceType]) || 0;
                    const total = area * price;
                    const currentSelection = itemToEdit.glassName === glass.name && itemToEdit.thickness === option.tickness;
                    
                    return (
                      <Paper
                        key={index}
                        sx={{
                          p: 2,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          border: 1,
                          borderColor: currentSelection ? "primary.main" : "divider",
                          bgcolor: currentSelection ? "primary.light" : "background.paper"
                        }}
                      >
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                            Grosor: {option.tickness}mm
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ${price.toFixed(2)}/m² = ${total.toFixed(2)}
                          </Typography>
                          {currentSelection && (
                            <Chip size="small" label="Actual" color="primary" sx={{ mt: 0.5 }} />
                          )}
                        </Box>
                        
                        <Button
                          variant={currentSelection ? "outlined" : "contained"}
                          size="small"
                          disabled={currentSelection}
                          onClick={() => updateCalculatorItem(glass, option)}
                          sx={{ minWidth: "100px" }}
                        >
                          {currentSelection ? "Actual" : "Cambiar"}
                        </Button>
                      </Paper>
                    );
                  })}
                </Box>
              </Paper>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowChangeGlassDialog(false)}>Cerrar</Button>
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
