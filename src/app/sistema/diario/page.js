"use client";
import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../../../../firebase";
import {  Box,
  Button,
  Typography,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  Paper,
  Fab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel
} from "@mui/material";
import {
  Add,
  Edit,
  AccountBalanceWallet,
  TrendingDown,
  TrendingUp,
  MonetizationOn,
  Receipt,
  FilterList,
  CalendarToday,
  Restore,
  Archive,
  Unarchive
} from "@mui/icons-material";

export default function DiarioContabilidadPage() {  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, gasto, pago
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterSource, setFilterSource] = useState("all"); // all, project, order, diary
  const [showInactive, setShowInactive] = useState(false);
  
  // Estados para CRUD
  const [openDialog, setOpenDialog] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo: "gasto", // gasto o pago
    categoria: "",
    descripcion: "",
    monto: "",
    observaciones: ""
  });
  
  // Categorías predefinidas
  const categoriasGastos = [
    "Gastos de Papelería",
    "Gastos Generales",
    "Maquinaria",
    "Reparaciones",
    "Materiales",
    "Transporte",
    "Servicios Públicos",
    "Herramientas",
    "Mantenimiento",
    "Combustible",
    "Otros"
  ];

  const categoriasPagos = [
    "Pago a Proveedores",
    "Pago de Salarios",
    "Pago de Servicios",
    "Pago de Rentas",
    "Pagos Extras",
    "Bonificaciones",
    "Comisiones",
    "Reembolsos",
    "Anticipos",
    "Otros"
  ];
  
  // Estados para mensajes
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    fetchEntries();
  }, []);
  useEffect(() => {
    let filtered = entries.filter(entry => {
      // Filtrar por búsqueda
      const matchesSearch = entry.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.categoria.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (entry.observaciones && entry.observaciones.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Filtrar por tipo
      const matchesType = filterType === "all" || entry.tipo === filterType;
      
      // Filtrar por categoría
      const matchesCategory = filterCategory === "all" || entry.categoria === filterCategory;
      
      // Filtrar por origen (Proyecto, Órdenes, Manual)
      const src = entry.source || "diary";
      const matchesSource = filterSource === "all" || 
        (filterSource === "project" && (src === "project" || entry.isLegacy)) ||
        (filterSource === "order" && src === "order") ||
        (filterSource === "diary" && (src === "diary" || (!entry.source && !entry.isLegacy)));
      
      // Filtrar por estado activo/inactivo
      const matchesStatus = showInactive ? entry.activo === false : entry.activo !== false;
      
      return matchesSearch && matchesType && matchesCategory && matchesSource && matchesStatus;
    });

    // Ordenar por fecha (más recientes primero)
    const sortedEntries = filtered.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    setFilteredEntries(sortedEntries);
  }, [searchQuery, filterType, filterCategory, filterSource, entries, showInactive]);

  const fetchEntries = async () => {
    try {
      // 1. Entradas del journal (manuales + pagos a colaboradores)
      const journalSnap = await getDocs(collection(db, "journal"));
      const journalEntries = journalSnap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          monto: data.monto ?? data.amount ?? 0,
          source: data.source || "diary"
        };
      });
      // 2. Pagos de proyectos (ingresos) - solo los históricos que NO están ya en journal
      const projectPaymentKeys = new Set(
        journalEntries
          .filter(e => e.source === "project" && e.projectId)
          .map(e => `${e.projectId}|${e.fecha || ""}|${e.monto ?? 0}`)
      );
      const projectsSnap = await getDocs(collection(db, "projects"));
      const projectEntries = [];
      projectsSnap.docs.forEach(projDoc => {
        const p = projDoc.data();
        if (p.status === "inactive" || !p.payments?.length) return;
        (p.payments || []).forEach((pay) => {
          const fecha = (pay.date || "").split("T")[0];
          const monto = pay.amount ?? 0;
          if (projectPaymentKeys.has(`${projDoc.id}|${fecha}|${monto}`)) return; // Ya en journal
          projectEntries.push({
            id: `project_${projDoc.id}_${fecha}_${monto}`,
            fecha,
            tipo: "pago",
            categoria: "Ingresos de Proyectos",
            descripcion: `Pago proyecto: ${p.name || p.projectName || "Proyecto"} - Cliente: ${p.customerName || p.client || ""}`,
            monto: pay.amount ?? 0,
            observaciones: pay.description || pay.method || "",
            activo: true,
            source: "project",
            projectId: projDoc.id,
            projectName: p.name || p.projectName,
            customerName: p.customerName || p.client,
            metodo: pay.method || "efectivo",
            source: "project",
            isLegacy: true
          });
        });
      });
      const combined = [...journalEntries, ...projectEntries];
      setEntries(combined);
    } catch (error) {
      console.error("Error fetching entries: ", error);
      setSnackbar({
        open: true,
        message: "Error al cargar las entradas del diario.",
        severity: "error"
      });
    }
  };

  const handleOpenDialog = (entry = null) => {
    setCurrentEntry(entry);
    if (entry) {
      setFormData({
        fecha: entry.fecha,
        tipo: entry.tipo,
        categoria: entry.categoria,
        descripcion: entry.descripcion,
        monto: entry.monto.toString(),
        observaciones: entry.observaciones || ""
      });
    } else {
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        tipo: "gasto",
        categoria: "",
        descripcion: "",
        monto: "",
        observaciones: ""
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentEntry(null);
  };

  const handleSave = async () => {
    if (!formData.descripcion.trim() || !formData.categoria || !formData.monto) {
      setSnackbar({
        open: true,
        message: "Descripción, categoría y monto son obligatorios.",
        severity: "error"
      });
      return;
    }

    if (parseFloat(formData.monto) <= 0) {
      setSnackbar({
        open: true,
        message: "El monto debe ser mayor a 0.",
        severity: "error"
      });
      return;
    }

    try {
      const entryData = {
        fecha: formData.fecha,
        tipo: formData.tipo,
        categoria: formData.categoria,
        descripcion: formData.descripcion.trim(),
        monto: parseFloat(formData.monto),
        observaciones: formData.observaciones.trim(),
        updatedAt: new Date().toISOString()
      };

      if (currentEntry) {
        await updateDoc(doc(db, "journal", currentEntry.id), entryData);
        setSnackbar({
          open: true,
          message: "Entrada actualizada exitosamente.",
          severity: "success"
        });
      } else {        await addDoc(collection(db, "journal"), {
          ...entryData,
          activo: true,
          createdAt: new Date().toISOString()
        });
        setSnackbar({
          open: true,
          message: "Entrada creada exitosamente.",
          severity: "success"
        });
      }
      
      fetchEntries();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving entry: ", error);
      setSnackbar({
        open: true,
        message: "Error al guardar la entrada.",
        severity: "error"
      });
    }
  };
  const handleDelete = async (entryId) => {
    if (window.confirm("¿Está seguro de que desea desactivar esta entrada?")) {
      try {
        await updateDoc(doc(db, "journal", entryId), {
          activo: false,
          inactivatedAt: new Date().toISOString()
        });
        setSnackbar({
          open: true,
          message: "Entrada desactivada exitosamente.",
          severity: "success"
        });
        fetchEntries();
      } catch (error) {
        console.error("Error deactivating entry: ", error);
        setSnackbar({
          open: true,
          message: "Error al desactivar la entrada.",
          severity: "error"
        });
      }
    }
  };

  const handleReactivate = async (entryId) => {
    if (window.confirm("¿Está seguro de que desea reactivar esta entrada?")) {
      try {
        await updateDoc(doc(db, "journal", entryId), {
          activo: true,
          reactivatedAt: new Date().toISOString()
        });
        setSnackbar({
          open: true,
          message: "Entrada reactivada exitosamente.",
          severity: "success"
        });
        fetchEntries();
      } catch (error) {
        console.error("Error reactivating entry: ", error);
        setSnackbar({
          open: true,
          message: "Error al reactivar la entrada.",
          severity: "error"
        });
      }
    }
  };
  const getTotalGastos = () => {
    return entries.filter(entry => entry.tipo === "gasto" && entry.activo !== false).reduce((total, entry) => total + (entry.monto ?? 0), 0);
  };

  const getTotalPagos = () => {
    return entries.filter(entry => entry.tipo === "pago" && entry.activo !== false).reduce((total, entry) => total + (entry.monto ?? 0), 0);
  };

  const getIngresosProyectos = () => {
    return entries.filter(e => e.tipo === "pago" && (e.source === "project" || e.isLegacy) && e.activo !== false).reduce((s, e) => s + (e.monto ?? 0), 0);
  };
  const getPagosColaboradores = () => {
    return entries.filter(e => e.tipo === "gasto" && e.source === "order" && e.activo !== false).reduce((s, e) => s + (e.monto ?? 0), 0);
  };

  const getBalance = () => {
    return getTotalPagos() - getTotalGastos();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getTypeIcon = (tipo) => {
    return tipo === "gasto" ? <TrendingDown /> : <TrendingUp />;
  };

  const getTypeColor = (tipo) => {
    return tipo === "gasto" ? "error" : "success";
  };

  // Obtener todas las categorías únicas para el filtro
  const getAllCategories = () => {
    const categories = [...new Set(entries.map(entry => entry.categoria))];
    return categories.sort();
  };

  return (
    <Box sx={{ padding: 3, maxWidth: "1400px", margin: "0 auto" }}>
      <Typography variant="h4" align="center" sx={{ mb: 3, color: "black" }}>
        <AccountBalanceWallet sx={{ mr: 1, verticalAlign: "middle" }} />
        Diario de Contabilidad
      </Typography>

      {/* Resumen financiero */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light', color: 'white' }}>
            <TrendingDown sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">Total Gastos</Typography>
            <Typography variant="h4">{formatCurrency(getTotalGastos())}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
            <TrendingUp sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">Total Pagos</Typography>
            <Typography variant="h4">{formatCurrency(getTotalPagos())}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ 
            p: 2, 
            textAlign: 'center', 
            bgcolor: getBalance() >= 0 ? 'primary.main' : 'warning.main', 
            color: 'white' 
          }}>
            <MonetizationOn sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">Balance</Typography>
            <Typography variant="h4">{formatCurrency(getBalance())}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.main', color: 'white' }}>
            <Receipt sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">Entradas Activas</Typography>
            <Typography variant="h4">{entries.filter(e => e.activo !== false).length}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Desglose por origen */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Desglose</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="textSecondary">Ingresos de proyectos (clientes)</Typography>
            <Typography variant="h6" color="success.main">{formatCurrency(getIngresosProyectos())}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="textSecondary">Pagos a colaboradores</Typography>
            <Typography variant="h6" color="error.main">{formatCurrency(getPagosColaboradores())}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="textSecondary">Otros (manual)</Typography>
            <Typography variant="body2">
              Pagos: {formatCurrency(entries.filter(e => e.tipo === "pago" && (!e.source || e.source === "diary") && !e.isLegacy && e.activo !== false).reduce((s, e) => s + (e.monto ?? 0), 0))} |
              Gastos: {formatCurrency(entries.filter(e => e.tipo === "gasto" && (!e.source || e.source === "diary") && e.activo !== false).reduce((s, e) => s + (e.monto ?? 0), 0))}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Filtros y búsqueda */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          label="Buscar entradas"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
        />
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FilterList sx={{ color: 'gray' }} />
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={filterType}
              label="Tipo"
              onChange={(e) => setFilterType(e.target.value)}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="gasto">Gastos</MenuItem>
              <MenuItem value="pago">Pagos</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Categoría</InputLabel>
            <Select
              value={filterCategory}
              label="Categoría"
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <MenuItem value="all">Todas</MenuItem>
              {getAllCategories().map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Origen</InputLabel>
            <Select
              value={filterSource}
              label="Origen"
              onChange={(e) => setFilterSource(e.target.value)}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="project">Ingresos Proyectos</MenuItem>
              <MenuItem value="order">Pagos Colaboradores</MenuItem>
              <MenuItem value="diary">Manual / Otros</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                color="warning"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Archive sx={{ fontSize: 16 }} />
                {showInactive ? 'Entradas Inactivas' : 'Ver Inactivas'}
              </Box>
            }
          />
        </Box>
      </Paper>      {/* Lista de entradas */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Fecha</strong></TableCell>
              <TableCell><strong>Tipo</strong></TableCell>
              <TableCell><strong>Categoría</strong></TableCell>
              <TableCell><strong>Descripción</strong></TableCell>
              <TableCell align="right"><strong>Monto</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEntries.map((entry) => (
              <TableRow 
                key={entry.id} 
                sx={{ 
                  '&:hover': { bgcolor: 'grey.50' },
                  opacity: entry.activo === false ? 0.6 : 1,
                  backgroundColor: entry.activo === false ? 'grey.50' : 'inherit'
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarToday sx={{ mr: 1, fontSize: 16, color: 'gray' }} />
                    {formatDate(entry.fecha)}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getTypeIcon(entry.tipo)}
                    label={entry.tipo === "gasto" ? "Gasto" : "Pago"}
                    color={getTypeColor(entry.tipo)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{entry.categoria}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
                    {entry.source === "project" && (
                      <Chip label="Proyecto" size="small" color="info" variant="outlined" sx={{ height: 20 }} />
                    )}
                    {entry.source === "order" && (
                      <Chip label="Colaborador" size="small" color="warning" variant="outlined" sx={{ height: 20 }} />
                    )}
                    {(!entry.source || entry.source === "diary") && !entry.isLegacy && (
                      <Chip label="Manual" size="small" color="default" variant="outlined" sx={{ height: 20 }} />
                    )}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                    {entry.descripcion}
                  </Typography>
                  {entry.observaciones && (
                    <Typography variant="caption" color="textSecondary" display="block">
                      {entry.observaciones}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Typography
                    variant="h6"
                    sx={{
                      color: entry.tipo === "gasto" ? "error.main" : "success.main",
                      fontWeight: 'bold'
                    }}
                  >
                    {entry.tipo === "gasto" ? "-" : "+"}{formatCurrency(entry.monto)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={entry.activo === false ? "Inactiva" : "Activa"}
                    color={entry.activo === false ? "warning" : "success"}
                    size="small"
                    icon={entry.activo === false ? <Archive /> : <Unarchive />}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {entry.activo !== false && !entry.isLegacy && (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(entry)}
                        title="Editar"
                      >
                        <Edit />
                      </IconButton>
                    )}
                    {entry.activo === false ? (
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleReactivate(entry.id)}
                        title="Reactivar"
                      >
                        <Restore />
                      </IconButton>
                    ) : (
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => handleDelete(entry.id)}
                        title="Desactivar"
                      >
                        <Archive />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredEntries.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="textSecondary">
            {searchQuery || filterType !== "all" || filterCategory !== "all" || filterSource !== "all"
              ? 'No se encontraron entradas con ese criterio' 
              : 'No hay entradas en el diario'}
          </Typography>
        </Box>
      )}

      {/* Botón flotante para agregar */}
      <Fab
        color="primary"
        aria-label="add entry"
        onClick={() => handleOpenDialog()}
        sx={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
        }}
      >
        <Add />
      </Fab>

      {/* Diálogo para CRUD */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentEntry ? "Editar Entrada" : "Nueva Entrada"}
        </DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Fecha"
            type="date"
            fullWidth
            variant="outlined"
            value={formData.fecha}
            onChange={(e) => setFormData({...formData, fecha: e.target.value})}
            sx={{ mb: 2 }}
            InputLabelProps={{
              shrink: true,
            }}
          />

          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={formData.tipo}
              onChange={(e) => setFormData({...formData, tipo: e.target.value, categoria: ""})}
              label="Tipo"
            >
              <MenuItem value="gasto">Gasto</MenuItem>
              <MenuItem value="pago">Pago</MenuItem>
            </Select>
          </FormControl>

          <Autocomplete
            options={formData.tipo === "gasto" ? categoriasGastos : categoriasPagos}
            freeSolo
            value={formData.categoria}
            onChange={(event, newValue) => setFormData({...formData, categoria: newValue || ""})}
            onInputChange={(event, newInputValue) => setFormData({...formData, categoria: newInputValue})}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Categoría"
                variant="outlined"
                sx={{ mb: 2 }}
                helperText="Selecciona una categoría o escribe una nueva"
              />
            )}
          />
          
          <TextField
            margin="dense"
            label="Descripción"
            fullWidth
            variant="outlined"
            value={formData.descripcion}
            onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
            sx={{ mb: 2 }}
            required
          />

          <TextField
            margin="dense"
            label="Monto"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.monto}
            onChange={(e) => setFormData({...formData, monto: e.target.value})}
            sx={{ mb: 2 }}
            inputProps={{ min: "0", step: "0.01" }}
            required
          />
          
          <TextField
            margin="dense"
            label="Observaciones (opcional)"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={formData.observaciones}
            onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            {currentEntry ? "Actualizar" : "Crear"}
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
