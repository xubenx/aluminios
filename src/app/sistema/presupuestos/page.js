"use client";
import React, { useState, useEffect } from "react";
import { collection, getDocs, getDoc, doc, addDoc } from "firebase/firestore";
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
  TableBody,  Typography,
  Snackbar,
  CardContent,
  Alert,
  Grid,
  Card,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Badge,
  Fab
} from "@mui/material";
import Image from "next/image";
import { evaluate } from "mathjs";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { ShoppingCart, Delete, Add, Save } from "@mui/icons-material";

export default function CotizadorApp() {
  // Estados para la búsqueda de modelos
  const [models, setModels] = useState([]);
  const [filteredModels, setFilteredModels] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Estados para el modelo seleccionado (para cotizar)
  const [selectedModel, setSelectedModel] = useState(null);
  const [modelData, setModelData] = useState(null);

  // Estados para las opciones (de colecciones) y dimensiones para el cotizador
  const [materialsOptions, setMaterialsOptions] = useState([]);
  const [chapesOptions, setChapesOptions] = useState([]);  const [glassesOptions, setGlassesOptions] = useState([]);
  const [dimensions, setDimensions] = useState({ height: "1", width: "1" });
  const [selectedGlass, setSelectedGlass] = useState(null);

  // Estado para caché de imágenes
  const [imageCache, setImageCache] = useState(new Set());

  // Estados para el carrito y proyecto
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [createNewCustomer, setCreateNewCustomer] = useState(false);
  // Estado para mensajes (snackbar)
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  // Componente de imagen con caché mejorado
  const CachedImage = ({ modelId, modelName, height = 200, width = "100%" }) => {
    const [imageLoaded, setImageLoaded] = useState(imageCache.has(modelId));
    const [imageError, setImageError] = useState(false);
    const imageSrc = `/images/${modelId}.png`;

    const handleImageLoad = () => {
      if (!imageLoaded) {
        setImageLoaded(true);
        setImageCache(prev => new Set([...prev, modelId]));
      }
    };

    const handleImageError = () => {
      setImageError(true);
    };

    if (imageError) {
      return (
        <Box sx={{ 
          height, 
          width, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'grey.100',
          borderRadius: 1
        }}>
          <Typography variant="body2" color="textSecondary">
            Sin imagen
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ position: 'relative', height, width, overflow: 'hidden', borderRadius: 1 }}>
        <Image
          src={imageSrc}
          alt={`Imagen de ${modelName}`}
          fill
          style={{ objectFit: 'cover' }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          priority={imageCache.has(modelId)}
          loading={imageCache.has(modelId) ? "eager" : "lazy"}
        />
        {!imageLoaded && !imageCache.has(modelId) && (
          <Box sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'grey.100'
          }}>
            <Typography variant="body2" color="textSecondary">
              Cargando...
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

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
    fetchCustomers();
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
      // Para vidrio: se recorren las "options" internas de cada documento
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
  // CARGA DE CLIENTES
  // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  const fetchCustomers = async () => {
    try {
      const customersSnapshot = await getDocs(collection(db, "customers"));
      const customersData = customersSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter(customer => customer.status === "available");
      setCustomers(customersData);
    } catch (error) {
      console.error("Error fetching customers: ", error);
    }
  };

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
  };

  // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  // FUNCIONES DEL CARRITO Y PROYECTO
  // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  const addToCart = () => {
    if (!modelData || !selectedGlass) {
      setSnackbar({ 
        open: true, 
        message: "Debe seleccionar un vidrio antes de agregar al carrito.", 
        severity: "error" 
      });
      return;
    }

    const calculations = getCalculations();
    if (!calculations) return;

    const cartItem = {
      id: Date.now().toString(), // ID único para el item del carrito
      modelId: modelData.id,
      modelName: modelData.name,
      dimensions: { ...dimensions },
      selectedGlass: { ...selectedGlass },
      calculations: { ...calculations },
      timestamp: new Date().toISOString()
    };

    setCart(prevCart => [...prevCart, cartItem]);
    setSnackbar({ 
      open: true, 
      message: "Modelo agregado al carrito exitosamente.", 
      severity: "success" 
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };
  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.calculations.totalGeneral, 0);
  };

  // Función para obtener resúmenes de materiales, chapes y vidrios del carrito
  const getCartSummaries = () => {
    const materialsSummary = {};
    const chapesSummary = {};
    const glassesSummary = {};

    cart.forEach(item => {
      // Materiales
      item.calculations.materialsCalc.items.forEach(material => {
        if (materialsSummary[material.name]) {
          materialsSummary[material.name].meterage += material.meterage;
          materialsSummary[material.name].price += material.price;
        } else {
          materialsSummary[material.name] = {
            name: material.name,
            meterage: material.meterage,
            price: material.price
          };
        }
      });

      // Chapes (Herrajes)
      item.calculations.chapesCalc.items.forEach(chape => {
        if (chapesSummary[chape.name]) {
          chapesSummary[chape.name].pieces += chape.pieces;
          chapesSummary[chape.name].price += chape.price;
        } else {
          chapesSummary[chape.name] = {
            name: chape.name,
            pieces: chape.pieces,
            price: chape.price
          };
        }
      });

      // Vidrios
      item.calculations.glassesCalc.items.forEach(glass => {
        if (glassesSummary[glass.name]) {
          glassesSummary[glass.name].meterage += glass.meterage;
          glassesSummary[glass.name].price += glass.price;
        } else {
          glassesSummary[glass.name] = {
            name: glass.name,
            meterage: glass.meterage,
            price: glass.price
          };
        }
      });
    });

    return {
      materials: Object.values(materialsSummary),
      chapes: Object.values(chapesSummary),
      glasses: Object.values(glassesSummary)
    };
  };

  const handleSaveProject = async () => {
    if (!projectName.trim()) {
      setSnackbar({ 
        open: true, 
        message: "El nombre del proyecto es obligatorio.", 
        severity: "error" 
      });
      return;
    }

    if (cart.length === 0) {
      setSnackbar({ 
        open: true, 
        message: "El carrito está vacío. Agregue al menos un modelo.", 
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
        customerName: createNewCustomer ? newCustomerName.trim() : selectedCustomer.name,        items: cart.map(item => ({
          modelId: item.modelId,
          modelName: item.modelName,
          dimensions: item.dimensions,
          selectedGlass: item.selectedGlass,
          total: item.calculations.totalGeneral,
          details: {
            materials: item.calculations.materialsCalc,
            chapes: item.calculations.chapesCalc,
            glasses: item.calculations.glassesCalc,
            laborCost: item.calculations.laborCost
          },
          laborCostSelected: item.calculations.laborCost, // Costo de mano de obra editable
          status: "cotizacion", // Estado inicial del modelo
          area: "", // Área/ubicación del modelo
          assignedEmployeeId: "" // ID del empleado asignado
        })),
        total: getCartTotal(),
        createdAt: new Date().toISOString(),
        status: "quotation"
      };

      await addDoc(collection(db, "projects"), projectData);

      setSnackbar({ 
        open: true, 
        message: "Proyecto guardado exitosamente.", 
        severity: "success" 
      });

      // Limpiar estados
      setCart([]);
      setProjectName("");
      setSelectedCustomer(null);
      setNewCustomerName("");
      setNewCustomerPhone("");
      setCreateNewCustomer(false);
      setShowProjectDialog(false);
      setShowCart(false);

    } catch (error) {
      console.error("Error saving project:", error);
      setSnackbar({ 
        open: true, 
        message: "Error al guardar el proyecto.", 
        severity: "error" 
      });
    }
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
        const tramo = matOption ? parseFloat(matOption.stretch || "6.1") : 6.1;
  
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
  
    // Mano de obra
    const laborCost = parseFloat(modelData.manpower || "0") * materialsCalc.price;
  
    // Total general
    const totalGeneral = materialsCalc.price + chapesCalc.price + glassesCalc.price + laborCost;
  
    return { materialsCalc, chapesCalc, glassesCalc, laborCost, totalGeneral };
  };

  // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  // RENDERIZADO
  // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  
  // Vista de búsqueda y selección de modelos
  if (!selectedModel) {
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
        <Grid container spacing={3}>
          {filteredModels.map((model) => (            <Grid item xs={12} sm={6} md={4} lg={3} key={model.id}>
              <Card sx={{ maxWidth: 345, boxShadow: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CachedImage 
                  modelId={model.id}
                  modelName={model.name}
                  height={200}
                />
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
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
                    onClick={() => handleSelectModel(model)}
                    sx={{ color: "black", borderColor: "black" }}
                  >
                    Seleccionar
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {/* Botón flotante del carrito */}
        <Fab
          color="primary"
          aria-label="cart"
          onClick={() => setShowCart(true)}
          sx={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
          }}
        >
          <Badge badgeContent={cart.length} color="error">
            <ShoppingCart />
          </Badge>
        </Fab>

        {/* Diálogos compartidos */}
        {renderDialogs()}

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
  }

  // Vista del cotizador del modelo seleccionado
  if (modelData) {
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
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Image
            src={`/images/${modelData.id}.png`}
            alt={`Imagen de ${modelData.name}`}
            width={500}
            height={500}
            style={{
              objectFit: "cover",
              borderRadius: "16px",
            }}
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
        
        <Box sx={{ mt: 4, textAlign: "right" }}>
          <Typography variant="h5" sx={{ color: "black" }}>
            Total:
          </Typography>
        </Box>
        <Box sx={{textAlign: "right" }}>
          <Typography variant="h1" sx={{ color: "black" }}>
            ${calculations ? calculations.totalGeneral.toFixed(2) : "0.00"}
          </Typography>
        </Box>

        {/* Botones de acción */}
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 4, mb: 4 }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<Add />}
            onClick={addToCart}
            size="large"
          >
            Agregar al Carrito
          </Button>
          <Button
            variant="outlined"
            startIcon={<ShoppingCart />}
            onClick={() => setShowCart(true)}
            size="large"
          >
            Ver Carrito ({cart.length})
          </Button>
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
          </>
        )}

        {/* Diálogos compartidos */}
        {renderDialogs()}

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
  }

  return <Typography>Loading...</Typography>;

  // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  // FUNCIÓN PARA RENDERIZAR DIÁLOGOS COMPARTIDOS
  // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  function renderDialogs() {
    return (
      <>        {/* Diálogo del Carrito */}
        <Dialog open={showCart} onClose={() => setShowCart(false)} maxWidth="xl" fullWidth>
          <DialogTitle>
            Carrito de Cotización
            <Typography variant="subtitle1" color="textSecondary">
              Total del Proyecto: ${getCartTotal().toFixed(2)}
            </Typography>
          </DialogTitle>
          <DialogContent>
            {cart.length === 0 ? (
              <Typography>El carrito está vacío</Typography>
            ) : (
              <>
                {/* Tabla de modelos */}
                <Typography variant="h6" sx={{ mb: 2 }}>Modelos en el Carrito</Typography>
                <TableContainer sx={{ mb: 4 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Modelo</TableCell>
                        <TableCell>Dimensiones</TableCell>
                        <TableCell>Vidrio</TableCell>
                        <TableCell>Total</TableCell>
                        <TableCell>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cart.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.modelName}</TableCell>
                          <TableCell>{item.dimensions.height} x {item.dimensions.width}</TableCell>
                          <TableCell>{item.selectedGlass.name}</TableCell>
                          <TableCell>${item.calculations.totalGeneral.toFixed(2)}</TableCell>
                          <TableCell>
                            <IconButton 
                              color="error" 
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Resúmenes de materiales */}
                {(() => {
                  const summaries = getCartSummaries();
                  return (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2 }}>Resumen de Materiales</Typography>
                      
                      {/* Materiales */}
                      {summaries.materials.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                            Materiales:
                          </Typography>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Material</TableCell>
                                  <TableCell align="right">Metraje Total</TableCell>
                                  <TableCell align="right">Precio Total</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {summaries.materials.map((material, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{material.name}</TableCell>
                                    <TableCell align="right">{material.meterage.toFixed(2)} m</TableCell>
                                    <TableCell align="right">${material.price.toFixed(2)}</TableCell>
                                  </TableRow>
                                ))}
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 'bold' }}>Total Materiales:</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                    {summaries.materials.reduce((sum, m) => sum + m.meterage, 0).toFixed(2)} m
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                    ${summaries.materials.reduce((sum, m) => sum + m.price, 0).toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      )}

                      {/* Herrajes */}
                      {summaries.chapes.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                            Herrajes:
                          </Typography>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Herraje</TableCell>
                                  <TableCell align="right">Piezas Totales</TableCell>
                                  <TableCell align="right">Precio Total</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {summaries.chapes.map((chape, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{chape.name}</TableCell>
                                    <TableCell align="right">{chape.pieces.toFixed(2)}</TableCell>
                                    <TableCell align="right">${chape.price.toFixed(2)}</TableCell>
                                  </TableRow>
                                ))}
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 'bold' }}>Total Herrajes:</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                    {summaries.chapes.reduce((sum, c) => sum + c.pieces, 0).toFixed(2)}
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                    ${summaries.chapes.reduce((sum, c) => sum + c.price, 0).toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      )}

                      {/* Vidrios */}
                      {summaries.glasses.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                            Vidrios:
                          </Typography>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Vidrio</TableCell>
                                  <TableCell align="right">Metraje Total</TableCell>
                                  <TableCell align="right">Precio Total</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {summaries.glasses.map((glass, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{glass.name}</TableCell>
                                    <TableCell align="right">{glass.meterage.toFixed(2)} m²</TableCell>
                                    <TableCell align="right">${glass.price.toFixed(2)}</TableCell>
                                  </TableRow>
                                ))}
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 'bold' }}>Total Vidrios:</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                    {summaries.glasses.reduce((sum, g) => sum + g.meterage, 0).toFixed(2)} m²
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                    ${summaries.glasses.reduce((sum, g) => sum + g.price, 0).toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      )}
                    </Box>
                  );
                })()}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCart(false)}>Cerrar</Button>
            {cart.length > 0 && (
              <Button 
                variant="contained" 
                startIcon={<Save />}
                onClick={() => setShowProjectDialog(true)}
              >
                Guardar Proyecto
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Diálogo para Guardar Proyecto */}
        <Dialog open={showProjectDialog} onClose={() => setShowProjectDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Guardar Proyecto</DialogTitle>
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
            <Button onClick={() => setShowProjectDialog(false)}>Cancelar</Button>
            <Button variant="contained" onClick={handleSaveProject}>
              Guardar Proyecto
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }
}
