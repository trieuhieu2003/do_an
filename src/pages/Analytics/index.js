import React, { useState, useEffect, useRef } from 'react';
import {
    Card,
    Row,
    Col,
    Statistic,
    Progress,
    Alert,
    Select,
    Space,
    Typography,
    Badge,
    Divider,
    Spin,
    message
} from 'antd';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    ThermometerIcon,
    ActivityIcon,
    TrendingUpIcon,
    AlertTriangleIcon,
    CheckCircleIcon,
    ClockIcon,
    SettingsIcon,
    ZapIcon
} from 'lucide-react';
import machinesDataService from '../../service/machine.service';
import temperatureService from '../../service/temperature.service';
import vibrationService from '../../service/vibration.service';

const { Title, Text } = Typography;
const { Option } = Select;

function Analytics() {
    const [loading, setLoading] = useState(true);
    const [machines, setMachines] = useState([]);
    const [selectedMachine, setSelectedMachine] = useState(null);
    const [temperatureData, setTemperatureData] = useState([]);
    const [vibrationData, setVibrationData] = useState([]);
    const [vibrationHistoryData, setVibrationHistoryData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [productionData, setProductionData] = useState([]);
    const [currentStats, setCurrentStats] = useState({
        efficiency: 0,
        motorTemp: 0,
        controllerTemp: 0,
        production: 0
    });
    const [currentMotorTemperature, setCurrentMotorTemperature] = useState(0); // Nhiệt độ động cơ từ machineTemperature
    const [currentVibration, setCurrentVibration] = useState(0); // Độ rung hiện tại từ machineVibration
    const currentMachineCodeRef = useRef(null); // Lưu machineCode hiện tại để tránh load lại không cần thiết

    // Load dữ liệu máy
    const loadMachines = async () => {
        try {
            const querySnapshot = await machinesDataService.getAllMachines();
            const machinesList = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                machinesList.push({
                    id: doc.id,
                    key: doc.id,
                    name: data.machineName || 'Chưa có tên',
                    machineCode: data.machineCode || doc.id,
                    status: data.status || 'inactive',
                    machineType: data.machineType || 'other',
                    location: data.location || 'Chưa xác định',
                    efficiency: data.efficiency || 0,
                    temperature: data.temperature || 0
                });
            });
            setMachines(machinesList);
            console.log('📦 Loaded machines:', machinesList.map(m => ({ id: m.id, machineCode: m.machineCode, name: m.name })));
            if (machinesList.length > 0 && !selectedMachine) {
                console.log('🎯 Auto-selected machine:', machinesList[0].id, machinesList[0].name);
                setSelectedMachine(machinesList[0].id);
            }
        } catch (error) {
            console.error('Error loading machines:', error);
            message.error('Không thể tải dữ liệu máy!');
        }
    };

    // Load nhiệt độ động cơ hiện tại từ machineTemperature
    const loadCurrentMotorTemperature = async (machineId) => {
        if (!machineId) return;
        try {
            const motorTemp = await temperatureService.getCurrentTemperature(machineId);
            console.log('Current motor temperature from machineTemperature:', motorTemp);
            setCurrentMotorTemperature(motorTemp || 0);
        } catch (error) {
            console.error('Error loading current motor temperature:', error);
            setCurrentMotorTemperature(0);
        }
    };

    // Load độ rung hiện tại từ machineVibration
    const loadCurrentVibration = async (machineId) => {
        if (!machineId) return;
        try {
            const vibrations = await vibrationService.getAllMachineVibrationsFallback();
            const machineVibration = vibrations.find(v => v.machineId === machineId || v.id === machineId);
            const vibrationValue = machineVibration?.vibration || machineVibration?.value || 0;
            console.log('Current vibration from machineVibration:', vibrationValue);
            setCurrentVibration(vibrationValue);
        } catch (error) {
            console.error('Error loading current vibration:', error);
            setCurrentVibration(0);
        }
    };

    // Load dữ liệu nhiệt độ
    const loadTemperatureData = async (machineId) => {
        if (!machineId) return;
        try {
            // Load nhiệt độ động cơ hiện tại từ machineTemperature
            await loadCurrentMotorTemperature(machineId);
            
            console.log('Loading temperature history for machineId:', machineId);
            const history = await temperatureService.getTemperatureHistory(machineId, 12);
            console.log('Temperature history loaded:', history);
            console.log('History length:', history.length);
            
            const formattedData = history.slice(-12).map((item, index) => {
                // Xử lý timestamp: có thể là timestamp, createdAt, hoặc không có
                let time;
                if (item.timestamp) {
                    time = item.timestamp?.toDate ? item.timestamp.toDate() : new Date(item.timestamp);
                } else if (item.createdAt) {
                    time = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
                } else {
                    // Nếu không có timestamp, sử dụng thời gian hiện tại trừ đi index phút
                    time = new Date(Date.now() - index * 5 * 60000);
                }
                
                const minutesAgo = Math.floor((Date.now() - time.getTime()) / 60000);
                const motorTemperature = item.temperature || 0;
                
                // Lấy nhiệt độ bộ điều khiển từ database nếu có, nếu không thì giả lập
                // Database có thể lưu: controllerTemperature, controllerTemp, hoặc controller
                let controllerTemperature = item.controllerTemperature || item.controllerTemp || item.controller;
                
                // Nếu không có trong database, giả lập từ nhiệt độ động cơ
                // Công thức: Nhiệt độ bộ điều khiển thường thấp hơn động cơ 20-30°C
                if (controllerTemperature === undefined || controllerTemperature === null) {
                    controllerTemperature = Math.max(20, motorTemperature - 25); // Tối thiểu 20°C
                }
                
                return {
                    time: minutesAgo === 0 ? '0 phút trước' : `${minutesAgo} phút trước`,
                    motor: motorTemperature,
                    controller: controllerTemperature
                };
            });
            
            // Nếu không có dữ liệu lịch sử, tạo dữ liệu từ nhiệt độ hiện tại
            if (formattedData.length === 0) {
                try {
                    const motorTemp = await temperatureService.getCurrentTemperature(machineId) || 25;
                    
                    // Lấy nhiệt độ bộ điều khiển hiện tại từ database nếu có
                    let controllerTemp = await temperatureService.getCurrentControllerTemperature(machineId, motorTemp);
                    
                    // Nếu không có trong database, giả lập từ nhiệt độ động cơ
                    if (controllerTemp === null || controllerTemp === undefined) {
                        controllerTemp = Math.max(20, motorTemp - 25); // Tối thiểu 20°C
                    }
                    
                    formattedData.push({
                        time: '0 phút trước',
                        motor: motorTemp,
                        controller: controllerTemp
                    });
                } catch (tempError) {
                    console.warn('Could not get current temperature:', tempError);
                    // Tạo dữ liệu mẫu để hiển thị
                    formattedData.push({
                        time: '0 phút trước',
                        motor: 25,
                        controller: 20
                    });
                }
            }
            
            setTemperatureData(formattedData);
            
            // Cập nhật thống kê nhiệt độ
            if (formattedData.length > 0) {
                const latest = formattedData[formattedData.length - 1];
                setCurrentStats(prev => ({
                    ...prev,
                    motorTemp: latest.motor,
                    controllerTemp: latest.controller
                }));
            }
        } catch (error) {
            console.error('Error loading temperature data:', error);
        }
    };

    // Load dữ liệu rung động (lịch sử)
    const loadVibrationData = async (machineId) => {
        if (!machineId) return;
        try {
            // Lấy lịch sử rung động
            const history = await vibrationService.getVibrationHistory(machineId, 12);
            
            if (history && history.length > 0) {
                console.log('Vibration history loaded:', history);
                
                // Format lịch sử cho biểu đồ đường
                const formattedHistory = history.slice(-12).reverse().map((item, index) => {
                    // Xử lý timestamp
                    let time;
                    if (item.timestamp) {
                        time = item.timestamp?.toDate ? item.timestamp.toDate() : new Date(item.timestamp);
                    } else if (item.createdAt) {
                        time = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
                    } else {
                        // Nếu không có timestamp, sử dụng thời gian hiện tại trừ đi index phút
                        time = new Date(Date.now() - index * 5 * 60000);
                    }
                    
                    const minutesAgo = Math.floor((Date.now() - time.getTime()) / 60000);
                    const vibrationValue = item.vibration || item.value || 0;
                    
                    return {
                        time: minutesAgo === 0 ? '0 phút trước' : `${minutesAgo} phút trước`,
                        vibration: vibrationValue,
                        axisX: vibrationValue,
                        axisY: Math.max(0, vibrationValue - 0.5),
                        axisZ: Math.max(0, vibrationValue - 0.3),
                        normal: 3
                    };
                });
                
                setVibrationHistoryData(formattedHistory);
                
                // Lấy giá trị rung động mới nhất cho biểu đồ cột
                const latestVibration = history[0].vibration || history[0].value || 0;
                setVibrationData([
                    { axis: 'Trục X', current: latestVibration, normal: 3 },
                    { axis: 'Trục Y', current: Math.max(0, latestVibration - 0.5), normal: 3 },
                    { axis: 'Trục Z', current: Math.max(0, latestVibration - 0.3), normal: 3 },
                ]);
            } else {
                // Fallback: lấy từ dữ liệu hiện tại
                const vibration = await vibrationService.getAllMachineVibrationsFallback();
                const machineVibration = vibration.find(v => v.machineId === machineId || v.id === machineId);
                
                if (machineVibration) {
                    const value = machineVibration.vibration || machineVibration.value || 0;
                    setVibrationData([
                        { axis: 'Trục X', current: value, normal: 3 },
                        { axis: 'Trục Y', current: Math.max(0, value - 0.5), normal: 3 },
                        { axis: 'Trục Z', current: Math.max(0, value - 0.3), normal: 3 },
                    ]);
                    // Tạo dữ liệu lịch sử giả lập từ giá trị hiện tại
                    setVibrationHistoryData([{
                        time: '0 phút trước',
                        vibration: value,
                        axisX: value,
                        axisY: Math.max(0, value - 0.5),
                        axisZ: Math.max(0, value - 0.3),
                        normal: 3
                    }]);
                } else {
                    setVibrationData([
                        { axis: 'Trục X', current: 0, normal: 3 },
                        { axis: 'Trục Y', current: 0, normal: 3 },
                        { axis: 'Trục Z', current: 0, normal: 3 },
                    ]);
                    setVibrationHistoryData([]);
                }
            }
        } catch (error) {
            console.error('Error loading vibration data:', error);
            setVibrationData([
                { axis: 'Trục X', current: 0, normal: 3 },
                { axis: 'Trục Y', current: 0, normal: 3 },
                { axis: 'Trục Z', current: 0, normal: 3 },
            ]);
            setVibrationHistoryData([]);
        }
    };

    // Tính toán dữ liệu trạng thái máy
    const calculateStatusData = () => {
        const statusCount = {
            active: 0,
            inactive: 0,
            maintenance: 0,
            error: 0
        };

        machines.forEach(machine => {
            if (machine.status === 'active') {
                statusCount.active++;
            } else if (machine.status === 'inactive') {
                statusCount.inactive++;
            } else if (machine.status === 'maintenance') {
                statusCount.maintenance++;
            } else {
                statusCount.error++;
            }
        });

        const total = machines.length || 1;
        const statusDataArray = [
            { name: 'Đang chạy', value: Math.round((statusCount.active / total) * 100), color: '#52c41a' },
            { name: 'Tạm dừng', value: Math.round((statusCount.inactive / total) * 100), color: '#faad14' },
            { name: 'Bảo trì', value: Math.round((statusCount.maintenance / total) * 100), color: '#1890ff' },
            { name: 'Lỗi', value: Math.round((statusCount.error / total) * 100), color: '#ff4d4f' },
        ].filter(item => item.value > 0);

        setStatusData(statusDataArray);
    };

    // Load dữ liệu tổng hợp
    const loadAllData = async () => {
        setLoading(true);
        try {
            await loadMachines();
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Load dữ liệu khi chọn máy (chỉ khi selectedMachine thay đổi)
    useEffect(() => {
        if (!selectedMachine || machines.length === 0) return;
        
        // Tìm máy được chọn để lấy machineCode
        const selected = machines.find(m => m.id === selectedMachine);
        if (!selected) return;
        
        // Sử dụng machineCode để query vì temperatureHistory lưu với machineCode
        const machineCodeToQuery = selected.machineCode || selected.id;
        
        // Chỉ load nếu machineCode thay đổi
        if (currentMachineCodeRef.current === machineCodeToQuery) {
            return; // Đã load rồi, không cần load lại
        }
        
        console.log('🔍 Loading data for machine:', {
            id: selected.id,
            machineCode: selected.machineCode,
            usingForQuery: machineCodeToQuery
        });
        
        currentMachineCodeRef.current = machineCodeToQuery;
        loadTemperatureData(machineCodeToQuery);
        loadVibrationData(machineCodeToQuery);
        loadCurrentMotorTemperature(machineCodeToQuery);
        loadCurrentVibration(machineCodeToQuery);
        
        // Cập nhật hiệu suất từ máy được chọn
        setCurrentStats(prev => ({
            ...prev,
            efficiency: selected.efficiency || 0,
            production: Math.round((selected.efficiency || 0) * 14)
        }));
    }, [selectedMachine]); // Chỉ trigger khi selectedMachine thay đổi

    // Tính toán dữ liệu trạng thái khi máy thay đổi
    useEffect(() => {
        calculateStatusData();
    }, [machines]);

    // Load dữ liệu ban đầu
    useEffect(() => {
        loadAllData();
    }, []); // Chỉ chạy một lần khi component mount

    // Cập nhật dữ liệu tự động mỗi 5 giây (chỉ khi đã có máy được chọn)
    useEffect(() => {
        if (!selectedMachine || machines.length === 0) {
            return;
        }

        const selected = machines.find(m => m.id === selectedMachine);
        if (!selected) return;

        const machineCodeToQuery = selected.machineCode || selected.id;
        
        // Cập nhật mỗi 5 giây
        const interval = setInterval(() => {
            // Kiểm tra lại để đảm bảo vẫn đang chọn máy này
            const currentSelected = machines.find(m => m.id === selectedMachine);
            if (currentSelected) {
                const currentMachineCode = currentSelected.machineCode || currentSelected.id;
                if (currentMachineCode === machineCodeToQuery) {
                    loadTemperatureData(machineCodeToQuery);
                    loadVibrationData(machineCodeToQuery);
                    loadCurrentMotorTemperature(machineCodeToQuery);
                    loadCurrentVibration(machineCodeToQuery);
                }
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [selectedMachine]); // Chỉ trigger khi selectedMachine thay đổi

    const getStatusColor = (value) => {
        if (value >= 80) return '#52c41a';
        if (value >= 60) return '#faad14';
        return '#ff4d4f';
    };

    // Lấy màu sắc cho nhiệt độ động cơ (giống như trang Machine)
    const getMotorTemperatureColor = (temperature) => {
        if (!temperature) return '#52c41a'; // Mặc định xanh nếu không có dữ liệu
        if (temperature > 85) return '#ff4d4f'; // Nguy hiểm - đỏ
        if (temperature >= 75 && temperature <= 85) return '#faad14'; // Cảnh báo - vàng
        return '#52c41a'; // Bình thường - xanh
    };

    // Lấy màu sắc cho nhiệt độ bộ điều khiển
    const getControllerTemperatureColor = (temperature) => {
        if (!temperature) return '#52c41a'; // Mặc định xanh nếu không có dữ liệu
        if (temperature > 50) return '#faad14'; // Cảnh báo - vàng
        return '#52c41a'; // Bình thường - xanh
    };

    // Lấy màu sắc cho độ rung (giống như trang Machine)
    const getVibrationColor = (vibration) => {
        if (!vibration) return '#52c41a'; // Mặc định xanh nếu không có dữ liệu
        if (vibration >= 7) return '#ff4d4f'; // Nguy hiểm - đỏ
        if (vibration >= 4) return '#faad14'; // Cảnh báo - vàng
        return '#52c41a'; // Bình thường - xanh
    };

    const getVibrationStatus = (value) => {
        if (value > 4) return 'error';
        if (value > 3) return 'warning';
        return 'success';
    };

    const selectedMachineData = machines.find(m => m.id === selectedMachine);

    return (
        <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>
                📊 Bảng điều khiển phân tích máy móc
            </Title>

            <Spin spinning={loading}>
            <Card style={{ marginBottom: '24px' }}>
                <Space>
                    <Text strong>Chọn máy:</Text>
                    <Select
                        value={selectedMachine}
                        onChange={setSelectedMachine}
                            style={{ width: 300 }}
                            placeholder="Chọn máy để xem phân tích"
                        >
                            {machines.map(machine => (
                                <Option key={machine.id} value={machine.id}>
                                    {machine.name} ({machine.machineCode})
                                </Option>
                            ))}
                    </Select>
                        {selectedMachineData && (
                            <Text type="secondary">
                                Trạng thái: {selectedMachineData.status === 'active' ? 'Đang hoạt động' : 
                                            selectedMachineData.status === 'inactive' ? 'Không hoạt động' :
                                            selectedMachineData.status === 'maintenance' ? 'Bảo trì' : 'Lỗi'}
                            </Text>
                        )}
                </Space>
            </Card>

            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} lg={6}>
                        <Card style={{ height: '100%', minHeight: '50px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Statistic
                            title="Hiệu suất"
                                value={currentStats.efficiency}
                            suffix="%"
                                valueStyle={{ color: getStatusColor(currentStats.efficiency), fontSize: '32px' }}
                                prefix={<TrendingUpIcon size={24} />}
                        />
                        <Progress
                                percent={currentStats.efficiency}
                                strokeColor={getStatusColor(currentStats.efficiency)}
                            showInfo={false}
                                style={{ marginTop: '16px' }}
                                strokeWidth={8}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                        <Card style={{ height: '100%', minHeight: '50px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Statistic
                            title="Nhiệt độ động cơ"
                                value={currentMotorTemperature || 0}
                            suffix="°C"
                                valueStyle={{ color: getMotorTemperatureColor(currentMotorTemperature), fontSize: '32px', fontWeight: 'bold' }}
                                prefix={<ThermometerIcon size={24} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                        <Card style={{ height: '100%', minHeight: '50px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Statistic
                                title="Độ rung"
                                value={currentVibration || 0}
                                suffix="mm/s"
                                valueStyle={{ color: getVibrationColor(currentVibration), fontSize: '32px', fontWeight: 'bold' }}
                                prefix={<ZapIcon size={24} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                        <Card style={{ height: '100%', minHeight: '50px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Statistic
                            title="Sản lượng hôm nay"
                                value={currentStats.production || 0}
                            suffix="đơn vị"
                                valueStyle={{ color: '#1890ff', fontSize: '32px' }}
                                prefix={<ActivityIcon size={24} />}
                        />
                    </Card>
                </Col>
            </Row>
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        {machines.length > 0 ? (
                            <>
                                <Alert
                                    message="Trạng thái hệ thống"
                                    description={`Tổng số máy: ${machines.length}. Đang hoạt động: ${machines.filter(m => m.status === 'active').length}. ${machines.filter(m => m.status === 'active').length === machines.length ? 'Tất cả hệ thống đang hoạt động bình thường.' : 'Có một số máy không hoạt động.'}`}
                                    type={machines.filter(m => m.status === 'active').length === machines.length ? 'success' : 'warning'}
                                    showIcon
                                    icon={<CheckCircleIcon size={16} />}
                                    style={{ marginBottom: '16px' }}
                                />
                                {machines.filter(m => m.status === 'maintenance').length > 0 && (
                                    <Alert
                                        message="Nhắc nhở bảo trì"
                                        description={`Có ${machines.filter(m => m.status === 'maintenance').length} máy đang trong trạng thái bảo trì.`}
                                        type="warning"
                                        showIcon
                                        icon={<AlertTriangleIcon size={16} />}
                                    />
                                )}
                            </>
                        ) : (
                            <Alert
                                message="Chưa có dữ liệu"
                                description="Vui lòng thêm máy vào hệ thống để xem phân tích."
                                type="info"
                                showIcon
                            />
                        )}
                    </Col>
                </Row>
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} lg={12}>
                    <Card title="Giám sát nhiệt độ" extra={<ClockIcon size={16} />}>
                            {temperatureData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={temperatureData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="motor"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    name="Động cơ"
                                />
                                        {/* <Line
                                    type="monotone"
                                    dataKey="controller"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    name="Bộ điều khiển"
                                        /> */}
                            </LineChart>
                        </ResponsiveContainer>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '50px' }}>
                                    <Text type="secondary">
                                        {selectedMachine ? 'Chưa có dữ liệu nhiệt độ' : 'Vui lòng chọn máy để xem dữ liệu nhiệt độ'}
                                    </Text>
                                </div>
                            )}
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                        <Card 
                            title="Phân tích rung" 
                            extra={<ActivityIcon size={16} />}
                        >
                            <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>
                                <Text type="secondary">
                                    <strong>Trục X:</strong> Rung động ngang (Horizontal) | 
                                    <strong> Trục Y:</strong> Rung động dọc (Vertical) | 
                                    <strong> Trục Z:</strong> Rung động trục (Axial)
                                </Text>
                            </div>
                            {vibrationHistoryData.length > 0 ? (
                                <>
                        <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={vibrationHistoryData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="time" />
                                            <YAxis label={{ value: 'Rung động (mm/s)', angle: -90, position: 'insideLeft' }} />
                                <Tooltip />
                                <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="axisX"
                                                stroke="#1890ff"
                                                strokeWidth={2}
                                                name="Trục X (Ngang)"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="axisY"
                                                stroke="#52c41a"
                                                strokeWidth={2}
                                                name="Trục Y (Dọc)"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="axisZ"
                                                stroke="#faad14"
                                                strokeWidth={2}
                                                name="Trục Z (Trục)"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="normal"
                                                stroke="#d9d9d9"
                                                strokeWidth={2}
                                                strokeDasharray="5 5"
                                                name="Ngưỡng bình thường (3 mm/s)"
                                            />
                                        </LineChart>
                        </ResponsiveContainer>
                        <Divider />
                                    {vibrationData.length > 0 && (
                        <Row gutter={[8, 8]}>
                                            {vibrationData.map((item, index) => {
                                                const axisInfo = {
                                                    'Trục X': { desc: 'Ngang', color: '#1890ff' },
                                                    'Trục Y': { desc: 'Dọc', color: '#52c41a' },
                                                    'Trục Z': { desc: 'Trục', color: '#faad14' }
                                                };
                                                const info = axisInfo[item.axis] || { desc: '', color: '#666' };
                                                return (
                                <Col span={8} key={index}>
                                                        <div style={{ textAlign: 'center' }}>
                                    <Badge
                                        status={getVibrationStatus(item.current)}
                                                                text={
                                                                    <span>
                                                                        <strong style={{ color: info.color }}>{item.axis}</strong>
                                                                        <br />
                                                                        <Text type="secondary" style={{ fontSize: '11px' }}>{info.desc}</Text>
                                                                        <br />
                                                                        <Text strong>{item.current.toFixed(1)} mm/s</Text>
                                                                    </span>
                                                                }
                                                            />
                                                        </div>
                                </Col>
                                                );
                                            })}
                        </Row>
                                    )}
                                </>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '50px' }}>
                                    <Text type="secondary">
                                        {selectedMachine ? 'Chưa có dữ liệu rung động' : 'Vui lòng chọn máy để xem dữ liệu rung động'}
                                    </Text>
                                </div>
                            )}
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                    {/* <Col xs={24} lg={12}>
                    <Card title="Sản lượng vs Mục tiêu" extra={<TrendingUpIcon size={16} />}>
                            {productionData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={productionData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="produced"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    name="Đã sản xuất"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="target"
                                    stroke="#6366f1"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    name="Mục tiêu"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '50px' }}>
                                    <Text type="secondary">Chưa có dữ liệu sản lượng</Text>
                                </div>
                            )}
                    </Card>
                    </Col> */}
                    {/* <Col xs={24} lg={12}>
                    <Card title="Tình trạng máy móc" extra={<CheckCircleIcon size={16} />}>
                            {statusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '50px' }}>
                                    <Text type="secondary">Chưa có dữ liệu máy móc</Text>
                                </div>
                            )}
                    </Card>
                    </Col> */}
            </Row>

                
            </Spin>
        </div>
    );
}

export default Analytics;
