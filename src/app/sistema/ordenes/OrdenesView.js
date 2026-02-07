"use client";
import React from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Print as PrintIcon,
  Work as WorkIcon,
  AttachMoney as MoneyIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  DoneAll as DoneAllIcon,
  Done as DoneIcon
} from "@mui/icons-material";

export default function OrdenesView({
  activeProjects,
  employees = [],
  confirmPaymentDialog,
  loading,
  error,
  workOrder,
  openDialog,
  dialogType,
  snackbar,
  printWorkOrder,
  confirmWorkOrder,
  showPaymentConfirmation,
  markOrderAsPaid,
  undoOrderPayment,
  canUndoPayment,
  canPayOrder,
  getFilteredOrders,
  getFilteredAssignedItems,
  getGeneralDashboardStats,
  getPayableUnpaidOrders,
  markAllAsPaid,
  markAllAsPaidDialog,
  handleOpenMarkAllPaid,
  handleCloseMarkAllPaid,
  selectedEmployeeFilter,
  handleEmployeeFilterChange,
  handleCloseDialog,
  handleCloseSnackbar,
  handleSelectOrder,
  handleClosePaymentConfirmation
}) {
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          height: "100vh" 
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ padding: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
      {/* Header */}
      <Paper elevation={3} sx={{ padding: 3, marginBottom: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <WorkIcon sx={{ fontSize: 40, marginRight: 2, color: "primary.main" }} />
            <Box>
              <Typography variant="h4" sx={{ color: "primary.main" }}>
                Órdenes de Trabajo
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Administra los pagos de los elementos asignados en Proyectos
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Dashboard general */}
      {getGeneralDashboardStats && (() => {
        const stats = getGeneralDashboardStats();
        return (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={4} md={2}>
              <Card sx={{ bgcolor: "#1976d2", color: "white", height: "100%" }}>
                <CardContent>
                  <Typography variant="overline">Items Asignados</Typography>
                  <Typography variant="h4">{stats.totalItems}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Card sx={{ bgcolor: "#0288d1", color: "white", height: "100%" }}>
                <CardContent>
                  <Typography variant="overline">Con Orden</Typography>
                  <Typography variant="h4">{stats.conOrden}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Card sx={{ bgcolor: "#2e7d32", color: "white", height: "100%" }}>
                <CardContent>
                  <Typography variant="overline">Pagados</Typography>
                  <Typography variant="h4">{stats.pagados}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Card sx={{ bgcolor: "#ed6c02", color: "white", height: "100%" }}>
                <CardContent>
                  <Typography variant="overline">Pendientes</Typography>
                  <Typography variant="h4">{stats.pendientesPago}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Card sx={{ bgcolor: "#424242", color: "white", height: "100%" }}>
                <CardContent>
                  <Typography variant="overline">Monto Pagado</Typography>
                  <Typography variant="h6">${(stats.montoPagado || 0).toLocaleString()}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Card sx={{ bgcolor: "#c62828", color: "white", height: "100%" }}>
                <CardContent>
                  <Typography variant="overline">Monto Pendiente</Typography>
                  <Typography variant="h6">${(stats.montoPendiente || 0).toLocaleString()}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );
      })()}

      <Grid container spacing={3}>
        <Grid item xs={12}>
            <Paper elevation={3} sx={{ padding: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ display: "flex", alignItems: "center" }}>
                  <PaymentIcon sx={{ marginRight: 1 }} />
                  Administración de Órdenes de Trabajo
                </Typography>
                <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                  {getPayableUnpaidOrders && getPayableUnpaidOrders().length > 0 && (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<DoneAllIcon />}
                      onClick={handleOpenMarkAllPaid}
                    >
                      Marcar todas pagadas (${(getPayableUnpaidOrders().reduce((s, o) => s + (o.totalLaborCost || 0), 0)).toLocaleString()})
                    </Button>
                  )}
                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <InputLabel>Filtrar por colaborador</InputLabel>
                  <Select
                    value={selectedEmployeeFilter || ""}
                    label="Filtrar por colaborador"
                    onChange={(e) => handleEmployeeFilterChange(e.target.value)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {employees.map((emp) => (
                      <MenuItem key={emp.id} value={emp.id}>
                        {emp.name || emp.displayName || "Sin nombre"}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {/* Desglose completo de items asignados */}
              {getFilteredAssignedItems && getFilteredAssignedItems().length > 0 && (
                <Accordion sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Desglose completo ({getFilteredAssignedItems().length} items)
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Proyecto</TableCell>
                            <TableCell>Cliente</TableCell>
                            <TableCell>Colaborador</TableCell>
                            <TableCell>Item</TableCell>
                            <TableCell>Área</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Orden</TableCell>
                            <TableCell>Pago</TableCell>
                            <TableCell align="right">Monto</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {getFilteredAssignedItems().map((row) => (
                            <TableRow key={row.id}>
                              <TableCell>{row.projectName}</TableCell>
                              <TableCell>{row.client}</TableCell>
                              <TableCell>{row.employee}</TableCell>
                              <TableCell>{row.itemName}</TableCell>
                              <TableCell>{row.area}</TableCell>
                              <TableCell>
                                <Chip label={row.status} size="small" color="default" variant="outlined" />
                              </TableCell>
                              <TableCell>
                                {row.hasWorkOrder ? (
                                  <Chip label="Sí" size="small" color="info" variant="outlined" />
                                ) : (
                                  <Chip label="No" size="small" color="default" variant="outlined" />
                                )}
                              </TableCell>
                              <TableCell>
                                {row.paymentStatus === "paid" && <Chip label="Pagado" size="small" color="success" />}
                                {row.paymentStatus === "unpaid" && <Chip label="Pendiente" size="small" color="warning" />}
                                {row.paymentStatus === "sin_orden" && <Chip label="Sin orden" size="small" color="default" />}
                              </TableCell>
                              <TableCell align="right">${(row.totalLaborCost || 0).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              )}

              {getFilteredOrders().length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                  No hay órdenes. Asigna colaboradores a los elementos en Proyectos para que aparezcan aquí.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {getFilteredOrders().map((order) => (
                    <Grid item xs={12} md={6} lg={4} key={order.id}>
                      <Card 
                        sx={{ 
                          cursor: "pointer",
                          transition: "all 0.2s",
                          "&:hover": { 
                            transform: "translateY(-2px)",
                            boxShadow: 4 
                          },
                          border: order.paymentStatus === "paid" ? "2px solid #4caf50" : "1px solid #e0e0e0"
                        }}
                        onClick={() => handleSelectOrder(order)}
                      >
                        <CardContent>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                            <Typography variant="h6" component="div" noWrap>
                              {order.projectName}
                            </Typography>
                            <Chip
                              icon={order.paymentStatus === "paid" ? <CheckCircleIcon /> : <MoneyIcon />}
                              label={order.paymentStatus === "paid" ? "Pagado" : "Pendiente"}
                              color={order.paymentStatus === "paid" ? "success" : "warning"}
                              size="small"
                            />
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            <strong>Cliente:</strong> {order.client}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            <strong>Empleado:</strong> {order.employee}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            <strong>Item:</strong> {order.itemName}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            <strong>Área:</strong> {order.area}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            <strong>Fecha:</strong> {new Date(order.createdAt?.toDate?.() || order.createdAt).toLocaleDateString()}
                          </Typography>
                          
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
                            <Typography variant="h6" color="primary">
                              ${(order.totalLaborCost || 0).toLocaleString()}
                            </Typography>
                            
                            {order.paymentStatus === "unpaid" ? (
                              <Tooltip title={canPayOrder && !canPayOrder(order) ? "Solo se puede pagar si el estado es Instalado o Revisado" : ""}>
                                <span>
                                  <Button
                                    variant="contained"
                                    color="success"
                                    size="small"
                                    startIcon={<PaymentIcon />}
                                    disabled={canPayOrder ? !canPayOrder(order) : false}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      showPaymentConfirmation(order.projectId, order.itemIndex);
                                    }}
                                  >
                                    Marcar Pagado
                                  </Button>
                                </span>
                              </Tooltip>
                            ) : canUndoPayment(activeProjects.find(p => p.id === order.projectId)?.items?.[order.itemIndex]) ? (
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<CancelIcon />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  undoOrderPayment(order.projectId, order.itemIndex);
                                }}
                              >
                                Deshacer Pago
                              </Button>
                            ) : (
                              <Chip
                                label="Pagado"
                                color="success"
                                size="small"
                                icon={<CheckCircleIcon />}
                              />
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </Grid>
      </Grid>

      {/* Dialog para crear/ver orden de trabajo */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: dialogType === "print" ? { 
            "@media print": { 
              boxShadow: "none",
              margin: 0,
              maxWidth: "none",
              width: "100%",
              height: "100%"
            }
          } : {}
        }}
      >
        <DialogTitle>
          {dialogType === "create" && "Crear Orden de Trabajo"}
          {dialogType === "view" && "Ver Orden de Trabajo"}
          {dialogType === "print" && "Imprimir Orden de Trabajo"}
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ padding: 2 }}>
            {/* Header de la orden */}
            <Grid container spacing={2} sx={{ marginBottom: 3 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom>
                  Información del Proyecto
                </Typography>
                <Typography><strong>Proyecto:</strong> {workOrder.projectName}</Typography>
                <Typography><strong>Cliente:</strong> {workOrder.client}</Typography>
                <Typography><strong>Fecha:</strong> {workOrder.date}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom>
                  Información del Empleado
                </Typography>
                <Typography><strong>Empleado:</strong> {workOrder.employee}</Typography>
                <Typography><strong>Costo Total M.O.:</strong> ${(workOrder.totalLaborCost || 0).toLocaleString()}</Typography>
                <Typography><strong>Estado:</strong> {workOrder.status}</Typography>
              </Grid>
            </Grid>

            <Divider sx={{ marginY: 2 }} />

            {/* Tabla de items */}
            <Typography variant="h6" gutterBottom>
              Detalle de Trabajos
            </Typography>
            
            {workOrder.items && workOrder.items.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Item</strong></TableCell>
                      <TableCell><strong>Área</strong></TableCell>
                      <TableCell align="center"><strong>Estado</strong></TableCell>
                      <TableCell align="right"><strong>M.O. Aluminio</strong></TableCell>
                      <TableCell align="right"><strong>M.O. Vidrio</strong></TableCell>
                      <TableCell align="right"><strong>Total M.O.</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {workOrder.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {item.modelName || item.itemName || item.employeeName}
                            </Typography>
                            {item.type === "model" && item.dimensions && (
                              <Typography variant="caption" color="text.secondary">
                                {item.dimensions.height}cm × {item.dimensions.width}cm
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>{item.area}</TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={item.status} 
                            size="small" 
                            color={
                              item.status === "revisado" ? "success" :
                              item.status === "instalado" ? "info" :
                              item.status === "enProceso" ? "warning" :
                              "default"
                            }
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            ${(item.aluminumLaborCost || item.employeeLaborCost || 0).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            ${(item.glassLaborCost || 0).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            ${(item.employeeLaborCost || item.totalLaborCost || 0).toLocaleString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={5}><strong>TOTAL</strong></TableCell>
                      <TableCell align="right">
                        <strong>${(workOrder.totalLaborCost || 0).toLocaleString()}</strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary" align="center">
                No hay items en esta orden de trabajo
              </Typography>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ padding: 2 }}>
          <Button onClick={handleCloseDialog}>
            Cancelar
          </Button>
          {dialogType === "create" && (
            <>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={printWorkOrder}
              >
                Vista Previa
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={confirmWorkOrder}
              >
                Confirmar Orden
              </Button>
            </>
          )}
          {(dialogType === "view" || dialogType === "print") && (
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={printWorkOrder}
            >
              Imprimir
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación de pago */}
      <Dialog
        open={confirmPaymentDialog.open}
        onClose={handleClosePaymentConfirmation}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmar Pago</DialogTitle>
        <DialogContent>
          {confirmPaymentDialog.itemData && (
            <Box>
              <Typography gutterBottom>
                ¿Está seguro que desea marcar este item como pagado?
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1, mb: 2 }}>
                <strong>Proyecto:</strong> {confirmPaymentDialog.itemData.projectName}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                <strong>Item:</strong> {confirmPaymentDialog.itemData.modelName || confirmPaymentDialog.itemData.itemName}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                <strong>Empleado:</strong> {confirmPaymentDialog.itemData.employeeName}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                <strong>Área:</strong> {confirmPaymentDialog.itemData.area}
              </Typography>
              <Typography color="textSecondary" sx={{ mt: 2 }}>
                Esta acción registrará el pago en el diario de gastos y no se podrá deshacer después de 24 horas.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentConfirmation}>
            Cancelar
          </Button>
          <Button 
            onClick={markOrderAsPaid}
            variant="contained"
            color="success"
          >
            Confirmar Pago
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Marcar todas como pagadas */}
      <Dialog
        open={markAllAsPaidDialog?.open ?? false}
        onClose={handleCloseMarkAllPaid}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Marcar todas como pagadas</DialogTitle>
        <DialogContent>
          {markAllAsPaidDialog?.orders?.length > 0 ? (
            <Box>
              <Typography gutterBottom>
                Se marcarán {markAllAsPaidDialog.orders.length} órdenes como pagadas.
              </Typography>
              <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                Monto total: ${(markAllAsPaidDialog.totalAmount || 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Solo se incluyen órdenes con estado Instalado o Revisado. Se registrará un gasto en el diario.
              </Typography>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMarkAllPaid}>Cancelar</Button>
          <Button variant="contained" color="success" onClick={markAllAsPaid}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensajes */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
