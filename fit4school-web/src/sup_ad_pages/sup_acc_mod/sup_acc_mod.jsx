import { useNavigate, Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import eyeIcon from '../../assets/icons/eye.svg';
import eyeOffIcon from '../../assets/icons/eye-closed.svg';

const SupAccMod = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const SUPERADMIN_USERNAME = "SuperAdmin@CST";
  const SUPERADMIN_PASSWORD = "CapstoneFit4School@CST072025";

  const handleSignIn = (e) => {
    e.preventDefault();
    setError('');

    if (email === SUPERADMIN_USERNAME && password === SUPERADMIN_PASSWORD) {
      navigate('/sup_ad_admin');
    } else {
      setError('Invalid email or password. Please try again.');
    }
  };

  useEffect(() => {
    document.title = 'Super Admin Sign In - Fit4School';
  }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Left Section */}
      <div className="flex-1 bg-green-500 flex flex-col items-center justify-center text-white p-8 md:p-0">
        <h3 className="font-semibold text-sm md:text-sm">WELCOME SUPER ADMIN TO</h3>
        <h1 className="font-bold text-xl sm:text-3xl mt-2 tracking-wide">
          <Link to="/a_acc_mod" className="hover:opacity-80 transition">
            FIT4SCHOOL
          </Link>
        </h1>
        <p className="mt-4 text-xs md:text-base opacity-90 text-center px-4 md:px-0">
          Your school uniform assistant.
        </p>
      </div>

      {/* Right Section */}
      <div className="flex-1 bg-white flex items-center justify-center p-6 sm:p-10">
        <form
          className="w-full max-w-sm bg-white p-6"
          onSubmit={handleSignIn}
        >
          <h2 className="text-2xl font-bold mb-8 text-gray-800 text-center">Sign In</h2>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <input
            className="w-full border p-2 border-gray-300 mb-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            type="email"
            placeholder="Username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="relative mb-3">
            <input
              className="w-full border p-2 border-gray-300 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-green-400"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
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

          <div className="flex justify-between items-center mb-6 text-xs sm:text-sm font-medium">
            <button
              type="button"
              className="text-cyan-500 hover:underline"
              onClick={() => navigate('/entermail')}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="font-bold w-full bg-cyan-500 text-white p-2 rounded-lg hover:bg-blue-500 transition-all"
          >
            SIGN IN
          </button>
        </form>
      </div>
    </div>
  );
}

export default SupAccMod;