import React, { useState, useEffect } from "react";
import {
  Button,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Typography,
  message,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import machineTypesDataService from "../service/machineType.service";
import alertService from "../service/alert.service";

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

//NOTE Dữ liệu mẫu hiển thị khi chưa có dữ liệu từ Firebase/local
const initialData = [
  {
    key: "1",
    code: "CNC-01",
    name: "Máy CNC 3 trục",
    group: "Gia công cơ khí",
    manufacturer: "Mazak",
    desc: "Máy CNC 3 trục dùng cho gia công chi tiết cơ khí chính xác.",
    status: "Đang sử dụng",
    statusColor: "green",
  },
  {
    key: "2",
    code: "PRS-01",
    name: "Máy ép thủy lực 100T",
    group: "Ép tạo hình",
    manufacturer: "Yoshida",
    desc: "Máy ép thủy lực lực ép tối đa 100 tấn, dùng trong công đoạn tạo hình.",
    status: "Đang sử dụng",
    statusColor: "blue",
  },
  {
    key: "3",
    code: "INS-01",
    name: "Máy đo tọa độ CMM",
    group: "Thiết bị đo lường",
    manufacturer: "Mitutoyo",
    desc: "Thiết bị đo tọa độ dùng để kiểm tra độ chính xác kích thước.",
    status: "Bảo trì",
    statusColor: "orange",
  },
  {
    key: "4",
    code: "CONV-01",
    name: "Băng tải tự động",
    group: "Thiết bị phụ trợ",
    manufacturer: "Siemens",
    desc: "Băng tải vận chuyển vật liệu giữa các công đoạn.",
    status: "Ngừng sử dụng",
    statusColor: "red",
  },
];

//NOTE Map trạng thái -> màu thẻ Tag
const statusColorMap = {
  "Đang sử dụng": "green",
  "Bảo trì": "orange",
  "Ngừng sử dụng": "red",
};

export default function MachineTypePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [data, setData] = useState(initialData);
  const [editingType, setEditingType] = useState(null);

  //NOTE Load danh sách loại máy từ Firestore, fallback localStorage/initial
  const loadMachineTypes = async () => {
    try {
      const querySnapshot = await machineTypesDataService.getAllMachineTypes();
      const types = [];

      querySnapshot.forEach((doc) => {
        const docData = doc.data();

        const statusColor = statusColorMap[docData.status] || "blue";

        types.push({
          key: doc.id,
          code: docData.code || "",
          name: docData.name || "",
          group: docData.group || "",
          manufacturer: docData.manufacturer || "",
          desc: docData.description || "",
          status: docData.status || "Đang sử dụng",
          statusColor,
        });
      });

      setData(types);
    } catch (error) {
      console.error("Lỗi khi load loại máy từ Firebase:", error);

      // Fallback: load từ localStorage nếu Firebase lỗi
      try {
        const localTypes = JSON.parse(
          localStorage.getItem("machineTypes") || "[]"
        );
        if (localTypes.length > 0) {
          setData(localTypes);
        } else {
          // Nếu không có gì trong localStorage thì dùng dữ liệu mẫu ban đầu
          setData(initialData);
        }
      } catch (localError) {
        console.error("Lỗi khi load loại máy từ localStorage:", localError);
        setData(initialData);
      }
    }
  };

  useEffect(() => {
    loadMachineTypes();
  }, []);

  //NOTE Cấu hình cột bảng danh sách loại máy
  const columns = [
    {
      title: "Mã loại",
      dataIndex: "code",
      key: "code",
      width: 120,
      render: (text) => (
        <span style={{ fontWeight: 600, color: "#1677ff" }}>{text}</span>
      ),
    },
    {
      title: "Tên loại máy",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Nhóm máy",
      dataIndex: "group",
      key: "group",
    },
    {
      title: "Nhà sản xuất",
      dataIndex: "manufacturer",
      key: "manufacturer",
    },
    {
      title: "Mô tả",
      dataIndex: "desc",
      key: "desc",
      ellipsis: true,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (text, record) => (
        <Tag color={record.statusColor} style={{ margin: 0 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      align: "right",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Bạn có chắc muốn xóa loại máy này?"
            description={`Loại máy "${record.name}" (${record.code}) sẽ bị xóa khỏi hệ thống.`}
            okText="Xóa"
            cancelText="Hủy"
            okType="danger"
            onConfirm={() => handleDelete(record)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  //NOTE Mở modal thêm mới
  const handleOpenModal = () => {
    setEditingType(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  //NOTE Đóng modal và reset form
  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setEditingType(null);
  };

  //NOTE Xóa loại máy (ưu tiên Firebase, fallback local)
  const handleDelete = async (record) => {
    // Nếu là bản ghi local (fallback), chỉ cần xóa trong localStorage + state
    if (record.isLocal) {
      try {
        const existingTypes = JSON.parse(
          localStorage.getItem("machineTypes") || "[]"
        );
        const updated = existingTypes.filter((t) => t.key !== record.key);
        localStorage.setItem("machineTypes", JSON.stringify(updated));
      } catch (error) {
        console.error("Lỗi khi xóa loại máy trong localStorage:", error);
      }

      setData((prev) => prev.filter((item) => item.key !== record.key));
      message.warning(`Loại máy "${record.name}" đã được xóa (local).`);
      return;
    }

    try {
      await machineTypesDataService.deleteMachineType(record.key);

      setData((prev) => prev.filter((item) => item.key !== record.key));
      message.success(`Loại máy "${record.name}" đã được xóa!`);
      
      // alertService.sendMachineTypeAlert('delete', record); // tạm ẩn thông báo
    } catch (error) {
      console.error("Lỗi khi xóa loại máy:", error);
      message.error("Có lỗi xảy ra khi xóa loại máy!");
    }
  };

  //NOTE Mở modal chỉnh sửa với dữ liệu đã có
  const handleEdit = (record) => {
    setEditingType(record);
    setIsModalOpen(true);
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      group: record.group,
      manufacturer: record.manufacturer,
      description: record.desc,
      status: record.status,
    });
  };

  //NOTE Submit form thêm/sửa loại máy
  const handleFinish = async (values) => {
    const isEditing = !!editingType;

    // Kiểm tra trùng mã loại máy (bỏ qua bản ghi đang chỉnh sửa)
    if (
      data.some(
        (item) =>
          item.code === values.code &&
          (!isEditing || item.key !== editingType.key)
      )
    ) {
      message.error(`Mã loại máy "${values.code}" đã tồn tại!`);
      return;
    }

    const statusColor = statusColorMap[values.status] || "blue";

    // Chỉnh sửa loại máy
    if (isEditing) {
      try {
        await machineTypesDataService.updateMachineType(editingType.key, {
          code: values.code,
          name: values.name,
          group: values.group,
          manufacturer: values.manufacturer,
          description: values.description || "",
          status: values.status,
        });

        const updatedItem = {
          key: editingType.key,
          code: values.code,
          name: values.name,
          group: values.group,
          manufacturer: values.manufacturer,
          desc: values.description || "",
          status: values.status,
          statusColor,
        };

        setData((prev) =>
          prev.map((item) =>
            item.key === editingType.key ? updatedItem : item
          )
        );

        message.success(`Loại máy "${values.name}" đã được cập nhật!`);
        
        // alertService.sendMachineTypeAlert('update', updatedItem); // tạm ẩn thông báo
        
        handleCancel();
      } catch (error) {
        console.error("Lỗi khi cập nhật loại máy:", error);
        message.error("Có lỗi xảy ra khi cập nhật loại máy!");
      }
      return;
    }

    // Thêm mới loại máy
    try {
      const docRef = await machineTypesDataService.addMachineType({
        code: values.code,
        name: values.name,
        group: values.group,
        manufacturer: values.manufacturer,
        description: values.description || "",
        status: values.status,
      });

      const newItem = {
        key: docRef.id,
        code: values.code,
        name: values.name,
        group: values.group,
        manufacturer: values.manufacturer,
        desc: values.description || "",
        status: values.status,
        statusColor,
      };

      setData((prev) => [...prev, newItem]);

      message.success(`Loại máy "${values.name}" đã được thêm thành công!`);
      
      // alertService.sendMachineTypeAlert('create', newItem); // tạm ẩn thông báo
      
      handleCancel();
    } catch (error) {
      console.error("Lỗi khi lưu loại máy:", error);

      const fallbackData = {
        key: `local_${Date.now()}`,
        code: values.code,
        name: values.name,
        group: values.group,
        manufacturer: values.manufacturer,
        desc: values.description || "",
        status: values.status,
        statusColor,
        isLocal: true,
      };

      const existingTypes = JSON.parse(
        localStorage.getItem("machineTypes") || "[]"
      );
      existingTypes.push(fallbackData);
      localStorage.setItem("machineTypes", JSON.stringify(existingTypes));

      setData((prev) => [...prev, fallbackData]);

      message.warning(
        'Loại máy đã được lưu tạm thời (Firebase không khả dụng). Dữ liệu sẽ cần đồng bộ lại khi kết nối được khôi phục.'
      );

      handleCancel();
    }
  };

  //NOTE Giao diện trang danh sách + modal quản lý loại máy
  return (
    <div style={{ padding: 24, background: "#f5f5f5", minHeight: "100vh", width: "100%" }}>
      <div style={{ width: "100%", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Title level={3} style={{ margin: 0 }}>
            Loại máy
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenModal}
          >
            Thêm Loại máy
          </Button>
        </div>

        {/* Table */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 16,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            width: "100%",
            minHeight: "calc(100vh - 200px)",
          }}
        >
          <Table
            columns={columns}
            dataSource={data}
            pagination={{ pageSize: 8 }}
            rowKey="key"
          />
        </div>

        {/* Modal thêm / sửa loại máy */}
        <Modal
          title={editingType ? "Chỉnh sửa Loại máy" : "Thêm Loại máy mới"}
          open={isModalOpen}
          onCancel={handleCancel}
          okText={editingType ? "Cập nhật Loại máy" : "Lưu Loại máy"}
          cancelText="Hủy"
          onOk={() => form.submit()}
          destroyOnClose
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
          >
            <Form.Item
              name="code"
              label="Mã loại máy"
              rules={[{ required: true, message: "Vui lòng nhập mã loại máy" }]}
            >
              <Input placeholder="VD: CNC-01" />
            </Form.Item>

            <Form.Item
              name="name"
              label="Tên loại máy"
              rules={[{ required: true, message: "Vui lòng nhập tên loại máy" }]}
            >
              <Input placeholder="VD: Máy CNC 3 trục" />
            </Form.Item>

            <Form.Item
              name="group"
              label="Nhóm máy"
              rules={[{ required: true, message: "Vui lòng chọn nhóm máy" }]}
            >
              <Select placeholder="Chọn nhóm máy">
                <Option value="Gia công cơ khí">Gia công cơ khí</Option>
                <Option value="Ép tạo hình">Ép tạo hình</Option>
                <Option value="Thiết bị đo lường">Thiết bị đo lường</Option>
                <Option value="Thiết bị phụ trợ">Thiết bị phụ trợ</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="manufacturer"
              label="Nhà sản xuất"
              rules={[{ required: true, message: "Vui lòng nhập nhà sản xuất" }]}
            >
              <Input placeholder="VD: Mazak, Siemens, ..." />
            </Form.Item>

            <Form.Item
              name="description"
              label="Mô tả"
            >
              <TextArea
                rows={3}
                placeholder="Mô tả thêm về đặc tính, công dụng của loại máy..."
              />
            </Form.Item>

            <Form.Item
              name="status"
              label="Trạng thái"
              rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
            >
              <Select placeholder="Chọn trạng thái">
                <Option value="Đang sử dụng">Đang sử dụng</Option>
                <Option value="Bảo trì">Bảo trì</Option>
                <Option value="Ngừng sử dụng">Ngừng sử dụng</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}

