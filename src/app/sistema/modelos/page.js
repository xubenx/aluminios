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
import {
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  Box,
  Typography,
  Fab,
} from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Add } from "@mui/icons-material";

export default function ModelsPage() {
  const [models, setModels] = useState([]);
  const [filteredModels, setFilteredModels] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [currentModel, setCurrentModel] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    manpower: "",
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
    const modelsSnapshot = await getDocs(collection(db, "models"));
    const modelsData = modelsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setModels(modelsData);
    setFilteredModels(modelsData);
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
        manpower: model.manpower,
        imageFile: null,
        previewImage: "",
      });
    } else {
      setFormData({ name: "", manpower: "", imageFile: null, previewImage: "" });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentModel(null);
    setFormData({ name: "", manpower: "", imageFile: null, previewImage: "" });
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.manpower.trim() || isNaN(formData.manpower)) {
      setSnackbar({
        open: true,
        message: "El nombre y la mano de obra son obligatorios y válidos.",
        severity: "error",
      });
      return;
    }
    try {
      let docRef;
      if (currentModel) {
        await updateDoc(doc(db, "models", currentModel.id), {
          name: formData.name,
          manpower: formData.manpower,
        });
        setSnackbar({
          open: true,
          message: "Modelo actualizado correctamente.",
          severity: "success",
        });
        docRef = { id: currentModel.id };
      } else {
        docRef = await addDoc(collection(db, "models"), {
          name: formData.name,
          manpower: formData.manpower,
        });
        setSnackbar({
          open: true,
          message: "Modelo agregado correctamente.",
          severity: "success",
        });
      }

      if (formData.imageFile) {
        console.log("Subir imagen con nombre:", docRef.id);
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
      <Box sx={{ marginBottom: 2 }}>
        <TextField
          fullWidth
          label="Buscar modelos"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Box>

      {/* Grid de Modelos */}
      <Grid container spacing={3}>
        {filteredModels.map((model) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={model.id}>
            <Card sx={{ maxWidth: 345, boxShadow: 3 }}>
              <CardMedia
                component="img"
                height="200"
                image={`/images/${model.id}.png`}
                alt={`Imagen de ${model.name}`}
                onError={(e) => (e.target.style.display = "none")}
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
                <Button
                  color="info"
                  variant="outlined"
                  onClick={() => router.push(`/sistema/modelos/${model.id}`)}
                  sx={{ color: "black", borderColor: "black" }}
                >
                  Ver Detalles
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dialogo para Agregar/Editar Modelo */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{currentModel ? "Editar Modelo" : "Agregar Modelo"}</DialogTitle>
        <DialogContent>
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
          <TextField
            margin="dense"
            name="manpower"
            label="Mano de Obra"
            type="number"
            fullWidth
            value={formData.manpower}
            onChange={handleInputChange}
          />
          <Box sx={{ mt: 2 }}>
            <Button variant="outlined" component="label">
              Seleccionar Imagen
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageFileChange}
              />
            </Button>
            {formData.previewImage && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Preview:</Typography>
                <Box
                  component="img"
                  src={formData.previewImage}
                  alt="Preview"
                  sx={{
                    width: 200,
                    height: 200,
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Guardar
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