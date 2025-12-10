import React, { useState, useEffect } from 'react';
import {
    Form,
    Input,
    Select,
    Button,
    Row,
    Col,
    Switch,
    message
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import machinesDataService from '../../service/machine.service';
import machineTypesDataService from '../../service/machineType.service';
import alertService from '../../service/alert.service';

const { Option } = Select;

const AddMachine = ({ onSuccess, onCancel }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [existingCodes, setExistingCodes] = useState([]);
    const [existingNames, setExistingNames] = useState([]);
    const [machineTypes, setMachineTypes] = useState([]);

    const locations = [
        { value: 'area_a', label: 'Khu vực A' },
        { value: 'area_b', label: 'Khu vực B' },
        { value: 'area_c', label: 'Khu vực C' },
        { value: 'area_d', label: 'Khu vực D' },
        { value: 'area_e', label: 'Khu vực E' }
    ];

    // Load danh sách loại máy từ database
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

    // Load danh sách mã máy và tên máy hiện có để validation
    useEffect(() => {
        const loadExistingData = async () => {
            try {
                const querySnapshot = await machinesDataService.getAllMachines();
                const codes = [];
                const names = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.machineCode) {
                        codes.push(data.machineCode);
                    }
                    if (data.machineName) {
                        names.push(data.machineName);
                    }
                });
                setExistingCodes(codes);
                setExistingNames(names);
            } catch (error) {
                console.error('Error loading existing data:', error);
            }
        };
        loadExistingData();
        loadMachineTypes();
    }, []);

    // Validation cho mã máy
    const validateMachineCode = (_, value) => {
        // if (!value) {
        //     return Promise.reject(new Error('Vui lòng nhập mã máy!'));
        // }
        if (existingCodes.includes(value)) {
            message.error(`Mã máy "${value}" đã tồn tại!`);
            return Promise.reject(new Error('Mã máy đã tồn tại!'));
        }
        return Promise.resolve();
    };

    // Validation cho tên máy
    const validateMachineName = (_, value) => {
        // if (!value) {
        //     return Promise.reject(new Error('Vui lòng nhập tên máy!'));
        // }
        if (existingNames.includes(value)) {
            message.error(`Tên máy "${value}" đã tồn tại!`);
            return Promise.reject(new Error('Tên máy đã tồn tại!'));
        }
        return Promise.resolve();
    };

    const onFinish = async (values) => {
        console.log('Form submitted with values:', values);
        setLoading(true);
        try {
            // Chuẩn bị dữ liệu máy
            const machineData = {
                machineName: values.machineName,
                machineCode: values.machineCode,
                machineType: values.machineType,
                location: values.location,
                status: values.status ? 'active' : 'inactive',
                efficiency: 85,
                temperature: 25,
                lastCheck: new Date().toLocaleString('vi-VN')
            };

            console.log('Attempting to add machine:', machineData);

            try {
                // Thử thêm máy vào Firebase
                console.log('Calling machinesDataService.addMachine with:', machineData);
                const docRef = await machinesDataService.addMachine(machineData);
                console.log('Machine added successfully with ID:', docRef.id);
                console.log('Document reference:', docRef);

                // Hiển thị thông báo thành công
                // message.success(`Máy "${machineData.machineName}" đã được thêm thành công!`);

                // Delay reset form để thông báo có thời gian hiển thị
                setTimeout(() => {
                    form.resetFields();
                }, 1000);

                // Gửi cảnh báo Telegram
                alertService.sendMachineAlert('create', { ...machineData, id: docRef.id });

                if (onSuccess) {
                    onSuccess({ ...machineData, id: docRef.id });
                }
            } catch (firebaseError) {
                console.error('Firebase error:', firebaseError);

                // Fallback: Lưu vào localStorage nếu Firebase lỗi
                const fallbackData = {
                    ...machineData,
                    id: `local_${Date.now()}`,
                    isLocal: true
                };

                // Lưu vào localStorage
                const existingMachines = JSON.parse(localStorage.getItem('machines') || '[]');
                existingMachines.push(fallbackData);
                localStorage.setItem('machines', JSON.stringify(existingMachines));

                // Hiển thị thông báo cảnh báo
                message.warning('Máy đã được lưu tạm thời (Firebase không khả dụng). Dữ liệu sẽ được đồng bộ khi kết nối được khôi phục.');

                // Delay reset form để thông báo có thời gian hiển thị
                setTimeout(() => {
                    form.resetFields();
                }, 1000);

                if (onSuccess) {
                    onSuccess(fallbackData);
                }
            }
        } catch (error) {
            console.error('Error adding machine:', error);

            // Xử lý các loại lỗi khác nhau
            let errorMessage = 'Có lỗi xảy ra khi thêm máy!';

            if (error.code === 'permission-denied') {
                errorMessage = 'Không có quyền truy cập Firestore. Vui lòng kiểm tra cấu hình quyền.';
            } else if (error.code === 'unavailable') {
                errorMessage = 'Firestore hiện không khả dụng. Vui lòng thử lại sau.';
            } else if (error.code === 'invalid-argument') {
                errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
            } else if (error.message) {
                errorMessage = `Lỗi: ${error.message}`;
            }

            // Hiển thị thông báo lỗi
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const onReset = () => {
        form.resetFields();
    };

    return (
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                onFinishFailed={(errorInfo) => {
                    console.log('Form validation failed:', errorInfo);
                }}
                initialValues={{
                    status: true
                }}
            >
                <Row gutter={[16, 16]}>
                    <Col span={12}>
                        <Form.Item
                            name="machineName"
                            label="Tên Máy"
                            rules={[
                                { required: true, message: 'Vui lòng nhập tên máy!' },
                                { validator: validateMachineName }
                            ]}
                        >
                            <Input placeholder="VD: Máy ép nhựa #1" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="machineCode"
                            label="Mã Máy"
                            rules={[
                                { required: true, message: 'Vui lòng nhập mã máy!' },
                                { validator: validateMachineCode }
                            ]}
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
                            Lưu Máy
                        </Button>
                    </Col>
                    <Col>
                        <Button
                            onClick={onReset}
                            size="large"
                        >
                            Làm Mới
                        </Button>
                    </Col>
                </Row>
            </Form>
        </div>
    );
};

export default AddMachine;
