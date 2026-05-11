import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SignupProvider } from '../contexts/SignupContext';
import SignupMobile from '../pages/auth/signup/SignupMobile';
import SignupOtp from '../pages/auth/signup/SignupOtp';
import SignupPan from '../pages/auth/signup/SignupPan';
import SignupPanUpload from '../pages/auth/signup/SignupPanUpload';
import SignupAadhaar from '../pages/auth/signup/SignupAadhaar';
import SignupAadhaarOtp from '../pages/auth/signup/SignupAadhaarOtp';
import SignupAadhaarUpload from '../pages/auth/signup/SignupAadhaarUpload';
import SignupBusinessDetails from '../pages/auth/signup/SignupBusinessDetails';
import SignupBusinessDocuments from '../pages/auth/signup/SignupBusinessDocuments';
import SignupSuccess from '../pages/auth/signup/SignupSuccess';

const SignupRoutes = () => (
  <SignupProvider>
    <Routes>
      <Route index element={<SignupMobile />} />
      <Route path="mobile" element={<SignupMobile />} />
      <Route path="otp" element={<SignupOtp />} />
      <Route path="pan" element={<SignupPan />} />
      <Route path="pan-upload" element={<SignupPanUpload />} />
      <Route path="aadhaar" element={<SignupAadhaar />} />
      <Route path="aadhaar-otp" element={<SignupAadhaarOtp />} />
      <Route path="aadhaar-upload" element={<SignupAadhaarUpload />} />
      <Route path="business" element={<SignupBusinessDetails />} />
      <Route path="business-documents" element={<SignupBusinessDocuments />} />
      <Route path="success" element={<SignupSuccess />} />
      <Route path="*" element={<Navigate to="mobile" replace />} />
    </Routes>
  </SignupProvider>
);

export default SignupRoutes;


