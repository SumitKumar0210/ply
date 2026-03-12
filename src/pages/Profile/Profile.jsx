import React, { useState } from "react";
import {
    Box,
    Grid,
    Paper,
    Avatar,
    Typography,
    TextField,
    Button,
    Radio,
    RadioGroup,
    FormControlLabel,
    MenuItem,
    IconButton,
    InputAdornment
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

import { Formik, Form } from "formik";
import * as Yup from "yup";
import { alpha } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import dayjs from "dayjs";

const profileSchema = Yup.object({
    firstName: Yup.string().required("Required"),
    lastName: Yup.string().required("Required"),
    email: Yup.string().email().required("Required"),
});

const passwordSchema = Yup.object({
    currentPassword: Yup.string().required("Required"),
    newPassword: Yup.string().min(6).required("Required"),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref("newPassword")], "Passwords must match")
        .required("Required"),
});

export default function Profile() {

    const [tab, setTab] = useState("profile");
    const [image, setImage] = useState("https://placehold.co/200x200/png/?text=Profile+Image");

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(URL.createObjectURL(file));
        }
    };

    return (
        <Box>
            <Grid container spacing={3}>

                {/* LEFT SIDEBAR */}

                <Grid size={{ xs: 12, md: 3 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            borderRadius: "16px",
                            textAlign: "center",
                            height: "100%"
                        }}
                    >

                        <Box sx={{ position: "relative", display: "inline-block" }}>
                            <Avatar src={image} sx={{ width: 110, height: 110, border: "1px solid #b6b6b6" }} />

                            <IconButton
                                component="label"
                                sx={{
                                    position: "absolute",
                                    bottom: 0,
                                    right: 0,
                                    background: "#8b28fc",
                                    color: "#fff",
                                    width: 28,
                                    height: 28,
                                    "&:hover": {
                                    background: "#000",
                                    },
                                }}
                            >
                                <EditIcon sx={{ fontSize: 16 }} />
                                <input hidden type="file" onChange={handleImageUpload} />
                            </IconButton>
                        </Box>

                        <Typography fontWeight={500} mt={1} fontSize={16}>
                            Amit Kumar
                        </Typography>

                        <Typography color="text.secondary" fontSize={14}>
                            Admin
                        </Typography>

                        <Box mt={3} display="flex" flexDirection="column" gap={2}>

                            <Button
                                onClick={() => setTab("profile")}
                                sx={(theme) => ({
                                    justifyContent: "flex-start",
                                    mt: 0,
                                    background:
                                        tab === "profile"
                                            ? alpha(theme.palette.primary.main, 0.12)
                                            : "#f7f7f7",
                                    textTransform: "none",
                                    px: 3,
                                    color:
                                        tab === "profile"
                                            ? theme.palette.primary.main
                                            : "#777",
                                })}
                            >
                                Personal Information
                            </Button>

                            <Button
                                onClick={() => setTab("password")}
                                sx={(theme) => ({
                                    justifyContent: "flex-start",
                                    mt: 0,
                                    background:
                                        tab === "password"
                                            ? alpha(theme.palette.primary.main, 0.12)
                                            : "#f7f7f7",
                                    textTransform: "none",
                                    px: 3,
                                    color:
                                        tab === "password"
                                            ? theme.palette.primary.main
                                            : "#777",
                                })}
                            >
                                Login & Password
                            </Button>
                            {/* <Button
                                onClick={() => alert("Logged out")}
                                sx={(theme) => ({
                                    justifyContent: "flex-start",
                                    mt:0,
                                    background: "#f7f7f7",
                                    textTransform: "none",
                                    px: 3,
                                    color: "#777",
                                    "&:hover": {
                                    background: alpha(theme.palette.primary.main, 0.08),
                                    color: theme.palette.primary.main,
                                    },
                                })}
                                >
                                Log Out
                                </Button> */}
                        </Box>
                    </Paper>
                </Grid>

                {/* RIGHT CONTENT */}

                <Grid size={{ xs: 12, md: 9 }}>

                    {tab === "profile" && (

                        <Paper elevation={0} sx={{ p: 4, borderRadius: "16px" }}>

                            <Typography fontWeight={500} mb={2} fontSize={18}>
                                Personal Information
                            </Typography>

                            <Formik
                                initialValues={{
                                    gender: "male",
                                    firstName: "Amit",
                                    lastName: "Kumar",
                                    email: "amitKumar@mail.com",
                                    address: "Bailey Road, Patna, Bihar",
                                    phone: "+91 8789737462",
                                    dob: dayjs("1995-02-01"),
                                    location: "Bihar, Patna",
                                    postalCode: "801503"
                                }}
                                validationSchema={profileSchema}
                                onSubmit={(values) => console.log(values)}
                            >
                                {({ values, handleChange, setFieldValue }) => (
                                    <Form>

                                        <RadioGroup
                                            row
                                            name="gender"
                                            value={values.gender}
                                            onChange={handleChange}
                                            sx={{ mb: 3 }}
                                        >
                                            <FormControlLabel value="male" control={<Radio />} label="Male" />
                                            <FormControlLabel value="female" control={<Radio />} label="Female" />
                                        </RadioGroup>

                                        <Grid container spacing={3}>

                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    label="First Name"
                                                    name="firstName"
                                                    value={values.firstName}
                                                    onChange={handleChange}
                                                    fullWidth
                                                    size="small"
                                                />
                                            </Grid>

                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    label="Last Name"
                                                    name="lastName"
                                                    value={values.lastName}
                                                    onChange={handleChange}
                                                    fullWidth
                                                    size="small"
                                                />
                                            </Grid>

                                            <Grid size={{ xs: 12 }}>
                                                <TextField
                                                    label="Email"
                                                    name="email"
                                                    value={values.email}
                                                    onChange={handleChange}
                                                    fullWidth
                                                    size="small"
                                                    InputProps={{
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                <Box
                                                                    sx={{
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        color: "#16a34a",
                                                                        fontSize: 13
                                                                    }}
                                                                >
                                                                    <CheckCircleIcon sx={{ fontSize: 16, mr: .5 }} />
                                                                    Verified
                                                                </Box>
                                                            </InputAdornment>
                                                        )
                                                    }}
                                                />
                                            </Grid>

                                            <Grid size={{ xs: 12 }}>
                                                <TextField
                                                    label="Address"
                                                    name="address"
                                                    value={values.address}
                                                    onChange={handleChange}
                                                    fullWidth
                                                    size="small"
                                                />
                                            </Grid>

                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    label="Phone Number"
                                                    name="phone"
                                                    value={values.phone}
                                                    onChange={handleChange}
                                                    fullWidth
                                                    size="small"
                                                />
                                            </Grid>

                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                    <DatePicker
                                                        label="Date of Birth"
                                                        value={values.dob}
                                                        onChange={(value) => setFieldValue("dob", value)}
                                                        slots={{ openPickerIcon: CalendarMonthIcon }}
                                                        slotProps={{
                                                            textField: {
                                                                fullWidth: true,
                                                                size: "small"
                                                            }
                                                        }}
                                                    />
                                                </LocalizationProvider>
                                            </Grid>

                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    select
                                                    label="Location"
                                                    name="location"
                                                    value={values.location}
                                                    onChange={handleChange}
                                                    fullWidth
                                                    size="small"
                                                >
                                                    <MenuItem value="Bihar, Patna">Bihar, Patna</MenuItem>
                                                    {/* <MenuItem value="New York, USA">New York, USA</MenuItem> */}
                                                </TextField>
                                            </Grid>

                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    label="Postal Code"
                                                    name="postalCode"
                                                    value={values.postalCode}
                                                    onChange={handleChange}
                                                    fullWidth
                                                    size="small"
                                                />
                                            </Grid>

                                        </Grid>

                                        <Box mt={4} display="flex" justifyContent="space-between">

                                            <Button
                                                variant="outlined"
                                                color="secondary"
                                            >
                                                Discard Changes
                                            </Button>

                                            <Button
                                                type="submit"
                                                variant="contained"
                                                color="primary"
                                            >
                                                Save Changes
                                            </Button>

                                        </Box>

                                    </Form>
                                )}
                            </Formik>
                        </Paper>
                    )}

                    {/* PASSWORD TAB */}

                    {tab === "password" && (

                        <Paper elevation={0} sx={{ p: 4, borderRadius: "24px" }}>

                            <Typography fontWeight={500} mb={2} fontSize={18}>
                                Change Password
                            </Typography>

                            <Formik
                                initialValues={{
                                    currentPassword: "",
                                    newPassword: "",
                                    confirmPassword: ""
                                }}
                                validationSchema={passwordSchema}
                                onSubmit={(values) => console.log(values)}
                            >
                                {({ values, handleChange }) => (
                                    <Form>

                                        <Grid container spacing={3}>

                                            <Grid size={{ xs: 12 }}>
                                                <TextField
                                                    label="Current Password"
                                                    type="password"
                                                    name="currentPassword"
                                                    value={values.currentPassword}
                                                    onChange={handleChange}
                                                    fullWidth
                                                    size="small"
                                                />
                                            </Grid>

                                            <Grid size={{ xs: 12 }}>
                                                <TextField
                                                    label="New Password"
                                                    type="password"
                                                    name="newPassword"
                                                    value={values.newPassword}
                                                    onChange={handleChange}
                                                    fullWidth
                                                    size="small"
                                                />
                                            </Grid>

                                            <Grid size={{ xs: 12 }}>
                                                <TextField
                                                    label="Confirm Password"
                                                    type="password"
                                                    name="confirmPassword"
                                                    value={values.confirmPassword}
                                                    onChange={handleChange}
                                                    fullWidth
                                                    size="small"
                                                />
                                            </Grid>

                                        </Grid>

                                        <Box mt={4} textAlign="right">

                                            <Button
                                                type="submit"
                                                variant="contained"
                                                color="primary"
                                            >
                                                Update Password
                                            </Button>

                                        </Box>

                                    </Form>
                                )}
                            </Formik>

                        </Paper>
                    )}

                </Grid>

            </Grid>
        </Box>
    );
}