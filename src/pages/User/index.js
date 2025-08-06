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
        title: 'Plant Manager',
        email: 'john.smith@factory.com',
        role: 'Admin',
        lastActive: 'Today, 09:42',
        status: 'Active',
        avatar: 'https://via.placeholder.com/40'
    },
    {
        name: 'Sarah Johnson',
        title: 'Maintenance Lead',
        email: 'sarah.j@factory.com',
        role: 'Supervisor',
        lastActive: 'Yesterday, 16:30',
        status: 'Active',
        avatar: 'https://via.placeholder.com/40'
    },
    {
        name: 'Michael Chen',
        title: 'Technician',
        email: 'michael.c@factory.com',
        role: 'Operator',
        lastActive: '2 days ago',
        status: 'Active',
        avatar: 'https://via.placeholder.com/40'
    }
];

const roles = [
    {
        title: 'Administrator',
        permissions: [
            'Full system access',
            'User management',
            'System configuration'
        ]
    },
    {
        title: 'Supervisor',
        permissions: [
            'View all machines',
            'Acknowledge alerts',
            'Generate reports'
        ],
        exclusions: ['System configuration']
    },
    {
        title: 'Operator',
        permissions: [
            'View assigned machines',
            'Basic controls'
        ],
        exclusions: ['Acknowledge alerts', 'Generate reports']
    }
];

const roleColor = (role) => {
    if (role === 'Admin') return 'green';
    if (role === 'Supervisor') return 'blue';
    return 'gold';
};

const UserManagement = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Modal handlers
    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const handleEdit = (record) => {
        message.info(`Edit user: ${record.name}`);
    };
    
    const handleDelete = (record) => {
        message.success(`Deleted user: ${record.name}`);
    };

    const handleUserAdded = (values) => {
        console.log('User added successfully:', values);
        message.success('Người dùng đã được thêm thành công!');
        setIsModalVisible(false);
        // Here you can add the new user to your data
        // For example: setUsers([...users, newUser]);
    };

    const columns = [
        {
            title: 'Name',
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
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role) => (
                <Tag color={roleColor(role)} style={{ fontWeight: 500 }}>{role}</Tag>
            )
        },
        {
            title: 'Last Active',
            dataIndex: 'lastActive',
            key: 'lastActive',
            render: (text) => <Text type="secondary">{text}</Text>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color="green" icon={<CheckCircleTwoTone twoToneColor="#52c41a" />}>{status}</Tag>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => handleEdit(record)}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Are you sure to delete this user?"
                        onConfirm={() => handleDelete(record)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button icon={<DeleteOutlined />} size="small" danger>Delete</Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
            <Title level={2} style={{ marginBottom: 24 }}>User Management & Permissions</Title>
            <Card style={{ marginBottom: 32 }}>
                <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                    <Col>
                        <Title level={4} style={{ margin: 0 }}>System Users</Title>
                        <Text type="secondary">Manage who has access to the system</Text>
                    </Col>
                    <Col>
                        <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>Add User</Button>
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
                <Title level={4} style={{ marginBottom: 16 }}>Permission Groups</Title>
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
