# Hướng dẫn khắc phục lỗi Firebase

## Lỗi 400 Bad Request khi kết nối Firestore

### Nguyên nhân có thể:

1. **Firestore Rules quá nghiêm ngặt**
2. **Chưa bật Firestore trong Firebase Console**
3. **Vấn đề với API Key hoặc cấu hình**

### Cách khắc phục:

#### 1. Kiểm tra Firestore Rules

Vào Firebase Console → Firestore Database → Rules và đảm bảo rules như sau:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Development rules - cho phép đọc/ghi tất cả (CHỈ DÙNG CHO DEVELOPMENT)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**HOẶC nếu bạn muốn có authentication:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - chỉ user đã đăng nhập mới đọc được thông tin của mình
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || resource.data.role == 'admin');
      allow write: if request.auth != null && (request.auth.uid == userId || resource.data.role == 'admin');
      allow create: if request.auth != null && request.auth.uid == userId;
    }

    // Cho phép admin đọc tất cả users
    match /users/{document=**} {
      allow read, write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Machines collection - cho phép đọc/ghi cho tất cả user đã đăng nhập
    match /machines/{machineId} {
      allow read, write: if request.auth != null;
      allow create: if request.auth != null;
    }

    // Test collection - cho phép đọc/ghi cho development
    match /test/{document=**} {
      allow read, write: if true;
    }
  }
}
```

#### 2. Kiểm tra Firestore đã được bật

1. Vào Firebase Console
2. Chọn project "do-an-8c3e4"
3. Vào Firestore Database
4. Nếu chưa có database, click "Create database"
5. Chọn "Start in test mode"

#### 3. Kiểm tra cấu hình

Đảm bảo file `src/firebase-config.js` có cấu hình đúng:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB1XAaS8jVlLTvTVzzFyasSA5Zjy3nkJL8",
  authDomain: "do-an-8c3e4.firebaseapp.com",
  projectId: "do-an-8c3e4",
  storageBucket: "do-an-8c3e4.firebasestorage.app",
  messagingSenderId: "362967619052",
  appId: "1:362967619052:web:e3a329cc39fb08bc035cc9",
  measurementId: "G-8HFSLW069S",
};
```

#### 4. Test kết nối

Sử dụng component FirebaseTest trong trang Machine để kiểm tra kết nối.

### Fallback Mode

Nếu Firebase không hoạt động, ứng dụng sẽ tự động chuyển sang chế độ fallback:

- Dữ liệu được lưu vào localStorage
- Hiển thị cảnh báo cho người dùng
- Dữ liệu sẽ được đồng bộ khi Firebase hoạt động trở lại

### Debug Steps

1. Mở Developer Tools (F12)
2. Vào tab Console
3. Thử thêm máy mới
4. Xem log lỗi chi tiết
5. Kiểm tra Network tab để xem request/response

### Liên hệ hỗ trợ

Nếu vẫn gặp vấn đề, vui lòng cung cấp:

- Screenshot lỗi trong Console
- Nội dung lỗi từ Network tab
- Cấu hình Firestore Rules hiện tại
