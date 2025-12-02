// services/studentService.js
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, query, where, getDocs, collection } from 'firebase/firestore';

export const StudentService = {
  async verifyStudentForParent(userId, studentId, userType) {
    try {
      console.log('🔍 Verifying student:', studentId, 'for user:', userId);
      
      // Hanapin ang student gamit ang studentId field
      const studentsCol = collection(db, 'students');
      const q = query(studentsCol, where('studentId', '==', studentId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { 
          success: false, 
          message: 'Student ID not found. Please check the ID or contact the school.' 
        };
      }

      // Kunin ang unang result (dapat isa lang ang may ganitong studentId)
      const studentDoc = querySnapshot.docs[0];
      const studentData = studentDoc.data();
      const studentDocId = studentDoc.id;

      console.log('📋 Student data found:', studentData);
      console.log('📄 Student document ID:', studentDocId);

      // I-check kung ang estudyante ay naka-link na sa ibang parent
      if (studentData.linked_parents && studentData.linked_parents.includes(userId)) {
        return { 
          success: false, 
          message: 'This student is already linked to your account.' 
        };
      }

      // I-update ang student document para idagdag ang parent link
      await updateDoc(doc(db, 'students', studentDocId), {
        linked_parents: arrayUnion(userId),
        is_linked: true,
        updated_at: new Date()
      });

      // I-update ang parent document para idagdag ang student link
      const parentDocRef = doc(db, 'users', userId);
      const parentDoc = await getDoc(parentDocRef);
      
      if (parentDoc.exists()) {
        const parentData = parentDoc.data();
        const currentLinkedStudents = parentData.linked_students || [];
        
        // I-check kung ang estudyante ay naka-link na
        const alreadyLinked = currentLinkedStudents.some(
          student => student.student_id === studentId
        );
        
        if (!alreadyLinked) {
          await updateDoc(parentDocRef, {
            linked_students: arrayUnion({
              student_id: studentId,
              student_name: `${studentData.fname} ${studentData.lname}`,
              student_doc_id: studentDocId,
              sch_level: studentData.sch_level,
              gender: studentData.gender,
              linked_at: new Date()
            }),
            updated_at: new Date()
          });
        }
      }

      return {
        success: true,
        message: 'Student successfully linked to your account!',
        student: {
          student_id: studentId,
          student_doc_id: studentDocId,
          full_name: `${studentData.fname} ${studentData.lname}`,
          sch_level: studentData.sch_level,
          gender: studentData.gender
        }
      };

    } catch (error) {
      console.error('❌ Error in verifyStudentForParent:', error);
      return { 
        success: false, 
        message: 'Verification failed. Please try again.' 
      };
    }
  },

  async getStudentById(studentId) {
    try {
      const studentsCol = collection(db, 'students');
      const q = query(studentsCol, where('studentId', '==', studentId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const studentDoc = querySnapshot.docs[0];
        return { 
          success: true, 
          student: { 
            id: studentDoc.id,
            ...studentDoc.data() 
          } 
        };
      }
      return { success: false, message: 'Student not found' };
    } catch (error) {
      console.error('Error getting student:', error);
      return { success: false, message: 'Error fetching student data' };
    }
  },

  async getParentLinkedStudents(userId) {
    try {
      const parentDoc = await getDoc(doc(db, 'users', userId));
      if (parentDoc.exists()) {
        const parentData = parentDoc.data();
        return parentData.linked_students || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting parent linked students:', error);
      return [];
    }
  },

  async unlinkStudentFromParent(userId, studentId) {
    try {
      // Hanapin ang student document
      const studentsCol = collection(db, 'students');
      const q = query(studentsCol, where('studentId', '==', studentId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { success: false, message: 'Student not found' };
      }

      const studentDoc = querySnapshot.docs[0];
      const studentData = studentDoc.data();
      
      // Alisin ang parent mula sa linked_parents array
      const updatedLinkedParents = (studentData.linked_parents || []).filter(
        parentId => parentId !== userId
      );

      await updateDoc(doc(db, 'students', studentDoc.id), {
        linked_parents: updatedLinkedParents,
        is_linked: updatedLinkedParents.length > 0,
        updated_at: new Date()
      });

      // Alisin ang student mula sa parent's linked_students
      const parentDocRef = doc(db, 'users', userId);
      const parentDoc = await getDoc(parentDocRef);
      
      if (parentDoc.exists()) {
        const parentData = parentDoc.data();
        const updatedLinkedStudents = (parentData.linked_students || []).filter(
          student => student.student_id !== studentId
        );

        await updateDoc(parentDocRef, {
          linked_students: updatedLinkedStudents,
          updated_at: new Date()
        });
      }

      return { success: true, message: 'Student successfully unlinked from your account' };
    } catch (error) {
      console.error('Error unlinking student:', error);
      return { success: false, message: 'Failed to unlink student' };
    }
  }
};