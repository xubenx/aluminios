"use client";
import React, { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs
} from "firebase/firestore";
import { db } from "../../../../../firebase";
import { getModelImageURL } from "../../../../utils/imageStorage";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Box,
  Typography,
  Snackbar,
  Alert,
  Autocomplete
} from "@mui/material";
import Image from "next/image";
import { Delete, Edit, AddPhotoAlternate } from "@mui/icons-material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter } from "next/navigation";
import { evaluate } from "mathjs";
// Importamos los diálogos desde ModelDialogs.js
import {
  ConfirmDeleteDialog,
  ConfirmUpdateModelDialog,
  ConfirmUpdateSectionDialog,
  ConfirmDeleteItemDialog,
  ChangeImageDialog,
  EditElementDialog,
} from "./ModelDialogs";

export default function ModelDetailsPage({ params }) {
  // Estados principales
  const [id, setId] = useState(null);
  const [model, setModel] = useState(null);
  const [modelImageURL, setModelImageURL] = useState(null); // URL de imagen desde Firebase Storage
  const [openDialog, setOpenDialog] = useState(false);
  const [currentSection, setCurrentSection] = useState("");
  const [formData, setFormData] = useState({ id: "", formula: "", amount: "" });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  // Dimensiones locales (solo a nivel cliente, no se guardan en Firebase)
  const [dimensions, setDimensions] = useState({ height: "1", width: "1" });
  // Estados para confirmaciones
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmUpdateModel, setConfirmUpdateModel] = useState(false);
  const [confirmUpdateSection, setConfirmUpdateSection] = useState(false);
  const [deleteItemConfirmation, setDeleteItemConfirmation] = useState({ open: false, section: "", index: null });
  const [changeImageDialog, setChangeImageDialog] = useState(false);
  // Estados para el cambio de imagen
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  // Opciones para Autocomplete (para materials y chapes)
  const [materialsOptions, setMaterialsOptions] = useState([]);
  const [chapesOptions, setChapesOptions] = useState([]);
  const [glassesOptions, setGlassesOptions] = useState([]);
  // Nuevo estado para la selección de vidrio (combobox independiente)
  const [selectedGlass, setSelectedGlass] = useState(null);
  const [buffm2, setBuffm2] = useState("100");

  const router = useRouter();

  useEffect(() => {
    async function unwrapParams() {
      const unwrappedParams = await params;
      setId(unwrappedParams.id);
    }
    unwrapParams();
  }, [params]);

  useEffect(() => {
    const fetchModel = async () => {
      const modelDoc = await getDoc(doc(db, "models", id));
      if (modelDoc.exists()) {
        const data = modelDoc.data();

        const resolveNames = async (items, collectionName) => {
          return await Promise.all(
            items.map(async (item) => {
              if (!item.id) {
                console.warn(`El elemento no tiene un ID válido en la colección ${collectionName}:`, item);
                return item;
              }
              try {
                const itemDoc = await getDoc(doc(db, collectionName, item.id));
                return itemDoc.exists()
                  ? { ...item, name: itemDoc.data().name }
                  : item;
              } catch (error) {
                console.error(`Error al obtener el documento ${item.id} de la colección ${collectionName}:`, error);
                return item;
              }
            })
          );
        };

        const materials = data.materials ? await resolveNames(data.materials, "materials") : [];
        const chapes = data.chapes ? await resolveNames(data.chapes, "chapes") : [];
        const glasses = data.glasses ? await resolveNames(data.glasses, "glasses") : [];

        setModel({
          id: modelDoc.id,
          ...data,
          materials,
          chapes,
          glasses,
        });

        // Cargar imagen desde Firebase Storage
        try {
          const imageURL = await getModelImageURL(id);
          setModelImageURL(imageURL);
        } catch {
          console.log(`No se encontró imagen para el modelo ${id}`);
          setModelImageURL(null);
        }
      } else {
        setModel(null);
      }
    };

    if (id) fetchModel();
  }, [id]);



  // Evalúa la fórmula con mathjs, usando las variables que se le pasen
  const calculatePrice = (formula, variables) => {
    try {
      const result = evaluate(formula, variables);
      // Asegurar que el resultado sea un número válido
      const numericResult = parseFloat(result);
      return isNaN(numericResult) ? 0 : numericResult;
    } catch (error) {
      console.error("Error al calcular la fórmula:", error);
      return 0;
    }
  };

  // Obtiene los datos del modelo; en el objeto model se esperan arrays con objetos que tienen al menos id y formula
  
  // Obtiene las opciones para cada colección.
  useEffect(() => {
    async function fetchOptions() {
      try {
        const materialsSnap = await getDocs(collection(db, "materials"));
        setMaterialsOptions(
          materialsSnap.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            price: doc.data().price,   // Campo con el precio (puede ser string o número)
            tramo: doc.data().stretch    // TRAMO para materiales
          }))
        );
        const chapesSnap = await getDocs(collection(db, "chapes"));
        setChapesOptions(
          chapesSnap.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            price: doc.data().price
          }))
        );
        const glassesSnap = await getDocs(collection(db, "glasses"));
        // Para vidrio se mapea las opciones tomando el campo priceInstalled de cada opción dentro de "options"
        setGlassesOptions(
          glassesSnap.docs.flatMap(doc => {
            const data = doc.data();
            return data.options.map(option => ({
              id: doc.id,
              name: `${data.name} ${option.tickness}mm`,
              tickness: option.tickness,
              priceInstalled: option.priceInstalled,
            }));
          })
        );
      } catch (error) {
        console.error("Error fetching options: ", error);
      }
    }
    fetchOptions();
  }, []);

  const handleInputChange = (e) => {
    setModel({ ...model, [e.target.name]: e.target.value });
  };

  // Guarda cambios en el modelo (solo se actualiza nombre y mano de obra)
  const handleSaveModelConfirmed = async () => {
    try {
      await updateDoc(doc(db, "models", id), {
        name: model.name,
        manpower: model.manpower,
      });
      setSnackbar({ open: true, message: "Modelo actualizado correctamente.", severity: "success" });
    } catch (error) {
      console.log(error);
      setSnackbar({ open: true, message: "Error al actualizar el modelo.", severity: "error" });
    }
  };

  const handleSaveModel = () => {
    if (!model.name.trim() || !model.manpower.toString().trim() || isNaN(model.manpower)) {
      setSnackbar({ open: true, message: "El nombre y la mano de obra son obligatorios y válidos.", severity: "error" });
      return;
    }
    setConfirmUpdateModel(true);
  };

  const handleDeleteModel = async () => {
    try {
      await deleteDoc(doc(db, "models", id));
      setSnackbar({ open: true, message: "Modelo eliminado correctamente.", severity: "success" });
      setConfirmDelete(false);
      router.push("/sistema/modelos");
    } catch (error) {
      console.log(error);
      setSnackbar({ open: true, message: "Error al eliminar el modelo.", severity: "error" });
    }
  };
  const handleDecimalInput = (value) => {
    // Permitir solo números decimales válidos
    const formattedValue = value
      .replace(/[^0-9.]/g, "") // Eliminar caracteres no numéricos excepto el punto
      .replace(/(\..*?)\..*/g, "$1"); // Permitir solo un punto decimal
  
    // Si el valor comienza con un punto, agregar un 0 al inicio (e.g., ".45" -> "0.45")
    if (formattedValue.startsWith(".")) {
      return "0" + formattedValue;
    }
  
    return formattedValue;
  };

  const handleChangeImage = () => {
    setChangeImageDialog(true);
  };

  const handleImageFileChange = (file) => {
    setImageFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleConfirmImageChange = async () => {
    if (!imageFile) {
      setSnackbar({ open: true, message: "Por favor selecciona una imagen.", severity: "error" });
      return;
    }

    try {
      // Subir la nueva imagen a Firebase Storage
      const imageFormData = new FormData();
      imageFormData.append('file', imageFile);
      imageFormData.append('modelId', id);

      const uploadResponse = await fetch('/api/upload-image', {
        method: 'POST',
        body: imageFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const uploadResult = await uploadResponse.json();
      
      setSnackbar({ 
        open: true, 
        message: "Imagen cambiada correctamente.", 
        severity: "success" 
      });
      
      // Actualizar la URL de la imagen en el estado
      setModelImageURL(uploadResult.downloadURL);
      
      // Limpiar estados
      setChangeImageDialog(false);
      setImageFile(null);
      setPreviewImage("");
      
      // Actualizar timestamp para forzar recarga de la imagen
      setImageTimestamp(Date.now());
      
    } catch (error) {
      console.error("Error al cambiar imagen:", error);
      setSnackbar({ 
        open: true, 
        message: "Error al cambiar la imagen.", 
        severity: "error" 
      });
    }
  };

  const handleCancelImageChange = () => {
    setChangeImageDialog(false);
    setImageFile(null);
    setPreviewImage("");
  };

  // Para abrir el diálogo de edición/creación:
  // Para "materials" y "chapes" se usa Autocomplete y se guardará el id junto con la fórmula,
  // para "glasses" solo se guarda la fórmula (ya que la selección se hace en un combobox independiente).
  const handleOpenDialog = (section, item = null) => {
    setCurrentSection(section);
    if (section === "glasses") {
      setFormData(item || { id: "", formula: "", name: "Vidrio" });
    } else {
      setFormData(item || { id: "", formula: "", name: "" });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ id: "", formula: "", amount: "" });
  };

  // Al guardar un elemento, se procesa la fórmula para materiales y chapes.
  const handleSaveSectionConfirmed = async () => {
    if (!formData.formula.trim()) {      setSnackbar({ open: true, message: "La fórmula es obligatoria.", severity: "error" });
      return;
    }
    
    try {      const updatedSection = [...(model[currentSection] || [])];
      if (formData.index !== undefined) {
        updatedSection[formData.index] = { id: formData.id, formula: formData.formula, name: formData.name };
      } else {
        updatedSection.push({ id: formData.id, formula: formData.formula, name: formData.name });
      }
      await updateDoc(doc(db, "models", id), { [currentSection]: updatedSection });
      setModel({ ...model, [currentSection]: updatedSection });
      setSnackbar({ open: true, message: "Elemento guardado correctamente.", severity: "success" });
      handleCloseDialog();
    } catch (error) {
      console.log(error);

      setSnackbar({ open: true, message: "Error al guardar el elemento.", severity: "error" });
    }
  };

  const handleSaveSection = () => {
    setConfirmUpdateSection(true);
  };

  const handleDelete = async (section, index) => {
    try {
      const updatedSection = [...(model[section] || [])];
      updatedSection.splice(index, 1);
      await updateDoc(doc(db, "models", id), { [section]: updatedSection });
      setModel({ ...model, [section]: updatedSection });
      setSnackbar({ open: true, message: "Elemento eliminado correctamente.", severity: "success" });
    } catch (error) {
      console.log(error);

      setSnackbar({ open: true, message: "Error al eliminar el elemento.", severity: "error" });
    }
  };

  // Si el modelo aún no ha sido obtenido, se muestra un mensaje
  if (!model) {
    return <div>Modelo no encontrado</div>;
  }

  // Para materials y chapes se usa Autocomplete; para glasses, la selección se maneja de forma independiente.
  const getOptionsForSection = () => {
    if (currentSection === "materials") return materialsOptions || [];
    if (currentSection === "chapes") return chapesOptions || [];
    if (currentSection === "glasses") return glassesOptions || [];
    return [];
  };
  const options = getOptionsForSection();
  const selectedOption = options.find(option => option.id === formData.id) || null;
  // --- Cálculos de precios y cantidades ---

  // MATERIALS: Se consulta el precio y TRAMO de la colección de materiales para cada material.
  const totalMaterialsData = model.materials.reduce((acc, material) => {
    const materialData = materialsOptions.find((m) => m.id === material.id);
    const currentPrice = materialData ? parseFloat(materialData.price || "0") : 0;
    const tramo = materialData ? parseFloat(materialData.stretch || "6.1") : 6.1;
  
    const meterage = calculatePrice(material.formula, {
      PRECIO: 1,
      ALTO: dimensions.height,
      ANCHO: dimensions.width,
      TRAMO: tramo,
    });
  
    const price = calculatePrice(material.formula, {
      PRECIO: currentPrice,
      ALTO: dimensions.height,
      ANCHO: dimensions.width,
      TRAMO: tramo,
    });
  
    console.log("Material:", material.name);
    console.log("Meterage:", meterage);
    console.log("Price:", price);
  
    return {
      price: acc.price + price,
      meterage: acc.meterage + meterage,
    };
  }, { price: 0, meterage: 0 });
  
  console.log("Cálculos de materiales (totalMaterialsData):", totalMaterialsData);

  // CHAPES: Se consulta el precio a partir de la colección de chapes.
  const totalChapesData = model.chapes.reduce((acc, chape) => {
    const chapeData = chapesOptions.find(c => c.id === chape.id);
    const currentPrice = chapeData ? parseFloat(chapeData.price || "0") : 0;
    const pieces = calculatePrice(chape.formula, {
      PRECIO: 1,
      ALTO: dimensions.height,
      ANCHO: dimensions.width,
      TRAMO: 1,
    });
    const price = calculatePrice(chape.formula, {
      PRECIO: currentPrice,
      ALTO: dimensions.height,
      ANCHO: dimensions.width,
      TRAMO: 1,
    });
    return {
      price: acc.price + price,
      pieces: acc.pieces + pieces,
    };
  }, { price: 0, pieces: 0 });
// Calcular el metraje total de los vidrios
const totalGlassMeterage = model.glasses.reduce((acc, glass) => {
  const meterage = calculatePrice(glass.formula, {
    PRECIO: 1,
    ALTO: dimensions.height,
    ANCHO: dimensions.width,
  });
  return acc + meterage;
}, 0);
  // VIDRIOS: Se evalúa la fórmula del vidrio almacenado en el modelo para obtener el metraje.
  // El precio se calcula usando el campo priceInstalled del vidrio seleccionado (del combobox independiente).
  const totalGlassesData = model.glasses.reduce((acc, glass) => {
    const meterage = calculatePrice(glass.formula, {
      PRECIO: 1,
      ALTO: dimensions.height,
      ANCHO: dimensions.width,
    });
    const glassPrice = selectedGlass ? parseFloat(selectedGlass.priceInstalled || "0") : 0;
    const price = meterage * glassPrice;
    return {
      price: acc.price + price,
      meterage: acc.meterage + meterage,
    };
  }, { price: 0, meterage: 0 });

  // Costo de mano de obra: se multiplica el valor numérico de "manpower" por el total de metraje de materiales.
  const laborCost = parseFloat(model.manpower || "0") * totalMaterialsData.price;
  const totalGeneral = totalMaterialsData.price + totalChapesData.price + totalGlassesData.price + laborCost;

  return (
    
    <Box sx={{ padding: 2, backgroundColor: "#ffffff", margin: "0 auto", maxWidth: "1200px" }}>
      {/* Combobox independiente para seleccionar vidrio */}

      
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" align="center" sx={{ color: "black", mb: 1 }}>
          Seleccionar Vidrio
        </Typography>
        <Autocomplete
          options={glassesOptions}
          getOptionLabel={(option) => option.name || ""}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
          value={selectedGlass}
          onChange={(event, newValue) => setSelectedGlass(newValue)}
          renderInput={(params) => <TextField {...params} label="Vidrio" variant="outlined" />}
        />
      </Box>

      {/* Botón para retroceder */}
      <Box sx={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push("/sistema/modelos")}>
          Volver
        </Button>
      </Box>

      <Typography variant="h4" align="center" sx={{ color: "black", mb: 3 }}>
        Detalles del Modelo
      </Typography>

      {/* Imagen y botones */}
      <Box sx={{ textAlign: "center", position: "relative", mb: 4 }}>
        <Button
          variant="contained"
          color="error"
          startIcon={<Delete />}
          sx={{ position: "absolute", top: 16, right: 16 }}
          onClick={() => setConfirmDelete(true)}
        >
          Eliminar Modelo
        </Button>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: { xs: "300px", sm: "400px", md: "500px" }, mb: 2 }}>
          <Image
            src={modelImageURL || '/placeholder-image.png'}
            alt={`Imagen de ${model.name}`}
            width={500}
            height={500}
            style={{ 
              objectFit: "cover", 
              borderRadius: "16px",
              opacity: modelImageURL ? 1 : 0.5
            }}
            onError={(e) => {
              e.target.src = '/placeholder-image.png';
              e.target.style.opacity = '0.5';
            }}
          />
        </Box>
        <Button  variant="contained" color="azulote" startIcon={<AddPhotoAlternate />} onClick={handleChangeImage}>
          Cambiar Imagen
        </Button>
      </Box>

      {/* Campos Editables del Modelo */}
      <Box sx={{ mb: 3 }}>
        <TextField fullWidth label="Nombre del Modelo" name="name" value={model.name} onChange={handleInputChange} sx={{ mb: 2 }} />
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
  <TextField
    fullWidth
    label="Mano de Obra"
    name="manpower"
    type="text"
    value={model.manpower}
    onChange={(e) =>
      setModel({
        ...model,
        manpower: handleDecimalInput(e.target.value),
      })
    }
    sx={{ mb: 2 }}
  />

  <TextField
    fullWidth
    label="m2"
    type="text"
    value={buffm2}
    onChange={(e) => setBuffm2(handleDecimalInput(e.target.value))}
  />
</Box>

<Box sx={{ display: "flex", gap: 2, mb: 2 }}>
  <TextField
    fullWidth
    label="Alto"
    type="text"
    value={dimensions.height}
    onChange={(e) =>
      setDimensions({
        ...dimensions,
        height: handleDecimalInput(e.target.value),
      })
    }
  />
  <TextField
    fullWidth
    label="Ancho"
    type="text"
    value={dimensions.width}
    onChange={(e) =>
      setDimensions({
        ...dimensions,
        width: handleDecimalInput(e.target.value),
      })
    }
  />
</Box>
        <Button variant="contained" color="primary" onClick={handleSaveModel} sx={{ mt: 2 }}>
          Guardar Cambios
        </Button>
      </Box>

      {/* Sección para Materiales */}
      <Typography variant="h4" sx={{ mb: 1, color: "black", mt: 10 }}>
        Materiales
      </Typography>
      <TableContainer sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Fórmula</TableCell>
              <TableCell>Metraje</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {model.materials.map((material, index) => {
              const materialData = materialsOptions.find(m => m.id === material.id);
              const currentPrice = materialData ? parseFloat(materialData.price || "0") : 0;
              const tramo = materialData ? parseFloat(materialData.stretch || "6.1") : 6.1;
              const meterage = calculatePrice(material.formula, {
                PRECIO: 1,
                ALTO: dimensions.height,
                ANCHO: dimensions.width,
                TRAMO: 1,
              });
              const price = calculatePrice(material.formula, {
                PRECIO: currentPrice,
                ALTO: dimensions.height,
                ANCHO: dimensions.width,
                TRAMO: tramo,
              });
              // Asegurar que meterage sea un número válido
              const safeMeterage = isNaN(meterage) ? 0 : meterage;
              const safePrice = isNaN(price) ? 0 : price;
              return (
                <TableRow key={index}>
                  <TableCell>{material.name}</TableCell>
                  <TableCell>{material.formula}</TableCell>
                  <TableCell>{safeMeterage.toFixed(2)} mts</TableCell>
                  <TableCell>${safePrice.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button color="azulote" startIcon={<Edit />} onClick={() => handleOpenDialog("materials", { ...material, index })}>
                      Editar
                    </Button>
                    <Button color="secondary" startIcon={<Delete />} onClick={() => setDeleteItemConfirmation({ open: true, section: "materials", index })}>
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="h6" align="right" sx={{ mt: 4, color: "black" }}>
        Total Materiales: ${totalMaterialsData.price.toFixed(2)}
      </Typography>
      <Button variant="contained" color="primary" startIcon={<Edit />} onClick={() => handleOpenDialog("materials")} sx={{ mb: 3 }}>
        Agregar Material
      </Button>

      {/* Sección para Herrajes */}
      <Typography variant="h4" sx={{ mb: 1, color: "black" }}>
        Herrajes
      </Typography>
      <TableContainer sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Fórmula</TableCell>
              <TableCell>Piezas</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {model.chapes.map((chape, index) => {
              const chapeData = chapesOptions.find(c => c.id === chape.id);
              const currentPrice = chapeData ? parseFloat(chapeData.price || "0") : 0;
              const pieces = calculatePrice(chape.formula, {
                PRECIO: 1,
                ALTO: dimensions.height,
                ANCHO: dimensions.width,
                TRAMO: 1,
              });
              const price = calculatePrice(chape.formula, {
                PRECIO: currentPrice,
                ALTO: dimensions.height,
                ANCHO: dimensions.width,
                TRAMO: 1,
              });
              return (
                <TableRow key={index}>
                  <TableCell>{chape.name}</TableCell>
                  <TableCell>{chape.formula}</TableCell>
                  <TableCell>{pieces.toFixed(2)} pcs</TableCell>
                  <TableCell>${price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button color="azulote" startIcon={<Edit />} onClick={() => handleOpenDialog("chapes", { ...chape, index })}>
                      Editar
                    </Button>
                    <Button color="secondary" startIcon={<Delete />} onClick={() => setDeleteItemConfirmation({ open: true, section: "chapes", index })}>
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="h6" align="right" sx={{ mt: 4, color: "black" }}>
        Total Herrajes: ${totalChapesData.price.toFixed(2)}
      </Typography>
      <Button variant="contained" color="primary" startIcon={<Edit />} onClick={() => handleOpenDialog("chapes")} sx={{ mb: 3 }}>
        Agregar Herraje
      </Button>

      {/* Sección para Vidrios */}
      <Typography variant="h4" sx={{ mb: 1, color: "black" }}>
        Vidrios
      </Typography>
      <TableContainer sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Fórmula</TableCell>
              <TableCell>Metraje</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {model.glasses.map((glass, index) => {
              const meterage = calculatePrice(glass.formula, {
                PRECIO: 1,
                ALTO: dimensions.height,
                ANCHO: dimensions.width,
              });
              // Se usa el priceInstalled del vidrio seleccionado (del combobox independiente)
              const glassPrice = selectedGlass ? parseFloat(selectedGlass.priceInstalled || "0") : 0;
              const price = meterage * glassPrice;
              // Asegurar que meterage y price sean números válidos
              const safeMeterage = isNaN(meterage) ? 0 : meterage;
              const safePrice = isNaN(price) ? 0 : price;
              return (
                <TableRow key={index}>
                  <TableCell>{glass.name}</TableCell>
                  <TableCell>{glass.formula}</TableCell>
                  <TableCell>{safeMeterage.toFixed(2)} mts</TableCell>
                  <TableCell>${safePrice.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button color="azulote" startIcon={<Edit />} onClick={() => handleOpenDialog("glasses", { ...glass, index })}>
                      Editar
                    </Button>
                    <Button color="secondary" startIcon={<Delete />} onClick={() => setDeleteItemConfirmation({ open: true, section: "glasses", index })}>
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="h6" align="right" sx={{ mt: 4, color: "black" }}>
        Total Vidrio: ${totalGlassesData.price.toFixed(2)}
      </Typography>
      <Button variant="contained" color="primary" startIcon={<Edit />} onClick={() => handleOpenDialog("glasses")} sx={{ mb: 3 }}>
        Agregar Vidrio
      </Button>

      {/* Sección para mostrar Mano de Obra */}
      <Typography variant="h5" sx={{ mt: 3, color: "black" }}>
        Vidrio Mano de Obra: ${totalGlassMeterage*buffm2}
      </Typography>
      <Typography variant="h5" sx={{ mt: 3, color: "black" }}>
        Material Mano de Obra: ${laborCost.toFixed(2)}
      </Typography>
      <Typography variant="h6" align="right" sx={{ mt: 4, color: "black" }}>
        Total Mano de Obra: ${(laborCost+(totalGlassMeterage*buffm2)).toFixed(2)}
      </Typography>

      {/* Diálogos importados desde ModelDialogs.js */}
      <EditElementDialog
        open={openDialog}
        currentSection={currentSection}
        formData={formData}
        selectedOption={selectedOption}
        options={options}
        onFormChange={setFormData}
        onSave={() => { handleSaveSection(); }}
        onCancel={handleCloseDialog}
      />

      <ConfirmDeleteDialog
        open={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDeleteModel}
      />

      <ConfirmUpdateModelDialog
        open={confirmUpdateModel}
        onCancel={() => setConfirmUpdateModel(false)}
        onConfirm={() => { handleSaveModelConfirmed(); setConfirmUpdateModel(false); }}
      />

      <ConfirmUpdateSectionDialog
        open={confirmUpdateSection}
        onCancel={() => setConfirmUpdateSection(false)}
        onConfirm={() => { handleSaveSectionConfirmed(); setConfirmUpdateSection(false); }}
      />

      <ConfirmDeleteItemDialog
        open={deleteItemConfirmation.open}
        onCancel={() => setDeleteItemConfirmation({ ...deleteItemConfirmation, open: false })}
        onConfirm={() => {
          handleDelete(deleteItemConfirmation.section, deleteItemConfirmation.index);
          setDeleteItemConfirmation({ ...deleteItemConfirmation, open: false });
        }}
      />

      <ChangeImageDialog
        open={changeImageDialog}
        onCancel={handleCancelImageChange}
        onConfirm={handleConfirmImageChange}
        onImageChange={handleImageFileChange}
        previewImage={previewImage}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Typography variant="h5" align="right" sx={{ mt: 4, color: "black" }}>
        Total General: ${totalGeneral.toFixed(2)}
      </Typography>
    </Box>
  );
}
