import React, { useState, useRef } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import "./css/LoginPage.css";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    user: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '...' }

  const navigate = useNavigate();
  const formRef = useRef(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.user.trim()) errs.user = "Email or Username is required";
    if (!formData.password) errs.password = "Password is required";
    return errs;
  };

  const scrollToTop = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    setMessage(null);

    if (Object.keys(errs).length === 0) {
      const body = {
        ...(formData.user.includes("@gmail.")
          ? { email: formData.user, username: "" }
          : { email: "", username: formData.user }),
        password: formData.password,
      };

      console.log(body);

      try {
        const response = await fetch(
          "http://localhost:8000/api/v1/user/login",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          }
        );

        const result = await response.json();
        if (response.ok && result.success) {
        const accessToken = result.data.accessToken;
        const refreshToken = result.data.refreshToken;
        const userId = result.data.user._id;
         
        Cookies.set("userId", userId, {
        expires: 10, 
          });

        Cookies.set("accessToken", accessToken, {
        expires: 1, // 1 days
        secure: true,
        sameSite: "strict",
          });

          // 2) Refresh Token cookie (7 days expiry)
          Cookies.set("refreshToken", refreshToken, {
              expires: 10, // 10 days
              secure: true,
              sameSite: "strict",
          });
          setMessage({
            type: "success",
            text: "Login successful! Redirecting...",
          });
          scrollToTop();
          setTimeout(() => {
            navigate("/"); // Change to your dashboard/home route if needed
          }, 3000);

        } else {
          const errorMsg =
            result.message || "Invalid credentials. Please try again.";
          setMessage({ type: "error", text: errorMsg });
          scrollToTop();
        }
      } catch (error) {
        console.error("Login error:", error);
        setMessage({
          type: "error",
          text: "Network error. Please try again later.",
        });
        scrollToTop();
      }
    } else {
      scrollToTop(); // Scroll up if validation fails
    }
  };

  return (
    <div className="log-login-page-container">
      <form
        ref={formRef}
        className="log-login-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="log-login-logo">
          <img src="/logo.png" alt="PLAY logo" />
        </div>

        {/* Toast Message */}
        {message && (
          <div
            className={`log-message log-message-${message.type}`}
            role="alert"
          >
            {message.text}
          </div>
        )}

        <label htmlFor="user">
          Email or Username<span className="log-required">*</span>
        </label>
        <input
          id="user"
          name="user"
          type="text"
          placeholder="Enter your email or username"
          value={formData.user}
          onChange={handleChange}
          className={errors.user ? "log-input-error" : ""}
        />
        {errors.user && <p className="log-error-msg">{errors.user}</p>}

        <label htmlFor="password">
          Password<span className="log-required">*</span>
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          className={errors.password ? "log-input-error" : ""}
        />
        {errors.password && <p className="log-error-msg">{errors.password}</p>}

        <button type="submit" className="log-submit-btn">
          Sign in
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
