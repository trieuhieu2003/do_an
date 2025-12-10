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
    Statistic,
    message,
    Spin
} from 'antd';
import {
    SearchOutlined,
    ExclamationCircleOutlined,
    CheckCircleOutlined,
    SettingOutlined,
    WarningOutlined,
    ClockCircleOutlined,
    MoreOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import alertService from '../../service/alert.service';
import machinesDataService from '../../service/machine.service';

const { Title, Text } = Typography;
const { Option } = Select;

const Alerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

//NOTE Load danh sách cảnh báo từ Firebase, fallback localStorage
    const loadAlerts = async () => {
        try {
            setLoading(true);
            console.log('Loading alerts from Firebase...');
            const querySnapshot = await alertService.getAllAlerts();
            const alertsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate() || new Date()
            }));
            console.log('Firebase alerts loaded:', alertsData.length);
            setAlerts(alertsData);
        } catch (error) {
            console.error('Error loading alerts from Firebase:', error);
            // Fallback to localStorage
            try {
                console.log('Falling back to localStorage...');
                const localAlerts = await alertService.getAlertsFromLocalStorage();
                console.log('localStorage alerts loaded:', localAlerts.length);
                setAlerts(localAlerts);
            } catch (localError) {
                console.error('Error loading alerts from localStorage:', localError);
                message.error('Không thể tải dữ liệu cảnh báo!');
            }
        } finally {
            setLoading(false);
        }
    };

//NOTE Load danh sách máy để tạo cảnh báo nhiệt độ
    const loadMachines = async () => {
        try {
            const querySnapshot = await machinesDataService.getAllMachines();
            const machinesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                name: doc.data().machineName || 'Chưa có tên',
                status: doc.data().status || 'inactive'
            }));
            setMachines(machinesData);
        } catch (error) {
            console.error('Error loading machines:', error);
            message.error('Không thể tải dữ liệu máy!');
        }
    };

//NOTE Đánh dấu cảnh báo đã xác nhận
    const acknowledgeAlert = async (alertId) => {
        try {
            await alertService.acknowledgeAlert(alertId);
            setAlerts(alerts.map(alert =>
                alert.id === alertId ? { ...alert, acknowledged: true } : alert
            ));
            message.success('Đã xác nhận cảnh báo!');
        } catch (error) {
            console.error('Error acknowledging alert:', error);
            message.error('Không thể xác nhận cảnh báo!');
        }
    };

//NOTE Tạo cảnh báo nhiệt độ từ dữ liệu máy
    const createMachineAlerts = async () => {
        try {
            for (const machine of machines) {
                const normalizedMachine = {
                    id: machine.id,
                    name: machine.name || machine.machineName || 'Chưa có tên',
                    machineType: machine.machineType || machine.type || 'other',
                    location: machine.location || 'Chưa xác định'
                };

                const temperatureValue = typeof machine.temperature === 'number'
                    ? machine.temperature
                    : typeof machine.temperature === 'string'
                        ? parseFloat(machine.temperature)
                        : null;

                if (temperatureValue !== null && temperatureValue > 80) {
                    await alertService.createTemperatureAlert(normalizedMachine, temperatureValue);
                }
            }
            await loadAlerts(); // Reload alerts after creating
        } catch (error) {
            console.error('Error creating machine alerts:', error);
        }
    };

    //NOTE Lọc cảnh báo theo trạng thái và từ khóa tìm kiếm
    const filteredAlerts = alerts.filter(alert => {
        const matchesFilter = selectedFilter === 'all' ||
            (selectedFilter === 'critical' && alert.status === 'critical') ||
            (selectedFilter === 'warning' && alert.status === 'warning');

        const matchesSearch = (alert.machineName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (alert.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (alert.location || '').toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    //NOTE Tính toán thống kê nhanh
    const totalAlerts = alerts.length;
    const criticalAlerts = alerts.filter(alert => alert.status === 'critical').length;
    const warningAlerts = alerts.filter(alert => alert.status === 'warning').length;
    const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged).length;

    //NOTE Khởi tạo dữ liệu và auto-refresh mỗi 10s
    useEffect(() => {
        // Load initial data
        const loadData = async () => {
            await loadMachines();
            await loadAlerts();
        };
        loadData();

        // Set up real-time updates every 10 seconds
        const interval = setInterval(async () => {
            console.log('Auto-refreshing alerts...');
            await loadAlerts();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    //NOTE Khi danh sách máy thay đổi thì tạo cảnh báo mới (nếu có)
    useEffect(() => {
        if (machines.length > 0) {
            createMachineAlerts();
        }
    }, [machines]);

    //NOTE Helpers tính màu/trạng thái/biểu tượng
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

    //NOTE Cấu hình cột bảng cảnh báo
    const columns = [
        {
            title: 'Máy',
            dataIndex: 'machineName',
            key: 'machineName',
            render: (text, record) => (
                <Space>
                    <Avatar
                        icon={<SettingOutlined />}
                        style={{ backgroundColor: '#1890ff' }}
                    />
                    <div>
                        <div style={{ fontWeight: 500 }}>{text || 'Chưa có tên'}</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{record.location || 'Chưa có vị trí'}</Text>
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
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (createdAt) => {
                if (!createdAt) return <Text type="secondary">Không xác định</Text>;
                
                const now = new Date();
                const alertTime = new Date(createdAt);
                const diffInMinutes = Math.floor((now - alertTime) / (1000 * 60));
                
                let timeText;
                if (diffInMinutes < 1) {
                    timeText = 'Vừa xảy ra';
                } else if (diffInMinutes < 60) {
                    timeText = `${diffInMinutes} phút trước`;
                } else if (diffInMinutes < 1440) {
                    const hours = Math.floor(diffInMinutes / 60);
                    timeText = `${hours} giờ trước`;
                } else {
                    const days = Math.floor(diffInMinutes / 1440);
                    timeText = `${days} ngày trước`;
                }
                
                return <Text type="secondary">{timeText}</Text>;
            },
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <Title level={2} style={{ margin: 0 }}>
                    <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
                    Danh Sách Cảnh Báo
                </Title>
                <Button 
                    icon={<ReloadOutlined />} 
                    onClick={loadAlerts}
                    loading={loading}
                >
                    Làm mới
                </Button>
            </div>

            {/* NOTE Thẻ thống kê nhanh */}
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
            {/* NOTE Cảnh báo hệ thống khi còn cảnh báo chưa xử lý */}
            {unacknowledgedAlerts > 0 && (
                <Alert
                    message="Có cảnh báo chưa được xử lý"
                    description={`Hiện có ${unacknowledgedAlerts} cảnh báo chưa được xác nhận. Vui lòng kiểm tra và xử lý kịp thời.`}
                    type="warning"
                    showIcon
                    style={{ margin: '16px' }}
                />
            )}
            {/* NOTE Bộ lọc và tìm kiếm */}
            <Card style={{ marginBottom: '24px' }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} md={12}>
                        <Input
                            placeholder="Tìm kiếm theo tên máy, loại cảnh báo hoặc vị trí..."
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

            {/* NOTE Bảng danh sách cảnh báo */}
            <Card>
                <Spin spinning={loading}>
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
                </Spin>
            </Card>


        </div>
    );
};

export default Alerts;
