import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage";
import { storage } from "../../firebase.js";

/**
 * Sube una imagen a Firebase Storage
 * @param {File|Object} file - Archivo de imagen a subir o objeto con buffer
 * @param {string} modelId - ID del modelo para nombrar la imagen
 * @returns {Promise<string>} URL de descarga de la imagen subida
 */
export const uploadModelImage = async (file, modelId) => {
  try {
    // Manejar tanto File objects como objetos con buffer
    let fileData;
    let fileExtension;
    
    if (file.buffer) {
      // Es un objeto con buffer (para migración)
      fileData = file.buffer;
      fileExtension = file.originalname.split('.').pop() || 'png';
    } else {
      // Es un File object normal
      fileData = file;
      fileExtension = file.name.split('.').pop() || 'png';
    }
    
    // Crear referencia con la estructura: models/images/{modelId}.{extension}
    const imageRef = ref(storage, `models/images/${modelId}.${fileExtension}`);
    
    // Subir el archivo
    const snapshot = await uploadBytes(imageRef, fileData);
    
    // Obtener la URL de descarga
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('Imagen subida exitosamente:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    throw new Error(`Error al subir la imagen: ${error.message}`);
  }
};

/**
 * Obtiene la URL de descarga de una imagen de modelo
 * @param {string} modelId - ID del modelo
 * @param {string} extension - Extensión del archivo (por defecto 'png')
 * @returns {Promise<string|null>} URL de descarga o null si no existe
 */
export const getModelImageURL = async (modelId, extension = 'png') => {
  try {
    const imageRef = ref(storage, `models/images/${modelId}.${extension}`);
    const downloadURL = await getDownloadURL(imageRef);
    return downloadURL;
  } catch (error) {
    if (error.code === 'storage/object-not-found') {
      // La imagen no existe, intentar con diferentes extensiones
      const extensions = ['png', 'jpg', 'jpeg', 'webp'];
      for (const ext of extensions) {
        if (ext !== extension) {
          try {
            const altImageRef = ref(storage, `models/images/${modelId}.${ext}`);
            const downloadURL = await getDownloadURL(altImageRef);
            return downloadURL;
          } catch (altError) {
            // Continuar con la siguiente extensión
          }
        }
      }
      console.log(`No se encontró imagen para el modelo ${modelId}`);
      return null;
    }
    console.error('Error obteniendo URL de imagen:', error);
    throw new Error(`Error al obtener la imagen: ${error.message}`);
  }
};

/**
 * Elimina una imagen de modelo de Firebase Storage
 * @param {string} modelId - ID del modelo
 * @param {string} extension - Extensión del archivo (por defecto 'png')
 * @returns {Promise<boolean>} true si se eliminó exitosamente
 */
export const deleteModelImage = async (modelId, extension = 'png') => {
  try {
    const imageRef = ref(storage, `models/images/${modelId}.${extension}`);
    await deleteObject(imageRef);
    console.log(`Imagen del modelo ${modelId} eliminada exitosamente`);
    return true;
  } catch (error) {
    if (error.code === 'storage/object-not-found') {
      console.log(`No se encontró imagen para eliminar del modelo ${modelId}`);
      return false;
    }
    console.error('Error eliminando imagen:', error);
    throw new Error(`Error al eliminar la imagen: ${error.message}`);
  }
};

/**
 * Lista todas las imágenes de modelos en Firebase Storage
 * @returns {Promise<Array>} Array con información de todas las imágenes
 */
export const listModelImages = async () => {
  try {
    const imagesRef = ref(storage, 'models/images');
    const result = await listAll(imagesRef);
    
    const images = await Promise.all(
      result.items.map(async (itemRef) => {
        const downloadURL = await getDownloadURL(itemRef);
        const modelId = itemRef.name.split('.')[0]; // Obtener ID del nombre del archivo
        return {
          modelId,
          name: itemRef.name,
          fullPath: itemRef.fullPath,
          downloadURL
        };
      })
    );
    
    return images;
  } catch (error) {
    console.error('Error listando imágenes:', error);
    throw new Error(`Error al listar las imágenes: ${error.message}`);
  }
};

/**
 * Migra una imagen local a Firebase Storage
 * @param {string} localImagePath - Ruta de la imagen local (ej: '/images/modelo123.png')
 * @param {string} modelId - ID del modelo
 * @returns {Promise<string|null>} URL de descarga de la imagen migrada o null si falló
 */
export const migrateLocalImageToStorage = async (localImagePath, modelId) => {
  try {
    // Obtener la imagen desde la ruta local
    const response = await fetch(localImagePath);
    if (!response.ok) {
      console.log(`No se pudo obtener la imagen local: ${localImagePath}`);
      return null;
    }
    
    const blob = await response.blob();
    const file = new File([blob], `${modelId}.png`, { type: 'image/png' });
    
    // Subir a Firebase Storage
    const downloadURL = await uploadModelImage(file, modelId);
    console.log(`Imagen migrada exitosamente: ${localImagePath} -> ${downloadURL}`);
    return downloadURL;
  } catch (error) {
    console.error(`Error migrando imagen ${localImagePath}:`, error);
    return null;
  }
};

/**
 * Verifica si una imagen existe en Firebase Storage
 * @param {string} modelId - ID del modelo
 * @returns {Promise<boolean>} true si la imagen existe
 */
export const modelImageExists = async (modelId) => {
  try {
    const imageURL = await getModelImageURL(modelId);
    return imageURL !== null;
  } catch (error) {
    return false;
  }
};