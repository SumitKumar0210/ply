import React, { useState, useEffect, useCallback } from "react";
import {
    Grid,
    Button,
    Typography,
    Card,
    Tooltip,
    IconButton,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    CardContent,
    Stack,
    Box,
    TextareaAutosize,
    TextField,
    MenuItem,
    CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { styled } from "@mui/material/styles";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { RiDeleteBinLine } from "react-icons/ri";
import { Autocomplete } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { BiSolidUserPlus } from "react-icons/bi";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
    addCustomer,
    fetchActiveCustomers,
} from "../../Users/slices/customerSlice";
import { fetchStates } from "../../settings/slices/stateSlice";
import { fetchActiveProducts } from "../../settings/slices/productSlice";
import { fetchActiveTaxSlabs } from "../../settings/slices/taxSlabSlice";
import { fetchActiveGroup } from "../../settings/slices/groupSlice";
import {
    updateBill,
    fetchBillById,
    clearCurrentBill
} from "../slice/billsSlice";
import { successMessage, errorMessage } from "../../../toast";
import ImagePreviewDialog from "../../../components/ImagePreviewDialog/ImagePreviewDialog";

// Styled Dialog
const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    "& .MuiDialogContent-root": {
        padding: theme.spacing(2),
        paddingBottom: theme.spacing(4),
    },
    "& .MuiDialogActions-root": {
        padding: theme.spacing(1),
    },
}));

function BootstrapDialogTitle({ children, onClose, ...other }) {
    return (
        <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
            {children}
            {onClose && (
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: "absolute",
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            )}
        </DialogTitle>
    );
}

// Validation Schemas
const itemValidationSchema = Yup.object({
    product_id: Yup.string().required("Product is required"),
    quantity: Yup.number()
        .required("Quantity is required")
        .positive("Quantity must be positive")
        .integer("Quantity must be a whole number")
        .max(10000, "Quantity cannot exceed 10000"),
    price: Yup.number()
        .required("Price is required")
        .positive("Price must be positive")
        .max(10000000, "Price cannot exceed 1 crore"),
});

const customerValidationSchema = Yup.object({
    name: Yup.string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name cannot exceed 100 characters")
        .required("Name is required")
        .matches(/^[a-zA-Z\s]*$/, "Name can only contain letters and spaces"),
    mobile: Yup.string()
        .matches(/^[0-9]{10}$/, "Mobile must be exactly 10 digits")
        .required("Mobile is required"),
    email: Yup.string()
        .email("Invalid email format")
        .required("E-mail is required")
        .max(100, "Email cannot exceed 100 characters"),
    address: Yup.string()
        .required("Address is required")
        .max(500, "Address cannot exceed 500 characters"),
    alternate_mobile: Yup.string()
        .matches(/^$|^[0-9]{10}$/, "Alternate Mobile must be 10 digits")
        .nullable(),
    city: Yup.string()
        .required("City is required")
        .max(50, "City cannot exceed 50 characters")
        .matches(/^[a-zA-Z\s]*$/, "City can only contain letters and spaces"),
    state_id: Yup.string().required("State is required"),
    zip_code: Yup.string()
        .matches(/^[0-9]{6}$/, "ZIP must be exactly 6 digits")
        .required("ZIP code is required"),
    note: Yup.string().max(1000, "Note cannot exceed 1000 characters"),
});

const quoteValidationSchema = Yup.object({
    orderTerms: Yup.string()
        .max(500, "Order terms cannot exceed 500 characters"),
    discount: Yup.number()
        .min(0, "Discount cannot be negative")
        .max(10000000, "Discount cannot exceed 1 crore"),
    additionalCharges: Yup.number()
        .min(0, "Additional charges cannot be negative")
        .max(10000000, "Additional charges cannot exceed 1 crore"),
    gstRate: Yup.number()
        .required("GST rate is required")
        .min(0, "GST rate cannot be negative")
        .max(100, "GST rate cannot exceed 100%"),
    invoiceNumber: Yup.string()
        .required("Invoice number is required")
        .max(50, "Invoice number cannot exceed 50 characters")
        .matches(/^[a-zA-Z0-9\-\/]*$/, "Invoice number can only contain letters, numbers, hyphens, and slashes"),
});

