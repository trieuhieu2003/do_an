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

//NOTE Collection Firestore cho loại máy
const machineTypesCollectionRef = collection(db, "machineTypes");

class machineTypesDataService {
  //NOTE Lấy tất cả loại máy
  getAllMachineTypes() {
    return getDocs(machineTypesCollectionRef);
  }

  //NOTE Lấy loại máy theo id
  getMachineTypeById(id) {
    const machineTypeDoc = doc(db, "machineTypes", id);
    return getDoc(machineTypeDoc);
  }

  //NOTE Thêm loại máy mới
  addMachineType(newMachineType) {
    return addDoc(machineTypesCollectionRef, {
      ...newMachineType,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  //NOTE Cập nhật loại máy
  updateMachineType(id, newData) {
    const machineTypeDoc = doc(db, "machineTypes", id);
    return updateDoc(machineTypeDoc, {
      ...newData,
      updatedAt: new Date(),
    });
  }

  //NOTE Xóa loại máy
  deleteMachineType(id) {
    const machineTypeDoc = doc(db, "machineTypes", id);
    return deleteDoc(machineTypeDoc);
  }
}

export default new machineTypesDataService();


