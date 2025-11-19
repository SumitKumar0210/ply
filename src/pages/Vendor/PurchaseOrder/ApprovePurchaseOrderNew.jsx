import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import Grid from "@mui/material/Grid";
import PropTypes from "prop-types";
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
  Chip,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Link, useNavigate } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import { RiDeleteBinLine } from "react-icons/ri";
import AddIcon from "@mui/icons-material/Add";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import { FiPrinter } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { getApprovePOData, deletePO } from "../slice/purchaseOrderSlice";
import UploadInvoiceButton from "../../../components/UploadInvoiceButton/UploadInvoiceButton";

/* ------------------ Styled Dialog ------------------ */
const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
    paddingBottom: theme.spacing(4),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

function BootstrapDialogTitle(props) {
  const { children, onClose, ...other } = props;
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

BootstrapDialogTitle.propTypes = {
  children: PropTypes.node,
  onClose: PropTypes.func.isRequired,
};

/* ------------------ Status UI Helper ------------------ */
const getStatusChip = (status) => {
  switch (status) {
    case "Pending":
      return <Chip label="Pending" color="warning" size="small" />;
    case "Approved":
      return <Chip label="Approved" color="success" size="small" />;
    case "Partially Paid":
      return <Chip label="Partially Paid" color="info" size="small" />;
    default:
      return <Chip label={status || "Unknown"} size="small" />;
  }
};

/* ------------------ Main Component ------------------ */
const ApprovePurchaseOrder = () => {
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [searchValue, setSearchValue] = useState(""); // Local state for immediate UI update
  const [debouncedSearch, setDebouncedSearch] = useState(""); // Actual search value

  const tableContainerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data = [], total = 0, loading } = useSelector(
    (state) => state.purchaseOrder
  );

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  /* ------------------ Debounced Search Effect ------------------ */
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchValue);
      // Reset to first page when search changes
      if (searchValue !== debouncedSearch) {
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      }
    }, 500); // Reduced from 2000ms to 500ms for better UX

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchValue]); // Only depend on searchValue

  /* ------------------ Fetch Function ------------------ */
  const fetchData = useCallback(() => {
    console.log("🔍 Fetching data with params:", {
      page: pagination.pageIndex + 1,
      per_page: pagination.pageSize,
      search: debouncedSearch,
    });
    
    dispatch(
      getApprovePOData({
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
        search: debouncedSearch,
      })
    );
  }, [dispatch, pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  /* ------------------ Fetch whenever pagination or debounced search changes ------------------ */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ------------------ Table Data Formatter ------------------ */
  const tableData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.map((po) => ({
      id: po.id,
      poNumber: po.purchase_no || "N/A",
      vendorName: po.vendor?.name || "N/A",
      dated: po.order_date || "-",
      orderTotal: po.grand_total || 0,
      itemsOrdered: po.material_items
        ? JSON.parse(po.material_items).length
        : 0,
      qcPassed: po.inward
        ? JSON.parse(po.inward.material_items).length
        : 0,
      qcData: po.inward,
      status: po.quality_status ? "Approved" : "Pending",
    }));
  }, [data]);

  /* ------------------ Actions ------------------ */
  const handlePrintClick = useCallback((id) => {
    navigate("/vendor/purchase-order/print/" + id);
  }, [navigate]);

  const handleQualitycheckClick = useCallback((id) => {
    navigate("/vendor/purchase-order/quality-check/" + id);
  }, [navigate]);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;

    try {
      await dispatch(deletePO(deleteId)).unwrap();
      fetchData();
      setOpenDelete(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleDeleteCancel = useCallback(() => {
    setOpenDelete(false);
    setDeleteId(null);
  }, []);

  /* ------------------ Columns ------------------ */
  const columns = useMemo(
    () => [
      { accessorKey: "poNumber", header: "Po No." },
      { accessorKey: "vendorName", header: "Vendor Name" },
      { accessorKey: "dated", header: "Order Date" },
      { accessorKey: "orderTotal", header: "Order Total" },
      { accessorKey: "itemsOrdered", header: "Items Ordered" },
      { accessorKey: "qcPassed", header: "QC Passed Item" },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ cell }) => getStatusChip(cell.getValue()),
      },
      {
        id: "actions",
        header: "Action",
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) => (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            {row.original?.qcData && (
              <UploadInvoiceButton row={row.original.qcData} />
            )}

            <Tooltip title="Quality Check">
              <IconButton
                color="primary"
                onClick={() => handleQualitycheckClick(row.original.id)}
              >
                <IoMdCheckmarkCircleOutline size={16} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Print">
              <IconButton
                color="warning"
                onClick={() => handlePrintClick(row.original.id)}
              >
                <FiPrinter size={16} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete">
              <IconButton
                color="error"
                onClick={() => {
                  setDeleteId(row.original.id);
                  setOpenDelete(true);
                }}
              >
                <RiDeleteBinLine size={16} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [handlePrintClick, handleQualitycheckClick]
  );

  if (loading && !data.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
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
        <Grid item>
          <Typography variant="h6">Quality Checks Order</Typography>
        </Grid>

        <Grid item>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            to="/vendor/purchase-order/create"
          >
            Create PO
          </Button>
        </Grid>
      </Grid>

      <Paper elevation={0} ref={tableContainerRef} sx={{ width: "100%", p: 2 }}>
        <MaterialReactTable
          columns={columns}
          data={tableData}
          manualPagination
          rowCount={total}
          state={{ 
            pagination, 
            globalFilter: searchValue, 
            isLoading: loading,
            showProgressBars: loading 
          }}
          onPaginationChange={setPagination}
          enableGlobalFilter
          onGlobalFilterChange={setSearchValue}
          muiSearchTextFieldProps={{
            placeholder: "Search purchase orders...",
            sx: { minWidth: "300px" },
            variant: "outlined",
          }}
          renderTopToolbar={({ table }) => (
            <Box sx={{ display: "flex", justifyContent: "space-between", p: 1, alignItems: "center" }}>
              <Typography variant="h6">Quality Checks</Typography>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <MRT_GlobalFilterTextField table={table} />
                <MRT_ToolbarInternalButtons table={table} />
              </Box>
            </Box>
          )}
        />
      </Paper>

      {/* Delete Confirmation */}
      <Dialog open={openDelete} onClose={handleDeleteCancel}>
        <DialogTitle>Delete this purchase order?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action cannot be undone. Are you sure you want to delete this purchase order?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ApprovePurchaseOrder;