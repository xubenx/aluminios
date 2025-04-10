"use client";
import React, { useState, useEffect } from "react";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "../../../../firebase";
import {
  Box,
  Button,
  TextField,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Snackbar,
  Alert,
  Autocomplete
} from "@mui/material";
import Image from "next/image";
import { evaluate } from "mathjs";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useMediaQuery } from "@mui/material";

export default function CotizadorApp() {
  // Estados para la búsqueda de modelos
  const [models, setModels] = useState([]);
  const isMobile = useMediaQuery("(max-width: 600px)"); // Detecta si el ancho de la pantalla es menor a 600px

  const [filteredModels, setFilteredModels] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Estados para el modelo seleccionado (para cotizar)
  const [selectedModel, setSelectedModel] = useState(null);
  const [modelData, setModelData] = useState(null);

  // Estados para las opciones (de colecciones) y dimensiones para el cotizador
  const [materialsOptions, setMaterialsOptions] = useState([]);
  const [chapesOptions, setChapesOptions] = useState([]);
  const [glassesOptions, setGlassesOptions] = useState([]);
  const [dimensions, setDimensions] = useState({ height: "1", width: "1" });
  const [selectedGlass, setSelectedGlass] = useState(null);

  // Estado para mensajes (snackbar)
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });


  // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  // BÚSQUEDA DE MODELOS
  // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  const fetchModels = async () => {
    try {
      const modelsSnapshot = await getDocs(collection(db, "models"));
      const modelsData = modelsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setModels(modelsData);
      setFilteredModels(modelsData);
    } catch (error) {
      console.error("Error fetching models: ", error);
    }
  };

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

  // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  // CARGA DE OPCIONES DE MATERIALES, CHAPES Y VIDRIOS
  // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  const fetchOptions = async () => {
    try {
      const materialsSnap = await getDocs(collection(db, "materials"));
      setMaterialsOptions(materialsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      const chapesSnap = await getDocs(collection(db, "chapes"));
      setChapesOptions(chapesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      const glassesSnap = await getDocs(collection(db, "glasses"));
      // Para vidrio: se recorren las “options” internas de cada documento
      const glassesList = glassesSnap.docs.flatMap((doc) => {
        const data = doc.data();
        return data.options.map((option) => ({
          id: doc.id,
          name: `${data.name} ${option.tickness}mm`,
          tickness: option.tickness,
          priceInstalled: option.priceInstalled,
        }));
      });
      setGlassesOptions(glassesList);
    } catch (error) {
      console.error("Error fetching options: ", error);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  // AL SELECCIONAR UN MODELO: cargar el modelo completo, resolviendo nombres de elementos
  // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  const resolveNames = async (items, collectionName) => {
    return await Promise.all(
      items.map(async (item) => {
        if (!item.id) return item;
        try {
          const itemDoc = await getDoc(doc(db, collectionName, item.id));
          return itemDoc.exists() ? { ...item, name: itemDoc.data().name } : item;
        } catch (error) {
          console.error(`Error fetching ${collectionName} item:`, error);
          return item;
        }
      })
    );
  };

  const handleSelectModel = async (model) => {
    setSelectedModel(model);
    try {
      const modelDoc = await getDoc(doc(db, "models", model.id));
      if (modelDoc.exists()) {
        const data = modelDoc.data();
        const materials = data.materials ? await resolveNames(data.materials, "materials") : [];
        const chapes = data.chapes ? await resolveNames(data.chapes, "chapes") : [];
        const glasses = data.glasses ? await resolveNames(data.glasses, "glasses") : [];
        setModelData({
          id: model.id,
          ...data,
          materials,
          chapes,
          glasses,
        });
      } else {
        setModelData(null);
      }
    } catch (error) {
      console.error("Error fetching model details:", error);
    }
  };

  // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  // ACTUALIZAR EL VIDRIO SELECCIONADO
  // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  const handleSelectGlass = (newValue) => {
    setSelectedGlass(newValue);
    // Si es necesario actualizar el modelo, aquí se puede optar por actualizar solo la visualización
    // O alternativamente, actualizar el estado de modelData
  };

  // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  // FUNCIÓN PARA CALCULAR LOS VALORES (utilizando mathjs)
  // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  const calculatePrice = (formula, variables) => {
    try {
      return evaluate(formula, variables);
    } catch (error) {
      console.error("Error evaluating formula:", error);
      return 0;
    }
  };

  // Calcula para cada sección (materials, chapes y vidrios) y la mano de obra
  const getCalculations = () => {
    if (!modelData) return null;

    // MATERIALS
    const materialsCalc = modelData.materials?.reduce(
      (acc, material) => {
        const matOption = materialsOptions.find((m) => m.id === material.id);
        const currentPrice = matOption ? parseFloat(matOption.price || "0") : 0;
        const tramo = matOption ? (matOption.tramo || 1) : 1;
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
        return {
          price: acc.price + price,
          meterage: acc.meterage + meterage,
          items: [...acc.items, { name: material.name, meterage, price }],
        };
      },
      { price: 0, meterage: 0, items: [] }
    ) || { price: 0, meterage: 0, items: [] };

    // CHAPES (herrajes)
    const chapesCalc = modelData.chapes?.reduce(
      (acc, chape) => {
        const chapeOption = chapesOptions.find((c) => c.id === chape.id);
        const currentPrice = chapeOption ? parseFloat(chapeOption.price || "0") : 0;
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
          items: [...acc.items, { name: chape.name, pieces, price }],
        };
      },
      { price: 0, pieces: 0, items: [] }
    ) || { price: 0, pieces: 0, items: [] };

    // VIDRIOS
    const glassesCalc = modelData.glasses?.reduce(
      (acc, glass) => {
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
          items: [...acc.items, { name: selectedGlass ? selectedGlass.name : glass.name, meterage, price }],
        };
      },
      { price: 0, meterage: 0, items: [] }
    ) || { price: 0, meterage: 0, items: [] };

