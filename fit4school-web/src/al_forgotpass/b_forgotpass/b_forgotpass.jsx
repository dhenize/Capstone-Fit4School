import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import eyeIcon from '../../assets/icons/eye.svg';
import eyeOffIcon from '../../assets/icons/eye-closed.svg';
import arrowBack from '../../assets/icons/arrow-back.png';

const BForgotPass = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showReEnterPassword, setShowReEnterPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [reEnterPassword, setReEnterPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (password.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }
    
    if (password !== reEnterPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    // Success
    alert('Password reset successful!');
    navigate('/a_acc_mod/'); // Redirect to sign in
  };

  useEffect(() => {
          document.title = 'Forgot Pass | Change Pass - Fit4School';
        }, []);

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

        <h3 className="text-xl font-bold mt-3 mb-4">Reset Password</h3>
        <p className="text-gray-600 mb-6">Enter your new password</p>

        <form onSubmit={handleSubmit}>
          {/* New Password Input */}
          <div className="relative mb-4">
            <input
              className="w-full border p-2 border-gray-300 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-green-400"
              type={showPassword ? 'text' : 'password'}
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 focus:outline-none"
            >
              <img
                src={showPassword ? eyeOffIcon : eyeIcon}
                alt="Toggle password visibility"
                className="w-5 h-5"
              />
            </button>
          </div>

          {/* Re-enter Password Input */}
          <div className="relative mb-6">
            <input
              className="w-full border p-2 border-gray-300 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-green-400"
              type={showReEnterPassword ? 'text' : 'password'}
              placeholder="Re-enter Password"
              value={reEnterPassword}
              onChange={(e) => setReEnterPassword(e.target.value)}
              required
            />
            
            <button
              type="button"
              onClick={() => setShowReEnterPassword(!showReEnterPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 focus:outline-none"
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
            className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition"
          >
            CONFIRM
          </button>

          <button
            type="button"
            className="w-full mt-6 font-semibold text-cyan-500 hover:underline"
            onClick={() => navigate('/a_acc_mod/')}
          >
            Back to Sign in
          </button>
        </form>
      </div>
    </div>
  );
};

export default BForgotPass;