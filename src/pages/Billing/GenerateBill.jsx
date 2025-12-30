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
    useMediaQuery,
    useTheme,
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
import { fetchActiveCustomers, addCustomer } from "../Users/slices/customerSlice";
import { fetchActiveProducts } from "../settings/slices/productSlice";
import { fetchActiveTaxSlabs } from "../settings/slices/taxSlabSlice";
import { addBill } from "./slice/billsSlice";
import { successMessage, errorMessage } from "../../toast";
import { useNavigate } from "react-router-dom";
import ImagePreviewDialog from "../../components/ImagePreviewDialog/ImagePreviewDialog";
import CustomerFormDialog, { getInitialCustomerValues } from "../../components/Customer/CustomerFormDialog";

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

const quoteValidationSchema = Yup.object({
    orderTerms: Yup.string().max(500, "Order terms cannot exceed 500 characters"),
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
});

const GenerateBill = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [creationDate] = useState(new Date());
    const [deliveryDate, setDeliveryDate] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [openAddCustomer, setOpenAddCustomer] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({
        open: false,
        itemId: null,
    });
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [savingDraft, setSavingDraft] = useState(false);
    const [savingFinal, setSavingFinal] = useState(false);

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
    const mediaUrl = import.meta.env.VITE_MEDIA_URL;
    const dispatch = useDispatch();

    useEffect(() => {
        const loadData = async () => {
            await Promise.all([
                dispatch(fetchActiveCustomers()),
                dispatch(fetchActiveProducts()),
                dispatch(fetchActiveTaxSlabs()),
            ]);
        };
        loadData();
    }, [dispatch]);

    const isDuplicateItem = useCallback(
        (product_id) => {
            const normalizedProduct = String(product_id).trim();
            return items.some((item) => String(item.product_id).trim() === normalizedProduct);
        },
        [items]
    );

    const generateCode = (model) => {
        return model + "@" + Math.floor(1000 + Math.random() * 9000);
    };

    const handleAddItem = async (values, { resetForm, setSubmitting }) => {
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
            errorMessage("This Product is already added. Update quantity in the table instead.");
            setSubmitting(false);
            return;
        }

        const productImageUrl = product.image ? `${mediaUrl}${product.image}` : "";

        const newItem = {
            id: Date.now(),
            product_id,
            name: product.name,
            model: product.model,
            unique_code: generateCode(product.model),
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

    const confirmDeleteItem = () => {
        setItems((prev) => prev.filter((item) => item.id !== deleteDialog.itemId));
        setDeleteDialog({ open: false, itemId: null });
        successMessage("Item removed successfully!");
    };

    const updateItemPrice = (itemId, newPrice) => {
        if (newPrice < 0) {
            errorMessage("Price cannot be negative");
            return;
        }
        if (newPrice > 10000000) {
            errorMessage("Price cannot exceed 1 crore");
            return;
        }

        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const updatedCost = newPrice * item.qty;
                return {
                    ...item,
                    unitPrice: parseFloat(newPrice),
                    cost: updatedCost
                };
            }
            return item;
        }));
    };

    const updateItemQuantity = (itemId, newQuantity) => {
        if (newQuantity < 1) {
            errorMessage("Quantity must be at least 1");
            return;
        }
        if (newQuantity > 10000) {
            errorMessage("Quantity cannot exceed 10000");
            return;
        }

        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const updatedCost = item.unitPrice * newQuantity;
                return {
                    ...item,
                    qty: parseInt(newQuantity, 10),
                    cost: updatedCost
                };
            }
            return item;
        }));
    };

    const calculateTotals = (values) => {
        const subTotal = items.reduce((sum, item) => sum + item.cost, 0);
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

    const validateForm = (values) => {
        if (!selectedCustomer) {
            errorMessage("Please select a customer");
            return false;
        }

        if (items.length === 0) {
            errorMessage("Please add at least one item");
            return false;
        }

        const totals = calculateTotals(values);
        if (totals.grandTotal < 0) {
            errorMessage("Grand total cannot be negative");
            return false;
        }

        return true;
    };

    const handleSubmitQuote = async (values, isDraft = false) => {
        if (!validateForm(values)) {
            return;
        }

        if (isDraft) {
            setSavingDraft(true);
        } else {
            setSavingFinal(true);
        }

        try {
            const totals = calculateTotals(values);

            const formData = new FormData();
            if (!deliveryDate) {
                errorMessage('The delivery date is required.')
                return
            }

            formData.append("customer_id", selectedCustomer.id);
            if (deliveryDate) {
                formData.append("delivery_date", deliveryDate.toISOString());
            }
            formData.append("order_terms", values.orderTerms);
            formData.append("discount", values.discount);
            formData.append("additional_charges", values.additionalCharges);
            formData.append("gst_rate", values.gstRate);
            formData.append("sub_total", totals.subTotal);
            formData.append("grand_total", totals.grandTotal);
            formData.append("is_draft", isDraft ? 1 : 0);

            items.forEach((item, index) => {
                formData.append(`items[${index}][id]`, item.id);
                formData.append(`items[${index}][product_id]`, item.product_id);
                formData.append(`items[${index}][name]`, item.name);
                formData.append(`items[${index}][model]`, item.model);
                formData.append(`items[${index}][unique_code]`, item.unique_code);
                formData.append(`items[${index}][qty]`, item.qty);
                formData.append(`items[${index}][size]`, item.size);
                formData.append(`items[${index}][cost]`, item.cost);
                formData.append(`items[${index}][rate]`, item.rate);
                formData.append(`items[${index}][unitPrice]`, item.unitPrice);

                if (item.documentFile && item.documentFile !== "-") {
                    formData.append(`items[${index}][document]`, item.documentFile);
                }
            });

            const res = await dispatch(addBill(formData));
            if (res.error) {
                errorMessage("Failed to save bill");
                return;
            }

            successMessage(`Bill ${isDraft ? "saved as draft" : "created"} successfully!`);
            navigate("/bills");
        } catch (error) {
            console.error("Submit bill failed:", error);
            errorMessage("Failed to create bill");
        } finally {
            setSavingDraft(false);
            setSavingFinal(false);
        }
    };

    // Handle add customer
    const handleAddCustomer = useCallback(async (values, { resetForm }) => {
        try {
            const res = await dispatch(addCustomer(values));
            if (res.error) return;
            resetForm();
            setOpen(false);
        } catch (error) {
            console.error("Add customer failed:", error);
        }
    }, [dispatch]);

    const isLoading = customersLoading || productsLoading || gstsLoading;

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

    return (
        <>
            <Grid
                container
                spacing={2}
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 2 }}
            >
                <Grid size={12}>
                    <Typography variant="h6">Create Bill</Typography>
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
                                    mt:2
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: { xs: "100%", md: "auto" } }}>
                                    <Autocomplete
                                        options={customerData}
                                        size="small"
                                        sx={{ width: { xs: "100%", md: 300 } }}
                                        getOptionLabel={(option) => option?.name || ""}
                                        value={selectedCustomer}
                                        onChange={(e, value) => setSelectedCustomer(value)}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Select Customer"
                                                variant="outlined"
                                                sx={{ width: { xs: "100%", md: 300 } }}
                                                required
                                                error={!selectedCustomer}
                                                helperText={!selectedCustomer ? "Customer is required" : ""}
                                            />
                                        )}
                                    />

                                    <Tooltip title="Add New Customer">
                                        <IconButton color="primary" onClick={() => setOpenAddCustomer(true)}>
                                            <BiSolidUserPlus size={22} />
                                        </IconButton>
                                    </Tooltip>
                                </Box>

                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <DatePicker
                                        label="Delivery Date"
                                        value={deliveryDate}
                                        onChange={(newValue) => setDeliveryDate(newValue)}
                                        slotProps={{
                                            textField: {
                                                size: "small",
                                                sx: { width: { xs: "100%", md: 250 } },
                                                error: deliveryDate && deliveryDate < creationDate,
                                                helperText: deliveryDate && deliveryDate < creationDate
                                                    ? "Delivery date cannot be before creation date"
                                                    : ""
                                            },
                                        }}
                                    />
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
                                                sx={{ width: { xs: "100%", md: 150 } }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label="Model Code"
                                                        variant="outlined"
                                                        error={touched.product_id && Boolean(errors.product_id)}
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
                                                sx={{ minWidth: { xs: "100%", md: 200 } }}
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
                                                sx={{ width: { xs: "100%", md: 100 } }}
                                                inputProps={{ min: 1, max: 10000 }}
                                                required
                                            />

                                            <TextField
                                                label="Size"
                                                variant="outlined"
                                                size="small"
                                                value={selectedProduct?.size || ""}
                                                disabled
                                                sx={{ minWidth: { xs: "100%", md: 100 } }}
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
                                                sx={{ minWidth: { xs: "100%", md: 100 } }}
                                                inputProps={{ min: 0, max: 10000000, step: "0.01" }}
                                                required
                                            />

                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: { xs: "100%", md: "auto" } }}>
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
                                                sx={{ mt: 0, width: { xs: "100%", md: "auto" } }}
                                            >
                                                {isSubmitting ? "Adding..." : "Add Item"}
                                            </Button>
                                        </Box>
                                    </Form>
                                )}
                            </Formik>

                            {/* Items Table/Cards */}
                            {items.length > 0 && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                                        Added Items ({items.length})
                                    </Typography>

                                    {/* Desktop Table View */}
                                    {!isMobile && (
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
                                                        <Td>{item.name}</Td>
                                                        <Td>{item.model}</Td>
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
                                                        <Td>{item.size}</Td>
                                                        <Td>
                                                            <TextField
                                                                type="number"
                                                                value={item.unitPrice}
                                                                onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                                                                size="small"
                                                                sx={{ width: 100 }}
                                                                inputProps={{ min: 0, max: 10000000, step: "0.01" }}
                                                            />
                                                        </Td>
                                                        <Td>₹{item.cost.toLocaleString("en-IN")}</Td>
                                                        <Td>
                                                            {item.document ? (
                                                                <Box
                                                                    sx={{
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        gap: 1,
                                                                    }}
                                                                >
                                                                    <ImagePreviewDialog
                                                                        imageUrl={item.document}
                                                                        alt={item.documentName || "Document"}
                                                                    />
                                                                    <Typography variant="caption">
                                                                        {item.documentName || "Document"}
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
                                    )}

                                    {/* Mobile Card View */}
                                    {isMobile && (
                                        <Stack spacing={2}>
                                            {items.map((item) => (
                                                <Card key={item.id} sx={{ bgcolor: '#f7f7f7' }}>
                                                    <CardContent>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                            <Box sx={{ flex: 1 }}>
                                                                <Typography variant="subtitle2" fontWeight="600">
                                                                    {item.name}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Model: {item.model}
                                                                </Typography>
                                                            </Box>
                                                            <Tooltip title="Delete">
                                                                <IconButton
                                                                    color="error"
                                                                    size="small"
                                                                    onClick={() =>
                                                                        setDeleteDialog({
                                                                            open: true,
                                                                            itemId: item.id,
                                                                        })
                                                                    }
                                                                >
                                                                    <RiDeleteBinLine size={18} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>

                                                        <Stack spacing={1.5}>
                                                            <Box sx={{ display: 'flex', gap: 2 }}>
                                                                <Box sx={{ flex: 1 }}>
                                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                                        Quantity
                                                                    </Typography>
                                                                    <TextField
                                                                        type="number"
                                                                        value={item.qty}
                                                                        onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                                                                        size="small"
                                                                        fullWidth
                                                                        inputProps={{ min: 1, max: 10000 }}
                                                                    />
                                                                </Box>
                                                                <Box sx={{ flex: 1 }}>
                                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                                        Size
                                                                    </Typography>
                                                                    <TextField
                                                                        value={item.size}
                                                                        size="small"
                                                                        fullWidth
                                                                        disabled
                                                                    />
                                                                </Box>
                                                            </Box>

                                                            <Box>
                                                                <Typography variant="caption" color="text.secondary" display="block">
                                                                    Unit Price (₹)
                                                                </Typography>
                                                                <TextField
                                                                    type="number"
                                                                    value={item.unitPrice}
                                                                    onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                                                                    size="small"
                                                                    fullWidth
                                                                    inputProps={{ min: 0, max: 10000000, step: "0.01" }}
                                                                />
                                                            </Box>

                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px solid #ddd' }}>
                                                                <Typography variant="body2" fontWeight="600">
                                                                    Total Cost:
                                                                </Typography>
                                                                <Typography variant="body2" fontWeight="600" color="primary">
                                                                    ₹{item.cost.toLocaleString("en-IN")}
                                                                </Typography>
                                                            </Box>

                                                            {item.document && (
                                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, pt: 1 }}>
                                                                    <ImagePreviewDialog
                                                                        imageUrl={item.document}
                                                                        alt={item.documentName || "Document"}
                                                                    />
                                                                    <Typography variant="caption">
                                                                        {item.documentName || "Document"}
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                        </Stack>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </Stack>
                                    )}
                                </Box>
                            )}
                            {/* Totals Section */}
                            <Formik
                                initialValues={{
                                    orderTerms: "",
                                    discount: "",
                                    additionalCharges: "",
                                    gstRate: "18.00",
                                }}
                                validationSchema={quoteValidationSchema}
                                onSubmit={(values) => handleSubmitQuote(values, false)}
                            >
                                {({ handleChange, values, touched, errors, handleSubmit, isSubmitting }) => {
                                    const totals = calculateTotals(values);

                                    return (
                                        <Form>
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
                                                        <Box sx={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #ccc", pb: 0.5 }}>
                                                            <span>Sub Total</span>
                                                            <span>₹{totals.subTotal.toLocaleString("en-IN")}</span>
                                                        </Box>

                                                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center", mb:1 }}>
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
                                                            <span>₹{(totals.subTotal - totals.discountAmount).toLocaleString("en-IN")}</span>
                                                        </Box>

                                                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center", mb:1 }}>
                                                            <TextField
                                                                label="Add Charges (₹)"
                                                                type="number"
                                                                size="small"
                                                                name="additionalCharges"
                                                                value={values.additionalCharges}
                                                                onChange={handleChange}
                                                                error={touched.additionalCharges && !!errors.additionalCharges}
                                                                helperText={touched.additionalCharges && errors.additionalCharges}
                                                                sx={{ width: "55%" }}
                                                                inputProps={{ min: 0, max: 10000000 }}
                                                            />
                                                            <span>₹{totals.additionalChargesAmount.toLocaleString("en-IN")}</span>
                                                        </Box>

                                                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center" }}>
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
                                                                    <MenuItem key={item.id} value={item.percentage}>
                                                                        {item.percentage}%
                                                                    </MenuItem>
                                                                ))}
                                                            </TextField>
                                                            <span>₹{totals.gstAmount.toLocaleString("en-IN")}</span>
                                                        </Box>

                                                        {/* GST Breakdown - Show IGST for non-Bihar states, CGST+SGST for Bihar */}
                                                        {selectedCustomer && (
                                                            <>
                                                                {selectedCustomer.state?.name?.toUpperCase() !== "BIHAR" ? (
                                                                    <Box
                                                                        sx={{
                                                                            display: "flex",
                                                                            justifyContent: "space-between",
                                                                            pl: 2,
                                                                            color: "text.secondary",
                                                                            fontSize: "0.875rem"
                                                                        }}
                                                                    >
                                                                        <span>IGST ({values.gstRate}%)</span>
                                                                        <span>₹{totals.gstAmount.toLocaleString("en-IN")}</span>
                                                                    </Box>
                                                                ) : (
                                                                    <>
                                                                        <Box
                                                                            sx={{
                                                                                display: "flex",
                                                                                justifyContent: "space-between",
                                                                                pl: 2,
                                                                                color: "text.secondary",
                                                                                fontSize: "0.875rem"
                                                                            }}
                                                                        >
                                                                            <span>CGST ({(parseFloat(values.gstRate) / 2).toFixed(2)}%)</span>
                                                                            <span>₹{(totals.gstAmount / 2).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                                        </Box>
                                                                        <Box
                                                                            sx={{
                                                                                display: "flex",
                                                                                justifyContent: "space-between",
                                                                                pl: 2,
                                                                                color: "text.secondary",
                                                                                fontSize: "0.875rem"
                                                                            }}
                                                                        >
                                                                            <span>SGST ({(parseFloat(values.gstRate) / 2).toFixed(2)}%)</span>
                                                                            <span>₹{(totals.gstAmount / 2).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                                        </Box>
                                                                    </>
                                                                )}
                                                            </>
                                                        )}

                                                        <Box sx={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #222", mt: 1, pt: 0.5, fontWeight: "600", fontSize: "1.1rem" }}>
                                                            <span>Grand Total</span>
                                                            <span>₹{totals.grandTotal.toLocaleString("en-IN")}</span>
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </Grid>

                                            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4, mb:2 }}>
                                                {/* <Button
                                                    variant="outlined"
                                                    color="secondary"
                                                    onClick={() => handleSubmitQuote(values, true)}
                                                    disabled={savingDraft || savingFinal || items.length === 0 || isSubmitting}
                                                    startIcon={savingDraft ? <CircularProgress size={20} color="inherit" /> : null}
                                                >
                                                    {savingDraft ? "Saving..." : "Save as Draft"}
                                                </Button> */}
                                                <Button
                                                    type="submit"
                                                    variant="contained"
                                                    color="primary"
                                                    disabled={savingDraft || savingFinal || items.length === 0 || isSubmitting}
                                                    startIcon={savingFinal ? <CircularProgress size={20} color="inherit" /> : null}
                                                >
                                                    {savingFinal ? "Saving..." : "Create Bill"}
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
            <CustomerFormDialog
                open={openAddCustomer}
                onClose={() => setOpenAddCustomer(false)}
                title="Add Customer"
                initialValues={getInitialCustomerValues()}
                onSubmit={handleAddCustomer}
                states={states}
            />

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
                    <Button onClick={() => setDeleteDialog({ open: false, itemId: null })}>
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

export default GenerateBill;