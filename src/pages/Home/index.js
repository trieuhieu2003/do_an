import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Badge, Input, Button, Card, Row, Col, Statistic, Progress, Table, Tag, List, Typography, Space } from 'antd';
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
  InfoCircleOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import 'antd/dist/reset.css';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const ManufacturingDashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [productionData, setProductionData] = useState([
        { time: '6:00', target: 120, actual: 110 },
        { time: '8:00', target: 240, actual: 230 },
        { time: '10:00', target: 360, actual: 380 },
        { time: '12:00', target: 480, actual: 490 },
        { time: '14:00', target: 600, actual: 630 },
        { time: '16:00', target: 720, actual: 750 },
        { time: '18:00', target: 840, actual: 880 },
    ]);

    const [machineData, setMachineData] = useState([
        {
            id: '#12',
            name: 'Injection Molding',
            status: 'critical',
            temperature: 98,
            vibration: '4.2 m/s²',
            uptime: '12:45:22'
        },
        {
            id: '#8',
            name: 'CNC Router',
            status: 'warning',
            temperature: 72,
            vibration: '3.8 m/s²',
            uptime: '08:22:15'
        },
        {
            id: '#15',
            name: 'Lathe',
            status: 'running',
            temperature: 65,
            vibration: '2.1 m/s²',
            uptime: '23:10:45'
        },
        {
            id: '#22',
            name: 'Packaging Line',
            status: 'running',
            temperature: 58,
            vibration: '1.5 m/s²',
            uptime: '15:32:10'
        },
        {
            id: '#5',
            name: 'Assembly Robot',
            status: 'idle',
            temperature: 42,
            vibration: '0.2 m/s²',
            uptime: '00:00:00'
        }
    ]);

    const alerts = [
        {
            id: 1,
            type: 'critical',
            title: 'Critical: Overheating',
            description: 'Machine #12 - Injection Molding',
            time: '10 min ago'
        },
        {
            id: 2,
            type: 'warning',
            title: 'Warning: Vibration High',
            description: 'Machine #8 - CNC Router',
            time: '25 min ago'
        },
        {
            id: 3,
            type: 'info',
            title: 'Maintenance Due',
            description: 'Machine #22 - Packaging Line',
            time: '1 hr ago'
        },
        {
            id: 4,
            type: 'warning',
            title: 'Warning: Low Lubricant',
            description: 'Machine #15 - Lathe',
            time: '2 hrs ago'
        }
    ];

    // Simulate real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            // Update production data
            setProductionData(prevData =>
                prevData.map(item => ({
                    ...item,
                    actual: Math.max(0, item.actual + Math.floor(Math.random() * 20) - 10)
                }))
            );

            // Update machine data
            setMachineData(prevData =>
                prevData.map(machine => {
                    const tempChange = Math.floor(Math.random() * 3) - 1;
                    const newTemp = Math.max(30, Math.min(100, machine.temperature + tempChange));

                    let status = 'running';
                    const random = Math.random();
                    if (random < 0.1) status = 'critical';
                    else if (random < 0.2) status = 'warning';
                    else if (random < 0.3) status = 'idle';

                    return {
                        ...machine,
                        temperature: newTemp,
                        status: status
                    };
                })
            );
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const runningMachines = machineData.filter(m => m.status === 'running').length;
    const idleMachines = machineData.filter(m => m.status === 'idle').length;
    const warningMachines = machineData.filter(m => m.status === 'warning').length;
    const criticalMachines = machineData.filter(m => m.status === 'critical').length;
    const utilizationRate = Math.round((runningMachines / machineData.length) * 100);

    return (
        <>
            <Row gutter={[24, 24]}>
                        <Col xs={24} sm={12} md={6}>
                            <Card>
                                <Statistic
                                    title="Total Machines"
                                    value={42}
                                    prefix={<RobotOutlined style={{ color: '#1890ff' }} />}
                                    valueStyle={{ fontWeight: 'bold' }}
                                    suffix={<Tag color="green">+12%</Tag>}
                                />
                                <Text type="success"><ArrowUpOutlined /> 12% from last week</Text>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card>
                                <Statistic
                                    title="Active Machines"
                                    value={runningMachines}
                                    prefix={<PlayCircleOutlined style={{ color: '#52c41a' }} />}
                                    valueStyle={{ fontWeight: 'bold' }}
                                    suffix={<Tag color="blue">{utilizationRate}%</Tag>}
                                />
                                <Text type="success"><ArrowUpOutlined /> {utilizationRate}% utilization</Text>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card>
                                <Statistic
                                    title="Alerts Today"
                                    value={5}
                                    prefix={<AlertOutlined style={{ color: '#ff4d4f' }} />}
                                    valueStyle={{ fontWeight: 'bold' }}
                                    suffix={<Tag color="red">2 critical</Tag>}
                                />
                                <Text type="danger"><ExclamationCircleOutlined /> 2 critical</Text>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card>
                                <Statistic
                                    title="Production Output"
                                    value={1248}
                                    prefix={<AppstoreOutlined style={{ color: '#722ed1' }} />}
                                    valueStyle={{ fontWeight: 'bold' }}
                                    suffix={<Tag color="purple">+8%</Tag>}
                                />
                                <Text type="success"><ArrowUpOutlined /> 8% from target</Text>
                            </Card>
                        </Col>
                    </Row>
                    <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                        <Col xs={24} lg={16}>
                            <Card title="Production Overview" extra={
                                <Space>
                                    <Button size="small" type="primary">Day</Button>
                                    <Button size="small">Week</Button>
                                    <Button size="small">Month</Button>
                                </Space>
                            }>
                                <div style={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={productionData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="time" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="target" stroke="#9CA3AF" strokeDasharray="5 5" strokeWidth={2} />
                                            <Line type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={3} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </Col>
                        <Col xs={24} lg={8}>
                            <Card title="Machine Status Overview">
                                <Progress type="dashboard" percent={utilizationRate} format={percent => `${percent}%`} />
                                <List size="small" style={{ marginTop: 24 }}>
                                    <List.Item>
                                        <Tag color="green">Running</Tag>
                                        <Text>{runningMachines}</Text>
                                    </List.Item>
                                    <List.Item>
                                        <Tag color="default">Idle</Tag>
                                        <Text>{idleMachines}</Text>
                                    </List.Item>
                                    <List.Item>
                                        <Tag color="warning">Warning</Tag>
                                        <Text>{warningMachines}</Text>
                                    </List.Item>
                                    <List.Item>
                                        <Tag color="red">Critical</Tag>
                                        <Text>{criticalMachines}</Text>
                                    </List.Item>
                                </List>
                            </Card>
                        </Col>
                    </Row>
                    <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                        <Col xs={24} lg={8}>
                            <Card title="Recent Alerts" extra={<Button type="link">View All</Button>}>
                                <List
                                    itemLayout="horizontal"
                                    dataSource={alerts}
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
                            </Card>
                        </Col>
                        <Col xs={24} lg={16}>
                            <Card title="Machine Status" extra={
                                <Space>
                                    <Button size="small" type="primary">All</Button>
                                    <Button size="small">Running</Button>
                                    <Button size="small">Idle</Button>
                                    <Button size="small">Alerts</Button>
                                </Space>
                            }>
                                <Table
                                    dataSource={machineData}
                                    rowKey="id"
                                    pagination={false}
                                    columns={[
                                        { title: 'Machine ID', dataIndex: 'id', key: 'id' },
                                        { title: 'Name', dataIndex: 'name', key: 'name' },
                                        {
                                            title: 'Status',
                                            dataIndex: 'status',
                                            key: 'status',
                                            render: status => (
                                                <Tag color={
                                                    status === 'running' ? 'green' :
                                                    status === 'idle' ? 'default' :
                                                    status === 'warning' ? 'warning' :
                                                    status === 'critical' ? 'red' : 'default'
                                                }>
                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </Tag>
                                            )
                                        },
                                        {
                                            title: 'Temperature',
                                            dataIndex: 'temperature',
                                            key: 'temperature',
                                            render: temp => (
                                                <Text type={temp > 85 ? 'danger' : temp > 60 ? 'warning' : 'success'}>{temp}°C</Text>
                                            )
                                        },
                                        { title: 'Vibration', dataIndex: 'vibration', key: 'vibration' },
                                        { title: 'Uptime', dataIndex: 'uptime', key: 'uptime' }
                                    ]}
                                />
                            </Card>
                        </Col>
                    </Row>
        </>
    );
};

export default ManufacturingDashboard;