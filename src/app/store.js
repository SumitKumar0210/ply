import { configureStore } from '@reduxjs/toolkit';
import userTypeReducer from '../pages/settings/slices/userTypeSlice';
import authReducer from '../pages/auth/authSlice';
import departmentReducer from '../pages/settings/slices/departmentSlice';
import groupReducer from '../pages/settings/slices/groupSlice';
import categoryReducer from '../pages/settings/slices/categorySlice';

export const store = configureStore({
    reducer : {
         userType: userTypeReducer,
         auth: authReducer,
         department: departmentReducer,
         group: groupReducer,
         category: categoryReducer,
    }
})