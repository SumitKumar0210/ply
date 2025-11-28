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
import AddIcon from "@mui/icons-material/Add";
import { useDispatch, useSelector } from "react-redux";
import {
  addCustomer,
  fetchActiveCustomers,
} from "../../Users/slices/customerSlice";
import { fetchStates } from "../../settings/slices/stateSlice";
import { fetchActiveProducts } from "../../settings/slices/productSlice";
import { fetchActiveTaxSlabs } from "../../settings/slices/taxSlabSlice";
import { fetchActiveGroup } from "../../settings/slices/groupSlice";
import { addQuotation } from "../slice/quotationSlice";
import { successMessage, errorMessage } from "../../../toast";
import { useNavigate } from "react-router-dom";
import { compressImage } from "../../../components/imageCompressor/imageCompressor";
import ImagePreviewDialog from "../../../components/ImagePreviewDialog/ImagePreviewDialog";
import ProductFormDialog from "../../../components/Product/ProductFormDialog";
import CustomerFormDialog, {
  getInitialCustomerValues,
} from "../../../components/Customer/CustomerFormDialog";

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
  group: Yup.string().required("Group is required"),
  product_id: Yup.string().required("Product is required"),
  quantity: Yup.number()
    .required("Quantity is required")
    .positive("Quantity must be positive")
    .integer("Quantity must be a whole number"),
  narration: Yup.string(),
});

const quoteValidationSchema = Yup.object({
  orderTerms: Yup.string().max(
    500,
    "Order terms can not exceed 500 characters"
  ),
  discount: Yup.number().min(0, "Discount can not be negative"),
  additionalCharges: Yup.number().min(
    0,
    "Additional charges can not be negative"
  ),
  gstRate: Yup.number().required("GST rate is required"),
});

