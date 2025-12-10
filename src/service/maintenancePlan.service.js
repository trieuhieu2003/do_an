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

// Collection Firestore cho kế hoạch bảo trì
const maintenancePlansCollectionRef = collection(db, "maintenancePlans");

class maintenancePlansDataService {
  getAllMaintenancePlans() {
    return getDocs(maintenancePlansCollectionRef);
  }

  getMaintenancePlanById(id) {
    const planDoc = doc(db, "maintenancePlans", id);
    return getDoc(planDoc);
  }

  addMaintenancePlan(newPlan) {
    return addDoc(maintenancePlansCollectionRef, {
      ...newPlan,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  updateMaintenancePlan(id, newData) {
    const planDoc = doc(db, "maintenancePlans", id);
    return updateDoc(planDoc, {
      ...newData,
      updatedAt: new Date(),
    });
  }

  deleteMaintenancePlan(id) {
    const planDoc = doc(db, "maintenancePlans", id);
    return deleteDoc(planDoc);
  }
}

export default new maintenancePlansDataService();


