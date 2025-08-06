import React, { useState } from 'react';
import {
    Form,
    Input,
    Select,
    Button,
    Row,
    Col,
    Typography,
    Divider,
    InputNumber,
    Switch,
    Upload,
    message,
    DatePicker
} from 'antd';
import {
    SaveOutlined,
    UploadOutlined,
    SettingOutlined,
    EnvironmentOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const AddMachine = ({ onSuccess, onCancel }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [machineType, setMachineType] = useState('');

    const machineTypes = [
        { value: 'injection_molding', label: 'Máy ép nhựa' },
        { value: 'conveyor', label: 'Băng tải' },
        { value: 'packaging', label: 'Máy đóng gói' },
        { value: 'mixing', label: 'Máy trộn' },
        { value: 'cooling', label: 'Hệ thống làm lạnh' },
        { value: 'cutting', label: 'Máy cắt' },
        { value: 'welding', label: 'Máy hàn' },
        { value: 'other', label: 'Khác' }
    ];

    const locations = [
        { value: 'area_a', label: 'Khu vực A' },
        { value: 'area_b', label: 'Khu vực B' },
        { value: 'area_c', label: 'Khu vực C' },
        { value: 'area_d', label: 'Khu vực D' },
        { value: 'area_e', label: 'Khu vực E' }
    ];

    const manufacturers = [
        { value: 'bosch', label: 'Bosch' },
        { value: 'siemens', label: 'Siemens' },
        { value: 'abb', label: 'ABB' },
        { value: 'schneider', label: 'Schneider Electric' },
        { value: 'omron', label: 'Omron' },
        { value: 'mitsubishi', label: 'Mitsubishi' },
        { value: 'other', label: 'Khác' }
    ];

    const onFinish = async (values) => {
        setLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            console.log('Machine data:', values);
            message.success('Máy đã được thêm thành công!');
            form.resetFields();
            if (onSuccess) {
                onSuccess(values);
            }
        } catch (error) {
            message.error('Có lỗi xảy ra khi thêm máy!');
        } finally {
            setLoading(false);
        }
    };

    const onReset = () => {
        form.resetFields();
    };

    const uploadProps = {
        name: 'file',
        action: 'https://run.mocky.io/v3/435e224c-44fb-4773-9faf-380c5e6a2188',
        headers: {
            authorization: 'authorization-text',
        },
        onChange(info) {
            if (info.file.status !== 'uploading') {
                console.log(info.file, info.fileList);
            }
            if (info.file.status === 'done') {
                message.success(`${info.file.name} file uploaded successfully`);
            } else if (info.file.status === 'error') {
                message.error(`${info.file.name} file upload failed.`);
            }
        },
    };

    return (
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{
                    status: true,
                    autoMode: false,
                    notifications: true
                }}
            >
                {/* Basic Information */}
                <Title level={5}>
                    <InfoCircleOutlined style={{ marginRight: '8px' }} />
                    Thông Tin Cơ Bản
                </Title>

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
                                onChange={setMachineType}
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
                            name="manufacturer"
                            label="Nhà Sản Xuất"
                            rules={[{ required: true, message: 'Vui lòng chọn nhà sản xuất!' }]}
                        >
                            <Select
                                placeholder="Chọn nhà sản xuất"
                                showSearch
                                filterOption={(input, option) =>
                                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                }
                            >
                                {manufacturers.map(manufacturer => (
                                    <Option key={manufacturer.value} value={manufacturer.value}>
                                        {manufacturer.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={[16, 16]}>
                    <Col span={12}>
                        <Form.Item
                            name="model"
                            label="Model"
                            rules={[{ required: true, message: 'Vui lòng nhập model!' }]}
                        >
                            <Input placeholder="VD: XJ-2000" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="serialNumber"
                            label="Số Serial"
                            rules={[{ required: true, message: 'Vui lòng nhập số serial!' }]}
                        >
                            <Input placeholder="VD: SN2024001" />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider />

                {/* Location Information */}
                <Title level={5}>
                    <EnvironmentOutlined style={{ marginRight: '8px' }} />
                    Thông Tin Vị Trí
                </Title>

                <Row gutter={[16, 16]}>
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
                    <Col span={12}>
                        <Form.Item
                            name="floor"
                            label="Tầng"
                        >
                            <InputNumber
                                min={1}
                                max={10}
                                placeholder="VD: 1"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={[16, 16]}>
                    <Col span={12}>
                        <Form.Item
                            name="coordinates"
                            label="Tọa Độ"
                        >
                            <Input placeholder="VD: X: 100, Y: 200" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="installationDate"
                            label="Ngày Lắp Đặt"
                        >
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider />

                {/* Technical Specifications */}
                <Title level={5}>
                    <SettingOutlined style={{ marginRight: '8px' }} />
                    Thông Số Kỹ Thuật
                </Title>

                <Row gutter={[16, 16]}>
                    <Col span={8}>
                        <Form.Item
                            name="power"
                            label="Công Suất (kW)"
                        >
                            <InputNumber
                                min={0}
                                placeholder="VD: 50"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="voltage"
                            label="Điện Áp (V)"
                        >
                            <InputNumber
                                min={0}
                                placeholder="VD: 380"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="current"
                            label="Dòng Điện (A)"
                        >
                            <InputNumber
                                min={0}
                                placeholder="VD: 100"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={[16, 16]}>
                    <Col span={8}>
                        <Form.Item
                            name="maxTemperature"
                            label="Nhiệt Độ Tối Đa (°C)"
                        >
                            <InputNumber
                                min={0}
                                placeholder="VD: 200"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="maxPressure"
                            label="Áp Suất Tối Đa (bar)"
                        >
                            <InputNumber
                                min={0}
                                placeholder="VD: 10"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="maxSpeed"
                            label="Tốc Độ Tối Đa (rpm)"
                        >
                            <InputNumber
                                min={0}
                                placeholder="VD: 3000"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider />

                {/* Settings */}
                <Title level={5}>
                    <SettingOutlined style={{ marginRight: '8px' }} />
                    Cài Đặt
                </Title>

                <Row gutter={[16, 16]}>
                    <Col span={8}>
                        <Form.Item
                            name="status"
                            label="Trạng Thái Hoạt Động"
                            valuePropName="checked"
                        >
                            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="autoMode"
                            label="Chế Độ Tự Động"
                            valuePropName="checked"
                        >
                            <Switch checkedChildren="Tự động" unCheckedChildren="Thủ công" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="notifications"
                            label="Thông Báo"
                            valuePropName="checked"
                        >
                            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={[16, 16]}>
                    <Col span={12}>
                        <Form.Item
                            name="maintenanceInterval"
                            label="Chu Kỳ Bảo Trì (ngày)"
                        >
                            <InputNumber
                                min={1}
                                placeholder="VD: 30"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="nextMaintenance"
                            label="Lần Bảo Trì Tiếp Theo"
                        >
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider />

                {/* Additional Information */}
                <Title level={5}>
                    <InfoCircleOutlined style={{ marginRight: '8px' }} />
                    Thông Tin Bổ Sung
                </Title>

                <Form.Item
                    name="description"
                    label="Mô Tả"
                >
                    <TextArea
                        rows={3}
                        placeholder="Mô tả chi tiết về máy, đặc điểm, ghi chú..."
                    />
                </Form.Item>

                <Form.Item
                    name="specifications"
                    label="Thông Số Chi Tiết"
                >
                    <TextArea
                        rows={2}
                        placeholder="Các thông số kỹ thuật chi tiết khác..."
                    />
                </Form.Item>

                <Form.Item
                    name="attachments"
                    label="Tài Liệu Đính Kèm"
                >
                    <Upload {...uploadProps}>
                        <Button icon={<UploadOutlined />}>Tải lên tài liệu</Button>
                    </Upload>
                </Form.Item>

                <Divider />

                {/* Action Buttons */}
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
