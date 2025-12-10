/* eslint-disable import/no-anonymous-default-export */
import { db } from '../firebase-config';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
} from 'firebase/firestore';

//NOTE Collection Firestore cho rung hiện tại và lịch sử
const vibrationCollection = collection(db, 'machineVibration');
const vibrationHistoryCollection = collection(db, 'vibrationHistory');

//NOTE Service quản lý dữ liệu rung động (Firebase + fallback localStorage)
class VibrationService {
    constructor() {
        this.defaultSettings = {
            minVibration: 1,
            maxVibration: 9,
            warningThreshold: 4,
            criticalThreshold: 7
        };
    }

    //NOTE Xác định trạng thái rung theo ngưỡng
    getVibrationStatus(value = 0) {
        if (value >= this.defaultSettings.criticalThreshold) return 'critical';
        if (value >= this.defaultSettings.warningThreshold) return 'warning';
        return 'normal';
    }

    //NOTE Sinh giá trị rung ngẫu nhiên
    generateRandomVibration(min = this.defaultSettings.minVibration, max = this.defaultSettings.maxVibration) {
        return Math.round((Math.random() * (max - min) + min) * 10) / 10;
    }

    //NOTE Validate dữ liệu rung trước khi lưu
    validateVibrationData(vibrationData) {
        if (!vibrationData || typeof vibrationData !== 'object') {
            console.error('Vibration data is not an object:', vibrationData);
            return null;
        }

        const value = typeof vibrationData.value === 'number'
            ? vibrationData.value
            : typeof vibrationData.vibration === 'number'
                ? vibrationData.vibration
                : NaN;

        if (isNaN(value)) {
            console.error('Invalid vibration value:', vibrationData.value);
            return null;
        }

        if (value < 0 || value > 20) {
            console.error('Vibration out of range:', value);
            return null;
        }

        return {
            value,
            status: vibrationData.status || this.getVibrationStatus(value),
            isSimulated: vibrationData.isSimulated || false,
            lastUpdated: vibrationData.lastUpdated ? new Date(vibrationData.lastUpdated).toISOString() : new Date().toISOString()
        };
    }

    //NOTE Khởi tạo dữ liệu rung giả lập cho danh sách máy
    async initializeVibrationSimulation(machines = []) {
        if (!Array.isArray(machines) || machines.length === 0) {
            return;
        }

        for (const machine of machines) {
            const value = this.generateRandomVibration();
            await this.upsertMachineVibration(machine.id, {
                value,
                status: this.getVibrationStatus(value),
                isSimulated: true,
                lastUpdated: new Date().toISOString()
            });
            await this.addVibrationHistory(machine.id, value);
        }
    }

