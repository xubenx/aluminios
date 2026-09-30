import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase.js";
import { verifyPassword } from "./password.js";

export async function findEmployeeByUsuario(usuario) {
  const snapshot = await getDocs(query(collection(db, "employees"), where("usuario", "==", usuario)));
  if (snapshot.empty) return null;
  const employee = snapshot.docs[0];
  return { id: employee.id, ...employee.data() };
}

export async function passwordMatches(employee, password) {
  if (employee.password && String(employee.password) === String(password)) return true;
  try {
    const secret = await getDoc(doc(db, "employeeSecrets", employee.id));
    if (secret.exists() && (await verifyPassword(password, secret.data()?.passwordHash))) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}
