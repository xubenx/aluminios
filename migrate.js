import { initializeApp } from "firebase/app";
// eslint-disable-next-line @typescript-eslint/no-require-imports
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBCRoZVl06YqcMvL0jcWyHgonDS75ojyJI",
  authDomain: "aluminios-88a45.firebaseapp.com",
  projectId: "aluminios-88a45",
  storageBucket: "aluminios-88a45.firebasestorage.app",
  messagingSenderId: "38740849156",
  appId: "1:38740849156:web:14f5ae306c63557f15fb51",
  measurementId: "G-SWD0MFTRCH"
};

// Initialize Firebase
// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Función para obtener detalles de materiales, chapes y glasses
async function getDetailsFromModel(modelId) {
    try {
      // Obtén el modelo por su ID
      const modelDoc = await getDoc(doc(db, "models", modelId));
      if (!modelDoc.exists()) {
        console.log("El modelo no existe.");
        return;
      }
  
      const modelData = modelDoc.data();
  
      // Obtén todas las colecciones necesarias en una sola consulta
      const [materialsSnapshot, chapesSnapshot, glassesSnapshot] = await Promise.all([
        getDocs(collection(db, "materials")),
        getDocs(collection(db, "chapes")),
        getDocs(collection(db, "glasses")),
      ]);
  
      // Convierte los snapshots en mapas para acceso rápido
      const materialsMap = new Map();
      materialsSnapshot.forEach((doc) => materialsMap.set(doc.id, doc.data()));
  
      const chapesMap = new Map();
      chapesSnapshot.forEach((doc) => chapesMap.set(doc.id, doc.data()));
  
      const glassesMap = new Map();
      glassesSnapshot.forEach((doc) => glassesMap.set(doc.id, doc.data()));
  
      // Filtra los materiales, chapes y glasses necesarios
      const materialDetails = modelData.materials.map((material) => {
        const materialData = materialsMap.get(material.id);
        return materialData
          ? {
              id: material.id,
              name: materialData.name,
              price: materialData.price,
              formula: material.formula,
            }
          : null;
      }).filter(Boolean);
  
      const chapeDetails = modelData.chapes.map((chape) => {
        const chapeData = chapesMap.get(chape.id);
        return chapeData
          ? {
              id: chape.id,
              name: chapeData.name,
              price: chapeData.price,
              formula: chape.formula,
            }
          : null;
      }).filter(Boolean);
  
      const glassDetails = modelData.glasses.map((glass) => {
        const glassData = glassesMap.get(glass.id);
        return glassData
          ? {
              id: glass.id,
              name: glassData.name,
              price: glassData.price,
              formula: glass.formula,
            }
          : null;
      }).filter(Boolean);
  
      // Retorna los resultados
      return {
        materials: materialDetails,
        chapes: chapeDetails,
        glasses: glassDetails,
      };
    } catch (error) {
      console.error("Error al obtener los detalles:", error);
    }
  }
  
// Llama a la función con un ID de modelo
getDetailsFromModel("0vHa8RDLy9CfvPdu").then((details) => {
  console.log("Detalles del modelo:", details);
});