const CreateQuote = () => {
  const [creationDate, setCreationDate] = useState(new Date());
  const [deliveryDate, setDeliveryDate] = useState(null);
  const [priority, setPriority] = useState("Normal");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [openAddCustomer, setOpenAddCustomer] = useState(false);
  const [openAddProduct, setOpenAddProduct] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    itemId: null,
  });
  const navigate = useNavigate();
  const [groupList, setGroupList] = useState([]);
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

  // Load initial data
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
  const handleAddCustomer = async (values, { resetForm }) => {
    try {
      const res = await dispatch(addCustomer(values));
      if (res.error) return;
      resetForm();
      setOpenAddCustomer(false);
      await dispatch(fetchActiveCustomers());
    } catch (error) {
      console.error("Add customer failed:", error);
    }
  };

  // Handle product success (after adding new product)
  const handleProductSuccess = async () => {
    setOpenAddProduct(false);
    setSelectedProduct(null);
    // Fetch latest products
    await dispatch(fetchActiveProducts());
  };

  const isDuplicateItem = useCallback(
    (product_id, group) => {
      const normalizedGroup = (group || "").trim().toLowerCase();
      const normalizedProduct = String(product_id).trim();

      return items.some((item) => {
        const existingGroup = (item.group || "").trim().toLowerCase();
        const existingProduct = String(item.product_id).trim();

        return (
          existingProduct === normalizedProduct &&
          existingGroup === normalizedGroup
        );
      });
    },
    [items]
  );

  const generateCode = (model) => {
    return model + "@" + Math.floor(1000 + Math.random() * 9000);
  };

  const handleAddItem = async (values, { resetForm, setFieldValue }) => {
    const { product_id, quantity, group, narration, document } = values;

    if (!product_id) {
      errorMessage("Please select a product before adding.");
      return;
    }

    if (!quantity || isNaN(quantity) || quantity <= 0) {
      errorMessage("Please enter a valid quantity greater than 0.");
      return;
    }

    const product = products.find((p) => p.id === product_id);
    if (!product) {
      errorMessage("Selected product not found in the list.");
      return;
    }

    if (isDuplicateItem(product_id, group)) {
      errorMessage(
        "This Product is already added. Update quantity in the table instead."
      );
      return;
    }

    // Use product image from API

    const productImageUrl = product.image ? `${mediaUrl}${product.image}` : "";

    const newItem = {
      id: Date.now(),
      group,
      product_id,
      name: product.name,
      model: product.model,
      unique_code: generateCode(product.model),
      qty: parseInt(quantity, 10),
      size: product.size,
      cost: parseFloat(product.rrp) * parseInt(quantity, 10),
      unitPrice: parseFloat(product.rrp),
      narration,
      documentFile: product.image || "-",
      document: productImageUrl || "",
      documentName: product.image ? `${product.name} Image` : "",
    };
    setGroupList((prev) => {
      const newGroup = group?.trim();
      if (!newGroup) return prev;

      return prev.includes(newGroup) ? prev : [...prev, newGroup];
    });
    setItems((prev) => [...prev, newItem]);
    setSelectedProduct(null);
    resetForm();
  };

  // Handle delete item
  const confirmDeleteItem = () => {
    setItems((prev) => prev.filter((item) => item.id !== deleteDialog.itemId));
    setDeleteDialog({ open: false, itemId: null });
  };

  // Calculate totals
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

  // Get unique groups
  const uniqueGroups = [...new Set(items.map((item) => item.group))];

  // Handle final quote submission with FormData
  const handleSubmitQuote = async (values, isDraft = false) => {
    if (!selectedCustomer) {
      errorMessage("Please select a customer");
      return;
    }

    if (items.length === 0) {
      errorMessage("Please add at least one item");
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

      formData.append("customer_id", selectedCustomer.id);
      formData.append("quote_date", creationDate.toISOString());
      formData.append("priority", priority);
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
        formData.append(`items[${index}][group]`, item.group);
        formData.append(`items[${index}][product_id]`, item.product_id);
        formData.append(`items[${index}][name]`, item.name);
        formData.append(`items[${index}][model]`, item.model);
        formData.append(`items[${index}][unique_code]`, item.unique_code);
        formData.append(`items[${index}][qty]`, item.qty);
        formData.append(`items[${index}][size]`, item.size);
        formData.append(`items[${index}][cost]`, item.cost);
        formData.append(`items[${index}][unitPrice]`, item.unitPrice);
        formData.append(`items[${index}][narration]`, item.narration || "");

        // Send product image path to server
        if (item.documentFile && item.documentFile !== "-") {
          formData.append(`items[${index}][document]`, item.documentFile);
        }
      });

      const res = await dispatch(addQuotation(formData));
      if (res.error) return;
      successMessage(
        `Quote ${isDraft ? "saved as draft" : "submitted"} successfully!`
      );
      navigate("/customer/quote");
    } catch (error) {
      console.error("Submit quote failed:", error);
      errorMessage("Failed to submit quote");
    } finally {
      setSavingDraft(false);
      setSavingFinal(false);
    }
  };

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

  // Create enhanced products list with "Add New" option
  const enhancedProducts = [
    { id: "add_new", model: "➕ Add New Product", isAddNew: true },
    ...products,
  ];

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
          <Typography variant="h6">Create Quote</Typography>
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
                      label="Quote Date"
                      value={creationDate}
                      onChange={(newValue) => setCreationDate(newValue)}
                      slotProps={{
                        textField: { size: "small", sx: { width: 250 } },
                      }}
                    />
                    <DatePicker
                      label="Delivery Date"
                      value={deliveryDate}
                      onChange={(newValue) => setDeliveryDate(newValue)}
                      slotProps={{
                        textField: { size: "small", sx: { width: 250 } },
                      }}
                    />
                    <Autocomplete
                      options={["Normal", "High", "Low"]}
                      size="small"
                      value={priority}
                      onChange={(e, value) => setPriority(value)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Priority"
                          variant="outlined"
                          sx={{ width: 150 }}
                        />
                      )}
                    />
                  </Box>
                </LocalizationProvider>
              </Box>

              {/* Customer Details */}
              {selectedCustomer && (
                <Typography variant="body2" sx={{ mb: 2 }}>
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
                  group: "",
                  product_id: "",
                  quantity: "",
                  narration: "",
                  document: null,
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
                }) => (
                  <Form onSubmit={handleSubmit}>
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 2,
                        mb: 3,
                        mt: 3,
                      }}
                    >
                      <Autocomplete
                        freeSolo
                        options={groupList}
                        value={values.group}
                        onChange={(e, value) => {
                          setFieldValue("group", value || "");
                        }}
                        onInputChange={(e, value) => {
                          setFieldValue("group", value || "");
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Group"
                            variant="outlined"
                            size="small"
                            error={touched.group && Boolean(errors.group)}
                            helperText={touched.group && errors.group}
                            sx={{ minWidth: 150 }}
                          />
                        )}
                      />

                      <Autocomplete
                        options={enhancedProducts}
                        size="small"
                        getOptionLabel={(option) => option.model || ""}
                        value={selectedProduct}
                        onChange={(e, value) => {
                          if (value?.isAddNew) {
                            // Open add product dialog
                            openProductModal();
                            setSelectedProduct(null);
                            setFieldValue("product_id", "");
                          } else {
                            setSelectedProduct(value);
                            setFieldValue("product_id", value?.id || "");
                          }
                        }}
                        renderOption={(props, option) => {
                          const { key, ...otherProps } = props;
                          return (
                            <li
                              key={key}
                              {...otherProps}
                              style={{
                                fontWeight: option.isAddNew ? "bold" : "normal",
                                color: option.isAddNew ? "#1976d2" : "inherit",
                              }}
                            >
                              {option.model}
                            </li>
                          );
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
                        inputProps={{ min: 1 }}
                      />

                      <TextField
                        label="Size"
                        variant="outlined"
                        size="small"
                        value={selectedProduct?.size || ""}
                        disabled
                        sx={{ minWidth: 100 }}
                      />

                      <TextareaAutosize
                        minRows={1}
                        placeholder="Narration"
                        name="narration"
                        value={values.narration}
                        onChange={handleChange}
                        style={{
                          width: "250px",
                          padding: "8px",
                          borderColor:
                            touched.narration && errors.narration
                              ? "red"
                              : "#ccc",
                          borderRadius: "4px",
                          fontFamily: "inherit",
                        }}
                      />

                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {/* <Button
                          variant="outlined"
                          component="label"
                          size="small"
                        >
                          Upload Image
                          <input
                            hidden
                            type="file"
                            accept="image/*"
                            onChange={(event) => {
                              const file = event.currentTarget.files?.[0];
                              if (file) {
                                setFieldValue("document", file);
                                setDocumentPreview(URL.createObjectURL(file));
                              }
                            }}
                          />
                        </Button> */}

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
                        disabled={!selectedProduct}
                        sx={{ mt: 0 }}
                      >
                        Add
                      </Button>
                    </Box>
                  </Form>
                )}
              </Formik>

              {/* Items Table */}
              {items.length > 0 && (
                <>
                  {uniqueGroups.map((group) => (
                    <Box key={group} sx={{ mb: 3 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, mb: 1 }}
                      >
                        {group}
                      </Typography>
                      <Table>
                        <Thead>
                          <Tr>
                            <Th>Item Name</Th>
                            <Th>Item Code</Th>
                            <Th>Qty</Th>
                            <Th>Size</Th>
                            <Th>Unit Price</Th>
                            <Th>Total Cost</Th>
                            <Th>Documents</Th>
                            <Th>Narration</Th>
                            <Th>Action</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {items
                            .filter((item) => item.group === group)
                            .map((item) => (
                              <Tr key={item.id}>
                                <Td>{item.name}</Td>
                                <Td>{item.model}</Td>
                                <Td>{item.qty}</Td>
                                <Td>{item.size}</Td>
                                <Td>
                                  ₹{item.unitPrice.toLocaleString("en-IN")}
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
                                <Td>{item.narration || "-"}</Td>
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
                  ))}
                </>
              )}

              {/* Totals Section */}
              <Formik
                initialValues={{
                  orderTerms: "",
                  discount: "",
                  additionalCharges: "",
                  gstRate: 18,
                }}
                validationSchema={quoteValidationSchema}
                onSubmit={(values) => handleSubmitQuote(values, false)}
              >
                {({ handleChange, values, touched, errors, handleSubmit }) => {
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
                          <TextareaAutosize
                            minRows={3}
                            maxRows={6}
                            placeholder="Order Terms (max 500 characters)"
                            name="orderTerms"
                            value={values.orderTerms}
                            onChange={handleChange}
                            style={{
                              width: "48%",
                              minWidth: "300px",
                              padding: "8px",
                              fontFamily: "inherit",
                              borderRadius: "4px",
                              border: "1px solid #ccc",
                            }}
                          />

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
                                label="Discount"
                                type="number"
                                size="small"
                                name="discount"
                                value={values.discount}
                                onChange={handleChange}
                                error={touched.discount && !!errors.discount}
                                helperText={touched.discount && errors.discount}
                                sx={{ width: "55%" }}
                                inputProps={{ min: 0 }}
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
                                label="Add Charges"
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
                                inputProps={{ min: 0 }}
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
                          variant="contained"
                          color="secondary"
                          onClick={() => handleSubmitQuote(values, true)}
                          disabled={
                            savingDraft || savingFinal || items.length === 0
                          }
                          startIcon={
                            savingDraft ? (
                              <CircularProgress size={20} color="inherit" />
                            ) : null
                          }
                        >
                          {savingDraft ? "Saving..." : "Save as Draft"}
                        </Button>
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          disabled={
                            savingDraft || savingFinal || items.length === 0
                          }
                          startIcon={
                            savingFinal ? (
                              <CircularProgress size={20} color="inherit" />
                            ) : null
                          }
                        >
                          {savingFinal ? "Saving..." : "Save"}
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

      {/* Add Product Dialog */}
      <ProductFormDialog
        open={openAddProduct}
        onClose={() => setOpenAddProduct(false)}
        onSuccess={handleProductSuccess}
      />

      {/* Delete Item Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, itemId: null })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this item from the quote?
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

export default CreateQuote;
