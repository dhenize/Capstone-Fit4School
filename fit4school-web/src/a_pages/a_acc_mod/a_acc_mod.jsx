//A_ACC_MOD.JSX
import { useNavigate, Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

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
      // Sign in with Firebase Authentication
      const res = await signInWithEmailAndPassword(auth, email, password);
      const user = res.user;
      console.log("Firebase Auth User UID:", user.uid);

      // Query accounts collection to find user by firebase_uid (FIRST PRIORITY)
      const accountsRef = collection(db, "accounts");
      const q = query(accountsRef, where("firebase_uid", "==", user.uid));
      const querySnapshot = await getDocs(q);

      let userDoc;
      
      if (!querySnapshot.empty) {
        // Found by firebase_uid
        userDoc = querySnapshot.docs[0];
        console.log("Found user by firebase_uid");
      } else {
        // If not found by firebase_uid, try by email as fallback
        console.log("User not found by firebase_uid, trying email...");
        const emailQuery = query(accountsRef, where("email", "==", email));
        const emailSnapshot = await getDocs(emailQuery);
        
        if (!emailSnapshot.empty) {
          userDoc = emailSnapshot.docs[0];
          console.log("Found user by email");
        } else {
          setError("Account not found in database. Please contact admin.");
          setLoading(false);
          return;
        }
      }

      // Get the user document data
      const userData = userDoc.data();
      console.log("User Data from Firestore:", userData);
      console.log("User gen_roles:", userData.gen_roles);
      
      const gen_roles = userData.gen_roles;
      const status = userData.status;

      // Check if account is active
      if (status !== "active") {
        setError("Account is not active. Please contact admin.");
        setLoading(false);
        return;
      }

      // Store user data based on role
      if (gen_roles === "admin") {
        console.log("Redirecting to admin: /a_orders");
        localStorage.setItem('adminData', JSON.stringify({
          admin_id: userData.admin_id,
          fname: userData.fname,
          lname: userData.lname,
          gen_roles: userData.gen_roles,
          email: userData.email,
          status: userData.status,
          firebase_uid: userData.firebase_uid,
          temporary_pass: userData.temporary_pass,
          created_at: userData.created_at,
          updated_at: userData.updated_at
        }));
        navigate("/a_orders");
      } else if (gen_roles === "accountant") {
        console.log("Redirecting to accountant: /ac_dashboard");
        localStorage.setItem('accountantData', JSON.stringify({
          acc_id: userData.acc_id,
          fname: userData.fname,
          lname: userData.lname,
          gen_roles: userData.gen_roles,
          email: userData.email,
          status: userData.status,
          firebase_uid: userData.firebase_uid,
          temporary_pass: userData.temporary_pass,
          created_at: userData.created_at,
          updated_at: userData.updated_at
        }));
        navigate("/ac_dashboard");
      } else {
        console.log("Unauthorized role:", gen_roles);
        setError("Unauthorized access. This portal is for admin and accountant only.");
      }

    } catch (err) {
      console.error("Login error:", err);
      
      // More specific error messages
      if (err.code === 'auth/invalid-credential') {
        setError("Invalid email or password. Please use your temporary password.");
      } else if (err.code === 'auth/user-not-found') {
        // If user not found in Authentication, check if they exist in Firestore
        try {
          const accountsRef = collection(db, "accounts");
          const q = query(accountsRef, where("email", "==", email));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            
            if (userData.gen_roles === "accountant") {
              setError("Accountant account found but not in authentication. Please contact admin to create your authentication account.");
            } else {
              setError("Account found but not in authentication. Please contact admin.");
            }
          } else {
            setError("Account not found. Please check your email.");
          }
        } catch (firestoreError) {
          setError("Invalid email or password. Please try again.");
        }
      } else if (err.code === 'auth/wrong-password') {
        setError("Incorrect password. Please use the temporary password provided.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError("Login failed. Please try again.");
      }
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