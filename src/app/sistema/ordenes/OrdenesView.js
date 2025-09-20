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
  List,
  ListItem,
  ListItemText,
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
  Snackbar
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Print as PrintIcon,
  Work as WorkIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
  Payment as PaymentIcon,
  ManageAccounts as ManageAccountsIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  Warning as WarningIcon,
  Block as BlockIcon,
  Done as DoneIcon
} from "@mui/icons-material";

export default function OrdenesView({
  activeProjects,
  employees,
  selectedEmployee,
  showOrdersManagement,
  confirmPaymentDialog,
  loading,
  error,
  workOrder,
  openDialog,
  dialogType,
  snackbar,
  calculateLaborCostForEmployee,
  getItemsForEmployee,
  createWorkOrder,
  confirmWorkOrder,
  printWorkOrder,
  getProjectsForEmployee,
  showPaymentConfirmation,
  markOrderAsPaid,
  undoOrderPayment,
  canUndoPayment,
  getFilteredOrders,
  getEmployeeOrderStats,
  checkDuplicateOrder,
  getExistingOrder,
  handleCloseDialog,
  handleCloseSnackbar,
  handleSelectEmployee,
  handleShowOrdersManagement,
  handleHideOrdersManagement,
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
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <WorkIcon sx={{ fontSize: 40, marginRight: 2, color: "primary.main" }} />
            <Box>
              <Typography variant="h4" sx={{ color: "primary.main" }}>
                Órdenes de Trabajo
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {showOrdersManagement 
                  ? "Administra los pagos de las órdenes de trabajo"
                  : "Gestiona las órdenes de trabajo basadas en la mano de obra por empleado"
                }
              </Typography>
            </Box>
          </Box>
          
          <Button
            variant={showOrdersManagement ? "outlined" : "contained"}
            color="primary"
            startIcon={showOrdersManagement ? <ArrowBackIcon /> : <ManageAccountsIcon />}
            onClick={showOrdersManagement ? handleHideOrdersManagement : handleShowOrdersManagement}
            size="large"
          >
            {showOrdersManagement ? "Crear Órdenes" : "Administrar Órdenes"}
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {!showOrdersManagement ? (
          <>
            {/* Panel de Empleados */}
            <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ padding: 2, height: "fit-content" }}>
            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
              <PersonIcon sx={{ marginRight: 1 }} />
              Empleados
            </Typography>
            <Divider sx={{ marginBottom: 2 }} />
            
            {employees.length === 0 ? (
              <Typography color="text.secondary" align="center">
                No hay empleados registrados
              </Typography>
            ) : (
              <List>
                {employees.map((employee) => {
                  const employeeProjects = getProjectsForEmployee(employee.id);
                  const totalLaborCost = employeeProjects.reduce(
                    (total, project) => total + (calculateLaborCostForEmployee(project, employee.id) || 0),
                    0
                  );
                  const orderStats = getEmployeeOrderStats(employee.id) || { totalOrders: 0, unpaidOrders: 0, paidOrders: 0 };

                  return (
                    <ListItem
                      key={employee.id}
                      sx={{
                        border: selectedEmployee === employee.id ? "2px solid" : "1px solid",
                        borderColor: selectedEmployee === employee.id ? "primary.main" : "grey.300",
                        borderRadius: 1,
                        marginBottom: 1,
                        cursor: "pointer",
                        "&:hover": { bgcolor: "grey.50" }
                      }}
                      onClick={() => handleSelectEmployee(employee.id)}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Typography variant="subtitle2">
                              {employee.name || employee.displayName || "Sin nombre"}
                            </Typography>
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                              <Chip 
                                label={`${employeeProjects.length} proyectos`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                              {orderStats.totalOrders > 0 && (
                                <Chip 
                                  label={`${orderStats.totalOrders} órdenes`}
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </Box>
                        }
                        secondary={
                          <span>
                            Costo total M.O.: ${(totalLaborCost || 0).toLocaleString()}
                            {orderStats.totalOrders > 0 && (
                              <span style={{ display: "block", marginTop: "4px" }}>
                                {orderStats.unpaidOrders > 0 && (
                                  <Chip 
                                    label={`${orderStats.unpaidOrders} sin pagar`}
                                    size="small"
                                    color="warning"
                                    variant="filled"
                                    style={{ marginRight: "4px" }}
                                  />
                                )}
                                {orderStats.paidOrders > 0 && (
                                  <Chip 
                                    label={`${orderStats.paidOrders} pagadas`}
                                    size="small"
                                    color="success"
                                    variant="filled"
                                  />
                                )}
                              </span>
                            )}
                          </span>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Panel de Proyectos */}
        <Grid item xs={12} md={8}>
          {selectedEmployee ? (
            <Paper elevation={3} sx={{ padding: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                <AssignmentIcon sx={{ marginRight: 1 }} />
                Proyectos para {employees.find(emp => emp.id === selectedEmployee)?.name || "Empleado"}
              </Typography>
              <Divider sx={{ marginBottom: 2 }} />

              {getProjectsForEmployee(selectedEmployee).length === 0 ? (
                <Typography color="text.secondary" align="center">
                  Este empleado no tiene proyectos asignados
                </Typography>
              ) : (
                getProjectsForEmployee(selectedEmployee).map((project) => {
                  const laborCost = calculateLaborCostForEmployee(project, selectedEmployee) || 0;
                  const items = getItemsForEmployee(project, selectedEmployee) || [];
                  const selectedEmployeeData = employees.find(emp => emp.id === selectedEmployee);

                  return (
                    <Accordion key={project.id} sx={{ marginBottom: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ width: "100%" }}>
                          <Typography variant="h6" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <span>{project.name || project.projectName || "Sin nombre"}</span>
                              {(() => {
                                const hasExistingOrder = checkDuplicateOrder(project.id, selectedEmployee);
                                const existingOrder = hasExistingOrder ? getExistingOrder(project.id, selectedEmployee) : null;
                                
                                if (hasExistingOrder && existingOrder) {
                                  return (
                                    <Chip
                                      icon={existingOrder.paymentStatus === "paid" ? <DoneIcon /> : <WarningIcon />}
                                      label={existingOrder.paymentStatus === "paid" ? "Pagado" : "Pendiente"}
                                      color={existingOrder.paymentStatus === "paid" ? "success" : "warning"}
                                      size="small"
                                      variant="outlined"
                                    />
                                  );
                                }
                                return null;
                              })()}
                            </Box>
                            <Chip 
                              icon={<MoneyIcon />}
                              label={`$${laborCost.toLocaleString()}`}
                              color="success"
                              variant="outlined"
                            />
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Cliente: {project.client || "Sin cliente"} • {items.length} items
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      
                      <AccordionDetails>
                        <Box sx={{ marginBottom: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Detalles de Mano de Obra:
                          </Typography>
                          
                          {items.length === 0 ? (
                            <Typography color="text.secondary">
                              No hay items asignados a este empleado
                            </Typography>
                          ) : (
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Item</TableCell>
                                    <TableCell>Área</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell align="right">M.O. Aluminio</TableCell>
                                    <TableCell align="right">M.O. Vidrio</TableCell>
                                    <TableCell align="right">Total M.O.</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {items.map((item, index) => (
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
                                      <TableCell>
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
                                    <TableCell colSpan={5}><strong>Total</strong></TableCell>
                                    <TableCell align="right">
                                      <strong>${(laborCost || 0).toLocaleString()}</strong>
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          )}
                        </Box>

                        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, alignItems: "center" }}>
                          {/* Mostrar estado de orden existente si la hay */}
                          {(() => {
                            const hasExistingOrder = checkDuplicateOrder(project.id, selectedEmployee);
                            const existingOrder = hasExistingOrder ? getExistingOrder(project.id, selectedEmployee) : null;
                            
                            if (hasExistingOrder && existingOrder) {
                              return (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <Chip
                                    icon={existingOrder.paymentStatus === "paid" ? <DoneIcon /> : <BlockIcon />}
                                    label={existingOrder.paymentStatus === "paid" ? "Orden Pagada" : "Orden Pendiente"}
                                    color={existingOrder.paymentStatus === "paid" ? "success" : "warning"}
                                    size="small"
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(existingOrder.createdAt?.toDate?.() || existingOrder.date).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              );
                            }
                            
                            return (
                              <Button
                                variant="contained"
                                color="primary"
                                startIcon={<WorkIcon />}
                                onClick={() => createWorkOrder(project, selectedEmployeeData)}
                                disabled={items.length === 0}
                              >
                                Crear Orden de Trabajo
                              </Button>
                            );
                          })()}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  );
                })
              )}
            </Paper>
          ) : (
            <Paper elevation={3} sx={{ padding: 4, textAlign: "center" }}>
              <Typography variant="h6" color="text.secondary">
                Selecciona un empleado para ver sus proyectos
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ marginTop: 1 }}>
                Elige un empleado del panel izquierdo para ver los proyectos asignados y crear órdenes de trabajo
              </Typography>
            </Paper>
          )}
        </Grid>
        </>
        ) : (
          // Vista de Administración de Órdenes
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ padding: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                <PaymentIcon sx={{ marginRight: 1 }} />
                Administración de Órdenes de Trabajo
              </Typography>
              
              {getFilteredOrders().length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                  No hay órdenes de trabajo registradas
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
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                startIcon={<PaymentIcon />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showPaymentConfirmation(order.projectId, order.itemIndex);
                                }}
                              >
                                Marcar Pagado
                              </Button>
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
        )}
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
