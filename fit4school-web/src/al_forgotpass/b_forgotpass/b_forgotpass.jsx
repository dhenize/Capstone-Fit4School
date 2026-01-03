import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth, confirmPasswordReset } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import eyeIcon from '../../assets/icons/eye.svg';
import eyeOffIcon from '../../assets/icons/eye-closed.svg';
import arrowBack from '../../assets/icons/arrow-back.png';

const BForgotPass = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showReEnterPassword, setShowReEnterPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [reEnterPassword, setReEnterPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [oobCode, setOobCode] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Check for reset parameters in URL
  useEffect(() => {
    document.title = 'Forgot Pass | Change Pass - Fit4School';
    
    // Extract oobCode from URL (Firebase sends this in the reset link)
    const params = new URLSearchParams(location.search);
    const code = params.get('oobCode');
    const mode = params.get('mode');
    
    if (mode === 'resetPassword' && code) {
      setOobCode(code);
      
      // Try to get email from localStorage (set in previous step)
      const savedEmail = localStorage.getItem('forgotPasswordEmail');
      if (savedEmail) {
        setEmail(savedEmail);
      }
    } else {
      // If no reset code, redirect to email entry
      navigate('/a_forgotpass/entermail');
    }
  }, [location, navigate]);

  const validatePassword = (pass) => {
    const errors = [];
    
    if (pass.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(pass)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(pass)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(pass)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) {
      errors.push('Password must contain at least one special character');
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate passwords match
    if (password !== reEnterPassword) {
      setError('Passwords do not match!');
      return;
    }
    
    // Validate password strength
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join(', '));
      return;
    }
    
    setLoading(true);
    
    try {
      const auth = getAuth();
      
      // Confirm password reset with Firebase
      await confirmPasswordReset(auth, oobCode, password);
      
      // Get the updated email from auth state
      const updatedEmail = email || auth.currentUser?.email;
      
      if (updatedEmail) {
        // Find the user's account in Firestore
        const accountsRef = collection(db, "accounts");
        const emailQuery = query(
          accountsRef, 
          where("email", "==", updatedEmail.toLowerCase())
        );
        
        const querySnapshot = await getDocs(emailQuery);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          
          // Update the temporary_pass in Firestore
          await updateDoc(doc(db, "accounts", userDoc.id), {
            temporary_pass: password,
            updated_at: new Date()
          });
          
          console.log('Password updated in Firestore for user:', userDoc.id);
        }
      }
      
      setSuccess(true);
      
      // Clear localStorage
      localStorage.removeItem('forgotPasswordEmail');
      localStorage.removeItem('forgotPasswordRole');
      
    } catch (error) {
      console.error("Error resetting password:", error);
      
      // Handle specific Firebase errors
      switch (error.code) {
        case 'auth/weak-password':
          setError('Password is too weak. Please use a stronger password.');
          break;
        case 'auth/expired-action-code':
          setError('The reset link has expired. Please request a new one.');
          break;
        case 'auth/invalid-action-code':
          setError('Invalid reset link. Please request a new one.');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled. Please contact administrator.');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email.');
          break;
        default:
          setError('Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-sm text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Password Reset Successful!</h3>
            <p className="text-gray-600 mb-4">
              Your password has been successfully reset.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              You can now sign in with your new password.
            </p>
          </div>
          
          <button
            type="button"
            onClick={() => navigate('/a_acc_mod/')}
            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-all font-medium"
          >
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-sm text-center relative">
        <button
          type="button"
          onClick={() => navigate('/a_forgotpass/entermail')}
          className="absolute top-6 left-5 focus:outline-none"
        >
          <img
            src={arrowBack}
            alt="Back"
            className="w-4 h-4 hover:opacity-70 transition-opacity"
          />
        </button>

        <h3 className="text-xl font-bold mt-3 mb-4">Reset Password</h3>
        <p className="text-gray-600 mb-6">Enter your new password</p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* New Password Input */}
          <div className="relative mb-4">
            <input
              className="w-full border p-2 border-gray-300 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50"
              type={showPassword ? 'text' : 'password'}
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={8}
            />
            
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 focus:outline-none"
              disabled={loading}
            >
              <img
                src={showPassword ? eyeOffIcon : eyeIcon}
                alt="Toggle password visibility"
                className="w-5 h-5"
              />
            </button>
          </div>
          
          <div className="text-xs text-gray-500 mb-4 text-left">
            Password must contain:
            <ul className="list-disc list-inside pl-2 mt-1 space-y-0.5">
              <li className={password.length >= 8 ? 'text-green-500' : ''}>At least 8 characters</li>
              <li className={/[A-Z]/.test(password) ? 'text-green-500' : ''}>One uppercase letter</li>
              <li className={/[a-z]/.test(password) ? 'text-green-500' : ''}>One lowercase letter</li>
              <li className={/\d/.test(password) ? 'text-green-500' : ''}>One number</li>
              <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-500' : ''}>One special character</li>
            </ul>
          </div>

          {/* Re-enter Password Input */}
          <div className="relative mb-6">
            <input
              className="w-full border p-2 border-gray-300 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50"
              type={showReEnterPassword ? 'text' : 'password'}
              placeholder="Re-enter Password"
              value={reEnterPassword}
              onChange={(e) => setReEnterPassword(e.target.value)}
              required
              disabled={loading}
              minLength={8}
            />
            
            <button
              type="button"
              onClick={() => setShowReEnterPassword(!showReEnterPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 focus:outline-none"
              disabled={loading}
            >
              <img
                src={showReEnterPassword ? eyeOffIcon : eyeIcon}
                alt="Toggle password visibility"
                className="w-5 h-5"
              />
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                RESETTING...
              </div>
            ) : (
              'CONFIRM'
            )}
          </button>

          <button
            type="button"
            className="w-full mt-6 font-semibold text-cyan-500 hover:underline disabled:opacity-50"
            onClick={() => navigate('/a_acc_mod/')}
            disabled={loading}
          >
            Back to Sign in
          </button>
        </form>
      </div>
    </div>
  );
};

export default BForgotPass;