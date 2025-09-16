import { configureStore } from '@reduxjs/toolkit';
import userTypeReducer from '../pages/settings/slices/userTypeSlice';
import authReducer from '../pages/auth/authSlice';

export const store = configureStore({
    reducer : {
         userType: userTypeReducer,
         auth: authReducer,
    }
})