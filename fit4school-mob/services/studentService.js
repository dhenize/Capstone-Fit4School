import { 
  doc, 
  getDoc, 
  query, 
  where, 
  collection, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../firebase';
import { AuthService } from './authService';

export class StudentService {
  static async checkStudentExists(studentId) {
    try {
      console.log('Searching for student ID:', studentId);

      const studentsRef = collection(db, 'students');
      const q = query(studentsRef, where('studentId', '==', studentId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const studentDoc = querySnapshot.docs[0];
        const studentData = studentDoc.data();
        
        console.log('✅ Student found:', studentData);
        
        return {
          exists: true,
          student: this.formatStudentData(studentData),
          documentId: studentDoc.id
        };
      } else {
        console.log('❌ Student not found with ID:', studentId);
        return { 
          exists: false,
          message: 'Student ID not found in our records'
        };
      }
    } catch (error) {
      console.error('❌ Error checking student exists:', error);
      return {
        exists: false,
        error: error.message
      };
    }
  }

  static formatStudentData(studentData) {
    const formattedData = {
      full_name: `${studentData.fname || ''} ${studentData.lname || ''}`.trim(),
      fname: studentData.fname,
      lname: studentData.lname,
      student_id: studentData.studentId,
      studentId: studentData.studentId,
      sch_level: studentData.sch_level,
      gender: studentData.gender,
      ...studentData
    };

    console.log('📝 Formatted student data:', formattedData);
    return formattedData;
  }

  static async verifyStudentForParent(userId, studentId, role) {
    try {
      console.log('🔐 Verifying student for parent:', { userId, studentId, role });
      
      const studentCheck = await this.checkStudentExists(studentId);
      
      if (!studentCheck.exists) {
        return {
          success: false,
          message: studentCheck.message || 'Student ID not found. Please check the ID and try again.'
        };
      }

      const student = studentCheck.student;
      console.log('✅ Student verified:', student);

      const linkResult = await AuthService.linkStudentToParent(userId, studentId);
      
      if (linkResult.success) {
        return {
          success: true,
          student: student,
          message: `Verified! Welcome ${student.full_name}'s ${role}!`
        };
      } else {
        return {
          success: false,
          message: 'Failed to link student to your account. Please try again.'
        };
      }
    } catch (error) {
      console.error('❌ Error verifying student for parent:', error);
      return {
        success: false,
        error: error.message,
        message: 'Verification failed. Please try again.'
      };
    }
  }

  static async isStudentAlreadyLinked(studentId) {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('studentIds', 'array-contains', studentId));
      const querySnapshot = await getDocs(q);
      
      return {
        isLinked: !querySnapshot.empty,
        linkedUsers: querySnapshot.docs.map(doc => ({
          userId: doc.id,
          email: doc.data().email
        }))
      };
    } catch (error) {
      console.error('Error checking student link status:', error);
      return {
        isLinked: false,
        error: error.message
      };
    }
  }
}