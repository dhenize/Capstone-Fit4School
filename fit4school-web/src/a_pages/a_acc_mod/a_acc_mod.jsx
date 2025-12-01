import { useNavigate, Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../../firebase";
import { doc, getDoc } from "firebase/firestore";

import eyeIcon from '../../assets/icons/eye.svg';
import eyeOffIcon from '../../assets/icons/eye-closed.svg';

const AAccMod = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Sign In - Fit4School';
  }, []);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1️⃣ Sign in user
      const res = await signInWithEmailAndPassword(auth, email, password);
      const user = res.user;

      // 2️⃣ Fetch user data from Firestore
      const userRef = doc(db, "accounts", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setError("Account not found. Please contact admin.");
        setLoading(false);
        return;
      }

      const userData = userSnap.data();
      const gen_roles = userData.gen_roles;

      // 3️⃣ Store user data in localStorage for use in sidebar
      localStorage.setItem('accountantData', JSON.stringify({
        fname: userData.fname,
        lname: userData.lname,
        gen_roles: userData.gen_roles,
        email: userData.email
      }));

      // 4️⃣ Redirect user based on role
      if (gen_roles === "admin") {
        navigate("/a_orders");
      } else if (gen_roles === "accountant") {
        navigate("/ac_payments");
      } else if (gen_roles === "user") {
        navigate("/user_dashboard");
      } else {
        setError("Unknown role. Contact administrator.");
      }

    } catch (err) {
      console.error(err);
      setError("Invalid email or password.");
    }

    setLoading(false);
  };


  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Left Side */}
      <div className="flex-1 bg-green-500 flex flex-col items-center justify-center text-white p-8 md:p-0">
        <h3 className="font-semibold text-sm">WELCOME TO</h3>
        <h1 className="font-bold text-xl sm:text-3xl mt-2 tracking-wide">
          <Link to="/sup_acc_mod" className="hover:opacity-80 transition">
            FIT4SCHOOL
          </Link>
        </h1>
        <p className="mt-4 text-xs md:text-base opacity-90 text-center px-4">
          Your school uniform assistant.
        </p>
      </div>

      {/* Right Side */}
      <div className="flex-1 bg-white flex items-center justify-center p-6 sm:p-10">
        <form className="w-full max-w-sm" onSubmit={handleSignIn}>

          <h2 className="text-2xl font-bold mb-8 text-gray-800 text-center">Sign In</h2>

          {error && (
            <p className="text-red-600 text-sm mb-3 text-center">{error}</p>
          )}

          {/* Email */}
          <input
            className="w-full border p-2 border-gray-300 mb-3 rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-green-400"
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Password */}
          <div className="relative mb-3">
            <input
              className="w-full border p-2 border-gray-300 rounded-lg pr-10 
              focus:outline-none focus:ring-2 focus:ring-green-400"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <img
                src={showPassword ? eyeOffIcon : eyeIcon}
                alt="toggle password visibility"
                className="w-5 h-5"
              />
            </button>
          </div>

          <div className="flex justify-between items-center mb-6 text-xs sm:text-sm font-medium">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2 accent-green-600" />
              Remember Password
            </label>

            <button
              type="button"
              className="text-cyan-500 hover:underline"
              onClick={() => navigate('/entermail')}
            >
              Forgot Password?
            </button>
          </div>

          {/* SIGN IN BUTTON */}
          <button
            type="submit"
            className="font-bold w-full bg-cyan-500 text-white p-2 rounded-lg hover:bg-blue-500 transition-all"
            disabled={loading}
          >
            {loading ? "Signing In..." : "SIGN IN"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AAccMod;
