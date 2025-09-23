import { configureStore } from '@reduxjs/toolkit';
import userTypeReducer from '../pages/settings/slices/userTypeSlice';
import authReducer from '../pages/auth/authSlice';
import departmentReducer from '../pages/settings/slices/departmentSlice';

export const store = configureStore({
    reducer : {
         userType: userTypeReducer,
         auth: authReducer,
         department: departmentReducer,
    }
})