// Funciones temporales para agregar al archivo principal

// Función para agregar elemento individual al proyecto
const handleAddIndividualItem = (project) => {
  if (project.status !== 'quotation') {
    setSnackbar({
      open: true,
      message: "Solo se pueden agregar elementos a proyectos en cotización.",
      severity: "error"
    });
    return;
  }

  setAddingToProject(project);
  setShowAddIndividualItemDialog(true);
  setIndividualItemType("material");
  setSelectedIndividualMaterial(null);
  setSelectedIndividualHerraje(null);
  setSelectedIndividualVidrio(null);
  setIndividualItemQuantity(1);
  setIndividualItemQuantityType("metros");
  setIndividualItemDimensions({ height: "", width: "" });
  setIndividualItemPriceType("installed");
};

// Función para confirmar agregar elemento individual
const confirmAddIndividualItem = async () => {
  try {
    let itemData;
    let selectedItem;

    switch (individualItemType) {
      case "material":
        if (!selectedIndividualMaterial) {
          setSnackbar({ open: true, message: "Selecciona un material.", severity: "error" });
          return;
        }
        selectedItem = selectedIndividualMaterial;
        const materialPrice = parseFloat(selectedItem.price || "0");
        const materialStretch = parseFloat(selectedItem.stretch || "6.1");
        
        let total, unitPrice, meters = 0;
        
        if (individualItemQuantityType === "metros") {
          unitPrice = materialPrice;
          meters = individualItemQuantity;
          total = materialPrice / materialStretch * meters;
        } else { // tramos
          unitPrice = materialPrice * materialStretch;
          total = individualItemQuantity * unitPrice;
          meters = individualItemQuantity * materialStretch;
        }

        itemData = {
          type: "individual",
          itemType: "material",
          itemId: selectedItem.id,
          itemName: selectedItem.name,
          quantity: individualItemQuantity,
          quantityType: individualItemQuantityType,
          unitPrice: unitPrice,
          total: total,
          status: "cotizacion",
          meters: meters,
          tramo: materialStretch
        };
        break;

      case "herraje":
        if (!selectedIndividualHerraje) {
          setSnackbar({ open: true, message: "Selecciona un herraje.", severity: "error" });
          return;
        }
        selectedItem = selectedIndividualHerraje;
        const herrajePrice = parseFloat(selectedItem.price || "0");
        
        itemData = {
          type: "individual",
          itemType: "herraje",
          itemId: selectedItem.id,
          itemName: selectedItem.name,
          quantity: individualItemQuantity,
          quantityType: "piezas",
          unitPrice: herrajePrice,
          total: individualItemQuantity * herrajePrice,
          status: "cotizacion"
        };
        break;

      case "vidrio":
        if (!selectedIndividualVidrio) {
          setSnackbar({ open: true, message: "Selecciona un vidrio.", severity: "error" });
          return;
        }
        selectedItem = selectedIndividualVidrio;
        
        const vidrioPrice = parseFloat(individualItemPriceType === "installed" 
          ? (selectedItem.priceInstalled || "0") 
          : (selectedItem.price || "0"));
        
        let area, vidrioTotal;
        
        if (individualItemQuantityType === "m2") {
          area = individualItemQuantity;
          vidrioTotal = individualItemQuantity * vidrioPrice;
        } else { // por dimensiones
          if (!individualItemDimensions.height || !individualItemDimensions.width) {
            setSnackbar({ open: true, message: "Ingresa las dimensiones del vidrio.", severity: "error" });
            return;
          }
          area = (parseFloat(individualItemDimensions.height) * parseFloat(individualItemDimensions.width)) / 10000;
          vidrioTotal = area * vidrioPrice;
        }

        itemData = {
          type: "individual",
          itemType: "vidrio",
          itemId: selectedItem.id,
          itemName: selectedItem.name,
          quantity: individualItemQuantity,
          quantityType: individualItemQuantityType,
          unitPrice: vidrioPrice,
          total: vidrioTotal,
          status: "cotizacion",
          dimensions: individualItemQuantityType === "dimensiones" ? { 
            height: individualItemDimensions.height, 
            width: individualItemDimensions.width,
            unit: "cm"
          } : null,
          area: area,
          priceType: individualItemPriceType
        };
        break;

      default:
        setSnackbar({ open: true, message: "Tipo de elemento no válido.", severity: "error" });
        return;
    }

    const project = projects.find(p => p.id === addingToProject.id);
    if (!project) return;

    const updatedItems = [...project.items, itemData];
    const newTotal = updatedItems.reduce((sum, item) => sum + (item.total || 0), 0);

    await updateDoc(doc(db, "projects", addingToProject.id), {
      items: updatedItems,
      total: newTotal
    });

    setSnackbar({
      open: true,
      message: "Elemento agregado al proyecto exitosamente.",
      severity: "success"
    });

    setShowAddIndividualItemDialog(false);
    setAddingToProject(null);
    await fetchProjects();
    
    // Actualizar selectedProject si está abierto el modal de detalles
    if (showDetailsDialog && selectedProject?.id === addingToProject.id) {
      const updatedProjectDoc = await getDoc(doc(db, "projects", addingToProject.id));
      if (updatedProjectDoc.exists()) {
        setSelectedProject({ id: updatedProjectDoc.id, ...updatedProjectDoc.data() });
      }
    }
  } catch (error) {
    console.error("Error adding individual item to project: ", error);
    setSnackbar({
      open: true,
      message: "Error al agregar el elemento al proyecto.",
      severity: "error"
    });
  }
};
