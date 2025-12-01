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
  Box,
  TextField,
  CircularProgress,
} from "@mui/material";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { RiDeleteBinLine } from "react-icons/ri";
import { Autocomplete } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useDispatch, useSelector } from "react-redux";
import { fetchActiveProducts } from "../settings/slices/productSlice";
import { storeProductionOrder } from "./slice/orderSlice";
import { fetchSupervisor } from "../Customer/slice/orderSlice";
import { successMessage, errorMessage } from "../../toast";
import { useNavigate, useParams } from "react-router-dom";

// Validation Schema
const itemValidationSchema = Yup.object({
  group: Yup.string().required("Group is required"),
  product_id: Yup.string().required("Product is required"),
  original_qty: Yup.number()
    .required("Original quantity is required")
    .positive("Quantity must be positive")
    .integer("Quantity must be a whole number"),
  start_date: Yup.date().required("Start date is required"),
  end_date: Yup.date()
    .required("End date is required")
    .min(Yup.ref("start_date"), "End date must be after start date"),
});

const AddOrder = () => {
  const { quotationId } = useParams();
  const [batchNo, setBatchNo] = useState("");
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [projectStartDate, setProjectStartDate] = useState(new Date());
  const [edd, setEdd] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, itemId: null });
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data: products = [], loading: productsLoading } = useSelector(
    (state) => state.product
  );
  const { user = [], loading: supervisorLoading } = useSelector((state) => state.order);

  // Load initial data
  useEffect(() => {
    dispatch(fetchActiveProducts());
    dispatch(fetchSupervisor());
  }, [dispatch]);

  // Memoized unique groups list
  const groupList = useMemo(() => {
    return [...new Set(items.map((item) => item.group))];
  }, [items]);

  // Memoized unique groups for rendering
  const uniqueGroups = useMemo(() => {
    return [...new Set(items.map((item) => item.group))];
  }, [items]);

  // Check for duplicate items
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

  // Generate unique code for items
  const generateCode = useCallback((model) => {
    return `${model}@${Math.floor(1000 + Math.random() * 9000)}`;
  }, []);

  // Handle add item
  const handleAddItem = useCallback(
    async (values, { resetForm }) => {
      const { product_id, original_qty, group, start_date, end_date } = values;

      if (!product_id) {
        errorMessage("Please select a product before adding.");
        return;
      }

      const product = products.find((p) => p.id === product_id);
      if (!product) {
        errorMessage("Selected product not found in the list.");
        return;
      }

      if (isDuplicateItem(product_id, group)) {
        errorMessage("This Product is already added in this group.");
        return;
      }

      const newItem = {
        id: Date.now(),
        group: group.trim(),
        product_id,
        name: product.name,
        model: product.model,
        unique_code: generateCode(product.model),
        original_qty: parseInt(original_qty, 10),
        production_qty: parseInt(original_qty, 10),
        size: product.size,
        start_date: start_date,
        end_date: end_date,
      };

      setItems((prev) => [...prev, newItem]);
      setSelectedProduct(null);
      resetForm();
    },
    [products, isDuplicateItem, generateCode]
  );

  // Handle delete item
  const confirmDeleteItem = useCallback(() => {
    setItems((prev) => prev.filter((item) => item.id !== deleteDialog.itemId));
    setDeleteDialog({ open: false, itemId: null });
  }, [deleteDialog.itemId]);

  // Handle final submission
  const handleSubmit = useCallback(async () => {
    if (!selectedSupervisor) {
      errorMessage("Please select a supervisor");
      return;
    }

    if (!edd) {
      errorMessage("Please select EDD (Expected Delivery Date)");
      return;
    }

    if (items.length === 0) {
      errorMessage("Please add at least one item");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        quotation_id: quotationId || null,
        batch_no: batchNo.trim() || null,
        customer_id: null,
        supervisor_id: selectedSupervisor?.id || null,
        project_start_date: projectStartDate.toISOString(),
        edd: edd.toISOString(),
        items: items.map((item) => ({
          product_id: item.product_id,
          group: item.group,
          name: item.name,
          model: item.model,
          unique_code: item.unique_code,
          original_qty: item.original_qty,
          production_qty: item.original_qty,
          size: item.size,
          start_date: item.start_date.toISOString(),
          end_date: item.end_date.toISOString(),
        })),
      };

      const res = await dispatch(storeProductionOrder(payload));
      if (res.error) return;

      successMessage("Production order added successfully!");
      navigate("/production/orders");
    } catch (error) {
      console.error("Submit failed:", error);
      errorMessage("Failed to add production order");
    } finally {
      setSaving(false);
    }
  }, [quotationId, batchNo, selectedSupervisor, projectStartDate, edd, items, dispatch, navigate]);

  if (productsLoading || supervisorLoading) {
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
      <Grid container spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Grid size={12}>
          <Typography variant="h6">Add to Production</Typography>
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
                  mb: 3,
                }}
              >
                <TextField
                  label="Batch Number"
                  variant="outlined"
                  size="small"
                  disabled={true}
                  value={batchNo}
                  onChange={(e) => setBatchNo(e.target.value)}
                  sx={{ width: 200 }}
                />

                <Autocomplete
                  options={user || []}
                  size="small"
                  getOptionLabel={(option) => option?.name || ""}
                  loading={supervisorLoading}
                  value={selectedSupervisor}
                  onChange={(event, newValue) => {
                    setSelectedSupervisor(newValue);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Supervisor"
                      variant="outlined"
                      required
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {supervisorLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  sx={{ width: 300 }}
                />

                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Project Start Date"
                    value={projectStartDate}
                    onChange={(newValue) => setProjectStartDate(newValue)}
                    slotProps={{
                      textField: { size: "small", sx: { width: 250 }, required: true },
                    }}
                  />
                  <DatePicker
                    label="EDD (Expected Delivery Date)"
                    value={edd}
                    onChange={(newValue) => setEdd(newValue)}
                    slotProps={{
                      textField: { size: "small", sx: { width: 250 }, required: true },
                    }}
                  />
                </LocalizationProvider>
              </Box>

              {/* Add Item Form */}
              <Formik
                initialValues={{
                  group: "",
                  product_id: "",
                  original_qty: "",
                  start_date: new Date(),
                  end_date: null,
                }}
                validationSchema={itemValidationSchema}
                onSubmit={handleAddItem}
              >
                {({ handleChange, handleSubmit, values, touched, errors, setFieldValue }) => (
                  <Form onSubmit={handleSubmit}>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3, mt: 3 }}>
                      <Autocomplete
                        freeSolo
                        options={groupList}
                        value={values.group}
                        onChange={(e, value) => setFieldValue("group", value || "")}
                        onInputChange={(e, value) => setFieldValue("group", value || "")}
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
                            error={touched.product_id && Boolean(errors.product_id)}
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
                        label=" Qty"
                        variant="outlined"
                        size="small"
                        type="number"
                        name="original_qty"
                        value={values.original_qty}
                        onChange={handleChange}
                        error={touched.original_qty && Boolean(errors.original_qty)}
                        helperText={touched.original_qty && errors.original_qty}
                        sx={{ width: 120 }}
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

                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Start Date"
                          value={values.start_date}
                          onChange={(newValue) => setFieldValue("start_date", newValue)}
                          slotProps={{
                            textField: {
                              size: "small",
                              sx: { width: 180 },
                              error: touched.start_date && Boolean(errors.start_date),
                              helperText: touched.start_date && errors.start_date,
                            },
                          }}
                        />

                        <DatePicker
                          label="End Date"
                          value={values.end_date}
                          onChange={(newValue) => setFieldValue("end_date", newValue)}
                          slotProps={{
                            textField: {
                              size: "small",
                              sx: { width: 180 },
                              error: touched.end_date && Boolean(errors.end_date),
                              helperText: touched.end_date && errors.end_date,
                            },
                          }}
                        />
                      </LocalizationProvider>

                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={!selectedProduct}
                        sx={{marginTop:0}}
                      >
                        Add Item
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
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                        {group}
                      </Typography>
                      <Table>
                        <Thead>
                          <Tr>
                            <Th>Item Name</Th>
                            <Th>Item Code</Th>
                            <Th>Unique Code</Th>
                            <Th> Qty</Th>
                            <Th>Size</Th>
                            <Th>Start Date</Th>
                            <Th>End Date</Th>
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
                                <Td>{item.unique_code}</Td>
                                <Td>{item.original_qty}</Td>
                                <Td>{item.size}</Td>
                                <Td>{new Date(item.start_date).toLocaleDateString()}</Td>
                                <Td>{new Date(item.end_date).toLocaleDateString()}</Td>
                                <Td>
                                  <Tooltip title="Delete">
                                    <IconButton
                                      color="error"
                                      onClick={() =>
                                        setDeleteDialog({ open: true, itemId: item.id })
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

                  {/* Submit Button */}
                  <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      onClick={handleSubmit}
                      disabled={saving || items.length === 0}
                      startIcon={saving ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                      {saving ? "Adding to Production..." : "Add to Production"}
                    </Button>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Item Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, itemId: null })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this item?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, itemId: null })}>Cancel</Button>
          <Button color="error" onClick={confirmDeleteItem} variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddOrder;