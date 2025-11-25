// components/RequestStockDrawer.jsx
import React, { useState, useEffect } from "react";
import {
  Drawer,
  Box,
  Typography,
  Divider,
  TextField,
  Button,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Skeleton,
} from "@mui/material";
import { RiDeleteBinLine } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { fetchActiveMaterials } from "../../pages/settings/slices/materialSlice";
import {
  storeMaterialRequest,
  fetchAllRequestItems
} from "../../pages/Production/slice/materialRequestSlice";

export default function RequestStockDrawer({ open, onClose, product, onSuccess }) {
  const dispatch = useDispatch();
  const { data: materialData = [], loading: materialLoading } = useSelector(
    (state) => state.material
  );
  const { data: requestItems = [], loading: requestLoading } = useSelector(
    (state) => state.materialRequest
  );

  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [stockQty, setStockQty] = useState("");
  const [stockItems, setStockItems] = useState([]);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [hasNewItems, setHasNewItems] = useState(false);

  const handleDateFormate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    if (open) {
      if (product?.id) {
        dispatch(fetchActiveMaterials(product.id));
        dispatch(fetchAllRequestItems(product.id));
      }
    }
  }, [open, dispatch, product?.id]);

  useEffect(() => {
    if (!open) {
      setStockItems([]);
      setSelectedMaterial(null);
      setStockQty("");
      setHasNewItems(false);
    }
  }, [open]);

  // Load previous request items when they are fetched
  useEffect(() => {
    if (requestItems && requestItems.length > 0 && open) {
      const previousItems = requestItems.map(item => ({
        id: item.material_id,
        name: item.material?.name || "—",
        size: item.material?.size || "—",
        category: item.material?.category,
        opening_stock: item.material?.opening_stock || 0,
        qty: item.qty,
        created_at: item.created_at,
        isNew: false,
        unit_of_measurement: item.material?.unit_of_measurement
      }));
      setStockItems(previousItems);
    }
  }, [requestItems, open]);

  const handleAddStockItem = () => {
    if (!selectedMaterial || !stockQty || stockQty <= 0) return;

    const exists = stockItems.find((item) => item.id === selectedMaterial.id && item.isNew);
    if (exists) {
      setStockItems((prev) =>
        prev.map((item) =>
          item.id === selectedMaterial.id && item.isNew
            ? { ...item, qty: Number(item.qty) + Number(stockQty) }
            : item
        )
      );
    } else {
      setStockItems((prev) => [
        ...prev,
        {
          ...selectedMaterial,
          qty: Number(stockQty),
          isNew: true, // Mark as newly added
          addedDate: new Date().toISOString().slice(0, 10).split("-").reverse().join("-")
        },
      ]);
    }
    setSelectedMaterial(null);
    setStockQty("");
    setHasNewItems(true); // Enable request button
  };

  const handleDeleteStockItem = (index) => {
    setStockItems((prev) => prev.filter((_, i) => i !== index));
    setOpenDelete(false);
    setDeleteIndex(null);

    // Check if there are still new items after deletion
    const remainingNewItems = stockItems.filter((_, i) => i !== index).some(item => item.isNew);
    setHasNewItems(remainingNewItems);
  };

  const handleRequestStock = async () => {
    if (stockItems.length === 0 || !product) return;

    const formData = new FormData();
    formData.append("pp_id", product.id);

    // Only send new items in the request
    const newItems = stockItems.filter(item => item.isNew);
    newItems.forEach((item) => {
      formData.append("material_id[]", item.id);
      formData.append("qty[]", item.qty);
    });

    const res = await dispatch(storeMaterialRequest(formData));
    if (res.error) return;

    // Mark all items as not new after successful submission
    setStockItems((prev) =>
      prev.map(item => ({ ...item, isNew: false }))
    );
    setHasNewItems(false); // Disable request button until new items added

    // Refresh the request items list
    if (product?.id) {
      dispatch(fetchAllRequestItems(product.id));
    }

    onSuccess();
  };

  return (
    <>
      <Drawer anchor="right" open={open} onClose={onClose} sx={{ zIndex: 9999 }}>
        <Box sx={{ width: 500, p: 2 }}>
          <Typography
            variant="h6"
            fontWeight={500}
            fontSize="18px"
            marginBottom="6px"
          >
            Request Stock
          </Typography>
          <Divider />

          <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1">{product?.item_name}</Typography>
            <Typography variant="subtitle1">{product?.group?.trim()}</Typography>
          </Box>

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            paddingTop="15px"
            paddingBottom="10px"
            gap="10px"
          >
            {materialLoading ? (
              <>
                <Skeleton variant="rounded" width={300} height={40} />
                <Skeleton variant="rounded" width={60} height={40} />
                <Skeleton variant="rounded" width={70} height={40} />
              </>
            ) : (
              <>
                <Autocomplete
                  disablePortal
                  options={materialData}
                  value={selectedMaterial}
                  getOptionLabel={(option) =>
                    option?.name ? `${option.name} (${option.category?.name ?? ""})` : ""
                  }
                  onChange={(e, val) => setSelectedMaterial(val)}
                  renderOption={(props, option) => {
                    const { key, ...rest } = props;
                    return (
                      <li key={key} {...rest}>
                        <Box>
                          <Typography fontWeight={600}>{option.name}</Typography>
                          <Typography variant="caption" display="block">
                            Group: {option.group?.name || "—"}
                          </Typography>
                          <Typography variant="caption">
                            Size: {option.size} • UOM: {option.unit_of_measurement?.name ?? "—"}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Item Code"
                      placeholder="Search item"
                      size="small"
                    />
                  )}
                  sx={{ width: 300 }}
                />

                <TextField
                  label="Qty"
                  variant="outlined"
                  size="small"
                  type="number"
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  sx={{ width: 80 }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddStockItem}
                  disabled={!selectedMaterial || !stockQty || stockQty <= 0}
                >
                  Add
                </Button>
              </>
            )}
          </Box>

          <TableContainer sx={{ mt: 4 }}>
            {materialLoading || requestLoading ? (
              <>
                <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
              </>
            ) : (
              <Table sx={{ minWidth: "100%" }} size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      Item
                      <br />
                      (Name)
                    </TableCell>
                    <TableCell>
                      Avg.Qty
                      <br />
                      (Rq.Qty)
                    </TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stockItems.length > 0 ? (
                    stockItems.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.name}
                          <br />({item.size || item.category?.name || "—"})
                        </TableCell>
                        <TableCell>
                          {item.opening_stock || 0}
                          <br />({item.qty})
                        </TableCell>
                        <TableCell>
                          {item.isNew
                            ? item.addedDate
                            : handleDateFormate(item.created_at)}
                        </TableCell>
                        <TableCell>
                          {item.isNew && (
                            <Tooltip title="Delete" arrow>
                              <IconButton
                                color="error"
                                onClick={() => {
                                  setDeleteIndex(index);
                                  setOpenDelete(true);
                                }}
                              >
                                <RiDeleteBinLine size={16} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No items added
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </TableContainer>

          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              onClick={handleRequestStock}
              disabled={stockItems.length === 0 || !hasNewItems}
            >
              Request
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)} sx={{ zIndex: 999999 }}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent style={{ width: "300px" }}>
          <DialogContentText>
            Are you sure you want to delete this item? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button
            onClick={() => handleDeleteStockItem(deleteIndex)}
            variant="contained"
            color="error"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}