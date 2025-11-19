import * as Yup from "yup";

export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[6-9]\d{9}$/,
  pincode: /^[1-9][0-9]{5}$/,
};

export const validators = {
  email: Yup.string()
    .trim()
    .matches(patterns.email, "Please enter a valid email address")
    .min(4, "Email must be at least 4 characters")
    .max(100, "Email cannot exceed 100 characters")
    .required("Email is required"),

  phone: Yup.string()
    .trim()
    .matches(patterns.phone, "Enter a valid 10-digit mobile number")
    .required("Phone number is required"),

  pincode: Yup.string()
    .trim()
    .matches(patterns.pincode, "Enter a valid 6-digit pincode")
    .required("Pincode is required"),
};


// how to use

// import { validators } from "../../utils/validation";

// const validationSchema = Yup.object({
//   email: validators.email,
//   phone: validators.phone,
//   pincode: validators.pincode,
// });