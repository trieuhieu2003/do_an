import React from 'react';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { notification } from 'antd';

const MachineNotification = () => {
  const [api, contextHolder] = notification.useNotification();

  // Thông báo thành công khi thêm máy
  const showSuccessNotification = (machineName) => {
    api.success({
      message: 'Thêm máy thành công!',
      description: `Máy "${machineName}" đã được thêm vào hệ thống thành công.`,
      placement: 'topRight',
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      duration: 4.5,
    });
  };

  // Thông báo lỗi khi mã máy trùng
  const showDuplicateCodeNotification = (machineCode) => {
    api.error({
      message: 'Mã máy đã tồn tại!',
      description: `Mã máy "${machineCode}" đã được sử dụng. Vui lòng chọn mã máy khác.`,
      placement: 'topRight',
      icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      duration: 4,
    });
  };

  // Thông báo lỗi khi tên máy trùng
  const showDuplicateNameNotification = (machineName) => {
    api.error({
      message: 'Tên máy đã tồn tại!',
      description: `Tên máy "${machineName}" đã được sử dụng. Vui lòng chọn tên máy khác.`,
      placement: 'topRight',
      icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      duration: 4,
    });
  };

  // Thông báo lỗi chung
  const showErrorNotification = (errorMessage) => {
    api.error({
      message: 'Có lỗi xảy ra!',
      description: errorMessage,
      placement: 'topRight',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      duration: 4,
    });
  };

  // Thông báo cảnh báo
  const showWarningNotification = (warningMessage) => {
    api.warning({
      message: 'Cảnh báo!',
      description: warningMessage,
      placement: 'topRight',
      icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      duration: 5,
    });
  };

  // Thông báo thông tin
  const showInfoNotification = (infoMessage) => {
    api.info({
      message: 'Thông tin',
      description: infoMessage,
      placement: 'topRight',
      icon: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
      duration: 2,
    });
  };

  return {
    contextHolder,
    showSuccessNotification,
    showDuplicateCodeNotification,
    showDuplicateNameNotification,
    showErrorNotification,
    showWarningNotification,
    showInfoNotification,
  };
};

export default MachineNotification;
