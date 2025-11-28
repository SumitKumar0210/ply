import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  Paper,
  Typography,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import { BiSolidEditAlt } from "react-icons/bi";
import { RiDeleteBinLine } from "react-icons/ri";
import CustomSwitch from "../../components/CustomSwitch/CustomSwitch";

// Import the reusable component
import CustomerFormDialog, { getInitialCustomerValues } from "../../components/Customer/CustomerFormDialog";

import { useDispatch, useSelector } from "react-redux";
import {
  addCustomer,
  fetchAllCustomersWithSearch,
  statusUpdate,
  updateCustomer,
  deleteCustomer,
} from "../Users/slices/customerSlice";
import { fetchStates } from "../settings/slices/stateSlice";

const Customers = () => {
  const [open, setOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    id: null,
    name: "",
    loading: false,
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const tableContainerRef = useRef(null);

  const { data: customerData = [], loading, totalCount = 0 } = useSelector(
    (state) => state.customer
  );
  const { data: states = [] } = useSelector((state) => state.state);

  const dispatch = useDispatch();

  // Fetch customers with pagination
  useEffect(() => {
    dispatch(
      fetchAllCustomersWithSearch({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      })
    );
  }, [dispatch, pagination.pageIndex, pagination.pageSize]);

  // Fetch states once on mount
  useEffect(() => {
    dispatch(fetchStates());
  }, [dispatch]);

  // Handle add customer
  const handleAdd = useCallback(async (values, { resetForm }) => {
    try {
      const res = await dispatch(addCustomer(values));
      if (res.error) return;
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Add customer failed:", error);
    }
  }, [dispatch]);

  // Handle delete click
  const handleDeleteClick = useCallback((row) => {
    setDeleteDialog({
      open: true,
      id: row.id,
      name: row.name,
      loading: false,
    });
  }, []);

  // Confirm delete
  const confirmDelete = useCallback(async () => {
    if (!deleteDialog.id) return;

    setDeleteDialog((prev) => ({ ...prev, loading: true }));

    try {
      await dispatch(deleteCustomer(deleteDialog.id)).unwrap();
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setDeleteDialog({ open: false, id: null, name: "", loading: false });
    }
  }, [deleteDialog.id, dispatch]);

  // Handle update click
  const handleUpdate = useCallback((row) => {
    setEditData(row);
    setEditOpen(true);
  }, []);

  // Handle edit close
  const handleEditClose = useCallback(() => {
    setEditOpen(false);
    setEditData(null);
  }, []);

  // Handle edit submit
  const handleEditSubmit = useCallback(async (values, { resetForm }) => {
    const res = await dispatch(
      updateCustomer({ updated: { id: editData.id, ...values } })
    );
    if (res.error) return;
    resetForm();
    handleEditClose();
  }, [dispatch, editData, handleEditClose]);

  // Handle status change
  const handleStatusChange = useCallback((row, checked) => {
    const newStatus = checked ? 1 : 0;
    dispatch(statusUpdate({ ...row, status: newStatus }));
  }, [dispatch]);

  // Table Columns
  const columns = useMemo(
    () => [
      { accessorKey: "name", header: "Name", size: 150 },
      { accessorKey: "mobile", header: "Mobile", size: 120 },
      { accessorKey: "email", header: "E-mail", size: 180 },
      { accessorKey: "gst_no", header: "GST No.", size: 150 },
      { accessorKey: "address", header: "Address", size: 200 },
      { accessorKey: "city", header: "City", size: 100 },
      {
        accessorKey: "state_id",
        header: "State",
        size: 100,
        Cell: ({ row }) => row.original.state?.name || "N/A",
      },
      { accessorKey: "zip_code", header: "PIN", size: 80 },
      { accessorKey: "note", header: "Note", size: 150 },
      {
        accessorKey: "status",
        header: "Status",
        size: 80,
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) => (
          <CustomSwitch
            checked={!!row.original.status}
            onChange={(e) => handleStatusChange(row.original, e.target.checked)}
          />
        ),
      },
      {
        id: "actions",
        header: "Actions",
        size: 100,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ row }) => (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Tooltip title="Edit">
              <IconButton
                color="primary"
                onClick={() => handleUpdate(row.original)}
                size="small"
              >
                <BiSolidEditAlt size={18} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                color="error"
                onClick={() => handleDeleteClick(row.original)}
                size="small"
              >
                <RiDeleteBinLine size={18} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [handleStatusChange, handleUpdate, handleDeleteClick]
  );

  // CSV export
  const downloadCSV = useCallback(() => {
    const headers = columns
      .filter((col) => col.accessorKey && col.id !== "actions")
      .map((col) => col.header);
    const rows = customerData.map((row) =>
      columns
        .filter((col) => col.accessorKey && col.id !== "actions")
        .map((col) => {
          let value = row[col.accessorKey];
          if (col.accessorKey === "state_id") {
            value = row.state?.name || "N/A";
          }
          return `"${value ?? ""}"`;
        })
        .join(",")
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Customers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [columns, customerData]);

  // Print handler
  const handlePrint = useCallback(() => {
    if (!tableContainerRef.current) return;
    const printContents = tableContainerRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  }, []);

  // Close delete dialog
  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog({ open: false, id: null, name: "", loading: false });
  }, []);

  return (
    <>
      {/* Header */}
      <Grid
        container
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6">Customers</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Add Customer
        </Button>
      </Grid>

      {/* Table */}
      <Grid size={12}>
        <Paper
          elevation={0}
          ref={tableContainerRef}
          sx={{
            width: "100%",
            overflow: "hidden",
            backgroundColor: "#fff",
            px: 2,
            py: 1,
          }}
        >
          <MaterialReactTable
            columns={columns}
            data={customerData}
            getRowId={(row) => row.id}
            rowCount={totalCount}
            manualPagination
            onPaginationChange={setPagination}
            state={{
              isLoading: loading,
              pagination,
            }}
            enableTopToolbar
            enableColumnFilters
            enableSorting
            enablePagination
            enableBottomToolbar
            enableGlobalFilter
            enableDensityToggle={false}
            enableColumnActions={false}
            enableFullScreenToggle={false}
            initialState={{ density: "compact" }}
            muiTableContainerProps={{
              sx: {
                width: "100%",
                backgroundColor: "#fff",
                overflowX: "auto",
              },
            }}
            muiTableBodyCellProps={{
              sx: { whiteSpace: "nowrap" },
            }}
            muiTablePaperProps={{ sx: { backgroundColor: "#fff", boxShadow: "none" } }}
            muiTableBodyRowProps={{ hover: true }}
            renderTopToolbar={({ table }) => (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  p: 1,
                }}
              >
                <Typography variant="h6" fontWeight={400}>
                  Customers
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <MRT_GlobalFilterTextField table={table} />
                  <MRT_ToolbarInternalButtons table={table} />
                  <Tooltip title="Print">
                    <IconButton onClick={handlePrint}>
                      <FiPrinter size={20} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download CSV">
                    <IconButton onClick={downloadCSV}>
                      <BsCloudDownload size={20} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            )}
          />
        </Paper>
      </Grid>

      {/* Add Customer Modal */}
      <CustomerFormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Add Customer"
        initialValues={getInitialCustomerValues()}
        onSubmit={handleAdd}
        states={states}
      />

      {/* Edit Customer Modal */}
      <CustomerFormDialog
        open={editOpen}
        onClose={handleEditClose}
        title="Edit Customer"
        initialValues={getInitialCustomerValues(editData)}
        onSubmit={handleEditSubmit}
        states={states}
        isEdit
      />

      {/* Delete Modal */}
      <Dialog open={deleteDialog.open} onClose={closeDeleteDialog} maxWidth="xs">
        <DialogTitle>Delete Customer?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete customer{" "}
            <strong>{deleteDialog.name}</strong>?
            <br />
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={deleteDialog.loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDelete}
            disabled={deleteDialog.loading}
          >
            {deleteDialog.loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Customers;