"use client";
import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../../../firebase";
import { getModelImageURL } from "../../../utils/imageStorage";
import {
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  TextField,
  Snackbar,
  Alert,
  Box,
  Typography,
  Fab,
} from "@mui/material";
import CrudStepperDialog from "../components/CrudStepperDialog";
import { useRouter } from "next/navigation";
import { Add } from "@mui/icons-material";

export default function ModelsPage() {
  const [models, setModels] = useState([]);
  const [filteredModels, setFilteredModels] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [currentModel, setCurrentModel] = useState(null);
  const [modelImageURLs, setModelImageURLs] = useState({}); // URLs de imágenes desde Firebase Storage
  const [formData, setFormData] = useState({
    name: "",
    manpower: "",
    manpowerActual: "",
    m2: 100, // Costo por m² de mano de obra de vidrio
    imageFile: null,
    previewImage: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const router = useRouter();

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    setFilteredModels(
      models.filter((model) =>
        model.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, models]);

  const fetchModels = async () => {
    try {
      const modelsSnapshot = await getDocs(collection(db, "models"));
      const modelsData = modelsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setModels(modelsData);
      setFilteredModels(modelsData);

      // Cargar URLs de imágenes desde Firebase Storage
      const imageURLs = {};
      await Promise.all(
        modelsData.map(async (model) => {
          try {
            const imageURL = await getModelImageURL(model.id);
            if (imageURL) {
              imageURLs[model.id] = imageURL;
            }
          } catch {
            console.log(`No se encontró imagen para el modelo ${model.id}`);
          }
        })
      );
      
      setModelImageURLs(imageURLs);
    } catch (error) {
      console.error("Error fetching models:", error);
      setSnackbar({
        open: true,
        message: "Error al cargar los modelos",
        severity: "error",
      });
    }
  };

  const updateModelsWithoutManpowerActual = async () => {
    try {
      const modelsWithoutManpowerActual = models.filter(
        model => !model.manpowerActual || model.manpowerActual === "" || model.manpowerActual === "0"
      );

      if (modelsWithoutManpowerActual.length === 0) {
        setSnackbar({
          open: true,
          message: "Todos los modelos ya tienen configurada la mano de obra real.",
          severity: "info",
        });
        return;
      }

      // Actualizar cada modelo
      const updatePromises = modelsWithoutManpowerActual.map(model =>
        updateDoc(doc(db, "models", model.id), {
          manpowerActual: 0
        })
      );

      await Promise.all(updatePromises);

      setSnackbar({
        open: true,
        message: `Se actualizaron ${modelsWithoutManpowerActual.length} modelos con mano de obra real = 0`,
        severity: "success",
      });

      // Recargar modelos
      fetchModels();
    } catch (error) {
      console.error("Error updating models:", error);
      setSnackbar({
        open: true,
        message: "Error al actualizar los modelos.",
        severity: "error",
      });
    }
  };

  const updateModelsWithoutM2 = async () => {
    try {
      const modelsWithoutM2 = models.filter(
        model => !model.m2 || model.m2 === "" || model.m2 === 0
      );

      if (modelsWithoutM2.length === 0) {
        setSnackbar({
          open: true,
          message: "Todos los modelos ya tienen configurado el costo por m² de vidrio.",
          severity: "info",
        });
        return;
      }

      // Actualizar cada modelo
      const updatePromises = modelsWithoutM2.map(model =>
        updateDoc(doc(db, "models", model.id), {
          m2: 100
        })
      );

      await Promise.all(updatePromises);

      setSnackbar({
        open: true,
        message: `Se actualizaron ${modelsWithoutM2.length} modelos con costo por m² de vidrio = 100`,
        severity: "success",
      });

      // Recargar modelos
      fetchModels();
    } catch (error) {
      console.error("Error updating models:", error);
      setSnackbar({
        open: true,
        message: "Error al actualizar los modelos.",
        severity: "error",
      });
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({
        ...formData,
        imageFile: file,
        previewImage: URL.createObjectURL(file),
      });
    }
  };

  const handleOpenDialog = (model = null) => {
    setCurrentModel(model);
    if (model) {
      setFormData({
        name: model.name,
        manpower: model.manpower || "",
        manpowerActual: model.manpowerActual || "",
        m2: model.m2 || 100,
        imageFile: null,
        previewImage: "",
      });
    } else {
      setFormData({ name: "", manpower: "", manpowerActual: "", m2: 100, imageFile: null, previewImage: "" });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentModel(null);
    setFormData({ name: "", manpower: "", manpowerActual: "", m2: 100, imageFile: null, previewImage: "" });
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.manpower.trim() || isNaN(formData.manpower)) {
      setSnackbar({
        open: true,
        message: "El nombre y la mano de obra (porcentaje) son obligatorios y válidos.",
        severity: "error",
      });
      return;
    }

    if (formData.manpowerActual && isNaN(formData.manpowerActual)) {
      setSnackbar({
        open: true,
        message: "La mano de obra real debe ser un número válido.",
        severity: "error",
      });
      return;
    }

    if (formData.m2 && isNaN(formData.m2)) {
      setSnackbar({
        open: true,
        message: "El costo por m² de vidrio debe ser un número válido.",
        severity: "error",
      });
      return;
    }

    try {
      let docRef;
      const modelData = {
        name: formData.name,
        manpower: formData.manpower,
        manpowerActual: formData.manpowerActual ? parseInt(formData.manpowerActual) : 0, // Convertir a entero
        m2: formData.m2 ? parseInt(formData.m2) : 100, // Costo por m² de vidrio, default 100
      };

      if (currentModel) {
        await updateDoc(doc(db, "models", currentModel.id), modelData);
        setSnackbar({
          open: true,
          message: "Modelo actualizado correctamente.",
          severity: "success",
        });
        docRef = { id: currentModel.id };
      } else {
        docRef = await addDoc(collection(db, "models"), modelData);
        setSnackbar({
          open: true,
          message: "Modelo agregado correctamente.",
          severity: "success",
        });
      }

      // Subir imagen si se seleccionó una
      if (formData.imageFile) {
        try {
          const imageFormData = new FormData();
          imageFormData.append('file', formData.imageFile);
          imageFormData.append('modelId', docRef.id);

          const uploadResponse = await fetch('/api/upload-image', {
            method: 'POST',
            body: imageFormData,
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload image');
          }

          const uploadResult = await uploadResponse.json();
          console.log("Imagen subida correctamente para modelo:", docRef.id);
          console.log("URL de la imagen:", uploadResult.downloadURL);
          
          // Actualizar el estado con la nueva URL de imagen
          setModelImageURLs(prev => ({
            ...prev,
            [docRef.id]: uploadResult.downloadURL
          }));
          
        } catch (imageError) {
          console.error("Error al subir imagen:", imageError);
          setSnackbar({
            open: true,
            message: "Modelo guardado, pero hubo un error al subir la imagen.",
            severity: "warning",
          });
        }
      }

      fetchModels();
      handleCloseDialog();
    } catch (error) {
      console.log(error);
      setSnackbar({
        open: true,
        message: "Error al guardar el modelo.",
        severity: "error",
      });
    }
  };

  return (
    
    <Box sx={{ padding: 2 }}>
                  <Typography variant="h4" align="center" gutterBottom sx={{ color: "black" }}>
                    Modelos
                  </Typography>
      {/* Searchbox */}
      <Box sx={{ marginBottom: 2, display: "flex", gap: 2, alignItems: "center" }}>
        <TextField
          fullWidth
          label="Buscar modelos"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button
          variant="outlined"
          color="warning"
          onClick={updateModelsWithoutManpowerActual}
          sx={{ minWidth: "200px" }}
        >
          Actualizar Modelos Sin M.O. Real
        </Button>
        <Button
          variant="outlined"
          color="info"
          onClick={updateModelsWithoutM2}
          sx={{ minWidth: "200px" }}
        >
          Actualizar Modelos Sin Costo m² Vidrio
        </Button>
      </Box>

      {/* Grid de Modelos */}
      <Grid container spacing={3}>
        {filteredModels.map((model) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={model.id}>
            <Card sx={{ maxWidth: 345, boxShadow: 3 }}>
              <CardMedia
                component="img"
                height="200"
                image={modelImageURLs[model.id] || '/placeholder-image.png'}
                alt={`Imagen de ${model.name}`}
                onError={(e) => {
                  e.target.src = '/placeholder-image.png';
                  e.target.style.opacity = '0.5';
                }}
                sx={{
                  objectFit: 'cover',
                  backgroundColor: '#f5f5f5'
                }}
              />
              <CardContent>
                <Typography
                  gutterBottom
                  variant="h6"
                  component="div"
                  sx={{ color: "black" }}
                >
                  {model.name}
                </Typography>
                
                {/* Información de mano de obra */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    M.O. Cotización: {model.manpower || "No definido"}%
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color={model.manpowerActual && model.manpowerActual !== "0" ? "success.main" : "warning.main"}
                  >
                    M.O. Real: {model.manpowerActual && model.manpowerActual !== "0" ? `$${model.manpowerActual}` : "No configurado"}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color={model.m2 && model.m2 !== 0 ? "primary.main" : "warning.main"}
                  >
                    Costo m² Vidrio: ${model.m2 || 100}/m²
                  </Typography>
                </Box>
                
                <Button
                  color="info"
                  variant="outlined"
                  onClick={() => router.push(`/sistema/modelos/${model.id}`)}
                  sx={{ color: "black", borderColor: "black", mr: 1 }}
                >
                  Ver Detalles
                </Button>
                
                <Button
                  color="primary"
                  variant="contained"
                  size="small"
                  onClick={() => handleOpenDialog(model)}
                  sx={{ mt: 1 }}
                >
                  Editar
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dialogo para Agregar/Editar Modelo con Stepper */}
      <CrudStepperDialog
        open={openDialog}
        onClose={handleCloseDialog}
        title={currentModel ? `Editar Modelo: ${currentModel.name}` : "Agregar Modelo"}
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
            label: "Mano de obra y costos",
            content: (
              <>
                <TextField
                  margin="dense"
                  name="manpower"
                  label="Mano de Obra (% sobre materiales)"
                  type="number"
                  fullWidth
                  value={formData.manpower}
                  onChange={handleInputChange}
                  helperText="Porcentaje que se aplicará sobre el costo de materiales para la cotización"
                  inputProps={{ step: "0.01", min: "0" }}
                />
                <TextField
                  margin="dense"
                  name="manpowerActual"
                  label="Mano de Obra Real (Costo Fijo - Entero)"
                  type="number"
                  fullWidth
                  value={formData.manpowerActual}
                  onChange={handleInputChange}
                  helperText="Costo real entero que se pagará al trabajador. Ej: 450"
                  inputProps={{ step: "1", min: "0" }}
                  placeholder="0"
                />
                <TextField
                  margin="dense"
                  name="m2"
                  label="Costo por m² de Vidrio (Entero)"
                  type="number"
                  fullWidth
                  value={formData.m2}
                  onChange={handleInputChange}
                  helperText="Costo por metro cuadrado de mano de obra de vidrio. Default: 100"
                  inputProps={{ step: "1", min: "0" }}
                  placeholder="100"
                />
                {currentModel && (
                  <Box sx={{ mt: 2, p: 2, backgroundColor: "grey.100", borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>Valores actuales:</Typography>
                    <Typography variant="body2">• M.O. Cotización: {currentModel.manpower || "No definido"}%</Typography>
                    <Typography variant="body2">• M.O. Real: {currentModel.manpowerActual && currentModel.manpowerActual !== "0" ? `$${currentModel.manpowerActual}` : "No configurado"}</Typography>
                    <Typography variant="body2">• Costo m² Vidrio: ${currentModel.m2 || 100}/m²</Typography>
                  </Box>
                )}
              </>
            ),
          },
          {
            label: "Imagen del modelo",
            content: (
              <Box>
                <Button variant="outlined" component="label">
                  Seleccionar Imagen
                  <input type="file" accept="image/*" hidden onChange={handleImageFileChange} />
                </Button>
                {formData.previewImage && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Preview:</Typography>
                    <Box
                      component="img"
                      src={formData.previewImage}
                      alt="Preview"
                      sx={{ width: 200, height: 200, objectFit: "cover", borderRadius: "8px" }}
                    />
                  </Box>
                )}
              </Box>
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
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Botón flotante para crear modelo */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => handleOpenDialog()}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <Add />
      </Fab>
    </Box>
  );
}