/* eslint-disable import/no-anonymous-default-export */
import { db } from "../firebase-config";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    setDoc,
    query,
    orderBy,
    limit,
    where,
    serverTimestamp
} from "firebase/firestore";

//NOTE Collection references
const temperatureHistoryCollection = collection(db, "temperatureHistory");
const machineTemperatureCollection = collection(db, "machineTemperature");

//NOTE Service quản lý nhiệt độ máy (Firebase + fallback localStorage)
class TemperatureService {
    constructor() {
        this.temperatureIntervals = new Map(); // Lưu trữ interval IDs
        this.isSimulationRunning = false;
        this.useLocalStorage = false; // Fallback mode
        this.defaultSettings = {
            updateInterval: 5000, // 5 giây
            minTemperature: 20,
            maxTemperature: 100,
            warningThreshold: 80,
            criticalThreshold: 90,
            temperatureVariation: 5 // Độ biến thiên nhiệt độ
        };
    }

    //NOTE Khởi tạo dữ liệu nhiệt độ giả lập cho tất cả máy
    async initializeTemperatureSimulation(machines, settings = {}) {
        if (!machines || !Array.isArray(machines) || machines.length === 0) {
            console.error('No machines provided for temperature initialization');
            throw new Error('No machines provided for temperature initialization');
        }

        const simulationSettings = { ...this.defaultSettings, ...settings };
        
        // console.log('Initializing temperature simulation for machines:', machines.length);
        
        for (const machine of machines) {
            const initialTemperature = this.generateRandomTemperature(
                simulationSettings.minTemperature,
                simulationSettings.maxTemperature
            );
            
            // console.log(`Initializing temperature for machine ${machine.id}: ${initialTemperature}°C`);
            
            // Lưu nhiệt độ hiện tại (sử dụng upsert để tạo mới nếu chưa có)
            await this.upsertMachineTemperature(machine.id, {
                temperature: initialTemperature,
                status: this.getTemperatureStatus(initialTemperature, simulationSettings),
                lastUpdated: new Date(),
                isSimulated: true
            });
            
            // Lưu lịch sử nhiệt độ
            await this.addTemperatureHistory(machine.id, initialTemperature);
        }
        
        // console.log('Temperature simulation initialized successfully');
        return true;
    }

    //NOTE Bắt đầu giả lập nhiệt độ theo thời gian thực
    startTemperatureSimulation(machines, settings = {}) {
        if (this.isSimulationRunning) {
            console.log('Temperature simulation is already running');
            return;
        }

        if (!machines || !Array.isArray(machines) || machines.length === 0) {
            console.error('No machines provided for temperature simulation');
            throw new Error('No machines provided for temperature simulation');
        }

        const simulationSettings = { ...this.defaultSettings, ...settings };
        this.isSimulationRunning = true;
        
        // console.log('Starting temperature simulation with settings:', simulationSettings);
        
        machines.forEach(machine => {
            const intervalId = setInterval(async () => {
                try {
                    const currentTemp = await this.getCurrentTemperature(machine.id);
                    const newTemperature = this.calculateNewTemperature(
                        currentTemp,
                        simulationSettings
                    );
                    
                    const temperatureData = {
                        temperature: newTemperature,
                        status: this.getTemperatureStatus(newTemperature, simulationSettings),
                        lastUpdated: new Date(),
                        isSimulated: true
                    };
                    
                    // Cập nhật nhiệt độ hiện tại
                    await this.updateMachineTemperature(machine.id, temperatureData);
                    
                    // Lưu lịch sử nhiệt độ
                    await this.addTemperatureHistory(machine.id, newTemperature);
                    
                    // console.log(`Updated temperature for machine ${machine.id}: ${newTemperature}°C`);
                    
                } catch (error) {
                    console.error(`Error updating temperature for machine ${machine.id}:`, error);
                }
            }, simulationSettings.updateInterval);
            
            this.temperatureIntervals.set(machine.id, intervalId);
        });
        
        // console.log('Temperature simulation started successfully');
    }

    //NOTE Dừng giả lập nhiệt độ
    stopTemperatureSimulation() {
        if (!this.isSimulationRunning) {
            console.log('Temperature simulation is not running');
            return;
        }
        
        this.temperatureIntervals.forEach((intervalId, machineId) => {
            clearInterval(intervalId);
            // console.log(`Stopped temperature simulation for machine ${machineId}`);
        });
        
        this.temperatureIntervals.clear();
        this.isSimulationRunning = false;
        // console.log('Temperature simulation stopped successfully');
    }

