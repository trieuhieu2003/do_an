import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Divider,
  message,
  Space,
  Checkbox,
  Row,
  Col
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  MailOutlined,
  // GoogleOutlined,
  // FacebookOutlined
} from '@ant-design/icons';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  FacebookAuthProvider
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { useNavigate } from 'react-router-dom';
import './index.css';
import userService from '../../service/user.service';

const { Title, Text } = Typography;

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB1XAaS8jVlLTvTVzzFyasSA5Zjy3nkJL8",
  authDomain: "do-an-8c3e4.firebaseapp.com",
  projectId: "do-an-8c3e4",
  storageBucket: "do-an-8c3e4.firebasestorage.app",
  messagingSenderId: "362967619052",
  appId: "1:362967619052:web:e3a329cc39fb08bc035cc9",
  measurementId: "G-8HFSLW069S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { email, password } = values;
      
      // Đăng nhập Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Kiểm tra xem user đã tồn tại trong Firestore chưa
      const existingUser = await userService.getUserByUid(user.uid);
      
      if (!existingUser.success) {
        // Tạo user mới trong Firestore nếu chưa tồn tại
        await userService.createUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        });
        message.success('Tài khoản mới đã được tạo!');
      } else {
        // Cập nhật last login
        await userService.updateLastLogin(user.uid);
      }
      
      // Lưu thông tin user vào localStorage
      localStorage.setItem('userUid', user.uid);
      localStorage.setItem('userEmail', user.email);
      
      message.success('Đăng nhập thành công!');
      navigate('/dashboard');
      
    } catch (error) {
      let errorMessage = 'Đăng nhập thất bại!';
      
      // Xử lý lỗi Firebase
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Tài khoản không tồn tại!';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Mật khẩu không đúng!';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email không hợp lệ!';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau!';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Tài khoản đã bị vô hiệu hóa!';
          break;
        default:
          errorMessage = 'Đăng nhập thất bại: ' + error.message;
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Commented out Google login temporarily
  // const handleGoogleLogin = async () => {
  //   setLoading(true);
  //   try {
  //     // Commented out Firebase Google authentication temporarily
  //     // const provider = new GoogleAuthProvider();
  //     // await signInWithPopup(auth, provider);

  //     // Simulate successful Google login for now
  //     setTimeout(() => {
  //       message.success('Đăng nhập Google thành công! (Demo mode)');
  //       navigate('/dashboard');
  //     }, 1000);

  //   } catch (error) {
  //     message.error('Đăng nhập Google thất bại: ' + error.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Commented out Facebook login temporarily
  // const handleFacebookLogin = async () => {
  //   setLoading(true);
  //   try {
  //     // Commented out Firebase Facebook authentication temporarily
  //     // const provider = new FacebookAuthProvider();
  //     // await signInWithPopup(auth, provider);

  //     // Simulate successful Facebook login for now
  //     setTimeout(() => {
  //       message.success('Đăng nhập Facebook thành công! (Demo mode)');
  //       navigate('/dashboard');
  //     }, 1000);

  //   } catch (error) {
  //     message.error('Đăng nhập Facebook thất bại: ' + error.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleForgotPassword = () => {
    message.info('Tính năng quên mật khẩu sẽ được cập nhật sớm!');
  };

  const handleRegister = () => {
    message.info('Tính năng đăng ký sẽ được cập nhật sớm!');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Col xs={24} sm={20} md={16} lg={12} xl={8}>
        <Card
          bordered={false}
          style={{
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '40px',
            maxWidth: '450px',
            width: '100%'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <Title level={2} style={{
              color: '#1a1a1a',
              marginBottom: '10px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Chào mừng trở lại!
            </Title>
            <Text type="secondary" style={{
              fontSize: '16px',
              color: '#666',
              lineHeight: '1.5'
            }}>
              Đăng nhập vào tài khoản của bạn để tiếp tục
            </Text>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            style={{ marginBottom: '30px' }}
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Nhập email của bạn"
                style={{
                  borderRadius: '12px',
                  border: '2px solid #e8e8e8',
                  padding: '12px 16px',
                  fontSize: '16px',
                  transition: 'all 0.3s ease'
                }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Nhập mật khẩu của bạn"
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                style={{
                  borderRadius: '12px',
                  border: '2px solid #e8e8e8',
                  padding: '12px 16px',
                  fontSize: '16px',
                  transition: 'all 0.3s ease'
                }}
              />
            </Form.Item>

            <Form.Item>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>Ghi nhớ đăng nhập</Checkbox>
                </Form.Item>
                <Button
                  type="link"
                  onClick={handleForgotPassword}
                  style={{
                    color: '#667eea',
                    fontWeight: '500',
                    padding: '0',
                    height: 'auto'
                  }}
                >
                  Quên mật khẩu?
                </Button>
              </div>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  height: '50px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>

          {/* Commented out social login temporarily */}
          {/* <Divider plain>Hoặc</Divider>

          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Button
              icon={<GoogleOutlined />}
              onClick={handleGoogleLogin}
              loading={loading}
              block
              style={{
                height: '50px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '500',
                border: '2px solid #e8e8e8',
                background: 'white',
                color: '#333',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              Đăng nhập với Google
            </Button>

            <Button
              icon={<FacebookOutlined />}
              onClick={handleFacebookLogin}
              loading={loading}
              block
              style={{
                height: '50px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '500',
                border: '2px solid #e8e8e8',
                background: 'white',
                color: '#333',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              Đăng nhập với Facebook
            </Button>
          </Space> */}

          <div style={{
            textAlign: 'center',
            marginTop: '30px',
            paddingTop: '20px',
            borderTop: '1px solid #f0f0f0'
          }}>
            <Text type="secondary">
              Chưa có tài khoản?{' '}
              <Button
                type="link"
                onClick={handleRegister}
                style={{
                  color: '#667eea',
                  fontWeight: '600',
                  padding: '0',
                  height: 'auto'
                }}
              >
                Đăng ký ngay
              </Button>
            </Text>
          </div>
        </Card>
      </Col>
    </div >
  );
};

export default Login;
