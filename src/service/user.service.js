import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB1XAaS8jVlLTvTVzzFyasSA5Zjy3nkJL8",
  authDomain: "do-an-8c3e4.firebaseapp.com",
  projectId: "do-an-8c3e4",
  storageBucket: "do-an-8c3e4.firebasestorage.app",
  messagingSenderId: "362967619052",
  appId: "1:362967619052:web:e3a329cc39fb08bc035cc9",
  measurementId: "G-8HFSLW069S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user'
};

// User service class
class UserService {
  constructor() {
    this.usersCollection = collection(db, 'users');
  }

  // Tạo mới bản ghi người dùng (không tạo tài khoản Auth)
  async createUserRecord({ email, displayName, role, isActive }) {
    try {
      if (!email) {
        throw new Error('Email là bắt buộc');
      }

      const newUserRef = doc(this.usersCollection);
      const uid = newUserRef.id;

      const userDoc = {
        uid,
        email,
        displayName: displayName || (email ? email.split('@')[0] : ''),
        role: role || USER_ROLES.USER,
        isActive: typeof isActive === 'boolean' ? isActive : true,
        createdAt: serverTimestamp(),
        lastLogin: null,
        photoURL: null
      };

      await setDoc(newUserRef, userDoc);
      return { success: true, user: userDoc };
    } catch (error) {
      console.error('Error creating user record:', error);
      throw error;
    }
  }

  // Tạo user mới khi đăng ký/đăng nhập lần đầu
  async createUser(userData) {
    try {
      const userRef = doc(this.usersCollection, userData.uid);
      const userDoc = {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName || userData.email.split('@')[0],
        role: USER_ROLES.USER, // Default role
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        isActive: true,
        photoURL: userData.photoURL || null
      };

      await setDoc(userRef, userDoc);
      return { success: true, user: userDoc };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Lấy thông tin user theo UID
  async getUserByUid(uid) {
    try {
      const userRef = doc(this.usersCollection, uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return { success: true, user: { id: userSnap.id, ...userSnap.data() } };
      } else {
        return { success: false, message: 'User not found' };
      }
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  // Lấy danh sách tất cả users
  async getAllUsers() {
    try {
      const q = query(this.usersCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, users };
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  // Lấy users theo role
  async getUsersByRole(role) {
    try {
      const q = query(
        this.usersCollection, 
        where('role', '==', role),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, users };
    } catch (error) {
      console.error('Error getting users by role:', error);
      throw error;
    }
  }

  // Cập nhật role của user
  async updateUserRole(uid, newRole) {
    try {
      // Kiểm tra role hợp lệ
      if (!Object.values(USER_ROLES).includes(newRole)) {
        throw new Error('Invalid role');
      }

      const userRef = doc(this.usersCollection, uid);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: serverTimestamp()
      });

      return { success: true, message: `Role updated to ${newRole}` };
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  // Cập nhật thông tin user
  async updateUser(uid, updateData) {
    try {
      const userRef = doc(this.usersCollection, uid);
      await updateDoc(userRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });

      return { success: true, message: 'User updated successfully' };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Xóa user (soft delete)
  async deleteUser(uid) {
    try {
      const userRef = doc(this.usersCollection, uid);
      await updateDoc(userRef, {
        isActive: false,
        deletedAt: serverTimestamp()
      });

      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Cập nhật last login
  async updateLastLogin(uid) {
    try {
      const userRef = doc(this.usersCollection, uid);
      await updateDoc(userRef, {
        lastLogin: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  // Kiểm tra quyền admin
  async isAdmin(uid) {
    try {
      const userResult = await this.getUserByUid(uid);
      if (userResult.success) {
        return userResult.user.role === USER_ROLES.ADMIN;
      }
      return false;
    } catch (error) {
      console.error('Error checking admin role:', error);
      return false;
    }
  }

  // Kiểm tra quyền manager hoặc admin
  async isManagerOrAdmin(uid) {
    try {
      const userResult = await this.getUserByUid(uid);
      if (userResult.success) {
        const role = userResult.user.role;
        return role === USER_ROLES.ADMIN || role === USER_ROLES.MANAGER;
      }
      return false;
    } catch (error) {
      console.error('Error checking manager/admin role:', error);
      return false;
    }
  }
}

export default new UserService();
