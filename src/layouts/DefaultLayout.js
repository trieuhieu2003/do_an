import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Typography, Space, Dropdown, message } from 'antd';
import {
  AppstoreOutlined,
  KeyOutlined,
  LogoutOutlined,
  ProfileOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { menuItems, getCurrentRouteKey, getRouteByKey } from '../routes';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import userService from '../service/user.service';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

//NOTE Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB1XAaS8jVlLTvTVzzFyasSA5Zjy3nkJL8",
  authDomain: "do-an-8c3e4.firebaseapp.com",
  projectId: "do-an-8c3e4",
  storageBucket: "do-an-8c3e4.firebasestorage.app",
  messagingSenderId: "362967619052",
  appId: "1:362967619052:web:e3a329cc39fb08bc035cc9",
  measurementId: "G-8HFSLW069S"
};

//NOTE Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const DefaultLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  //NOTE Kiểm tra trạng thái đăng nhập và tải thông tin người dùng
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);

        // Lấy thông tin user từ Firestore
        try {
          const userResult = await userService.getUserByUid(user.uid);
          if (userResult.success) {
            setUserData(userResult.user);
          } else {
            // Nếu user chưa có trong Firestore, tạo mới
            const newUserResult = await userService.createUser({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL
            });
            if (newUserResult.success) {
              setUserData(newUserResult.user);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }

        setLoading(false);
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
        // Redirect to login if not authenticated
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  //NOTE Xử lý chuyển trang khi chọn menu bên trái
  const handleMenuClick = ({ key }) => {
    const selectedRoute = getRouteByKey(key);
    if (selectedRoute) {
      navigate(selectedRoute.path);
    }
  };

  //NOTE Đăng xuất tài khoản
  const handleLogout = async () => {
    try {
      await signOut(auth);
      message.success('Đăng xuất thành công!');
      navigate('/login');
    } catch (error) {
      message.error('Đăng xuất thất bại: ' + error.message);
    }
  };

  //NOTE Hiển thị trạng thái loading khi đang kiểm tra đăng nhập
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Đang kiểm tra đăng nhập...
      </div>
    );
  }

  //NOTE Chuyển hướng về đăng nhập nếu chưa xác thực
  if (!user) {
    return null;
  }

  //NOTE Các tùy chọn trên menu người dùng (avatar)
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

  //NOTE Xử lý hành động khi click vào menu người dùng
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
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div>
            <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
              {getRouteByKey(getCurrentRouteKey(location.pathname))?.label || 'Bảng điều khiển'}
            </Title>
          </div>
          <Space>
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick,
              }}
              placement="bottomRight"
              arrow
            >
              <Space style={{ cursor: 'pointer', padding: '8px 12px', borderRadius: '6px', }}>
                <Avatar
                  size="small"
                  src={userData?.photoURL}
                  style={{ backgroundColor: userData?.photoURL ? 'transparent' : '#1890ff' }}
                  icon={<ProfileOutlined />}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Text strong>{userData?.displayName || user.email}</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    ({userData?.role === 'admin' ? 'Quản trị viên' :
                      userData?.role === 'manager' ? 'Quản lý' : 'Người dùng'})
                  </Text>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{
          margin: '24px',
          // padding: '24px',
          background: '#fff',
          borderRadius: '8px',
          minHeight: 'calc(100vh - 112px)',
          overflow: 'auto'
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default DefaultLayout;