const EditBill = () => {
    const { id } = useParams();
    const [creationDate, setCreationDate] = useState(new Date());
    const [deliveryDate, setDeliveryDate] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [invoiceNumber, setInvoiceNumber] = useState(null);
    const [openAddCustomer, setOpenAddCustomer] = useState(false);
    const [openAddProduct, setOpenAddProduct] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({
        open: false,
        itemId: null,
    });
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [updating, setUpdating] = useState(false);
    const [loading, setLoading] = useState(true);

    const { data: customerData = [], loading: customersLoading } = useSelector(
        (state) => state.customer
    );
    const { data: states = [] } = useSelector((state) => state.state);
    const { data: products = [], loading: productsLoading } = useSelector(
        (state) => state.product
    );
    const { activeData: gsts = [], loading: gstsLoading } = useSelector(
        (state) => state.taxSlab
    );
    const { selected: currentBill, loading: billLoading } = useSelector(
        (state) => state.bill
    );

    const mediaUrl = import.meta.env.VITE_MEDIA_URL;
    const dispatch = useDispatch();

    // Load bill data and initial data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    dispatch(fetchBillById(id)),
                    dispatch(fetchActiveCustomers()),
                    dispatch(fetchActiveProducts()),
                    dispatch(fetchActiveTaxSlabs()),
                ]);
            } catch (error) {
                console.error("Failed to load data:", error);
                errorMessage("Failed to load bill data");
            } finally {
                setLoading(false);
            }
        };
        loadData();

        return () => {
            dispatch(clearCurrentBill());
        };
    }, [dispatch, id]);

    // Populate form when currentBill is loaded
    useEffect(() => {
        if (currentBill && customerData.length > 0) {
            const customer = customerData.find(c => c.id === currentBill.customer_id);
            setSelectedCustomer(customer || null);
            setCreationDate(new Date(currentBill.quote_date));
            setDeliveryDate(currentBill.delivery_date ? new Date(currentBill.delivery_date) : null);
            setInvoiceNumber(currentBill.invoice_no)

            // Set items from current bill - FIXED: Check for items array first
            const billItems = currentBill.items || currentBill.product || [];
            if (billItems.length > 0) {
                setItems(billItems.map(item => ({
                    ...item,
                    id: item.id || Date.now() + Math.random(),
                    cost: parseFloat(item.cost)
                        || parseFloat(item.amount)
                        || (parseFloat(item.rate || 0) * parseFloat(item.qty || 0)),

                    unitPrice: parseFloat(item.rate || 0),
                    qty: item.qty || 0
                })));
            }
        }
    }, [currentBill, customerData]);

    // Open customer modal and load states
    const openCustomerModal = async () => {
        await dispatch(fetchStates());
        setOpenAddCustomer(true);
    };

    // Open product modal and load groups
    const openProductModal = async () => {
        await dispatch(fetchActiveGroup());
        setOpenAddProduct(true);
    };

    // Handle add customer
    const handleAddCustomer = async (values, { resetForm, setSubmitting }) => {
        try {
            const res = await dispatch(addCustomer(values));
            if (res.error) {
                errorMessage("Failed to add customer");
                return;
            }
            resetForm();
            setOpenAddCustomer(false);
            successMessage("Customer added successfully!");
            await dispatch(fetchActiveCustomers());
        } catch (error) {
            console.error("Add customer failed:", error);
            errorMessage("Failed to add customer");
        } finally {
            setSubmitting(false);
        }
    };

    // Handle product success (after adding new product)
    const handleProductSuccess = async () => {
        setOpenAddProduct(false);
        setSelectedProduct(null);
        await dispatch(fetchActiveProducts());
        successMessage("Product added successfully!");
    };

    const isDuplicateItem = useCallback(
        (product_id) => {
            const normalizedProduct = String(product_id).trim();
            return items.some((item) => String(item.product_id).trim() === normalizedProduct);
        },
        [items]
    );

    const handleAddItem = async (values, { resetForm, setFieldValue, setSubmitting }) => {
        const { product_id, quantity, price } = values;

        if (!product_id) {
            errorMessage("Please select a product before adding.");
            setSubmitting(false);
            return;
        }

        if (!quantity || isNaN(quantity) || quantity <= 0) {
            errorMessage("Please enter a valid quantity greater than 0.");
            setSubmitting(false);
            return;
        }

        if (!price || isNaN(price) || price <= 0) {
            errorMessage("Please enter a valid price greater than 0.");
            setSubmitting(false);
            return;
        }

        const product = products.find((p) => p.id === product_id);
        if (!product) {
            errorMessage("Selected product not found in the list.");
            setSubmitting(false);
            return;
        }

        if (isDuplicateItem(product_id)) {
            errorMessage(
                "This Product is already added. Update quantity in the table instead."
            );
            setSubmitting(false);
            return;
        }

        const productImageUrl = product.image ? `${mediaUrl}${product.image}` : "";

        const newItem = {
            id: Date.now(),
            product_id,
            name: product.name,
            model: product.model,
            unique_code: `${product.model}@${Math.floor(1000 + Math.random() * 9000)}`,
            qty: parseInt(quantity, 10),
            size: product.size,
            cost: parseFloat(price) * parseInt(quantity, 10),
            rate: parseFloat(price),
            unitPrice: parseFloat(price),
            documentFile: product.image || "-",
            document: productImageUrl || "",
            documentName: product.image ? `${product.name} Image` : "",
        };

        setItems((prev) => [...prev, newItem]);
        setSelectedProduct(null);
        resetForm();
        setSubmitting(false);
        successMessage("Item added successfully!");
    };

    // Handle delete item
    const confirmDeleteItem = () => {
        setItems((prev) => prev.filter((item) => item.id !== deleteDialog.itemId));
        setDeleteDialog({ open: false, itemId: null });
        successMessage("Item removed successfully!");
    };

    // Update item price
    const updateItemPrice = (itemId, newPrice) => {
        const price = parseFloat(newPrice);
        if (isNaN(price) || price < 0) {
            errorMessage("Price cannot be negative");
            return;
        }
        if (price > 10000000) {
            errorMessage("Price cannot exceed 1 crore");
            return;
        }

        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const updatedCost = price * item.qty;
                return {
                    ...item,
                    unitPrice: price,
                    cost: updatedCost
                };
            }
            return item;
        }));
    };

    // Update item quantity
    const updateItemQuantity = (itemId, newQuantity) => {
        const quantity = parseInt(newQuantity, 10);
        if (isNaN(quantity) || quantity < 1) {
            errorMessage("Quantity must be at least 1");
            return;
        }
        if (quantity > 10000) {
            errorMessage("Quantity cannot exceed 10000");
            return;
        }

        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const updatedCost = item.unitPrice * quantity;
                return {
                    ...item,
                    qty: quantity,
                    cost: updatedCost
                };
            }
            return item;
        }));
    };

    // Calculate totals
    const calculateTotals = (values) => {
        const subTotal = items.reduce((sum, item) => sum + (item.cost || 0), 0);
        const discountAmount = parseFloat(values.discount || 0);
        const additionalChargesAmount = parseFloat(values.additionalCharges || 0);
        const afterDiscount = subTotal - discountAmount + additionalChargesAmount;
        const gstAmount = (afterDiscount * parseFloat(values.gstRate || 0)) / 100;
        const grandTotal = afterDiscount + gstAmount;

        return {
            subTotal,
            discountAmount,
            additionalChargesAmount,
            gstAmount,
            grandTotal,
        };
    };

    // Validate form before submission
    const validateForm = (values) => {
        if (!selectedCustomer) {
            errorMessage("Please select a customer");
            return false;
        }

        if (items.length === 0) {
            errorMessage("Please add at least one item");
            return false;
        }

        // Validate grand total is positive
        const totals = calculateTotals(values);
        if (totals.grandTotal < 0) {
            errorMessage("Grand total cannot be negative");
            return false;
        }

        return true;
    };

    // Handle bill update
    const handleUpdateBill = async (values, isDraft = false) => {
        if (!validateForm(values)) {
            return;
        }

        setUpdating(true);

        try {
            const totals = calculateTotals(values);

            const formData = new FormData();

            formData.append("customer_id", selectedCustomer.id);
            formData.append("invoice_no", values.invoiceNumber);
            if (deliveryDate) {
                formData.append("delivery_date", deliveryDate.toISOString());
            }
            formData.append("order_terms", values.orderTerms || "");
            formData.append("discount", values.discount || 0);
            formData.append("additional_charges", values.additionalCharges || 0);
            formData.append("gst_rate", values.gstRate);
            formData.append("sub_total", totals.subTotal);
            formData.append("grand_total", totals.grandTotal);
            formData.append("is_draft", isDraft ? 1 : 0);
            formData.append("_method", "PUT"); // For Laravel update

            items.forEach((item, index) => {
                formData.append(`items[${index}][id]`, item.id);
                formData.append(`items[${index}][product_id]`, item.product_id);
                formData.append(`items[${index}][name]`, item.name);
                formData.append(`items[${index}][model]`, item.model);
                formData.append(`items[${index}][unique_code]`, item.unique_code);
                formData.append(`items[${index}][qty]`, item.qty);
                formData.append(`items[${index}][size]`, item.size || "");
                formData.append(`items[${index}][cost]`, item.cost);
                formData.append(`items[${index}][rate]`, item.rate || item.unitPrice);
                formData.append(`items[${index}][unitPrice]`, item.unitPrice);

                if (item.documentFile && item.documentFile !== "-") {
                    formData.append(`items[${index}][document]`, item.documentFile);
                }
            });

            const res = await dispatch(updateBill({ id, formData }));
            if (res.error) {
                errorMessage("Failed to update bill");
                return;
            }

            successMessage(
                `Bill ${isDraft ? "saved as draft" : "updated"} successfully!`
            );
            navigate("/bills");
        } catch (error) {
            console.error("Update bill failed:", error);
            errorMessage("Failed to update bill");
        } finally {
            setUpdating(false);
        }
    };

    const isLoading = loading || customersLoading || productsLoading || gstsLoading || billLoading;

    if (isLoading) {
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

    if (!currentBill && !billLoading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "60vh",
                    flexDirection: "column",
                    gap: 2,
                }}
            >
                <Typography variant="h6" color="error">
                    Bill not found
                </Typography>
                <Button variant="contained" onClick={() => navigate("/bills")}>
                    Back to Bills
                </Button>
            </Box>
        );
    }

    return (
        <>
            <Grid
                container
                spacing={2}
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 2 }}
            >
                <Grid item xs={12}>
                    <Typography variant="h6">Edit Bill - {currentBill?.invoice_no}</Typography>
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid size={12}>
                    <Card>
                        <CardContent>
                            {/* Header Row */}
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    flexWrap: "wrap",
                                    gap: 2,
                                    mb: 2,
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Autocomplete
                                        options={customerData}
                                        size="small"
                                        getOptionLabel={(option) => option?.name || ""}
                                        value={selectedCustomer}
                                        onChange={(e, value) => setSelectedCustomer(value)}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Select Customer"
                                                variant="outlined"
                                                sx={{ width: 300 }}
                                                required
                                                error={!selectedCustomer}
                                                helperText={!selectedCustomer ? "Customer is required" : ""}
                                            />
                                        )}
                                    />

                                    <Tooltip title="Add New Customer">
                                        <IconButton color="primary" onClick={openCustomerModal}>
                                            <BiSolidUserPlus size={22} />
                                        </IconButton>
                                    </Tooltip>
                                </Box>

                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "end",
                                            flexWrap: "wrap",
                                            gap: 2,
                                            mb: 2,
                                        }}
                                    >
                                        <DatePicker
                                            label="Delivery Date"
                                            value={deliveryDate}
                                            onChange={(newValue) => setDeliveryDate(newValue)}
                                            slotProps={{
                                                textField: {
                                                    size: "small",
                                                    sx: { width: 250 },
                                                    error: deliveryDate && deliveryDate < creationDate,
                                                    helperText: deliveryDate && deliveryDate < creationDate
                                                        ? "Delivery date cannot be before creation date"
                                                        : ""
                                                },
                                            }}
                                        />
                                        <TextField
                                            label="Invoice Number"
                                            name="invoiceNumber"
                                            value={invoiceNumber}
                                            onChange={(e) => setInvoiceNumber(e.target.value)}
                                            size="small"
                                            fullWidth
                                            sx={{ width: 250 }}
                                            required
                                        />
                                    </Box>
                                </LocalizationProvider>
                            </Box>

                            {/* Customer Details */}
                            {selectedCustomer && (
                                <Typography variant="body2" sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                    <strong>{selectedCustomer.name}</strong>
                                    <br />
                                    {selectedCustomer.address}
                                    <br />
                                    {selectedCustomer.city}, {selectedCustomer.state?.name}{" "}
                                    {selectedCustomer.zip_code}
                                    <br />
                                    Mobile: {selectedCustomer.mobile}
                                    <br />
                                    Email: {selectedCustomer.email}
                                </Typography>
                            )}

                            {/* Add Item Form */}
                            <Formik
                                initialValues={{
                                    product_id: "",
                                    quantity: "",
                                    price: "",
                                }}
                                validationSchema={itemValidationSchema}
                                onSubmit={handleAddItem}
                            >
                                {({
                                    handleChange,
                                    handleSubmit,
                                    values,
                                    touched,
                                    errors,
                                    setFieldValue,
                                    isSubmitting,
                                }) => (
                                    <Form onSubmit={handleSubmit}>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                gap: 2,
                                                mb: 3,
                                                mt: 3,
                                                alignItems: "flex-start",
                                            }}
                                        >
                                            <Autocomplete
                                                options={products}
                                                size="small"
                                                getOptionLabel={(option) => option.model || ""}
                                                value={selectedProduct}
                                                onChange={(e, value) => {
                                                    setSelectedProduct(value);
                                                    setFieldValue("product_id", value?.id || "");
                                                    if (value) {
                                                        setFieldValue("price", value.rrp || "");
                                                    }
                                                }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label="Model Code"
                                                        variant="outlined"
                                                        sx={{ width: 150 }}
                                                        error={
                                                            touched.product_id && Boolean(errors.product_id)
                                                        }
                                                        helperText={touched.product_id && errors.product_id}
                                                        required
                                                    />
                                                )}
                                            />

                                            <TextField
                                                label="Item Name"
                                                variant="outlined"
                                                size="small"
                                                value={selectedProduct?.name || ""}
                                                disabled
                                                sx={{ minWidth: 200 }}
                                            />

                                            <TextField
                                                label="Qty"
                                                variant="outlined"
                                                size="small"
                                                type="number"
                                                name="quantity"
                                                value={values.quantity}
                                                onChange={handleChange}
                                                error={touched.quantity && Boolean(errors.quantity)}
                                                helperText={touched.quantity && errors.quantity}
                                                sx={{ width: 100 }}
                                                inputProps={{ min: 1, max: 10000 }}
                                                required
                                            />

                                            <TextField
                                                label="Size"
                                                variant="outlined"
                                                size="small"
                                                value={selectedProduct?.size || ""}
                                                disabled
                                                sx={{ minWidth: 100 }}
                                            />

                                            <TextField
                                                type="number"
                                                label="Price"
                                                variant="outlined"
                                                size="small"
                                                name="price"
                                                value={values.price}
                                                onChange={handleChange}
                                                error={touched.price && Boolean(errors.price)}
                                                helperText={touched.price && errors.price}
                                                sx={{ minWidth: 100 }}
                                                inputProps={{ min: 0, max: 10000000, step: "0.01" }}
                                                required
                                            />

                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                {selectedProduct?.image && (
                                                    <ImagePreviewDialog
                                                        imageUrl={mediaUrl + selectedProduct?.image}
                                                        alt="Document Preview"
                                                    />
                                                )}
                                            </Box>

                                            <Button
                                                type="submit"
                                                variant="contained"
                                                color="primary"
                                                disabled={!selectedProduct || isSubmitting}
                                                sx={{ mt: 0 }}
                                            >
                                                {isSubmitting ? "Adding..." : "Add Item"}
                                            </Button>

                                        </Box>
                                    </Form>
                                )}
                            </Formik>

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
                                                <Th>Unit Price (₹)</Th>
                                                <Th>Total Cost (₹)</Th>
                                                <Th>Documents</Th>
                                                <Th>Action</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {items.map((item) => (
                                                <Tr key={item.id}>
                                                    <Td>{item.product?.name}</Td>
                                                    <Td>{item.product?.model}</Td>
                                                    <Td>
                                                        <TextField
                                                            type="number"
                                                            value={item.qty}
                                                            onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                                                            size="small"
                                                            sx={{ width: 80 }}
                                                            inputProps={{ min: 1, max: 10000 }}
                                                        />
                                                    </Td>
                                                    <Td>{item.product?.size}</Td>
                                                    <Td>
                                                        <TextField
                                                            type="number"
                                                            value={item.rate}
                                                            onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                                                            size="small"
                                                            sx={{ width: 150 }}
                                                            inputProps={{ min: 0, max: 10000000, step: "0.01" }}
                                                        />
                                                    </Td>
                                                    <Td>₹{(item.cost || 0).toLocaleString("en-IN")}</Td>
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
                                                    <Td>
                                                        <Tooltip title="Delete">
                                                            <IconButton
                                                                color="error"
                                                                onClick={() =>
                                                                    setDeleteDialog({
                                                                        open: true,
                                                                        itemId: item.id,
                                                                    })
                                                                }
                                                            >
                                                                <RiDeleteBinLine size={16} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </Box>
                            )}

                            {/* Totals Section */}
                            <Formik
                                initialValues={{
                                    orderTerms: currentBill?.order_terms || "",
                                    discount: currentBill?.discount || "",
                                    additionalCharges: currentBill?.additional_charges || "",
                                    gstRate: currentBill?.gst_rate?.toString() || "18.00",
                                }}
                                validationSchema={quoteValidationSchema}
                                onSubmit={(values) => handleUpdateBill(values, false)}
                                enableReinitialize
                            >
                                {({ handleChange, values, touched, errors, handleSubmit, isSubmitting }) => {
                                    const totals = calculateTotals(values);

                                    return (
                                        <Form>
                                            <Grid item xs={12} sx={{ mt: 3 }}>
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

                                                        <TextareaAutosize
                                                            minRows={3}
                                                            maxRows={6}
                                                            placeholder="Order Terms (max 500 characters)"
                                                            name="orderTerms"
                                                            value={values.orderTerms}
                                                            onChange={handleChange}
                                                            style={{
                                                                width: "100%",
                                                                padding: "8px",
                                                                fontFamily: "inherit",
                                                                borderRadius: "4px",
                                                                border: touched.orderTerms && errors.orderTerms
                                                                    ? "1px solid #d32f2f"
                                                                    : "1px solid #ccc",
                                                            }}
                                                        />
                                                        {touched.orderTerms && errors.orderTerms && (
                                                            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                                                                {errors.orderTerms}
                                                            </Typography>
                                                        )}
                                                    </Box>

                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            flexDirection: "column",
                                                            gap: 1,
                                                            minWidth: "300px",
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                borderBottom: "1px solid #ccc",
                                                                pb: 0.5,
                                                            }}
                                                        >
                                                            <span>Sub Total</span>
                                                            <span>
                                                                ₹{totals.subTotal.toLocaleString("en-IN")}
                                                            </span>
                                                        </Box>

                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                gap: 1,
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <TextField
                                                                label="Discount (₹)"
                                                                type="number"
                                                                size="small"
                                                                name="discount"
                                                                value={values.discount}
                                                                onChange={handleChange}
                                                                error={touched.discount && !!errors.discount}
                                                                helperText={touched.discount && errors.discount}
                                                                sx={{ width: "55%" }}
                                                                inputProps={{ min: 0, max: 10000000 }}
                                                            />
                                                            <span>
                                                                ₹
                                                                {(
                                                                    totals.subTotal - totals.discountAmount
                                                                ).toLocaleString("en-IN")}
                                                            </span>
                                                        </Box>

                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                gap: 1,
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <TextField
                                                                label="Add Charges (₹)"
                                                                type="number"
                                                                size="small"
                                                                name="additionalCharges"
                                                                value={values.additionalCharges}
                                                                onChange={handleChange}
                                                                error={
                                                                    touched.additionalCharges &&
                                                                    !!errors.additionalCharges
                                                                }
                                                                helperText={
                                                                    touched.additionalCharges &&
                                                                    errors.additionalCharges
                                                                }
                                                                sx={{ width: "55%" }}
                                                                inputProps={{ min: 0, max: 10000000 }}
                                                            />
                                                            <span>
                                                                ₹
                                                                {totals.additionalChargesAmount.toLocaleString(
                                                                    "en-IN"
                                                                )}
                                                            </span>
                                                        </Box>

                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                gap: 1,
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <TextField
                                                                select
                                                                label="GST %"
                                                                size="small"
                                                                name="gstRate"
                                                                value={values.gstRate}
                                                                onChange={handleChange}
                                                                error={touched.gstRate && !!errors.gstRate}
                                                                helperText={touched.gstRate && errors.gstRate}
                                                                sx={{ width: "55%" }}
                                                            >
                                                                {gsts.map((item) => (
                                                                    <MenuItem
                                                                        key={item.id}
                                                                        value={item.percentage}
                                                                    >
                                                                        {item.percentage}%
                                                                    </MenuItem>
                                                                ))}
                                                            </TextField>
                                                            <span>
                                                                ₹{totals.gstAmount.toLocaleString("en-IN")}
                                                            </span>
                                                        </Box>

                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                borderTop: "2px solid #222",
                                                                mt: 1,
                                                                pt: 0.5,
                                                                fontWeight: "600",
                                                                fontSize: "1.1rem",
                                                            }}
                                                        >
                                                            <span>Grand Total</span>
                                                            <span>
                                                                ₹{totals.grandTotal.toLocaleString("en-IN")}
                                                            </span>
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </Grid>

                                            <Stack
                                                direction="row"
                                                spacing={2}
                                                justifyContent="flex-end"
                                                sx={{ mt: 4 }}
                                            >
                                                <Button
                                                    variant="outlined"
                                                    onClick={() => navigate("/bills")}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    color="secondary"
                                                    onClick={() => handleUpdateBill(values, true)}
                                                    disabled={
                                                        updating || items.length === 0 || isSubmitting
                                                    }
                                                    startIcon={
                                                        updating ? (
                                                            <CircularProgress size={20} color="inherit" />
                                                        ) : null
                                                    }
                                                >
                                                    {updating ? "Saving..." : "Save as Draft"}
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    variant="contained"
                                                    color="primary"
                                                    disabled={
                                                        updating || items.length === 0 || isSubmitting
                                                    }
                                                    startIcon={
                                                        updating ? (
                                                            <CircularProgress size={20} color="inherit" />
                                                        ) : null
                                                    }
                                                >
                                                    {updating ? "Updating..." : "Update Bill"}
                                                </Button>
                                            </Stack>
                                        </Form>
                                    );
                                }}
                            </Formik>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Add Customer Modal */}
            <BootstrapDialog
                open={openAddCustomer}
                onClose={() => setOpenAddCustomer(false)}
                fullWidth
                maxWidth="sm"
            >
                <BootstrapDialogTitle onClose={() => setOpenAddCustomer(false)}>
                    Add Customer
                </BootstrapDialogTitle>
                <Formik
                    initialValues={{
                        name: "",
                        mobile: "",
                        email: "",
                        address: "",
                        alternate_mobile: "",
                        city: "",
                        state_id: "",
                        zip_code: "",
                        note: "",
                    }}
                    validationSchema={customerValidationSchema}
                    onSubmit={handleAddCustomer}
                >
                    {({ handleChange, values, touched, errors, isSubmitting }) => (
                        <Form>
                            <DialogContent dividers>
                                <Grid container rowSpacing={1} columnSpacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            name="name"
                                            label="Name"
                                            fullWidth
                                            margin="dense"
                                            variant="outlined"
                                            size="small"
                                            value={values.name}
                                            onChange={handleChange}
                                            error={touched.name && Boolean(errors.name)}
                                            helperText={touched.name && errors.name}
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            name="mobile"
                                            label="Mobile"
                                            fullWidth
                                            margin="dense"
                                            variant="outlined"
                                            size="small"
                                            value={values.mobile}
                                            onChange={handleChange}
                                            error={touched.mobile && Boolean(errors.mobile)}
                                            helperText={touched.mobile && errors.mobile}
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            name="alternate_mobile"
                                            label="Alternate Mobile"
                                            fullWidth
                                            margin="dense"
                                            variant="outlined"
                                            size="small"
                                            value={values.alternate_mobile}
                                            onChange={handleChange}
                                            error={
                                                touched.alternate_mobile &&
                                                Boolean(errors.alternate_mobile)
                                            }
                                            helperText={
                                                touched.alternate_mobile && errors.alternate_mobile
                                            }
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            name="email"
                                            label="E-mail"
                                            fullWidth
                                            margin="dense"
                                            variant="outlined"
                                            size="small"
                                            value={values.email}
                                            onChange={handleChange}
                                            error={touched.email && Boolean(errors.email)}
                                            helperText={touched.email && errors.email}
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            name="address"
                                            label="Address"
                                            fullWidth
                                            margin="dense"
                                            variant="outlined"
                                            size="small"
                                            value={values.address}
                                            onChange={handleChange}
                                            error={touched.address && Boolean(errors.address)}
                                            helperText={touched.address && errors.address}
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            name="state_id"
                                            label="State"
                                            select
                                            fullWidth
                                            margin="dense"
                                            variant="outlined"
                                            size="small"
                                            value={values.state_id}
                                            onChange={handleChange}
                                            error={touched.state_id && Boolean(errors.state_id)}
                                            helperText={touched.state_id && errors.state_id}
                                            required
                                        >
                                            <MenuItem value="">Select State</MenuItem>
                                            {states.map((s) => (
                                                <MenuItem key={s.id} value={s.id}>
                                                    {s.name}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            name="city"
                                            label="City"
                                            fullWidth
                                            margin="dense"
                                            variant="outlined"
                                            size="small"
                                            value={values.city}
                                            onChange={handleChange}
                                            error={touched.city && Boolean(errors.city)}
                                            helperText={touched.city && errors.city}
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            name="zip_code"
                                            label="Zip Code"
                                            fullWidth
                                            margin="dense"
                                            variant="outlined"
                                            size="small"
                                            value={values.zip_code}
                                            onChange={handleChange}
                                            error={touched.zip_code && Boolean(errors.zip_code)}
                                            helperText={touched.zip_code && errors.zip_code}
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            name="note"
                                            label="Note"
                                            fullWidth
                                            multiline
                                            rows={3}
                                            margin="dense"
                                            variant="outlined"
                                            size="small"
                                            value={values.note}
                                            onChange={handleChange}
                                            error={touched.note && Boolean(errors.note)}
                                            helperText={touched.note && errors.note}
                                        />
                                    </Grid>
                                </Grid>
                            </DialogContent>
                            <DialogActions>
                                <Button
                                    onClick={() => setOpenAddCustomer(false)}
                                    variant="outlined"
                                    color="error"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Adding..." : "Add Customer"}
                                </Button>
                            </DialogActions>
                        </Form>
                    )}
                </Formik>
            </BootstrapDialog>

            {/* Delete Item Confirmation Dialog */}
            <Dialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, itemId: null })}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this item from the bill? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setDeleteDialog({ open: false, itemId: null })}
                    >
                        Cancel
                    </Button>
                    <Button color="error" onClick={confirmDeleteItem} variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default EditBill;