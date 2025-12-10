import React, { useState } from 'react';
import { Button, Card, message, Typography } from 'antd';
import { db } from '../firebase-config';
import { collection, addDoc, getDocs } from 'firebase/firestore';

const { Title, Text } = Typography;

const FirebaseTest = () => {
    const [loading, setLoading] = useState(false);

    const testConnection = async () => {
        setLoading(true);
        try {
            // Test đọc dữ liệu
            const testCollection = collection(db, 'test');
            const querySnapshot = await getDocs(testCollection);
            console.log('Firebase connection test - Read successful');
            
            // Test ghi dữ liệu
            const testData = {
                message: 'Test connection',
                timestamp: new Date(),
                test: true
            };
            
            const docRef = await addDoc(testCollection, testData);
            console.log('Firebase connection test - Write successful, ID:', docRef.id);
            
            message.success('Kết nối Firebase thành công!');
        } catch (error) {
            console.error('Firebase connection test failed:', error);
            message.error(`Lỗi kết nối Firebase: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card title="Kiểm tra kết nối Firebase" style={{ margin: '20px' }}>
            <Text>Nhấn nút bên dưới để kiểm tra kết nối Firebase:</Text>
            <br /><br />
            <Button 
                type="primary" 
                onClick={testConnection} 
                loading={loading}
            >
                Test Firebase Connection
            </Button>
        </Card>
    );
};

export default FirebaseTest;
