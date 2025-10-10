import { configureStore } from '@reduxjs/toolkit';
import userTypeReducer from '../pages/settings/slices/userTypeSlice';
import authReducer from '../pages/auth/authSlice';
import departmentReducer from '../pages/settings/slices/departmentSlice';
import groupReducer from '../pages/settings/slices/groupSlice';
import categoryReducer from '../pages/settings/slices/categorySlice';
import unitOfMeasurementsReducer from '../pages/settings/slices/unitOfMeasurementsSlice';
import gradeReducer from '../pages/settings/slices/gradeSlice';
import branchReducer from '../pages/settings/slices/branchSlice';
import vendorReducer from '../pages/settings/slices/vendorSlice';
import materialReducer from '../pages/settings/slices/materialSlice';
import generalSettingReducer from '../pages/settings/slices/generalSettingSlice';
import machineReducer from '../pages/settings/slices/machineSlice';
import productReducer from '../pages/settings/slices/productSlice';
import stateReducer from '../pages/settings/slices/stateSlice';
import customerReducer from '../pages/Users/slices/customerSlice';
import userReducer from '../pages/users/slices/userSlice';
import labourReducer from '../pages/users/slices/labourSlice';
import purchaseOrderReducer from '../pages/Vendor/slice/purchaseOrderSlice';
export const store = configureStore({
    reducer : {
         userType: userTypeReducer,
         auth: authReducer,
         department: departmentReducer,
         group: groupReducer,
         category: categoryReducer,
         unitOfMeasurement: unitOfMeasurementsReducer,
         grade: gradeReducer,
         branch: branchReducer,
         vendor: vendorReducer,
         material: materialReducer,
         machine: machineReducer,
         product: productReducer,
         customer: customerReducer,
         state: stateReducer,
         user: userReducer,
         labour: labourReducer,
         purchaseOrder: purchaseOrderReducer,
         generalSetting: generalSettingReducer,
    }
})