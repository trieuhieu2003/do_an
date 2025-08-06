import React, { useState } from 'react';
import { Layout, Menu, Avatar, Badge, Input, Button, Typography, Space, Dropdown } from 'antd';
import {
  BellOutlined,
  SettingOutlined,
  BarChartOutlined,
  RobotOutlined,
  AlertOutlined,
  PlayCircleOutlined,
  AppstoreOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
  ProfileOutlined,
  KeyOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { menuItems, getCurrentRouteKey, getRouteByKey } from '../routes';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const DefaultLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle menu navigation
  const handleMenuClick = ({ key }) => {
    const selectedRoute = getRouteByKey(key);
    if (selectedRoute) {
      navigate(selectedRoute.path);
    }
  };

  // Handle logout
  const handleLogout = () => {
    // Add logout logic here
    console.log('User logged out');
    // You can add navigation to login page or clear user session
    // navigate('/login');
  };

  // User dropdown menu items
  const userMenuItems = [
    {
      key: 'profile',
      icon: <ProfileOutlined />,
      label: 'Hồ sơ cá nhân',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt tài khoản',
    },
    {
      key: 'password',
      icon: <KeyOutlined />,
      label: 'Đổi mật khẩu',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
    },
  ];

  // Handle user menu click
  const handleUserMenuClick = ({ key }) => {
    switch (key) {
      case 'profile':
        console.log('Navigate to profile');
        break;
      case 'settings':
        console.log('Navigate to settings');
        break;
      case 'password':
        console.log('Navigate to change password');
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={!sidebarOpen} onCollapse={() => setSidebarOpen(!sidebarOpen)}>
        <div style={{ display: 'flex', alignItems: 'center', padding: 16 }}>
          <AppstoreOutlined style={{ fontSize: 32, color: '#1890ff' }} />
          {!sidebarOpen && null}
          {sidebarOpen && (
            <div style={{ marginLeft: 12 }}>
              <Title level={4} style={{ color: 'white', margin: 0 }}>PlantVision</Title>
              <Text style={{ color: '#bfbfbf' }}>Manufacturing Dashboard</Text>
            </div>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getCurrentRouteKey(location.pathname)]}
          onClick={handleMenuClick}
        >
          {menuItems.map(route => (
            <Menu.Item
              key={route.key}
              icon={route.icon}
            >
              {route.label}
            </Menu.Item>
          ))}
        </Menu>
        {sidebarOpen && (
          <div style={{ padding: 16, borderTop: '1px solid #303030', marginTop: 'auto' }}>
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick,
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div style={{ cursor: 'pointer' }}>
                <Space>
                  <Avatar src="https://randomuser.me/api/portraits/men/32.jpg" />
                  <div>
                    <Text style={{ color: 'white' }}>John Doe</Text>
                    <br />
                    <Text style={{ color: '#bfbfbf', fontSize: 12 }}>Admin</Text>
                  </div>
                </Space>
              </div>
            </Dropdown>
          </div>
        )}
        {!sidebarOpen && (
          <div style={{ padding: 16, borderTop: '1px solid #303030', marginTop: 'auto', textAlign: 'center' }}>
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick,
              }}
              placement="right"
              trigger={['click']}
            >
              <Avatar 
                src="https://randomuser.me/api/portraits/men/32.jpg" 
                style={{ cursor: 'pointer' }}
              />
            </Dropdown>
          </div>
        )}
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0 }}>Manufacturing Dashboard</Title>
          <Space>
            {/* <Input.Search placeholder="Search..." style={{ width: 200 }} /> */}
            <Badge count={5}>
              <Button shape="circle" icon={<BellOutlined />} />
            </Badge>
            <Text>Shift: A</Text>
            <Badge status="success" />
          </Space>
        </Header>
        <Content style={{ margin: 24, overflow: 'auto' }}>
          {children ? children : <Outlet />}
        </Content>
      </Layout>
    </Layout>
  );
};

export default DefaultLayout; 