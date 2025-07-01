"use client";
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Autocomplete,
  Box
} from "@mui/material";

// Diálogo para confirmar la eliminación del modelo
export function ConfirmDeleteDialog({ open, onCancel, onConfirm }) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>Confirmar Eliminación</DialogTitle>
      <DialogContent>
        <Typography>¿Estás seguro de que deseas eliminar este modelo?</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button onClick={onConfirm} color="error">Eliminar</Button>
      </DialogActions>
    </Dialog>
  );
}

// Diálogo para confirmar la actualización del modelo
export function ConfirmUpdateModelDialog({ open, onCancel, onConfirm }) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>Confirmar Actualización</DialogTitle>
      <DialogContent>
        <Typography>¿Estás seguro de guardar los cambios en el modelo?</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button onClick={onConfirm} color="primary">Confirmar</Button>
      </DialogActions>
    </Dialog>
  );
}

// Diálogo para confirmar la actualización de un elemento
export function ConfirmUpdateSectionDialog({ open, onCancel, onConfirm }) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>Confirmar Actualización</DialogTitle>
      <DialogContent>
        <Typography>¿Estás seguro de guardar este elemento?</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button onClick={onConfirm} color="primary">Confirmar</Button>
      </DialogActions>
    </Dialog>
  );
}

// Diálogo para confirmar la eliminación de un elemento
export function ConfirmDeleteItemDialog({ open, onCancel, onConfirm }) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>Confirmar Eliminación</DialogTitle>
      <DialogContent>
        <Typography>¿Estás seguro de que deseas eliminar este elemento?</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button onClick={onConfirm} color="error">Eliminar</Button>
      </DialogActions>
    </Dialog>
  );
}

// Diálogo para seleccionar y cambiar la imagen del modelo
export function ChangeImageDialog({ open, onCancel, onConfirm, onImageChange, previewImage }) {
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onImageChange(file);
    }
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Cambiar Imagen del Modelo</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>
          Selecciona una nueva imagen para el modelo:
        </Typography>
        
        <Button variant="outlined" component="label" sx={{ mb: 2 }}>
          Seleccionar Imagen
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileChange}
          />
        </Button>

        {previewImage && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Vista previa:</Typography>
            <img
              src={previewImage}
              alt="Vista previa"
              style={{
                maxWidth: '100%',
                maxHeight: '300px',
                objectFit: 'contain',
                borderRadius: '8px',
                border: '1px solid #ddd'
              }}
            />
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button 
          onClick={onConfirm} 
          color="primary" 
          variant="contained"
          disabled={!previewImage}
        >
          Cambiar Imagen
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Diálogo para agregar o editar un elemento.
// Para "materials" y "chapes" se muestra el Autocomplete; para "glasses" se fija el nombre "Vidrio".
export function EditElementDialog({
  open,
  currentSection,
  formData,
  selectedOption,
  options,
  onFormChange,
  onSave,
  onCancel
}) {
  return (
    <Dialog open={open} onClose={onCancel} fullWidth>
      <DialogTitle>{"Editar Elemento"}</DialogTitle>
      <DialogContent>
        {currentSection === "glasses" ? (
          <TextField
            disabled
            margin="dense"
            label="Elemento"
            fullWidth
            variant="outlined"
            value="Vidrio"
            sx={{ mb: 2 }}
          />
        ) : (
          <>
            {formData.index === undefined ? (
              <Autocomplete
                options={options}
                getOptionLabel={(option) => {
                  const duplicates = options.filter(o => o.name === option.name);
                  return duplicates.length > 1
                    ? `${option.name} (${option.id.slice(0, 4)})`
                    : option.name;
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={selectedOption}
                onChange={(event, newValue) =>
                  onFormChange({
                    ...formData,
                    id: newValue ? newValue.id : "",
                    name: newValue ? newValue.name : ""
                  })
                }
                renderInput={(params) => <TextField {...params} label="Elemento" variant="outlined" />}
                renderOption={(props, option) => {
                  const duplicates = options.filter(o => o.name === option.name);
                  const label = duplicates.length > 1
                    ? `${option.name} (${option.id.slice(0, 4)})`
                    : option.name;
                  return <li {...props}>{label}</li>;
                }}
                sx={{ mb: 2 }}
              />
            ) : (
              <Typography variant="h6" sx={{ mb: 2 }}>
                {formData.name}
              </Typography>
            )}
          </>
        )}
        <TextField
          autoFocus
          margin="dense"
          label="Fórmula"
          type="text"
          fullWidth
          variant="outlined"
          name="formula"
          value={formData.formula || ""}
          onChange={(e) => onFormChange({ ...formData, formula: e.target.value })}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button onClick={onSave} variant="contained" color="primary">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
