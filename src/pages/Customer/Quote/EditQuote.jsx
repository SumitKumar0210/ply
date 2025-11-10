import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { MdEdit, MdCheck, MdClose } from "react-icons/md";
import { Autocomplete } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { BiSolidUserPlus } from "react-icons/bi";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { editQuotation, updateQuotation } from "../slice/quotationSlice";
import {
  addCustomer,
  fetchActiveCustomers,
} from "../../Users/slices/customerSlice";
import { fetchStates } from "../../settings/slices/stateSlice";
import { fetchActiveProducts } from "../../settings/slices/productSlice";
import { fetchActiveTaxSlabs } from "../../settings/slices/taxSlabSlice";
import { successMessage, errorMessage } from "../../../toast";
import ImagePreviewDialog from "../../../components/ImagePreviewDialog/ImagePreviewDialog";
import { compressImage } from "../../../components/imageCompressor/imageCompressor";
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

const customerValidationSchema = Yup.object({
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .required("Name is required"),
  mobile: Yup.string()
    .matches(/^[0-9]{10}$/, "Mobile must be 10 digits")
    .required("Mobile is required"),
  email: Yup.string()
    .email("Invalid email format")
    .required("E-mail is required"),
  address: Yup.string().required("Address is required"),
  alternate_mobile: Yup.string().matches(
    /^[0-9]{10}$/,
    "Alternate Mobile must be 10 digits"
  ),
  city: Yup.string().required("City is required"),
  state_id: Yup.string().required("State is required"),
  zip_code: Yup.string()
    .matches(/^[0-9]{6}$/, "ZIP must be 6 digits")
    .required("ZIP code is required"),
  note: Yup.string(),
});

const quoteValidationSchema = Yup.object({
  orderTerms: Yup.string().max(500, "Order terms cannot exceed 500 characters"),
  discount: Yup.number().min(0, "Discount cannot be negative"),
  additionalCharges: Yup.number().min(
    0,
    "Additional charges cannot be negative"
  ),
  gstRate: Yup.number().required("GST rate is required"),
});

// Helper functions
const generateCode = (model) => {
  return `${model}@${Math.floor(1000 + Math.random() * 9000)}`;
};

const parseNumericValue = (value, defaultValue = 0) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

