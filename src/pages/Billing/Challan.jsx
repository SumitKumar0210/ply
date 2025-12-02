import React, { useState, useRef, useEffect } from "react";
import Grid from "@mui/material/Grid";
import {
    Button,
    Typography,
    Card,
    CardContent,
    Box,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    RadioGroup,
    FormControlLabel,
    Radio,
    IconButton,
    MenuItem,
    FormHelperText,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { useNavigate, useParams } from "react-router-dom";
import { AiOutlinePrinter } from "react-icons/ai";
import { useReactToPrint } from "react-to-print";
import { useDispatch, useSelector } from "react-redux";
import { fetchBillById, dispatchProduct } from "./slice/billsSlice";
import ImagePreviewDialog from "../../components/ImagePreviewDialog/ImagePreviewDialog";
import { useAuth } from "../../context/AuthContext";
import { fetchStates } from "../settings/slices/stateSlice";
import {
    fetchShippingAddressById,
    addShippingAddress,
    deleteShippingAddress
} from "./slice/shippingAddressSlice";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { successMessage, errorMessage } from "../../toast";

const Challan = () => {
    const { id } = useParams();
    const { appDetails } = useAuth();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const contentRef = useRef(null);

    const imageUrl = import.meta.env.VITE_MEDIA_URL;

    const [items, setItems] = useState([]);
    const [quotationDetails, setQuotationDetails] = useState(null);
    const [openShippingModal, setOpenShippingModal] = useState(false);
    const [openAddressModal, setOpenAddressModal] = useState(false);
    const [selectedAddressId, setSelectedAddressId] = useState("");
    const [vehicleNumber, setVehicleNumber] = useState("");
    const [vehicleError, setVehicleError] = useState("");
    const [addressError, setAddressError] = useState("");
    const [customerAddresses, setCustomerAddresses] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [shippingDetailsSubmitted, setShippingDetailsSubmitted] = useState(false);
    const [addressType, setAddressType] = useState("customer");
    const [shippingAddresses, setShippingAddresses] = useState([]);

    const { selected: billData = {}, loading: billLoading } = useSelector((state) => state.bill);
    const { data: states = [] } = useSelector((state) => state.state);
    const { data: fetchedShippingAddresses = [], loading: shippingLoading } = useSelector((state) => state.shippingAddress);

    console.log(fetchedShippingAddresses);
    const customerId = billData.customer_id;

    const addressValidationSchema = Yup.object({
        state_id: Yup.string().required("State is required"),
        city: Yup.string().required("City is required").min(2, "City must be at least 2 characters"),
        zip_code: Yup.string()
            .required("Zip code is required")
            .matches(/^[0-9]{6}$/, "Zip code must be 6 digits"),
        address: Yup.string().required("Address is required").min(5, "Address must be at least 5 characters"),
    });

    const handlePrint = useReactToPrint({
        contentRef,
        documentTitle: `Quote_${quotationDetails?.batch_no || "Invoice"}`,
        pageStyle: `
      @page {
        size: A4 landscape;
        margin: 5mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
    });

    // Load quotation data
    useEffect(() => {
        if (id) {
            dispatch(fetchBillById(id));
        }
    }, [dispatch, id]);

    // Fetch states when modal opens
    useEffect(() => {
        if (openShippingModal || openAddressModal) {
            dispatch(fetchStates());
        }
    }, [openShippingModal, openAddressModal, dispatch]);

    // Fetch shipping addresses when address type changes to "shipping"
    useEffect(() => {
        if (addressType === "shipping" && customerId) {
            dispatch(fetchShippingAddressById(customerId));
        }
    }, [addressType, customerId, dispatch]);

    // Update shipping addresses when fetched from API
    useEffect(() => {
        if (fetchedShippingAddresses && fetchedShippingAddresses.length > 0) {
            console.log(fetchedShippingAddresses);
            console.log('pass');
            setShippingAddresses(fetchedShippingAddresses);
        }
    }, [fetchedShippingAddresses]);

    // Parse and set Bill data
    useEffect(() => {
        if (billData && billData.id) {
            try {
                setItems(billData.product || []);
                setQuotationDetails(billData);

                // Set customer addresses from customer's shipping addresses
                if (billData.customer && billData.customer.shipping_addresses) {
                    setCustomerAddresses(billData.customer.shipping_addresses);
                }

                // Check if shipping_address_id is null - if yes, open modal
                if (!billData.shipping_address_id) {
                    setOpenShippingModal(true);
                    setShippingDetailsSubmitted(false);
                } else {
                    // If shipping_address_id exists, mark as submitted
                    setShippingDetailsSubmitted(true);
                }
            } catch (error) {
                console.error("Error parsing quotation data:", error);
            }
        }
    }, [billData]);

    // Validate vehicle number
    const validateVehicleNumber = (value) => {
        // Remove spaces and convert to uppercase
        const cleanValue = value.replace(/\s+/g, '').toUpperCase();
        
        // Indian vehicle number format: XX00XX0000 or XX-00-XX-0000
        // Examples: MH12AB1234, DL01CA9988, KA05MH1234
        const vehicleRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
        
        if (!value.trim()) {
            setVehicleError("Vehicle number is required");
            return false;
        }
        
        if (!vehicleRegex.test(cleanValue)) {
            setVehicleError("Invalid vehicle number format (e.g., MH12AB1234)");
            return false;
        }
        
        setVehicleError("");
        return true;
    };

    const handleVehicleNumberChange = (e) => {
        const value = e.target.value.toUpperCase();
        setVehicleNumber(value);
        if (vehicleError) {
            validateVehicleNumber(value);
        }
    };

    const handleCloseShippingModal = () => {
        if (isSubmitting) return;

        // Don't allow closing without submission if shipping_address_id is null
        if (!quotationDetails?.shipping_address_id && !shippingDetailsSubmitted) {
            errorMessage("Please provide shipping details before proceeding");
            return;
        }

        setOpenShippingModal(false);
        setSelectedAddressId("");
        setVehicleNumber("");
        setVehicleError("");
        setAddressError("");
        setAddressType("customer");
    };

    const handleAddressTypeChange = (event) => {
        setAddressType(event.target.value);
        setSelectedAddressId("");
        setAddressError("");
    };

    const handleAddressSelection = (addressId) => {
        setSelectedAddressId(addressId);
        setAddressError("");
    };

    const handleOpenAddressModal = () => {
        setOpenAddressModal(true);
    };

    const handleCloseAddressModal = () => {
        setOpenAddressModal(false);
    };

    const handleAddNewAddress = async (values, { resetForm }) => {
        setIsSubmitting(true);
        try {
            const newAddress = {
                state_id: values.state_id,
                city: values.city,
                zip_code: values.zip_code,
                address: values.address,
                customer_id: customerId,
            };

            const res = await dispatch(addShippingAddress(newAddress));
            
            if (res.error) {
                errorMessage("Failed to add address. Please try again.");
                return;
            }

            // Refresh shipping addresses after adding
            await dispatch(fetchShippingAddressById(customerId));
            
            successMessage("Address added successfully");
            resetForm();
            handleCloseAddressModal();
        } catch (error) {
            console.error("Error adding address:", error);
            errorMessage("An error occurred while adding the address.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitShipping = async () => {
        let hasError = false;

        // Validate vehicle number
        if (!validateVehicleNumber(vehicleNumber)) {
            hasError = true;
        }

        // Validate address selection
        if (!selectedAddressId) {
            setAddressError("Please select a shipping address");
            hasError = true;
        } else {
            setAddressError("");
        }

        // If validation fails, stop submission
        if (hasError) {
            return;
        }

        setIsSubmitting(true);
        try {
            let selectedAddress;
            
            // Get selected address based on address type
            if (addressType === "customer") {
                selectedAddress = customerAddresses.find((addr) => addr.id === parseInt(selectedAddressId));
            } else {
                selectedAddress = shippingAddresses.find((addr) => addr.id === parseInt(selectedAddressId));
            }

            if (!selectedAddress) {
                errorMessage("Selected address not found");
                setIsSubmitting(false);
                return;
            }

            // Prepare shipping data
            const shippingData = {
                vehicle_number: vehicleNumber.replace(/\s+/g, '').toUpperCase(),
                shipping_address_id: selectedAddress.id,
                address_type: addressType,
                id: billData.id,
            };

            console.log("Shipping Data:", shippingData);

            // Dispatch update with shipping details
            const result = await dispatch(dispatchProduct(shippingData));

            if (result.error) {
                errorMessage("Failed to submit shipping details. Please try again.");
                return;
            }

            // Mark shipping details as submitted
            setShippingDetailsSubmitted(true);
            
            successMessage("Shipping details submitted successfully");

            // Refresh quotation data
            await dispatch(fetchBillById(id));

            // Close modal
            setOpenShippingModal(false);
        } catch (error) {
            console.error("Error submitting shipping:", error);
            errorMessage("Failed to submit shipping details. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const mediaUrl = import.meta.env.VITE_MEDIA_URL;

    // Format date helper
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    // Show loader while data is loading
    if (billLoading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "60vh",
                }}
            >
                <CircularProgress size={60} />
            </Box>
        );
    }

    // Show modal if shipping details required and not yet submitted
    const shouldShowModal = !quotationDetails?.shipping_address_id && !shippingDetailsSubmitted;

    // Don't show main content if modal is required but not submitted
    if (shouldShowModal) {
        return (
            <>
                {/* Shipping Details Modal */}
                <Dialog
                    open={openShippingModal}
                    onClose={handleCloseShippingModal}
                    maxWidth="sm"
                    fullWidth
                    disableEscapeKeyDown={true}
                >
                    <DialogTitle sx={{ borderBottom: "1px solid #ddd" }}>
                        Shipping Details Required
                        <IconButton
                            aria-label="close"
                            onClick={handleCloseShippingModal}
                            disabled={isSubmitting}
                            sx={{
                                position: "absolute",
                                right: 8,
                                top: 8,
                                color: (theme) => theme.palette.grey[500],
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>

                    <DialogContent sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Vehicle Number"
                            placeholder="e.g., MH12AB1234"
                            value={vehicleNumber}
                            onChange={handleVehicleNumberChange}
                            onBlur={() => validateVehicleNumber(vehicleNumber)}
                            disabled={isSubmitting}
                            error={!!vehicleError}
                            helperText={vehicleError || "Format: XX00XX0000 (e.g., MH12AB1234)"}
                            required
                            sx={{ mb: 3, mt: 2 }}
                        />

                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                Address Type
                            </Typography>
                            <RadioGroup row value={addressType} onChange={handleAddressTypeChange}>
                                <FormControlLabel
                                    value="customer"
                                    control={<Radio disabled={isSubmitting} />}
                                    label="Use Customer Address"
                                />
                                <FormControlLabel
                                    value="shipping"
                                    control={<Radio disabled={isSubmitting} />}
                                    label="Use Shipping Address"
                                />
                            </RadioGroup>
                        </Box>

                        {addressType === "shipping" && (
                            <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    Select Shipping Address
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={handleOpenAddressModal}
                                    disabled={isSubmitting}
                                    size="small"
                                >
                                    Add New Address
                                </Button>
                            </Box>
                        )}

                        {addressType === "customer" ? (
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                    Customer Address
                                </Typography>
                                {customerAddresses.length > 0 ? (
                                    <>
                                        <RadioGroup value={selectedAddressId} onChange={(e) => handleAddressSelection(e.target.value)}>
                                            {customerAddresses.map((address) => (
                                                <FormControlLabel
                                                    key={address.id}
                                                    value={address.id.toString()}
                                                    control={<Radio disabled={isSubmitting} />}
                                                    label={
                                                        <Box sx={{ ml: 1 }}>
                                                            <Typography variant="body2">
                                                                {address.address}, {address.city}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {address.state?.name}, {address.zip_code}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                    sx={{
                                                        border: `1px solid ${addressError ? '#d32f2f' : '#e0e0e0'}`,
                                                        borderRadius: 1,
                                                        mb: 1,
                                                        p: 1,
                                                        "&:hover": {
                                                            backgroundColor: "#f5f5f5",
                                                        },
                                                    }}
                                                />
                                            ))}
                                        </RadioGroup>
                                        {addressError && (
                                            <FormHelperText error sx={{ mt: 1, ml: 2 }}>
                                                {addressError}
                                            </FormHelperText>
                                        )}
                                    </>
                                ) : (
                                    <Box
                                        sx={{
                                            p: 2,
                                            border: "1px solid #e0e0e0",
                                            borderRadius: 1,
                                            backgroundColor: "#f5f5f5",
                                        }}
                                    >
                                        <Typography color="text.secondary" sx={{ textAlign: "center" }}>
                                            No customer address found. Please use shipping address instead.
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        ) : (
                            <Box>
                                {shippingLoading ? (
                                    <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                                        <CircularProgress size={30} />
                                    </Box>
                                ) : (
                                    <>
                                        {shippingAddresses.length > 0 ? (
                                            <>
                                                <RadioGroup value={selectedAddressId} onChange={(e) => handleAddressSelection(e.target.value)}>
                                                    {shippingAddresses.map((address) => {
                                                        const state = states.find((s) => s.id === address.state_id);
                                                        return (
                                                            <FormControlLabel
                                                                key={address.id}
                                                                value={address.id.toString()}
                                                                control={<Radio disabled={isSubmitting} />}
                                                                label={
                                                                    <Box sx={{ ml: 1 }}>
                                                                        <Typography variant="body2">
                                                                            {address.address}, {address.city}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {state?.name || "N/A"}, {address.zip_code}
                                                                        </Typography>
                                                                    </Box>
                                                                }
                                                                sx={{
                                                                    border: `1px solid ${addressError ? '#d32f2f' : '#e0e0e0'}`,
                                                                    borderRadius: 1,
                                                                    mb: 1,
                                                                    p: 1,
                                                                    "&:hover": {
                                                                        backgroundColor: "#f5f5f5",
                                                                    },
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                </RadioGroup>
                                                {addressError && (
                                                    <FormHelperText error sx={{ mt: 1, ml: 2 }}>
                                                        {addressError}
                                                    </FormHelperText>
                                                )}
                                            </>
                                        ) : (
                                            <Box
                                                sx={{
                                                    p: 2,
                                                    border: `1px solid ${addressError ? '#d32f2f' : '#e0e0e0'}`,
                                                    borderRadius: 1,
                                                    backgroundColor: "#fff4e5",
                                                }}
                                            >
                                                <Typography color="text.secondary" sx={{ textAlign: "center", mb: 1 }}>
                                                    No shipping addresses found.
                                                </Typography>
                                                <Box sx={{ textAlign: "center" }}>
                                                    <Button
                                                        variant="outlined"
                                                        startIcon={<AddIcon />}
                                                        onClick={handleOpenAddressModal}
                                                        disabled={isSubmitting}
                                                        size="small"
                                                    >
                                                        Add New Address
                                                    </Button>
                                                </Box>
                                                {addressError && (
                                                    <FormHelperText error sx={{ mt: 1, textAlign: "center" }}>
                                                        {addressError}
                                                    </FormHelperText>
                                                )}
                                            </Box>
                                        )}
                                    </>
                                )}
                            </Box>
                        )}
                    </DialogContent>

                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={handleSubmitShipping}
                            disabled={isSubmitting}
                            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                            fullWidth
                        >
                            {isSubmitting ? "Submitting..." : "Submit & Continue"}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Add New Address Modal */}
                <Dialog
                    open={openAddressModal}
                    onClose={handleCloseAddressModal}
                    maxWidth="sm"
                    fullWidth
                    disableEscapeKeyDown={isSubmitting}
                >
                    <DialogTitle sx={{ borderBottom: "1px solid #ddd" }}>
                        Add New Shipping Address
                        <IconButton
                            aria-label="close"
                            onClick={handleCloseAddressModal}
                            disabled={isSubmitting}
                            sx={{
                                position: "absolute",
                                right: 8,
                                top: 8,
                                color: (theme) => theme.palette.grey[500],
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>

                    <Formik
                        initialValues={{
                            state_id: "",
                            city: "",
                            zip_code: "",
                            address: "",
                        }}
                        validationSchema={addressValidationSchema}
                        onSubmit={handleAddNewAddress}
                    >
                        {({ values, errors, touched, handleChange, handleBlur }) => (
                            <Form>
                                <DialogContent sx={{ mt: 1 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="State"
                                        name="state_id"
                                        value={values.state_id}
                                        size="small"
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={touched.state_id && Boolean(errors.state_id)}
                                        helperText={touched.state_id && errors.state_id}
                                        disabled={isSubmitting}
                                        sx={{ mb: 2 }}
                                    >
                                        {states.map((state) => (
                                            <MenuItem key={state.id} value={state.id}>
                                                {state.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>

                                    <TextField
                                        fullWidth
                                        label="City"
                                        name="city"
                                        value={values.city}
                                        size="small"
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={touched.city && Boolean(errors.city)}
                                        helperText={touched.city && errors.city}
                                        disabled={isSubmitting}
                                        sx={{ mb: 2 }}
                                    />

                                    <TextField
                                        fullWidth
                                        label="Zip Code"
                                        name="zip_code"
                                        value={values.zip_code}
                                        size="small"
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={touched.zip_code && Boolean(errors.zip_code)}
                                        helperText={touched.zip_code && errors.zip_code}
                                        disabled={isSubmitting}
                                        sx={{ mb: 2 }}
                                    />

                                    <TextField
                                        fullWidth
                                        label="Address"
                                        name="address"
                                        multiline
                                        rows={3}
                                        value={values.address}
                                        size="small"
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={touched.address && Boolean(errors.address)}
                                        helperText={touched.address && errors.address}
                                        disabled={isSubmitting}
                                    />
                                </DialogContent>

                                <DialogActions sx={{ px: 3, py: 2 }}>
                                    <Button onClick={handleCloseAddressModal} disabled={isSubmitting}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={isSubmitting}
                                        startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                                    >
                                        {isSubmitting ? "Adding..." : "Add Address"}
                                    </Button>
                                </DialogActions>
                            </Form>
                        )}
                    </Formik>
                </Dialog>
            </>
        );
    }

    // Only show main content if quotation details exist and shipping details are submitted
    if (!quotationDetails) {
        return null;
    }

    return (
        <>
            {/* Rest of your challan details JSX remains the same */}
            <Grid
                container
                spacing={2}
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 2 }}
            >
                <Grid>
                    <Typography variant="h6">Challan Details</Typography>
                </Grid>
                <Grid>
                    <Button
                        variant="contained"
                        color="warning"
                        startIcon={<AiOutlinePrinter />}
                        onClick={handlePrint}
                    >
                        Print
                    </Button>
                </Grid>
            </Grid>

            <Grid container spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Grid size={12}>
                    <div ref={contentRef} style={{ background: "#fff", padding: "20px" }}>
                        <Card>
                            <CardContent>
                                {/* Header Section */}
                                <Grid size={12} sx={{ pt: 2 }}>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: 2,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <Typography variant="body1" sx={{ m: 0 }}>
                                            Invoice No. :{" "}
                                            <Box component="span" sx={{ fontWeight: 600 }}>
                                                {quotationDetails.invoice_no || "N/A"}
                                            </Box>
                                        </Typography>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "end",
                                                gap: 2,
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <Typography variant="body1" sx={{ m: 0 }}>
                                                Billing Date:{" "}
                                                <Box component="span" sx={{ fontWeight: 600 }}>
                                                    {formatDate(quotationDetails.date)}
                                                </Box>
                                            </Typography>
                                            <Typography variant="body1" sx={{ m: 0 }}>
                                                Delivery Date:{" "}
                                                <Box component="span" sx={{ fontWeight: 600 }}>
                                                    {formatDate(quotationDetails.delivery_date)}
                                                </Box>
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>

                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        mb: 2,
                                        mt: 1,
                                        gap: 2,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    {/* From (Left side) */}
                                    <Box sx={{ width: { xs: "100%", md: "48%" } }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                            From:
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>{appDetails.application_name}</strong>
                                            <br />
                                            {appDetails.gst_no} <br />
                                            {appDetails.company_address} <br />
                                        </Typography>
                                    </Box>

                                    {/* To (Right side) */}
                                    {quotationDetails.customer && (
                                        <Box sx={{ width: { xs: "100%", md: "48%" } }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                                To:
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>{quotationDetails.customer.name}</strong>
                                                <br />
                                                {quotationDetails.customer.address}
                                                <br />
                                                {quotationDetails.customer.city},{" "}
                                                {quotationDetails.customer.state?.name}{" "}
                                                {quotationDetails.customer.zip_code}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>

                                {/* Items Table */}
                                {items.length > 0 && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                                            Bill Items ({items.length})
                                        </Typography>
                                        <Table>
                                            <Thead>
                                                <Tr>
                                                    <Th>Item Name</Th>
                                                    <Th>Item Code</Th>
                                                    <Th>Qty</Th>
                                                    <Th>Size</Th>
                                                    <Th>Documents</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {items.map((item) => (
                                                    <Tr key={item.id}>
                                                        <Td>{item.product?.name}</Td>
                                                        <Td>{item.product?.model}</Td>
                                                        <Td>{item.qty}</Td>
                                                        <Td>{item.product?.size}</Td>
                                                        <Td>
                                                            {item.product?.image ? (
                                                                <Box
                                                                    sx={{
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        gap: 1,
                                                                    }}
                                                                >
                                                                    <ImagePreviewDialog
                                                                        imageUrl={mediaUrl + item.product?.image}
                                                                        alt={item.product?.name || "Document"}
                                                                    />
                                                                    <Typography variant="caption">
                                                                        {item.product?.name || "Document"}
                                                                    </Typography>
                                                                </Box>
                                                            ) : (
                                                                "-"
                                                            )}
                                                        </Td>
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                        </Table>
                                    </Box>
                                )}

                                {/* Order Terms */}
                                <Grid size={12} sx={{ mt: 3 }}>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            width: "100%",
                                            gap: 2,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <Box sx={{ width: "48%", minWidth: "300px" }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                                Order Terms:
                                            </Typography>
                                            <Typography variant="body2">
                                                {quotationDetails.term_and_condition || "No order terms specified"}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            </CardContent>
                        </Card>
                    </div>
                </Grid>
            </Grid>
        </>
    );
};

export default Challan;