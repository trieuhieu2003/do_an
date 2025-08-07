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
            name: 'Máy ép nhựa',
            status: 'critical',
            temperature: 98,
            vibration: '4.2 m/s²',
            uptime: '12:45:22'
        },
        {
            id: '#8',
            name: 'Máy CNC Router',
            status: 'warning',
            temperature: 72,
            vibration: '3.8 m/s²',
            uptime: '08:22:15'
        },
        {
            id: '#15',
            name: 'Máy tiện',
            status: 'running',
            temperature: 65,
            vibration: '2.1 m/s²',
            uptime: '23:10:45'
        },
        {
            id: '#22',
            name: 'Dây chuyền đóng gói',
            status: 'running',
            temperature: 58,
            vibration: '1.5 m/s²',
            uptime: '15:32:10'
        },
        {
            id: '#5',
            name: 'Robot lắp ráp',
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
            title: 'Nguy hiểm: Quá nhiệt',
            description: 'Máy #12 - Máy ép nhựa',
            time: '10 phút trước'
        },
        {
            id: 2,
            type: 'warning',
            title: 'Cảnh báo: Độ rung cao',
            description: 'Máy #8 - CNC Router',
            time: '25 phút trước'
        },
        {
            id: 3,
            type: 'info',
            title: 'Bảo trì đến hạn',
            description: 'Máy #22 - Dây chuyền đóng gói',
            time: '1 giờ trước'
        },
        {
            id: 4,
            type: 'warning',
            title: 'Cảnh báo: Thiếu dầu bôi trơn',
            description: 'Máy #15 - Máy tiện',
            time: '2 giờ trước'
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setProductionData(prevData =>
                prevData.map(item => ({
                    ...item,
                    actual: Math.max(0, item.actual + Math.floor(Math.random() * 20) - 10)
                }))
            );

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
            <Layout>
                <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <Title level={3} style={{ margin: 0 }}>Bảng điều khiển sản xuất</Title>
                    <Space>
                        {/* <Input.Search placeholder="Search..." style={{ width: 200 }} /> */}
                        <Badge count={5}>
                            <Button shape="circle" icon={<BellOutlined />} />
                        </Badge>
                        <Text>Shift: A</Text>
                        <Badge status="success" />
                    </Space>
                </Header>
                <Row gutter={[24, 24]}>
                    <Col xs={24} sm={12} md={6}>
                        <Card>
                            <Statistic
                                title="Tổng số máy"
                                value={42}
                                prefix={<RobotOutlined style={{ color: '#1890ff' }} />}
                                valueStyle={{ fontWeight: 'bold' }}
                                suffix={<Tag color="green">+12%</Tag>}
                            />
                            <Text type="success"><ArrowUpOutlined /> Tăng 12% so với tuần trước</Text>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card>
                            <Statistic
                                title="Máy đang hoạt động"
                                value={runningMachines}
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
                                value={5}
                                prefix={<AlertOutlined style={{ color: '#ff4d4f' }} />}
                                valueStyle={{ fontWeight: 'bold' }}
                                suffix={<Tag color="red">2 nguy hiểm</Tag>}
                            />
                            <Text type="danger"><ExclamationCircleOutlined /> 2 nguy hiểm</Text>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card>
                            <Statistic
                                title="Sản lượng sản xuất"
                                value={1248}
                                prefix={<AppstoreOutlined style={{ color: '#722ed1' }} />}
                                valueStyle={{ fontWeight: 'bold' }}
                                suffix={<Tag color="purple">+8%</Tag>}
                            />
                            <Text type="success"><ArrowUpOutlined /> Vượt mục tiêu 8%</Text>
                        </Card>
                    </Col>
                </Row>
                <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                    <Col xs={24} lg={16}>
                        <Card title="Tổng quan sản xuất" extra={
                            <Space>
                                <Button size="small" type="primary">Ngày</Button>
                                <Button size="small">Tuần</Button>
                                <Button size="small">Tháng</Button>
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
                        <Card title="Tình trạng máy móc">
                            <Progress type="dashboard" percent={utilizationRate} format={percent => `${percent}%`} />
                            <List size="small" style={{ marginTop: 24 }}>
                                <List.Item>
                                    <Tag color="green">Đang chạy</Tag>
                                    <Text>{runningMachines}</Text>
                                </List.Item>
                                <List.Item>
                                    <Tag color="default">Chờ</Tag>
                                    <Text>{idleMachines}</Text>
                                </List.Item>
                                <List.Item>
                                    <Tag color="warning">Cảnh báo</Tag>
                                    <Text>{warningMachines}</Text>
                                </List.Item>
                                <List.Item>
                                    <Tag color="red">Nguy hiểm</Tag>
                                    <Text>{criticalMachines}</Text>
                                </List.Item>
                            </List>
                        </Card>
                    </Col>
                </Row>
                <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                    <Col xs={24} lg={8}>
                        <Card title="Cảnh báo gần đây" extra={<Button type="link">Xem tất cả</Button>}>
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
                        <Card title="Tình trạng chi tiết máy móc" extra={
                            <Space>
                                <Button size="small" type="primary">Tất cả</Button>
                                <Button size="small">Đang chạy</Button>
                                <Button size="small">Chờ</Button>
                                <Button size="small">Báo động</Button>
                            </Space>
                        }>
                            <Table
                                dataSource={machineData}
                                rowKey="id"
                                pagination={false}
                                columns={[
                                    { title: 'Mã máy', dataIndex: 'id', key: 'id' },
                                    { title: 'Tên máy', dataIndex: 'name', key: 'name' },
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
                                                {status === 'running' ? 'Đang chạy' :
                                                    status === 'idle' ? 'Chờ' :
                                                        status === 'warning' ? 'Cảnh báo' :
                                                            status === 'critical' ? 'Nguy hiểm' : status}
                                            </Tag>
                                        )
                                    },
                                    {
                                        title: 'Nhiệt độ',
                                        dataIndex: 'temperature',
                                        key: 'temperature',
                                        render: temp => (
                                            <Text type={temp > 85 ? 'danger' : temp > 60 ? 'warning' : 'success'}>{temp}°C</Text>
                                        )
                                    },
                                    { title: 'Độ rung', dataIndex: 'vibration', key: 'vibration' },
                                    { title: 'Thời gian hoạt động', dataIndex: 'uptime', key: 'uptime' }
                                ]}
                            />
                        </Card>
                    </Col>
                </Row>
            </Layout>

        </>
    );
};

export default ManufacturingDashboard;