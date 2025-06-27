"use client";
import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../../../firebase";
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
  Alert,  Divider,
  Paper,
  Autocomplete,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from "@mui/material";
import {
  Add,
  Delete,
  Save,
  History,
  Calculate,
  Clear
} from "@mui/icons-material";

export default function GlassCalculatorPage() {
  // Estados principales
  const [glasses, setGlasses] = useState([]);
  const [selectedGlass, setSelectedGlass] = useState(null);
  const [selectedGlassOption, setSelectedGlassOption] = useState(null);
  const [dimensions, setDimensions] = useState({ height: "100", width: "100" });
  const [priceType, setPriceType] = useState("priceInstalled"); // priceInstalled o priceCut
  const [calculatorItems, setCalculatorItems] = useState([]);  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  
  // Estados para diálogos
  const [showSaveProjectDialog, setShowSaveProjectDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [history, setHistory] = useState([]);
  
  // Estados para clientes
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [createNewCustomer, setCreateNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");

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

  const handleGlassSelection = (glass, option) => {
    setSelectedGlass(glass);
    setSelectedGlassOption(option);
  };
  const calculateGlassArea = () => {
    const height = parseFloat(dimensions.height) || 0;
    const width = parseFloat(dimensions.width) || 0;
    // Convertir de cm a m² (dividir por 100 para cada dimensión)
    return (height / 100) * (width / 100);
  };

  const calculateGlassPrice = () => {
    if (!selectedGlassOption) return 0;
    const area = calculateGlassArea();
    const pricePerUnit = parseFloat(selectedGlassOption[priceType]) || 0;
    return area * pricePerUnit;
  };

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
      dimensions: { ...dimensions },
      area: area,
      priceType: priceTypeText,
      pricePerUnit: parseFloat(option[priceType]) || 0,
      totalPrice: price,
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

  const clearCalculator = () => {
    setCalculatorItems([]);
    resetForm();
  };
  const resetForm = () => {
    setDimensions({ height: "100", width: "100" });
    setSelectedGlass(null);
    setSelectedGlassOption(null);
  };

  const getTotalArea = () => {
    return calculatorItems.reduce((total, item) => total + item.area, 0);
  };

  const getTotalPrice = () => {
    return calculatorItems.reduce((total, item) => total + item.totalPrice, 0);
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
        totalPrice: getTotalPrice(),
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

      // Crear el proyecto
      const projectData = {
        name: projectName.trim(),
        customerId: finalCustomerId,
        customerName: createNewCustomer ? newCustomerName.trim() : selectedCustomer.name,
        items: calculatorItems.map(item => ({
          modelId: "glass-calculator",
          modelName: `${item.glassName} ${item.thickness}mm`,
          dimensions: item.dimensions,
          selectedGlass: {
            name: `${item.glassName} ${item.thickness}mm`,
            priceInstalled: item.pricePerUnit
          },
          total: item.totalPrice,
          area: item.area || "",
          status: "cotizacion",
          laborCostSelected: 0,
          details: {
            materials: { price: 0, items: [] },
            chapes: { price: 0, items: [] },
            glasses: { 
              price: item.totalPrice, 
              items: [{
                name: `${item.glassName} ${item.thickness}mm`,
                meterage: item.area,
                price: item.totalPrice
              }]
            },
            laborCost: 0
          }
        })),
        total: getTotalPrice(),
        createdAt: new Date().toISOString(),
        status: "quotation",
        type: "glass_project"
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
    <Box sx={{ padding: 3, maxWidth: "1400px", margin: "0 auto" }}>      <Typography variant="h4" align="center" sx={{ mb: 3, color: "black" }}>
        <Calculate sx={{ mr: 1, verticalAlign: "middle" }} />
        Calculadora de Vidrios
      </Typography>

      {/* Panel de configuración compacto */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", gap: 3, alignItems: "center", flexWrap: "wrap" }}>
          {/* Dimensiones */}
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Typography variant="body2" sx={{ minWidth: "40px" }}>Alto:</Typography>
            <TextField
              size="small"
              type="number"
              value={dimensions.height}
              onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
              inputProps={{ min: "0", step: "0.1" }}
              sx={{ width: "80px" }}
            />
            <Typography variant="body2">cm</Typography>
          </Box>
          
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Typography variant="body2" sx={{ minWidth: "50px" }}>Ancho:</Typography>
            <TextField
              size="small"
              type="number"
              value={dimensions.width}
              onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
              inputProps={{ min: "0", step: "0.1" }}
              sx={{ width: "80px" }}
            />
            <Typography variant="body2">cm</Typography>
          </Box>

          {/* Tipo de precio */}
          <FormControl component="fieldset">
            <RadioGroup
              row
              value={priceType}
              onChange={(e) => setPriceType(e.target.value)}
              sx={{ gap: 2 }}
            >
              <FormControlLabel 
                value="priceInstalled" 
                control={<Radio size="small" />} 
                label="Instalado"
                sx={{ margin: 0 }}
              />
              <FormControlLabel 
                value="priceCut" 
                control={<Radio size="small" />} 
                label="Corte"
                sx={{ margin: 0 }}
              />
            </RadioGroup>
          </FormControl>

          {/* Área y botón limpiar */}
          <Box sx={{ ml: "auto", display: "flex", gap: 2, alignItems: "center" }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Área: {calculateGlassArea().toFixed(2)} m²
            </Typography>
            <Button
              size="small"
              onClick={clearCalculator}
              startIcon={<Clear />}
              variant="outlined"
            >
              Limpiar Todo
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Tabla de vidrios optimizada */}
      <Paper sx={{ mb: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.50" }}>
                <TableCell><strong>Vidrio</strong></TableCell>
                <TableCell><strong>Grosor</strong></TableCell>
                <TableCell><strong>Precio/m²</strong></TableCell>
                <TableCell><strong>Total</strong></TableCell>
                <TableCell align="center"><strong>Agregar</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {glasses.map((glass) => 
                glass.options.map((option, optionIndex) => {
                  const price = parseFloat(option[priceType]) || 0;
                  const totalPrice = calculateGlassArea() * price;
                  const isValidDimensions = parseFloat(dimensions.height) > 0 && parseFloat(dimensions.width) > 0;
                  
                  return (
                    <TableRow 
                      key={`${glass.id}-${optionIndex}`}
                      hover
                      sx={{ 
                        cursor: isValidDimensions ? "pointer" : "default",
                        bgcolor: !isValidDimensions ? "grey.100" : "inherit",
                        opacity: !isValidDimensions ? 0.6 : 1
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                          {glass.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${option.tickness}mm`} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          ${price.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: "bold",
                            color: isValidDimensions ? "primary.main" : "text.disabled"
                          }}
                        >
                          ${isValidDimensions ? totalPrice.toFixed(2) : "0.00"}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          size="small"
                          disabled={!isValidDimensions}
                          onClick={() => {
                            setSelectedGlass(glass);
                            setSelectedGlassOption(option);
                            addToCalculator();
                          }}
                          sx={{
                            bgcolor: isValidDimensions ? "primary.light" : "grey.300",
                            color: isValidDimensions ? "primary.main" : "grey.500",
                            "&:hover": {
                              bgcolor: isValidDimensions ? "primary.main" : "grey.300",
                              color: isValidDimensions ? "white" : "grey.500"
                            }
                          }}
                        >
                          <Add />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Grid container spacing={3}>

        {/* Panel de resultados optimizado */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ color: "primary.main" }}>
                Cálculos Agregados ({calculatorItems.length})
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  onClick={() => setShowHistoryDialog(true)}
                  startIcon={<History />}
                  variant="outlined"
                >
                  Historial
                </Button>
                {calculatorItems.length > 0 && (
                  <>
                    <Button
                      size="small"
                      onClick={saveToHistory}
                      startIcon={<History />}
                      variant="outlined"
                    >
                      Guardar
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setShowSaveProjectDialog(true)}
                      startIcon={<Save />}
                      variant="contained"
                    >
                      Crear Proyecto
                    </Button>
                  </>
                )}
              </Box>
            </Box>

            {calculatorItems.length === 0 ? (
              <Box sx={{ 
                textAlign: "center", 
                py: 6, 
                bgcolor: "grey.50", 
                borderRadius: 2,
                border: "2px dashed",
                borderColor: "grey.300"
              }}>
                <Typography color="textSecondary" variant="h6">
                  No hay elementos agregados
                </Typography>
                <Typography color="textSecondary" variant="body2" sx={{ mt: 1 }}>
                  Configura las dimensiones arriba y haz clic en + para agregar vidrios
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer sx={{ maxHeight: 300, mb: 2 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Vidrio</strong></TableCell>
                        <TableCell><strong>Dimensiones</strong></TableCell>
                        <TableCell><strong>Área</strong></TableCell>
                        <TableCell><strong>Precio</strong></TableCell>
                        <TableCell align="center"><strong>Eliminar</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {calculatorItems.map((item) => (
                        <TableRow key={item.id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                                {item.glassName}
                              </Typography>
                              <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                                <Chip size="small" label={`${item.thickness}mm`} variant="outlined" />
                                <Chip size="small" label={item.priceType} color="primary" />
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {item.dimensions.height} × {item.dimensions.width} cm
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {item.area.toFixed(2)} m²
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: "bold", color: "primary.main" }}>
                              ${item.totalPrice.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeFromCalculator(item.id)}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Totales destacados */}
                <Paper sx={{ p: 2, bgcolor: "primary.light", color: "primary.contrastText" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography variant="h6">
                        Área Total: {getTotalArea().toFixed(2)} m²
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        {calculatorItems.length} elemento{calculatorItems.length !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                      ${getTotalPrice().toFixed(2)}
                    </Typography>
                  </Box>
                </Paper>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

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
                      <TableCell>${record.totalPrice?.toFixed(2) || 0}</TableCell>
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
