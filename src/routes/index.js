import React from 'react';
import { BarChartOutlined, RobotOutlined, AlertOutlined, SettingOutlined, TeamOutlined, LoginOutlined } from '@ant-design/icons';

// Import pages
import ManufacturingDashboard from '../pages/Home';
import Machine from '../pages/Machine';
import Error404 from '../pages/Error404';
import Analytics from '../pages/Analytics';
import Alerts from '../pages/Alerts';
import User from '../pages/User';
import Login from '../pages/Login';

// Route configuration
export const routes = [
  {
    key: 'login',
    path: '/login',
    label: 'Đăng nhập',
    icon: <LoginOutlined />,
    component: Login,
    exact: true,
    public: true // Mark as public route (no authentication required)
  },
  {
    key: 'dashboard',
    path: '/dashboard',
    label: 'Bảng điều khiển',
    icon: <BarChartOutlined />,
    component: ManufacturingDashboard,
    exact: true
  },
  {
    key: 'machines',
    path: '/machines',
    label: 'Máy móc',
    icon: <RobotOutlined />,
    component: Machine,
    exact: true
  },
  {
    key: 'analytics',
    path: '/analytics',
    label: 'Phân tích dữ liệu',
    icon: <BarChartOutlined />,
    component: Analytics,
    exact: true
  },
  {
    key: 'alerts',
    path: '/alerts',
    label: 'Cảnh báo',
    icon: <AlertOutlined />,
    component: Alerts,
    exact: true
  },
  // {
  //   key: 'settings',
  //   path: '/settings',
  //   label: 'Settings',
  //   icon: <SettingOutlined />,
  //   component: () => <div>Settings Page (Coming Soon)</div>,
  //   exact: true
  // },
  {
    key: 'users',
    path: '/users',
    label: 'Người dùng',
    icon: <TeamOutlined />,
    component: User,
    exact: true
  },
];

// Navigation menu items (filtered to exclude hidden routes and public routes)
export const menuItems = routes.filter(route => !route.hidden && !route.public);

// Get route by path
export const getRouteByPath = (path) => {
  return routes.find(route => route.path === path);
};

// Get route by key
export const getRouteByKey = (key) => {
  return routes.find(route => route.key === key);
};

// Get current route key based on pathname
export const getCurrentRouteKey = (pathname) => {
  const currentRoute = getRouteByPath(pathname);
  return currentRoute ? currentRoute.key : 'dashboard';
}; 