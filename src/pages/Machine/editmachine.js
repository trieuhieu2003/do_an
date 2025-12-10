import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Button, Row, Col, Switch, message, Spin } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import machinesDataService from '../../service/machine.service';
import machineTypesDataService from '../../service/machineType.service';
import alertService from '../../service/alert.service';

const { Option } = Select;

//NOTE Form chỉnh sửa máy
const EditMachine = ({ machineId, onSuccess, onCancel }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [machineTypes, setMachineTypes] = useState([]);

    //NOTE Danh sách khu vực cố định
    const locations = [
        { value: 'area_a', label: 'Khu vực A' },
        { value: 'area_b', label: 'Khu vực B' },
        { value: 'area_c', label: 'Khu vực C' },
        { value: 'area_d', label: 'Khu vực D' },
        { value: 'area_e', label: 'Khu vực E' }
    ];

    //NOTE Load loại máy từ Firestore, fallback localStorage/mặc định
    const loadMachineTypes = async () => {
        try {
            const querySnapshot = await machineTypesDataService.getAllMachineTypes();
            const types = [];
            
            querySnapshot.forEach((doc) => {
                const docData = doc.data();
                types.push({
                    value: docData.code || doc.id,
                    label: docData.name || docData.code || 'Không tên'
                });
            });
            
            setMachineTypes(types);
        } catch (error) {
            console.error('Lỗi khi load loại máy từ Firebase:', error);
            
            // Fallback: load từ localStorage nếu Firebase lỗi
            try {
                const localTypes = JSON.parse(localStorage.getItem('machineTypes') || '[]');
                if (localTypes.length > 0) {
                    setMachineTypes(
                        localTypes.map((t) => ({
                            value: t.code || t.key,
                            label: t.name || t.code || 'Không tên'
                        }))
                    );
                } else {
                    // Fallback: dữ liệu mặc định nếu không có trong localStorage
                    setMachineTypes([
                        { value: 'injection_molding', label: 'Máy ép nhựa' },
                        { value: 'conveyor', label: 'Băng tải' },
                        { value: 'packaging', label: 'Máy đóng gói' },
                        { value: 'mixing', label: 'Máy trộn' },
                        { value: 'cooling', label: 'Hệ thống làm lạnh' },
                        { value: 'cutting', label: 'Máy cắt' },
                        { value: 'welding', label: 'Máy hàn' },
                        { value: 'other', label: 'Khác' }
                    ]);
                }
            } catch (localError) {
                console.error('Lỗi khi load loại máy từ localStorage:', localError);
                // Fallback: dữ liệu mặc định
                setMachineTypes([
                    { value: 'injection_molding', label: 'Máy ép nhựa' },
                    { value: 'conveyor', label: 'Băng tải' },
                    { value: 'packaging', label: 'Máy đóng gói' },
                    { value: 'mixing', label: 'Máy trộn' },
                    { value: 'cooling', label: 'Hệ thống làm lạnh' },
                    { value: 'cutting', label: 'Máy cắt' },
                    { value: 'welding', label: 'Máy hàn' },
                    { value: 'other', label: 'Khác' }
                ]);
            }
        }
    };

    //NOTE Khi mount hoặc đổi machineId: load dữ liệu máy + danh sách loại
    useEffect(() => {
        const fetchData = async () => {
            if (!machineId) return;
            setFetching(true);
            try {
                const docSnap = await machinesDataService.getMachineById(machineId);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    console.log('Machine data loaded:', data);
                    
                    form.setFieldsValue({
                        machineName: data.machineName || '',
                        machineCode: data.machineCode || '',
                        machineType: data.machineType || undefined,
                        location: data.location || undefined,
                        status: data.status === 'active', // Chuyển đổi đúng boolean
                    });
                    
                    console.log('Form values set:', {
                        machineName: data.machineName || '',
                        machineCode: data.machineCode || '',
                        machineType: data.machineType || undefined,
                        location: data.location || undefined,
                        status: data.status === 'active'
                    });
                } else {
                    message.error('Không tìm thấy máy.');
                }
            } catch (e) {
                message.error('Lỗi khi tải dữ liệu máy.');
            } finally {
                setFetching(false);
            }
        };
        fetchData();
        loadMachineTypes();
    }, [machineId, form]);

    //NOTE Submit form cập nhật máy (Firebase)
    const onFinish = async (values) => {
        if (!machineId) {
            message.error('Thiếu mã máy để cập nhật.');
            return;
        }
        setLoading(true);
        try {
            // Chuẩn bị dữ liệu cập nhật với format đúng
            const updateData = {
                machineName: values.machineName,
                machineCode: values.machineCode,
                machineType: values.machineType,
                location: values.location,
                status: values.status ? 'active' : 'inactive',
                updatedAt: new Date()
            };
            
            console.log('Updating machine with data:', updateData);
            
            await machinesDataService.updateMachine(machineId, updateData);
            
            // Gửi cảnh báo Telegram
            alertService.sendMachineAlert('update', { ...updateData, id: machineId });

            // Gọi onSuccess với dữ liệu đã xử lý
            if (onSuccess) {
                onSuccess(updateData);
            }
        } catch (error) {
            console.error('Error updating machine:', error);
            message.error('Có lỗi xảy ra khi cập nhật máy!');
        } finally {
            setLoading(false);
        }
    };

    //NOTE Reset form
    const onReset = () => {
        form.resetFields();
    };

    return (
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <Spin spinning={fetching}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{
                        status: true
                    }}
                >
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <Form.Item
                                name="machineName"
                                label="Tên Máy"
                                rules={[{ required: true, message: 'Vui lòng nhập tên máy!' }]}
                            >
                                <Input placeholder="VD: Máy ép nhựa #1" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="machineCode"
                                label="Mã Máy"
                                rules={[{ required: true, message: 'Vui lòng nhập mã máy!' }]}
                            >
                                <Input placeholder="VD: M001" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <Form.Item
                                name="machineType"
                                label="Loại Máy"
                                rules={[{ required: true, message: 'Vui lòng chọn loại máy!' }]}
                            >
                                <Select
                                    placeholder="Chọn loại máy"
                                    showSearch
                                    filterOption={(input, option) =>
                                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                    }
                                >
                                    {machineTypes.map(type => (
                                        <Option key={type.value} value={type.value}>
                                            {type.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="location"
                                label="Khu Vực"
                                rules={[{ required: true, message: 'Vui lòng chọn khu vực!' }]}
                            >
                                <Select placeholder="Chọn khu vực">
                                    {locations.map(location => (
                                        <Option key={location.value} value={location.value}>
                                            {location.label}
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
                                label="Trạng Thái Hoạt Động"
                                valuePropName="checked"
                            >
                                <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row justify="center" gutter={[16, 16]}>
                        <Col>
                            <Button
                                type="primary"
                                htmlType="submit"
                                icon={<SaveOutlined />}
                                size="large"
                                loading={loading}
                            >
                                Lưu Thay Đổi
                            </Button>
                        </Col>
                        <Col>
                            <Button onClick={onReset} size="large">Làm Mới</Button>
                        </Col>
                    </Row>
                </Form>
            </Spin>
        </div>
    );
};

export default EditMachine;


