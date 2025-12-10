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
//NOTE Tham chiếu collection machines
const machinesCollectionRef = collection(db, "machines");

class machinesDataService {
    //NOTE Lấy tất cả máy
    getAllMachines() {
        return getDocs(machinesCollectionRef);
    }

	//NOTE Lấy máy theo id
	getMachineById(id) {
		const machineDoc = doc(db, "machines", id);
		return getDoc(machineDoc);
	}

    //NOTE Thêm máy mới
	addMachine(newMachine) {
		return addDoc(machinesCollectionRef, {
			...newMachine,
			createdAt: new Date(),
			updatedAt: new Date()
		});
	}

    //NOTE Cập nhật thông tin máy
	updateMachine(id, newData) {
		const machineDoc = doc(db, "machines", id);
		return updateDoc(machineDoc, {
			...newData,
			updatedAt: new Date()
		});
	}

    //NOTE Xóa máy
	deleteMachine(id) {
		const machineDoc = doc(db, "machines", id);
		return deleteDoc(machineDoc);
	}
}

export default new machinesDataService();