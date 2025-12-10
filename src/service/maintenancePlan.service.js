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

//NOTE Collection Firestore cho kế hoạch bảo trì
const maintenancePlansCollectionRef = collection(db, "maintenancePlans");

class maintenancePlansDataService {
  //NOTE Lấy tất cả kế hoạch bảo trì
  getAllMaintenancePlans() {
    return getDocs(maintenancePlansCollectionRef);
  }

  //NOTE Lấy kế hoạch theo id
  getMaintenancePlanById(id) {
    const planDoc = doc(db, "maintenancePlans", id);
    return getDoc(planDoc);
  }

  //NOTE Thêm kế hoạch bảo trì mới
  addMaintenancePlan(newPlan) {
    return addDoc(maintenancePlansCollectionRef, {
      ...newPlan,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  //NOTE Cập nhật kế hoạch bảo trì
  updateMaintenancePlan(id, newData) {
    const planDoc = doc(db, "maintenancePlans", id);
    return updateDoc(planDoc, {
      ...newData,
      updatedAt: new Date(),
    });
  }

  //NOTE Xóa kế hoạch bảo trì
  deleteMaintenancePlan(id) {
    const planDoc = doc(db, "maintenancePlans", id);
    return deleteDoc(planDoc);
  }
}

export default new maintenancePlansDataService();


