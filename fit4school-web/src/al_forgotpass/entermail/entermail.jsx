import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import arrowBack from '../../assets/icons/arrow-back.png';

const EnterMail = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check if email exists in Firestore accounts collection
      const accountsRef = collection(db, "accounts");
      const emailQuery = query(
        accountsRef, 
        where("email", "==", email.trim().toLowerCase())
      );
      
      const querySnapshot = await getDocs(emailQuery);
      
      if (querySnapshot.empty) {
        setError('No account found with this email address.');
        setLoading(false);
        return;
      }

      // Get user data to determine role
      const userData = querySnapshot.docs[0].data();
      const userRole = userData.gen_roles;
      
      // Check if account is active
      if (userData.status !== 'active') {
        setError('Your account is not active. Please contact administrator.');
        setLoading(false);
        return;
      }

      // Send password reset email using Firebase Authentication
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      
      // Store email and role in localStorage for the next step
      localStorage.setItem('forgotPasswordEmail', email.trim().toLowerCase());
      localStorage.setItem('forgotPasswordRole', userRole);
      
      setSuccess(true);
      
    } catch (error) {
      console.error("Error sending reset email:", error);
      
      // Handle specific Firebase errors
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Invalid email address format.');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email address.');
          break;
        case 'auth/too-many-requests':
          setError('Too many attempts. Please try again later.');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your connection.');
          break;
        default:
          setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-sm text-center relative">
        <button
          type="button"
          onClick={() => navigate(-1)} 
          className="absolute top-6 left-5 focus:outline-none"
        >
          <img
            src={arrowBack}
            alt="Back"
            className="w-4 h-4 hover:opacity-70 transition-opacity"
          />
        </button>

        {success ? (
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Reset Email Sent!</h3>
              <p className="text-gray-600 mb-4">
                We've sent a password reset link to: <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Please check your email and click the link to reset your password. The link will expire in 1 hour.
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => navigate('/a_acc_mod/')}
                className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-all font-medium"
              >
                Return to Sign In
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                  setError('');
                }}
                className="w-full text-green-500 py-2 rounded-lg hover:bg-green-50 transition-all font-medium"
              >
                Try Another Email
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full">
            <h3 className="text-xl font-bold mt-3 mb-4">Forgot Password</h3>
            <p className="text-gray-600 mb-2">Please enter a valid email address</p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            
            <input
              className="w-full border p-2 border-gray-300 mb-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            
            <button
              type="submit"
              className="font-bold w-full bg-green-400 text-white p-2 rounded-lg hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  SENDING...
                </div>
              ) : (
                'CONFIRM'
              )}
            </button>
            
            <button
              type="button"
              className="w-full mt-12 font-semibold text-cyan-500 hover:underline"
              onClick={() => navigate('/a_acc_mod/')}
            >
              Back to Sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default EnterMail;