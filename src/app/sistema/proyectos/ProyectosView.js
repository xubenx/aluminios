import React from "react";
import Image from "next/image";
import { getModelImageURL } from "../../../utils/imageStorage";
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  Divider,
  Paper,
  Collapse,
  Autocomplete,
  MenuItem
} from "@mui/material";
import {
  Visibility,
  Edit,
  Person,
  CalendarToday,
  AttachMoney,
  Close,
  ExpandMore,
  ExpandLess,
  Assignment,
  LocationOn,
  FilterList,
  Add,
  Block,
} from "@mui/icons-material";

// Componente de imagen con caché mejorado
const CachedImage = ({ modelId, modelName, height = 200, width = "100%", imageCache, setImageCache }) => {
  const [imageLoaded, setImageLoaded] = React.useState(imageCache.has(modelId));
  const [imageError, setImageError] = React.useState(false);
  const [imageSrc, setImageSrc] = React.useState('');

  React.useEffect(() => {
    const loadImage = async () => {
      try {
        const imageUrl = await getModelImageURL(modelId);
        setImageSrc(imageUrl || '/images/placeholder.png');
      } catch (error) {
        console.error('Error loading image:', error);
        setImageSrc('/images/placeholder.png');
        setImageError(true);
      }
    };

    loadImage();
  }, [modelId]);

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

const ProyectosView = ({
  // Estados del controlador
  filteredProjects,
  searchQuery,
  setSearchQuery,
  selectedProject,
  showDetailsDialog,
  setShowDetailsDialog,
  editProject,
  setEditProject,
  showEditDialog,
  setShowEditDialog,

  isMobile,
  expandedModels,
  employees,
  editingModel,
  setEditingModel,
  showModelEditDialog,
  setShowModelEditDialog,
  showPaymentDialog,
  handleClosePaymentDialog,
  paymentProject,
  paymentAmount,
  setPaymentAmount,
  paymentDescription,
  setPaymentDescription,
  paymentMethod,
  setPaymentMethod,
  showActivateDialog,
  setShowActivateDialog,
  activatingProject,
  initialPayment,
  setInitialPayment,
  adjustedTotal,
  setAdjustedTotal,
  showInactive,
  setShowInactive,
  showAddModelDialog,
  setShowAddModelDialog,
  addingToProject,
  filteredModels,
  modelSearchQuery,
  setModelSearchQuery,
  selectedModelToAdd,
  modelData,
  materialsOptions,
  chapesOptions,
  glassesOptions,
  colorsOptions,
  dimensions,
  setDimensions,
  selectedGlass,
  setSelectedGlass,
  showRecalcDialog,
  setShowRecalcDialog,
  recalcModel,
  recalcDimensions,
  setRecalcDimensions,
  recalcSelectedGlass,
  setRecalcSelectedGlass,
  recalcSelectedColor,
  setRecalcSelectedColor,
  showRecalcIndividualDialog,
  setShowRecalcIndividualDialog,
  recalcIndividualItem,
  recalcIndividualQuantity,
  setRecalcIndividualQuantity,
  recalcIndividualQuantityType,
  setRecalcIndividualQuantityType,
  recalcIndividualDimensions,
  setRecalcIndividualDimensions,

  recalcIndividualPriceType,
  setRecalcIndividualPriceType,
  recalcIndividualPreview,
  showAddIndividualItemDialog,
  setShowAddIndividualItemDialog,
  individualItemType,
  setIndividualItemType,
  selectedIndividualMaterial,
  setSelectedIndividualMaterial,
  selectedIndividualHerraje,
  setSelectedIndividualHerraje,
  selectedIndividualVidrio,
  setSelectedIndividualVidrio,
  individualItemQuantity,
  setIndividualItemQuantity,
  individualItemQuantityType,
  setIndividualItemQuantityType,
  individualItemDimensions,
  setIndividualItemDimensions,
  individualItemPriceType,
  setIndividualItemPriceType,
  showMassStatusDialog,
  setShowMassStatusDialog,
  massStatusProject,
  massStatusValue,
  setMassStatusValue,
  individualItemCalculation,
  individualItemTotal,
  imageCache,
  setImageCache,

  // Funciones del controlador
  getProjectCategoricalTotals,
  toggleModelExpansion,
  getModelStatusColor,
  getModelStatusText,
  getEmployeeName,
  getAvailableStatusOptions,
  handleViewDetails,
  handleEditProject,
  handleSaveEdit,
  handleActivateProject,
  handleInactivateProject,
  handleOpenPaymentDialog,
  handleAddPayment,
  handleEditModel,
  handleSaveModelEdit,
  handleDeleteModel,
  handleAddModelToProject,
  handleSelectModelToAdd,
  getCalculations,
  addModelToProject,
  handleRecalcModel,
  getRecalcCalculations,
  confirmRecalcModel,
  handleAddIndividualItem,
  confirmAddIndividualItem,
  handleRecalcIndividualItem,
  confirmRecalcIndividualItem,
  formatCurrency,
  getStatusColor,
  getStatusText,
  handleMassStatusChange,
  confirmMassStatusChange,
}) => {
  return (
    <Box sx={{ 
      padding: { xs: 2, sm: 3 }, 
      maxWidth: "1400px", 
      margin: "0 auto",
      minHeight: '100vh'
    }}>
      <Typography variant="h4" align="center" sx={{ 
        mb: 3, 
        color: "black",
        fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
      }}>
        Gestión de Proyectos
      </Typography>

      {/* Barra de búsqueda y filtros */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Buscar proyectos por nombre o cliente"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          alignItems: 'center', 
          flexWrap: 'wrap',
          justifyContent: { xs: 'center', sm: 'flex-start' }
        }}>
          <FilterList sx={{ color: 'gray' }} />
          <Button
            variant={showInactive ? "contained" : "outlined"}
            size="small"
            startIcon={<Block />}
            onClick={() => setShowInactive(!showInactive)}
            color="error"
            sx={{ minWidth: 'auto' }}
          >
            {showInactive ? 'Ocultar Inactivos' : 'Mostrar Inactivos'}
          </Button>
          
        
        </Box>
      </Box>

      {/* Lista de proyectos */}
      <Grid container spacing={3}>
        {filteredProjects.map((project) => (
          <Grid item xs={12} sm={6} md={4} lg={4} key={project.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6" sx={{ color: "black", fontWeight: 'bold', flex: 1, minWidth: 0 }}>
                    {project.name}
                  </Typography>
                  <Chip 
                    label={getStatusText(project.status)} 
                    color={getStatusColor(project.status)}
                    size="small"
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Person sx={{ mr: 1, fontSize: 20, color: 'gray' }} />
                  <Typography variant="body2" color="textSecondary" sx={{ wordBreak: 'break-word' }}>
                    {project.customerName}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarToday sx={{ mr: 1, fontSize: 20, color: 'gray' }} />
                  <Typography variant="body2" color="textSecondary">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <AttachMoney sx={{ mr: 1, fontSize: 20, color: 'gray', mt: 0.5 }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'green' }}>
                      Total: ${project.total.toFixed(2)}
                    </Typography>
                    {project.debt !== undefined && (
                      <Typography variant="body2" sx={{ color: project.debt > 0 ? 'orange' : 'green' }}>
                        {project.debt > 0 ? `Deuda: $${project.debt.toFixed(2)}` : 'Pagado completamente'}
                      </Typography>
                    )}
                    {project.payments && project.payments.length > 0 && (
                      <Typography variant="body2" color="textSecondary">
                        {project.payments.length} pago{project.payments.length !== 1 ? 's' : ''} registrado{project.payments.length !== 1 ? 's' : ''}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {project.items.length} modelo{project.items.length !== 1 ? 's' : ''}
                </Typography>

                {/* Botones de acción */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => handleViewDetails(project)}
                    sx={{ minWidth: 'auto', flexGrow: { xs: 1, sm: 0 } }}
                  >
                    Ver Detalles
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={() => handleEditProject(project)}
                    sx={{ minWidth: 'auto', flexGrow: { xs: 1, sm: 0 } }}
                  >
                    Editar
                  </Button>
                  {project.status === 'active' && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      startIcon={<AttachMoney />}
                      onClick={() => handleOpenPaymentDialog(project)}
                      sx={{ minWidth: 'auto', flexGrow: { xs: 1, sm: 0 } }}
                    >
                      Pagos
                    </Button>
                  )}
                  {project.status === 'quotation' && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<Block />}
                      onClick={() => handleInactivateProject(project.id, project.status)}
                      sx={{ minWidth: 'auto', flexGrow: { xs: 1, sm: 0 } }}
                    >
                      Inactivar
                    </Button>
                  )}
                  {project.status === 'inactive' && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      startIcon={<Add />}
                      onClick={() => handleInactivateProject(project.id, project.status)}
                      sx={{ minWidth: 'auto', flexGrow: { xs: 1, sm: 0 } }}
                    >
                      Reactivar
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredProjects.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="textSecondary">
            {searchQuery ? 'No se encontraron proyectos con ese criterio' : 'No hay proyectos disponibles'}
          </Typography>
        </Box>
      )}

      {/* Diálogo de detalles del proyecto */}
      <Dialog 
        open={showDetailsDialog} 
        onClose={() => setShowDetailsDialog(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1
        }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            Detalles del Proyecto: {selectedProject?.name}
          </Box>
          <IconButton onClick={() => setShowDetailsDialog(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedProject && (
            <Box>
              {/* Información general del proyecto */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">Cliente:</Typography>
                    <Typography variant="h6" sx={{ wordBreak: 'break-word' }}>{selectedProject.customerName}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">Estado:</Typography>
                    <Chip 
                      label={getStatusText(selectedProject.status)} 
                      color={getStatusColor(selectedProject.status)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">Fecha de Creación:</Typography>
                    <Typography>{new Date(selectedProject.createdAt).toLocaleDateString()}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">Total del Proyecto:</Typography>
                    <Typography variant="h5" sx={{ color: 'green', fontWeight: 'bold' }}>
                      ${selectedProject.total.toFixed(2)}
                    </Typography>
                  </Grid>
                  {selectedProject.debt !== undefined && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="textSecondary">Deuda:</Typography>
                      <Typography variant="h6" sx={{ color: selectedProject.debt > 0 ? 'orange' : 'green', fontWeight: 'bold' }}>
                        ${selectedProject.debt.toFixed(2)}
                      </Typography>
                    </Grid>
                  )}
                  {selectedProject.payments && selectedProject.payments.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="textSecondary">Pagos registrados:</Typography>
                      <Typography>
                        {selectedProject.payments.length} pago{selectedProject.payments.length !== 1 ? 's' : ''} por un total de $
                        {selectedProject.payments.reduce((sum, payment) => sum + payment.amount, 0).toFixed(2)}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>

              {/* Resumen por categorías */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Resumen por Categorías
                </Typography>
                {(() => {
                  const totals = getProjectCategoricalTotals(selectedProject);
                  return (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle2" color="textSecondary">Materiales:</Typography>
                        <Typography variant="h6" sx={{ color: 'blue', fontWeight: 'bold' }}>
                          ${totals.materials.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle2" color="textSecondary">Herrajes:</Typography>
                        <Typography variant="h6" sx={{ color: 'orange', fontWeight: 'bold' }}>
                          ${totals.herrajes.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle2" color="textSecondary">Vidrios:</Typography>
                        <Typography variant="h6" sx={{ color: 'cyan', fontWeight: 'bold' }}>
                          ${totals.vidrios.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="subtitle2" color="textSecondary">Mano de Obra:</Typography>
                        <Typography variant="h6" sx={{ color: 'green', fontWeight: 'bold' }}>
                          ${totals.laborCost.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2" color="textSecondary">Total Calculado:</Typography>
                        <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                          ${totals.total.toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>
                  );
                })()}
              </Paper>

              {/* Lista de modelos en el proyecto */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6">
                  Modelos en el Proyecto ({selectedProject.items.length})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedProject.status === 'active' && (
                    <>
                      <Button
                        variant="outlined"
                        color="success"
                        startIcon={<AttachMoney />}
                        onClick={() => handleOpenPaymentDialog(selectedProject)}
                        size="small"
                        sx={{ minWidth: 'auto' }}
                      >
                        Gestionar Pagos
                      </Button>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<Assignment />}
                        onClick={() => handleMassStatusChange(selectedProject)}
                        size="small"
                        sx={{ minWidth: 'auto' }}
                      >
                        Cambiar Estados
                      </Button>
                    </>
                  )}
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleAddModelToProject(selectedProject)}
                    size="small"
                    sx={{ minWidth: 'auto' }}
                  >
                    Agregar Modelo
                  </Button>
                  {selectedProject.status === 'quotation' && (
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<Add />}
                      onClick={() => handleAddIndividualItem(selectedProject)}
                      size="small"
                      sx={{ minWidth: 'auto' }}
                    >
                      Agregar Elemento
                    </Button>
                  )}
                </Box>
              </Box>
              
              {selectedProject.items.map((item, index) => {
                const expansionKey = `${selectedProject.id}-${index}`;
                const isExpanded = expandedModels[expansionKey];
                
                return (
                  <Paper key={index} sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="h6" sx={{ color: 'primary.main', flex: 1, minWidth: 0, wordBreak: 'break-word' }}>
                        {item.type === 'individual' ? `${item.itemName} (Individual)` : item.modelName}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Chip 
                          label={getModelStatusText(item.status || 'cotizacion')} 
                          color={getModelStatusColor(item.status || 'cotizacion')}
                          size="small"
                        />
                        
                        {/* Botones para proyectos en cotización */}
                        {selectedProject.status === 'quotation' && (
                          <>
                            {item.type !== 'individual' ? (
                              <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                onClick={() => handleRecalcModel(selectedProject, index)}
                                sx={{ minWidth: 'auto' }}
                              >
                                Re-cotizar
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                onClick={() => handleRecalcIndividualItem(selectedProject, index)}
                                sx={{ minWidth: 'auto' }}
                              >
                                Re-cotizar
                              </Button>
                            )}
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleDeleteModel(selectedProject, index)}
                              sx={{ minWidth: 'auto' }}
                            >
                              Eliminar
                            </Button>
                          </>
                        )}
                        
                        <Button
                          size="small"
                          startIcon={<Edit />}
                          onClick={() => handleEditModel(selectedProject, index)}
                          sx={{ minWidth: 'auto' }}
                        >
                          Editar
                        </Button>
                        <IconButton
                          onClick={() => toggleModelExpansion(selectedProject.id, index)}
                          size="small"
                        >
                          {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Box>
                    </Box>
                    
                    {item.type === 'individual' ? (
                      // Renderizado para elementos individuales
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">Tipo:</Typography>
                          <Typography>{item.itemType?.charAt(0).toUpperCase() + item.itemType?.slice(1)}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">Cantidad:</Typography>
                          <Typography>{item.quantity || 1}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">Precio Unitario:</Typography>
                          <Typography>{formatCurrency(item.unitPrice || 0)}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">Total:</Typography>
                          <Typography variant="h6" sx={{ color: 'green' }}>
                            {formatCurrency(item.total || 0)}
                          </Typography>
                        </Grid>
                        {item.dimensions && (
                          <>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="subtitle2" color="textSecondary">Dimensiones:</Typography>
                              <Typography>
                                {item.dimensions.height} x {item.dimensions.width}
                              </Typography>
                            </Grid>
                          </>
                        )}
                        <Grid item xs={6} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">Área/Ubicación:</Typography>
                          <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                            <LocationOn sx={{ fontSize: 16, mr: 0.5, color: 'gray' }} />
                            {item.area || 'Sin especificar'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">Colaborador:</Typography>
                          <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                            <Assignment sx={{ fontSize: 16, mr: 0.5, color: 'gray' }} />
                            {getEmployeeName(item.assignedEmployeeId)}
                          </Typography>
                        </Grid>
                      </Grid>
                    ) : (
                      // Renderizado para modelos completos
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">Dimensiones:</Typography>
                          <Typography>
                            {item.dimensions ? `${item.dimensions.height} x ${item.dimensions.width}` : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">Vidrio:</Typography>
                          <Typography>
                            {item.selectedGlass ? item.selectedGlass.name : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">Color:</Typography>
                          <Typography>
                            {item.selectedColor ? item.selectedColor.name : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">Área/Ubicación:</Typography>
                          <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                            <LocationOn sx={{ fontSize: 16, mr: 0.5, color: 'gray' }} />
                            {item.area || 'Sin especificar'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="subtitle2" color="textSecondary">Colaborador:</Typography>
                          <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                            <Assignment sx={{ fontSize: 16, mr: 0.5, color: 'gray' }} />
                            {getEmployeeName(item.assignedEmployeeId)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="textSecondary">Total:</Typography>
                          <Typography variant="h6" sx={{ color: 'green' }}>
                            {formatCurrency(item.total || 0)}
                          </Typography>
                        </Grid>
                      </Grid>
                    )}

                    {/* Desglose expandible - Solo para modelos completos */}
                    {item.type !== 'individual' && (
                      <Collapse in={isExpanded}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                          Desglose de Costos:
                        </Typography>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="subtitle2" color="textSecondary">Materiales:</Typography>
                            <Typography>{formatCurrency(item.details?.materials?.price || 0)}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="subtitle2" color="textSecondary">Herrajes:</Typography>
                            <Typography>{formatCurrency(item.details?.chapes?.price || 0)}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="subtitle2" color="textSecondary">Vidrios:</Typography>
                            <Typography>{formatCurrency(item.details?.glasses?.price || 0)}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="subtitle2" color="textSecondary">Mano de Obra (Cotización):</Typography>
                            <Typography>{formatCurrency(item.details?.laborCost || 0)}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="subtitle2" color="textSecondary">Costo Final M.O.:</Typography>
                            <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                              {formatCurrency(item.laborCostSelected || item.details?.laborCost || 0)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="subtitle2" color="textSecondary">M.O. Real (Trabajador):</Typography>
                            <Box>
                              <Typography sx={{ fontSize: '0.9em', color: 'orange' }}>
                                • Aluminio: {formatCurrency(item.laborCostActual || item.details?.laborCostActual || 0)}
                              </Typography>
                              {(item.details?.glasses?.meterage || 0) > 0 && (
                                <Typography sx={{ fontSize: '0.9em', color: 'orange' }}>
                                  • Vidrio ({(item.details.glasses.meterage || 0).toFixed(2)} m²): {formatCurrency((item.details.glasses.meterage || 0) * (item.m2 || 100))}
                                </Typography>
                              )}
                              <Typography sx={{ fontWeight: 'bold', color: 'orange', borderTop: '1px solid orange', pt: 0.5 }}>
                                Total: {formatCurrency((item.laborCostActual || item.details?.laborCostActual || 0) + ((item.details?.glasses?.meterage || 0) * (item.m2 || 100)))}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        {/* Detalle de materiales */}
                        {item.details?.materials?.items?.length > 0 && (
                          <>
                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Materiales:</Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Nombre</TableCell>
                                    <TableCell align="right">Metraje</TableCell>
                                    <TableCell align="right">Precio</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {item.details.materials.items.map((material, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell>{material?.name || 'N/A'}</TableCell>
                                      <TableCell align="right">{(material?.meterage || 0).toFixed(2)}</TableCell>
                                      <TableCell align="right">{formatCurrency(material?.price || 0)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </>
                        )}

                        {/* Detalle de herrajes */}
                        {item.details?.chapes?.items?.length > 0 && (
                          <>
                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Herrajes:</Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Nombre</TableCell>
                                    <TableCell align="right">Piezas</TableCell>
                                    <TableCell align="right">Precio</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {item.details.chapes.items.map((chape, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell>{chape?.name || 'N/A'}</TableCell>
                                      <TableCell align="right">{(chape?.pieces || 0).toFixed(2)}</TableCell>
                                      <TableCell align="right">{formatCurrency(chape?.price || 0)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </>
                        )}
                      </Collapse>
                    )}
                  </Paper>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Resto de diálogos van aquí */}
      {/* Por brevedad, incluiré solo algunos diálogos principales - puedes copiar el resto del archivo original */}

      {/* Diálogo de edición */}
      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>Editar Proyecto</DialogTitle>
        <DialogContent>
          {editProject && (
            <>
              <TextField
                autoFocus
                margin="dense"
                label="Nombre del Proyecto"
                fullWidth
                variant="outlined"
                value={editProject.name}
                onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                select
                margin="dense"
                label="Estado"
                fullWidth
                variant="outlined"
                value={editProject.status}
                onChange={(e) => setEditProject({ ...editProject, status: e.target.value })}
                SelectProps={{
                  native: true,
                }}
                helperText={
                  editProject.status === 'quotation' ? 'Desde cotización puede ir a Activo o Inactivo' :
                  editProject.status === 'active' ? 'Desde activo solo puede ir a Completado (si todos los modelos están finalizados)' :
                  editProject.status === 'completed' ? 'Proyecto completado - no se puede cambiar' :
                  editProject.status === 'cancelled' ? 'Proyecto cancelado - no se puede cambiar' :
                  editProject.status === 'inactive' ? 'Proyecto inactivo - use el botón Reactivar para volver a cotización' : ''
                }
              >
                {getAvailableStatusOptions(editProject.status).map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </TextField>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveEdit}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para activar proyecto con pago inicial */}
      <Dialog open={showActivateDialog} onClose={() => setShowActivateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Activar Proyecto</DialogTitle>
        <DialogContent>
          {activatingProject && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {activatingProject.name}
              </Typography>
              
              {/* Campo para total ajustado */}
              <TextField
                label="Total del Proyecto"
                type="number"
                fullWidth
                variant="outlined"
                value={adjustedTotal || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
                    const newTotal = value === '' ? 0 : parseFloat(value);
                    setAdjustedTotal(newTotal);
                    // Ajustar anticipo sugerido al nuevo total
                    if (newTotal > 0) {
                      setInitialPayment(newTotal * 0.5);
                    }
                  }
                }}
                sx={{ mb: 2 }}
                inputProps={{ min: "0", step: "0.01" }}
                helperText={adjustedTotal !== activatingProject.total 
                  ? `Total original calculado: $${activatingProject.total.toFixed(2)}` 
                  : "Ajusta el total si el precio negociado es diferente"
                }
              />
              
              <TextField
                label="Pago inicial (Anticipo)"
                type="number"
                fullWidth
                variant="outlined"
                value={initialPayment || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
                    setInitialPayment(value === '' ? 0 : parseFloat(value));
                  }
                }}
                sx={{ mb: 2 }}
                inputProps={{ min: "0", max: adjustedTotal || 0, step: "0.01" }}
                helperText={`Sugerido: $${((adjustedTotal || 0) * 0.5).toFixed(2)} (50%)`}
              />
              <Typography variant="body2" color="textSecondary">
                Deuda restante: ${((adjustedTotal || 0) - (initialPayment || 0)).toFixed(2)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowActivateDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleActivateProject}>
            Activar Proyecto
          </Button>
        </DialogActions>
      </Dialog>

        <Dialog open={showMassStatusDialog} onClose={() => setShowMassStatusDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Cambiar Estado de Todos los Elementos</DialogTitle>
          <DialogContent>
            {massStatusProject && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {massStatusProject.name}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Esta acción cambiará el estado de todos los {massStatusProject.items.length} elementos del proyecto.
            </Typography>
            <TextField
              select
              label="Nuevo Estado"
              fullWidth
              variant="outlined"
              value={massStatusValue}
              onChange={(e) => setMassStatusValue(e.target.value)}
              SelectProps={{
            native: true,
              }}
            >
              <option value="pendiente">Pendiente</option>
              <option value="enProceso">En Proceso</option>
              <option value="instalado">Instalado</option>
              <option value="revisado">Revisado</option>
              <option value="pagada">Pagada</option>
            </TextField>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              Todos los elementos serán cambiados al estado &quot;{getModelStatusText(massStatusValue)}&quot;
            </Typography>
          </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowMassStatusDialog(false)}>Cancelar</Button>
            <Button variant="contained" onClick={confirmMassStatusChange} color="primary">
          Confirmar Cambio
            </Button>
          </DialogActions>
        </Dialog>

          <Dialog open={showModelEditDialog} onClose={() => setShowModelEditDialog(false)} maxWidth="lg" fullWidth>
            <DialogTitle>Editar Modelo</DialogTitle>
            <DialogContent>
          {editingModel && (
            <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {editingModel.modelName || editingModel.itemName}
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
          <TextField
            label="Área/Ubicación"
            fullWidth
            variant="outlined"
            value={editingModel.area || ''}
            onChange={(e) => setEditingModel({ ...editingModel, area: e.target.value })}
            sx={{ mb: 2 }}
          />
            </Grid>
            
            <Grid item xs={12} sm={6}>
          <Autocomplete
            options={employees}
            getOptionLabel={(option) => option.name || ''}
            value={employees.find(emp => emp.id === editingModel.assignedEmployeeId) || null}
            onChange={(event, newValue) => {
              setEditingModel({ ...editingModel, assignedEmployeeId: newValue ? newValue.id : '' });
            }}
            renderInput={(params) => (
              <TextField
            {...params}
            label="Colaborador Asignado"
            variant="outlined"
            fullWidth
              />
            )}
            sx={{ mb: 2 }}
          />
            </Grid>
            
            <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Estado"
            fullWidth
            variant="outlined"
            value={editingModel.status}
            onChange={(e) => setEditingModel({ ...editingModel, status: e.target.value })}
            SelectProps={{
              native: true,
            }}
            sx={{ mb: 2 }}
          >
            <option value="cotizacion">Cotización</option>
            <option value="pendiente">Pendiente</option>
            <option value="enProceso">En Proceso</option>
            <option value="instalado">Instalado</option>
            <option value="revisado">Revisado</option>
            <option value="pagada">Pagada</option>
          </TextField>
            </Grid>
            
          
            
            <Grid item xs={12} sm={6}>
          <TextField
            label="Costo M.O. Real (Trabajador)"
            type="number"
            fullWidth
            variant="outlined"
            value={editingModel.laborCostActual || 0}
            onChange={(e) => setEditingModel({ ...editingModel, laborCostActual: parseFloat(e.target.value) || 0 })}
            sx={{ mb: 2 }}
            inputProps={{ step: "0.01" }}
          />
            </Grid>
            
            <Grid item xs={12} sm={6}>
          <TextField
            label="Costo M.O. por m² (Vidrio)"
            type="number"
            fullWidth
            variant="outlined"
            value={editingModel.m2 || 100}
            onChange={(e) => setEditingModel({ ...editingModel, m2: parseFloat(e.target.value) || 100 })}
            sx={{ mb: 2 }}
            inputProps={{ step: "0.01" }}
          />
            </Grid>
          </Grid>
            </Box>
          )}
            </DialogContent>
            <DialogActions>
          <Button onClick={() => setShowModelEditDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveModelEdit}>Guardar Cambios</Button>
            </DialogActions>
          </Dialog>

          {/* Diálogo de gestión de pagos */}
      <Dialog open={showPaymentDialog} onClose={handleClosePaymentDialog} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>Gestionar Pagos</DialogTitle>
        <DialogContent>
          {paymentProject && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {paymentProject.name}
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="textSecondary">Total del Proyecto:</Typography>
                  <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    {formatCurrency(paymentProject.total)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="textSecondary">Pagado:</Typography>
                  <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                    {formatCurrency(paymentProject.total - (paymentProject.debt || 0))}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="textSecondary">Deuda:</Typography>
                  <Typography variant="h6" sx={{ color: paymentProject.debt > 0 ? 'error.main' : 'success.main', fontWeight: 'bold' }}>
                    {formatCurrency(paymentProject.debt || 0)}
                  </Typography>
                </Grid>
              </Grid>

              {/* Historial de pagos */}
              {paymentProject.payments && paymentProject.payments.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>Historial de Pagos</Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Fecha</TableCell>
                          <TableCell>Monto</TableCell>
                          <TableCell>Método</TableCell>
                          <TableCell>Descripción</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paymentProject.payments.map((payment, index) => (
                          <TableRow key={index}>
                            <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                            <TableCell>{formatCurrency(payment.amount)}</TableCell>
                            <TableCell>{payment.method}</TableCell>
                            <TableCell>{payment.description}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Agregar nuevo pago */}
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>Agregar Nuevo Pago</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Monto"
                    type="number"
                    fullWidth
                    variant="outlined"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    inputProps={{ step: "0.01", min: "0", max: paymentProject.debt || 0 }}
                    helperText={`Máximo: ${formatCurrency(paymentProject.debt || 0)}`}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Método de Pago"
                    fullWidth
                    variant="outlined"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    SelectProps={{
                      native: true,
                    }}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="cheque">Cheque</option>
                  </TextField>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Descripción"
                    fullWidth
                    variant="outlined"
                    value={paymentDescription}
                    onChange={(e) => setPaymentDescription(e.target.value)}
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleAddPayment}
            disabled={!paymentAmount || paymentAmount <= 0}
          >
            Agregar Pago
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para agregar modelo a proyecto */}
      <Dialog open={showAddModelDialog} onClose={() => setShowAddModelDialog(false)} maxWidth="lg" fullWidth fullScreen={isMobile}>
        <DialogTitle>Agregar Modelo al Proyecto</DialogTitle>
        <DialogContent>
          {addingToProject && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Proyecto: {addingToProject.name}
              </Typography>
              
              {/* Búsqueda de modelo */}
              <TextField
                fullWidth
                label="Buscar modelo"
                variant="outlined"
                value={modelSearchQuery}
                onChange={(e) => setModelSearchQuery(e.target.value)}
                sx={{ mb: 2 }}
              />

              {/* Lista de modelos */}
              <Box sx={{ mb: 3, maxHeight: '300px', overflow: 'auto' }}>
                <Grid container spacing={2}>
                  {filteredModels.map((model) => (
                    <Grid item xs={12} sm={6} md={4} key={model.id}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          border: selectedModelToAdd?.id === model.id ? '2px solid' : '1px solid',
                          borderColor: selectedModelToAdd?.id === model.id ? 'primary.main' : 'divider'
                        }}
                        onClick={() => handleSelectModelToAdd(model)}
                      >
                        <CardContent>
                          <CachedImage
                            modelId={model.id}
                            modelName={model.name}
                            height={120}
                            imageCache={imageCache}
                            setImageCache={setImageCache}
                          />
                          <Typography variant="h6" sx={{ mt: 1, textAlign: 'center' }}>
                            {model.name}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Configuración del modelo seleccionado */}
              {selectedModelToAdd && modelData && (
                <Box>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Configurar: {selectedModelToAdd.name}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {/* Dimensiones */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Alto (cm)"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={dimensions.height}
                        onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                        inputProps={{ step: "1", min: "1" }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Ancho (cm)"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={dimensions.width}
                        onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                        inputProps={{ step: "1", min: "1" }}
                      />
                    </Grid>

                    {/* Selección de vidrio */}
                    {modelData.glasses && modelData.glasses.length > 0 && (
                      <Grid item xs={12}>
                        <Autocomplete
                          options={glassesOptions}
                          getOptionLabel={(option) => `${option.name} - $${option.priceInstalled}/m²`}
                          value={selectedGlass}
                          onChange={(event, newValue) => setSelectedGlass(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Seleccionar Vidrio"
                              variant="outlined"
                              fullWidth
                            />
                          )}
                        />
                      </Grid>
                    )}

                    {/* Cálculos en tiempo real */}
                    {getCalculations() && (
                      <Grid item xs={12}>
                        <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                          <Typography variant="h6" sx={{ mb: 2 }}>
                            Resumen de Costos
                          </Typography>
                          
                          <Grid container spacing={2}>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="subtitle2" color="textSecondary">Materiales:</Typography>
                              <Typography variant="h6" sx={{ color: 'blue' }}>
                                {formatCurrency(getCalculations().materials?.price || 0)}
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="subtitle2" color="textSecondary">Herrajes:</Typography>
                              <Typography variant="h6" sx={{ color: 'orange' }}>
                                {formatCurrency(getCalculations().chapes?.price || 0)}
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="subtitle2" color="textSecondary">Vidrios:</Typography>
                              <Typography variant="h6" sx={{ color: 'cyan' }}>
                                {formatCurrency(getCalculations().glasses?.price || 0)}
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Typography variant="subtitle2" color="textSecondary">Mano de Obra:</Typography>
                              <Typography variant="h6" sx={{ color: 'green' }}>
                                {formatCurrency(getCalculations().laborCost || 0)}
                              </Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Divider sx={{ my: 1 }} />
                              <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 'bold', textAlign: 'center' }}>
                                Total: {formatCurrency(getCalculations().totalGeneral || 0)}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddModelDialog(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={addModelToProject}
            disabled={!selectedModelToAdd || !selectedGlass}
          >
            Agregar Modelo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para re-cotizar modelo */}
      <Dialog open={showRecalcDialog} onClose={() => setShowRecalcDialog(false)} maxWidth="lg" fullWidth fullScreen={isMobile}>
        <DialogTitle>Re-cotizar Modelo</DialogTitle>
        <DialogContent>
          {recalcModel && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Modelo: {recalcModel.modelName}
              </Typography>
              
              <Grid container spacing={2}>
                {/* Dimensiones */}
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Alto (cm)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    value={recalcDimensions.height}
                    onChange={(e) => setRecalcDimensions({
                      ...recalcDimensions, 
                      height: e.target.value
                    })}
                    inputProps={{ min: "1", step: "1" }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Ancho (cm)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    value={recalcDimensions.width}
                    onChange={(e) => setRecalcDimensions({
                      ...recalcDimensions, 
                      width: e.target.value
                    })}
                    inputProps={{ min: "1", step: "1" }}
                  />
                </Grid>

                {/* Selector de vidrio */}
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={glassesOptions}
                    getOptionLabel={(option) => option.name || ''}
                    value={recalcSelectedGlass}
                    onChange={(event, newValue) => setRecalcSelectedGlass(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Seleccionar Vidrio"
                        variant="outlined"
                        fullWidth
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Box>
                          <Typography variant="body2">{option.name}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            Instalado: {formatCurrency(parseFloat(option.priceInstalled || 0))} | 
                            Solo vidrio: {formatCurrency(parseFloat(option.price || 0))}
                          </Typography>
                        </Box>
                      </li>
                    )}
                  />
                </Grid>

                {/* Selector de color */}
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={colorsOptions}
                    getOptionLabel={(option) => option.name || ''}
                    value={recalcSelectedColor}
                    onChange={(event, newValue) => setRecalcSelectedColor(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Seleccionar Color"
                        variant="outlined"
                        fullWidth
                        helperText={`${colorsOptions.length} colores disponibles`}
                      />
                    )}
                  />
                </Grid>

                {/* Resumen del cálculo */}
                {getRecalcCalculations() && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Resumen del Re-cálculo
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box>
                            <Typography variant="body2" color="textSecondary">Materiales</Typography>
                            <Typography variant="h6" sx={{ color: 'primary.main' }}>
                              {formatCurrency(getRecalcCalculations().materials.price)}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {getRecalcCalculations().materials.meterage.toFixed(2)}m
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                          <Box>
                            <Typography variant="body2" color="textSecondary">Herrajes</Typography>
                            <Typography variant="h6" sx={{ color: 'secondary.main' }}>
                              {formatCurrency(getRecalcCalculations().chapes.price)}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {getRecalcCalculations().chapes.pieces.toFixed(0)} pzs
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                          <Box>
                            <Typography variant="body2" color="textSecondary">Vidrios</Typography>
                            <Typography variant="h6" sx={{ color: 'info.main' }}>
                              {formatCurrency(getRecalcCalculations().glasses.price)}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {getRecalcCalculations().glasses.meterage.toFixed(2)}m²
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                          <Box>
                            <Typography variant="body2" color="textSecondary">Total</Typography>
                            <Typography variant="h5" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                              {formatCurrency(getRecalcCalculations().totalGeneral)}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRecalcDialog(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={confirmRecalcModel}
            disabled={!recalcSelectedGlass || !getRecalcCalculations()}
          >
            Re-cotizar Modelo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para re-cotizar elementos individuales */}
      <Dialog open={showRecalcIndividualDialog} onClose={() => setShowRecalcIndividualDialog(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>Re-cotizar Elemento Individual</DialogTitle>
        <DialogContent>
          {recalcIndividualItem && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Elemento: {recalcIndividualItem.itemName} ({recalcIndividualItem.itemType})
              </Typography>
              
              <Grid container spacing={2}>
                {/* Cantidad */}
                <Grid item xs={12} md={6}>
                  <TextField
                    label={recalcIndividualItem.itemType === 'vidrio' ? 'Cantidad (m²)' : 'Cantidad'}
                    type="number"
                    fullWidth
                    variant="outlined"
                    value={recalcIndividualQuantity}
                    onChange={(e) => setRecalcIndividualQuantity(parseFloat(e.target.value) || 1)}
                    inputProps={{ min: "0.1", step: "0.1" }}
                  />
                </Grid>

                {/* Tipo de cantidad para materiales */}
                {recalcIndividualItem.itemType === 'material' && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      label="Unidad"
                      fullWidth
                      variant="outlined"
                      value={recalcIndividualQuantityType}
                      onChange={(e) => setRecalcIndividualQuantityType(e.target.value)}
                    >
                      <MenuItem value="metros">Metros</MenuItem>
                      <MenuItem value="tramos">Tramos</MenuItem>
                    </TextField>
                  </Grid>
                )}

                {/* Tipo de precio para vidrios */}
                {recalcIndividualItem.itemType === 'vidrio' && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      label="Tipo de Precio"
                      fullWidth
                      variant="outlined"
                      value={recalcIndividualPriceType}
                      onChange={(e) => setRecalcIndividualPriceType(e.target.value)}
                    >
                      <MenuItem value="installed">Precio Instalado</MenuItem>
                      <MenuItem value="price">Solo Vidrio</MenuItem>
                    </TextField>
                  </Grid>
                )}

                {/* Dimensiones para vidrios */}
                {recalcIndividualItem.itemType === 'vidrio' && (
                  <>
                    <Grid item xs={6}>
                      <TextField
                        label="Alto (cm)"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={recalcIndividualDimensions.height}
                        onChange={(e) => setRecalcIndividualDimensions({
                          ...recalcIndividualDimensions, 
                          height: e.target.value
                        })}
                        inputProps={{ min: "1", step: "1" }}
                        helperText="Opcional si ya ingresó área"
                      />
                    </Grid>
                    
                    <Grid item xs={6}>
                      <TextField
                        label="Ancho (cm)"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={recalcIndividualDimensions.width}
                        onChange={(e) => setRecalcIndividualDimensions({
                          ...recalcIndividualDimensions, 
                          width: e.target.value
                        })}
                        inputProps={{ min: "1", step: "1" }}
                        helperText="Opcional si ya ingresó área"
                      />
                    </Grid>
                  </>
                )}

                {/* Vista previa del cálculo */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Vista Previa del Re-cálculo
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      {recalcIndividualPreview.calculation || "Calculando..."}
                    </Typography>
                    <Typography variant="h6" color="primary">
                      Total: {formatCurrency(recalcIndividualPreview.total)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Precio unitario: {formatCurrency(recalcIndividualPreview.unitPrice)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRecalcIndividualDialog(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={confirmRecalcIndividualItem}
            disabled={recalcIndividualQuantity <= 0}
            color="primary"
          >
            Re-cotizar Elemento ({formatCurrency(recalcIndividualPreview.total)})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para agregar elementos individuales mejorado */}
      <Dialog open={showAddIndividualItemDialog} onClose={() => setShowAddIndividualItemDialog(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>Agregar Elemento Individual</DialogTitle>
        <DialogContent>
          {addingToProject && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Proyecto: {addingToProject.name}
              </Typography>
              
              <Grid container spacing={2}>
                {/* Tipo de elemento */}
                <Grid item xs={12}>
                  <TextField
                    select
                    label="Tipo de Elemento"
                    fullWidth
                    variant="outlined"
                    value={individualItemType}
                    onChange={(e) => {
                      setIndividualItemType(e.target.value);
                      // Reset selections when changing type
                      setSelectedIndividualMaterial(null);
                      setSelectedIndividualHerraje(null);
                      setSelectedIndividualVidrio(null);
                    }}
                    SelectProps={{
                      native: true,
                    }}
                    sx={{ mb: 2 }}
                  >
                    <option value="material">Material</option>
                    <option value="herraje">Herraje</option>
                    <option value="vidrio">Vidrio</option>
                  </TextField>
                </Grid>

                {/* Selector de Material */}
                {individualItemType === 'material' && (
                  <>
                    <Grid item xs={12}>
                      <Autocomplete
                        options={materialsOptions}
                        getOptionLabel={(option) => option.name || ''}
                        value={selectedIndividualMaterial}
                        onChange={(event, newValue) => setSelectedIndividualMaterial(newValue)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Seleccionar Material"
                            variant="outlined"
                            fullWidth
                            helperText={selectedIndividualMaterial ? 
                              `Precio por metro: ${formatCurrency(parseFloat(selectedIndividualMaterial.price || 0))} | Tramo: ${selectedIndividualMaterial.stretch || '6.1'}m` : 
                              'Seleccione un material'
                            }
                          />
                        )}
                      />
                    </Grid>
                    
                    <Grid item xs={6}>
                      <TextField
                        select
                        label="Tipo de Cantidad"
                        fullWidth
                        variant="outlined"
                        value={individualItemQuantityType}
                        onChange={(e) => setIndividualItemQuantityType(e.target.value)}
                        SelectProps={{
                          native: true,
                        }}
                      >
                        <option value="metros">Metros</option>
                        <option value="tramos">Tramos</option>
                      </TextField>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <TextField
                        label="Cantidad"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={individualItemQuantity}
                        onChange={(e) => setIndividualItemQuantity(parseFloat(e.target.value) || 1)}
                        inputProps={{ min: "0.1", step: "0.1" }}
                        helperText={individualItemQuantityType === 'metros' ? 'Metros lineales' : 'Número de tramos'}
                      />
                    </Grid>
                  </>
                )}

                {/* Selector de Herraje */}
                {individualItemType === 'herraje' && (
                  <>
                    <Grid item xs={12}>
                      <Autocomplete
                        options={chapesOptions}
                        getOptionLabel={(option) => option.name || ''}
                        value={selectedIndividualHerraje}
                        onChange={(event, newValue) => setSelectedIndividualHerraje(newValue)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Seleccionar Herraje"
                            variant="outlined"
                            fullWidth
                            helperText={selectedIndividualHerraje ? 
                              `Precio por pieza: ${formatCurrency(parseFloat(selectedIndividualHerraje.price || 0))}` : 
                              'Seleccione un herraje'
                            }
                          />
                        )}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        label="Cantidad de Piezas"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={individualItemQuantity}
                        onChange={(e) => setIndividualItemQuantity(parseInt(e.target.value) || 1)}
                        inputProps={{ min: "1", step: "1" }}
                      />
                    </Grid>
                  </>
                )}

                {/* Selector de Vidrio */}
                {individualItemType === 'vidrio' && (
                  <>
                    <Grid item xs={12}>
                      <Autocomplete
                        options={glassesOptions}
                        getOptionLabel={(option) => option.name || ''}
                        value={selectedIndividualVidrio}
                        onChange={(event, newValue) => setSelectedIndividualVidrio(newValue)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Seleccionar Vidrio"
                            variant="outlined"
                            fullWidth
                            helperText={selectedIndividualVidrio ? 
                              `Precio instalado: ${formatCurrency(parseFloat(selectedIndividualVidrio.priceInstalled || 0))} | Precio corte: ${formatCurrency(parseFloat(selectedIndividualVidrio.price || 0))}` : 
                              'Seleccione un vidrio'
                            }
                          />
                        )}
                      />
                    </Grid>
                    
                    <Grid item xs={6}>
                      <TextField
                        select
                        label="Tipo de Precio"
                        fullWidth
                        variant="outlined"
                        value={individualItemPriceType}
                        onChange={(e) => setIndividualItemPriceType(e.target.value)}
                        SelectProps={{
                          native: true,
                        }}
                      >
                        <option value="installed">Precio Instalado</option>
                        <option value="cut">Precio de Corte</option>
                      </TextField>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <TextField
                        label="Área (m²) o usar dimensiones"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={individualItemQuantity}
                        onChange={(e) => setIndividualItemQuantity(parseFloat(e.target.value) || 1)}
                        inputProps={{ min: "0.1", step: "0.1" }}
                        helperText="O ingrese dimensiones abajo"
                      />
                    </Grid>
                    
                    <Grid item xs={6}>
                      <TextField
                        label="Alto (cm)"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={individualItemDimensions.height}
                        onChange={(e) => setIndividualItemDimensions({
                          ...individualItemDimensions, 
                          height: e.target.value
                        })}
                        inputProps={{ min: "1", step: "1" }}
                        helperText="Opcional si ya ingresó área"
                      />
                    </Grid>
                    
                    <Grid item xs={6}>
                      <TextField
                        label="Ancho (cm)"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={individualItemDimensions.width}
                        onChange={(e) => setIndividualItemDimensions({
                          ...individualItemDimensions, 
                          width: e.target.value
                        })}
                        inputProps={{ min: "1", step: "1" }}
                        helperText="Opcional si ya ingresó área"
                      />
                    </Grid>
                  </>
                )}

                {/* Resumen del cálculo */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Resumen del Cálculo
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      {individualItemCalculation || "Seleccione un elemento para ver el cálculo"}
                    </Typography>
                    <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                      Total: {formatCurrency(individualItemTotal)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddIndividualItemDialog(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={confirmAddIndividualItem}
            disabled={individualItemTotal <= 0 || (
              (individualItemType === 'material' && !selectedIndividualMaterial) ||
              (individualItemType === 'herraje' && !selectedIndividualHerraje) ||
              (individualItemType === 'vidrio' && !selectedIndividualVidrio)
            )}
          >
            Agregar Elemento
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProyectosView;
