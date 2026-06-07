//LoginRoutes.js

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/auth/Login";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import VerifyOtp from "../pages/auth/VerifyOtp";
import SignupMobile from "../pages/auth/signup/SignupMobile";
import SignupOtp from "../pages/auth/signup/SignupOtp";
import SignupBusinessDetails from "../pages/auth/signup/SignupBusinessDetails";
import SignupBusinessDocuments from "../pages/auth/signup/SignupBusinessDocuments";
import SignupSuccess from "../pages/auth/signup/SignupSuccess";
import CustomerLanding from "../pages/modules/Customer/HomePage";
import AboutPage from "../pages/modules/Customer/AboutPage";
import TermsPage from "../pages/modules/Customer/TermsPage";
import PrivacyPage from "../pages/modules/Customer/PrivacyPage";
import RefundPage from "../pages/modules/Customer/RefundPage";
import CustomerLoginPage from "../pages/modules/Customer/LoginPage";
import CustomerProfilePage from "../pages/modules/Customer/ProfilePage";
import CustomerOrdersPage from "../pages/modules/Customer/OrdersPage";
import CustomerAddressesPage from "../pages/modules/Customer/AddressesPage";
import PaymentResponsePage from "../pages/modules/Customer/PaymentResponsePage";
import LocationPage from "../pages/modules/Customer/LocationPage";

const LoginRoutes = () => {
    return (
        <>
            <Routes>
                {/* Payment Response - Must be first to avoid conflicts */}
                <Route
                    path="/payment-response"
                    element={
                        <PaymentResponsePage />
                    }
                />
                <Route
                    path="/customer/payment-response"
                    element={
                        <PaymentResponsePage />
                    }
                />
                <Route
                    path="/"
                    element={
                        <Login />
                    }
                />
                <Route
                    path="/menu"
                    element={
                        <CustomerLanding />
                    }
                />
                <Route
                    path="/home"
                    element={
                        <CustomerLanding />
                    }
                />
                <Route
                    path="/signature"
                    element={
                        <CustomerLanding />
                    }
                />
                <Route
                    path="/why-us"
                    element={
                        <CustomerLanding />
                    }
                />
                <Route
                    path="/gallery"
                    element={
                        <CustomerLanding />
                    }
                />
                <Route
                    path="/contact"
                    element={
                        <CustomerLanding />
                    }
                />
                <Route
                    path="/about"
                    element={
                        <AboutPage />
                    }
                />
                <Route
                    path="/terms"
                    element={
                        <TermsPage />
                    }
                />
                <Route
                    path="/privacy"
                    element={
                        <PrivacyPage />
                    }
                />
                <Route
                    path="/refund"
                    element={
                        <RefundPage />
                    }
                />
                <Route
                    path="/login"
                    element={
                        <CustomerLoginPage />
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <CustomerProfilePage />
                    }
                />
                <Route
                    path="/orders"
                    element={
                        <CustomerOrdersPage />
                    }
                />
                <Route
                    path="/addresses"
                    element={
                        <CustomerAddressesPage />
                    }
                />
                <Route
                    path="/location"
                    element={
                        <LocationPage />
                    }
                />
                <Route
                    path="/admin"
                    element={
                        <Login />
                    }
                />
                <Route
                    path="/forgot-password"
                    element={
                        <ForgotPassword />
                    }
                />
                <Route
                    path="/reset-password"
                    element={
                        <ResetPassword />
                    }
                />
                <Route
                    path="/verify-otp"
                    element={
                        <VerifyOtp />
                    }
                />
                <Route
                    path="/signup"
                    element={
                        <SignupMobile />
                    }
                />
                <Route
                    path="/signup/otp"
                    element={
                        <SignupOtp />
                    }
                />
                <Route
                    path="/signup/business"
                    element={
                        <SignupBusinessDetails />
                    }
                />
                <Route
                    path="/signup/business-documents"
                    element={
                        <SignupBusinessDocuments />
                    }
                />
                <Route
                    path="/signup/success"
                    element={
                        <SignupSuccess />
                    }
                />
                {/* Catch-all route for debugging */}
                <Route
                    path="*"
                    element={
                        <div style={{ padding: '50px', textAlign: 'center' }}>
                            <h1>404 - Page Not Found</h1>
                            <p>Path: {window.location.pathname}</p>
                            <button onClick={() => window.location.href = '/'}>Go Home</button>
                        </div>
                    }
                />
            </Routes>
        </>

    );
};

export default LoginRoutes;
