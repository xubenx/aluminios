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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import CrudStepperDialog from "../components/CrudStepperDialog";
import { Add, Edit, Delete } from "@mui/icons-material";
import {
  groupModelsByVariant,
  resolveVariantKey,
} from "../../../utils/variants";
import { useCatalogs } from "../../../contexts/CatalogsContext";

const filterByName = createFilterOptions({
  stringify: (option) => option.name || "",
  ignoreCase: true,
  matchFrom: "any",
  trim: true,
});

export default function ColeccionesPage() {
  const [tab, setTab] = useState(0); // 0 = modelos, 1 = materiales, 2 = equivalencias
  const [modelColecciones, setModelColecciones] = useState([]);
  const [materialColecciones, setMaterialColecciones] = useState([]);
  const [models, setModels] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [currentColeccion, setCurrentColeccion] = useState(null);
  const [formData, setFormData] = useState({ name: "", itemIds: [] });
  // Equivalencias entre lineas
  const [equivDialog, setEquivDialog] = useState({ open: false, variantKey: null });
  const [equivSelection, setEquivSelection] = useState({}); // collectionId -> modelId
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
    setSearchText("");
    handleCloseDialog();
  }, [tab]);

  // Catalogos compartidos: modelos, materiales y colecciones de modelos
  const {
    models: catalogModels,
    materials: catalogMaterials,
    modelCollections: catalogModelCollections,
    refresh: refreshCatalogs,
  } = useCatalogs();

  useEffect(() => {
    const sorted = [...catalogModels].sort((a, b) => (a.name || "").localeCompare(b.name || "", "es"));
    setModels(sorted);
  }, [catalogModels]);

  useEffect(() => {
    const sorted = [...catalogMaterials].sort((a, b) => (a.name || "").localeCompare(b.name || "", "es"));
    setMaterials(sorted);
  }, [catalogMaterials]);

  useEffect(() => {
    const sorted = [...catalogModelCollections].sort((a, b) => a.name.localeCompare(b.name, "es"));
    setModelColecciones(sorted);
  }, [catalogModelCollections]);

  useEffect(() => {
    fetchMaterialCollections();
  }, []);

  const fetchMaterialCollections = async () => {
    try {
      const materialColSnap = await getDocs(collection(db, "materialCollections"));
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
      await fetchMaterialCollections();
      refreshCatalogs();
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
      await fetchMaterialCollections();
      refreshCatalogs();
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

  // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  // EQUIVALENCIAS ENTRE LINEAS (colecciones de modelos)
  // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  const variantGroups = useMemo(() => {
    const grouped = groupModelsByVariant(models);
    const colOfModel = new Map();
    modelColecciones.forEach((col) => {
      (col.modelIds || []).forEach((id) => {
        if (!colOfModel.has(id)) colOfModel.set(id, col.id);
      });
    });
    return [...grouped.entries()].map(([variantKey, list]) => {
      const byCollection = {};
      list.forEach((m) => {
        const cid = colOfModel.get(m.id);
        if (cid && !byCollection[cid]) byCollection[cid] = m;
      });
      return { variantKey, models: list, byCollection };
    });
  }, [models, modelColecciones]);

  const modelsInCollection = (collectionId) => {
    const col = modelColecciones.find((c) => c.id === collectionId);
    const ids = new Set(col?.modelIds || []);
    return models.filter((m) => ids.has(m.id));
  };

  const openEquivDialog = (variantKey = null, byCollection = {}) => {
    const selection = {};
    if (variantKey) {
      Object.entries(byCollection || {}).forEach(([cid, model]) => {
        selection[cid] = model.id;
      });
    }
    setEquivSelection(selection);
    setEquivDialog({ open: true, variantKey });
  };

  const closeEquivDialog = () => {
    setEquivDialog({ open: false, variantKey: null });
    setEquivSelection({});
  };

  const setEquivCell = (collectionId, modelId) => {
    setEquivSelection((prev) => {
      const next = { ...prev };
      if (modelId) next[collectionId] = modelId;
      else delete next[collectionId];
      return next;
    });
  };

  const handleSaveEquivalence = async () => {
    const selectedIds = Object.values(equivSelection).filter(Boolean);
    if (selectedIds.length < 2) {
      setSnackbar({
        open: true,
        message: "Selecciona al menos dos modelos (uno por linea) para enlazarlos.",
        severity: "error",
      });
      return;
    }

    const selectedModels = models.filter((m) => selectedIds.includes(m.id));

    // Un modelo solo puede estar en una equivalencia (no saltar entre grupos).
    const conflict = selectedModels.find(
      (m) => m.variantKey && m.variantKey !== equivDialog.variantKey
    );
    if (conflict) {
      setSnackbar({
        open: true,
        message: `"${conflict.name}" ya pertenece a otra equivalencia. Primero quitalo de esa para poder enlazarlo aqui.`,
        severity: "error",
      });
      return;
    }

    const key = equivDialog.variantKey || resolveVariantKey(selectedModels);

    try {
      const writes = selectedModels.map((m) =>
        updateDoc(doc(db, "models", m.id), { variantKey: key })
      );

      // Al editar, limpiar la clave de los que salieron del grupo.
      if (equivDialog.variantKey) {
        const group = variantGroups.find((g) => g.variantKey === equivDialog.variantKey);
        const removed = (group?.models || []).filter((m) => !selectedIds.includes(m.id));
        removed.forEach((m) => writes.push(updateDoc(doc(db, "models", m.id), { variantKey: "" })));
      }

      await Promise.all(writes);
      await fetchMaterialCollections();
      refreshCatalogs();
      setSnackbar({ open: true, message: "Equivalencia guardada correctamente.", severity: "success" });
      closeEquivDialog();
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: "Error al guardar la equivalencia.", severity: "error" });
    }
  };

  const handleDeleteEquivalence = async (variantKey) => {
    if (!confirm("¿Eliminar esta equivalencia? Los modelos dejaran de estar enlazados.")) return;
    try {
      const group = variantGroups.find((g) => g.variantKey === variantKey);
      await Promise.all(
        (group?.models || []).map((m) => updateDoc(doc(db, "models", m.id), { variantKey: "" }))
      );
      await fetchMaterialCollections();
      refreshCatalogs();
      setSnackbar({ open: true, message: "Equivalencia eliminada.", severity: "success" });
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: "Error al eliminar la equivalencia.", severity: "error" });
    }
  };

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
          <Tab label="Equivalencias" />
        </Tabs>
      </Paper>

      {tab !== 2 && (
        <>
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
        </>
      )}

      {tab === 2 && (
        <Box>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Enlaza el mismo producto entre lineas. Al cotizar podras elegir la linea y
            se usara el modelo equivalente de esa linea.
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => openEquivDialog()}
              disabled={modelColecciones.length === 0 || models.length === 0}
            >
              Nueva equivalencia
            </Button>
          </Box>
          <Paper elevation={3} sx={{ padding: "1rem", overflowX: "auto" }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Producto</strong></TableCell>
                    {modelColecciones.map((col) => (
                      <TableCell key={col.id}><strong>{col.name}</strong></TableCell>
                    ))}
                    <TableCell><strong>Acciones</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {variantGroups.map((group) => (
                    <TableRow key={group.variantKey}>
                      <TableCell>
                        <Chip size="small" color="primary" variant="outlined"
                          label={group.models[0]?.name || "Equivalencia"} />
                      </TableCell>
                      {modelColecciones.map((col) => {
                        const model = group.byCollection[col.id];
                        return (
                          <TableCell key={col.id}>
                            {model ? (
                              <Chip size="small" label={model.name} />
                            ) : (
                              <Typography variant="caption" color="textSecondary">—</Typography>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell>
                        <Button
                          color="azulote"
                          startIcon={<Edit />}
                          onClick={() => openEquivDialog(group.variantKey, group.byCollection)}
                          sx={{ mr: 1 }}
                        >
                          Editar
                        </Button>
                        <Button
                          color="secondary"
                          startIcon={<Delete />}
                          onClick={() => handleDeleteEquivalence(group.variantKey)}
                        >
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {variantGroups.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={modelColecciones.length + 2} align="center">
                        <Typography variant="body2" color="textSecondary" sx={{ py: 3 }}>
                          Aun no hay equivalencias. Crea una con el boton Nueva equivalencia.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}

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

      {/* Dialogo de equivalencias entre lineas */}
      <Dialog open={equivDialog.open} onClose={closeEquivDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {equivDialog.variantKey ? "Editar equivalencia" : "Nueva equivalencia"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            Elige un modelo por cada linea que participa del mismo producto. Deja vacias las lineas que no aplican.
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 2 }}>
            Regla: un modelo solo puede estar en UNA equivalencia y cada linea aporta un solo modelo.
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {modelColecciones.map((col) => {
              const base = modelsInCollection(col.id);
              const selected = base.find((m) => m.id === equivSelection[col.id]) || null;
              const selectedIdSet = new Set(Object.values(equivSelection).filter(Boolean));
              const options = base.filter((m) => {
                if (m.id === selected?.id) return true; // el elegido siempre visible
                const key = m.variantKey;
                if (key && key !== equivDialog.variantKey) return false; // ya en otra equivalencia
                if (selectedIdSet.has(m.id)) return false; // ya elegido en otra linea
                return true;
              });
              const hiddenByLink = base.filter(
                (m) => m.variantKey && m.variantKey !== equivDialog.variantKey
              ).length;
              return (
                <Autocomplete
                  key={col.id}
                  options={options}
                  value={selected}
                  onChange={(_, newValue) => setEquivCell(col.id, newValue ? newValue.id : null)}
                  getOptionLabel={(option) => option.name || ""}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  filterOptions={filterByName}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={col.name}
                      placeholder={options.length ? "Escribe el nombre..." : "Sin modelos disponibles"}
                      helperText={
                        hiddenByLink > 0
                          ? `${hiddenByLink} modelo(s) oculto(s): ya estan en otra equivalencia`
                          : undefined
                      }
                    />
                  )}
                />
              );
            })}
            {modelColecciones.length === 0 && (
              <Typography color="textSecondary">
                Primero crea colecciones de modelos para poder enlazarlas.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEquivDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveEquivalence}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

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
