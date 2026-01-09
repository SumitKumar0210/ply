import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
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
  TextField,
  Chip,
  CircularProgress,
  Pagination,
  InputAdornment,
  Divider
} from "@mui/material";
import { Card, CardContent } from '@mui/material';
import { FiUser, FiCalendar, FiPackage, FiCreditCard, FiPlus } from 'react-icons/fi';
import { MdCurrencyRupee, MdOutlineRemoveRedEye } from 'react-icons/md';
import SearchIcon from "@mui/icons-material/Search";
import { BiSolidEditAlt } from 'react-icons/bi';
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
import { BsCloudDownload } from "react-icons/bs";
import { IoMdRefresh } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { getApprovePOData, deletePO } from "../slice/purchaseOrderSlice";
import UploadInvoiceButton from "../../../components/UploadInvoiceButton/UploadInvoiceButton";
import { useAuth } from "../../../context/AuthContext";
import { useTheme, useMediaQuery } from "@mui/material";

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

// Status helper
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

const ApprovePurchaseOrder = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { hasPermission, hasAnyPermission } = useAuth();
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const tableContainerRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data = [], total = 0, loading } = useSelector(
    (state) => state.purchaseOrder
  );

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimeoutRef = useRef(null);

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(globalFilter);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [globalFilter]);

  // Fetch data when pagination or search changes
  useEffect(() => {
    const params = {
      page: pagination.pageIndex + 1,
      per_page: pagination.pageSize,
    };

    if (debouncedSearch) {
      params.search = debouncedSearch;
    }

    dispatch(getApprovePOData(params));
  }, [dispatch, pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  // Reset to first page when search changes
  useEffect(() => {
    if (debouncedSearch) {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  }, [debouncedSearch]);

  // Transform data for table
  const tableData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.map((po) => {
      let itemsOrdered = 0;
      let qcPassed = 0;

      try {
        itemsOrdered = po.material_items ? JSON.parse(po.material_items).length : 0;
      } catch (e) {
        console.error("Error parsing material_items:", e);
      }

      try {
        qcPassed = po.inward?.material_items ? JSON.parse(po.inward.material_items).length : 0;
      } catch (e) {
        console.error("Error parsing inward material_items:", e);
      }

      return {
        id: po.id,
        poNumber: po.purchase_no || "N/A",
        vendorName: po.vendor?.name || "N/A",
        dated: po.order_date || "-",
        orderTotal: Number(po.grand_total) || 0,
        itemsOrdered,
        qcPassed,
        qcData: po.inward,
        status: po.quality_status ? "Approved" : "Pending",
        rawData: po, // Keep original data for mobile view
      };
    });
  }, [data]);

  const handlePrintClick = useCallback(
    (id) => navigate("/vendor/purchase-order/print/" + id),
    [navigate]
  );

  const handleQualitycheckClick = useCallback(
    (id) => navigate("/vendor/purchase-order/quality-check/" + id),
    [navigate]
  );

  const handleDeleteClick = useCallback((id) => {
    setDeleteId(id);
    setOpenDelete(true);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await dispatch(deletePO(deleteId)).unwrap();

      dispatch(
        getApprovePOData({
          page: pagination.pageIndex + 1,
          per_page: pagination.pageSize,
          search: debouncedSearch || undefined,
        })
      );
      setOpenDelete(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Failed to delete purchase order:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefresh = useCallback(() => {
    dispatch(
      getApprovePOData({
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
        search: debouncedSearch || undefined,
      })
    );
  }, [dispatch, pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  // Table columns - FIXED: Added dependency array
  const columns = useMemo(() => {
    const baseColumns = [
      {
        accessorKey: "poNumber",
        header: "PO Number",
      },
      {
        accessorKey: "vendorName",
        header: "Vendor Name",
      },
      {
        accessorKey: "dated",
        header: "Order Date",
      },
      {
        accessorKey: "orderTotal",
        header: "Order Total",
        Cell: ({ cell }) => `₹${Number(cell.getValue()).toLocaleString("en-IN")}`,
      },
      {
        accessorKey: "itemsOrdered",
        header: "Items Ordered",
      },
      {
        accessorKey: "qcPassed",
        header: "QC Passed Items",
      },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ cell }) => getStatusChip(cell.getValue()),
      },
    ];

    if (hasAnyPermission(["qc_po.delete", "qc_po.read", "qc_po.approve_qc", "qc_po.update", "qc_po.upload_invoice"])) {
      baseColumns.push({
        id: "actions",
        header: "Actions",
        size: 80,
        enableSorting: false,
        enableColumnFilter: false,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ row }) => (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            {(hasPermission("qc_po.upload_invoice") && row.original?.qcData) && (
              <UploadInvoiceButton row={row.original?.qcData} />
            )}

            {hasPermission("qc_po.approve_qc") && (
              <Tooltip title="Quality Check">
                <IconButton
                  color="primary"
                  onClick={() => handleQualitycheckClick(row.original.id)}
                  size="small"
                >
                  <IoMdCheckmarkCircleOutline size={16} />
                </IconButton>
              </Tooltip>
            )}

            {hasPermission("qc_po.read") && (
              <Tooltip title="Print PO">
                <IconButton
                  color="warning"
                  onClick={() => handlePrintClick(row.original.id)}
                  size="small"
                >
                  <FiPrinter size={16} />
                </IconButton>
              </Tooltip>
            )}
            {hasPermission("qc_po.delete") && (
              <Tooltip title="Delete PO">
                <IconButton
                  aria-label="delete"
                  color="error"
                  onClick={() => handleDeleteClick(row.original.id)}
                  size="small"
                >
                  <RiDeleteBinLine size={16} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ),
      });
    }

    return baseColumns;
  }, [handlePrintClick, handleQualitycheckClick, handleDeleteClick, hasPermission, hasAnyPermission]);

  const downloadCSV = useCallback(() => {
    try {
      const headers = ["PO Number", "Vendor Name", "Order Date", "Order Total", "Items Ordered", "QC Passed Items", "Status"];
      
      const rows = tableData.map((row) => [
        row.poNumber,
        row.vendorName,
        row.dated,
        row.orderTotal,
        row.itemsOrdered,
        row.qcPassed,
        row.status,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Purchase_Orders_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV download error:", error);
    }
  }, [tableData]);

  const handlePrint = useCallback(() => {
    if (!tableContainerRef.current) return;
    try {
      const printWindow = window.open("", "", "height=600,width=1200");
      if (!printWindow) return;
      printWindow.document.write('<html><head><title>Print</title>');
      printWindow.document.write('<style>body{font-family: Arial, sans-serif;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ddd;padding:8px;text-align:left;}</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(tableContainerRef.current.innerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error("Print error:", error);
    }
  }, []);

  // Mobile pagination handlers
  const handleMobilePageChange = (event, value) => {
    setPagination((prev) => ({ ...prev, pageIndex: value - 1 }));
  };

  // Render mobile card - FIXED: Added return statement and dynamic data
  const renderMobileCard = (row) => {
    return (
      <Card key={row.id} sx={{ mb: 2, boxShadow: 2, overflow: "hidden", borderRadius: 2 }}>
        {/* Header Section */}
        <Box
          sx={{
            bgcolor: "primary.main",
            p: 1.5,
            color: "primary.contrastText",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "white", mb: 0.5 }}>
                {row.poNumber}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <FiUser size={14} />
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
                  {row.vendorName}
                </Typography>
              </Box>
            </Box>
            {getStatusChip(row.status)}
          </Box>
        </Box>

        {/* Body Section */}
        <CardContent sx={{ p: 1.5 }}>
          {/* Details Grid */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
                <Box sx={{ color: "text.secondary", mt: 0.2 }}>
                  <FiCalendar size={16} />
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      display: "block",
                      fontSize: "0.75rem",
                      mb: 0.3,
                    }}
                  >
                    Order Date
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.875rem" }}>
                    {row.dated}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={6}>
              <Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
                <Box sx={{ color: "text.secondary", mt: 0.2 }}>
                  <FiPackage size={16} />
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      display: "block",
                      fontSize: "0.75rem",
                      mb: 0.3,
                    }}
                  >
                    Items Ordered
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.875rem" }}>
                    {row.itemsOrdered} items
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={6}>
              <Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
                <Box sx={{ color: "text.secondary", mt: 0.2 }}>
                  <IoMdCheckmarkCircleOutline size={16} />
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      display: "block",
                      fontSize: "0.75rem",
                      mb: 0.3,
                    }}
                  >
                    QC Passed Items
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.875rem" }}>
                    {row.qcPassed}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* Total Section */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "#f0f7ff",
              px: 1.5,
              py: 1,
              borderRadius: 1,
              mb: 2,
              border: "1px solid #e3f2fd",
            }}
          >
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
              Order Total
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: "primary.main", fontSize: "1rem" }}
            >
              ₹{row.orderTotal.toLocaleString("en-IN")}
            </Typography>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Action Buttons */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, flexWrap: "wrap" }}>
            {(hasPermission("qc_po.upload_invoice") && row.qcData) && (
              <UploadInvoiceButton row={row.qcData} />
            )}

            {hasPermission("qc_po.approve_qc") && (
              <Tooltip title="Quality Check">
                <IconButton
                  size="small"
                  onClick={() => handleQualitycheckClick(row.id)}
                  sx={{
                    width: "36px",
                    height: "36px",
                    bgcolor: "#e3f2fd",
                    color: "primary.main",
                    "&:hover": { bgcolor: "#bbdefb" },
                  }}
                >
                  <IoMdCheckmarkCircleOutline size={18} />
                </IconButton>
              </Tooltip>
            )}

            {hasPermission("qc_po.read") && (
              <Tooltip title="Print PO">
                <IconButton
                  size="small"
                  onClick={() => handlePrintClick(row.id)}
                  sx={{
                    width: "36px",
                    height: "36px",
                    bgcolor: "#fff3e0",
                    color: "#ff9800",
                    "&:hover": { bgcolor: "#ffe0b2" },
                  }}
                >
                  <FiPrinter size={18} />
                </IconButton>
              </Tooltip>
            )}

            {hasPermission("qc_po.delete") && (
              <Tooltip title="Delete PO">
                <IconButton
                  size="small"
                  onClick={() => handleDeleteClick(row.id)}
                  sx={{
                    width: "36px",
                    height: "36px",
                    bgcolor: "#ffebee",
                    color: "#d32f2f",
                    "&:hover": { bgcolor: "#ffcdd2" },
                  }}
                >
                  <RiDeleteBinLine size={18} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

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
          <Typography variant="h6" className="page-title">Quality Checks Order</Typography>
        </Grid>
        <Grid item>
          {hasPermission("purchase_order.create") && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              to="/vendor/purchase-order/create"
              size={isMobile ? "small" : "medium"}
            >
              Create PO
            </Button>
          )}
        </Grid>
      </Grid>

      {isMobile ? (
        // 🔹 MOBILE VIEW (Cards)
        <Box sx={{ minHeight: '100vh' }}>
          {/* Mobile Search - FIXED: Connected value and onChange */}
          <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search purchase orders..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Paper>

          {/* Loading State */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : tableData.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">No purchase orders found</Typography>
            </Paper>
          ) : (
            <>
              {/* Render Cards */}
              {tableData.map((row) => renderMobileCard(row))}

              {/* Mobile Pagination - FIXED: Use total instead of hardcoded 10 */}
              <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                <Pagination
                  count={Math.ceil(total / pagination.pageSize)}
                  page={pagination.pageIndex + 1}
                  onChange={handleMobilePageChange}
                  color="primary"
                />
              </Box>
            </>
          )}
        </Box>
      ) : (
        // 🔹 DESKTOP VIEW (Table)
        <Grid item xs={12}>
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
              data={tableData}
              manualPagination
              manualFiltering
              rowCount={total}
              state={{
                pagination,
                globalFilter,
                isLoading: loading,
                showLoadingOverlay: loading,
              }}
              onPaginationChange={setPagination}
              onGlobalFilterChange={setGlobalFilter}
              enableTopToolbar
              enableColumnFilters={false}
              enableSorting={false}
              enableBottomToolbar
              enableGlobalFilter
              enableDensityToggle={false}
              enableColumnActions={false}
              enableFullScreenToggle={false}
              enableColumnVisibilityToggle={false}
              initialState={{ density: "compact" }}
              muiTableContainerProps={{
                sx: {
                  width: "100%",
                  backgroundColor: "#fff",
                  overflowX: "auto",
                  minWidth: "1200px",
                },
              }}
              muiTablePaperProps={{
                sx: { backgroundColor: "#fff", boxShadow: "none" },
              }}
              renderTopToolbar={({ table }) => (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    p: 1,
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  <Typography variant="h6" className="page-title">
                    Quality Checks Purchase Orders
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <MRT_GlobalFilterTextField table={table} />
                    <MRT_ToolbarInternalButtons table={table} />
                    <Tooltip title="Refresh">
                      <IconButton onClick={handleRefresh} size="small">
                        <IoMdRefresh size={20} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Print">
                      <IconButton onClick={handlePrint} size="small">
                        <FiPrinter size={20} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download CSV">
                      <IconButton onClick={downloadCSV} size="small">
                        <BsCloudDownload size={20} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              )}
            />
          </Paper>
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDelete}
        onClose={() => !isDeleting && setOpenDelete(false)}
      >
        <DialogTitle>Delete Purchase Order?</DialogTitle>
        <DialogContent sx={{ minWidth: 300 }}>
          <DialogContentText>
            Are you sure you want to delete this purchase order? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            autoFocus
            disabled={isDeleting}
            startIcon={
              isDeleting ? <CircularProgress size={16} color="inherit" /> : null
            }
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ApprovePurchaseOrder;