/* eslint-disable import/no-anonymous-default-export */
import { db } from "../firebase-config";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

// Collection Firestore cho loại máy
const machineTypesCollectionRef = collection(db, "machineTypes");

class machineTypesDataService {
  getAllMachineTypes() {
    return getDocs(machineTypesCollectionRef);
  }

  getMachineTypeById(id) {
    const machineTypeDoc = doc(db, "machineTypes", id);
    return getDoc(machineTypeDoc);
  }

  addMachineType(newMachineType) {
    return addDoc(machineTypesCollectionRef, {
      ...newMachineType,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  updateMachineType(id, newData) {
    const machineTypeDoc = doc(db, "machineTypes", id);
    return updateDoc(machineTypeDoc, {
      ...newData,
      updatedAt: new Date(),
    });
  }

  deleteMachineType(id) {
    const machineTypeDoc = doc(db, "machineTypes", id);
    return deleteDoc(machineTypeDoc);
  }
}

export default new machineTypesDataService();


