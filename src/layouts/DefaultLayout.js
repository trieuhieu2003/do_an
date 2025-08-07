import React, { useState } from 'react';
import { Layout, Menu, Avatar, Typography, Space, Dropdown } from 'antd';
import {
  AppstoreOutlined,
  KeyOutlined,
  LogoutOutlined,
  ProfileOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { menuItems, getCurrentRouteKey, getRouteByKey } from '../routes';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const DefaultLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = ({ key }) => {
    const selectedRoute = getRouteByKey(key);
    if (selectedRoute) {
      navigate(selectedRoute.path);
    }
  };

  const handleLogout = () => {
    console.log('Người dùng đã đăng xuất');
    // navigate('/login');
  };

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

  const handleUserMenuClick = ({ key }) => {
    switch (key) {
      case 'profile':
        console.log('Chuyển đến hồ sơ cá nhân');
        break;
      case 'settings':
        console.log('Chuyển đến cài đặt tài khoản');
        break;
      case 'password':
        console.log('Chuyển đến đổi mật khẩu');
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider collapsible collapsed={!sidebarOpen} onCollapse={() => setSidebarOpen(!sidebarOpen)}>
        <div style={{ display: 'flex', alignItems: 'center', padding: 16 }}>
          <AppstoreOutlined style={{ fontSize: 32, color: '#1890ff' }} />
          {sidebarOpen && (
            <div style={{ marginLeft: 12 }}>
              <Title level={4} style={{ color: 'white', margin: 0 }}>PlantVision</Title>
              <Text style={{ color: '#bfbfbf' }}>Bảng điều khiển sản xuất</Text>
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
            <Menu.Item key={route.key} icon={route.icon}>
              {route.label}
            </Menu.Item>
          ))}
        </Menu>

        <div style={{ padding: 16, borderTop: '1px solid #303030', marginTop: 'auto', textAlign: sidebarOpen ? 'start' : 'center' }}>
          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: handleUserMenuClick,
            }}
            placement={sidebarOpen ? 'bottomRight' : 'right'}
            trigger={['click']}
          >
            <div style={{ cursor: 'pointer' }}>
              <Space direction="horizontal">
                <Avatar src="https://randomuser.me/api/portraits/men/32.jpg" />
                {sidebarOpen && (
                  <div>
                    <Text style={{ color: 'white' }}>Nguyễn Văn A</Text>
                    <br />
                    <Text style={{ color: '#bfbfbf', fontSize: 12 }}>Quản trị viên</Text>
                  </div>
                )}
              </Space>
            </div>
          </Dropdown>
        </div>
      </Sider>

      <Layout>
        {/* Optional Header */}
        {/* <Header style={{ background: '#fff', padding: 0 }}>Header</Header> */}

        <Content
          style={{
            height: '100vh',
            overflow: 'auto',
            padding: 16,
            background: '#f0f2f5'
          }}
        >
          {children ? children : <Outlet />}
        </Content>
      </Layout>
    </Layout>
  );
};

export default DefaultLayout;
