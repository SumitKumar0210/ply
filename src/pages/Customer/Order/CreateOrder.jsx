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
  TextField
} from "@mui/material";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { RiDeleteBinLine } from "react-icons/ri";
import { Autocomplete } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fetchOrder, deleteOrder, fetchSupervisor } from "../slice/orderSlice";
import { useDispatch, useSelector } from "react-redux";

const CreateOrder = () => {
  const [creationDate, setCreationDate] = useState(null);
  const [eddDate, setEddDate] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [openProductionModal, setOpenProductionModal] = useState(false);
  const [observeId, setObserveId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const { data = [], loading } = useSelector((state) => state.order);
  const { user = [] } = useSelector((state) => state.order);

  useEffect(() => {
    const params = {
      pageIndex: 0,
      pageLimit: 10,
    };
    dispatch(fetchOrder(params));
    dispatch(fetchSupervisor());
  }, [dispatch]);

  // Parse product_ids from the order data
  const [itemRowData, setItemRowData] = useState(null);
  const [items, setItems] = useState([]);

  const handleSelectedQuote = (row) => {
    setItemRowData(row);
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
      }
    }
  }, [itemRowData]);

  const handleProductionQtyChange = (rowId, value) => {
    setItems(items.map(item =>
      item.rowId === rowId ? { ...item, production_qty: value } : item
    ));
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

  const handleAddToProduction = () => {
    setOpenProductionModal(true);
  };

  const handleSubmitProduction = () => {
    // Handle production submission with observeId
    console.log("Observe ID:", observeId);
    console.log("Items:", items);
    setOpenProductionModal(false);
  };

  const quoteList = data;

  return (
    <>
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
                    getOptionLabel={(option) => `Quote ${option.id}`}
                    loading={loading}
                    onChange={(event, option) => handleSelectedQuote(option)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Quote"
                        variant="outlined"
                        sx={{ width: 300 }}
                      />
                    )}
                    sx={{ width: 300 }}
                  />

                  <Autocomplete
                    options={user || []}
                    size="small"
                    getOptionLabel={(option) => option?.name || ""}
                    loading={loading}
                    value={user.find((u) => u.id === observeId) || null}
                    onChange={(event, newValue) => {
                      setObserveId(newValue ? newValue.id : null);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Supervisor"
                        variant="outlined"
                        sx={{ width: 300 }}
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
                          <Th>Production Qty</Th>
                          <Th>Size</Th>
                          <Th>Document</Th>
                          <Th>Start Date</Th>
                          <Th>End Date</Th>
                          <Th>Action</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {items.map((item) => (
                          <Tr key={item.rowId}>
                            <Td>{item.group}</Td>
                            <Td>{item.name}</Td>
                            <Td>{item.model}</Td>
                            <Td>{item.unique_code}</Td>
                            <Td>{item.qty}</Td>
                            <Td>
                              <TextField
                                size="small"
                                type="number"
                                value={item.production_qty || 0}
                                onChange={(e) => handleProductionQtyChange(item.rowId, e.target.value)}
                                sx={{ width: 100 }}
                                inputProps={{ min: 0, max: item.qty }}
                              />
                            </Td>
                            <Td>{item.size}</Td>
                            <Td>
                              {item.document && (
                                <img
                                  src={item.document}
                                  alt={item.name}
                                  style={{
                                    width: "40px",
                                    height: "40px",
                                    objectFit: "cover",
                                    borderRadius: "4px",
                                    border: "1px solid #ddd",
                                  }}
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
                                  onClick={() => setOpenDelete(true)}
                                >
                                  <RiDeleteBinLine size={16} />
                                </IconButton>
                              </Tooltip>
                            </Td>
                          </Tr>
                        ))}
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
                  >
                    Add to Production
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
          <Button variant="contained" color="error" onClick={() => setOpenDelete(false)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add to Production Modal */}
      <Dialog maxWidth="sm" fullWidth open={openProductionModal} onClose={() => setOpenProductionModal(false)}>
        <DialogTitle>Add to Production</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Observe ID"
              value={observeId}
              onChange={(e) => setObserveId(e.target.value)}
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProductionModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmitProduction}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CreateOrder;