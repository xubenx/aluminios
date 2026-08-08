"use client";
import React, { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc, deleteDoc, addDoc } from "firebase/firestore"; // Se agregó `deleteDoc` y `addDoc` porque se usan en el código
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
  Snackbar,
  Alert,
  Fab,
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import CrudStepperDialog from "../components/CrudStepperDialog";
import { Add, Edit, Delete } from "@mui/icons-material";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [models, setModels] = useState([]);
  const [materialUsageCount, setMaterialUsageCount] = useState({});
  const [searchText, setSearchText] = useState("");
  const [colecciones, setColecciones] = useState([]);
  const [selectedColeccionId, setSelectedColeccionId] = useState("");
  const [editingPriceId, setEditingPriceId] = useState(null); // ID del material en edición
  const [editingPriceValue, setEditingPriceValue] = useState(""); // Valor del precio en edición
  const [openDialog, setOpenDialog] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState(null);
  const [formData, setFormData] = useState({ name: "", price: "", stretch: "" });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    fetchMaterials();
    fetchModels();
    fetchColecciones();
  }, []);

  useEffect(() => {
    const selectedColeccion = colecciones.find((c) => c.id === selectedColeccionId);
    const materialIdsInColeccion = selectedColeccion
      ? new Set(selectedColeccion.materialIds || [])
      : null;

    const filtered = materials.filter((material) => {
      const matchesSearch = material.name
        .toLowerCase()
        .includes(searchText.toLowerCase());
      const matchesColeccion =
        !materialIdsInColeccion || materialIdsInColeccion.has(material.id);
      return matchesSearch && matchesColeccion;
    });
    setFilteredMaterials(filtered);
  }, [searchText, materials, selectedColeccionId, colecciones]);

  useEffect(() => {
    calculateMaterialUsage();
  }, [materials, models]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchColecciones = async () => {
    try {
      const snapshot = await getDocs(collection(db, "materialCollections"));
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        name: d.data().name || "",
        materialIds: Array.isArray(d.data().materialIds) ? d.data().materialIds : [],
      }));
      data.sort((a, b) => a.name.localeCompare(b.name, "es"));
      setColecciones(data);
    } catch (error) {
      console.error("Error fetching colecciones de materiales:", error);
    }
  };

  const fetchModels = async () => {
    try {
      const modelsSnapshot = await getDocs(collection(db, "models"));
      const modelsData = modelsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setModels(modelsData);
    } catch (error) {
      console.error("Error fetching models:", error);
    }
  };

  const calculateMaterialUsage = () => {
    const usageCount = {};
    
    // Inicializar contador para todos los materiales
    materials.forEach(material => {
      usageCount[material.id] = 0;
    });

    // Contar en cuántos modelos aparece cada material
    models.forEach(model => {
      if (model.materials && Array.isArray(model.materials)) {
        model.materials.forEach(materialRef => {
          // materialRef puede ser un string (ID) o un objeto con id
          const materialId = typeof materialRef === 'string' ? materialRef : materialRef.id;
          if (materialId && usageCount.hasOwnProperty(materialId)) {
            usageCount[materialId]++;
          }
        });
      }
    });

    setMaterialUsageCount(usageCount);
  };

  const fetchMaterials = async () => {
    const materialsSnapshot = await getDocs(collection(db, "materials"));
    const materialsData = materialsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setMaterials(materialsData);
    setFilteredMaterials(materialsData);
  };

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  const handlePriceDoubleClick = (id, price) => {
    setEditingPriceId(id); // Establece el ID del material en edición
    setEditingPriceValue(price); // Establece el valor actual del precio
  };

  const handlePriceChange = (e) => {
    setEditingPriceValue(e.target.value); // Actualiza el valor del precio en edición
  };

  const handlePriceBlur = async () => {
    if (isNaN(editingPriceValue) || editingPriceValue.trim() === "") {
      setSnackbar({ open: true, message: "El precio debe ser un número válido.", severity: "error" });
      setEditingPriceId(null); // Salir del modo de edición
      return;
    }

    try {
      const materialRef = doc(db, "materials", editingPriceId);
      await updateDoc(materialRef, { price: parseFloat(editingPriceValue) });
      setSnackbar({ open: true, message: "Precio actualizado correctamente.", severity: "success" });
      fetchMaterials(); // Actualiza la lista de materiales
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: "Error al actualizar el precio.", severity: "error" });
    } finally {
      setEditingPriceId(null); // Salir del modo de edición
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleOpenDialog = (material = null) => {
    setCurrentMaterial(material);
    setFormData(
      material || { name: "", price: "", stretch: "6.1" } // Valor por defecto para stretch
    );
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentMaterial(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.price.trim() || isNaN(formData.price) || !formData.stretch.trim() || isNaN(formData.stretch)) {
      setSnackbar({ open: true, message: "Todos los campos son obligatorios y deben ser válidos.", severity: "error" });
      return;
    }

    try {
      if (currentMaterial) {
        await updateDoc(doc(db, "materials", currentMaterial.id), {
          ...formData,
          price: parseFloat(formData.price),
          stretch: parseFloat(formData.stretch),
        });
        setSnackbar({ open: true, message: "Material actualizado correctamente.", severity: "success" });
      } else {
        await addDoc(collection(db, "materials"), {
          ...formData,
          price: parseFloat(formData.price),
          stretch: parseFloat(formData.stretch),
        });
        setSnackbar({ open: true, message: "Material agregado correctamente.", severity: "success" });
      }
      fetchMaterials();
      fetchModels(); // Actualizar modelos también por si hay cambios
      handleCloseDialog();
    } catch (error) {
      console.log(error);
      setSnackbar({ open: true, message: "Error al guardar el material.", severity: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de eliminar este material?")) {
      try {
        await deleteDoc(doc(db, "materials", id));
        setSnackbar({ open: true, message: "Material eliminado correctamente.", severity: "success" });
        fetchMaterials();
        fetchModels(); // Actualizar modelos también
      } catch (error) {
        console.log(error);
        setSnackbar({ open: true, message: "Error al eliminar el material.", severity: "error" });
      }
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: "black" }}>
        Materiales
      </Typography>

      {/* Buscador + filtro por colección */}
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", my: 2 }}>
        <TextField
          sx={{ flex: "1 1 220px" }}
          label="Buscar Material"
          variant="outlined"
          value={searchText}
          onChange={handleSearchChange}
        />
        <FormControl sx={{ flex: "0 1 220px", minWidth: 180 }}>
          <InputLabel id="material-coleccion-filter-label">Colección</InputLabel>
          <Select
            labelId="material-coleccion-filter-label"
            label="Colección"
            value={selectedColeccionId}
            onChange={(e) => setSelectedColeccionId(e.target.value)}
          >
            <MenuItem value="">Todas</MenuItem>
            {colecciones.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name} ({(c.materialIds || []).length})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Tabla */}
      <Paper elevation={3} sx={{ padding: "1rem", marginBottom: "1rem" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Precio</strong></TableCell>
                <TableCell><strong>Longitud</strong></TableCell>
                <TableCell><strong>Usado en Modelos</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMaterials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell>{material.name}</TableCell>
                  <TableCell
                    onDoubleClick={() => handlePriceDoubleClick(material.id, material.price)}
                  >
                    {editingPriceId === material.id ? (
                      <TextField
                        value={editingPriceValue}
                        onChange={handlePriceChange}
                        onBlur={handlePriceBlur}
                        autoFocus
                        size="small"
                      />
                    ) : (
                      `$${material.price}`
                    )}
                  </TableCell>
                  <TableCell>{material.stretch} m</TableCell>
                  <TableCell>
                    <span style={{ 
                      backgroundColor: materialUsageCount[material.id] > 0 ? '#e3f2fd' : '#fff3e0', 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      color: materialUsageCount[material.id] > 0 ? '#1976d2' : '#f57c00',
                      fontWeight: 'bold'
                    }}>
                      {materialUsageCount[material.id] || 0} modelo{materialUsageCount[material.id] !== 1 ? 's' : ''}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      color="azulote"
                      startIcon={<Edit />}
                      onClick={() => handleOpenDialog(material)}
                      sx={{ marginRight: "0.5rem" }}
                    >
                      Editar
                    </Button>
                    <Button
                      color="secondary"
                      startIcon={<Delete />}
                      onClick={() => handleDelete(material.id)}
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Botón flotante */}
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

      {/* Dialog con Stepper */}
      <CrudStepperDialog
        open={openDialog}
        onClose={handleCloseDialog}
        title={currentMaterial ? "Editar Material" : "Agregar Material"}
        steps={[
          {
            label: "Información básica",
            content: (
              <TextField
                autoFocus
                margin="dense"
                name="name"
                label="Nombre"
                type="text"
                fullWidth
                value={formData.name}
                onChange={handleInputChange}
              />
            ),
          },
          {
            label: "Precio y dimensiones",
            content: (
              <>
                <TextField
                  margin="dense"
                  name="price"
                  label="Precio"
                  type="number"
                  fullWidth
                  value={formData.price}
                  onChange={handleInputChange}
                />
                <TextField
                  margin="dense"
                  name="stretch"
                  label="Longitud (m)"
                  type="number"
                  fullWidth
                  value={formData.stretch}
                  onChange={handleInputChange}
                />
              </>
            ),
          },
        ]}
        onSave={handleSave}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}