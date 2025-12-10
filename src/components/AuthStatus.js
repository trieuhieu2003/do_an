import React, { useState, useEffect } from 'react';
import { Card, Button, message, Typography, Space, Tag } from 'antd';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase-config';

const { Title, Text } = Typography;

const AuthStatus = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            console.log('Auth state changed:', user);
        });

        return () => unsubscribe();
    }, []);

    const signInAnonymouslyHandler = async () => {
        setLoading(true);
        try {
            const result = await signInAnonymously(auth);
            console.log('Signed in anonymously:', result.user);
            message.success('Đăng nhập ẩn danh thành công!');
        } catch (error) {
            console.error('Error signing in anonymously:', error);
            message.error(`Lỗi đăng nhập: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const signOutHandler = async () => {
        try {
            await signOut(auth);
            message.success('Đăng xuất thành công!');
        } catch (error) {
            console.error('Error signing out:', error);
            message.error(`Lỗi đăng xuất: ${error.message}`);
        }
    };

    return (
        <Card title="Trạng thái Authentication" style={{ margin: '20px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                    <Text strong>Trạng thái: </Text>
                    {user ? (
                        <Tag color="green">Đã đăng nhập</Tag>
                    ) : (
                        <Tag color="red">Chưa đăng nhập</Tag>
                    )}
                </div>
                
                {user && (
                    <div>
                        <Text strong>User ID: </Text>
                        <Text code>{user.uid}</Text>
                    </div>
                )}

                {user ? (
                    <Button onClick={signOutHandler}>
                        Đăng xuất
                    </Button>
                ) : (
                    <Button 
                        type="primary" 
                        onClick={signInAnonymouslyHandler}
                        loading={loading}
                    >
                        Đăng nhập ẩn danh (Test)
                    </Button>
                )}
            </Space>
        </Card>
    );
};

export default AuthStatus;