const EditQuote = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Date and Priority State
  const [creationDate, setCreationDate] = useState(new Date());
  const [deliveryDate, setDeliveryDate] = useState(null);
  const [priority, setPriority] = useState("Normal");

  // Customer and Product State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [groupList, setGroupList] = useState([]);

  // Items and Editing State
  const [items, setItems] = useState([]);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editedQty, setEditedQty] = useState("");
  const [qtyError, setQtyError] = useState("");

  // Modal State
  const [openAddCustomer, setOpenAddCustomer] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    itemId: null,
  });

  // Loading State
  const [savingDraft, setSavingDraft] = useState(false);
  const [savingFinal, setSavingFinal] = useState(false);

  // Form Initial Values
  const [initialValues, setInitialValues] = useState({
    orderTerms: "",
    discount: 0,
    additionalCharges: 0,
    gstRate: 18,
  });

  const [compressingDocument, setCompressingDocument] = useState(false);

  const imageUrl = import.meta.env.VITE_MEDIA_URL;

  // Redux selectors
  const { selected: quotationData = {}, loading: quotationLoading } =
    useSelector((state) => state.quotation);
  const { data: customerData = [], loading: customersLoading } = useSelector(
    (state) => state.customer
  );
  const { data: states = [] } = useSelector((state) => state.state);
  const { data: products = [], loading: productsLoading } = useSelector(
    (state) => state.product
  );
  const { data: gsts = [], loading: gstsLoading } = useSelector(
    (state) => state.taxSlab
  );

  // Memoized products map for faster lookups
  const productsMap = useMemo(() => {
    return new Map(products.map((p) => [p.id, p]));
  }, [products]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          dispatch(editQuotation(id)),
          dispatch(fetchActiveCustomers()),
          dispatch(fetchActiveProducts()),
          dispatch(fetchActiveTaxSlabs()),
        ]);
      } catch (error) {
        console.error("Error loading data:", error);
        errorMessage("Failed to load data");
      }
    };
    loadData();
  }, [dispatch, id]);

  // Populate form when quotation data and dependencies are loaded
  useEffect(() => {
    if (
      !quotationData?.id ||
      customerData.length === 0 ||
      products.length === 0
    ) {
      return;
    }

    try {
      let parsedItems = [];
      if (quotationData.product_ids) {
        try {
          parsedItems = JSON.parse(quotationData.product_ids);
        } catch (e) {
          console.error("Error parsing product_ids:", e);
          errorMessage("Failed to parse quotation items");
          return;
        }
      }

      const uniqueGroups = new Set();
      const formattedItems = parsedItems.map((item) => {
        if (item.group) {
          uniqueGroups.add(item.group);
        }

        return {
          id: item.id || `${Date.now()}_${Math.random()}`,
          group: item.group || "",
          product_id: item.product_id || "",
          name: item.name || "",
          model: item.model || "",
          unique_code: item.unique_code || "",
          qty: parseInt(item.qty, 10) || 0,
          size: item.size || "",
          cost: parseNumericValue(item.cost),
          unitPrice: parseNumericValue(item.unitPrice),
          narration: item.narration || "",
          document:
            typeof item.document === "string" ? imageUrl + item.document : "",
          documentFile: null,
          documentName:
            typeof item.document === "string"
              ? item.document.split("/").pop()
              : "",
        };
      });

      setItems(formattedItems);
      setGroupList(Array.from(uniqueGroups));

      if (quotationData.delivery_date) {
        setDeliveryDate(new Date(quotationData.delivery_date));
      }
      if (quotationData.created_at) {
        setCreationDate(new Date(quotationData.created_at));
      }

      setPriority(quotationData.priority || "Normal");

      const customer = customerData.find(
        (c) => c.id === quotationData.customer_id
      );
      if (customer) {
        setSelectedCustomer(customer);
      }

      setInitialValues({
        orderTerms: quotationData.order_terms || "",
        discount: parseNumericValue(quotationData.discount),
        additionalCharges: parseNumericValue(quotationData.additional_charges),
        gstRate: parseNumericValue(quotationData.gst_rate, 18),
      });
    } catch (error) {
      console.error("Error parsing quotation data:", error);
      errorMessage("Failed to load quotation data");
    }
  }, [quotationData, customerData, products, imageUrl]);

  // Customer Modal Handlers
  const openCustomerModal = useCallback(async () => {
    try {
      await dispatch(fetchStates());
      setOpenAddCustomer(true);
    } catch (error) {
      console.error("Error loading states:", error);
      errorMessage("Failed to load states");
    }
  }, [dispatch]);

  const handleAddCustomer = useCallback(
    async (values, { resetForm }) => {
      try {
        const res = await dispatch(addCustomer(values));
        if (res.error) return;
        resetForm();
        setOpenAddCustomer(false);
        await dispatch(fetchActiveCustomers());
        successMessage("Customer added successfully");
      } catch (error) {
        console.error("Add customer failed:", error);
        errorMessage("Failed to add customer");
      }
    },
    [dispatch]
  );

  // Item Management Handlers
  const isDuplicateItem = useCallback(
    (product_id, group) => {
      const normalizedGroup = group?.trim().toLowerCase();
      return items.some(
        (item) =>
          item.product_id === product_id &&
          item.group?.trim().toLowerCase() === normalizedGroup
      );
    },
    [items]
  );

  const handleAddItem = useCallback(
    async (values, { resetForm }) => {
      const { product_id, quantity, group, narration, document } = values;

      if (!product_id) {
        errorMessage("Please select a product before adding.");
        return;
      }

      const qty = parseInt(quantity, 10);
      if (!qty || qty <= 0) {
        errorMessage("Please enter a valid quantity greater than 0.");
        return;
      }

      const product = productsMap.get(product_id);
      if (!product) {
        errorMessage("Selected product not found in the list.");
        return;
      }

      if (isDuplicateItem(product_id, group)) {
        errorMessage(
          "This product is already added. Update quantity in the table instead."
        );
        return;
      }

      // Handle document compression if it's an image
      let finalDocument = document;
      let documentName = document ? document.name : "";
      let documentPreview = null;

      if (document && document.type.startsWith("image/")) {
        try {
          setCompressingDocument(true);

          // Compress the image
          const compressed = await compressImage(document, {
            maxSizeMB: 0.5, // Compress to max 500KB
            maxWidthOrHeight: 1024,
          });

          finalDocument = compressed;
          documentName = document.name;
          documentPreview = documentPreview = URL.createObjectURL(compressed);

          // Log compression results
          const originalSize = (document.size / 1024).toFixed(2);
          const compressedSize = (compressed.size / 1024).toFixed(2);
          const reduction = (
            ((document.size - compressed.size) / document.size) *
            100
          ).toFixed(2);

          console.log(
            `Image compressed: ${originalSize} KB → ${compressedSize} KB (${reduction}% reduction)`
          );
          successMessage(
            `Image compressed successfully! Original: ${originalSize}KB, Compressed: ${compressedSize}KB`
          );
        } catch (error) {
          console.error("Image compression failed:", error);
          errorMessage("Failed to compress image. Using original file.");
          // Continue with original file if compression fails
        } finally {
          setCompressingDocument(false);
        }
      }

      const unitPrice = parseNumericValue(product.rrp);
      const newItem = {
        id: `${Date.now()}_${Math.random()}`,
        group: group?.trim() || "",
        product_id,
        name: product.name,
        model: product.model,
        unique_code: generateCode(product.model),
        qty,
        size: product.size || "",
        cost: unitPrice * qty,
        unitPrice,
        narration: narration?.trim() || "",
        documentFile: finalDocument || "-",
        document: documentPreview || "",
        documentName: documentName || "",
      };

      setItems((prev) => [...prev, newItem]);

      if (group && !groupList.includes(group)) {
        setGroupList((prev) => [...prev, group]);
      }

      setSelectedProduct(null);
      resetForm();
    },
    [productsMap, isDuplicateItem, groupList]
  );

  const confirmDeleteItem = useCallback(() => {
    setItems((prev) => prev.filter((item) => item.id !== deleteDialog.itemId));
    setDeleteDialog({ open: false, itemId: null });
  }, [deleteDialog.itemId]);

  // Editing Handlers
  const handleEditItem = useCallback((itemId, currentQty) => {
    setEditingItemId(itemId);
    setEditedQty(currentQty);
    setQtyError("");
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingItemId(null);
    setEditedQty("");
    setQtyError("");
  }, []);

  const handleQtyChange = useCallback((e) => {
    const value = e.target.value;
    setEditedQty(value);

    const qty = parseInt(value, 10);
    if (!value || !qty || qty <= 0) {
      setQtyError("Must be greater than 0");
    } else {
      setQtyError("");
    }
  }, []);

  const handleSaveEdit = useCallback(() => {
    const qty = parseInt(editedQty, 10);

    if (!qty || qty <= 0) {
      setQtyError("Quantity must be greater than 0");
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === editingItemId) {
          return {
            ...item,
            qty: qty,
            cost: item.unitPrice * qty,
          };
        }
        return item;
      })
    );

    setEditingItemId(null);
    setEditedQty("");
    setQtyError("");
  }, [editedQty, editingItemId]);

  // Calculate totals - memoized to prevent recalculation
  const calculateTotals = useCallback(
    (values) => {
      const subTotal = items.reduce((sum, item) => sum + item.cost, 0);
      const discountAmount = parseNumericValue(values.discount);
      const additionalChargesAmount = parseNumericValue(
        values.additionalCharges
      );
      const afterDiscount =
        subTotal - discountAmount + additionalChargesAmount;
      const gstAmount =
        (afterDiscount * parseNumericValue(values.gstRate)) / 100;
      const grandTotal = afterDiscount + gstAmount;

      return {
        subTotal,
        discountAmount,
        additionalChargesAmount,
        gstAmount,
        grandTotal,
      };
    },
    [items]
  );

  // Get unique groups - memoized
  const uniqueGroups = useMemo(() => {
    return [...new Set(items.map((item) => item.group))];
  }, [items]);

  // Handle final quote submission
  const handleSubmitQuote = useCallback(
    async (values, isDraft = false) => {
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

        formData.append("order_terms", values.orderTerms || "");
        formData.append("discount", values.discount);
        formData.append("additional_charges", values.additionalCharges);
        formData.append("gst_rate", values.gstRate);
        formData.append("sub_total", totals.subTotal);
        formData.append("grand_total", totals.grandTotal);
        formData.append("is_draft", isDraft ? 1 : 0);

        items.forEach((item, index) => {
          formData.append(`items[${index}][id]`, String(item.id || ""));
          formData.append(`items[${index}][group]`, String(item.group || ""));
          formData.append(
            `items[${index}][product_id]`,
            String(item.product_id || "")
          );
          formData.append(`items[${index}][name]`, String(item.name || ""));
          formData.append(`items[${index}][model]`, String(item.model || ""));
          formData.append(
            `items[${index}][unique_code]`,
            String(item.unique_code || "")
          );
          formData.append(`items[${index}][qty]`, String(item.qty || 0));
          formData.append(`items[${index}][size]`, String(item.size || ""));
          formData.append(`items[${index}][cost]`, String(item.cost || 0));
          formData.append(
            `items[${index}][unitPrice]`,
            String(item.unitPrice || 0)
          );
          formData.append(
            `items[${index}][narration]`,
            String(item.narration || "")
          );

          if (item.documentFile && (item.documentFile instanceof File || item.documentFile instanceof Blob)) {
            formData.append(`items[${index}][document]`, item.documentFile, item.documentName || "document.png");
          } else if (item.existing_document) {
            formData.append(`items[${index}][existing_document]`, item.existing_document);
          }
        });

        const result = await dispatch(updateQuotation({ id, formData }));

        if (!result.error) {
          successMessage(
            `Quote ${isDraft ? "saved as draft" : "updated"} successfully!`
          );
          navigate("/customer/quote");
        }
      } catch (error) {
        console.error("Update quote failed:", error);
        errorMessage("Failed to update quote");
      } finally {
        setSavingDraft(false);
        setSavingFinal(false);
      }
    },
    [
      selectedCustomer,
      items,
      calculateTotals,
      creationDate,
      deliveryDate,
      priority,
      dispatch,
      id,
      navigate,
    ]
  );

  const isLoading =
    quotationLoading || customersLoading || productsLoading || gstsLoading;

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
          <Typography variant="h6">Edit Quote</Typography>
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
                        options={products}
                        size="small"
                        getOptionLabel={(option) => option.model || ""}
                        value={selectedProduct}
                        onChange={(e, value) => {
                          setSelectedProduct(value);
                          setFieldValue("product_id", value?.id || "");
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

                      <TextField
                        type="file"
                        name="document"
                        size="small"
                        variant="outlined"
                        inputProps={{
                          accept: "image/*", 
                        }}
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0];
                          if (file) {
                            setFieldValue("document", file);
                          }
                        }}
                        error={touched.document && Boolean(errors.document)}
                        helperText={touched.document && errors.document}
                        sx={{ width: 250 }}
                      />

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
                            .map((item) => {
                              const isEditing = editingItemId === item.id;
                              const displayQty = isEditing
                                ? editedQty
                                : item.qty;
                              const displayCost = isEditing
                                ? item.unitPrice *
                                (parseInt(editedQty, 10) || 0)
                                : item.cost;

                              return (
                                <Tr key={item.id}>
                                  <Td>{item.name}</Td>
                                  <Td>{item.model}</Td>
                                  <Td>
                                    {isEditing ? (
                                      <TextField
                                        type="number"
                                        value={displayQty}
                                        onChange={handleQtyChange}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter")
                                            handleSaveEdit();
                                          if (e.key === "Escape")
                                            handleCancelEdit();
                                        }}
                                        size="small"
                                        autoFocus
                                        error={!!qtyError}
                                        helperText={qtyError}
                                        inputProps={{ min: 1 }}
                                        sx={{ width: "100px" }}
                                      />
                                    ) : (
                                      displayQty
                                    )}
                                  </Td>
                                  <Td>{item.size}</Td>
                                  <Td>
                                    ₹{item.unitPrice.toLocaleString("en-IN")}
                                  </Td>
                                  <Td>
                                    ₹{displayCost.toLocaleString("en-IN")}
                                  </Td>
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
                                    <Box sx={{ display: "flex", gap: 0.5 }}>
                                      {isEditing ? (
                                        <>
                                          <Tooltip title="Save">
                                            <IconButton
                                              color="success"
                                              size="small"
                                              onClick={handleSaveEdit}
                                              disabled={!!qtyError}
                                            >
                                              <MdCheck size={18} />
                                            </IconButton>
                                          </Tooltip>
                                          <Tooltip title="Cancel">
                                            <IconButton
                                              color="default"
                                              size="small"
                                              onClick={handleCancelEdit}
                                            >
                                              <MdClose size={18} />
                                            </IconButton>
                                          </Tooltip>
                                        </>
                                      ) : (
                                        <>
                                          <Tooltip title="Edit Quantity">
                                            <IconButton
                                              color="primary"
                                              size="small"
                                              onClick={() =>
                                                handleEditItem(item.id, item.qty)
                                              }
                                            >
                                              <MdEdit size={16} />
                                            </IconButton>
                                          </Tooltip>
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
                                        </>
                                      )}
                                    </Box>
                                  </Td>
                                </Tr>
                              );
                            })}
                        </Tbody>
                      </Table>
                    </Box>
                  ))}
                </>
              )}

              {/* Totals Section */}
              <Formik
                initialValues={initialValues}
                enableReinitialize={true}
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
                        >
                          {savingDraft ? (
                            <>
                              <CircularProgress
                                size={20}
                                color="inherit"
                                sx={{ mr: 1 }}
                              />
                              Saving...
                            </>
                          ) : (
                            "Save as Draft"
                          )}
                        </Button>
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          disabled={
                            savingDraft || savingFinal || items.length === 0
                          }
                        >
                          {savingFinal ? (
                            <>
                              <CircularProgress
                                size={20}
                                color="inherit"
                                sx={{ mr: 1 }}
                              />
                              Updating...
                            </>
                          ) : (
                            "Update"
                          )}
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
          {({ handleChange, values, touched, errors }) => (
            <Form>
              <DialogContent dividers>
                <Grid container rowSpacing={1} columnSpacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
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
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
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
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
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
                  <Grid size={{ xs: 12, md: 6 }}>
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
                    />
                  </Grid>
                  <Grid size={12}>
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
                    />
                  </Grid>
                  <Grid size={12}>
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
                    >
                      {states.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
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
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
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
                    />
                  </Grid>
                  <Grid size={12}>
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
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => setOpenAddCustomer(false)}
                  variant="outlined"
                  color="error"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="contained" color="primary">
                  Submit
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

export default EditQuote;