    //NOTE Cập nhật rung hiện tại của máy (Firebase, fallback local)
    async updateMachineVibration(machineId, vibrationData) {
        const validatedData = this.validateVibrationData(vibrationData);
        if (!validatedData) {
            this.saveToLocalStorage('machineVibration', machineId, {
                machineId,
                ...vibrationData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            return;
        }

        try {
            const vibrationDoc = doc(db, 'machineVibration', machineId);
            const docSnap = await getDoc(vibrationDoc);
            const payload = {
                machineId,
                vibration: validatedData.value,
                status: validatedData.status,
                lastUpdated: validatedData.lastUpdated,
                isSimulated: validatedData.isSimulated,
                updatedAt: serverTimestamp()
            };

            if (docSnap.exists()) {
                await updateDoc(vibrationDoc, payload);
            } else {
                await setDoc(vibrationDoc, {
                    ...payload,
                    createdAt: serverTimestamp()
                });
            }
        } catch (error) {
            console.warn('Failed to update vibration in Firestore, using localStorage fallback:', error);
            this.saveToLocalStorage('machineVibration', machineId, {
                machineId,
                vibration: validatedData.value,
                status: validatedData.status,
                lastUpdated: validatedData.lastUpdated,
                isSimulated: validatedData.isSimulated,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
    }

    //NOTE Upsert rung hiện tại (setDoc merge)
    async upsertMachineVibration(machineId, vibrationData) {
        const validatedData = this.validateVibrationData(vibrationData);
        if (!validatedData) {
            return false;
        }

        try {
            const vibrationDoc = doc(db, 'machineVibration', machineId);
            await setDoc(vibrationDoc, {
                machineId,
                vibration: validatedData.value,
                status: validatedData.status,
                lastUpdated: validatedData.lastUpdated,
                isSimulated: validatedData.isSimulated,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }, { merge: true });
            return true;
        } catch (error) {
            console.error('Error upserting vibration data:', error);
            this.saveToLocalStorage('machineVibration', machineId, {
                machineId,
                vibration: validatedData.value,
                status: validatedData.status,
                lastUpdated: validatedData.lastUpdated,
                isSimulated: validatedData.isSimulated,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            return false;
        }
    }

    //NOTE Thêm lịch sử rung động
    async addVibrationHistory(machineId, value) {
        if (typeof value !== 'number' || isNaN(value)) {
            return;
        }

        try {
            await addDoc(vibrationHistoryCollection, {
                machineId,
                vibration: value,
                status: this.getVibrationStatus(value),
                timestamp: serverTimestamp()
            });
        } catch (error) {
            console.error('Error adding vibration history:', error);
            this.saveToLocalStorage('vibrationHistory', `${machineId}_${Date.now()}`, {
                machineId,
                vibration: value,
                status: this.getVibrationStatus(value),
                timestamp: new Date().toISOString()
            });
        }
    }

    //NOTE Lấy tất cả rung hiện tại của máy
    async getAllMachineVibrations() {
        try {
            const querySnapshot = await getDocs(vibrationCollection);
            const vibrations = [];

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                vibrations.push({
                    id: docSnap.id,
                    machineId: data.machineId || docSnap.id,
                    vibration: data.vibration,
                    value: data.vibration,
                    status: data.status,
                    lastUpdated: data.lastUpdated,
                    isSimulated: data.isSimulated
                });
            });

            return vibrations;
        } catch (error) {
            console.error('Error getting machine vibrations:', error);
            return [];
        }
    }

    //NOTE Fallback lấy rung hiện tại (ưu tiên Firebase, rồi local)
    async getAllMachineVibrationsFallback() {
        try {
            const firebaseData = await this.getAllMachineVibrations();
            if (firebaseData.length > 0) {
                return firebaseData;
            }
        } catch (error) {
            console.warn('Falling back to localStorage for vibration data:', error);
        }

        return this.getAllFromLocalStorage('machineVibration');
    }

    /**
     * Lấy lịch sử rung động của một máy
     * @param {string} machineId - ID của máy
     * @param {number} limitCount - Số lượng bản ghi cần lấy (mặc định 100)
     * @returns {Array} Mảng các bản ghi lịch sử rung động
     */
    //NOTE Lấy lịch sử rung động theo machineId
    async getVibrationHistory(machineId, limitCount = 100) {
        try {
            // Sử dụng query với orderBy vì index đã có sẵn trong Firebase
            const q = query(
                vibrationHistoryCollection,
                where("machineId", "==", machineId),
                orderBy("timestamp", "desc"),
                limit(limitCount)
            );
            
            const querySnapshot = await getDocs(q);
            const history = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                history.push({
                    id: doc.id,
                    ...data,
                    vibration: data.vibration || data.value || 0,
                    value: data.vibration || data.value || 0,
                    machineId: data.machineId || machineId,
                    status: data.status || 'normal',
                    timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : 
                              (data.timestamp ? new Date(data.timestamp) : new Date()),
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : 
                               (data.createdAt ? new Date(data.createdAt) : null)
                });
            });
            
            // Dữ liệu đã được sắp xếp bởi Firebase, nhưng đảm bảo sort lại để chắc chắn
            history.sort((a, b) => {
                const timeA = a.timestamp?.getTime() || a.createdAt?.getTime() || 0;
                const timeB = b.timestamp?.getTime() || b.createdAt?.getTime() || 0;
                return timeB - timeA; // Sắp xếp giảm dần (mới nhất trước)
            });
            
            return history;
        } catch (error) {
            console.error('Error getting vibration history:', error);
            // Fallback: lấy từ localStorage
            try {
                const localHistory = this.getAllFromLocalStorage('vibrationHistory');
                return localHistory
                    .filter(item => item.machineId === machineId)
                    .sort((a, b) => {
                        const timeA = new Date(a.timestamp || 0).getTime();
                        const timeB = new Date(b.timestamp || 0).getTime();
                        return timeB - timeA;
                    })
                    .slice(0, limitCount)
                    .map(item => ({
                        ...item,
                        timestamp: new Date(item.timestamp || Date.now())
                    }));
            } catch (localError) {
                console.error('Error getting vibration history from localStorage:', localError);
                return [];
            }
        }
    }

    //NOTE Lưu dữ liệu rung vào localStorage
    saveToLocalStorage(collectionName, docId, data) {
        try {
            const key = `${collectionName}_${docId}`;
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving vibration data to localStorage:', error);
        }
    }

    //NOTE Lấy toàn bộ dữ liệu rung trong localStorage theo prefix
    getAllFromLocalStorage(collectionName) {
        try {
            const results = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(`${collectionName}_`)) {
                    const data = localStorage.getItem(key);
                    if (data) {
                        results.push(JSON.parse(data));
                    }
                }
            }
            return results;
        } catch (error) {
            console.error('Error reading vibration data from localStorage:', error);
            return [];
        }
    }
}

export default new VibrationService();


