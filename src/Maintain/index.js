import React, { useState, useEffect } from "react";
import {
  Button,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Radio,
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
import maintenancePlansDataService from "../service/maintenancePlan.service";
import machineTypesDataService from "../service/machineType.service";
import alertService from "../service/alert.service";

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

//NOTE Dữ liệu mẫu fallback khi chưa có kế hoạch
const initialData = [
  {
    // key: "1",
    // name: "Bảo trì Phòng ngừa",
    // type: "Máy CNC",
    // desc: "Kiểm tra định kỳ và thay thế phụ tùng trước khi hỏng",
    // freq: "Hàng tháng",
    // color: "blue",
  },
  // {
  //   key: "2",
  //   name: "Bảo trì Đột xuất",
  //   type: "Máy Ép Thủy lực",
  //   desc: "Xử lý sự cố đột xuất khi máy dừng hoạt động",
  //   freq: "Khi có sự cố",
  //   color: "red",
  // },
  // {
  //   key: "3",
  //   name: "Hiệu chuẩn thiết bị đo",
  //   type: "Thiết bị Đo lường",
  //   desc: "Đảm bảo độ chính xác của các thiết bị đo",
  //   freq: "Hàng quý",
  //   color: "gold",
  // },
  // {
  //   key: "4",
  //   name: "Kiểm tra Điện định kỳ",
  //   type: "Tất cả Máy móc",
  //   desc: "Kiểm tra dây điện, CB, tiếp địa và các kết nối",
  //   freq: "Hàng năm",
  //   color: "green",
  // },
];

//NOTE Danh sách tần suất bảo trì để chọn nhanh
const frequencies = [
  "Hàng ngày",
  "Hàng tuần",
  "Hàng tháng",
  "Hàng quý",
  "Hàng năm",
  "Tùy chỉnh",
];

export default function MaintenanceCategory() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [selectedFrequency, setSelectedFrequency] = useState("Hàng tháng");
  const [data, setData] = useState(initialData);
  const [editingPlan, setEditingPlan] = useState(null);
  const [machineTypes, setMachineTypes] = useState([]);

  //NOTE Load kế hoạch bảo trì từ Firestore, fallback localStorage/initial
  const loadMaintenancePlans = async () => {
    try {
      const querySnapshot =
        await maintenancePlansDataService.getAllMaintenancePlans();
      const plans = [];

      // Load machine types để map code thành name
      let machineTypesMap = new Map();
      try {
        const machineTypesSnapshot = await machineTypesDataService.getAllMachineTypes();
        machineTypesSnapshot.forEach((doc) => {
          const docData = doc.data();
          machineTypesMap.set(docData.code || doc.id, docData.name || docData.code || "");
        });
      } catch (typeError) {
        console.warn("Không thể load loại máy để map:", typeError);
      }

      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        // docData.type có thể là code hoặc name (từ dữ liệu cũ)
        const typeCode = docData.type || "";
        // Ưu tiên dùng typeName từ database, nếu không có thì map từ code
        const typeName = docData.typeName || machineTypesMap.get(typeCode) || typeCode;

        plans.push({
          key: doc.id,
          name: docData.name || "",
          type: typeCode, // Code
          typeName: typeName, // Name để hiển thị
          desc: docData.description || "",
          freq: docData.frequency || "Hàng tháng",
          color: docData.color || "blue",
        });
      });

      setData(plans);
    } catch (error) {
      console.error("Lỗi khi load kế hoạch bảo trì từ Firebase:", error);

      // Fallback: load từ localStorage nếu Firebase lỗi
      try {
        const localPlans = JSON.parse(
          localStorage.getItem("maintenancePlans") || "[]"
        );
        if (localPlans.length > 0) {
          setData(localPlans);
        } else {
          setData(initialData);
        }
      } catch (localError) {
        console.error(
          "Lỗi khi load kế hoạch bảo trì từ localStorage:",
          localError
        );
        setData(initialData);
      }
    }
  };

  //NOTE Load danh sách loại máy để hiển thị trong Select (map code -> name)
  const loadMachineTypes = async () => {
    try {
      const querySnapshot =
        await machineTypesDataService.getAllMachineTypes();
      const types = [];

      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        // Lưu code làm value, name làm label để hiển thị
        types.push({
          value: docData.code || doc.id, // Lưu code
          label: docData.name || docData.code || "Không tên", // Hiển thị name
          name: docData.name || docData.code || "Không tên", // Lưu name để map sau
        });
      });

      setMachineTypes(types);
    } catch (error) {
      console.error("Lỗi khi load loại máy từ Firebase:", error);

      // Fallback: load từ localStorage nếu Firebase lỗi
      try {
        const localTypes = JSON.parse(
          localStorage.getItem("machineTypes") || "[]"
        );
        if (localTypes.length > 0) {
          setMachineTypes(
            localTypes.map((t) => ({
              value: t.code || t.key, // Lưu code
              label: t.name || t.code || "Không tên", // Hiển thị name
              name: t.name || t.code || "Không tên",
            }))
          );
        }
      } catch (localError) {
        console.error("Lỗi khi load loại máy từ localStorage:", localError);
      }
    }
  };

  useEffect(() => {
    loadMaintenancePlans();
    loadMachineTypes();
  }, []);

  //NOTE Cấu hình cột bảng kế hoạch bảo trì
  const columns = [
    {
      title: "Tên Kế hoạch",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <span style={{ fontWeight: 600, color: "#1677ff" }}>{text}</span>
      ),
    },
    {
      title: "Loại Máy",
      dataIndex: "type",
      key: "type",
      render: (text, record) => {
        // Hiển thị name nếu có, nếu không thì hiển thị code
        return record.typeName || text || "Không xác định";
      },
    },
    {
      title: "Mô tả",
      dataIndex: "desc",
      key: "desc",
      ellipsis: true,
    },
    {
      title: "Tần suất",
      dataIndex: "freq",
      key: "freq",
      render: (text, record) => (
        <Tag color={record.color} style={{ margin: 0 }}>
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
            title="Bạn có chắc muốn xóa kế hoạch này?"
            description={`Kế hoạch "${record.name}" sẽ bị xóa khỏi hệ thống.`}
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

  //NOTE Mở modal tạo mới kế hoạch
  const handleOpenModal = () => {
    setEditingPlan(null);
    form.resetFields();
    setSelectedFrequency("Hàng tháng");
    setIsModalOpen(true);
  };

  //NOTE Đóng modal và reset form/tần suất
  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setSelectedFrequency("Hàng tháng");
  };

  //NOTE Mở modal chỉnh sửa kế hoạch hiện có
  const handleEdit = (record) => {
    setEditingPlan(record);
    setIsModalOpen(true);
    setSelectedFrequency(record.freq || "Hàng tháng");
    // record.type là code, set vào form
    form.setFieldsValue({
      name: record.name,
      type: record.type, // Code của loại máy
      description: record.desc,
    });
  };

  //NOTE Xóa kế hoạch (ưu tiên Firebase, fallback local)
  const handleDelete = async (record) => {
    // Nếu là bản ghi local (fallback), chỉ cần xóa trong localStorage + state
    if (record.isLocal) {
      try {
        const existingPlans = JSON.parse(
          localStorage.getItem("maintenancePlans") || "[]"
        );
        const updated = existingPlans.filter((p) => p.key !== record.key);
        localStorage.setItem("maintenancePlans", JSON.stringify(updated));
      } catch (error) {
        console.error(
          "Lỗi khi xóa kế hoạch bảo trì trong localStorage:",
          error
        );
      }

      setData((prev) => prev.filter((item) => item.key !== record.key));
      message.warning(`Kế hoạch "${record.name}" đã được xóa (local).`);
      return;
    }

    try {
      await maintenancePlansDataService.deleteMaintenancePlan(record.key);
      setData((prev) => prev.filter((item) => item.key !== record.key));
      message.success(`Kế hoạch "${record.name}" đã được xóa!`);
      
      // Gửi cảnh báo Telegram
      alertService.sendMaintenancePlanAlert('delete', record);
    } catch (error) {
      console.error("Lỗi khi xóa kế hoạch bảo trì:", error);
      message.error("Có lỗi xảy ra khi xóa kế hoạch bảo trì!");
    }
  };

  //NOTE Submit form thêm/sửa kế hoạch bảo trì
  const handleFinish = async (values) => {
    const isEditing = !!editingPlan;

    // Kiểm tra trùng tên kế hoạch (bỏ qua bản ghi đang chỉnh sửa)
    if (
      data.some(
        (item) =>
          item.name === values.name &&
          (!isEditing || item.key !== editingPlan.key)
      )
    ) {
      message.error(`Kế hoạch "${values.name}" đã tồn tại!`);
      return;
    }

    const colorMap = {
      "Hàng ngày": "green",
      "Hàng tuần": "blue",
      "Hàng tháng": "gold",
      "Hàng quý": "purple",
      "Hàng năm": "cyan",
      "Tùy chỉnh": "default",
    };

    const color = colorMap[selectedFrequency] || "blue";

    // Tìm tên loại máy từ code
    const selectedMachineType = machineTypes.find(t => t.value === values.type);
    const typeName = selectedMachineType?.name || selectedMachineType?.label || values.type;

    // Cập nhật kế hoạch
    if (isEditing) {
      try {
        await maintenancePlansDataService.updateMaintenancePlan(
          editingPlan.key,
          {
            name: values.name,
            type: values.type, // Code
            typeName: typeName, // Name để hiển thị
            description: values.description || "",
            frequency: selectedFrequency,
            color,
          }
        );

        const updatedItem = {
          key: editingPlan.key,
          name: values.name,
          type: values.type, // Code
          typeName: typeName, // Name
          desc: values.description || "",
          freq: selectedFrequency,
          color,
        };

        setData((prev) =>
          prev.map((item) =>
            item.key === editingPlan.key ? updatedItem : item
          )
        );

        message.success(`Kế hoạch "${values.name}" đã được cập nhật!`);
        
        // Gửi cảnh báo Telegram
        alertService.sendMaintenancePlanAlert('update', updatedItem);
        
        handleCancel();
      } catch (error) {
        console.error("Lỗi khi cập nhật kế hoạch bảo trì:", error);
        message.error("Có lỗi xảy ra khi cập nhật kế hoạch bảo trì!");
      }
      return;
    }

    // Thêm mới kế hoạch
    try {
      const docRef = await maintenancePlansDataService.addMaintenancePlan({
        name: values.name,
        type: values.type, // Code
        typeName: typeName, // Name để hiển thị
        description: values.description || "",
        frequency: selectedFrequency,
        color,
      });

      const newItem = {
        key: docRef.id,
        name: values.name,
        type: values.type, // Code
        typeName: typeName, // Name
        desc: values.description || "",
        freq: selectedFrequency,
        color,
      };

      setData((prev) => [...prev, newItem]);

      message.success(`Kế hoạch "${values.name}" đã được thêm thành công!`);
      
      // Gửi cảnh báo Telegram
      alertService.sendMaintenancePlanAlert('create', newItem);
      
      handleCancel();
    } catch (error) {
      console.error("Lỗi khi lưu kế hoạch bảo trì:", error);

      const fallbackData = {
        key: `local_${Date.now()}`,
        name: values.name,
        type: values.type, // Code
        typeName: typeName, // Name
        desc: values.description || "",
        freq: selectedFrequency,
        color,
        isLocal: true,
      };

      const existingPlans = JSON.parse(
        localStorage.getItem("maintenancePlans") || "[]"
      );
      existingPlans.push(fallbackData);
      localStorage.setItem("maintenancePlans", JSON.stringify(existingPlans));

      setData((prev) => [...prev, fallbackData]);

      message.warning(
        'Kế hoạch bảo trì đã được lưu tạm thời (Firebase không khả dụng). Dữ liệu sẽ cần đồng bộ lại khi kết nối được khôi phục.'
      );

      handleCancel();
    }
  };

  //NOTE Giao diện trang danh sách + modal quản lý kế hoạch bảo trì
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
            Kế hoạch Bảo trì
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenModal}
          >
            Thêm Kế hoạch
          </Button>
        </div>

        {/* Table */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 16,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <Table
            columns={columns}
            dataSource={data}
            pagination={{ pageSize: 8 }}
            rowKey="key"
          />
        </div>

        {/* Modal tạo / sửa kế hoạch */}
        <Modal
          title={editingPlan ? "Chỉnh sửa Kế hoạch Bảo trì" : "Thêm Kế hoạch Bảo trì"}
          open={isModalOpen}
          onCancel={handleCancel}
          okText={editingPlan ? "Cập nhật" : "Lưu Kế hoạch"}
          cancelText="Hủy"
          onOk={() => form.submit()}
          destroyOnClose
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            initialValues={{
              frequency: selectedFrequency,
            }}
          >
            <Form.Item
              name="name"
              label="Tên Kế hoạch"
              rules={[
                { required: true, message: "Vui lòng nhập tên kế hoạch bảo trì" },
              ]}
            >
              <Input placeholder="Nhập tên kế hoạch, ví dụ: Bảo trì phòng ngừa" />
            </Form.Item>

            <Form.Item
              name="type"
              label="Loại Máy"
              rules={[{ required: true, message: "Vui lòng chọn loại máy" }]}
            >
              <Select placeholder="Chọn Loại Máy">
                {machineTypes.map((type) => (
                  <Option key={type.value} value={type.value}>
                    {type.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="description"
              label="Mô tả công việc"
              rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
            >
              <TextArea
                rows={3}
                placeholder="Mô tả chi tiết các bước bảo trì, vật tư cần dùng..."
              />
            </Form.Item>

            <Form.Item label="Tần suất Bảo trì" required>
              <Radio.Group
                value={selectedFrequency}
                onChange={(e) => setSelectedFrequency(e.target.value)}
                style={{ width: "100%" }}
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Space wrap>
                    {frequencies.slice(0, 5).map((freq) => (
                      <Radio.Button key={freq} value={freq}>
                        {freq}
                      </Radio.Button>
                    ))}
                  </Space>
                  <Radio.Button value="Tùy chỉnh">Tùy chỉnh</Radio.Button>
                </Space>
              </Radio.Group>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}
