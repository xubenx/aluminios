"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Box,
} from "@mui/material";
import { ArrowBack, ArrowForward, Check } from "@mui/icons-material";

/**
 * Diálogo CRUD con Stepper para mejorar la intuitividad visual.
 * Divide el formulario en pasos guiados.
 *
 * @param {Object} props
 * @param {boolean} props.open - Controla si el diálogo está abierto
 * @param {function} props.onClose - Callback al cerrar
 * @param {string} props.title - Título del diálogo
 * @param {Array<{label: string, content: React.ReactNode, optional?: boolean}>} props.steps - Array de pasos {label, content}
 * @param {function} props.onSave - Callback al guardar (recibe currentStep para validación si se necesita)
 * @param {string} props.saveLabel - Texto del botón guardar (default: "Guardar")
 * @param {string} props.cancelLabel - Texto del botón cancelar (default: "Cancelar")
 * @param {boolean} props.disableSave - Deshabilitar botón guardar
 */
export default function CrudStepperDialog({
  open,
  onClose,
  title,
  steps = [],
  onSave,
  saveLabel = "Guardar",
  cancelLabel = "Cancelar",
  disableSave = false,
}) {
  const [activeStep, setActiveStep] = React.useState(0);

  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleClose = () => {
    setActiveStep(0);
    onClose?.();
  };

  const handleSave = () => {
    onSave?.();
    // El padre (handleSave) cerrará el diálogo tras guardar correctamente
  };

  // Reset stepper cuando se abre
  React.useEffect(() => {
    if (open) {
      setActiveStep(0);
    }
  }, [open]);

  const isLastStep = activeStep === steps.length - 1;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 1 }}>
          {steps.map((step, index) => (
            <Step key={index} completed={activeStep > index} optional={step.optional}>
              <StepLabel
                StepIconProps={{
                  sx: {
                    "&.Mui-completed": { color: "primary.main" },
                    "&.Mui-active": { color: "primary.main" },
                  },
                }}
              >
                {step.label}
              </StepLabel>
              <StepContent>
                <Box sx={{ py: 1 }}>{step.content}</Box>
                <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                  {index > 0 && (
                    <Button
                      size="small"
                      startIcon={<ArrowBack />}
                      onClick={handleBack}
                    >
                      Anterior
                    </Button>
                  )}
                  {!isLastStep ? (
                    <Button
                      variant="contained"
                      size="small"
                      endIcon={<ArrowForward />}
                      onClick={handleNext}
                    >
                      Siguiente
                    </Button>
                  ) : null}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          {cancelLabel}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          startIcon={<Check />}
          disabled={disableSave}
        >
          {saveLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