    //NOTE Cập nhật nhiệt độ hiện tại của một máy (upsert, fallback local)
    async updateMachineTemperature(machineId, temperatureData) {
        // console.log(`Attempting to update temperature for machine ${machineId}:`, temperatureData);
        
        // Validate data before sending to Firebase
        const validatedData = this.validateTemperatureData(temperatureData);
        if (!validatedData) {
            console.error('Invalid temperature data, using localStorage fallback');
            this.saveToLocalStorage('machineTemperature', machineId, {
                machineId,
                ...temperatureData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            return;
        }
        
        try {
            // Kiểm tra document có tồn tại không trước khi update
            const machineTempDoc = doc(db, "machineTemperature", machineId);
            const docSnap = await getDoc(machineTempDoc);
            
            if (docSnap.exists()) {
                // Document tồn tại, thực hiện update
                const updateData = {
                    temperature: validatedData.temperature,
                    status: validatedData.status || 'normal',
                    lastUpdated: new Date().toISOString(),
                    isSimulated: validatedData.isSimulated || false,
                    updatedAt: serverTimestamp()
                };
                
                // console.log('Document exists, updating:', updateData);
                await updateDoc(machineTempDoc, updateData);
                this.useLocalStorage = false;
                // console.log(`✅ Updated existing temperature document for machine ${machineId}: ${validatedData.temperature}°C`);
            } else {
                // Document chưa tồn tại, tạo mới với setDoc
                const createData = {
                    machineId,
                    temperature: validatedData.temperature,
                    status: validatedData.status || 'normal',
                    lastUpdated: new Date().toISOString(),
                    isSimulated: validatedData.isSimulated || false,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };
                
                // console.log('Document does not exist, creating with setDoc:', createData);
                await setDoc(machineTempDoc, createData);
                this.useLocalStorage = false;
                // console.log(`✅ Created new temperature document for machine ${machineId}: ${validatedData.temperature}°C`);
            }
        } catch (error) {
            console.warn('❌ Firebase operation failed, using localStorage fallback:', error);
            this.useLocalStorage = true;
            
            // Fallback to localStorage
            this.saveToLocalStorage('machineTemperature', machineId, {
                machineId,
                ...validatedData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
                // console.log(`💾 Saved temperature to localStorage for machine ${machineId}: ${validatedData.temperature}°C`);
        }
    }

    //NOTE Validate dữ liệu nhiệt độ trước khi gửi Firebase
    validateTemperatureData(temperatureData) {
        if (!temperatureData || typeof temperatureData !== 'object') {
            console.error('Temperature data is not an object:', temperatureData);
            return null;
        }
        
        if (typeof temperatureData.temperature !== 'number' || isNaN(temperatureData.temperature)) {
            console.error('Invalid temperature value:', temperatureData.temperature);
            return null;
        }
        
        if (temperatureData.temperature < -50 || temperatureData.temperature > 200) {
            console.error('Temperature out of valid range:', temperatureData.temperature);
            return null;
        }
        
        return {
            temperature: temperatureData.temperature,
            status: temperatureData.status || 'normal',
            isSimulated: temperatureData.isSimulated || false
        };
    }

    //NOTE Upsert nhiệt độ cho máy (setDoc merge)
    async upsertMachineTemperature(machineId, temperatureData) {
        // console.log(`Upserting temperature for machine ${machineId}:`, temperatureData);
        
        const validatedData = this.validateTemperatureData(temperatureData);
        if (!validatedData) {
            console.error('Invalid temperature data for upsert');
            return false;
        }
        
        try {
            const machineTempDoc = doc(db, "machineTemperature", machineId);
            const docData = {
                machineId,
                temperature: validatedData.temperature,
                status: validatedData.status || 'normal',
                lastUpdated: new Date().toISOString(),
                isSimulated: validatedData.isSimulated || false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            
            // console.log('Upserting document with setDoc:', docData);
            await setDoc(machineTempDoc, docData, { merge: true });
            // console.log(`✅ Upserted temperature document for machine ${machineId}: ${validatedData.temperature}°C`);
            return true;
        } catch (error) {
            console.error('❌ Error upserting temperature document:', error);
            
            // Fallback to localStorage
            this.saveToLocalStorage('machineTemperature', machineId, {
                machineId,
                ...validatedData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
                // console.log(`💾 Saved temperature to localStorage for machine ${machineId}: ${validatedData.temperature}°C`);
            return false;
        }
    }

    //NOTE Lấy nhiệt độ hiện tại của máy (Firebase, fallback local)
    async getCurrentTemperature(machineId) {
        try {
            const machineTempDoc = doc(db, "machineTemperature", machineId);
            const docSnap = await getDoc(machineTempDoc);
            
            if (docSnap.exists()) {
                return docSnap.data().temperature || 50; // Nhiệt độ mặc định 50°C
            }
            
            // Fallback to localStorage
            const localData = this.getFromLocalStorage(`machineTemp_${machineId}`);
            if (localData && localData.temperature) {
                return localData.temperature;
            }
            
            return 50; // Nhiệt độ mặc định 50°C
        } catch (error) {
            console.error('Error getting current temperature:', error);
            
            // Fallback to localStorage
            const localData = this.getFromLocalStorage(`machineTemp_${machineId}`);
            if (localData && localData.temperature) {
                return localData.temperature;
            }
            
            return 50; // Nhiệt độ mặc định 50°C
        }
    }

    //NOTE Lấy nhiệt độ bộ điều khiển, fallback/gia lập nếu thiếu dữ liệu
    async getCurrentControllerTemperature(machineId, motorTemperature = null) {
        try {
            const machineTempDoc = doc(db, "machineTemperature", machineId);
            const docSnap = await getDoc(machineTempDoc);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Kiểm tra các trường có thể chứa nhiệt độ bộ điều khiển
                if (data.controllerTemperature !== undefined && data.controllerTemperature !== null) {
                    return data.controllerTemperature;
                }
                if (data.controllerTemp !== undefined && data.controllerTemp !== null) {
                    return data.controllerTemp;
                }
                if (data.controller !== undefined && data.controller !== null) {
                    return data.controller;
                }
            }
            
            // Fallback to localStorage
            const localData = this.getFromLocalStorage(`machineTemp_${machineId}`);
            if (localData) {
                if (localData.controllerTemperature !== undefined && localData.controllerTemperature !== null) {
                    return localData.controllerTemperature;
                }
                if (localData.controllerTemp !== undefined && localData.controllerTemp !== null) {
                    return localData.controllerTemp;
                }
                if (localData.controller !== undefined && localData.controller !== null) {
                    return localData.controller;
                }
            }
            
            // Nếu không có trong database và có nhiệt độ động cơ, tính toán giả lập
            if (motorTemperature !== null && motorTemperature !== undefined) {
                return Math.max(20, motorTemperature - 25); // Tối thiểu 20°C
            }
            
            return null; // Không có dữ liệu
        } catch (error) {
            console.error('Error getting controller temperature:', error);
            
            // Fallback to localStorage
            const localData = this.getFromLocalStorage(`machineTemp_${machineId}`);
            if (localData) {
                if (localData.controllerTemperature !== undefined && localData.controllerTemperature !== null) {
                    return localData.controllerTemperature;
                }
            }
            
            // Nếu không có trong database và có nhiệt độ động cơ, tính toán giả lập
            if (motorTemperature !== null && motorTemperature !== undefined) {
                return Math.max(20, motorTemperature - 25); // Tối thiểu 20°C
            }
            
            return null; // Không có dữ liệu
        }
    }

    //NOTE Thêm bản ghi lịch sử nhiệt độ
    async addTemperatureHistory(machineId, temperature) {
        // console.log(`Adding temperature history for machine ${machineId}: ${temperature}°C`);
        
        // Validate temperature
        if (typeof temperature !== 'number' || isNaN(temperature)) {
            console.error('Invalid temperature for history:', temperature);
            return;
        }
        
        if (temperature < -50 || temperature > 200) {
            console.error('Temperature out of valid range for history:', temperature);
            return;
        }
        
        try {
            const historyData = {
                machineId,
                temperature,
                timestamp: serverTimestamp(),
                status: this.getTemperatureStatus(temperature, this.defaultSettings)
            };
            
            // console.log('Sending temperature history to Firebase:', historyData);
            await addDoc(temperatureHistoryCollection, historyData);
            // console.log(`✅ Added temperature history for machine ${machineId}: ${temperature}°C`);
        } catch (error) {
            console.error('❌ Error adding temperature history:', error);
            
            // Fallback to localStorage
            try {
                this.saveToLocalStorage('temperatureHistory', `${machineId}_${Date.now()}`, {
                    machineId,
                    temperature,
                    timestamp: new Date().toISOString(),
                    status: this.getTemperatureStatus(temperature, this.defaultSettings)
                });
                // console.log(`💾 Saved temperature history to localStorage for machine ${machineId}: ${temperature}°C`);
            } catch (localError) {
                console.error('Failed to save temperature history to localStorage:', localError);
            }
        }
    }

    //NOTE Lấy lịch sử nhiệt độ của máy
    async getTemperatureHistory(machineId, limitCount = 100) {
        try {
            console.log('🔍 Querying temperature history for machineId:', machineId);
            
            // Sử dụng query với orderBy vì index đã có
            const q = query(
                temperatureHistoryCollection,
                where("machineId", "==", machineId),
                orderBy("timestamp", "desc"),
                limit(limitCount)
            );
            
            const querySnapshot = await getDocs(q);
            console.log('📊 Query snapshot size:', querySnapshot.size);
            
            const history = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                console.log('📝 Found temperature history doc:', { 
                    id: doc.id, 
                    machineId: data.machineId, 
                    temperature: data.temperature,
                    timestamp: data.timestamp 
                });
                history.push({
                    id: doc.id,
                    ...data,
                    temperature: data.temperature || 0,
                    machineId: data.machineId || machineId,
                    status: data.status || 'normal',
                    timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : 
                              (data.timestamp ? new Date(data.timestamp) : null),
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : 
                               (data.createdAt ? new Date(data.createdAt) : null)
                });
            });
            
            // Nếu không tìm thấy với machineId chính xác, thử tìm tất cả để debug
            if (history.length === 0) {
                console.warn('⚠️ No temperature history found for machineId:', machineId);
                console.log('🔍 Checking all temperature history documents...');
                try {
                    const allDocs = await getDocs(temperatureHistoryCollection);
                    const allMachineIds = [];
                    allDocs.forEach((doc) => {
                        const data = doc.data();
                        allMachineIds.push(data.machineId);
                    });
                    const uniqueMachineIds = [...new Set(allMachineIds)];
                    console.log('📋 All machineIds in temperatureHistory:', uniqueMachineIds);
                    console.log('💡 Looking for:', machineId, 'but found:', uniqueMachineIds);
                } catch (debugError) {
                    console.error('Error checking all temperature history:', debugError);
                }
            }
            
            // Dữ liệu đã được sắp xếp bởi Firebase, nhưng đảm bảo sort lại để chắc chắn
            history.sort((a, b) => {
                const timeA = a.timestamp?.getTime() || a.createdAt?.getTime() || 0;
                const timeB = b.timestamp?.getTime() || b.createdAt?.getTime() || 0;
                return timeB - timeA; // Sắp xếp giảm dần (mới nhất trước)
            });
            
            console.log('✅ Returning temperature history:', history.length, 'items');
            return history;
        } catch (error) {
            console.error('❌ Error getting temperature history:', error);
            return [];
        }
    }

    //NOTE Lấy tất cả nhiệt độ hiện tại của các máy
    async getAllMachineTemperatures() {
        try {
            const querySnapshot = await getDocs(machineTemperatureCollection);
            const temperatures = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                temperatures.push({
                    id: doc.id,
                    machineId: data.machineId,
                    ...data
                });
            });
            
            return temperatures;
        } catch (error) {
            console.error('Error getting all machine temperatures:', error);
            return [];
        }
    }

    //NOTE Tạo nhiệt độ ngẫu nhiên trong khoảng
    generateRandomTemperature(min, max) {
        return Math.round((Math.random() * (max - min) + min) * 10) / 10;
    }

    //NOTE Tính nhiệt độ mới dựa trên nhiệt độ hiện tại + biến thiên
    calculateNewTemperature(currentTemp, settings) {
        const variation = settings.temperatureVariation || 5;
        const change = (Math.random() - 0.5) * 2 * variation;
        const newTemp = currentTemp + change;
        
        // Đảm bảo nhiệt độ trong khoảng cho phép
        return Math.max(
            settings.minTemperature,
            Math.min(settings.maxTemperature, Math.round(newTemp * 10) / 10)
        );
    }

    //NOTE Xác định trạng thái nhiệt độ theo ngưỡng
    getTemperatureStatus(temperature, settings) {
        if (temperature >= settings.criticalThreshold) {
            return 'critical';
        } else if (temperature >= settings.warningThreshold) {
            return 'warning';
        } else {
            return 'normal';
        }
    }

    //NOTE Lấy thống kê nhiệt độ (dùng fallback)
    async getTemperatureStats() {
        return await this.getTemperatureStatsFallback();
    }

    //NOTE Kiểm tra trạng thái giả lập
    isSimulationActive() {
        return this.isSimulationRunning;
    }

    //NOTE Lấy danh sách máy đang được giả lập
    getSimulatedMachines() {
        return Array.from(this.temperatureIntervals.keys());
    }

    //NOTE Helper localStorage fallback
    
    //NOTE Lưu dữ liệu vào localStorage
    saveToLocalStorage(collection, docId, data) {
        try {
            const key = `${collection}_${docId}`;
            localStorage.setItem(key, JSON.stringify(data));
            // console.log(`Saved to localStorage: ${key}`);
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    //NOTE Đọc dữ liệu từ localStorage
    getFromLocalStorage(collection, docId) {
        try {
            const key = `${collection}_${docId}`;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    }

    //NOTE Lấy tất cả dữ liệu localStorage theo prefix collection
    getAllFromLocalStorage(collection) {
        try {
            // console.log(`Getting localStorage data for collection: ${collection}`);
            const results = [];
            const keys = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                keys.push(key);
                if (key && key.startsWith(`${collection}_`)) {
                    const data = localStorage.getItem(key);
                    // console.log(`Found localStorage key: ${key}, data:`, data);
                    if (data) {
                        try {
                            const parsedData = JSON.parse(data);
                            results.push(parsedData);
                            // console.log(`Parsed data for ${key}:`, parsedData);
                        } catch (parseError) {
                            console.error(`Error parsing localStorage data for ${key}:`, parseError);
                        }
                    }
                }
            }
            
            // console.log(`All localStorage keys:`, keys);
            // console.log(`Found ${results.length} items for collection ${collection}:`, results);
            return results;
        } catch (error) {
            console.error('Error getting all from localStorage:', error);
            return [];
        }
    }

    //NOTE Fallback: lấy nhiệt độ máy (ưu tiên Firebase, fallback local)
    async getAllMachineTemperaturesFallback() {
        // console.log('=== getAllMachineTemperaturesFallback START ===');
        
        try {
            // console.log('Attempting to get Firebase data...');
            const firebaseData = await this.getAllMachineTemperatures();
            // console.log('Firebase temperature data received:', firebaseData);
            
            if (firebaseData.length > 0) {
                // console.log('Using Firebase data, count:', firebaseData.length);
                return firebaseData;
            } else {
                // console.log('Firebase data is empty, trying localStorage...');
            }
        } catch (error) {
            console.warn('Firebase failed, using localStorage fallback:', error);
        }
        
        // Fallback to localStorage
        // console.log('Getting localStorage data...');
        const localData = this.getAllFromLocalStorage('machineTemperature');
        // console.log('LocalStorage temperature data received:', localData);
        // console.log('=== getAllMachineTemperaturesFallback END ===');
        
        return localData;
    }

    //NOTE Fallback: thống kê nhiệt độ
    async getTemperatureStatsFallback() {
        try {
            const allTemperatures = await this.getAllMachineTemperaturesFallback();
            
            const stats = {
                totalMachines: allTemperatures.length,
                normal: 0,
                warning: 0,
                critical: 0,
                averageTemperature: 0,
                maxTemperature: 0,
                minTemperature: 100
            };
            
            let totalTemp = 0;
            
            allTemperatures.forEach(temp => {
                totalTemp += temp.temperature;
                stats.maxTemperature = Math.max(stats.maxTemperature, temp.temperature);
                stats.minTemperature = Math.min(stats.minTemperature, temp.temperature);
                
                if (temp.status === 'critical') {
                    stats.critical++;
                } else if (temp.status === 'warning') {
                    stats.warning++;
                } else {
                    stats.normal++;
                }
            });
            
            stats.averageTemperature = allTemperatures.length > 0 
                ? Math.round((totalTemp / allTemperatures.length) * 10) / 10 
                : 0;
            
            return stats;
        } catch (error) {
            console.error('Error getting temperature stats:', error);
            return null;
        }
    }
}

export default new TemperatureService();

