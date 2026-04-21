import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/RegistrationPage.css';

const RegistrationPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullname: '',
    password: '',
    confirmPassword: '',
    avatar: null,
    coverImage: null,
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '...' }

  const navigate = useNavigate();
  const formRef = useRef(null); // Reference to the form container

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'avatar' || name === 'coverImage') {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validate = () => {
    const errs = {};

    if (!formData.username.trim()) errs.username = 'Username is required';
    if (!formData.email.trim()) errs.email = 'Email is required';
    if (!formData.password.trim()) errs.password = 'Password is required';
    if (!formData.confirmPassword.trim())
      errs.confirmPassword = 'Confirm Password is required';

    if (formData.password && formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        errs.confirmPassword = 'Passwords do not match';
      }
    }

    if (!formData.avatar) errs.avatar = 'Avatar image is required';

    return errs;
  };

  const scrollToTop = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
    // Also ensure page scrolls up
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    setMessage(null);

    if (Object.keys(errs).length === 0) {

      const data = new FormData();
      data.append('username', formData.username);
      data.append('email', formData.email);
      data.append('fullname', formData.fullname);
      data.append('password', formData.password);
      data.append('avatar', formData.avatar);

      if (formData.coverImage) data.append('coverImage', formData.coverImage);

      try {
        const response = await fetch(
          'http://localhost:8000/api/v1/user/register',
          {
            method: 'POST',
            body: data,
          }
        );

        const result = await response.json();
        console.log(result);

        if (result.success) {
          setMessage({ type: 'success', text: 'Registration successful! Redirecting...' });
          scrollToTop(); 

          setTimeout(() => {
            navigate('/login'); 
          }, 2000);
        } else {
          const errorMsg = result.message || 'Registration failed. Please try again.';
          setMessage({ type: 'error', text: errorMsg });
          scrollToTop(); 
        }
      } catch (error) {
        console.error('Error:', error);
        setMessage({ type: 'error', text: 'Network error. Please check your connection.' });
        scrollToTop(); 
      }
    } else {
      scrollToTop();
    }
  };

  return (
    <div className="reg-registration-page-container">
      <form
        ref={formRef}
        className="reg-registration-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="reg-registration-logo">
          <img src="/logo.png" alt="PLAY logo" />
        </div>

        {/* Toast Message */}
        {message && (
          <div
            className={`reg-message reg-message-${message.type}`}
            role="alert"
          >
            {message.text}
          </div>
        )}

        {/* Username */}
        <label htmlFor="username">
          Username<span className="reg-required">*</span>
        </label>
        <input
          id="username"
          name="username"
          type="text"
          placeholder="Enter your username"
          value={formData.username}
          onChange={handleChange}
          className={errors.username ? 'reg-input-error' : ''}
        />
        {errors.username && <p className="reg-error-msg">{errors.username}</p>}

        {/* Email */}
        <label htmlFor="email">
          Email<span className="reg-required">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
          className={errors.email ? 'reg-input-error' : ''}
        />
        {errors.email && <p className="reg-error-msg">{errors.email}</p>}

        {/* Full Name (optional) */}
        <label htmlFor="fullname">Full Name (optional)</label>
        <input
          id="fullname"
          name="fullname"
          type="text"
          placeholder="Enter your full name"
          value={formData.fullname}
          onChange={handleChange}
        />

        {/* Password */}
        <label htmlFor="password">
          Password<span className="reg-required">*</span>
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          className={errors.password ? 'reg-input-error' : ''}
        />
        {errors.password && <p className="reg-error-msg">{errors.password}</p>}

        {/* Confirm Password */}
        <label htmlFor="confirmPassword">
          Confirm Password<span className="reg-required">*</span>
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          className={errors.confirmPassword ? 'reg-input-error' : ''}
        />
        {errors.confirmPassword && (
          <p className="reg-error-msg">{errors.confirmPassword}</p>
        )}

        {/* Avatar */}
        <label htmlFor="avatar">
          Avatar Image<span className="reg-required">*</span>
        </label>
        <input
          id="avatar"
          name="avatar"
          type="file"
          accept="image/*"
          onChange={handleChange}
          className={errors.avatar ? 'reg-input-error' : ''}
        />
        {errors.avatar && <p className="reg-error-msg">{errors.avatar}</p>}

        {/* Cover Image (optional) */}
        <label htmlFor="coverImage">Cover Image (optional)</label>
        <input
          id="coverImage"
          name="coverImage"
          type="file"
          accept="image/*"
          onChange={handleChange}
        />

        <button type="submit" className="reg-submit-btn">
          Sign up with Email
        </button>
      </form>
    </div>
  );
};

export default RegistrationPage;