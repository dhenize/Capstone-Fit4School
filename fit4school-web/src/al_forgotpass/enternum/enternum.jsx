import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import arrowBack from '../../assets/icons/arrow-back.png';

const EnterNum = () => {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/a_forgotpass");
  };

  useEffect(() => {
        document.title = 'Forgot Pass | OTP - Fit4School';
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
        
        <form
          className="w-full max-w-sm bg-white p-3"
          onSubmit={handleSubmit}
        >
          <h3 className="text-xl font-bold mt-3 mb-4">Forgot Password</h3>
          <p className="text-gray-600 mb-2 text-left">Please enter your registered mobile number.</p>

          <input
            className="w-full border p-2 border-gray-300 mb-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            inputMode="numeric"  
            type="tel"
            placeholder="09XXXXXXXXX"
            maxLength="11"
            pattern={"^09\\d{9}$"}
            onInput={(e) => {
              e.target.value = e.target.value.replace(/\D/g, "");
            }}
            required
          />

          <button
            type="button"
            className="text-sm mb-6 text-cyan-500 hover:underline"
            onClick={() => navigate('/entermail')}
          >
            Send OTP to email
          </button>

          <button
            type="submit"
            className="font-bold w-full bg-green-400 text-white p-2 rounded-lg hover:bg-green-600 transition-all"
          >
            CONFIRM
          </button>
          
          <button
            type="button"
            className="w-full mt-12 font-semibold text-cyan-500 hover:underline"
            onClick={() => navigate('/a_acc_mod/')}
          >
            Back to Sign in
          </button>
        </form>
      </div>
    </div>
  );
};

export default EnterNum;
