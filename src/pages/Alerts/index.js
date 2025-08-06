import React, { useState, useEffect } from 'react';
import {
    Table,
    Card,
    Input,
    Select,
    Badge,
    Button,
    Space,
    Typography,
    Progress,
    Avatar,
    Tag,
    Alert,
    Row,
    Col,
    Statistic
} from 'antd';
import {
    SearchOutlined,
    ExclamationCircleOutlined,
    CheckCircleOutlined,
    SettingOutlined,
    WarningOutlined,
    ClockCircleOutlined,
    MoreOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const Alerts = () => {
    const [alerts, setAlerts] = useState([
        {
            id: 1,
            machine: 'Máy ép nhựa #1',
            type: 'nhiệt độ',
            status: 'critical',
            value: '95°C',
            threshold: '80°C',
            time: '2 phút trước',
            acknowledged: false,
            area: 'Khu vực A',
            machineId: 'M001'
        },
        {
            id: 2,
            machine: 'Băng tải chính',
            type: 'tốc độ',
            status: 'warning',
            value: '120%',
            threshold: '110%',
            time: '5 phút trước',
            acknowledged: true,
            area: 'Khu vực B',
            machineId: 'M002'
        },
        {
            id: 3,
            machine: 'Máy đóng gói #3',
            type: 'áp suất',
            status: 'critical',
            value: '8.5 bar',
            threshold: '7 bar',
            time: '10 phút trước',
            acknowledged: false,
            area: 'Khu vực C',
            machineId: 'M003'
        },
        {
            id: 4,
            machine: 'Hệ thống làm lạnh',
            type: 'nhiệt độ',
            status: 'warning',
            value: '-12°C',
            threshold: '-10°C',
            time: '15 phút trước',
            acknowledged: true,
            area: 'Khu vực D',
            machineId: 'M004'
        },
        {
            id: 5,
            machine: 'Máy trộn nguyên liệu',
            type: 'rung động',
            status: 'critical',
            value: '4.8 mm/s',
            threshold: '3.5 mm/s',
            time: '20 phút trước',
            acknowledged: false,
            area: 'Khu vực E',
            machineId: 'M005'
        },
    ]);

    const [selectedFilter, setSelectedFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const acknowledgeAlert = (id) => {
        setAlerts(alerts.map(alert =>
            alert.id === id ? { ...alert, acknowledged: true } : alert
        ));
    };

    const filteredAlerts = alerts.filter(alert => {
        const matchesFilter = selectedFilter === 'all' ||
            (selectedFilter === 'critical' && alert.status === 'critical') ||
            (selectedFilter === 'warning' && alert.status === 'warning');

        const matchesSearch = alert.machine.toLowerCase().includes(searchTerm.toLowerCase()) ||
            alert.type.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    // Calculate statistics
    const totalAlerts = alerts.length;
    const criticalAlerts = alerts.filter(alert => alert.status === 'critical').length;
    const warningAlerts = alerts.filter(alert => alert.status === 'warning').length;
    const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged).length;

    useEffect(() => {
        const interval = setInterval(() => {
            // Cập nhật random
            if (Math.random() > 0.7) {
                setAlerts(prev => {
                    const randomIndex = Math.floor(Math.random() * prev.length);
                    const updated = [...prev];
                    updated[randomIndex] = {
                        ...updated[randomIndex],
                        value: `${Math.floor(Math.random() * 10) + (updated[randomIndex].status === 'critical' ? 80 : 100)}${updated[randomIndex].type === 'nhiệt độ' ? '°C' : updated[randomIndex].type === 'áp suất' ? ' bar' : '%'}`
                    };
                    return updated;
                });
            }

            // Thêm alert mới
            if (Math.random() > 0.9) {
                const newAlert = {
                    id: Date.now(),
                    machine: `Máy ${['ép', 'đóng gói', 'trộn', 'cắt'][Math.floor(Math.random() * 4)]} #${Math.floor(Math.random() * 10) + 1}`,
                    type: ['nhiệt độ', 'áp suất', 'tốc độ', 'rung động'][Math.floor(Math.random() * 4)],
                    status: Math.random() > 0.5 ? 'critical' : 'warning',
                    value: `${Math.floor(Math.random() * 10) + 80}${Math.random() > 0.5 ? '°C' : '%'}`,
                    threshold: `${Math.floor(Math.random() * 10) + 70}${Math.random() > 0.5 ? '°C' : '%'}`,
                    time: 'Vừa xảy ra',
                    acknowledged: false,
                    area: `Khu vực ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}`,
                    machineId: `M${String(Date.now()).slice(-3)}`
                };
                setAlerts(prev => [newAlert, ...prev]);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status) => {
        return status === 'critical' ? 'red' : 'orange';
    };

    const getStatusText = (status) => {
        return status === 'critical' ? 'Nghiêm trọng' : 'Cảnh báo';
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'nhiệt độ':
                return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
            case 'áp suất':
                return <WarningOutlined style={{ color: '#faad14' }} />;
            case 'tốc độ':
                return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
            case 'rung động':
                return <SettingOutlined style={{ color: '#52c41a' }} />;
            default:
                return <ExclamationCircleOutlined />;
        }
    };

    const calculatePercentage = (value, threshold) => {
        const numericValue = parseFloat(value);
        const numericThreshold = parseFloat(threshold);
        return isNaN(numericValue) || isNaN(numericThreshold)
            ? 0
            : Math.min(100, Math.round((numericValue / numericThreshold) * 100));
    };

    const columns = [
        {
            title: 'Máy',
            dataIndex: 'machine',
            key: 'machine',
            render: (text, record) => (
                <Space>
                    <Avatar
                        icon={<SettingOutlined />}
                        style={{ backgroundColor: '#1890ff' }}
                    />
                    <div>
                        <div style={{ fontWeight: 500 }}>{text}</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{record.area}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Thông số',
            dataIndex: 'type',
            key: 'type',
            render: (text, record) => (
                <div>
                    <Space>
                        {getTypeIcon(text)}
                        <span style={{ textTransform: 'capitalize' }}>{text}</span>
                    </Space>
                    <div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>ID: {record.machineId}</Text>
                    </div>
                </div>
            ),
        },
        {
            title: 'Giá trị',
            dataIndex: 'value',
            key: 'value',
            render: (text, record) => {
                const percentage = calculatePercentage(record.value, record.threshold);
                return (
                    <div>
                        <div style={{ fontWeight: 'bold' }}>{text}</div>
                        <Progress
                            percent={percentage}
                            size="small"
                            strokeColor={record.status === 'critical' ? '#ff4d4f' : '#faad14'}
                            showInfo={false}
                        />
                    </div>
                );
            },
        },
        {
            title: 'Ngưỡng',
            dataIndex: 'threshold',
            key: 'threshold',
            render: (text) => <Text type="secondary">{text}</Text>,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Badge
                    status={status === 'critical' ? 'error' : 'warning'}
                    text={getStatusText(status)}
                />
            ),
        },
        {
            title: 'Thời gian',
            dataIndex: 'time',
            key: 'time',
            render: (text) => <Text type="secondary">{text}</Text>,
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space>
                    {!record.acknowledged ? (
                        <Button
                            type="primary"
                            size="small"
                            onClick={() => acknowledgeAlert(record.id)}
                        >
                            Xác nhận
                        </Button>
                    ) : (
                        <Tag color="green" icon={<CheckCircleOutlined />}>
                            Đã xử lý
                        </Tag>
                    )}
                    <Button
                        type="text"
                        size="small"
                        icon={<MoreOutlined />}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>
                <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
                Danh Sách Cảnh Báo
            </Title>

            {/* Statistics Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Tổng cảnh báo"
                            value={totalAlerts}
                            valueStyle={{ color: '#1890ff' }}
                            prefix={<ExclamationCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Nghiêm trọng"
                            value={criticalAlerts}
                            valueStyle={{ color: '#ff4d4f' }}
                            prefix={<ExclamationCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Cảnh báo"
                            value={warningAlerts}
                            valueStyle={{ color: '#faad14' }}
                            prefix={<WarningOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Chưa xử lý"
                            value={unacknowledgedAlerts}
                            valueStyle={{ color: '#52c41a' }}
                            prefix={<ClockCircleOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Filters and Search */}
            <Card style={{ marginBottom: '24px' }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} md={12}>
                        <Input
                            placeholder="Tìm kiếm máy hoặc loại cảnh báo..."
                            prefix={<SearchOutlined />}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%' }}
                        />
                    </Col>
                    <Col xs={24} md={12}>
                        <Select
                            value={selectedFilter}
                            onChange={setSelectedFilter}
                            style={{ width: '100%' }}
                        >
                            <Option value="all">Tất cả cảnh báo</Option>
                            <Option value="critical">Sự cố nghiêm trọng</Option>
                            <Option value="warning">Cảnh báo</Option>
                        </Select>
                    </Col>
                </Row>
            </Card>

            {/* Alerts Table */}
            <Card>
                <Table
                    columns={columns}
                    dataSource={filteredAlerts}
                    rowKey="id"
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} cảnh báo`,
                    }}
                    rowClassName={(record) => !record.acknowledged ? 'unacknowledged-row' : ''}
                    locale={{
                        emptyText: 'Không có cảnh báo nào phù hợp'
                    }}
                />
            </Card>

            {/* System Status Alert */}
            {unacknowledgedAlerts > 0 && (
                <Alert
                    message="Có cảnh báo chưa được xử lý"
                    description={`Hiện có ${unacknowledgedAlerts} cảnh báo chưa được xác nhận. Vui lòng kiểm tra và xử lý kịp thời.`}
                    type="warning"
                    showIcon
                    style={{ marginTop: '16px' }}
                />
            )}
        </div>
    );
};

export default Alerts;