// Mano de obra: se multiplica la mano de obra (del modelo) por el precio total de los materiales
    const laborCost = parseFloat(modelData.manpower || "0") * materialsCalc.price;
    // Total general
    const totalGeneral = materialsCalc.price + chapesCalc.price + glassesCalc.price + laborCost;

    return { materialsCalc, chapesCalc, glassesCalc, laborCost, totalGeneral };
  };

  // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  // RENDERIZADO: si no hay un modelo seleccionado se muestra la búsqueda; si hay, se muestra la cotización
  // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  if (!selectedModel) {
    // Vista de búsqueda y selección de modelos
    return (
      <Box sx={{ padding: 2 }}>
      <Typography variant="h4" align="center" sx={{ mb: 2, color: "black" }}>
        Selecciona modelo a cotizar
      </Typography>
      <TextField
        fullWidth
        label="Buscar modelos"
        variant="outlined"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2 }}
      />
      <TableContainer>
        {isMobile ? (
          // Vista móvil: muestra los modelos en filas
          <Box>
            {filteredModels.map((model) => (
              <Box
                key={model.id}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  padding: 2,
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  marginBottom: 2,
                }}
              >
                <Image
                  src={`/images/${model.id}.png`}
                  alt={`Imagen de ${model.name}`}
                  width={400}
                  height={400}
                  style={{ objectFit: "cover", borderRadius: "8px" }}
                  onError={(e) => (e.target.style.display = "none")}
                />
                <Typography variant="h6"  sx={{color:'black'}}component="div">
                  {model.name}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => handleSelectModel(model)}
                >
                  Seleccionar
                </Button>
              </Box>
            ))}
          </Box>
        ) : (
          // Vista de escritorio: muestra los modelos en una tabla
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Imagen</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredModels.map((model) => (
                <TableRow key={model.id}>
                  <TableCell>
                    <Image
                      src={`/images/${model.id}.png`}
                      alt={`Imagen de ${model.name}`}
                      width={200}
                      height={200}
                      style={{ objectFit: "cover", borderRadius: "8px" }}
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  </TableCell>
                  <TableCell>{model.name}</TableCell>
                  <TableCell>
                    <Button variant="outlined" onClick={() => handleSelectModel(model)}>
                      Seleccionar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>
      {snackbar.open && (
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
}else if (modelData) {
    // Vista del cotizador del modelo seleccionado
    const calculations = getCalculations();
    return (
      <Box sx={{ padding: 2, maxWidth: "1200px", margin: "0 auto" }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => {
            setSelectedModel(null);
            setModelData(null);
          }}
        >
          Volver a Buscar
        </Button>
        <Typography variant="h4" align="center" sx={{ mt: 2, mb: 2, color: "black" }}>
          {modelData.name}
        </Typography>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Image
            src={`/images/${modelData.id}.png`}
            alt={`Imagen de ${modelData.name}`}
            width={500}
            height={500}
            style={{ objectFit: "cover", borderRadius: "16px" }}
            onError={(e) => (e.target.style.display = "none")}
          />
        </Box>
        {/* Campos para modificar dimensiones */}
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mb: 2 }}>
          <TextField
            label="Alto"
            type="text"
            value={dimensions.height}
            onChange={(e) =>
              setDimensions({
                ...dimensions,
                height: e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*?)\..*/g, "$1"),
              })
            }
          />
          <TextField
            label="Ancho"
            type="text"
            value={dimensions.width}
            onChange={(e) =>
              setDimensions({
                ...dimensions,
                width: e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*?)\..*/g, "$1"),
              })
            }
          />
        </Box>
        {/* Selección de vidrio */}
        <Box sx={{ mb: 4, width: "300px", margin: "0 auto" }}>
          <Autocomplete
            options={glassesOptions}
            getOptionLabel={(option) => option.name || ""}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={selectedGlass}
            onChange={(event, newValue) => handleSelectGlass(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Seleccionar Vidrio" variant="outlined" />
            )}
          />
        </Box>
        {/* Desglose de secciones */}
        {calculations && (
          <>
            {/* Materiales */}
            <Typography variant="h5" sx={{ mt: 4, color: "black" }}>
              Materiales
            </Typography>
            <TableContainer sx={{ mb: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Metraje (m2)</TableCell>
                    <TableCell>Total ($)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {calculations.materialsCalc.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.meterage.toFixed(2)}</TableCell>
                      <TableCell>${item.price.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="subtitle1" align="right" sx={{ color: "black" }}>
              Total Materiales: ${calculations.materialsCalc.price.toFixed(2)}
            </Typography>

            {/* Herrajes */}
            <Typography variant="h5" sx={{ mt: 4, color: "black" }}>
              Herrajes
            </Typography>
            <TableContainer sx={{ mb: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Piezas</TableCell>
                    <TableCell>Total ($)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {calculations.chapesCalc.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.pieces.toFixed(2)}</TableCell>
                      <TableCell>${item.price.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="subtitle1" align="right" sx={{ color: "black" }}>
              Total Herrajes: ${calculations.chapesCalc.price.toFixed(2)}
            </Typography>

            {/* Vidrios */}
            <Typography variant="h5" sx={{ mt: 4, color: "black" }}>
              Vidrios
            </Typography>
            <TableContainer sx={{ mb: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Metraje (mts)</TableCell>
                    <TableCell>Total ($)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modelData.glasses.map((glass, index) => {
                    const meterage = calculatePrice(glass.formula, {
                      PRECIO: 1,
                      ALTO: dimensions.height,
                      ANCHO: dimensions.width,
                    });
                    const glassPrice = selectedGlass ? parseFloat(selectedGlass.priceInstalled || "0") : 0;
                    const price = meterage * glassPrice;
                    return (
                      <TableRow key={index}>
                        {/* Si se ha seleccionado un vidrio, se muestra su nombre en la columna "Nombre" */}
                        <TableCell>{selectedGlass ? selectedGlass.name : glass.name}</TableCell>
                        <TableCell>{meterage.toFixed(2)} mts</TableCell>
                        <TableCell>${price.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="subtitle1" align="right" sx={{ color: "black" }}>
              Total Vidrios: ${calculations.glassesCalc.price.toFixed(2)}
            </Typography>

            {/* Total General */}
            <Box sx={{ mt: 4, textAlign: "right" }}>
              <Typography variant="h1" sx={{ color: "black" }}>
                Total: ${calculations.totalGeneral.toFixed(2)}
              </Typography>
            </Box>
          </>
        )}
        {snackbar.open && (
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        )}
      </Box>
    );
  } else {
    return <Typography>Loading...</Typography>;
  }
}
