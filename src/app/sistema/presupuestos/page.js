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
  TableBody,
  Typography,
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
  Fab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Paper
} from "@mui/material";
import Image from "next/image";
import { evaluate } from "mathjs";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { ShoppingCart, Delete, Add, Save, Edit } from "@mui/icons-material";

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
  const [colorsOptions, setColorsOptions] = useState([]);
  const [dimensions, setDimensions] = useState({ height: "100", width: "100" }); // Ahora en centímetros para la UI
  const [selectedGlass, setSelectedGlass] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

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

  // Estados para recotización de productos en el carrito
  const [showRequoteDialog, setShowRequoteDialog] = useState(false);
  const [requoteItem, setRequoteItem] = useState(null);
  const [requoteDimensions, setRequoteDimensions] = useState({ height: "", width: "" });
  const [requoteGlass, setRequoteGlass] = useState(null);
  const [requoteColor, setRequoteColor] = useState(null);

  // Estados para agregar elementos individuales
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [addItemType, setAddItemType] = useState("material"); // material, herraje, vidrio
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedHerraje, setSelectedHerraje] = useState(null);
  const [selectedVidrio, setSelectedVidrio] = useState(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemQuantityType, setItemQuantityType] = useState("metros"); // metros, tramos, piezas, m2
  const [itemDimensions, setItemDimensions] = useState({ height: "", width: "" });

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
    loadCartFromStorage();
  }, []);

  useEffect(() => {
    setFilteredModels(
      models.filter((model) =>
        model.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, models]);

  // Persistencia del carrito
  const saveCartToStorage = (cartData) => {
    try {
      localStorage.setItem('aluminios-cart', JSON.stringify(cartData));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  };

  const loadCartFromStorage = () => {
    try {
      const savedCart = localStorage.getItem('aluminios-cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  };

  // Actualizar localStorage cuando cambie el carrito
  useEffect(() => {
    saveCartToStorage(cart);
  }, [cart]);

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
          id: `${doc.id}_${option.tickness}`, // Clave única combinando ID del documento y espesor
          originalId: doc.id, // ID original del documento para referencia
          name: `${data.name} ${option.tickness}mm`,
          tickness: option.tickness,
          priceInstalled: option.priceInstalled,
        }));
      });
      setGlassesOptions(glassesList);

      const colorsSnap = await getDocs(collection(db, "colors"));
      setColorsOptions(colorsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
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
      selectedColor: selectedColor ? { ...selectedColor } : null,
      calculations: { ...calculations },
      m2: modelData.m2 || 100, // Costo por m² de vidrio del modelo
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



  // Funciones para agregar elementos individuales
  const handleOpenAddItemDialog = (type) => {
    setAddItemType(type);
    setShowAddItemDialog(true);
    setSelectedMaterial(null);
    setSelectedHerraje(null);
    setSelectedVidrio(null);
    setItemQuantity(1);
    setItemDimensions({ height: "", width: "" });
    
    // Establecer tipo de cantidad por defecto según el tipo de elemento
    switch(type) {
      case "material":
        setItemQuantityType("metros");
        break;
      case "herraje":
        setItemQuantityType("piezas");
        break;
      case "vidrio":
        setItemQuantityType("dimensiones"); // Cambiar default a dimensiones
        break;
      default:
        setItemQuantityType("metros");
    }
  };

  const addIndividualItemToCart = () => {
    let selectedItem = null;
    let itemData = {};

    // Validaciones según el tipo de elemento
    switch(addItemType) {
      case "material":
        if (!selectedMaterial) {
          setSnackbar({ 
            open: true, 
            message: "Debe seleccionar un material.", 
            severity: "error" 
          });
          return;
        }
        selectedItem = selectedMaterial;
        
        if (itemQuantityType === "tramos") {
          const tramo = parseFloat(selectedMaterial.stretch || 6.1);
          itemData = {
            name: selectedMaterial.name,
            quantity: itemQuantity,
            quantityType: "tramos",
            unitPrice: parseFloat(selectedMaterial.price || 0),
            meters: itemQuantity * tramo,
            totalPrice: itemQuantity * parseFloat(selectedMaterial.price || 0),
            tramo: tramo
          };
        } else {
          // Por metros
          const tramo = parseFloat(selectedMaterial.stretch || 6.1);
          const tramosCost = (itemQuantity / tramo) * parseFloat(selectedMaterial.price || 0);
          itemData = {
            name: selectedMaterial.name,
            quantity: itemQuantity,
            quantityType: "metros",
            unitPrice: parseFloat(selectedMaterial.price || 0) / tramo,
            meters: itemQuantity,
            totalPrice: tramosCost,
            tramo: tramo
          };
        }
        break;

      case "herraje":
        if (!selectedHerraje) {
          setSnackbar({ 
            open: true, 
            message: "Debe seleccionar un herraje.", 
            severity: "error" 
          });
          return;
        }
        selectedItem = selectedHerraje;
        itemData = {
          name: selectedHerraje.name,
          quantity: itemQuantity,
          quantityType: "piezas",
          unitPrice: parseFloat(selectedHerraje.price || 0),
          totalPrice: itemQuantity * parseFloat(selectedHerraje.price || 0)
        };
        break;

      case "vidrio":
        if (!selectedVidrio) {
          setSnackbar({ 
            open: true, 
            message: "Debe seleccionar un vidrio.", 
            severity: "error" 
          });
          return;
        }
        
        let area = 0;
        if (itemQuantityType === "m2") {
          area = itemQuantity;
        } else if (itemQuantityType === "dimensiones") {
          if (!itemDimensions.height || !itemDimensions.width || 
              parseFloat(itemDimensions.height) <= 0 || parseFloat(itemDimensions.width) <= 0) {
            setSnackbar({ 
              open: true, 
              message: "Debe ingresar dimensiones válidas.", 
              severity: "error" 
            });
            return;
          }
          area = (parseFloat(itemDimensions.height) / 100) * (parseFloat(itemDimensions.width) / 100);
        }

        selectedItem = selectedVidrio;
        itemData = {
          name: selectedVidrio.name,
          quantity: area,
          quantityType: itemQuantityType,
          unitPrice: parseFloat(selectedVidrio.price || 0),
          totalPrice: area * parseFloat(selectedVidrio.price || 0),
          dimensions: itemQuantityType === "dimensiones" ? { ...itemDimensions } : null,
          area: area
        };
        break;

      default:
        return;
    }

    const cartItem = {
      id: Date.now().toString(),
      type: "individual", // Para distinguir de modelos
      itemType: addItemType,
      itemId: selectedItem.id,
      itemData: itemData,
      timestamp: new Date().toISOString()
    };

    setCart(prevCart => [...prevCart, cartItem]);
    setSnackbar({ 
      open: true, 
      message: `${itemData.name} agregado al carrito exitosamente.`, 
      severity: "success" 
    });

    setShowAddItemDialog(false);
  };
  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      if (item.type === "individual") {
        return total + item.itemData.totalPrice;
      } else {
        // Elementos de modelo
        return total + item.calculations.totalGeneral;
      }
    }, 0);
  };

  // Función para obtener resúmenes de materiales, chapes y vidrios del carrito
  const getCartSummaries = () => {
    const materialsSummary = {};
    const chapesSummary = {};
    const glassesSummary = {};

    cart.forEach(item => {
      if (item.type === "individual") {
        // Elementos individuales
        switch(item.itemType) {
          case "material":
            if (materialsSummary[item.itemData.name]) {
              materialsSummary[item.itemData.name].meterage += item.itemData.meters;
              materialsSummary[item.itemData.name].price += item.itemData.totalPrice;
            } else {
              materialsSummary[item.itemData.name] = {
                name: item.itemData.name,
                meterage: item.itemData.meters,
                price: item.itemData.totalPrice,
                isIndividual: true
              };
            }
            break;
          case "herraje":
            if (chapesSummary[item.itemData.name]) {
              chapesSummary[item.itemData.name].pieces += item.itemData.quantity;
              chapesSummary[item.itemData.name].price += item.itemData.totalPrice;
            } else {
              chapesSummary[item.itemData.name] = {
                name: item.itemData.name,
                pieces: item.itemData.quantity,
                price: item.itemData.totalPrice,
                isIndividual: true
              };
            }
            break;
          case "vidrio":
            if (glassesSummary[item.itemData.name]) {
              glassesSummary[item.itemData.name].meterage += item.itemData.area;
              glassesSummary[item.itemData.name].price += item.itemData.totalPrice;
            } else {
              glassesSummary[item.itemData.name] = {
                name: item.itemData.name,
                meterage: item.itemData.area,
                price: item.itemData.totalPrice,
                isIndividual: true
              };
            }
            break;
        }
      } else {
        // Elementos de modelo
        item.calculations.materialsCalc.items.forEach(material => {
          if (materialsSummary[material.name]) {
            materialsSummary[material.name].meterage += material.meterage;
            materialsSummary[material.name].price += material.price;
          } else {
            materialsSummary[material.name] = {
              name: material.name,
              meterage: material.meterage,
              price: material.price,
              isIndividual: false
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
              price: chape.price,
              isIndividual: false
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
              price: glass.price,
              isIndividual: false
            };
          }
        });
      }
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
        customerName: createNewCustomer ? newCustomerName.trim() : selectedCustomer.name,
        items: cart.map(item => {
          if (item.type === "individual") {
            // Elemento individual
            return {
              type: "individual",
              itemType: item.itemType,
              itemId: item.itemId,
              itemName: item.itemData.name,
              quantity: item.itemData.quantity,
              quantityType: item.itemData.quantityType,
              unitPrice: item.itemData.unitPrice,
              total: item.itemData.totalPrice,
              dimensions: item.itemData.dimensions || null,
              area: item.itemData.area || null,
              meters: item.itemData.meters || null,
              tramo: item.itemData.tramo || null,
              status: "cotizacion",
              assignedEmployeeId: ""
            };
          } else {
            // Elemento de modelo
            return {
              type: "model",
              modelId: item.modelId,
              modelName: item.modelName,
              dimensions: item.dimensions,
              selectedGlass: item.selectedGlass,
              selectedColor: item.selectedColor || null,
              total: item.calculations.totalGeneral,
              m2: item.m2 || 100, // Costo por m² de vidrio del modelo
              details: {
                materials: item.calculations.materialsCalc,
                chapes: item.calculations.chapesCalc,
                glasses: item.calculations.glassesCalc,
                laborCost: item.calculations.laborCost,
                laborCostActual: item.calculations.laborCostActual,
                glassLaborCost: item.calculations.glassLaborCost,
                totalLaborActual: item.calculations.totalLaborActual
              },
              laborCostSelected: item.calculations.laborCost,
              laborCostActual: item.calculations.laborCostActual,
              glassLaborCost: item.calculations.glassLaborCost,
              totalLaborActual: item.calculations.totalLaborActual,
              status: "cotizacion",
              area: "",
              assignedEmployeeId: ""
            };
          }
        }),
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
      localStorage.removeItem('aluminios-cart'); // Limpiar también el localStorage
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
  
    // Convertir dimensiones de cm a metros para los cálculos internos
    const heightInMeters = parseFloat(dimensions.height) / 100;
    const widthInMeters = parseFloat(dimensions.width) / 100;
  
    // MATERIALS
    const materialsCalc = modelData.materials?.reduce(
      (acc, material) => {
        const matOption = materialsOptions.find((m) => m.id === material.id);
        const basePrice = matOption ? parseFloat(matOption.price || "0") : 0;
        const tramo = matOption ? parseFloat(matOption.stretch || "6.1") : 6.1;

        // Aplicar incremento por color
        const colorIncrement = selectedColor ? parseFloat(selectedColor.percentage || "0") : 0;
        const currentPrice = basePrice * (1 + colorIncrement / 100);
  
        const meterage = calculatePrice(material.formula, {
          PRECIO: 1,
          ALTO: heightInMeters,
          ANCHO: widthInMeters,
          TRAMO: 1,
        });
  
        const basePriceTotal = calculatePrice(material.formula, {
          PRECIO: basePrice,
          ALTO: heightInMeters,
          ANCHO: widthInMeters,
          TRAMO: tramo,
        });

        const priceWithColor = calculatePrice(material.formula, {
          PRECIO: currentPrice,
          ALTO: heightInMeters,
          ANCHO: widthInMeters,
          TRAMO: tramo,
        });
  
        return {
          price: acc.price + priceWithColor,
          basePrice: acc.basePrice + basePriceTotal, // Precio base para cálculo de mano de obra
          meterage: acc.meterage + meterage,
          items: [...acc.items, { 
            name: material.name, 
            meterage, 
            price: priceWithColor,
            basePrice: basePriceTotal,
            colorName: selectedColor?.name || "Natural",
            colorPercentage: colorIncrement
          }],
        };
      },
      { price: 0, basePrice: 0, meterage: 0, items: [] }
    ) || { price: 0, basePrice: 0, meterage: 0, items: [] };
  
    // CHAPES (herrajes)
    const chapesCalc = modelData.chapes?.reduce(
      (acc, chape) => {
        const chapeOption = chapesOptions.find((c) => c.id === chape.id);
        const currentPrice = chapeOption ? parseFloat(chapeOption.price || "0") : 0;
  
        const pieces = calculatePrice(chape.formula, {
          PRECIO: 1,
          ALTO: heightInMeters,
          ANCHO: widthInMeters,
          TRAMO: 1,
        });
  
        const price = calculatePrice(chape.formula, {
          PRECIO: currentPrice,
          ALTO: heightInMeters,
          ANCHO: widthInMeters,
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
          ALTO: heightInMeters,
          ANCHO: widthInMeters,
        });
  
        const glassPrice = selectedGlass ? parseFloat(selectedGlass.priceInstalled || selectedGlass.price || "0") : 0;
        const price = meterage * glassPrice;
  
        return {
          price: acc.price + price,
          meterage: acc.meterage + meterage,
          items: [...acc.items, { name: selectedGlass ? selectedGlass.name : glass.name, meterage, price }],
        };
      },
      { price: 0, meterage: 0, items: [] }
    ) || { price: 0, meterage: 0, items: [] };
    // Mano de obra para aluminio (independiente del vidrio)
    // IMPORTANTE: Se usa basePrice (precio natural) para el cálculo de mano de obra, NO el precio con color
    const laborCost = parseFloat(modelData.manpower || "0") * materialsCalc.basePrice;
    const laborCostActual = Math.round(parseFloat(modelData.manpowerActual || "0")); // Entero

    // Mano de obra para vidrio (por m² - independiente del aluminio)
    const glassLaborCostPerM2 = modelData.m2 || 100; // Usar el valor del modelo o default 100
    const glassLaborCost = Math.round(glassesCalc.meterage * glassLaborCostPerM2); // Entero
    
    // Total de mano de obra real que se pagará al trabajador
    const totalLaborActual = laborCostActual + glassLaborCost;

    // Total general (solo para cotización - no incluye mano de obra de vidrio)
    const totalGeneral = materialsCalc.price + chapesCalc.price + glassesCalc.price + laborCost;

    return { 
      materialsCalc, 
      chapesCalc, 
      glassesCalc, 
      laborCost, 
      laborCostActual, 
      glassLaborCost,
      totalLaborActual,
      totalGeneral 
    };
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
        
        {/* Botones flotantes para agregar elementos individuales */}
        <Box sx={{
          position: "fixed",
          bottom: "2rem",
          left: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: 1
        }}>
          <Fab
            color="secondary"
            size="medium"
            aria-label="add material"
            onClick={() => handleOpenAddItemDialog("material")}
            sx={{ backgroundColor: "#4caf50", "&:hover": { backgroundColor: "#45a049" } }}
          >
            <Add />
          </Fab>
          <Typography variant="caption" sx={{ textAlign: "center", color: "text.secondary" }}>
            Material
          </Typography>
          
          <Fab
            color="secondary"
            size="medium"
            aria-label="add herraje"
            onClick={() => handleOpenAddItemDialog("herraje")}
            sx={{ backgroundColor: "#ff9800", "&:hover": { backgroundColor: "#f57c00" } }}
          >
            <Add />
          </Fab>
          <Typography variant="caption" sx={{ textAlign: "center", color: "text.secondary" }}>
            Herraje
          </Typography>
          
          <Fab
            color="secondary"
            size="medium"
            aria-label="add vidrio"
            onClick={() => handleOpenAddItemDialog("vidrio")}
            sx={{ backgroundColor: "#2196f3", "&:hover": { backgroundColor: "#1976d2" } }}
          >
            <Add />
          </Fab>
          <Typography variant="caption" sx={{ textAlign: "center", color: "text.secondary" }}>
            Vidrio
          </Typography>
        </Box>
        
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
            label="Alto (cm)"
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
            label="Ancho (cm)"
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
        {/* SELECCIÓN DE COLOR */}
        <Typography variant="h6" gutterBottom sx={{ textAlign: "center", mt: 4, color: "black" }}>
          Seleccionar Color del Material
        </Typography>
        <Box sx={{ mb: 4, width: "300px", margin: "0 auto" }}>
          <Autocomplete
            options={colorsOptions}
            getOptionLabel={(option) => `${option.name} ${option.percentage > 0 ? `(+${option.percentage}%)` : option.percentage < 0 ? `(${option.percentage}%)` : '(Base)'}`}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={selectedColor}
            onChange={(event, newValue) => setSelectedColor(newValue)}
            renderOption={(props, option) => (
              <li {...props}>
                <Box>
                  <Typography variant="body2">{option.name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {option.percentage === 0 ? 'Precio base' : 
                     option.percentage > 0 ? `+${option.percentage}% sobre precio base` : 
                     `${option.percentage}% sobre precio base`}
                  </Typography>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} label="Seleccionar Color" variant="outlined" />
            )}
          />
        </Box>

        {/* SELECCIÓN DE VIDRIO */}
        <Typography variant="h6" gutterBottom sx={{ textAlign: "center", mt: 4, color: "black" }}>
          Seleccionar Vidrio
        </Typography>
        <Box sx={{ mb: 4, width: "300px", margin: "0 auto" }}>
          <Autocomplete
            options={glassesOptions}
            getOptionLabel={(option) => `${option.name} - $${option.priceInstalled || option.price || 0}/m²`}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={selectedGlass}
            onChange={(event, newValue) => handleSelectGlass(newValue)}
            renderOption={(props, option) => (
              <li {...props}>
                <Box>
                  <Typography variant="body2">{option.name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    ${option.priceInstalled || option.price || 0}/m²
                  </Typography>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} label="Seleccionar Vidrio" variant="outlined" />
            )}
          />
          {selectedGlass && (selectedGlass.priceInstalled === 0 || selectedGlass.price === 0) && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              ⚠️ El vidrio seleccionado tiene precio $0. Esto causará que el total sea incorrecto.
            </Alert>
          )}
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
                    const heightInMeters = parseFloat(dimensions.height) / 100;
                    const widthInMeters = parseFloat(dimensions.width) / 100;
                    const meterage = calculatePrice(glass.formula, {
                      PRECIO: 1,
                      ALTO: heightInMeters,
                      ANCHO: widthInMeters,
                    });
                    const glassPrice = selectedGlass ? parseFloat(selectedGlass.priceInstalled || selectedGlass.price || "0") : 0;
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

            {/* Mano de Obra */}
            <Typography variant="h5" sx={{ mt: 4, color: "black" }}>
              Mano de Obra
            </Typography>
            <TableContainer sx={{ mb: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Concepto</TableCell>
                    <TableCell>Detalle</TableCell>
                    <TableCell>Costo Para Cotización ($)</TableCell>
                    <TableCell>Costo Real Para Trabajador ($)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Mano de Obra - Aluminio</TableCell>
                    <TableCell>{modelData.manpower}% sobre materiales</TableCell>
                    <TableCell>${calculations.laborCost.toFixed(2)}</TableCell>
                    <TableCell>${calculations.laborCostActual}</TableCell>
                  </TableRow>
                  {calculations.glassesCalc.meterage > 0 && (
                    <TableRow>
                      <TableCell>Mano de Obra - Vidrio</TableCell>
                      <TableCell>{calculations.glassesCalc.meterage.toFixed(2)} m² × $${modelData.m2 || 100}/m²</TableCell>
                      <TableCell>Incluido en precio del vidrio</TableCell>
                      <TableCell>${calculations.glassLaborCost}</TableCell>
                    </TableRow>
                  )}
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>TOTAL MANO DE OBRA</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Para orden de trabajo</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>-</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>${calculations.totalLaborActual}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
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
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontWeight: 'normal' }}>
              * El carrito se guarda automáticamente y persiste entre sesiones
            </Typography>
          </DialogTitle>
          <DialogContent>
            {/* Total del Proyecto - Prominente */}
            <Paper sx={{ p: 3, mb: 3, backgroundColor: '#e8f5e8', border: '2px solid #4caf50' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: '#2e7d32', fontWeight: 'bold', mb: 1 }}>
                  TOTAL DEL PROYECTO
                </Typography>
                <Typography variant="h3" sx={{ color: '#1b5e20', fontWeight: 'bold' }}>
                  ${getCartTotal().toFixed(2)}
                </Typography>
                <Typography variant="subtitle1" sx={{ color: '#4caf50', mt: 1 }}>
                  {cart.length} elemento{cart.length !== 1 ? 's' : ''} en el carrito
                </Typography>
              </Box>
            </Paper>
            {cart.length === 0 ? (
              <Typography>El carrito está vacío</Typography>
            ) : (
              <>
                {/* Tabla de elementos del carrito */}
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Elementos en el Carrito ({cart.length})
                </Typography>
                <TableContainer sx={{ mb: 4 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Nombre</TableCell>
                        <TableCell>Detalles</TableCell>
                        <TableCell>Total</TableCell>
                        <TableCell>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cart.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Chip 
                              label={item.type === "individual" ? item.itemType : "modelo"} 
                              color={item.type === "individual" ? "secondary" : "primary"}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {item.type === "individual" ? item.itemData.name : item.modelName}
                          </TableCell>
                          <TableCell>
                            {item.type === "individual" ? (
                              <Box>
                                <Typography variant="body2">
                                  {item.itemData.quantity} {item.itemData.quantityType}
                                </Typography>
                                {item.itemData.dimensions && (
                                  <Typography variant="caption" color="textSecondary">
                                    {item.itemData.dimensions.height} x {item.itemData.dimensions.width} cm
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              <Box>
                                <Typography variant="body2">
                                  {item.dimensions.height} x {item.dimensions.width} cm
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  Vidrio: {item.selectedGlass.name} (${item.selectedGlass.priceInstalled || item.selectedGlass.price || 0}/m²)
                                </Typography>
                                {item.selectedColor && (
                                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                                    Color: {item.selectedColor.name} (+{item.selectedColor.percentage}%)
                                  </Typography>
                                )}
                                <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                                  Mat: ${item.calculations.materialsCalc.price.toFixed(2)} | 
                                  Her: ${item.calculations.chapesCalc.price.toFixed(2)} | 
                                  Vid: ${item.calculations.glassesCalc.price.toFixed(2)} | 
                                  M.O.: ${item.calculations.laborCost.toFixed(2)}
                                </Typography>
                              </Box>
                            )}
                          </TableCell>
                          <TableCell>
                            ${(item.type === "individual" ? item.itemData.totalPrice : item.calculations.totalGeneral).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              
                              <IconButton 
                                color="error" 
                                onClick={() => removeFromCart(item.id)}
                                title="Eliminar"
                              >
                                <Delete />
                              </IconButton>
                            </Box>
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
              <>
                <Button 
                  color="error"
                  onClick={() => {
                    if (window.confirm('¿Está seguro de que desea limpiar todo el carrito? Esta acción no se puede deshacer.')) {
                      setCart([]);
                      localStorage.removeItem('aluminios-cart');
                      setSnackbar({ 
                        open: true, 
                        message: "Carrito limpiado exitosamente.", 
                        severity: "success" 
                      });
                    }
                  }}
                >
                  Limpiar Carrito
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<Save />}
                  onClick={() => setShowProjectDialog(true)}
                >
                  Guardar Proyecto
                </Button>
              </>
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



        {/* Diálogo para Agregar Elementos Individuales */}
        <Dialog open={showAddItemDialog} onClose={() => setShowAddItemDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Agregar {addItemType === "material" ? "Material" : addItemType === "herraje" ? "Herraje" : "Vidrio"}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              {addItemType === "material" && (
                <>
                  <Autocomplete
                    options={materialsOptions}
                    getOptionLabel={(option) => `${option.name} - $${option.price}/tramo`}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    value={selectedMaterial}
                    onChange={(event, newValue) => setSelectedMaterial(newValue)}
                    renderOption={(props, option) => (
                      <li {...props}>
                        {option.name} - ${option.price}/tramo
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField {...params} label="Seleccionar Material" variant="outlined" sx={{ mb: 2 }} />
                    )}
                  />
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Tipo de Cantidad</InputLabel>
                    <Select
                      value={itemQuantityType}
                      label="Tipo de Cantidad"
                      onChange={(e) => setItemQuantityType(e.target.value)}
                    >
                      <MenuItem value="metros">Por metros</MenuItem>
                      <MenuItem value="tramos">Por tramos</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label={itemQuantityType === "metros" ? "Cantidad (metros)" : "Cantidad (tramos)"}
                    type="number"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(parseFloat(e.target.value) || 1)}
                    inputProps={{ min: 0.1, step: 0.1 }}
                    sx={{ mb: 2 }}
                  />

                  {selectedMaterial && (
                    <Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
                      <Typography variant="subtitle2">Resumen:</Typography>
                      <Typography variant="body2">
                        Material: {selectedMaterial.name}
                      </Typography>
                      <Typography variant="body2">
                        Tramo estándar: {selectedMaterial.stretch || 6.1} metros
                      </Typography>
                      {itemQuantityType === "metros" ? (
                        <>
                          <Typography variant="body2">
                            Cantidad: {itemQuantity} metros
                          </Typography>
                          <Typography variant="body2">
                            Equivale a: {(itemQuantity / (selectedMaterial.stretch || 6.1)).toFixed(2)} tramos
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                            Precio total: ${((itemQuantity / (selectedMaterial.stretch || 6.1)) * parseFloat(selectedMaterial.price || 0)).toFixed(2)}
                          </Typography>
                        </>
                      ) : (
                        <>
                          <Typography variant="body2">
                            Cantidad: {itemQuantity} tramos
                          </Typography>
                          <Typography variant="body2">
                            Equivale a: {itemQuantity * (selectedMaterial.stretch || 6.1)} metros
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                            Precio total: ${(itemQuantity * parseFloat(selectedMaterial.price || 0)).toFixed(2)}
                          </Typography>
                        </>
                      )}
                    </Box>
                  )}
                </>
              )}

              {addItemType === "herraje" && (
                <>
                  <Autocomplete
                    options={chapesOptions}
                    getOptionLabel={(option) => `${option.name} - $${option.price}/pieza`}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    value={selectedHerraje}
                    onChange={(event, newValue) => setSelectedHerraje(newValue)}
                    renderOption={(props, option) => (
                      <li {...props} key={option.id}>
                        {option.name} - ${option.price}/pieza
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField {...params} label="Seleccionar Herraje" variant="outlined" sx={{ mb: 2 }} />
                    )}
                  />

                  <TextField
                    fullWidth
                    label="Cantidad (piezas)"
                    type="number"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(parseFloat(e.target.value) || 1)}
                    inputProps={{ min: 1, step: 1 }}
                    sx={{ mb: 2 }}
                  />

                  {selectedHerraje && (
                    <Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
                      <Typography variant="subtitle2">Resumen:</Typography>
                      <Typography variant="body2">
                        Herraje: {selectedHerraje.name}
                      </Typography>
                      <Typography variant="body2">
                        Cantidad: {itemQuantity} piezas
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        Precio total: ${(itemQuantity * parseFloat(selectedHerraje.price || 0)).toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                </>
              )}

              {addItemType === "vidrio" && (
                <>
                  <Autocomplete
                    options={glassesOptions.filter(glass => glass.status !== "inactive")}
                    getOptionLabel={(option) => `${option.name} - $${option.price || option.priceInstalled}/m²`}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    value={selectedVidrio}
                    onChange={(event, newValue) => setSelectedVidrio(newValue)}
                    renderOption={(props, option) => (
                      <li {...props}>
                        {option.name} - ${option.price || option.priceInstalled}/m²
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField {...params} label="Seleccionar Vidrio" variant="outlined" sx={{ mb: 2 }} />
                    )}
                  />

                  <FormControl component="fieldset" sx={{ mb: 2 }}>
                    <RadioGroup
                      value={itemQuantityType}
                      onChange={(e) => setItemQuantityType(e.target.value)}
                    >
                      <FormControlLabel 
                        value="m2" 
                        control={<Radio />} 
                        label="Especificar metros cuadrados directamente" 
                      />
                      <FormControlLabel 
                        value="dimensiones" 
                        control={<Radio />} 
                        label="Calcular por dimensiones" 
                      />
                    </RadioGroup>
                  </FormControl>

                  {itemQuantityType === "m2" ? (
                    <TextField
                      fullWidth
                      label="Área (m²)"
                      type="number"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseFloat(e.target.value) || 1)}
                      inputProps={{ min: 0.1, step: 0.1 }}
                      sx={{ mb: 2 }}
                    />
                  ) : (
                    <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                      <TextField
                        fullWidth
                        label="Alto (cm)"
                        type="number"
                        value={itemDimensions.height}
                        onChange={(e) => setItemDimensions({ ...itemDimensions, height: e.target.value })}
                        inputProps={{ min: 1, step: 0.1 }}
                      />
                      <TextField
                        fullWidth
                        label="Ancho (cm)"
                        type="number"
                        value={itemDimensions.width}
                        onChange={(e) => setItemDimensions({ ...itemDimensions, width: e.target.value })}
                        inputProps={{ min: 1, step: 0.1 }}
                      />
                    </Box>
                  )}

                  {selectedVidrio && (
                    <Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
                      <Typography variant="subtitle2">Resumen:</Typography>
                      <Typography variant="body2">
                        Vidrio: {selectedVidrio.name}
                      </Typography>
                      {itemQuantityType === "dimensiones" && itemDimensions.height && itemDimensions.width ? (
                        <>
                          <Typography variant="body2">
                            Dimensiones: {itemDimensions.height} x {itemDimensions.width} cm
                          </Typography>
                          <Typography variant="body2">
                            Área: {((parseFloat(itemDimensions.height) / 100) * (parseFloat(itemDimensions.width) / 100)).toFixed(2)} m²
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                            Precio total: ${(((parseFloat(itemDimensions.height) / 100) * (parseFloat(itemDimensions.width) / 100)) * parseFloat(selectedVidrio.price || selectedVidrio.priceInstalled || 0)).toFixed(2)}
                          </Typography>
                        </>
                      ) : itemQuantityType === "m2" ? (
                        <>
                          <Typography variant="body2">
                            Área: {itemQuantity} m²
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                            Precio total: ${(itemQuantity * parseFloat(selectedVidrio.price || selectedVidrio.priceInstalled || 0)).toFixed(2)}
                          </Typography>
                        </>
                      ) : null}
                    </Box>
                  )}
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAddItemDialog(false)}>Cancelar</Button>
            <Button 
              variant="contained" 
              onClick={addIndividualItemToCart}
              disabled={
                (addItemType === "material" && !selectedMaterial) ||
                (addItemType === "herraje" && !selectedHerraje) ||
                (addItemType === "vidrio" && !selectedVidrio)
              }
            >
              Agregar al Carrito
            </Button>
          </DialogActions>
        </Dialog>

      </>
    );
  }
}
