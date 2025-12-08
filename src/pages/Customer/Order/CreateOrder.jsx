import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import {
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
  TextField,
  CircularProgress,
  Backdrop
} from "@mui/material";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { RiDeleteBinLine } from "react-icons/ri";
import { Autocomplete } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fetchQuotation, deleteOrder, fetchSupervisor, addOrder, getPreviousPO } from "../slice/orderSlice";
import { useDispatch, useSelector } from "react-redux";
import ImagePreviewDialog from "../../../components/ImagePreviewDialog/ImagePreviewDialog";
import { Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";

const CreateOrder = () => {
  const navigate = useNavigate();
  const [creationDate, setCreationDate] = useState(null);
  const [eddDate, setEddDate] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [previousPOData, setPreviousPOData] = useState([]);
  const dispatch = useDispatch();

  const mediaUrl = import.meta.env.VITE_MEDIA_URL;

  const { data = [], loading } = useSelector((state) => state.order);
  const { user = [] } = useSelector((state) => state.order);

  useEffect(() => {
    dispatch(fetchQuotation());
    dispatch(fetchSupervisor());
  }, [dispatch]);

  const [itemRowData, setItemRowData] = useState(null);
  const [items, setItems] = useState([]);

  const handleSelectedQuote = async (row) => {
    if (!row) {
      setItemRowData(null);
      setItems([]);
      return;
    }

    setIsLoadingQuote(true);
    try {
      setItemRowData(row);

      const res = await dispatch(getPreviousPO({ id:row.id }));
      setPreviousPOData(res.payload);
    } finally {
      // Small delay to show loader for better UX
      setTimeout(() => setIsLoadingQuote(false), 300);
    }
  };

  useEffect(() => {
    if (itemRowData) {
      try {
        const products = JSON.parse(itemRowData.product_ids);
        const parsedItems = products.map((product, index) => ({
          ...product,
          production_qty: "",
          start_date: null,
          end_date: null,
          rowId: index,
        }));
        setItems(parsedItems);
      } catch (error) {
        console.error("Error parsing product_ids:", error);
        setItems([]);
      }
    }
  }, [itemRowData]);

  const handleProductionQtyChange = (rowId, value, totalQty, prevProducedQty = 0) => {
    let qty = Number(value);

    const remainingQty = totalQty - prevProducedQty;

    if (isNaN(qty) || qty < 0) qty = 0;
    if (qty > remainingQty) qty = remainingQty;

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.rowId === rowId ? { ...item, production_qty: qty } : item
      )
    );
  };


  const handleStartDateChange = (rowId, value) => {
    setItems(items.map(item =>
      item.rowId === rowId ? { ...item, start_date: value } : item
    ));
  };

  const handleEndDateChange = (rowId, value) => {
    setItems(items.map(item =>
      item.rowId === rowId ? { ...item, end_date: value } : item
    ));
  };

  const handleDeleteItem = (rowId) => {
    setSelectedDeleteId(rowId);
    setOpenDelete(true);
  };

  const confirmDelete = () => {
    setItems(items.filter(item => item.rowId !== selectedDeleteId));
    setOpenDelete(false);
    setSelectedDeleteId(null);
  };

  const validateForm = () => {
    if (!itemRowData) {
      alert("Please select a quotation");
      return false;
    }


    if (!creationDate) {
      alert("Please select project start date");
      return false;
    }

    if (!eddDate) {
      alert("Please select EDD");
      return false;
    }

    if (items.length === 0) {
      alert("No items to add to production");
      return false;
    }

    // Validate each item
    for (const item of items) {
      if (item.production_qty && item.production_qty <= 0) {
        alert(`Please enter production quantity for ${item.name}`);
        return false;
      }
      if (item.production_qty) {
        if (!item.start_date) {
          alert(`Please select start date for ${item.name}`);
          return false;
        }

        if (!item.end_date) {
          alert(`Please select end date for ${item.name}`);
          return false;
        }
      }

    }

    return true;
  };

  const handleAddToProduction = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const poData = {
        quotation_id: itemRowData.id,
        batch_no: itemRowData.batch_no,
        customer_id: itemRowData.customer.id,
        project_start_date: creationDate,
        edd: eddDate,
        items: items
          .filter(item => item.production_qty)
          .map(item => ({
            product_id: item.product_id,
            group: item.group,
            name: item.name,
            model: item.model,
            unique_code: item.unique_code,
            original_qty: item.qty,
            production_qty: item.production_qty,
            size: item.size,
            document: item.document,
            start_date: item.start_date,
            end_date: item.end_date,
          }))
      };

      await dispatch(addOrder(poData)).unwrap();

      // Reset form on success
      setItemRowData(null);
      navigate('/customer/order');
      setItems([]);
      setCreationDate(null);
      setEddDate(null);

    } catch (error) {
      console.error("Error creating production order:", error);
      alert("Failed to create production order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const quoteList = data;

  return (
    <>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isSubmitting || isLoadingQuote}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress color="inherit" />
          <Typography sx={{ mt: 2 }}>
            {isLoadingQuote ? "Loading quotation..." : "Creating production order..."}
          </Typography>
        </Box>
      </Backdrop>

      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid>
          <Typography variant="h6">Create Order</Typography>
        </Grid>
      </Grid>

      <Grid
        container
        spacing={1}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid size={12}>
          <Card>
            <CardContent>
              <Grid size={12} sx={{ pt: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    flexWrap: 'wrap',
                  }}
                >
                  <Autocomplete
                    options={quoteList}
                    size="small"
                    getOptionLabel={(option) => `Quote ${option.batch_no}`}
                    loading={loading}
                    onChange={(event, option) => handleSelectedQuote(option)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Quote"
                        variant="outlined"
                        sx={{ width: 300 }}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    sx={{ width: 300 }}
                  />


                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <DatePicker
                        label="Project Start Date"
                        value={creationDate}
                        onChange={(newValue) => setCreationDate(newValue)}
                        disablePast
                        slotProps={{
                          textField: {
                            size: 'small',
                            sx: { width: 300, height: 40 },
                          },
                        }}
                      />

                      <DatePicker
                        label="EDD"
                        value={eddDate}
                        onChange={(newValue) => setEddDate(newValue)}
                        disablePast
                        slotProps={{
                          textField: {
                            size: 'small',
                            sx: { width: 300, height: 40 },
                          },
                        }}
                      />
                    </Box>
                  </LocalizationProvider>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 3 }} sx={{ pt: 2 }}>
                {itemRowData?.customer && (
                  <Typography variant="body2">
                    <strong>{itemRowData?.customer.name}</strong>
                    <br />
                    {itemRowData?.customer.address}
                    <br />
                    {itemRowData?.customer?.city}, {itemRowData?.customer?.state?.name} {itemRowData?.customer?.zip_code}
                    <br />
                  </Typography>
                )}
              </Grid>

              {items.length > 0 && (
                <Grid size={12} sx={{ mt: 3 }}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Table>
                      <Thead>
                        <Tr>
                          <Th>Group</Th>
                          <Th>Product Name</Th>
                          <Th>Model</Th>
                          <Th>Unique Code</Th>
                          <Th>Qty</Th>
                          {previousPOData.length > 0 && <Th>Qty in Production</Th>}
                          <Th>Production Qty</Th>
                          <Th>Size</Th>
                          <Th>Document</Th>
                          <Th>Start Date</Th>
                          <Th>End Date</Th>
                          <Th>Action</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {items.map((item) => {
                          const prevMatch = previousPOData.find(
                            (p) =>
                              p.product_id == item.product_id &&
                              p.group.trim() === item.group.trim()
                          );

                          return (
                            <Tr key={item.rowId}>
                              <Td>{item.group}</Td>
                              <Td>{item.name}</Td>
                              <Td>{item.model}</Td>
                              <Td>{item.unique_code}</Td>
                              <Td>{item.qty}</Td>
                              {previousPOData.length > 0 && (
                                <Td style={{ textAlign: "center" }}>
                                  {prevMatch ? (
                                    <Chip
                                      label={prevMatch.total_qty}
                                      color="info"
                                      size="small"
                                      variant="outlined"
                                    />
                                  ) : (
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{ display: "inline-block", textAlign: "center" }}
                                    >
                                      0
                                    </Typography>
                                  )}
                                </Td>
                              )}

                              <Td style={{ textAlign: "center" }}>
                                {prevMatch && parseInt(prevMatch.total_qty) === parseInt(item.qty) ? (
                                  <Typography
                                    variant="body2"
                                    color="success.main"
                                    sx={{ fontWeight: 500 }}
                                  >
                                    ✓ Completed
                                  </Typography>
                                ) : (
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={item.production_qty ?? ""}
                                    onChange={(e) =>
                                      handleProductionQtyChange(
                                        item.rowId,
                                        e.target.value,
                                        item.qty,
                                        prevMatch ? parseInt(prevMatch.total_qty || 0) : 0
                                      )
                                    }
                                    sx={{ width: 100 }}
                                    inputProps={{
                                      min: 0,
                                      max: prevMatch
                                        ? item.qty - parseInt(prevMatch.total_qty || 0)
                                        : item.qty,
                                    }}
                                  />

                                )}
                              </Td>
                              <Td>{item.size}</Td>
                              <Td>
                                {item.document && (
                                  <ImagePreviewDialog
                                    imageUrl={mediaUrl + item.document}
                                    alt={item.name}
                                  />
                                )}
                              </Td>
                              <Td>
                                <DatePicker
                                  value={item.start_date}
                                  onChange={(newValue) => handleStartDateChange(item.rowId, newValue)}
                                  disablePast
                                  slotProps={{
                                    textField: {
                                      size: 'small',
                                      sx: { width: 150 },
                                    },
                                  }}
                                />
                              </Td>
                              <Td>
                                <DatePicker
                                  value={item.end_date}
                                  onChange={(newValue) => handleEndDateChange(item.rowId, newValue)}
                                  disablePast
                                  slotProps={{
                                    textField: {
                                      size: 'small',
                                      sx: { width: 150 },
                                    },
                                  }}
                                />
                              </Td>
                              <Td>
                                <Tooltip title="Delete">
                                  <IconButton
                                    color="error"
                                    onClick={() => handleDeleteItem(item.rowId)}
                                  >
                                    <RiDeleteBinLine size={16} />
                                  </IconButton>
                                </Tooltip>
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </LocalizationProvider>
                </Grid>
              )}

              <Grid size={12} sx={{ mt: 4 }}>
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{
                    justifyContent: "flex-end",
                    alignItems: "flex-end",
                  }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddToProduction}
                    disabled={isSubmitting || items.length === 0}
                    startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                  >
                    {isSubmitting ? "Processing..." : "Add to Production"}
                  </Button>
                </Stack>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Modal */}
      <Dialog maxWidth="xs" fullWidth open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this item?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CreateOrder;