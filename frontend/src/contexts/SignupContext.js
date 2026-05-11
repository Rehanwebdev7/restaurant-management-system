import React, { createContext, useState, useContext } from 'react';

const SignupContext = createContext();

export const SignupProvider = ({ children }) => {
  const [signupData, setSignupData] = useState({
    mobile: '',
    restaurantId: null,
    signupToken: '',
    step: 'mobile'
  });

  const updateSignupData = (data) => {
    setSignupData(prev => ({ ...prev, ...data }));
  };

  return (
    <SignupContext.Provider value={{ signupData, updateSignupData }}>
      {children}
    </SignupContext.Provider>
  );
};

export const useSignup = () => {
  const context = useContext(SignupContext);
  if (!context) {
    throw new Error('useSignup must be used within SignupProvider');
  }
  return context;
};
