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
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
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
} from "../Users/slices/customerSlice";
import { fetchStates } from "../settings/slices/stateSlice";
import { fetchActiveProducts } from "../settings/slices/productSlice";
import { fetchActiveTaxSlabs } from "../settings/slices/taxSlabSlice";
import {
  updateBill,
  fetchBillById,
  clearCurrentBill,
} from "./slice/billsSlice";
import { successMessage, errorMessage } from "../../toast";
import ImagePreviewDialog from "../../components/ImagePreviewDialog/ImagePreviewDialog";
import CustomerFormDialog, {
  getInitialCustomerValues,
} from "../../components/Customer/CustomerFormDialog";

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
  invoiceNumber: Yup.string()
    .required("Invoice number is required")
    .max(50, "Invoice number cannot exceed 50 characters")
    .matches(
      /^[a-zA-Z0-9\-\/]*$/,
      "Invoice number can only contain letters, numbers, hyphens, and slashes"
    ),
});

const EditBill = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { id } = useParams();
  const [creationDate, setCreationDate] = useState(new Date());
  const [deliveryDate, setDeliveryDate] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [openAddCustomer, setOpenAddCustomer] = useState(false);
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
      const customer = customerData.find(
        (c) => c.id === currentBill.customer_id
      );
      setSelectedCustomer(customer || null);
      setCreationDate(new Date(currentBill.quote_date));
      setDeliveryDate(
        currentBill.delivery_date ? new Date(currentBill.delivery_date) : null
      );
      setInvoiceNumber(currentBill.invoice_no || "");

      const billItems = currentBill.items || currentBill.product || [];
      if (billItems.length > 0) {
        setItems(
          billItems.map((item) => {
            if (item.product) {
              return {
                ...item,
                id: item.id || Date.now() + Math.random(),
                product_id: item.product_id || item.product.id,
                name: item.name || item.product.name,
                model: item.model || item.product.model,
                size: item.size || item.product.size,
                cost:
                  parseFloat(item.cost) ||
                  parseFloat(item.amount) ||
                  parseFloat(item.rate || 0) * parseFloat(item.qty || 0),
                unitPrice: parseFloat(item.rate || item.unitPrice || 0),
                qty: item.qty || 0,
                document:
                  item.document ||
                  (item.product.image
                    ? `${mediaUrl}${item.product.image}`
                    : ""),
                documentName:
                  item.documentName ||
                  (item.product.image ? `${item.product.name} Image` : ""),
              };
            } else {
              return {
                ...item,
                id: item.id || Date.now() + Math.random(),
                cost:
                  parseFloat(item.cost) ||
                  parseFloat(item.amount) ||
                  parseFloat(item.rate || 0) * parseFloat(item.qty || 0),
                unitPrice: parseFloat(item.rate || item.unitPrice || 0),
                qty: item.qty || 0,
              };
            }
          })
        );
      }
    }
  }, [currentBill, customerData, mediaUrl]);

  const openCustomerModal = async () => {
    await dispatch(fetchStates());
    setOpenAddCustomer(true);
  };

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

  const isDuplicateItem = useCallback(
    (product_id) => {
      const normalizedProduct = String(product_id).trim();
      return items.some(
        (item) => String(item.product_id).trim() === normalizedProduct
      );
    },
    [items]
  );

  const handleAddItem = async (
    values,
    { resetForm, setFieldValue, setSubmitting }
  ) => {
    const { product_id, quantity, price } = values;

    if (!product_id) {
      errorMessage("Please select a product before adding.");
      setSubmitting(false);
      return;
    }

    const quantityNum = parseInt(quantity, 10);
    const priceNum = parseFloat(price);

    if (!quantity || isNaN(quantityNum) || quantityNum <= 0) {
      errorMessage("Please enter a valid quantity greater than 0.");
      setSubmitting(false);
      return;
    }

    if (!price || isNaN(priceNum) || priceNum <= 0) {
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
      unique_code: `${product.model}@${Math.floor(
        1000 + Math.random() * 9000
      )}`,
      qty: quantityNum,
      size: product.size,
      cost: priceNum * quantityNum,
      rate: priceNum,
      unitPrice: priceNum,
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
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      errorMessage("Price cannot be negative");
      return;
    }
    if (price > 10000000) {
      errorMessage("Price cannot exceed 1 crore");
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const updatedCost = price * item.qty;
          return {
            ...item,
            unitPrice: price,
            cost: updatedCost,
          };
        }
        return item;
      })
    );
  };

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

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const updatedCost = item.unitPrice * quantity;
          return {
            ...item,
            qty: quantity,
            cost: updatedCost,
          };
        }
        return item;
      })
    );
  };

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

  const validateForm = (values) => {
    if (!selectedCustomer) {
      errorMessage("Please select a customer");
      return false;
    }

    if (items.length === 0) {
      errorMessage("Please add at least one item");
      return false;
    }

    if (!invoiceNumber.trim()) {
      errorMessage("Invoice number is required");
      return false;
    }

    const totals = calculateTotals(values);
    if (totals.grandTotal < 0) {
      errorMessage("Grand total cannot be negative");
      return false;
    }

    return true;
  };

  const handleUpdateBill = async (values, isDraft = false) => {
    if (!validateForm(values)) {
      return;
    }

    setUpdating(true);

    try {
      const totals = calculateTotals(values);

      const formData = new FormData();

      formData.append("customer_id", selectedCustomer.id);
      formData.append("invoice_no", invoiceNumber);
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

  const isLoading =
    loading ||
    customersLoading ||
    productsLoading ||
    gstsLoading ||
    billLoading;

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
        <Grid size={12}>
          <Typography variant="h6">
            Edit Bill - {currentBill?.invoice_no}
          </Typography>
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
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: isMobile ? '100%' : 'auto' }}>
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
                        sx={{ width: isMobile ? '100%' : 300 }}
                        required
                        error={!selectedCustomer}
                        helperText={
                          !selectedCustomer ? "Customer is required" : ""
                        }
                      />
                    )}
                    sx={{ flex: isMobile ? 1 : 'none' }}
                  />

                  <Tooltip title="Add New Customer">
                    <IconButton color="primary" onClick={openCustomerModal}>
                      <BiSolidUserPlus size={22} />
                    </IconButton>
                  </Tooltip>
                </Box>

                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: isMobile ? '100%' : 'auto', flexWrap: 'wrap' }}>
                    <DatePicker
                      label="Delivery Date"
                      value={deliveryDate}
                      onChange={setDeliveryDate}
                      slotProps={{
                        textField: {
                          size: "small",
                          sx: { width: isMobile ? '100%' : 250 },
                          error: deliveryDate && deliveryDate < creationDate,
                          helperText:
                            deliveryDate && deliveryDate < creationDate
                              ? "Delivery date cannot be before creation date"
                              : "",
                        },
                      }}
                    />
                    <TextField
                      label="Invoice Number"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      size="small"
                      sx={{ width: isMobile ? '100%' : 250 }}
                      required
                    />
                  </Box>
                </LocalizationProvider>
              </Box>

              {/* Customer Details */}
              {selectedCustomer && (
                <Typography
                  variant="body2"
                  sx={{ mb: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}
                >
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
                initialValues={{ product_id: "", quantity: "", price: "" }}
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
                            sx={{ width: isMobile ? '100%' : 150 }}
                            error={
                              touched.product_id && Boolean(errors.product_id)
                            }
                            helperText={touched.product_id && errors.product_id}
                            required
                          />
                        )}
                        sx={{ width: isMobile ? '100%' : 'auto' }}
                      />

                      <TextField
                        label="Item Name"
                        variant="outlined"
                        size="small"
                        value={selectedProduct?.name || ""}
                        disabled
                        sx={{ minWidth: isMobile ? '100%' : 200 }}
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
                        sx={{ width: isMobile ? '100%' : 100 }}
                        inputProps={{ min: 1, max: 10000 }}
                        required
                      />

                      <TextField
                        label="Size"
                        variant="outlined"
                        size="small"
                        value={selectedProduct?.size || ""}
                        disabled
                        sx={{ minWidth: isMobile ? '100%' : 100 }}
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
                        sx={{ minWidth: isMobile ? '100%' : 100 }}
                        inputProps={{ min: 0, max: 10000000, step: "0.01" }}
                        required
                      />

                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1, width: isMobile ? '100%' : 'auto' }}
                      >
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
                        sx={{ mt: 0, width: isMobile ? '100%' : 'auto' }}
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
                  <Typography
                    variant="subtitle1"
                    sx={{ mb: 2, fontWeight: 600 }}
                  >
                    Bill Items ({items.length})
                  </Typography>
                  
                  {isMobile ? (
                    // Mobile Card View
                    <Stack spacing={2}>
                      {items.map((item) => (
                        <Card key={item.id} sx={{ bgcolor: '#f7f7f7' }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Box>
                                <Typography variant="subtitle2" fontWeight="600">
                                  {item.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Code: {item.model}
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
                                  <RiDeleteBinLine size={16} />
                                </IconButton>
                              </Tooltip>
                            </Box>

                            <Grid container spacing={2}>
                              <Grid size={6}>
                                <Typography variant="caption" color="text.secondary">
                                  Quantity
                                </Typography>
                                <TextField
                                  type="number"
                                  value={item.qty}
                                  onChange={(e) =>
                                    updateItemQuantity(
                                      item.id,
                                      parseInt(e.target.value) || 1
                                    )
                                  }
                                  size="small"
                                  fullWidth
                                  inputProps={{ min: 1, max: 10000 }}
                                />
                              </Grid>
                              <Grid size={6}>
                                <Typography variant="caption" color="text.secondary">
                                  Size
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  {item.size}
                                </Typography>
                              </Grid>
                              <Grid size={12}>
                                <Typography variant="caption" color="text.secondary">
                                  Unit Price (₹)
                                </Typography>
                                <TextField
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(e) =>
                                    updateItemPrice(
                                      item.id,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  size="small"
                                  fullWidth
                                  inputProps={{
                                    min: 0,
                                    max: 10000000,
                                    step: "0.01",
                                  }}
                                />
                              </Grid>
                              <Grid size={12}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                  <Typography variant="body2" fontWeight="600">
                                    Total Cost
                                  </Typography>
                                  <Typography variant="body2" fontWeight="600">
                                    ₹{(item.cost || 0).toLocaleString("en-IN")}
                                  </Typography>
                                </Box>
                              </Grid>
                              {item.document && (
                                <Grid size={12}>
                                  <Typography variant="caption" color="text.secondary">
                                    Document
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                      mt: 0.5
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
                                </Grid>
                              )}
                            </Grid>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  ) : (
                    // Desktop Table View
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
                                onChange={(e) =>
                                  updateItemQuantity(
                                    item.id,
                                    parseInt(e.target.value) || 1
                                  )
                                }
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
                                onChange={(e) =>
                                  updateItemPrice(
                                    item.id,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                size="small"
                                sx={{ width: 100 }}
                                inputProps={{
                                  min: 0,
                                  max: 10000000,
                                  step: "0.01",
                                }}
                              />
                            </Td>
                            <Td>₹{(item.cost || 0).toLocaleString("en-IN")}</Td>
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
                {({
                  handleChange,
                  values,
                  touched,
                  errors,
                  handleSubmit,
                  isSubmitting,
                }) => {
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
                            flexDirection: isMobile ? 'column' : 'row',
                            
                          }}
                        >
                          <Box sx={{ width: isMobile ? '100%' : "48%", minWidth: isMobile ? '100%' : "300px" }}>
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
                                border:
                                  touched.orderTerms && errors.orderTerms
                                    ? "1px solid #d32f2f"
                                    : "1px solid #ccc",
                              }}
                            />
                            {touched.orderTerms && errors.orderTerms && (
                              <Typography
                                variant="caption"
                                color="error"
                                sx={{ mt: 0.5, display: "block" }}
                              >
                                {errors.orderTerms}
                              </Typography>
                            )}
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 1,
                              minWidth: isMobile ? '100%' : "300px",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                borderBottom: "1px solid #ccc",
                                pb: 0.5,
                                mb:1,
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
                                mb:1,
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
                                mb:1,
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
                        direction={isMobile ? "column" : "row"}
                        spacing={2}
                        justifyContent="flex-end"
                        sx={{ mt: { xs: 2, sm: 4 }, mb:2 }}
                      >
                        <Button
                          variant="outlined"
                          onClick={() => navigate("/bills")}
                          fullWidth={isMobile}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          onClick={() => handleUpdateBill(values, true)}
                          disabled={
                            updating || items.length === 0 || isSubmitting
                          }
                          startIcon={
                            updating ? (
                              <CircularProgress size={20} color="inherit" />
                            ) : null
                          }
                          fullWidth={isMobile}
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
            Are you sure you want to delete this item from the bill? This action
            cannot be undone.
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