import { createSlice } from '@reduxjs/toolkit';
import { loader } from '../utils/constants';

export const loaderSlice = createSlice({
  name: loader,
  initialState: {
    display: 'none', // Controls loader visibility ('block' or 'none')
    error: '', // Error message
    user: null, // Stores user details
  },
  reducers: {
    CustomLoader: (state, action) => {
      state.display = action.payload === 'enable' ? 'block' : 'none';
    },
    setErrorMessage: (state, action) => {
      state.error = action.payload;
      state.isLogin = false; // Optionally handle login state when error occurs
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
});

export const { CustomLoader, setErrorMessage, setUser } = loaderSlice.actions;
export default loaderSlice.reducer;
