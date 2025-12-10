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

	getMachineById(id) {
		const machineDoc = doc(db, "machines", id);
		return getDoc(machineDoc);
	}

	addMachine(newMachine) {
		return addDoc(machinesCollectionRef, {
			...newMachine,
			createdAt: new Date(),
			updatedAt: new Date()
		});
	}

	updateMachine(id, newData) {
		const machineDoc = doc(db, "machines", id);
		return updateDoc(machineDoc, {
			...newData,
			updatedAt: new Date()
		});
	}

	deleteMachine(id) {
		const machineDoc = doc(db, "machines", id);
		return deleteDoc(machineDoc);
	}
}

export default new machinesDataService();