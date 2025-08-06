import React, { useState, useEffect } from 'react';
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
    Divider
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
    SettingsIcon
} from 'lucide-react';

const { Title, Text } = Typography;
const { Option } = Select;

function Analytics() {
    const [gaugeValue, setGaugeValue] = useState(78);
    const [selectedMachine, setSelectedMachine] = useState('Machine-001');
    const [temperatureData, setTemperatureData] = useState([
        { time: '0 min ago', motor: 72, controller: 48 },
        { time: '5 min ago', motor: 71, controller: 49 },
        { time: '10 min ago', motor: 73, controller: 50 },
        { time: '15 min ago', motor: 74, controller: 51 },
        { time: '20 min ago', motor: 75, controller: 52 },
        { time: '25 min ago', motor: 76, controller: 51 },
        { time: '30 min ago', motor: 77, controller: 50 },
        { time: '35 min ago', motor: 78, controller: 51 },
        { time: '40 min ago', motor: 77, controller: 52 },
        { time: '45 min ago', motor: 76, controller: 51 },
        { time: '50 min ago', motor: 75, controller: 50 },
        { time: '55 min ago', motor: 74, controller: 49 },
    ]);

    const [vibrationData] = useState([
        { axis: 'X-axis', current: 4.2, normal: 3 },
        { axis: 'Y-axis', current: 2.8, normal: 3 },
        { axis: 'Z-axis', current: 3.1, normal: 3 },
    ]);

    const [productionData] = useState([
        { time: '6AM', produced: 120, target: 150 },
        { time: '8AM', produced: 190, target: 250 },
        { time: '10AM', produced: 300, target: 400 },
        { time: '12PM', produced: 500, target: 550 },
        { time: '2PM', produced: 700, target: 750 },
        { time: '4PM', produced: 900, target: 950 },
        { time: '6PM', produced: 1100, target: 1200 },
    ]);

    const [statusData] = useState([
        { name: 'Running', value: 65, color: '#52c41a' },
        { name: 'Idle', value: 20, color: '#faad14' },
        { name: 'Maintenance', value: 10, color: '#1890ff' },
        { name: 'Error', value: 5, color: '#ff4d4f' },
    ]);

    // Simulate real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            setGaugeValue(prev => {
                const newValue = Math.max(0, Math.min(100, prev + (Math.random() * 10 - 5)));
                return Math.round(newValue);
            });

            setTemperatureData(prev => {
                const newData = [...prev];
                newData.shift();
                const lastMotor = newData[newData.length - 1].motor;
                const lastController = newData[newData.length - 1].controller;

                newData.push({
                    time: '0 min ago',
                    motor: Math.max(70, Math.min(80, lastMotor + (Math.random() * 4 - 2))),
                    controller: Math.max(45, Math.min(55, lastController + (Math.random() * 4 - 2)))
                });

                return newData;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (value) => {
        if (value >= 80) return '#52c41a';
        if (value >= 60) return '#faad14';
        return '#ff4d4f';
    };

    const getVibrationStatus = (value) => {
        if (value > 4) return 'error';
        if (value > 3) return 'warning';
        return 'success';
    };

    return (
        <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>
                📊 Machine Analytics Dashboard
            </Title>

            {/* Machine Selection */}
            <Card style={{ marginBottom: '24px' }}>
                <Space>
                    <Text strong>Select Machine:</Text>
                    <Select
                        value={selectedMachine}
                        onChange={setSelectedMachine}
                        style={{ width: 200 }}
                    >
                        <Option value="Machine-001">Machine-001</Option>
                        <Option value="Machine-002">Machine-002</Option>
                        <Option value="Machine-003">Machine-003</Option>
                    </Select>
                </Space>
            </Card>

            {/* Status Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Efficiency"
                            value={gaugeValue}
                            suffix="%"
                            valueStyle={{ color: getStatusColor(gaugeValue) }}
                            prefix={<TrendingUpIcon size={20} />}
                        />
                        <Progress
                            percent={gaugeValue}
                            strokeColor={getStatusColor(gaugeValue)}
                            showInfo={false}
                            style={{ marginTop: '8px' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Motor Temperature"
                            value={temperatureData[0]?.motor || 0}
                            suffix="°C"
                            valueStyle={{ color: temperatureData[0]?.motor > 75 ? '#ff4d4f' : '#52c41a' }}
                            prefix={<ThermometerIcon size={20} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Controller Temperature"
                            value={temperatureData[0]?.controller || 0}
                            suffix="°C"
                            valueStyle={{ color: temperatureData[0]?.controller > 50 ? '#faad14' : '#52c41a' }}
                            prefix={<SettingsIcon size={20} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Production Today"
                            value={1100}
                            suffix="units"
                            valueStyle={{ color: '#1890ff' }}
                            prefix={<ActivityIcon size={20} />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Charts Row 1 */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} lg={12}>
                    <Card title="Temperature Monitoring" extra={<ClockIcon size={16} />}>
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
                                    name="Motor Temperature"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="controller"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    name="Controller Temperature"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="Vibration Analysis" extra={<ActivityIcon size={16} />}>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={vibrationData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="axis" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar
                                    dataKey="current"
                                    fill="#1890ff"
                                    name="Current Vibration"
                                />
                                <Bar
                                    dataKey="normal"
                                    fill="#d9d9d9"
                                    name="Normal Range"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                        <Divider />
                        <Row gutter={[8, 8]}>
                            {vibrationData.map((item, index) => (
                                <Col span={8} key={index}>
                                    <Badge
                                        status={getVibrationStatus(item.current)}
                                        text={`${item.axis}: ${item.current} mm/s`}
                                    />
                                </Col>
                            ))}
                        </Row>
                    </Card>
                </Col>
            </Row>

            {/* Charts Row 2 */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} lg={12}>
                    <Card title="Production vs Target" extra={<TrendingUpIcon size={16} />}>
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
                                    name="Units Produced"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="target"
                                    stroke="#6366f1"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    name="Target"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="Machine Status Distribution" extra={<CheckCircleIcon size={16} />}>
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
                    </Card>
                </Col>
            </Row>

            {/* Alerts */}
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Alert
                        message="System Status"
                        description="All systems are operating normally. No critical alerts at this time."
                        type="success"
                        showIcon
                        icon={<CheckCircleIcon size={16} />}
                        style={{ marginBottom: '16px' }}
                    />
                    <Alert
                        message="Maintenance Reminder"
                        description="Scheduled maintenance for Machine-001 is due in 2 days."
                        type="warning"
                        showIcon
                        icon={<AlertTriangleIcon size={16} />}
                    />
                </Col>
            </Row>
        </div>
    );
}

export default Analytics;
