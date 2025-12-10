import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Select,
  message,
  Card,
  Typography,
  Tag,
  Avatar,
  Tooltip,
  Popconfirm,
  Input,
  Row,
  Col,
  Statistic,
  Alert
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  EyeOutlined,
  ReloadOutlined,
  KeyOutlined,
  MailOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone
} from '@ant-design/icons';
import AddUser from './add_user';
import userService, { USER_ROLES } from '../../service/user.service';
import passwordService from '../../service/password.service';
import { getAuth, sendPasswordResetEmail, updatePassword } from 'firebase/auth';

const { Title, Text } = Typography;
const { Option } = Select;

//NOTE Trang quản lý người dùng
const User = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [newPasswordModalVisible, setNewPasswordModalVisible] = useState(false);
  const [newPasswordLoading, setNewPasswordLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordListModalVisible, setPasswordListModalVisible] = useState(false);
  const [passwordList, setPasswordList] = useState([]);
  const [addModalVisible, setAddModalVisible] = useState(false);

  // Firebase auth
  const auth = getAuth();

  //NOTE Fetch danh sách user khi mount
  useEffect(() => {
    fetchUsers();
  }, []);

  //NOTE Load danh sách user từ service
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await userService.getAllUsers();
      if (result.success) {
        setUsers(result.users);
      } else {
        message.error('Không thể tải danh sách người dùng');
      }
    } catch (error) {
      message.error('Lỗi khi tải danh sách người dùng: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  //NOTE Mở modal chỉnh sửa user
  const handleEditUser = (user) => {
    setSelectedUser(user);
    editForm.setFieldsValue({
      displayName: user.displayName,
      role: user.role,
      email: user.email
    });
    setEditModalVisible(true);
  };

  //NOTE Submit cập nhật user
  const handleUpdateUser = async (values) => {
    try {
      const result = await userService.updateUser(selectedUser.uid, {
        displayName: values.displayName,
        role: values.role
      });

      if (result.success) {
        message.success('Cập nhật người dùng thành công!');
        setEditModalVisible(false);
        fetchUsers(); // Refresh user list
      } else {
        message.error('Cập nhật thất bại');
      }
    } catch (error) {
      message.error('Lỗi khi cập nhật: ' + error.message);
    }
  };

  //NOTE Xóa user
  const handleDeleteUser = async (uid) => {
    try {
      const result = await userService.deleteUser(uid);
      if (result.success) {
        message.success('Xóa người dùng thành công!');
        fetchUsers(); // Refresh user list
      } else {
        message.error('Xóa thất bại');
      }
    } catch (error) {
      message.error('Lỗi khi xóa: ' + error.message);
    }
  };

  //NOTE Gửi email reset password
  const handleResetPassword = async (email) => {
    setResetPasswordLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      message.success(`Email reset password đã được gửi đến ${email}`);
      setResetPasswordModalVisible(false);
    } catch (error) {
      let errorMessage = 'Không thể gửi email reset password';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Email không tồn tại trong hệ thống';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email không hợp lệ';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Quá nhiều yêu cầu. Vui lòng thử lại sau';
          break;
        default:
          errorMessage = error.message;
      }
      message.error(errorMessage);
    } finally {
      setResetPasswordLoading(false);
    }
  };

  //NOTE Tạo mật khẩu mới (ghi log, không đổi Firebase)
  const handleCreateNewPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      message.error('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    setNewPasswordLoading(true);
    try {
      // Sử dụng PasswordService để tạo mật khẩu mới
      const result = await passwordService.createNewPasswordForUser(selectedUser, newPassword);

      if (result.success) {
        message.success(`Mật khẩu mới đã được tạo cho ${selectedUser.email}`);
        setNewPasswordModalVisible(false);
        setNewPassword('');

        // Hiển thị thông tin mật khẩu với cảnh báo
        Modal.info({
          title: 'Mật khẩu mới đã được lưu',
          content: (
            <div>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Mật khẩu mới:</strong> {newPassword}</p>
              <p><strong>Thời gian:</strong> {result.passwordInfo.timestamp}</p>

              <Alert
                message="⚠️ CẢNH BÁO QUAN TRỌNG"
                description="Mật khẩu này CHƯA được cập nhật trong Firebase! Người dùng vẫn cần sử dụng mật khẩu cũ để đăng nhập."
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
              />

              <Alert
                message="Hướng dẫn"
                description="Để thực sự thay đổi mật khẩu, hãy sử dụng Firebase Console hoặc gửi email reset password."
                type="info"
                showIcon
                style={{ marginTop: 16 }}
              />
            </div>
          ),
          width: 600,
          okText: 'Đã hiểu'
        });
      } else {
        message.error('Không thể tạo mật khẩu mới');
      }

    } catch (error) {
      message.error('Lỗi khi tạo mật khẩu mới: ' + error.message);
    } finally {
      setNewPasswordLoading(false);
    }
  };

  //NOTE Mở modal reset password
  const showResetPasswordModal = (user) => {
    setSelectedUser(user);
    setResetPasswordModalVisible(true);
  };

  //NOTE Mở modal tạo mật khẩu mới
  const showNewPasswordModal = (user) => {
    setSelectedUser(user);
    setNewPasswordModalVisible(true);
    setNewPassword('');
  };

  //NOTE Hiển thị danh sách mật khẩu đã tạo (localStorage)
  const showPasswordListModal = () => {
    const passwords = passwordService.getNewPasswords();
    setPasswordList(passwords);
    setPasswordListModalVisible(true);
  };

  //NOTE Xóa danh sách mật khẩu đã tạo
  const clearPasswordList = () => {
    try {
      passwordService.clearNewPasswords();
      setPasswordList([]);
      message.success('Đã xóa danh sách mật khẩu');
    } catch (error) {
      message.error('Lỗi khi xóa danh sách mật khẩu: ' + error.message);
    }
  };

  const generateRandomPassword = () => {
    const password = passwordService.generateRandomPassword(12);
    setNewPassword(password);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return 'red';
      case USER_ROLES.MANAGER:
        return 'blue';
      case USER_ROLES.USER:
        return 'green';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return 'Quản trị viên';
      case USER_ROLES.MANAGER:
        return 'Quản lý';
      case USER_ROLES.USER:
        return 'Người dùng';
      default:
        return role;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('vi-VN');
  };

  // Filter users based on search text
  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchText.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchText.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchText.toLowerCase())
  );

  // Calculate statistics
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.isActive).length;
  const adminUsers = users.filter(user => user.role === USER_ROLES.ADMIN).length;
  const managerUsers = users.filter(user => user.role === USER_ROLES.MANAGER).length;

  const columns = [
    {
      title: 'Người dùng',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar
            src={record.photoURL}
            icon={<UserOutlined />}
            style={{ backgroundColor: record.photoURL ? 'transparent' : '#1890ff' }}
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.displayName}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={getRoleColor(role)}>
          {getRoleLabel(role)}
        </Tag>
      ),
      filters: [
        { text: 'Quản trị viên', value: USER_ROLES.ADMIN },
        { text: 'Quản lý', value: USER_ROLES.MANAGER },
        { text: 'Người dùng', value: USER_ROLES.USER },
      ],
      onFilter: (value, record) => record.role === value,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Không hoạt động'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (timestamp) => formatDate(timestamp),
      sorter: (a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateA - dateB;
      },
    },
    {
      title: 'Đăng nhập cuối',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (timestamp) => formatDate(timestamp),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          {/* <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleEditUser(record)}
            />
          </Tooltip> */}
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditUser(record)}
            />
          </Tooltip>
          <Tooltip title="Reset mật khẩu (Gửi email)">
            <Button
              type="text"
              icon={<MailOutlined />}
              size="small"
              onClick={() => showResetPasswordModal(record)}
            />
          </Tooltip>
          {/* <Tooltip title="Tạo mật khẩu mới">
            <Button 
              type="text" 
              icon={<KeyOutlined />} 
              size="small"
              onClick={() => showNewPasswordModal(record)}
            />
          </Tooltip> */}
          <Tooltip title="Xóa">
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa người dùng này?"
              description="Hành động này không thể hoàn tác."
              onConfirm={() => handleDeleteUser(record.uid)}
              okText="Có"
              cancelText="Không"
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Quản lý người dùng</Title>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng người dùng"
              value={totalUsers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Người dùng hoạt động"
              value={activeUsers}
              valueStyle={{ color: '#3f8600' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Quản trị viên"
              value={adminUsers}
              valueStyle={{ color: '#cf1322' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Quản lý"
              value={managerUsers}
              valueStyle={{ color: '#1890ff' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Search and Actions */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Input.Search
              placeholder="Tìm kiếm người dùng..."
              allowClear
              style={{ width: 300 }}
              onSearch={setSearchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchUsers}
                loading={loading}
              >
                Làm mới
              </Button>
              {/* <Button 
                icon={<KeyOutlined />}
                onClick={showPasswordListModal}
              >
                Xem mật khẩu
              </Button> */}
              {/* <Button 
                icon={<PlusOutlined />}
                onClick={() => {
                  passwordService.createDemoPasswords();
                  message.success('Đã tạo dữ liệu demo!');
                  showPasswordListModal();
                }}
                size="small"
              >
                Demo
              </Button> */}
              {/* <Button 
                icon={<KeyOutlined />}
                onClick={() => {
                  const instructions = passwordService.getPasswordChangeInstructions();
                  Modal.info({
                    title: instructions.title,
                    content: (
                      <div>
                        {instructions.steps.map((step, index) => (
                          <p key={index} style={{ marginBottom: 8 }}>{step}</p>
                        ))}
                        <Alert
                          message="Lưu ý"
                          description={instructions.note}
                          type="warning"
                          showIcon
                          style={{ marginTop: 16 }}
                        />
                      </div>
                    ),
                    width: 600,
                    okText: 'Đã hiểu'
                  });
                }}
                size="small"
              >
                Hướng dẫn
              </Button> */}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setAddModalVisible(true)}
              >
                Thêm người dùng
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Users Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="uid"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} người dùng`,
          }}
        />
      </Card>

      {/* Edit User Modal */}
      {/* Add User Modal */}
      <Modal
        title="Thêm người dùng"
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
        width={600}
      >
        <AddUser
          onSuccess={() => {
            setAddModalVisible(false);
            fetchUsers();
          }}
          onCancel={() => setAddModalVisible(false)}
        />
      </Modal>

      {/* Edit User Modal */}
      <Modal
        title="Chỉnh sửa người dùng"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateUser}
        >
          <Form.Item
            name="email"
            label="Email"
          >
            <Input disabled />
          </Form.Item>

          <Form.Item
            name="displayName"
            label="Tên hiển thị"
            rules={[
              { required: true, message: 'Vui lòng nhập tên hiển thị!' }
            ]}
          >
            <Input placeholder="Nhập tên hiển thị" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Vai trò"
            rules={[
              { required: true, message: 'Vui lòng chọn vai trò!' }
            ]}
          >
            <Select placeholder="Chọn vai trò">
              <Option value={USER_ROLES.ADMIN}>Quản trị viên</Option>
              <Option value={USER_ROLES.MANAGER}>Quản lý</Option>
              <Option value={USER_ROLES.USER}>Người dùng</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Cập nhật
              </Button>
              <Button onClick={() => setEditModalVisible(false)}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        title="Reset mật khẩu"
        open={resetPasswordModalVisible}
        onCancel={() => setResetPasswordModalVisible(false)}
        footer={null}
        width={400}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <MailOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <Title level={4}>Gửi email reset mật khẩu</Title>
          <Text type="secondary">
            Hệ thống sẽ gửi email reset mật khẩu đến:
          </Text>
          <br />
          <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
            {selectedUser?.email}
          </Text>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Space>
            <Button
              type="primary"
              icon={<MailOutlined />}
              loading={resetPasswordLoading}
              onClick={() => handleResetPassword(selectedUser?.email)}
            >
              Gửi email reset
            </Button>
            <Button onClick={() => setResetPasswordModalVisible(false)}>
              Hủy
            </Button>
          </Space>
        </div>

        <div style={{ marginTop: 20, padding: 16, background: '#f6f8fa', borderRadius: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <strong>Lưu ý:</strong> Mật khẩu cũ sẽ bị vô hiệu hóa.
            Người dùng cần kiểm tra email và làm theo hướng dẫn để tạo mật khẩu mới.
          </Text>
        </div>
      </Modal>

      {/* Create New Password Modal */}
      <Modal
        title="Tạo mật khẩu mới"
        open={newPasswordModalVisible}
        onCancel={() => setNewPasswordModalVisible(false)}
        footer={null}
        width={500}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <KeyOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
          <Title level={4}>Tạo mật khẩu mới cho người dùng</Title>
          <Text type="secondary">
            Tạo mật khẩu mới cho:
          </Text>
          <br />
          <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
            {selectedUser?.email}
          </Text>
        </div>

        <Form layout="vertical">
          <Form.Item
            label="Mật khẩu mới"
            required
          >
            <Input.Group compact>
              <Input
                style={{ width: 'calc(100% - 120px)' }}
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                prefix={<KeyOutlined />}
                suffix={
                  <Button
                    type="text"
                    icon={showPassword ? <EyeInvisibleOutlined /> : <EyeTwoTone />}
                    onClick={() => setShowPassword(!showPassword)}
                  />
                }
              />
              <Button
                style={{ width: '120px' }}
                onClick={generateRandomPassword}
              >
                Tạo ngẫu nhiên
              </Button>
            </Input.Group>
          </Form.Item>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Space>
              <Button
                type="primary"
                icon={<KeyOutlined />}
                loading={newPasswordLoading}
                onClick={handleCreateNewPassword}
                disabled={!newPassword || newPassword.length < 6}
              >
                Tạo mật khẩu mới
              </Button>
              <Button onClick={() => setNewPasswordModalVisible(false)}>
                Hủy
              </Button>
            </Space>
          </div>

          <Alert
            message="⚠️ LƯU Ý QUAN TRỌNG"
            description="Mật khẩu mới sẽ được lưu để admin xem, NHƯNG KHÔNG được cập nhật trong Firebase. Người dùng vẫn cần sử dụng mật khẩu cũ để đăng nhập."
            type="warning"
            showIcon
            style={{ marginTop: 20 }}
          />

          <Alert
            message="💡 Giải pháp thay thế"
            description="Để thực sự thay đổi mật khẩu: 1) Sử dụng Firebase Console, 2) Gửi email reset password, 3) Hoặc sử dụng Firebase Admin SDK."
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Form>
      </Modal>

      {/* Password List Modal */}
      <Modal
        title="Danh sách mật khẩu đã tạo"
        open={passwordListModalVisible}
        onCancel={() => setPasswordListModalVisible(false)}
        footer={[
          <Button key="clear" danger onClick={clearPasswordList}>
            Xóa tất cả
          </Button>,
          <Button key="close" onClick={() => setPasswordListModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={800}
      >
        {passwordList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <KeyOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
            <Title level={4} type="secondary">Chưa có mật khẩu nào được tạo</Title>
            <Text type="secondary">
              Các mật khẩu mới sẽ xuất hiện ở đây sau khi admin tạo cho người dùng
            </Text>
          </div>
        ) : (
          <div>
            <Alert
              message="⚠️ CẢNH BÁO QUAN TRỌNG"
              description="Các mật khẩu này CHƯA được cập nhật trong Firebase! Người dùng vẫn cần sử dụng mật khẩu cũ để đăng nhập."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Alert
              message="Thông tin mật khẩu"
              description="Danh sách các mật khẩu mới đã được tạo cho người dùng. Đây chỉ là bản ghi để admin xem, không phải mật khẩu thực tế."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Table
              dataSource={passwordList}
              rowKey={(record, index) => `${record.email}-${index}`}
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Email',
                  dataIndex: 'email',
                  key: 'email',
                  render: (email) => <Text strong>{email}</Text>
                },
                {
                  title: 'Mật khẩu mới',
                  dataIndex: 'newPassword',
                  key: 'newPassword',
                  render: (password) => (
                    <Input.Password
                      value={password}
                      readOnly
                      style={{ fontFamily: 'monospace' }}
                    />
                  )
                },
                {
                  title: 'Thời gian tạo',
                  dataIndex: 'timestamp',
                  key: 'timestamp',
                  render: (timestamp) => <Text type="secondary">{timestamp}</Text>
                },
                {
                  title: 'UID',
                  dataIndex: 'uid',
                  key: 'uid',
                  render: (uid) => <Text code style={{ fontSize: '11px' }}>{uid}</Text>
                }
              ]}
            />

            <div style={{ marginTop: 16, padding: 16, background: '#f6f8fa', borderRadius: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <strong>Lưu ý:</strong> Mật khẩu được lưu trong localStorage của trình duyệt.
                Khi xóa dữ liệu trình duyệt hoặc đóng tab, thông tin này sẽ bị mất.
                <br />
                <strong>⚠️ QUAN TRỌNG:</strong> Đây chỉ là bản ghi để admin xem, không phải mật khẩu thực tế trong Firebase.
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default User;
