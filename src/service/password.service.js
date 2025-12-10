import { getAuth } from 'firebase/auth';

class PasswordService {
  constructor() {
    this.auth = getAuth();
  }

  //NOTE Tạo mật khẩu mới (chỉ lưu local, không đổi Firebase)
  async createNewPasswordForUser(user, newPassword) {
    try {
      // Lưu thông tin mật khẩu mới vào localStorage
      const passwordInfo = {
        email: user.email,
        newPassword: newPassword,
        timestamp: new Date().toLocaleString('vi-VN'),
        uid: user.uid,
        note: '⚠️ Mật khẩu này chỉ được lưu để admin xem. Để thực sự thay đổi, cần sử dụng Firebase Admin SDK.'
      };
      
      // Lưu vào localStorage để admin có thể xem
      const savedPasswords = JSON.parse(localStorage.getItem('newPasswords') || '[]');
      savedPasswords.push(passwordInfo);
      localStorage.setItem('newPasswords', JSON.stringify(savedPasswords));

      return { 
        success: true, 
        message: 'Mật khẩu mới đã được lưu để admin xem',
        passwordInfo,
        warning: 'Mật khẩu này chưa được cập nhật trong Firebase. Người dùng vẫn cần sử dụng mật khẩu cũ để đăng nhập.'
      };
    } catch (error) {
      console.error('Error creating new password:', error);
      throw error;
    }
  }

  //NOTE Lấy danh sách mật khẩu đã tạo (localStorage)
  getNewPasswords() {
    try {
      const savedPasswords = JSON.parse(localStorage.getItem('newPasswords') || '[]');
      return savedPasswords;
    } catch (error) {
      console.error('Error getting new passwords:', error);
      return [];
    }
  }

  //NOTE Xóa danh sách mật khẩu đã tạo
  clearNewPasswords() {
    try {
      localStorage.removeItem('newPasswords');
      return { success: true, message: 'Đã xóa danh sách mật khẩu' };
    } catch (error) {
      console.error('Error clearing passwords:', error);
      throw error;
    }
  }

  //NOTE Tạo mật khẩu ngẫu nhiên
  generateRandomPassword(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  //NOTE Kiểm tra độ mạnh mật khẩu
  checkPasswordStrength(password) {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password)
    };

    const score = Object.values(checks).filter(Boolean).length;
    
    if (score === 5) return { strength: 'Rất mạnh', color: 'green', score: 5 };
    if (score === 4) return { strength: 'Mạnh', color: 'blue', score: 4 };
    if (score === 3) return { strength: 'Trung bình', color: 'orange', score: 3 };
    if (score === 2) return { strength: 'Yếu', color: 'red', score: 2 };
    return { strength: 'Rất yếu', color: 'red', score: 1 };
  }

  //NOTE Tạo dữ liệu demo (local)
  createDemoPasswords() {
    const demoPasswords = [
      {
        email: 'demo1@example.com',
        newPassword: 'Demo123!@#',
        timestamp: new Date().toLocaleString('vi-VN'),
        uid: 'demo-uid-1',
        note: '⚠️ Mật khẩu demo - chưa được cập nhật trong Firebase'
      },
      {
        email: 'demo2@example.com',
        newPassword: 'Test456$%^',
        timestamp: new Date().toLocaleString('vi-VN'),
        uid: 'demo-uid-2',
        note: '⚠️ Mật khẩu demo - chưa được cập nhật trong Firebase'
      }
    ];
    
    localStorage.setItem('newPasswords', JSON.stringify(demoPasswords));
    return demoPasswords;
  }

  //NOTE Hướng dẫn thay đổi mật khẩu thực sự
  getPasswordChangeInstructions() {
    return {
      title: 'Hướng dẫn thay đổi mật khẩu thực sự',
      steps: [
        '1. Sử dụng Firebase Admin SDK (server-side)',
        '2. Hoặc tạo Cloud Function để thay đổi mật khẩu',
        '3. Hoặc sử dụng Firebase Console để reset mật khẩu',
        '4. Hoặc gửi email reset password cho người dùng'
      ],
      note: 'Mật khẩu hiện tại chỉ được lưu để admin xem, không thực sự thay đổi trong hệ thống Firebase.'
    };
  }
}

export default new PasswordService();
