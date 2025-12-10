import React, { useState } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Typography,
  message,
  Switch
} from 'antd';
import userService from '../../service/user.service';
import {
  SaveOutlined,
  UserOutlined,
  MailOutlined,
  TeamOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

const AddUser = ({ onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Role options
  const roles = [
    { value: 'admin', label: 'Quản trị viên', color: '#ff4d4f' },
    { value: 'manager', label: 'Quản lý', color: '#1890ff' },
    { value: 'user', label: 'Người dùng', color: '#52c41a' },
  ];

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const displayName = `${values.firstName?.trim() || ''} ${values.lastName?.trim() || ''}`.trim();
      const payload = {
        email: values.email,
        displayName,
        role: values.role,
        isActive: values.status !== undefined ? !!values.status : true
      };

      const result = await userService.createUserRecord(payload);

      if (result?.success) {
        message.success('Người dùng đã được thêm thành công!');
        form.resetFields();
        if (onSuccess) {
          onSuccess(result.user);
        }
      } else {
        message.error('Không thể thêm người dùng');
      }
    } catch (error) {
      message.error(`Có lỗi xảy ra khi thêm người dùng: ${error.message || ''}`);
    } finally {
      setLoading(false);
    }
  };

  const onReset = () => {
    form.resetFields();
  };

  return (
    <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{}}
      >
        {/* Basic Information */}
        {/* <Title level={5}>
          <UserOutlined style={{ marginRight: '8px' }} />
          Thông Tin Cơ Bản
        </Title> */}

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item
              name="firstName"
              label="Tên"
              rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
            >
              <Input placeholder="VD: Nguyễn Văn" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="lastName"
              label="Họ"
              rules={[{ required: true, message: 'Vui lòng nhập họ!' }]}
            >
              <Input placeholder="VD: An" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' }
              ]}
            >
              <Input placeholder="VD: user@company.com" prefix={<MailOutlined />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="role"
              label="Vai trò"
              rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
            >
              <Select placeholder="Chọn vai trò">
                {roles.map(role => (
                  <Option key={role.value} value={role.value}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: role.color,
                        marginRight: 8
                      }} />
                      {role.label}
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item
              name="status"
              label="Trạng thái"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch
                checkedChildren="Hoạt động"
                unCheckedChildren="Khóa"
                defaultChecked
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Action Buttons */}
        <Row justify="center" gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              size="large"
              loading={loading}
            >
              Thêm Người Dùng
            </Button>
          </Col>
          <Col>
            <Button
              onClick={onReset}
              size="large"
            >
              Làm Mới
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default AddUser;
