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

    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const machineData = [
        {
            key: '1',
            id: 'M001',
            name: 'Dây chuyền sản xuất A',
            status: 'active',
            location: 'Xưởng 1',
            lastCheck: '2024-01-15 10:30',
            efficiency: 95,
            temperature: 42,
        },
        {
            key: '2',
            id: 'M002',
            name: 'Robot lắp ráp B',
            status: 'maintenance',
            location: 'Xưởng 2',
            lastCheck: '2024-01-15 09:15',
            efficiency: 78,
            temperature: 38,
        },
        {
            key: '3',
            id: 'M003',
            name: 'Máy đóng gói C',
            status: 'inactive',
            location: 'Kho A',
            lastCheck: '2024-01-14 16:45',
            efficiency: 0,
            temperature: 25,
        },
        {
            key: '4',
            id: 'M004',
            name: 'Kiểm tra chất lượng D',
            status: 'active',
            location: 'Xưởng 1',
            lastCheck: '2024-01-15 11:00',
            efficiency: 92,
            temperature: 40,
        },
        {
            key: '5',
            id: 'M005',
            name: 'Máy vận chuyển vật liệu E',
            status: 'maintenance',
            location: 'Xưởng 3',
            lastCheck: '2024-01-15 08:30',
            efficiency: 65,
            temperature: 45,
        },
        {
            key: '6',
            id: 'M006',
            name: 'Lò nung nhiệt cao F',
            status: 'active',
            location: 'Xưởng 2',
            lastCheck: '2024-01-15 12:00',
            efficiency: 88,
            temperature: 85,
        },
        {
            key: '7',
            id: 'M007',
            name: 'Máy luyện thép G',
            status: 'active',
            location: 'Xưởng 4',
            lastCheck: '2024-01-15 11:45',
            efficiency: 95,
            temperature: 92,
        },
        {
            key: '8',
            id: 'M008',
            name: 'Xử lý nhiệt H',
            status: 'active',
            location: 'Xưởng 1',
            lastCheck: '2024-01-15 10:15',
            efficiency: 82,
            temperature: 78,
        },
    ];

    const stats = [
        { title: "Tổng số máy", value: machineData.length, suffix: "", subtext: "2 máy mới tuần này", color: "#1890ff" },
        { title: "Máy đang hoạt động", value: machineData.filter(m => m.status === 'active').length, suffix: "", subtext: "75% đang hoạt động", color: "#52c41a" },
        { title: "Đang bảo trì", value: machineData.filter(m => m.status === 'maintenance').length, suffix: "", subtext: "2 máy quá hạn", color: "#faad14" },
        { title: "Cảnh báo nhiệt độ cao", value: machineData.filter(m => m.temperature > 80).length, suffix: "", subtext: "Cần kiểm tra gấp", color: "#ff4d4f" },
    ];

    const highTempMachines = machineData.filter(machine => machine.temperature > 80);

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
            render: (efficiency) => `${efficiency}%`,
        },
        {
            title: 'Nhiệt độ',
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
                    <Tooltip title="Xem chi tiết">
                        <Button type="text" icon={<EyeOutlined />} size="small" />
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                        <Button type="text" icon={<EditOutlined />} size="small" />
                    </Tooltip>
                    <Tooltip title="Cài đặt">
                        <Button type="text" icon={<SettingOutlined />} size="small" />
                    </Tooltip>
                    <Tooltip title="Xoá">
                        <Button type="text" icon={<DeleteOutlined />} size="small" danger />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const getFilteredData = () => {
        if (activeTab === 'all') return machineData;
        return machineData.filter(machine => machine.status === activeTab);
    };

    const filteredData = getFilteredData();

    return (
        <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
            <div style={{ marginBottom: '24px' }}>
                <Title level={2} style={{ margin: 0 }}>Bảng điều khiển máy móc</Title>
                <Text type="secondary">Thông tin chi tiết về tất cả các máy</Text>
            </div>

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
                    action={
                        <Button size="small" danger>
                            Đã hiểu
                        </Button>
                    }
                />
            )}

            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                    <Input
                        placeholder="Tìm kiếm máy..."
                        prefix={<SearchOutlined />}
                        style={{ width: 300 }}
                    />
                    <Select defaultValue="all" style={{ width: 120 }}>
                        <Option value="all">Tất cả</Option>
                        <Option value="active">Đang hoạt động</Option>
                        <Option value="maintenance">Bảo trì</Option>
                        <Option value="inactive">Không hoạt động</Option>
                    </Select>
                </Space>
                <Space>
                    <Button icon={<ReloadOutlined />}>Làm mới</Button>
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
                    onSuccess={(values) => {
                        console.log('Thêm máy thành công:', values);
                        setIsModalVisible(false);
                    }}
                    onCancel={handleCancel}
                />
            </Modal>
        </div>
    );
};

export default MachineDashboard;
