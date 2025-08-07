import React, { useState } from 'react';
import {
    Table,
    Card,
    Button,
    Tag,
    Avatar,
    Typography,
    Row,
    Col,
    List,
    Space,
    Popconfirm,
    message,
    Modal
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleTwoTone,
    CloseCircleTwoTone,
    UserOutlined
} from '@ant-design/icons';
import AddUser from './add_user';

const { Title, Text } = Typography;

const users = [
    {
        name: 'John Smith',
        title: 'Quản lý Nhà máy',
        email: 'john.smith@factory.com',
        role: 'Admin',
        lastActive: 'Hôm nay, 09:42',
        status: 'Hoạt động',
        avatar: 'https://via.placeholder.com/40'
    },
    {
        name: 'Sarah Johnson',
        title: 'Trưởng nhóm bảo trì',
        email: 'sarah.j@factory.com',
        role: 'Supervisor',
        lastActive: 'Hôm qua, 16:30',
        status: 'Hoạt động',
        avatar: 'https://via.placeholder.com/40'
    },
    {
        name: 'Michael Chen',
        title: 'Kỹ thuật viên',
        email: 'michael.c@factory.com',
        role: 'Operator',
        lastActive: '2 ngày trước',
        status: 'Hoạt động',
        avatar: 'https://via.placeholder.com/40'
    }
];

const roles = [
    {
        title: 'Quản trị viên',
        permissions: [
            'Toàn quyền truy cập hệ thống',
            'Quản lý người dùng',
            'Cấu hình hệ thống'
        ]
    },
    {
        title: 'Giám sát',
        permissions: [
            'Xem tất cả máy móc',
            'Xác nhận cảnh báo',
            'Tạo báo cáo'
        ],
        exclusions: ['Cấu hình hệ thống']
    },
    {
        title: 'Người vận hành',
        permissions: [
            'Xem máy được phân công',
            'Điều khiển cơ bản'
        ],
        exclusions: ['Xác nhận cảnh báo', 'Tạo báo cáo']
    }
];

const roleColor = (role) => {
    if (role === 'Admin') return 'green';
    if (role === 'Supervisor') return 'blue';
    return 'gold';
};

const UserManagement = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);

    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const handleEdit = (record) => {
        message.info(`Chỉnh sửa người dùng: ${record.name}`);
    };

    const handleDelete = (record) => {
        message.success(`Đã xoá người dùng: ${record.name}`);
    };

    const handleUserAdded = (values) => {
        console.log('User added successfully:', values);
        message.success('Người dùng đã được thêm thành công!');
        setIsModalVisible(false);
    };

    const columns = [
        {
            title: 'Họ và Tên',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <Avatar src={record.avatar} alt={record.name} />
                    <div>
                        <div style={{ fontWeight: 500 }}>{text}</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{record.title}</Text>
                    </div>
                </Space>
            )
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            render: (text) => <Text type="secondary">{text}</Text>
        },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            render: (role) => (
                <Tag color={roleColor(role)} style={{ fontWeight: 500 }}>{role}</Tag>
            )
        },
        {
            title: 'Hoạt động gần nhất',
            dataIndex: 'lastActive',
            key: 'lastActive',
            render: (text) => <Text type="secondary">{text}</Text>
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color="green" icon={<CheckCircleTwoTone twoToneColor="#52c41a" />}>{status}</Tag>
            )
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => handleEdit(record)}
                    >
                        Sửa
                    </Button>
                    <Popconfirm
                        title="Bạn có chắc muốn xoá người dùng này?"
                        onConfirm={() => handleDelete(record)}
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button icon={<DeleteOutlined />} size="small" danger>Xoá</Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
            <Title level={2} style={{ marginBottom: 24 }}>Quản lý Người dùng & Phân quyền</Title>
            <Card style={{ marginBottom: 32 }}>
                <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                    <Col>
                        <Title level={4} style={{ margin: 0 }}>Danh sách người dùng</Title>
                        <Text type="secondary">Quản lý quyền truy cập hệ thống</Text>
                    </Col>
                    <Col>
                        <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>Thêm Người dùng</Button>
                    </Col>
                </Row>
                <Table
                    columns={columns}
                    dataSource={users}
                    rowKey="email"
                    pagination={false}
                />
            </Card>
            <Card>
                <Title level={4} style={{ marginBottom: 16 }}>Nhóm quyền</Title>
                <Row gutter={[16, 16]}>
                    {roles.map((role, idx) => (
                        <Col xs={24} md={8} key={idx}>
                            <Card title={role.title} bordered>
                                <List
                                    size="small"
                                    dataSource={role.permissions}
                                    renderItem={perm => (
                                        <List.Item>
                                            <CheckCircleTwoTone twoToneColor="#52c41a" style={{ marginRight: 8 }} />
                                            {perm}
                                        </List.Item>
                                    )}
                                />
                                {role.exclusions && (
                                    <List
                                        size="small"
                                        dataSource={role.exclusions}
                                        renderItem={ex => (
                                            <List.Item>
                                                <CloseCircleTwoTone twoToneColor="#bfbfbf" style={{ marginRight: 8 }} />
                                                <Text type="secondary">{ex}</Text>
                                            </List.Item>
                                        )}
                                    />
                                )}
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Card>
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <UserOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                        Thêm Người Dùng Mới
                    </div>
                }
                open={isModalVisible}
                onCancel={handleCancel}
                width={1000}
                footer={null}
                destroyOnClose
            >
                <AddUser
                    onSuccess={handleUserAdded}
                    onCancel={handleCancel}
                />
            </Modal>
        </div>
    );
};

export default UserManagement;
