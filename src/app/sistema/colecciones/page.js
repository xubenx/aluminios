"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
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
  Autocomplete,
  Chip,
  Box,
  Tabs,
  Tab,
  createFilterOptions,
} from "@mui/material";
import CrudStepperDialog from "../components/CrudStepperDialog";
import { Add, Edit, Delete } from "@mui/icons-material";

const filterByName = createFilterOptions({
  stringify: (option) => option.name || "",
  ignoreCase: true,
  matchFrom: "any",
  trim: true,
});

export default function ColeccionesPage() {
  const [tab, setTab] = useState(0); // 0 = modelos, 1 = materiales
  const [modelColecciones, setModelColecciones] = useState([]);
  const [materialColecciones, setMaterialColecciones] = useState([]);
  const [models, setModels] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [currentColeccion, setCurrentColeccion] = useState(null);
  const [formData, setFormData] = useState({ name: "", itemIds: [] });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const isModelos = tab === 0;
  const firestoreCollection = isModelos ? "modelCollections" : "materialCollections";
  const itemIdsKey = isModelos ? "modelIds" : "materialIds";
  const items = isModelos ? models : materials;
  const colecciones = isModelos ? modelColecciones : materialColecciones;

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    setSearchText("");
    handleCloseDialog();
  }, [tab]);

  const fetchAll = async () => {
    try {
      const [modelsSnap, materialsSnap, modelColSnap, materialColSnap] =
        await Promise.all([
          getDocs(collection(db, "models")),
          getDocs(collection(db, "materials")),
          getDocs(collection(db, "modelCollections")),
          getDocs(collection(db, "materialCollections")),
        ]);

      const modelsData = modelsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      modelsData.sort((a, b) => (a.name || "").localeCompare(b.name || "", "es"));
      setModels(modelsData);

      const materialsData = materialsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      materialsData.sort((a, b) => (a.name || "").localeCompare(b.name || "", "es"));
      setMaterials(materialsData);

      const modelCols = modelColSnap.docs.map((d) => ({
        id: d.id,
        name: d.data().name || "",
        modelIds: Array.isArray(d.data().modelIds) ? d.data().modelIds : [],
      }));
      modelCols.sort((a, b) => a.name.localeCompare(b.name, "es"));
      setModelColecciones(modelCols);

      const materialCols = materialColSnap.docs.map((d) => ({
        id: d.id,
        name: d.data().name || "",
        materialIds: Array.isArray(d.data().materialIds) ? d.data().materialIds : [],
      }));
      materialCols.sort((a, b) => a.name.localeCompare(b.name, "es"));
      setMaterialColecciones(materialCols);
    } catch (error) {
      console.error(error);
      setSnackbar({
        open: true,
        message: "Error al cargar colecciones.",
        severity: "error",
      });
    }
  };

  const filteredColecciones = useMemo(() => {
    return colecciones.filter((c) =>
      c.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [colecciones, searchText]);

  const getItemName = (id) => {
    const item = items.find((m) => m.id === id);
    return item?.name || id;
  };

  const getItemIds = (coleccion) =>
    Array.isArray(coleccion?.[itemIdsKey]) ? coleccion[itemIdsKey] : [];

  const handleOpenDialog = (coleccion = null) => {
    setCurrentColeccion(coleccion);
    if (coleccion) {
      setFormData({
        name: coleccion.name || "",
        itemIds: [...getItemIds(coleccion)],
      });
    } else {
      setFormData({ name: "", itemIds: [] });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentColeccion(null);
    setFormData({ name: "", itemIds: [] });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setSnackbar({
        open: true,
        message: "El nombre de la colección es obligatorio.",
        severity: "error",
      });
      return;
    }

    const payload = {
      name: formData.name.trim(),
      [itemIdsKey]: formData.itemIds,
    };

    try {
      if (currentColeccion) {
        await updateDoc(doc(db, firestoreCollection, currentColeccion.id), payload);
        setSnackbar({
          open: true,
          message: "Colección actualizada correctamente.",
          severity: "success",
        });
      } else {
        await addDoc(collection(db, firestoreCollection), payload);
        setSnackbar({
          open: true,
          message: "Colección creada correctamente.",
          severity: "success",
        });
      }
      await fetchAll();
      handleCloseDialog();
    } catch (error) {
      console.error(error);
      setSnackbar({
        open: true,
        message: "Error al guardar la colección.",
        severity: "error",
      });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar esta colección?")) return;
    try {
      await deleteDoc(doc(db, firestoreCollection, id));
      setSnackbar({
        open: true,
        message: "Colección eliminada correctamente.",
        severity: "success",
      });
      await fetchAll();
    } catch (error) {
      console.error(error);
      setSnackbar({
        open: true,
        message: "Error al eliminar la colección.",
        severity: "error",
      });
    }
  };

  const selectedItems = items.filter((m) => formData.itemIds.includes(m.id));
  const itemLabel = isModelos ? "modelo" : "material";
  const itemLabelPlural = isModelos ? "modelos" : "materiales";

  return (
    <div style={{ padding: "1rem" }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: "black" }}>
        Colecciones
      </Typography>
      <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 2 }}>
        Agrupa modelos o materiales por línea para filtrarlos más rápido.
      </Typography>

      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Modelos" />
          <Tab label="Materiales" />
        </Tabs>
      </Paper>

      <TextField
        fullWidth
        label={`Buscar colección de ${itemLabelPlural}`}
        variant="outlined"
        margin="normal"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />

      <Paper elevation={3} sx={{ padding: "1rem", marginBottom: "1rem" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Nombre</strong>
                </TableCell>
                <TableCell>
                  <strong>{isModelos ? "Modelos" : "Materiales"}</strong>
                </TableCell>
                <TableCell>
                  <strong>Acciones</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredColecciones.map((coleccion) => {
                const ids = getItemIds(coleccion);
                return (
                  <TableRow key={coleccion.id}>
                    <TableCell>{coleccion.name}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {ids.length === 0 ? (
                          <Typography variant="body2" color="textSecondary">
                            Sin {itemLabelPlural}
                          </Typography>
                        ) : (
                          <>
                            <Chip
                              size="small"
                              label={`${ids.length} ${itemLabel}${ids.length !== 1 ? "s" : ""}`}
                              color="primary"
                              variant="outlined"
                            />
                            {ids.slice(0, 4).map((id) => (
                              <Chip
                                key={id}
                                size="small"
                                label={getItemName(id)}
                                variant="outlined"
                              />
                            ))}
                            {ids.length > 4 && (
                              <Chip size="small" label={`+${ids.length - 4} más`} />
                            )}
                          </>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Button
                        color="azulote"
                        startIcon={<Edit />}
                        onClick={() => handleOpenDialog(coleccion)}
                        sx={{ marginRight: "0.5rem" }}
                      >
                        Editar
                      </Button>
                      <Button
                        color="secondary"
                        startIcon={<Delete />}
                        onClick={() => handleDelete(coleccion.id)}
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredColecciones.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No hay colecciones de {itemLabelPlural}. Crea una con el botón +.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Fab
        color="primary"
        aria-label="add"
        onClick={() => handleOpenDialog()}
        sx={{ position: "fixed", bottom: "2rem", right: "2rem" }}
      >
        <Add />
      </Fab>

      <CrudStepperDialog
        open={openDialog}
        onClose={handleCloseDialog}
        title={
          currentColeccion
            ? `Editar colección de ${itemLabelPlural}`
            : `Agregar colección de ${itemLabelPlural}`
        }
        steps={[
          {
            label: "Nombre",
            content: (
              <TextField
                autoFocus
                margin="dense"
                name="name"
                label="Nombre de la colección"
                type="text"
                fullWidth
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ej: Línea 2, Corredizas, Perfiles base"
                helperText={`Nombre corto para filtrar ${itemLabelPlural}`}
              />
            ),
          },
          {
            label: isModelos ? "Modelos" : "Materiales",
            content: (
              <Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1.5 }}>
                  Escribe el nombre del {itemLabel} para encontrarlo sin hacer scroll.
                </Typography>
                <Autocomplete
                  multiple
                  options={items}
                  filterOptions={filterByName}
                  filterSelectedOptions
                  autoHighlight
                  openOnFocus
                  getOptionLabel={(option) => option.name || ""}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  value={selectedItems}
                  onChange={(_, newValue) =>
                    setFormData({
                      ...formData,
                      itemIds: newValue.map((m) => m.id),
                    })
                  }
                  ListboxProps={{
                    style: { maxHeight: 280 },
                  }}
                  noOptionsText={`No se encontró ningún ${itemLabel}`}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      autoFocus
                      label={`Buscar y agregar ${itemLabelPlural}`}
                      placeholder={`Escribe el nombre del ${itemLabel}...`}
                      helperText={`Selecciona los ${itemLabelPlural} que pertenecen a esta colección`}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={option.id}
                        label={option.name}
                        size="small"
                      />
                    ))
                  }
                />
              </Box>
            ),
          },
        ]}
        onSave={handleSave}
      />

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
    </div>
  );
}
