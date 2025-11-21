// services/authService.js
import { 
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  arrayUnion,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../firebase';

export class AuthService {
  static async signUp(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await sendEmailVerification(user);
      
      const accountRef = doc(db, 'accounts', user.uid);
      await setDoc(accountRef, {
        email: email,
        created_at: serverTimestamp(),
        status: 'pending-verification',
        gen_roles: 'user',
        emailVerified: false,
        userId: user.uid
      });
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async checkEmailVerification(userId) {
    try {
      await auth.currentUser?.reload();
      const user = auth.currentUser;
      
      if (user && user.emailVerified) {
        const accountRef = doc(db, 'accounts', userId);
        await updateDoc(accountRef, {
          emailVerified: true,
          verifiedAt: serverTimestamp()
        });
        return { success: true, verified: true };
      }
      return { success: true, verified: false };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async completeProfile(userId, profileData) {
    try {
      const accountRef = doc(db, 'accounts', userId);
      await updateDoc(accountRef, {
        fname: profileData.firstName,
        lname: profileData.lastName,
        contact_number: profileData.contactNumber,
        roles: arrayUnion(profileData.role),
        profileCompleted: true
      });
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async linkStudentToParent(userId, studentId) {
    try {
      const accountRef = doc(db, 'accounts', userId);
      
      await updateDoc(accountRef, {
        studentIds: arrayUnion(studentId),
        linkedStudents: arrayUnion({
          studentId: studentId,
          linkedAt: serverTimestamp(),
          role: 'child'
        }),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Student linked to parent successfully:', { userId, studentId });
      return { success: true };
    } catch (error) {
      console.error('❌ Error linking student to parent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  }
}