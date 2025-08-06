import React, { useState } from 'react';
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
    Modal
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
    FireOutlined
} from '@ant-design/icons';
import AddMachine from './addmachine';

const { Title, Text } = Typography;
const { Option } = Select;

const MachineDashboard = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Modal handlers
    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    // Mock data for machines
    const machineData = [
        {
            key: '1',
            id: 'M001',
            name: 'Production Line A',
            status: 'active',
            location: 'Factory Floor 1',
            lastCheck: '2024-01-15 10:30',
            efficiency: 95,
            temperature: 42,
        },
        {
            key: '2',
            id: 'M002',
            name: 'Assembly Robot B',
            status: 'maintenance',
            location: 'Factory Floor 2',
            lastCheck: '2024-01-15 09:15',
            efficiency: 78,
            temperature: 38,
        },
        {
            key: '3',
            id: 'M003',
            name: 'Packaging Machine C',
            status: 'inactive',
            location: 'Warehouse A',
            lastCheck: '2024-01-14 16:45',
            efficiency: 0,
            temperature: 25,
        },
        {
            key: '4',
            id: 'M004',
            name: 'Quality Control D',
            status: 'active',
            location: 'Factory Floor 1',
            lastCheck: '2024-01-15 11:00',
            efficiency: 92,
            temperature: 40,
        },
        {
            key: '5',
            id: 'M005',
            name: 'Material Handler E',
            status: 'maintenance',
            location: 'Factory Floor 3',
            lastCheck: '2024-01-15 08:30',
            efficiency: 65,
            temperature: 45,
        },
        {
            key: '6',
            id: 'M006',
            name: 'High-Temp Furnace F',
            status: 'active',
            location: 'Factory Floor 2',
            lastCheck: '2024-01-15 12:00',
            efficiency: 88,
            temperature: 85, // High temperature alert
        },
        {
            key: '7',
            id: 'M007',
            name: 'Steel Melter G',
            status: 'active',
            location: 'Factory Floor 4',
            lastCheck: '2024-01-15 11:45',
            efficiency: 95,
            temperature: 92, // High temperature alert
        },
        {
            key: '8',
            id: 'M008',
            name: 'Heat Treatment H',
            status: 'active',
            location: 'Factory Floor 1',
            lastCheck: '2024-01-15 10:15',
            efficiency: 82,
            temperature: 78,
        },
    ];

    // Statistics data
    const stats = [
        { title: "Total Machines", value: machineData.length, suffix: "", subtext: "2 new this week", color: "#1890ff" },
        { title: "Active Machines", value: machineData.filter(m => m.status === 'active').length, suffix: "", subtext: "75% operational", color: "#52c41a" },
        { title: "Maintenance", value: machineData.filter(m => m.status === 'maintenance').length, suffix: "", subtext: "2 overdue", color: "#faad14" },
        { title: "High Temp Alert", value: machineData.filter(m => m.temperature > 80).length, suffix: "", subtext: "Needs attention", color: "#ff4d4f" },
    ];

    // Get machines with high temperature
    const highTempMachines = machineData.filter(machine => machine.temperature > 80);

    // Table columns configuration
    const columns = [
        {
            title: 'Machine ID',
            dataIndex: 'id',
            key: 'id',
            width: 100,
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            width: 200,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status) => {
                const statusConfig = {
                    active: { color: 'green', text: 'Active' },
                    maintenance: { color: 'orange', text: 'Maintenance' },
                    inactive: { color: 'red', text: 'Inactive' },
                };
                const config = statusConfig[status] || { color: 'default', text: status };
                return <Tag color={config.color}>{config.text}</Tag>;
            },
        },
        {
            title: 'Location',
            dataIndex: 'location',
            key: 'location',
            width: 150,
        },
        {
            title: 'Efficiency',
            dataIndex: 'efficiency',
            key: 'efficiency',
            width: 100,
            render: (efficiency) => `${efficiency}%`,
        },
        {
            title: 'Temperature',
            dataIndex: 'temperature',
            key: 'temperature',
            width: 120,
            render: (temp) => {
                const isHighTemp = temp > 80;
                return (
                    <Space>
                        <FireOutlined style={{ color: isHighTemp ? '#ff4d4f' : '#52c41a' }} />
                        <Text style={{ color: isHighTemp ? '#ff4d4f' : 'inherit', fontWeight: isHighTemp ? 'bold' : 'normal' }}>
                            {temp}°C
                        </Text>
                        {isHighTemp && <Badge status="error" />}
                    </Space>
                );
            },
        },
        {
            title: 'Last Check',
            dataIndex: 'lastCheck',
            key: 'lastCheck',
            width: 150,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="View Details">
                        <Button type="text" icon={<EyeOutlined />} size="small" />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button type="text" icon={<EditOutlined />} size="small" />
                    </Tooltip>
                    <Tooltip title="Settings">
                        <Button type="text" icon={<SettingOutlined />} size="small" />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button type="text" icon={<DeleteOutlined />} size="small" danger />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    // Filter data based on active tab
    const getFilteredData = () => {
        if (activeTab === 'all') return machineData;
        return machineData.filter(machine => machine.status === activeTab);
    };

    const filteredData = getFilteredData();

    return (
        <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <Title level={2} style={{ margin: 0 }}>Machine Dashboard</Title>
                <Text type="secondary">Detailed information about all machines</Text>
            </div>

            {/* Temperature Alert */}
            {highTempMachines.length > 0 && (
                <Alert
                    message={
                        <Space>
                            <WarningOutlined style={{ color: '#ff4d4f' }} />
                            <Text strong>High Temperature Alert</Text>
                        </Space>
                    }
                    description={
                        <div>
                            <Text>
                                {highTempMachines.length} machine{highTempMachines.length > 1 ? 's' : ''} with temperature above 80°C detected:
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
                    action={
                        <Button size="small" danger>
                            Acknowledge
                        </Button>
                    }
                />
            )}

            {/* Action Buttons */}
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                    <Input
                        placeholder="Search machines..."
                        prefix={<SearchOutlined />}
                        style={{ width: 300 }}
                    />
                    <Select defaultValue="all" style={{ width: 120 }}>
                        <Option value="all">All Status</Option>
                        <Option value="active">Active</Option>
                        <Option value="maintenance">Maintenance</Option>
                        <Option value="inactive">Inactive</Option>
                    </Select>
                </Space>
                <Space>
                    <Button icon={<ReloadOutlined />}>Refresh</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
                        Add Machine
                    </Button>
                </Space>
            </div>

            {/* Statistics Cards */}
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

            {/* Main Content */}
            <Card>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={[
                        {
                            key: 'all',
                            label: `All Machines (${machineData.length})`,
                        },
                        {
                            key: 'active',
                            label: `Active (${machineData.filter(m => m.status === 'active').length})`,
                        },
                        {
                            key: 'maintenance',
                            label: `Maintenance (${machineData.filter(m => m.status === 'maintenance').length})`,
                        },
                        {
                            key: 'inactive',
                            label: `Inactive (${machineData.filter(m => m.status === 'inactive').length})`,
                        },
                    ]}
                />
                
                <Table
                    columns={columns}
                    dataSource={filteredData}
                    pagination={false}
                    scroll={{ x: 1000 }}
                    size="middle"
                    style={{ marginTop: '16px' }}
                />
                
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} machines
                    </Text>
                    <Pagination
                        current={currentPage}
                        total={filteredData.length}
                        pageSize={pageSize}
                        showSizeChanger
                        showQuickJumper
                        showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
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
                    onSuccess={(values) => {
                        console.log('Machine added successfully:', values);
                        setIsModalVisible(false);
                        // Here you can add the new machine to your data
                        // For example: setMachineData([...machineData, newMachine]);
                    }}
                    onCancel={handleCancel}
                />
            </Modal>
        </div>
    );
};

export default MachineDashboard;