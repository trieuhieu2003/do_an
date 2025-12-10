import React, { useState } from 'react';
import { Card, Button, Typography, Collapse, Space, Tag } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const DebugData = ({ data, title = "Debug Data" }) => {
    const [visible, setVisible] = useState(false);

    if (!data || data.length === 0) {
        return (
            <Card size="small" style={{ margin: '10px 0' }}>
                <Text type="secondary">Không có dữ liệu để debug</Text>
            </Card>
        );
    }

    return (
        <Card 
            size="small" 
            style={{ margin: '10px 0' }}
            title={
                <Space>
                    <Text strong>{title}</Text>
                    <Tag color="blue">{data.length} items</Tag>
                </Space>
            }
            extra={
                <Button 
                    type="text" 
                    icon={visible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    onClick={() => setVisible(!visible)}
                >
                    {visible ? 'Ẩn' : 'Hiện'}
                </Button>
            }
        >
            {visible && (
                <Collapse size="small">
                    {data.map((item, index) => (
                        <Panel 
                            header={`Item ${index + 1}: ${item.name || item.machineName || 'No name'}`} 
                            key={index}
                        >
                            <pre style={{ 
                                background: '#f5f5f5', 
                                padding: '10px', 
                                borderRadius: '4px',
                                fontSize: '12px',
                                overflow: 'auto',
                                maxHeight: '200px'
                            }}>
                                {JSON.stringify(item, null, 2)}
                            </pre>
                        </Panel>
                    ))}
                </Collapse>
            )}
        </Card>
    );
};

export default DebugData;
