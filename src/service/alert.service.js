import { collection, addDoc, getDocs, updateDoc, doc, query, orderBy, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase-config';

const alertsCollectionRef = collection(db, 'alerts');
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1442340740318367874/e5kh0jvlI5WLn22iyHtZDAYLP6ftnhie2VqtKAfJfseiGEPNRORAwP366MaBgppMTk99';
const TELEGRAM_BOT_TOKEN = '7918838844:AAFW1o4tMb_eMSExJXmRzEnbm9kwxkiOSJk';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
// Chat ID mặc định (sẽ được tự động cập nhật khi có tin nhắn mới)
const DEFAULT_TELEGRAM_CHAT_ID = '6109643165';

class AlertService {
    async sendDiscordNotification(alertData) {
        if (!DISCORD_WEBHOOK_URL || typeof fetch === 'undefined') {
            return;
        }

        const color = alertData.status === 'critical' ? 0xff4d4f : alertData.status === 'warning' ? 0xfaad14 : 0x1890ff;
        const payload = {
            username: 'Machine Guardian',
            embeds: [
                {
                    title: `🚨 ${alertData.type || 'máy móc'}`,
                    description: alertData.description || 'Không có mô tả',
                    color,
                    fields: [
                        { name: 'Máy', value: `${alertData.machineName || 'Chưa rõ'} (${alertData.machineId || 'N/A'})`, inline: false },
                        { name: 'Giá trị', value: alertData.value || '-', inline: true },
                        { name: 'Ngưỡng', value: alertData.threshold || '-', inline: true },
                        { name: 'Khu vực', value: alertData.location || alertData.area || 'Chưa xác định', inline: false }
                    ],
                    timestamp: new Date().toISOString()
                }
            ]
        };

        try {
            await fetch(DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.error('Error sending alert to Discord:', error);
        }
    }

    //NOTE Khởi tạo chat_id Telegram (dùng lại nếu đã lưu)
    async initializeTelegramChatId() {
        // Kiểm tra xem đã có chat_id trong localStorage chưa
        const savedChatId = localStorage.getItem('telegram_chat_id');
        if (savedChatId) {
            console.log('Đã có chat_id trong localStorage:', savedChatId);
            return savedChatId;
        }

        // Thử lấy từ API
        const chatId = await this.getTelegramChatId();
        if (chatId) {
            return chatId;
        }

        // Nếu không lấy được, sử dụng chat_id mặc định
        if (DEFAULT_TELEGRAM_CHAT_ID) {
            localStorage.setItem('telegram_chat_id', DEFAULT_TELEGRAM_CHAT_ID);
            console.log('Đã sử dụng chat_id mặc định:', DEFAULT_TELEGRAM_CHAT_ID);
            return DEFAULT_TELEGRAM_CHAT_ID;
        }

        return null;
    }

    //NOTE Lấy chat_id từ Telegram API
    async getTelegramChatId() {
        try {
            const updatesResponse = await fetch(`${TELEGRAM_API_URL}/getUpdates`);
            const updatesData = await updatesResponse.json();

            if (updatesData.ok && updatesData.result && updatesData.result.length > 0) {
                // Lấy chat_id từ tin nhắn mới nhất
                const latestUpdate = updatesData.result[updatesData.result.length - 1];
                if (latestUpdate.message && latestUpdate.message.chat) {
                    const chatId = latestUpdate.message.chat.id.toString();
                    localStorage.setItem('telegram_chat_id', chatId);
                    console.log('Đã lấy chat_id từ Telegram API:', chatId);
                    return chatId;
                }
            }
            return null;
        } catch (error) {
            console.error('Lỗi khi lấy chat_id từ Telegram:', error);
            return null;
        }
    }

    //NOTE Gửi tin nhắn tới Telegram (tự lấy chat_id nếu thiếu)
    async sendTelegramNotification(message, chatId = null) {
        if (!TELEGRAM_BOT_TOKEN || typeof fetch === 'undefined') {
            console.warn('Telegram bot token không được cấu hình');
            return;
        }

        // Lấy chat_id từ localStorage nếu không được cung cấp
        if (!chatId) {
            chatId = localStorage.getItem('telegram_chat_id');
        }

        // Nếu chưa có chat_id, thử lấy từ API
        if (!chatId) {
            console.log('Đang lấy chat_id từ Telegram API...');
            chatId = await this.getTelegramChatId();

            if (!chatId) {
                console.warn('Chat ID Telegram chưa được cấu hình. Vui lòng gửi tin nhắn cho bot trước.');
                return;
            }
        }

        try {
            const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'HTML'
                })
            });

            const data = await response.json();
            if (!data.ok) {
                console.error('Lỗi khi gửi tin nhắn Telegram:', data.description);
                // Nếu chat_id không hợp lệ, thử lấy lại
                if (data.error_code === 400) {
                    console.log('Chat ID không hợp lệ, đang thử lấy lại...');
                    const newChatId = await this.getTelegramChatId();
                    if (newChatId && newChatId !== chatId) {
                        // Thử gửi lại với chat_id mới
                        return this.sendTelegramNotification(message, newChatId);
                    }
                }
            } else {
                console.log('Đã gửi cảnh báo đến Telegram thành công');
            }
        } catch (error) {
            console.error('Lỗi khi gửi cảnh báo đến Telegram:', error);
        }
    }

    //NOTE Gửi cảnh báo loại máy tới Telegram
    async sendMachineTypeAlert(action, machineTypeData) {
        const emoji = action === 'create' ? '✅' : action === 'update' ? '✏️' : '❌';
        const actionText = action === 'create' ? 'Thêm mới' : action === 'update' ? 'Cập nhật' : 'Xóa';

        const message = `
${emoji} <b>Cảnh báo: ${actionText} Loại máy</b>

📋 <b>Mã loại:</b> ${machineTypeData.code || 'N/A'}
🏷️ <b>Tên loại máy:</b> ${machineTypeData.name || 'N/A'}
📦 <b>Nhóm máy:</b> ${machineTypeData.group || 'N/A'}
🏭 <b>Nhà sản xuất:</b> ${machineTypeData.manufacturer || 'N/A'}
📊 <b>Trạng thái:</b> ${machineTypeData.status || 'N/A'}
${machineTypeData.desc ? `📝 <b>Mô tả:</b> ${machineTypeData.desc}` : ''}

⏰ <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}
        `.trim();

        await this.sendTelegramNotification(message);
    }

    //NOTE Gửi cảnh báo máy tới Telegram
    async sendMachineAlert(action, machineData) {
        const emoji = action === 'create' ? '✅' : action === 'update' ? '✏️' : '❌';
        const actionText = action === 'create' ? 'Thêm mới' : action === 'update' ? 'Cập nhật' : 'Xóa';

        const statusText = machineData.status === 'active' ? 'Đang hoạt động' :
            machineData.status === 'inactive' ? 'Không hoạt động' :
                machineData.status === 'maintenance' ? 'Bảo trì' : machineData.status || 'N/A';

        const message = `
${emoji} <b>Cảnh báo: ${actionText} Máy</b>

🏭 <b>Tên máy:</b> ${machineData.machineName || machineData.name || 'N/A'}
🔢 <b>Mã máy:</b> ${machineData.machineCode || machineData.id || 'N/A'}
🔧 <b>Loại máy:</b> ${machineData.machineType || 'N/A'}
📍 <b>Khu vực:</b> ${machineData.location || 'N/A'}
📊 <b>Trạng thái:</b> ${statusText}
${machineData.efficiency ? `⚡ <b>Hiệu suất:</b> ${machineData.efficiency}%` : ''}
${machineData.temperature ? `🌡️ <b>Nhiệt độ:</b> ${machineData.temperature}°C` : ''}

⏰ <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}
        `.trim();

        await this.sendTelegramNotification(message);
    }

    //NOTE Gửi cảnh báo kế hoạch bảo trì tới Telegram
    async sendMaintenancePlanAlert(action, planData) {
        const emoji = action === 'create' ? '✅' : action === 'update' ? '✏️' : '❌';
        const actionText = action === 'create' ? 'Thêm mới' : action === 'update' ? 'Cập nhật' : 'Xóa';

        const message = `
${emoji} <b>Cảnh báo: ${actionText} Kế hoạch bảo trì</b>

📋 <b>Tên kế hoạch:</b> ${planData.name || 'N/A'}
🔧 <b>Loại máy:</b> ${planData.type || 'N/A'}
🔄 <b>Tần suất:</b> ${planData.freq || planData.frequency || 'N/A'}
${planData.desc || planData.description ? `📝 <b>Mô tả:</b> ${planData.desc || planData.description}` : ''}

⏰ <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}
        `.trim();

        await this.sendTelegramNotification(message);
    }

    //NOTE Gửi cảnh báo nhiệt độ tới Telegram
    async sendTemperatureAlertToTelegram(alertData) {
        const emoji = alertData.status === 'critical' ? '🔥' : '⚠️';
        const statusText = alertData.status === 'critical' ? 'NGUY HIỂM' : 'CẢNH BÁO';

        const message = `
${emoji} <b>🚨  ${statusText}: Nhiệt độ máy</b>

🏭 <b>Máy:</b> ${alertData.machineName || 'Chưa rõ'} (${alertData.machineId || 'N/A'})
🌡️ <b>Nhiệt độ:</b> ${alertData.value || '-'}
📊 <b>Ngưỡng:</b> ${alertData.threshold || '-'}
📍 <b>Khu vực:</b> ${alertData.location || alertData.area || 'Chưa xác định'}
🔧 <b>Loại máy:</b> ${alertData.machineType || 'N/A'}

📝 <b>Mô tả:</b> ${alertData.description || 'Không có mô tả'}

⏰ <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}
        `.trim();

        await this.sendTelegramNotification(message);
    }

    //NOTE Gửi cảnh báo độ rung tới Telegram
    async sendVibrationAlertToTelegram(alertData) {
        const emoji = alertData.status === 'critical' ? '⚡' : '⚠️';
        const statusText = alertData.status === 'critical' ? 'NGUY HIỂM' : 'CẢNH BÁO';

        const message = `
${emoji} <b>🚨  ${statusText}: Độ rung máy</b>

🏭 <b>Máy:</b> ${alertData.machineName || 'Chưa rõ'} (${alertData.machineId || 'N/A'})
📳 <b>Độ rung:</b> ${alertData.value || '-'}
📊 <b>Ngưỡng:</b> ${alertData.threshold || '-'}
📍 <b>Khu vực:</b> ${alertData.location || alertData.area || 'Chưa xác định'}
🔧 <b>Loại máy:</b> ${alertData.machineType || 'N/A'}

📝 <b>Mô tả:</b> ${alertData.description || 'Không có mô tả'}

⏰ <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}
        `.trim();

        await this.sendTelegramNotification(message);
    }

    //NOTE Tạo alert mới trong Firestore
    createAlert(alertData) {
        return addDoc(alertsCollectionRef, {
            ...alertData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    }

    //NOTE Lấy tất cả cảnh báo (mới nhất trước)
    getAllAlerts() {
        return getDocs(query(alertsCollectionRef, orderBy('createdAt', 'desc')));
    }

    //NOTE Lấy cảnh báo theo status
    getAlertsByStatus(status) {
        return getDocs(query(
            alertsCollectionRef,
            where('status', '==', status),
            orderBy('createdAt', 'desc')
        ));
    }

    //NOTE Lấy cảnh báo chưa acknowledged
    getUnacknowledgedAlerts() {
        return getDocs(query(
            alertsCollectionRef,
            where('acknowledged', '==', false),
            orderBy('createdAt', 'desc')
        ));
    }

    //NOTE Đánh dấu alert đã acknowledged
    acknowledgeAlert(alertId) {
        const alertRef = doc(alertsCollectionRef, alertId);
        return updateDoc(alertRef, {
            acknowledged: true,
            acknowledgedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    }

    //NOTE Tạo cảnh báo nhiệt độ (và gửi Discord/Telegram)
    createTemperatureAlert(machineData, temperature) {
        const alertData = {
            machineId: machineData.id,
            machineName: machineData.name,
            machineType: machineData.machineType,
            location: machineData.location,
            type: 'nhiệt độ',
            status: temperature > 80 ? 'critical' : 'warning',
            value: `${temperature}°C`,
            threshold: '80°C',
            acknowledged: false,
            area: machineData.location,
            description: temperature > 80
                ? `Nhiệt độ máy ${machineData.name} vượt quá ngưỡng an toàn (${temperature}°C > 80°C)`
                : `Nhiệt độ máy ${machineData.name} cao hơn bình thường (${temperature}°C)`
        };

        return this.createAlert(alertData)
            .then(result => {
                this.sendDiscordNotification(alertData);
                this.sendTemperatureAlertToTelegram(alertData);
                return result;
            })
            .catch(error => {
                console.error('Error creating temperature alert:', error);
                throw error;
            });
    }

    //NOTE Tạo cảnh báo độ rung (và gửi Discord/Telegram)
    createVibrationAlert(machineData, vibration) {
        const alertData = {
            machineId: machineData.id,
            machineName: machineData.name,
            machineType: machineData.machineType,
            location: machineData.location,
            type: 'độ rung',
            status: vibration >= 7 ? 'critical' : 'warning',
            value: `${vibration} mm/s`,
            threshold: vibration >= 7 ? '7 mm/s' : '4 mm/s',
            acknowledged: false,
            area: machineData.location,
            description: vibration >= 7
                ? `Độ rung máy ${machineData.name} ở mức nguy hiểm (${vibration} mm/s >= 7 mm/s)`
                : `Độ rung máy ${machineData.name} cao hơn bình thường (${vibration} mm/s >= 4 mm/s)`
        };

        return this.createAlert(alertData)
            .then(result => {
                this.sendDiscordNotification(alertData);
                this.sendVibrationAlertToTelegram(alertData);
                return result;
            })
            .catch(error => {
                console.error('Error creating vibration alert:', error);
                throw error;
            });
    }

    //NOTE Tạo cảnh báo hiệu suất (gửi Discord)
    createEfficiencyAlert(machineData, efficiency) {
        const alertData = {
            machineId: machineData.id,
            machineName: machineData.name,
            machineType: machineData.machineType,
            location: machineData.location,
            type: 'hiệu suất',
            status: efficiency < 50 ? 'critical' : 'warning',
            value: `${efficiency}%`,
            threshold: '50%',
            acknowledged: false,
            area: machineData.location,
            description: efficiency < 50
                ? `Hiệu suất máy ${machineData.name} thấp nghiêm trọng (${efficiency}% < 50%)`
                : `Hiệu suất máy ${machineData.name} thấp hơn bình thường (${efficiency}%)`
        };

        return this.createAlert(alertData)
            .then(result => {
                this.sendDiscordNotification(alertData);
                return result;
            })
            .catch(error => {
                console.error('Error creating efficiency alert:', error);
                throw error;
            });
    }

    //NOTE Tạo cảnh báo chuyển trạng thái máy
    createStatusAlert(machineData, oldStatus, newStatus) {
        const alertData = {
            machineId: machineData.id,
            machineName: machineData.name,
            machineType: machineData.machineType,
            location: machineData.location,
            type: 'trạng thái',
            status: newStatus === 'inactive' ? 'warning' : 'info',
            value: newStatus === 'active' ? 'Hoạt động' : 'Tạm dừng',
            threshold: 'Hoạt động',
            acknowledged: false,
            area: machineData.location,
            description: `Máy ${machineData.name} đã chuyển từ "${oldStatus}" sang "${newStatus}"`
        };

        return this.createAlert(alertData)
            .then(result => {
                this.sendDiscordNotification(alertData);
                return result;
            })
            .catch(error => {
                console.error('Error creating status alert:', error);
                throw error;
            });
    }

    //NOTE Kiểm tra dữ liệu máy và tạo alert tương ứng
    checkAndCreateAlerts(machineData) {
        const alerts = [];

        // Kiểm tra nhiệt độ
        if (machineData.temperature > 80) {
            alerts.push(this.createTemperatureAlert(machineData, machineData.temperature));
        }

        // Kiểm tra hiệu suất
        if (machineData.efficiency < 50) {
            alerts.push(this.createEfficiencyAlert(machineData, machineData.efficiency));
        }

        return Promise.all(alerts);
    }

    //NOTE Lưu alert vào localStorage (fallback) và gửi Discord/Telegram
    saveAlertToLocalStorage(alertData) {
        try {
            const existingAlerts = JSON.parse(localStorage.getItem('machineAlerts') || '[]');
            const newAlert = {
                ...alertData,
                id: Date.now(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            existingAlerts.unshift(newAlert);
            localStorage.setItem('machineAlerts', JSON.stringify(existingAlerts));
            this.sendDiscordNotification(newAlert);
            // Gửi cảnh báo Telegram tùy theo loại cảnh báo
            if (newAlert.type === 'nhiệt độ') {
                this.sendTemperatureAlertToTelegram(newAlert);
            } else if (newAlert.type === 'độ rung') {
                this.sendVibrationAlertToTelegram(newAlert);
            }
            return Promise.resolve(newAlert);
        } catch (error) {
            console.error('Error saving alert to localStorage:', error);
            return Promise.reject(error);
        }
    }

    //NOTE Lấy alert từ localStorage (fallback)
    getAlertsFromLocalStorage() {
        try {
            const alerts = JSON.parse(localStorage.getItem('machineAlerts') || '[]');
            return Promise.resolve(alerts);
        } catch (error) {
            console.error('Error getting alerts from localStorage:', error);
            return Promise.resolve([]);
        }
    }
}

export default new AlertService();
