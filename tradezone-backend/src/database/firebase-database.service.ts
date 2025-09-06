import { Injectable } from '@nestjs/common';
import { FirebaseConfig } from '../config/firebase.config';
import * as admin from 'firebase-admin';
import { Permission, UserPermissions, DEFAULT_USER_PERMISSIONS } from '../auth/entities/permission.entity';
import { Position } from '../positions/entities/position.entity';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  isAiFeatureEnabled?: boolean;
}

// ChatMessage interface removed - using in-memory chat via WebSocket

@Injectable()
export class FirebaseDatabaseService {
  private firestore: admin.firestore.Firestore;
  private usersCollection = 'users';
  private permissionsCollection = 'permissions';
  private positionsCollection = 'positions';

  constructor(private firebaseConfig: FirebaseConfig) {
    // Firestore will be initialized in onModuleInit
  }

  private getFirestore() {
    return this.firebaseConfig.getFirestore();
  }

  // User operations
  async getUsers(): Promise<User[]> {
    try {
      const snapshot = await this.getFirestore().collection(this.usersCollection).get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    try {
      const snapshot = await this.getFirestore()
        .collection(this.usersCollection)
        .where('email', '==', email)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as User;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    try {
      const docRef = await this.getFirestore().collection(this.usersCollection).add({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return {
        id: docRef.id,
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<void> {
    try {
      await this.getFirestore()
        .collection(this.usersCollection)
        .doc(userId)
        .update({
          ...userData,
          updatedAt: new Date()
        });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await this.getFirestore()
        .collection(this.usersCollection)
        .doc(userId)
        .delete();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Chat operations removed - using in-memory chat via WebSocket

  // Initialize with sample data
  async initializeSampleData(): Promise<void> {
    try {
      const usersSnapshot = await this.getFirestore().collection(this.usersCollection).get();
      
      if (usersSnapshot.empty) {
        console.log('📝 Initializing sample users...');
        
        const sampleUsers = [
          {
            name: 'vivekkolhe',
            email: 'vivekkolhe@gmail.com',
            password: 'Vivek@123',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            name: 'shreyashkolhe',
            email: 'shreyashkolhe@gmail.com',
            password: 'shreyash@123',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        for (const user of sampleUsers) {
          await this.createUser(user);
        }
        
        console.log('✅ Sample users initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing sample data:', error);
    }
  }

  // Permission operations
  async createUserPermissions(userId: string, permissions: UserPermissions = DEFAULT_USER_PERMISSIONS): Promise<Permission> {
    try {
      const permissionData = {
        userId,
        permissions,
      };

      const docRef = await this.getFirestore().collection(this.permissionsCollection).add(permissionData);
      
      const permission: Permission = {
        _id: docRef.id,
        ...permissionData,
      };

      console.log(`✅ Created permissions for user ${userId}`);
      return permission;
    } catch (error) {
      console.error('Error creating user permissions:', error);
      throw error;
    }
  }

  async getUserPermissions(userId: string): Promise<Permission | null> {
    try {
      const snapshot = await this.getFirestore()
        .collection(this.permissionsCollection)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.log(`No permissions found for user ${userId}, creating default permissions`);
        return await this.createUserPermissions(userId);
      }

      const doc = snapshot.docs[0];
      return {
        _id: doc.id,
        ...doc.data()
      } as Permission;
    } catch (error) {
      console.error('Error getting user permissions:', error);
      throw error;
    }
  }

  async updateUserPermissions(userId: string, permissions: Partial<UserPermissions>): Promise<Permission> {
    try {
      // Get existing permissions
      const existingPermission = await this.getUserPermissions(userId);
      
      if (!existingPermission) {
        throw new Error(`No permissions found for user ${userId}`);
      }

      // Merge with existing permissions
      const updatedPermissions = {
        ...existingPermission.permissions,
        ...permissions
      };

      const updateData = {
        permissions: updatedPermissions,
      };

      if (!existingPermission._id) {
        throw new Error('Permission document ID is missing');
      }

      await this.getFirestore()
        .collection(this.permissionsCollection)
        .doc(existingPermission._id)
        .update(updateData);

      console.log(`✅ Updated permissions for user ${userId}`);
      
      return {
        ...existingPermission,
        ...updateData,
      };
    } catch (error) {
      console.error('Error updating user permissions:', error);
      throw error;
    }
  }

  async deleteUserPermissions(userId: string): Promise<void> {
    try {
      const snapshot = await this.getFirestore()
        .collection(this.permissionsCollection)
        .where('userId', '==', userId)
        .get();

      const batch = this.getFirestore().batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`✅ Deleted permissions for user ${userId}`);
    } catch (error) {
      console.error('Error deleting user permissions:', error);
      throw error;
    }
  }

  async getAllUserPermissions(): Promise<Permission[]> {
    try {
      const snapshot = await this.getFirestore().collection(this.permissionsCollection).get();
      return snapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
      })) as Permission[];
    } catch (error) {
      console.error('Error getting all permissions:', error);
      throw error;
    }
  }

  // Position operations
  async getPositions(userId: string): Promise<Position[]> {
    try {
      console.log('🔍 FirebaseDatabaseService.getPositions called with userId:', userId);
      
      const snapshot = await this.getFirestore()
        .collection(this.positionsCollection)
        .where('userId', '==', userId)
        .get();
      
      console.log(`📊 Firestore query returned ${snapshot.docs.length} documents`);
      
      const positions = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`📄 Position ${doc.id}: userId=${data.userId}, symbol=${data.symbol}`);
        return {
          id: doc.id,
          ...data
        };
      }) as Position[];
      
      console.log(`📊 Mapped ${positions.length} positions`);
      
      // Sort by createdAt in JavaScript instead of Firestore
      const sortedPositions = positions.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Descending order
      });
      
      console.log(`📊 Returning ${sortedPositions.length} sorted positions`);
      return sortedPositions;
    } catch (error) {
      console.error('❌ Error getting positions:', error);
      return [];
    }
  }

  async getPositionById(positionId: string): Promise<Position | null> {
    try {
      const doc = await this.getFirestore()
        .collection(this.positionsCollection)
        .doc(positionId)
        .get();

      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data()
      } as Position;
    } catch (error) {
      console.error('Error getting position by ID:', error);
      return null;
    }
  }

  async createPosition(positionData: Omit<Position, 'id'>): Promise<Position> {
    try {
      // Use serverTimestamp() for Firestore timestamps
      const now = new Date();
      const docRef = await this.getFirestore().collection(this.positionsCollection).add({
        ...positionData,
        createdAt: now,
        updatedAt: now
      });

      return {
        id: docRef.id,
        ...positionData,
        createdAt: now,
        updatedAt: now
      };
    } catch (error) {
      console.error('Error creating position:', error);
      throw error;
    }
  }

  async updatePosition(positionId: string, positionData: Partial<Position>): Promise<void> {
    try {
      await this.getFirestore()
        .collection(this.positionsCollection)
        .doc(positionId)
        .update({
          ...positionData,
          updatedAt: new Date()
        });
    } catch (error) {
      console.error('Error updating position:', error);
      throw error;
    }
  }

  async deletePosition(positionId: string): Promise<void> {
    try {
      await this.getFirestore()
        .collection(this.positionsCollection)
        .doc(positionId)
        .delete();
    } catch (error) {
      console.error('Error deleting position:', error);
      throw error;
    }
  }

  async getOpenPositions(userId: string): Promise<Position[]> {
    try {
      const snapshot = await this.getFirestore()
        .collection(this.positionsCollection)
        .where('userId', '==', userId)
        .where('status', '==', 'open')
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Position[];
    } catch (error) {
      console.error('Error getting open positions:', error);
      return [];
    }
  }

  async getClosedPositions(userId: string): Promise<Position[]> {
    try {
      const snapshot = await this.getFirestore()
        .collection(this.positionsCollection)
        .where('userId', '==', userId)
        .where('status', '==', 'closed')
        .orderBy('closedAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Position[];
    } catch (error) {
      console.error('Error getting closed positions:', error);
      return [];
    }
  }
}
