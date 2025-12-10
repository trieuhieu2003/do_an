import React, { useState, useEffect } from 'react';
import {
    Card,
    Row,
    Col,
    Button,
    Table,
    Tag,
    Space,
    Typography,
    Statistic,
    Tabs,
    Pagination,
    Input,
    Select,
    Tooltip,
    Alert,
    Badge,
    Modal,
    Spin,
    message,
    Popconfirm,
    Progress,
    Grid
} from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    ReloadOutlined,
    SettingOutlined,
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    WarningOutlined,
    FireOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined,
    ThunderboltOutlined,
    DashboardOutlined
} from '@ant-design/icons';
import AddMachine from './addmachine';
import EditMachine from './editmachine';
import machinesDataService from '../../service/machine.service';
import machineTypesDataService from '../../service/machineType.service';
import maintenancePlansDataService from '../../service/maintenancePlan.service';
import temperatureService from '../../service/temperature.service';
import vibrationService from '../../service/vibration.service';
import alertService from '../../service/alert.service';

const { Title, Text } = Typography;
const { Option } = Select;

const MachineDashboard = () => {
    const screens = Grid.useBreakpoint();
    const [activeTab, setActiveTab] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isMaintenancePlansModalVisible, setIsMaintenancePlansModalVisible] = useState(false);
    const [selectedMachineId, setSelectedMachineId] = useState(null);
    const [selectedMachineType, setSelectedMachineType] = useState(null);
    const [maintenancePlans, setMaintenancePlans] = useState([]);
    const [loadingMaintenancePlans, setLoadingMaintenancePlans] = useState(false);
    const [machineData, setMachineData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    
    // Temperature simulation states
    const [temperatureStats, setTemperatureStats] = useState({
        totalMachines: 0,
        normalTemp: 0,
        warningTemp: 0,
        criticalTemp: 0,
        averageTemp: 0
    });
    const [isTemperatureSimulationRunning, setIsTemperatureSimulationRunning] = useState(false);

    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const showEditModal = (machine) => {
        setSelectedMachineId(machine.key);
        setIsEditModalVisible(true);
    };

    const handleEditCancel = () => {
        setIsEditModalVisible(false);
        setSelectedMachineId(null);
    };

    // Load và hiển thị kế hoạch bảo trì theo loại máy
    const showMaintenancePlans = async (machine) => {
        const machineTypeCode = machine.machineType;
        if (!machineTypeCode) {
            message.warning('Máy này chưa có loại máy được chỉ định.');
            return;
        }
        
        setIsMaintenancePlansModalVisible(true);
        setLoadingMaintenancePlans(true);
        
        // Khai báo machineTypeName ở scope cao hơn để có thể sử dụng trong catch block
        let machineTypeName = machineTypeCode;
        
        try {
            // Lấy tên loại máy từ machineType code
            try {
                const machineTypesSnapshot = await machineTypesDataService.getAllMachineTypes();
                machineTypesSnapshot.forEach((doc) => {
                    const docData = doc.data();
                    // Nếu machineType là code, tìm name tương ứng
                    if (docData.code === machineTypeCode || doc.id === machineTypeCode) {
                        machineTypeName = docData.name || machineTypeCode;
                    }
                    // Nếu machineType đã là name, giữ nguyên
                    if (docData.name === machineTypeCode) {
                        machineTypeName = docData.name;
                    }
                });
            } catch (typeError) {
                console.warn('Không thể load loại máy, sử dụng giá trị mặc định:', typeError);
            }
            
            setSelectedMachineType(machineTypeName);
            
            // Load kế hoạch bảo trì
            const querySnapshot = await maintenancePlansDataService.getAllMaintenancePlans();
            const plans = [];
            
            querySnapshot.forEach((doc) => {
                const docData = doc.data();
                // So sánh với code (docData.type là code trong database)
                // Hoặc với name nếu dữ liệu cũ vẫn lưu name
                if (docData.type === machineTypeCode || docData.type === machineTypeName) {
                    plans.push({
                        key: doc.id,
                        name: docData.name || '',
                        type: docData.type || '',
                        typeName: docData.typeName || machineTypeName || docData.type || '', // Ưu tiên typeName từ DB, fallback về machineTypeName
                        description: docData.description || '',
                        frequency: docData.frequency || 'Hàng tháng',
                        color: docData.color || 'blue'
                    });
                }
            });
            
            setMaintenancePlans(plans);
            
            if (plans.length === 0) {
                message.info(`Không tìm thấy kế hoạch bảo trì cho loại máy "${machineTypeName}"`);
            }
        } catch (error) {
            console.error('Lỗi khi load kế hoạch bảo trì:', error);
            message.error('Không thể tải kế hoạch bảo trì.');
            
            // Fallback: load từ localStorage
            try {
                const localPlans = JSON.parse(localStorage.getItem('maintenancePlans') || '[]');
                const filteredPlans = localPlans
                    .filter(plan => 
                        plan.type === machineTypeCode || plan.type === machineTypeName
                    )
                    .map(plan => ({
                        ...plan,
                        typeName: plan.typeName || machineTypeName || plan.type || '' // Đảm bảo có typeName
                    }));
                setMaintenancePlans(filteredPlans);
            } catch (localError) {
                console.error('Lỗi khi load từ localStorage:', localError);
                setMaintenancePlans([]);
            }
        } finally {
            setLoadingMaintenancePlans(false);
        }
    };

    const handleCloseMaintenancePlansModal = () => {
        setIsMaintenancePlansModalVisible(false);
        setSelectedMachineType(null);
        setMaintenancePlans([]);
    };

    const handleEditSuccess = (updatedData) => {
        console.log('Edit success - updatedData:', updatedData);
        console.log('Selected machine ID:', selectedMachineId);
        
        // Cập nhật máy trong danh sách với dữ liệu đầy đủ
        setMachineData(prev => 
            prev.map(machine => {
                if (machine.key === selectedMachineId) {
                    const updatedMachine = {
                        ...machine,
                        ...updatedData,
                        // Đảm bảo status được cập nhật đúng
                        status: updatedData.status || machine.status,
                        // Cập nhật thời gian
                        updatedAt: new Date(),
                        // Xử lý dữ liệu để đảm bảo format đúng
                        name: updatedData.machineName || machine.name,
                        id: updatedData.machineCode || machine.id,
                        machineType: updatedData.machineType || machine.machineType,
                        location: updatedData.location || machine.location
                    };
                    console.log('Updated machine:', updatedMachine);
                    return updatedMachine;
                }
                return machine;
            })
        );
        
        setIsEditModalVisible(false);
        setSelectedMachineId(null);
        
        // Hiển thị thông báo thành công
        message.success(`Máy "${updatedData.machineName || 'Unknown'}" đã được cập nhật thành công!`);
        
        // Reload dữ liệu từ Firebase để đảm bảo đồng bộ
        setTimeout(() => {
            loadMachines();
        }, 1000);
    };

    // Xử lý xóa máy
    const handleDeleteMachine = async (machine) => {
        try {
            // Xóa từ Firebase
            await machinesDataService.deleteMachine(machine.key);
            
            // Cập nhật danh sách máy
            setMachineData(prev => prev.filter(m => m.key !== machine.key));
            
            message.success(`Máy "${machine.name}" đã được xóa thành công!`);
            
            // Gửi cảnh báo Telegram
            alertService.sendMachineAlert('delete', {
                name: machine.name,
                machineName: machine.name,
                id: machine.key,
                machineCode: machine.id,
                machineType: machine.machineType,
                location: machine.location,
                status: machine.status
            });
        } catch (error) {
            console.error('Error deleting machine:', error);
            
            // Fallback: Xóa từ localStorage
            try {
                const existingMachines = JSON.parse(localStorage.getItem('machines') || '[]');
                const updatedMachines = existingMachines.filter(m => m.id !== machine.key);
                localStorage.setItem('machines', JSON.stringify(updatedMachines));
                
                // Cập nhật danh sách máy
                setMachineData(prev => prev.filter(m => m.key !== machine.key));
                
                message.warning('Máy đã được xóa tạm thời (Firebase không khả dụng).');
                
                // Gửi cảnh báo Telegram cho fallback
                alertService.sendMachineAlert('delete', {
                    name: machine.name,
                    machineName: machine.name,
                    id: machine.key,
                    machineCode: machine.id,
                    machineType: machine.machineType,
                    location: machine.location,
                    status: machine.status
                });
            } catch (localError) {
                console.error('Error deleting from localStorage:', localError);
                message.error('Có lỗi xảy ra khi xóa máy!');
            }
        }
    };


    // Load temperature statistics
    const loadTemperatureStats = async () => {
        try {
            const stats = await temperatureService.getTemperatureStatsFallback();
            setTemperatureStats(stats);
            
            // Create alerts for high temperature machines
            if (stats.highTempMachines && stats.highTempMachines.length > 0) {
                for (const machine of stats.highTempMachines) {
                    await createTemperatureAlert(machine, machine.temperature);
                }
            }
        } catch (error) {
            console.error('Error loading temperature stats:', error);
        }
    };

    // Initialize temperature simulation
    const initializeTemperatureSimulation = async () => {
        try {
            // Chỉ lấy máy đang hoạt động
            const activeMachines = machineData
                .filter(machine => machine.status === 'active')
                .map(machine => ({
                    id: machine.id,
                    name: machine.name,
                    status: machine.status
                }));
            
            if (activeMachines.length === 0) {
                message.warning('Chỉ khởi tạo nhiệt độ cho máy đang hoạt động. Hiện không có máy nào ở trạng thái này.');
                return;
            }
            
            await temperatureService.initializeTemperatureSimulation(activeMachines);
            await vibrationService.initializeVibrationSimulation(activeMachines);
            message.success('Đã khởi tạo dữ liệu nhiệt độ & độ rung!');
            loadTemperatureStats();
            loadMachines(); // Reload để hiển thị nhiệt độ mới
        } catch (error) {
            console.error('Error initializing temperature simulation:', error);
            message.error('Có lỗi khi khởi tạo nhiệt độ!');
        }
    };

    const getVibrationStatus = (value = 0) => {
        if (value >= 7) return 'critical';
        if (value >= 4) return 'warning';
        return 'normal';
    };

    const generateVibrationSnapshot = (current = 3.5, temperatureStatus = 'normal') => {
        const base = isNaN(current) ? 3.5 : current;
        const drift = Math.random() * 1.4 - 0.7; // -0.7 đến +0.7
        const tempImpact = temperatureStatus === 'critical' ? 1.2 : temperatureStatus === 'warning' ? 0.5 : 0;
        const nextValue = Math.max(1, parseFloat((base + drift + tempImpact).toFixed(1)));
        return {
            value: nextValue,
            status: getVibrationStatus(nextValue),
            timestamp: new Date()
        };
    };

    const simulateEfficiency = (
        prevEfficiency = 85,
        temperature = 70,
        temperatureStatus = 'normal',
        vibration = 3.5,
        vibrationStatus = 'normal'
    ) => {
        const normalizedPrev = Math.max(70, isNaN(prevEfficiency) ? 85 : prevEfficiency);
        const tempPenalty = Math.max(0, temperature - 70) * 0.2;
        const temperatureStatusPenalty = temperatureStatus === 'critical' ? 8 : temperatureStatus === 'warning' ? 4 : 0;
        const vibrationPenalty = vibrationStatus === 'critical' ? 6 : vibrationStatus === 'warning' ? 3 : 0;
        const vibrationDrift = Math.max(0, vibration - 4) * 0.5;
        const randomDrift = Math.random() * 4 - 2; // -2 đến +2
        const calculated = normalizedPrev - tempPenalty - temperatureStatusPenalty - vibrationPenalty - vibrationDrift + randomDrift;
        return Math.max(65, Math.min(100, Math.round(calculated)));
    };

    // Toggle temperature simulation
    const toggleTemperatureSimulation = async () => {
        try {
            if (isTemperatureSimulationRunning) {
                await temperatureService.stopTemperatureSimulation();
                setIsTemperatureSimulationRunning(false);
                message.info('Đã dừng giả lập nhiệt độ');
            } else {
                // Chỉ lấy máy đang hoạt động
                const activeMachines = machineData
                    .filter(machine => machine.status === 'active')
                    .map(machine => ({
                        id: machine.id,
                        name: machine.name,
                        status: machine.status
                    }));
                
                if (activeMachines.length === 0) {
                    message.warning('Chỉ giả lập nhiệt độ cho máy đang hoạt động. Hiện không có máy nào ở trạng thái này.');
                    return;
                }
                
                await temperatureService.startTemperatureSimulation(activeMachines);
                setIsTemperatureSimulationRunning(true);
                message.success('Đã bắt đầu giả lập nhiệt độ');
            }
        } catch (error) {
            console.error('Error toggling temperature simulation:', error);
            message.error('Có lỗi khi thay đổi trạng thái giả lập!');
        }
    };

    // Load machine temperatures
    const loadMachineTemperatures = async () => {
        try {
            const temperatures = await temperatureService.getAllMachineTemperaturesFallback();
            const vibrations = await vibrationService.getAllMachineVibrationsFallback();
            const vibrationMap = new Map(
                vibrations.map(v => [v.machineId || v.id, v])
            );
            console.log('Loaded machine temperatures:', temperatures);
            
            // Update machine data with temperature information and create alerts
            setMachineData(prev => prev.map(machine => {
                if (machine.status !== 'active') {
                    return machine;
                }

                let updatedMachine = { ...machine };
                const tempData = temperatures.find(t => t.machineId === machine.id);
                if (tempData) {
                    updatedMachine = {
                        ...updatedMachine,
                        temperature: tempData.temperature,
                        temperatureStatus: tempData.status,
                        temperatureLastUpdated: tempData.lastUpdated,
                        isSimulated: tempData.isSimulated,
                    };
                    
                    // Create temperature alert if temperature is high
                    if (tempData.temperature > 80) {
                        createTemperatureAlert(updatedMachine, tempData.temperature);
                    }
                }

                const persistedVibration = vibrationMap.get(updatedMachine.id);
                const baseVibrationValue = persistedVibration
                    ? (typeof persistedVibration.value === 'number'
                        ? persistedVibration.value
                        : typeof persistedVibration.vibration === 'number'
                            ? persistedVibration.vibration
                            : updatedMachine.vibration)
                    : updatedMachine.vibration;

                const vibrationSnapshot = generateVibrationSnapshot(
                    baseVibrationValue,
                    updatedMachine.temperatureStatus
                );

                const newEfficiency = simulateEfficiency(
                    updatedMachine.efficiency,
                    updatedMachine.temperature,
                    updatedMachine.temperatureStatus,
                    vibrationSnapshot.value,
                    vibrationSnapshot.status
                );

                const nextMachineState = {
                    ...updatedMachine,
                    vibration: vibrationSnapshot.value,
                    vibrationStatus: vibrationSnapshot.status,
                    vibrationLastUpdated: vibrationSnapshot.timestamp,
                    efficiency: newEfficiency
                };

                // Tạo cảnh báo độ rung nếu độ rung cao (>= 4 mm/s)
                if (vibrationSnapshot.value >= 4) {
                    createVibrationAlert(nextMachineState, vibrationSnapshot.value);
                }

                vibrationService.updateMachineVibration(updatedMachine.id, {
                    value: vibrationSnapshot.value,
                    status: vibrationSnapshot.status,
                    lastUpdated: vibrationSnapshot.timestamp,
                    isSimulated: updatedMachine.isSimulated
                }).catch(error => {
                    console.error('Error saving vibration data:', error);
                });

                vibrationService.addVibrationHistory(updatedMachine.id, vibrationSnapshot.value)
                    .catch(error => {
                        console.error('Error saving vibration history:', error);
                    });

                return nextMachineState;
            }));
        } catch (error) {
            console.error('Error loading machine temperatures:', error);
        }
    };

    // Create vibration alert
    const createVibrationAlert = async (machine, vibration) => {
        try {
            console.log(`Checking vibration alert for machine ${machine.name}: ${vibration} mm/s`);
            
            // Check if alert already exists for this machine and vibration
            const existingAlerts = await alertService.getAllAlerts();
            const hasRecentAlert = existingAlerts.docs.some(doc => {
                const alertData = doc.data();
                const alertTime = alertData.createdAt?.toDate ? alertData.createdAt.toDate() : new Date(alertData.createdAt);
                const timeDiff = Date.now() - alertTime.getTime();
                
                return alertData.machineId === machine.id &&
                       alertData.type === 'độ rung' &&
                       timeDiff < 60000; // Within last minute
            });

            console.log('Has recent vibration alert:', hasRecentAlert);

            if (!hasRecentAlert) {
                console.log(`Creating vibration alert for machine ${machine.name}: ${vibration} mm/s`);
                try {
                    await alertService.createVibrationAlert(machine, vibration);
                    console.log(`✅ Created vibration alert for machine ${machine.name}: ${vibration} mm/s`);
                } catch (firebaseError) {
                    console.error('Firebase error, trying localStorage fallback:', firebaseError);
                    // Fallback to localStorage
                    const alertData = {
                        machineId: machine.id,
                        machineName: machine.name,
                        machineType: machine.machineType,
                        location: machine.location,
                        type: 'độ rung',
                        status: vibration >= 7 ? 'critical' : 'warning',
                        value: `${vibration} mm/s`,
                        threshold: vibration >= 7 ? '7 mm/s' : '4 mm/s',
                        acknowledged: false,
                        area: machine.location,
                        description: vibration >= 7
                            ? `Độ rung máy ${machine.name} ở mức nguy hiểm (${vibration} mm/s >= 7 mm/s)`
                            : `Độ rung máy ${machine.name} cao hơn bình thường (${vibration} mm/s >= 4 mm/s)`
                    };
                    await alertService.saveAlertToLocalStorage(alertData);
                    // Gửi cảnh báo Telegram cho fallback
                    await alertService.sendVibrationAlertToTelegram(alertData);
                    console.log(`✅ Created vibration alert in localStorage for machine ${machine.name}: ${vibration} mm/s`);
                }
            } else {
                console.log(`⏭️ Skipping duplicate vibration alert for machine ${machine.name}`);
            }
        } catch (error) {
            console.error('❌ Error creating vibration alert:', error);
        }
    };

    // Create temperature alert
    const createTemperatureAlert = async (machine, temperature) => {
        try {
            console.log(`Checking temperature alert for machine ${machine.name}: ${temperature}°C`);
            
            // Check if alert already exists for this machine and temperature
            const existingAlerts = await alertService.getAllAlerts();
            console.log('Existing alerts:', existingAlerts.docs.length);
            
            const hasRecentAlert = existingAlerts.docs.some(doc => {
                const alert = doc.data();
                return alert.machineId === machine.id && 
                       alert.type === 'nhiệt độ' && 
                       !alert.acknowledged &&
                       new Date() - alert.createdAt.toDate() < 30000; // Within last minute
            });

            console.log('Has recent alert:', hasRecentAlert);

            if (!hasRecentAlert) {
                console.log(`Creating temperature alert for machine ${machine.name}: ${temperature}°C`);
                try {
                    await alertService.createTemperatureAlert(machine, temperature);
                    console.log(`✅ Created temperature alert for machine ${machine.name}: ${temperature}°C`);
                } catch (firebaseError) {
                    console.error('Firebase error, trying localStorage fallback:', firebaseError);
                    // Fallback to localStorage
                    const alertData = {
                        machineId: machine.id,
                        machineName: machine.name,
                        machineType: machine.machineType,
                        location: machine.location,
                        type: 'nhiệt độ',
                        status: temperature > 80 ? 'critical' : 'warning',
                        value: `${temperature}°C`,
                        threshold: '80°C',
                        acknowledged: false,
                        area: machine.location,
                        description: temperature > 80 
                            ? `Nhiệt độ máy ${machine.name} vượt quá ngưỡng an toàn (${temperature}°C > 80°C)`
                            : `Nhiệt độ máy ${machine.name} cao hơn bình thường (${temperature}°C)`
                    };
                    await alertService.saveAlertToLocalStorage(alertData);
                    console.log(`✅ Created temperature alert in localStorage for machine ${machine.name}: ${temperature}°C`);
                }
            } else {
                console.log(`⏭️ Skipping duplicate alert for machine ${machine.name}`);
            }
        } catch (error) {
            console.error('❌ Error creating temperature alert:', error);
        }
    };

    // Load dữ liệu máy từ Firebase
    const loadMachines = async () => {
        setLoading(true);
        try {
            const querySnapshot = await machinesDataService.getAllMachines();
            const machines = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                
                const processedMachine = processMachineData({
                    ...data,
                    id: doc.id
                });
                
                machines.push(processedMachine);
            });
            
            setMachineData(machines);
        } catch (error) {
            console.error('Error loading machines from Firebase:', error);
            
            // Fallback: Load từ localStorage
            try {
                const localMachines = JSON.parse(localStorage.getItem('machines') || '[]');
                
                const processedLocalMachines = localMachines.map((machine, index) => 
                    processMachineData({
                        ...machine,
                        id: machine.id || `local_${index}`,
                        isLocal: true
                    })
                );
                
                setMachineData(processedLocalMachines);
            } catch (localError) {
                console.error('Error loading from localStorage:', localError);
                setMachineData([]);
            }
        } finally {
            setLoading(false);
        }
    };

    // Load dữ liệu khi component mount
    useEffect(() => {
        loadMachines();
        loadTemperatureStats();
    }, []);

    // Load temperatures periodically only when simulation is running
    useEffect(() => {
        let interval;
        
        if (isTemperatureSimulationRunning) {
            console.log('Starting temperature simulation interval...');
            interval = setInterval(() => {
                console.log('Temperature simulation tick...');
                loadMachineTemperatures();
                loadTemperatureStats();
            }, 5000); // Update every 5 seconds
        }

        return () => {
            if (interval) {
                console.log('Clearing temperature simulation interval...');
                clearInterval(interval);
            }
        };
    }, [isTemperatureSimulationRunning, machineData]);

    // Hàm xử lý dữ liệu máy để đảm bảo format đúng
    const processMachineData = (machineData) => {
        const normalizedVibration = typeof machineData.vibration === 'number'
            ? parseFloat(machineData.vibration.toFixed(1))
            : typeof machineData.vibration === 'string' && !isNaN(parseFloat(machineData.vibration))
                ? parseFloat(parseFloat(machineData.vibration).toFixed(1))
                : parseFloat((Math.random() * 4 + 2).toFixed(1));

        const vibrationStatus = machineData.vibrationStatus || getVibrationStatus(normalizedVibration);
        const vibrationLastUpdated = machineData.vibrationLastUpdated
            ? new Date(machineData.vibrationLastUpdated)
            : new Date();

        return {
            key: machineData.id || `machine_${Date.now()}`,
            id: machineData.machineCode || machineData.id || `machine_${Date.now()}`,
            name: machineData.machineName || 'Chưa có tên',
            status: machineData.status || 'inactive',
            location: machineData.location || 'Chưa xác định',
            lastCheck: machineData.lastCheck || 'Chưa kiểm tra',
            efficiency: Math.max(
                70,
                typeof machineData.efficiency === 'number' ? machineData.efficiency : 85
            ),
            temperature: machineData.temperature || Math.floor(Math.random() * 46) + 50, // Random temp 50-95°C
            temperatureStatus: machineData.temperatureStatus || 'normal',
            temperatureLastUpdated: machineData.temperatureLastUpdated || new Date(),
            isSimulated: machineData.isSimulated || false,
            vibration: normalizedVibration,
            vibrationStatus,
            vibrationLastUpdated,
            machineType: machineData.machineType || 'other',
            createdAt: machineData.createdAt,
            updatedAt: machineData.updatedAt,
            isLocal: machineData.isLocal || false
        };
    };

    // Xử lý khi thêm máy thành công
    const handleAddSuccess = (newMachine) => {
        console.log('New machine added:', newMachine);
        
        // Xử lý dữ liệu máy mới để đảm bảo format đúng
        const processedMachine = processMachineData(newMachine);
        
        console.log('Processed new machine:', processedMachine);
        
        // Thêm máy mới vào danh sách ngay lập tức
        setMachineData(prev => {
            // Kiểm tra xem máy đã tồn tại chưa (tránh trùng lặp)
            const exists = prev.some(machine => machine.id === processedMachine.id);
            if (exists) {
                console.log('Machine already exists, updating instead of adding');
                return prev.map(machine => 
                    machine.id === processedMachine.id ? processedMachine : machine
                );
            }
            return [...prev, processedMachine];
        });
        
        setIsModalVisible(false);
        
        // Hiển thị thông báo thành công
        message.success(`Máy "${processedMachine.name}" đã được thêm thành công!`);
        
        // Reload dữ liệu từ Firebase để đảm bảo đồng bộ (chỉ nếu không phải local)
        if (!newMachine.isLocal) {
            setTimeout(() => {
                loadMachines();
            }, 500);
        }
    };

    // Get temperature status display
    const getTemperatureStatusDisplay = (temperature, status) => {
        const isHighTemp = temperature > 80;
        const isWarning = temperature >= 75 && temperature <= 85;
        const isCritical = temperature > 85;
        
        let statusColor = '#52c41a'; // green
        let statusText = 'Bình thường';
        let statusIcon = <DashboardOutlined />;
        
        if (isCritical) {
            statusColor = '#ff4d4f';
            statusText = 'Nguy hiểm';
            statusIcon = <FireOutlined />;
        } else if (isWarning) {
            statusColor = '#faad14';
            statusText = 'Cảnh báo';
            statusIcon = <WarningOutlined />;
        }
        
        return (
            <Space>
                {statusIcon}
                <Text style={{ color: statusColor, fontWeight: 'bold' }}>
                    {statusText}
                </Text>
            </Space>
        );
    };

    // Format temperature last updated time
    const formatTemperatureTime = (time) => {
        if (!time) return 'Chưa cập nhật';
        
        try {
            let date;
            if (time instanceof Date) {
                date = time;
            } else if (time && typeof time.toDate === 'function') {
                // Firebase Timestamp
                date = time.toDate();
            } else if (typeof time === 'string') {
                date = new Date(time);
            } else {
                return 'Chưa cập nhật';
            }
            
            return date.toLocaleTimeString('vi-VN');
        } catch (error) {
            return 'Chưa cập nhật';
        }
    };

    const getVibrationStatusDisplay = (vibration = 0, status = 'normal') => {
        let statusColor = '#52c41a';
        let statusText = 'Ổn định';
        let statusIcon = <DashboardOutlined />;

        if (status === 'critical' || vibration >= 7) {
            statusColor = '#ff4d4f';
            statusText = 'Rung nguy hiểm';
            statusIcon = <WarningOutlined />;
        } else if (status === 'warning' || vibration >= 4) {
            statusColor = '#faad14';
            statusText = 'Rung cao';
            statusIcon = <FireOutlined />;
        }

        return (
            <Space>
                {statusIcon}
                <Text style={{ color: statusColor, fontWeight: 'bold' }}>
                    {statusText}
                </Text>
            </Space>
        );
    };

    const formatVibrationTime = (time) => {
        if (!time) return 'Chưa cập nhật';

        try {
            let date;
            if (time instanceof Date) {
                date = time;
            } else if (time && typeof time.toDate === 'function') {
                date = time.toDate();
            } else if (typeof time === 'string') {
                date = new Date(time);
            } else {
                return 'Chưa cập nhật';
            }

            return date.toLocaleTimeString('vi-VN');
        } catch (error) {
            return 'Chưa cập nhật';
        }
    };

    const stats = [
        { title: "Tổng số máy", value: machineData.length, suffix: "", color: "#1890ff" },
        { title: "Máy đang hoạt động", value: machineData.filter(m => m.status === 'active').length, suffix: "",  color: "#52c41a" },
        // { title: "Đang bảo trì", value: machineData.filter(m => m.status === 'maintenance').length, suffix: "", subtext: "2 máy quá hạn", color: "#faad14" },
        { title: "Cảnh báo nhiệt độ cao", value: machineData.filter(m => m.temperature > 80).length, suffix: "",  color: "#ff4d4f" },
        { title: "Máy rung cao", value: machineData.filter(m => m.vibrationStatus === 'critical').length, suffix: "",  color: "#d4380d" },
    ];

    const highTempMachines = machineData.filter(machine => machine.temperature > 80);
    const highVibrationMachines = machineData.filter(machine => machine.vibrationStatus === 'critical');

    const columns = [
        {
            title: 'Mã máy',
            dataIndex: 'id',
            key: 'id',
            width: 100,
        },
        {
            title: 'Tên máy',
            dataIndex: 'name',
            key: 'name',
            width: 200,
            render: (text, record) => (
                <Space direction="vertical" size={0}>
                    <Text>{text}</Text>
                    {!screens.md && (
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            Hiệu suất: {record.efficiency}%
                        </Text>
                    )}
                </Space>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status) => {
                const statusConfig = {
                    active: { color: 'green', text: 'Đang hoạt động' },
                    maintenance: { color: 'orange', text: 'Bảo trì' },
                    inactive: { color: 'red', text: 'Không hoạt động' },
                };
                const config = statusConfig[status] || { color: 'default', text: status };
                return <Tag color={config.color}>{config.text}</Tag>;
            },
        },
        {
            title: 'Vị trí',
            dataIndex: 'location',
            key: 'location',
            width: 150,
        },
        {
            title: 'Hiệu suất',
            dataIndex: 'efficiency',
            key: 'efficiency',
            width: 100,
            responsive: ['md'],
            render: (efficiency) => (
                <Space direction="vertical" size={2} style={{ width: '100%' }}>
                    <Text>{`${efficiency}%`}</Text>
                    <Progress percent={efficiency} size="small" showInfo={false} />
                </Space>
            ),
        },
        {
            title: 'Nhiệt độ',
            dataIndex: 'temperature',
            key: 'temperature',
            width: 150,
            render: (temp, record) => {
                const isHighTemp = temp > 80;
                return (
                    <Space direction="vertical" size="small">
                    <Space>
                        <FireOutlined style={{ color: isHighTemp ? '#ff4d4f' : '#52c41a' }} />
                        <Text style={{ color: isHighTemp ? '#ff4d4f' : 'inherit', fontWeight: isHighTemp ? 'bold' : 'normal' }}>
                            {temp}°C
                        </Text>
                        {isHighTemp && <Badge status="error" />}
                        </Space>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                            {formatTemperatureTime(record.temperatureLastUpdated)}
                        </Text>
                    </Space>
                );
            },
        },
        // {
        //     title: 'Trạng thái nhiệt độ',
        //     dataIndex: 'temperatureStatus',
        //     key: 'temperatureStatus',
        //     width: 150,
        //     render: (status, record) => getTemperatureStatusDisplay(record.temperature, status),
        // },
        {
            title: 'Độ rung',
            dataIndex: 'vibration',
            key: 'vibration',
            width: 160,
            render: (value, record) => {
                const critical = value >= 7;
                const warning = value >= 4 && value < 7;
                const color = critical ? '#ff4d4f' : warning ? '#faad14' : '#52c41a';
                return (
                    <Space direction="vertical" size="small">
                        <Space>
                            <ThunderboltOutlined style={{ color }} />
                            <Text style={{ color, fontWeight: warning || critical ? 'bold' : 'normal' }}>
                                {value ? `${value} mm/s` : 'Chưa có'}
                            </Text>
                        </Space>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                            {formatVibrationTime(record.vibrationLastUpdated)}
                        </Text>
                    </Space>
                );
            },
        },
        // {
        //     title: 'Trạng thái rung',
        //     dataIndex: 'vibrationStatus',
        //     key: 'vibrationStatus',
        //     width: 170,
        //     render: (_, record) => getVibrationStatusDisplay(record.vibration, record.vibrationStatus),
        // },
        {
            title: 'Kiểm tra lần cuối',
            dataIndex: 'lastCheck',
            key: 'lastCheck',
            width: 150,
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 150,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Xem kế hoạch bảo trì">
                        <Button 
                            type="text" 
                            icon={<EyeOutlined />} 
                            size="small"
                            onClick={() => showMaintenancePlans(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                        <Button 
                            type="text" 
                            icon={<EditOutlined />} 
                            size="small"
                            onClick={() => showEditModal(record)}
                        />
                    </Tooltip>
                    {/* <Tooltip title="Cài đặt">
                        <Button type="text" icon={<SettingOutlined />} size="small" />
                    </Tooltip> */}
                    <Tooltip title="Xóa">
                        <Popconfirm
                            title="Bạn có chắc chắn muốn xóa máy này?"
                            description={`Máy "${record.name}" (${record.id}) sẽ bị xóa vĩnh viễn.`}
                            onConfirm={() => handleDeleteMachine(record)}
                            okText="Có"
                            cancelText="Không"
                        >
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                            />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const getFilteredData = () => {
        let filtered = machineData;
        
        // Lọc theo trạng thái
        if (activeTab !== 'all') {
            filtered = filtered.filter(machine => machine.status === activeTab);
        }
        
        // Lọc theo từ khóa tìm kiếm
        if (searchText) {
            filtered = filtered.filter(machine => 
                machine.name.toLowerCase().includes(searchText.toLowerCase()) ||
                machine.id.toLowerCase().includes(searchText.toLowerCase()) ||
                machine.location.toLowerCase().includes(searchText.toLowerCase())
            );
        }
        
        // Lọc theo status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(machine => machine.status === statusFilter);
        }
        
        return filtered;
    };

    const filteredData = getFilteredData();

    return (
        <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
            <div style={{ marginBottom: '24px' }}>
                <Title level={2} style={{ margin: 0 }}>Bảng điều khiển máy móc</Title>
                <Text type="secondary">Thông tin chi tiết về tất cả các máy</Text>
            </div>

            {/* Temperature Simulation Controls */}
            <Card style={{ marginBottom: '24px' }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={12} md={8}>
                        <Space>
                            <Button 
                                type="primary" 
                                icon={<ThunderboltOutlined />}
                                onClick={initializeTemperatureSimulation}
                            >
                                Khởi tạo nhiệt độ
                            </Button>
                            <Button 
                                icon={<ReloadOutlined />}
                                onClick={loadMachineTemperatures}
                            >
                                Cập nhật nhiệt độ
                            </Button>
                        </Space>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Button 
                            type={isTemperatureSimulationRunning ? "danger" : "default"}
                            icon={isTemperatureSimulationRunning ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                            onClick={toggleTemperatureSimulation}
                        >
                            {isTemperatureSimulationRunning ? 'Dừng giả lập' : 'Bắt đầu giả lập'}
                        </Button>
                    </Col>
                    <Col xs={24} sm={24} md={8}>
                        <Text type="secondary">
                            Trạng thái: {isTemperatureSimulationRunning ? 'Đang chạy' : 'Đã dừng'}
                        </Text>
                    </Col>
                </Row>
            </Card>

            {/* Temperature Statistics */}
            {/* <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Tổng máy"
                            value={temperatureStats.totalMachines}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Nhiệt độ bình thường"
                            value={temperatureStats.normalTemp}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Cảnh báo"
                            value={temperatureStats.warningTemp}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Nguy hiểm"
                            value={temperatureStats.criticalTemp}
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Firestore Rules Alert */}
            {/* <Alert
                message="Hướng dẫn Firestore Rules"
                description={
                    <div>
                        <Text>Để sử dụng tính năng giả lập nhiệt độ, hãy cập nhật Firestore Rules:</Text>
                        <pre style={{ marginTop: '8px', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}> */} 
{/* {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`} */}
                        {/* </pre>
                    </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: '24px' }}
                closable
            /> */}

            {/* Temperature Guide */}
            {/* <Alert
                message="Hướng dẫn nhiệt độ"
                description={
                    <div>
                        <Text>• <Text strong>Bình thường:</Text> 50-74°C</Text><br/>
                        <Text>• <Text strong>Cảnh báo:</Text> 75-85°C (màu vàng)</Text><br/>
                        <Text>• <Text strong>Nguy hiểm:</Text> &gt;85°C (màu đỏ)</Text>
                    </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: '24px' }}
                closable
            /> */}

            {highTempMachines.length > 0 && (
                <Alert
                    message={
                        <Space>
                            <WarningOutlined style={{ color: '#ff4d4f' }} />
                            <Text strong>Cảnh báo nhiệt độ cao</Text>
                        </Space>
                    }
                    description={
                        <div>
                            <Text>
                                Có {highTempMachines.length} máy vượt quá 80°C:
                            </Text>
                            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                                {highTempMachines.map(machine => (
                                    <li key={machine.id}>
                                        <Text strong>{machine.name}</Text> ({machine.id}) - {machine.temperature}°C
                                    </li>
                                ))}
                            </ul>
                        </div>
                    }
                    type="error"
                    showIcon
                    style={{ marginBottom: '24px' }}
                    // action={
                    //     <Button size="small" danger>
                    //         Đã hiểu
                    //     </Button>
                    // }
                />
            )}

            {highVibrationMachines.length > 0 && (
                <Alert
                    message={
                        <Space>
                            <ThunderboltOutlined style={{ color: '#fa8c16' }} />
                            <Text strong>Cảnh báo độ rung cao</Text>
                        </Space>
                    }
                    description={
                        <div>
                            <Text>
                                Có {highVibrationMachines.length} máy có độ rung vượt ngưỡng an toàn (&gt;= 7 mm/s):
                            </Text>
                            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                                {highVibrationMachines.map(machine => (
                                    <li key={`${machine.id}_vibration`}>
                                        <Text strong>{machine.name}</Text> ({machine.id}) - {machine.vibration} mm/s
                                    </li>
                                ))}
                            </ul>
                        </div>
                    }
                    type="warning"
                    showIcon
                    style={{ marginBottom: '24px' }}
                    // action={
                    //     <Button size="small" type="primary">
                    //         Lên lịch kiểm tra
                    //     </Button>
                    // }
                />
            )}

            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                    <Input
                        placeholder="Tìm kiếm máy..."
                        prefix={<SearchOutlined />}
                        style={{ width: 300 }}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                    <Select 
                        value={statusFilter} 
                        onChange={setStatusFilter}
                        style={{ width: 120 }}
                    >
                        <Option value="all">Tất cả</Option>
                        <Option value="active">Đang hoạt động</Option>
                        <Option value="maintenance">Bảo trì</Option>
                        <Option value="inactive">Không hoạt động</Option>
                    </Select>
                </Space>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={loadMachines} loading={loading}>
                        Làm mới
                    </Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
                        Thêm máy
                    </Button>
                </Space>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                {stats.map((stat, index) => (
                    <Col xs={24} sm={12} lg={6} key={index}>
                        <Card>
                            <Statistic
                                title={stat.title}
                                value={stat.value}
                                suffix={stat.suffix}
                                valueStyle={{ color: stat.color }}
                            />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                {stat.subtext}
                            </Text>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Card>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={[
                        {
                            key: 'all',
                            label: `Tất cả (${machineData.length})`,
                        },
                        {
                            key: 'active',
                            label: `Đang hoạt động (${machineData.filter(m => m.status === 'active').length})`,
                        },
                        {
                            key: 'maintenance',
                            label: `Bảo trì (${machineData.filter(m => m.status === 'maintenance').length})`,
                        },
                        {
                            key: 'inactive',
                            label: `Không hoạt động (${machineData.filter(m => m.status === 'inactive').length})`,
                        },
                    ]}
                />

                <Spin spinning={loading}>
                <Table
                    columns={columns}
                    dataSource={filteredData}
                    pagination={false}
                        scroll={{ x: 1200 }}
                    size="middle"
                    style={{ marginTop: '16px' }}
                />
                </Spin>

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary">
                        Hiển thị từ {((currentPage - 1) * pageSize) + 1} đến {Math.min(currentPage * pageSize, filteredData.length)} trên tổng {filteredData.length} máy
                    </Text>
                    <Pagination
                        current={currentPage}
                        total={filteredData.length}
                        pageSize={pageSize}
                        showSizeChanger
                        showQuickJumper
                        showTotal={(total, range) => `${range[0]}-${range[1]} trong ${total} mục`}
                        onChange={(page, size) => {
                            setCurrentPage(page);
                            setPageSize(size);
                        }}
                    />
                </div>
            </Card>

            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <SettingOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                        Thêm Máy Mới
                    </div>
                }
                open={isModalVisible}
                onCancel={handleCancel}
                width={1000}
                footer={null}
                destroyOnClose
            >
                <AddMachine
                    onSuccess={handleAddSuccess}
                    onCancel={handleCancel}
                />
            </Modal>

            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <EditOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
                        Chỉnh Sửa Máy
                    </div>
                }
                open={isEditModalVisible}
                onCancel={handleEditCancel}
                width={1000}
                footer={null}
                destroyOnClose
            >
                <EditMachine
                    machineId={selectedMachineId}
                    onSuccess={handleEditSuccess}
                    onCancel={handleEditCancel}
                />
            </Modal>

            {/* Modal hiển thị kế hoạch bảo trì */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <EyeOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                        Kế hoạch bảo trì - {selectedMachineType || 'Loại máy'}
                    </div>
                }
                open={isMaintenancePlansModalVisible}
                onCancel={handleCloseMaintenancePlansModal}
                width={800}
                footer={[
                    <Button key="close" onClick={handleCloseMaintenancePlansModal}>
                        Đóng
                    </Button>
                ]}
                destroyOnClose
            >
                <Spin spinning={loadingMaintenancePlans}>
                    {maintenancePlans.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <Text type="secondary">
                                {loadingMaintenancePlans 
                                    ? 'Đang tải...' 
                                    : 'Không có kế hoạch bảo trì nào cho loại máy này.'}
                            </Text>
                        </div>
                    ) : (
                        <Table
                            dataSource={maintenancePlans}
                            columns={[
                                {
                                    title: 'Tên kế hoạch',
                                    dataIndex: 'name',
                                    key: 'name',
                                    render: (text, record) => (
                                        <Space>
                                            <Tag color={record.color}>{text}</Tag>
                                        </Space>
                                    )
                                },
                                {
                                    title: 'Loại máy',
                                    dataIndex: 'typeName',
                                    key: 'typeName'
                                },
                                {
                                    title: 'Tần suất',
                                    dataIndex: 'frequency',
                                    key: 'frequency'
                                },
                                {
                                    title: 'Mô tả',
                                    dataIndex: 'description',
                                    key: 'description',
                                    ellipsis: true
                                }
                            ]}
                            pagination={false}
                            rowKey="key"
                            size="small"
                        />
                    )}
                </Spin>
            </Modal>
        </div>
    );
};

export default MachineDashboard;
