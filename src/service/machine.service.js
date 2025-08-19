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
const machinesCollectionRef = collection(db, "machines");

class machinesDataService {
    getAllMachines() {
        return getDocs(machinesCollectionRef);
    }
}

export default new machinesDataService();