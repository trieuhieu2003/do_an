import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Badge, Input, Button, Card, Row, Col, Statistic, Progress, Table, Tag, List, Typography, Space, Spin, message } from 'antd';
import {
    BellOutlined,
    SettingOutlined,
    UserOutlined,
    BarChartOutlined,
    RobotOutlined,
    AlertOutlined,
    PlayCircleOutlined,
    AppstoreOutlined,
    TeamOutlined,
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    FactoryIcon,
    ArrowUpOutlined,
    ExclamationCircleOutlined,
    WarningOutlined,
    InfoCircleOutlined,
    FireOutlined,
    ThunderboltOutlined
} from '@ant-design/icons';
import 'antd/dist/reset.css';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase-config';
import machinesDataService from '../../service/machine.service';
import alertService from '../../service/alert.service';
import temperatureService from '../../service/temperature.service';
import vibrationService from '../../service/vibration.service';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

//NOTE Dashboard tổng quan trang chủ
const ManufacturingDashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [productionData, setProductionData] = useState([]);
    const [machineData, setMachineData] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [stats, setStats] = useState({
        totalMachines: 0,
        runningMachines: 0,
        idleMachines: 0,
        warningMachines: 0,
        criticalMachines: 0,
        totalAlerts: 0,
        criticalAlerts: 0,
        production: 0
    });

    //NOTE Format thời gian "bao lâu trước"
    const formatTimeAgo = (timestamp) => {
        if (!timestamp) return 'Không xác định';
        const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        return `${diffDays} ngày trước`;
    };

    //NOTE Format thời gian cập nhật nhiệt độ
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

    //NOTE Format thời gian cập nhật độ rung
    const formatVibrationTime = (time) => {
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

    //NOTE Load dữ liệu máy, kèm nhiệt độ/độ rung và trạng thái
    const loadMachines = async () => {
        try {
            const querySnapshot = await machinesDataService.getAllMachines();
            const machines = [];

            for (const doc of querySnapshot.docs) {
                const data = doc.data();
                const machineId = doc.id;

                // Lấy nhiệt độ hiện tại
                let temperature = null;
                let temperatureStatus = 'normal';
                let temperatureLastUpdated = null;
                try {
                    // Kiểm tra xem có dữ liệu nhiệt độ trong machineTemperature collection không
                    const machineTempDoc = doc(db, "machineTemperature", machineId);
                    const tempDocSnap = await getDoc(machineTempDoc);
                    
                    if (tempDocSnap.exists()) {
                        const tempData = tempDocSnap.data();
                        temperature = tempData.temperature;
                        temperatureLastUpdated = tempData.lastUpdated || tempData.updatedAt || null;
                    } else {
                        // Nếu không có trong machineTemperature, thử lấy từ machine document
                        temperature = data.temperature || null;
                        temperatureLastUpdated = data.temperatureLastUpdated || null;
                    }
                    
                    // Nếu vẫn không có, để null thay vì dùng giá trị mặc định
                    if (temperature !== null && temperature !== undefined) {
                        if (temperature >= 90) temperatureStatus = 'critical';
                        else if (temperature >= 80) temperatureStatus = 'warning';
                    }
                } catch (error) {
                    console.error(`Error loading temperature for machine ${machineId}:`, error);
                    // Thử lấy từ machine document nếu có
                    temperature = data.temperature || null;
                    temperatureLastUpdated = data.temperatureLastUpdated || null;
                }

                // Lấy độ rung hiện tại
                let vibration = 0;
                let vibrationStatus = 'normal';
                let vibrationLastUpdated = null;
                try {
                    const vibrationData = await vibrationService.getAllMachineVibrationsFallback();
                    const machineVibration = vibrationData.find(v => v.machineId === machineId);
                    if (machineVibration) {
                        vibration = machineVibration.vibration || machineVibration.value || 0;
                        vibrationStatus = machineVibration.status || 'normal';
                        vibrationLastUpdated = machineVibration.lastUpdated || null;
                    }
                } catch (error) {
                    console.error(`Error loading vibration for machine ${machineId}:`, error);
                }

                // Xác định trạng thái máy
                let status = 'idle';
                if (data.status === 'active') {
                    if (temperatureStatus === 'critical' || vibrationStatus === 'critical') {
                        status = 'critical';
                    } else if (temperatureStatus === 'warning' || vibrationStatus === 'warning') {
                        status = 'warning';
                    } else {
                        status = 'running';
                    }
                } else if (data.status === 'inactive') {
                    status = 'idle';
                } else if (data.status === 'maintenance') {
                    status = 'idle';
                }

                // Tính thời gian hoạt động (giả lập)
                const uptime = data.status === 'active'
                    ? `${Math.floor(Math.random() * 24)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
                    : '00:00:00';

                machines.push({
                    id: data.machineCode || machineId,
                    name: data.machineName || 'Chưa có tên',
                    status: status,
                    temperature: temperature !== null && temperature !== undefined ? Math.round(temperature) : null,
                    temperatureLastUpdated: temperatureLastUpdated,
                    vibration: vibration,
                    vibrationLastUpdated: vibrationLastUpdated,
                    uptime: uptime,
                    machineId: machineId,
                    location: data.location || 'Chưa xác định',
                    machineType: data.machineType || 'other'
                });
            }

            setMachineData(machines);
            return machines;
        } catch (error) {
            console.error('Error loading machines:', error);
            message.error('Không thể tải dữ liệu máy!');
            return [];
        }
    };

    //NOTE Đếm cảnh báo hôm nay (Firebase, fallback local)
    const countTodayAlerts = async () => {
        try {
            const querySnapshot = await alertService.getAllAlerts();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            let totalToday = 0;
            let criticalToday = 0;

            querySnapshot.docs.forEach((doc) => {
                const data = doc.data();
                const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now());
                
                // Kiểm tra xem cảnh báo có phải hôm nay không
                if (createdAt >= today) {
                    totalToday++;
                    if (data.status === 'critical') {
                        criticalToday++;
                    }
                }
            });

            return { totalToday, criticalToday };
        } catch (error) {
            console.error('Error counting today alerts:', error);
            // Fallback: đếm từ localStorage
            try {
                const localAlerts = await alertService.getAlertsFromLocalStorage();
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                let totalToday = 0;
                let criticalToday = 0;

                localAlerts.forEach(alert => {
                    const createdAt = alert.createdAt ? new Date(alert.createdAt) : new Date();
                    if (createdAt >= today) {
                        totalToday++;
                        if (alert.status === 'critical') {
                            criticalToday++;
                        }
                    }
                });

                return { totalToday, criticalToday };
            } catch (localError) {
                console.error('Error counting alerts from localStorage:', localError);
                return { totalToday: 0, criticalToday: 0 };
            }
        }
    };

    //NOTE Load danh sách cảnh báo gần đây (Firebase, fallback local)
    const loadAlerts = async () => {
        try {
            const querySnapshot = await alertService.getAllAlerts();
            const alertsData = [];

            querySnapshot.docs.slice(0, 10).forEach((doc) => {
                const data = doc.data();
                const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now());

                alertsData.push({
                    id: doc.id,
                    type: data.status === 'critical' ? 'critical' : data.status === 'warning' ? 'warning' : 'info',
                    title: data.status === 'critical' ? `Nguy hiểm: ${data.type || 'Cảnh báo'}` :
                        data.status === 'warning' ? `Cảnh báo: ${data.type || 'Cảnh báo'}` :
                            `Thông tin: ${data.type || 'Cảnh báo'}`,
                    description: `${data.machineName || 'Máy không xác định'} - ${data.description || ''}`,
                    time: formatTimeAgo(createdAt),
                    createdAt: createdAt
                });
            });

            setAlerts(alertsData);
            return alertsData;
        } catch (error) {
            console.error('Error loading alerts:', error);
            try {
                const localAlerts = await alertService.getAlertsFromLocalStorage();
                const alertsData = localAlerts.slice(0, 10).map(alert => ({
                    ...alert,
                    time: formatTimeAgo(alert.createdAt)
                }));
                setAlerts(alertsData);
                return alertsData;
            } catch (localError) {
                console.error('Error loading alerts from localStorage:', localError);
                return [];
            }
        }
    };

    //NOTE Sinh dữ liệu sản xuất giả lập từ trạng thái máy
    const loadProductionData = (machines) => {
        const hours = ['6:00', '8:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
        const runningCount = machines.filter(m => m.status === 'running').length;
        const baseProduction = runningCount * 20; // Mỗi máy đang chạy sản xuất 20 sản phẩm/giờ

        const production = hours.map((time, index) => {
            const target = (index + 1) * 120;
            const actual = Math.floor(target * (0.9 + Math.random() * 0.2)); // ±10% so với target
            return { time, target, actual };
        });

        setProductionData(production);
        return production;
    };

    //NOTE Tính toán thống kê tổng quan cho dashboard
    const calculateStats = async (machines, alertsData, productionDataArray = []) => {
        const runningMachines = machines.filter(m => m.status === 'running').length;
        const idleMachines = machines.filter(m => m.status === 'idle').length;
        const warningMachines = machines.filter(m => m.status === 'warning').length;
        const criticalMachines = machines.filter(m => m.status === 'critical').length;

        // Lấy số lượng cảnh báo hôm nay từ database
        const { totalToday, criticalToday } = await countTodayAlerts();

        // Tính sản lượng từ dữ liệu production hoặc ước tính từ số máy đang chạy
        const production = productionDataArray.length > 0 
            ? productionDataArray[productionDataArray.length - 1].actual 
            : runningMachines * 20 * 8; // Ước tính sản lượng (mỗi máy 20 sản phẩm/giờ, 8 giờ)

        setStats({
            totalMachines: machines.length,
            runningMachines,
            idleMachines,
            warningMachines,
            criticalMachines,
            totalAlerts: totalToday, // Số cảnh báo hôm nay từ database
            criticalAlerts: criticalToday, // Số cảnh báo nguy hiểm hôm nay từ database
            production
        });
    };

    //NOTE Quy trình load tổng hợp toàn bộ dữ liệu
    const loadAllData = async () => {
        setLoading(true);
        try {
            const machines = await loadMachines();
            const alertsData = await loadAlerts();
            const productionDataArray = loadProductionData(machines);
            calculateStats(machines, alertsData, productionDataArray);
        } catch (error) {
            console.error('Error loading all data:', error);
            message.error('Không thể tải dữ liệu!');
        } finally {
            setLoading(false);
        }
    };

    //NOTE Cập nhật nhiệt độ/độ rung mới nhất và thống kê theo chu kỳ
    const updateTemperaturesAndVibrations = async () => {
        try {
            // Lấy tất cả nhiệt độ và độ rung mới nhất
            const temperatures = await temperatureService.getAllMachineTemperaturesFallback();
            const vibrations = await vibrationService.getAllMachineVibrationsFallback();
            
            const tempMap = new Map(temperatures.map(t => [t.machineId, t]));
            const vibMap = new Map(vibrations.map(v => [v.machineId || v.id, v]));

            // Cập nhật machineData với nhiệt độ và độ rung mới
            setMachineData(prevMachines => prevMachines.map(machine => {
                const tempData = tempMap.get(machine.machineId);
                const vibData = vibMap.get(machine.machineId);

                let updatedMachine = { ...machine };

                // Cập nhật nhiệt độ
                if (tempData) {
                    updatedMachine.temperature = tempData.temperature !== null && tempData.temperature !== undefined 
                        ? Math.round(tempData.temperature) 
                        : null;
                    updatedMachine.temperatureLastUpdated = tempData.lastUpdated || tempData.updatedAt || null;
                    
                    // Cập nhật trạng thái dựa trên nhiệt độ
                    if (updatedMachine.temperature !== null) {
                        if (updatedMachine.temperature >= 90) {
                            updatedMachine.status = 'critical';
                        } else if (updatedMachine.temperature >= 80) {
                            updatedMachine.status = 'warning';
                        } else if (machine.status === 'active') {
                            updatedMachine.status = 'running';
                        }
                    }
                }

                // Cập nhật độ rung
                if (vibData) {
                    updatedMachine.vibration = vibData.vibration || vibData.value || 0;
                    updatedMachine.vibrationLastUpdated = vibData.lastUpdated || null;
                    
                    // Cập nhật trạng thái dựa trên độ rung
                    if (updatedMachine.vibration >= 7) {
                        updatedMachine.status = 'critical';
                    } else if (updatedMachine.vibration >= 4 && updatedMachine.status !== 'critical') {
                        updatedMachine.status = 'warning';
                    }
                }

                return updatedMachine;
            }));

            // Cập nhật lại stats
            setMachineData(currentMachines => {
                const runningMachines = currentMachines.filter(m => m.status === 'running').length;
                const idleMachines = currentMachines.filter(m => m.status === 'idle').length;
                const warningMachines = currentMachines.filter(m => m.status === 'warning').length;
                const criticalMachines = currentMachines.filter(m => m.status === 'critical').length;

                // Cập nhật số lượng cảnh báo hôm nay từ database
                countTodayAlerts().then(({ totalToday, criticalToday }) => {
                    setStats(prevStats => ({
                        ...prevStats,
                        runningMachines,
                        idleMachines,
                        warningMachines,
                        criticalMachines,
                        totalAlerts: totalToday,
                        criticalAlerts: criticalToday
                    }));
                });

                return currentMachines;
            });
        } catch (error) {
            console.error('Error updating temperatures and vibrations:', error);
        }
    };

    //NOTE Hook mount: load toàn bộ dữ liệu lần đầu
    useEffect(() => {
        loadAllData();
    }, []);

    //NOTE Hook interval 5s: cập nhật nhiệt độ/độ rung
    useEffect(() => {
        const interval = setInterval(() => {
            updateTemperaturesAndVibrations();
        }, 5000); // Cập nhật mỗi 5 giây

        return () => clearInterval(interval);
    }, []);

    //NOTE Hook interval 30s: load lại toàn bộ dữ liệu
    useEffect(() => {
        const interval = setInterval(() => {
            loadAllData();
        }, 30000); // Cập nhật mỗi 30 giây

        return () => clearInterval(interval);
    }, []);

    const utilizationRate = stats.totalMachines > 0
        ? Math.round((stats.runningMachines / stats.totalMachines) * 100)
        : 0;
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '50vh'
            }}>
                <Spin size="large" tip="Đang tải dữ liệu..." />
            </div>
        );
    }

    return (
        <>
            <Layout>
                <Row gutter={[24, 24]}>
                    <Col xs={24} sm={12} md={6}>
                        <Card>
                            <Statistic
                                title="Tổng số máy"
                                value={stats.totalMachines}
                                prefix={<RobotOutlined style={{ color: '#1890ff' }} />}
                                valueStyle={{ fontWeight: 'bold' }}
                            />
                            <Text type="secondary">Tổng số máy trong hệ thống</Text>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card>
                            <Statistic
                                title="Máy đang hoạt động"
                                value={stats.runningMachines}
                                prefix={<PlayCircleOutlined style={{ color: '#52c41a' }} />}
                                valueStyle={{ fontWeight: 'bold' }}
                                suffix={<Tag color="blue">{utilizationRate}%</Tag>}
                            />
                            <Text type="success"><ArrowUpOutlined /> Tỷ lệ sử dụng {utilizationRate}%</Text>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card>
                            <Statistic
                                title="Cảnh báo hôm nay"
                                value={stats.totalAlerts}
                                prefix={<AlertOutlined style={{ color: '#ff4d4f' }} />}
                                valueStyle={{ fontWeight: 'bold' }}
                                suffix={stats.criticalAlerts > 0 ? <Tag color="red">{stats.criticalAlerts} nguy hiểm</Tag> : null}
                            />
                            {stats.criticalAlerts > 0 ? (
                                <Text type="danger"><ExclamationCircleOutlined /> {stats.criticalAlerts} nguy hiểm</Text>
                            ) : (
                                <Text type="secondary">Không có cảnh báo nguy hiểm</Text>
                            )}
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card>
                            <Statistic
                                title="Sản lượng sản xuất"
                                value={stats.production}
                                prefix={<AppstoreOutlined style={{ color: '#722ed1' }} />}
                                valueStyle={{ fontWeight: 'bold' }}
                            />
                            <Text type="secondary">Sản lượng ước tính hôm nay</Text>
                        </Card>
                    </Col>
                </Row>
                <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                    <Col xs={24} lg={12}>
                        <Card title="Tình trạng máy móc" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ flex: 1 }}>
                                <Progress type="dashboard" percent={utilizationRate} format={percent => `${percent}%`} />
                                <List size="small" style={{ marginTop: 24 }}>
                                    <List.Item>
                                        <Tag color="green">Đang chạy</Tag>
                                        <Text>{stats.runningMachines}</Text>
                                    </List.Item>
                                    <List.Item>
                                        <Tag color="default">Chờ</Tag>
                                        <Text>{stats.idleMachines}</Text>
                                    </List.Item>
                                    <List.Item>
                                        <Tag color="warning">Cảnh báo</Tag>
                                        <Text>{stats.warningMachines}</Text>
                                    </List.Item>
                                    <List.Item>
                                        <Tag color="red">Nguy hiểm</Tag>
                                        <Text>{stats.criticalMachines}</Text>
                                    </List.Item>
                                </List>
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                        <Card 
                            title="Cảnh báo gần đây" 
                            extra={<Button type="link" onClick={() => window.location.href = '/alerts'}>Xem tất cả</Button>}
                            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                        >
                            <div style={{ flex: 1 }}>
                                {alerts.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '20px' }}>
                                        <Text type="secondary">Không có cảnh báo nào</Text>
                                    </div>
                                ) : (
                                    <List
                                        itemLayout="horizontal"
                                        dataSource={alerts}
                                        pagination={{ pageSize: 3 }}
                                        renderItem={alert => (
                                            <List.Item>
                                                <List.Item.Meta
                                                    avatar={
                                                        alert.type === 'critical' ? <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} /> :
                                                            alert.type === 'warning' ? <WarningOutlined style={{ color: '#faad14' }} /> :
                                                                <InfoCircleOutlined style={{ color: '#1890ff' }} />
                                                    }
                                                    title={<Text strong>{alert.title}</Text>}
                                                    description={<Text type="secondary">{alert.description}</Text>}
                                                />
                                                <Text type="secondary" style={{ minWidth: 70, textAlign: 'right' }}>{alert.time}</Text>
                                            </List.Item>
                                        )}
                                    />
                                )}
                            </div>
                        </Card>
                    </Col>
                </Row>

            </Layout>

        </>
    );
};

export default ManufacturingDashboard;