import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
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
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
  useMediaQuery,
  useTheme,
  TextField,
  InputAdornment,
  Pagination,
  CircularProgress,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { BiSolidEditAlt } from "react-icons/bi";
import { RiDeleteBinLine } from "react-icons/ri";
import AddIcon from "@mui/icons-material/Add";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import SearchIcon from "@mui/icons-material/Search";
import { FiCalendar, FiPackage, FiCreditCard, FiPlus, FiDollarSign, FiUser } from "react-icons/fi";
import { MdCurrencyRupee } from "react-icons/md";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { deletePO, fetchPurchaseOrders } from "../slice/purchaseOrderSlice";
import { useAuth } from "../../../context/AuthContext";
import LinkGenerator from "../../../components/Links/LinkGenerator";

// Status mapping: 0-draft, 1-save, 2-reject, 3-approve
const STATUS_CONFIG = {
  0: { label: "Draft", color: "default" },
  1: { label: "Saved", color: "info" },
  2: { label: "Rejected", color: "error" },
  3: { label: "Approved", color: "success" },
};

const getStatusChip = (status) => {
  const config = STATUS_CONFIG[status] || { label: "Unknown", color: "default" };
  return <Chip label={config.label} color={config.color} size="small" />;
};

// Helper function to get item count from material_items JSON
const getItemCount = (materialItems) => {
  try {
    if (!materialItems) return 0;
    const items = typeof materialItems === "string" ? JSON.parse(materialItems) : materialItems;
    return Array.isArray(items) ? items.length : 0;
  } catch (error) {
    console.error("Error parsing material items:", error);
    return 0;
  }
};

// Mobile Card Component
const PurchaseOrderCard = ({ order, onView, onEdit, onDelete, hasPermission }) => {
  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Card sx={{ mb: 2, boxShadow: 2, overflow: "hidden", borderRadius: 2 }}>
      {/* Header Section - Blue Background */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #4285F4 0%, #1976d2 100%)",
          p: 2,
          color: "white",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "white", mb: 0.5 }}>
              {order.purchase_no}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <FiUser size={14} />
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
                {order.vendor?.name || "—"}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={STATUS_CONFIG[order.status]?.label || "Unknown"}
            size="small"
            sx={{
              bgcolor: "white",
              color: "#1976d2",
              fontWeight: 600,
              fontSize: "0.75rem",
            }}
          />
        </Box>
      </Box>

      {/* Body Section */}
      <CardContent sx={{ p: 2 }}>
        {/* Details Grid */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
              <Box
                sx={{
                  color: "text.secondary",
                  mt: 0.2,
                }}
              >
                <FiCalendar size={16} />
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    display: "block",
                    fontSize: "0.7rem",
                    mb: 0.3,
                  }}
                >
                  Order Date
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.875rem" }}>
                  {formatDate(order.order_date)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
              <Box
                sx={{
                  color: "text.secondary",
                  mt: 0.2,
                }}
              >
                <FiPackage size={16} />
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    display: "block",
                    fontSize: "0.7rem",
                    mb: 0.3,
                  }}
                >
                  Items Ordered
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.875rem" }}>
                  {getItemCount(order.material_items)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
              <Box
                sx={{
                  color: "text.secondary",
                  mt: 0.2,
                }}
              >
                <FiCreditCard size={16} />
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    display: "block",
                    fontSize: "0.7rem",
                    mb: 0.3,
                  }}
                >
                  Credit Days
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.875rem" }}>
                  {order.credit_days || 0} days
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
              <Box
                sx={{
                  color: "text.secondary",
                  mt: 0.2,
                }}
              >
                <FiPlus size={16} />
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    display: "block",
                    fontSize: "0.7rem",
                    mb: 0.3,
                  }}
                >
                  Additional Amount
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.875rem" }}>
                  {formatCurrency(order.cariage_amount)}
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
            px: 2,
            py:1,
            borderRadius: 1,
            mb: 2,
            border: "1px solid #e3f2fd",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <MdCurrencyRupee size={20} color="#1976d2" />
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
              Order Total
            </Typography>
          </Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 500, color: "#1976d2", fontSize: "1.25rem" }}
          >
            {formatCurrency(order.grand_total)}
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
          {hasPermission("purchase_order.read") && (
            <IconButton
              size="medium"
              sx={{
                bgcolor: "#fff3e0",
                color: "#ff9800",
                "&:hover": { bgcolor: "#ffe0b2" },
              }}
              onClick={() => onView(order.id)}
            >
              <MdOutlineRemoveRedEye size={20} />
            </IconButton>
          )}
          {hasPermission("purchase_order.update") && (order.status === 0 || order.status === 1) && (
            <IconButton
              size="medium"
              sx={{
                bgcolor: "#e3f2fd",
                color: "#1976d2",
                "&:hover": { bgcolor: "#bbdefb" },
              }}
              onClick={() => onEdit(order.id)}
            >
              <BiSolidEditAlt size={20} />
            </IconButton>
          )}
          {hasPermission("purchase_order.delete") && (
            <IconButton
              size="medium"
              sx={{
                bgcolor: "#ffebee",
                color: "#d32f2f",
                "&:hover": { bgcolor: "#ffcdd2" },
              }}
              onClick={() => onDelete(order.id)}
            >
              <RiDeleteBinLine size={20} />
            </IconButton>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

const PurchaseOrder = () => {
  const { hasPermission, hasAnyPermission } = useAuth();
  const navigate = useNavigate();
  const tableContainerRef = useRef(null);
  const dispatch = useDispatch();
  const debounceTimerRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Get data from Redux store
  const { orders: tableData, totalRows, loading } = useSelector(
    (state) => state.purchaseOrder
  );

  // State management
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [globalFilter, setGlobalFilter] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("info");

  // Show alert helper
  const showAlert = useCallback((msg, severity = "info") => {
    setAlertMessage(msg);
    setAlertSeverity(severity);
    setTimeout(() => setAlertMessage(""), 4000);
  }, []);

  // Fetch data using Redux thunk
  const fetchData = useCallback(
    async (searchQuery = "") => {
      try {
        await dispatch(
          fetchPurchaseOrders({
            page: pagination.pageIndex + 1,
            perPage: pagination.pageSize,
            search: searchQuery,
          })
        ).unwrap();
      } catch (error) {
        console.error("Fetch error:", error);
        showAlert("Failed to fetch purchase orders", "error");
      }
    },
    [dispatch, pagination.pageIndex, pagination.pageSize, showAlert]
  );

  // Debounced search function with 1 second delay
  const debouncedSearch = useCallback(
    (searchValue) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        fetchData(searchValue);
      }, 1000);
    },
    [fetchData]
  );

  // Handle global filter change
  const handleGlobalFilterChange = useCallback(
    (value) => {
      setGlobalFilter(value);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  // Fetch when pagination changes
  useEffect(() => {
    fetchData(globalFilter);
  }, [pagination.pageIndex, pagination.pageSize]);

  // Initial fetch
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Navigation handlers
  const handleViewClick = useCallback(
    (id) => navigate(`/vendor/purchase-order/view/${id}`),
    [navigate]
  );

  const handleEditClick = useCallback(
    (id) => navigate(`/vendor/purchase-order/edit/${id}`),
    [navigate]
  );

  // Delete handlers
  const handleDeleteClick = useCallback((id) => {
    setDeleteId(id);
    setOpenDelete(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteId) return;

    try {
      await dispatch(deletePO(deleteId)).unwrap();
      setOpenDelete(false);
      setDeleteId(null);
      showAlert("Purchase order deleted successfully", "success");
      fetchData(globalFilter);
    } catch (error) {
      console.error("Delete error:", error);
      showAlert("Failed to delete purchase order", "error");
    }
  }, [deleteId, dispatch, showAlert, fetchData, globalFilter]);

  // Table columns
  const columns = useMemo(() => {
    const baseColumns = [
      { accessorKey: "purchase_no", header: "Po No." },
      {
        accessorKey: "vendor_id",
        header: "Vendor Name",
        Cell: ({ row }) => row.original?.vendor?.name || "—",
      },
      {
        accessorKey: "material_items",
        header: "Items Ordered",
        Cell: ({ row }) => getItemCount(row.original.material_items),
      },
      { accessorKey: "order_date", header: "Order Date" },
      { accessorKey: "credit_days", header: "Credit Days" },
      {
        accessorKey: "grand_total",
        header: "Order Total",
        Cell: ({ cell }) => `₹${Number(cell.getValue() || 0).toLocaleString("en-IN")}`,
      },
      {
        accessorKey: "cariage_amount",
        header: "Additional Amount",
        Cell: ({ cell }) => `₹${Number(cell.getValue() || 0).toLocaleString("en-IN")}`,
      },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ cell }) => getStatusChip(cell.getValue()),
      },
    ];

    if (hasAnyPermission(["purchase_order.delete", "purchase_order.update", "purchase_order.read"])) {
      baseColumns.push({
        id: "actions",
        header: "Action",
        size: 80,
        enableSorting: false,
        enableColumnFilter: false,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ row }) => (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            {hasPermission("purchase_order.read") && (
              <Tooltip title="View/Approve PO">
                <IconButton
                  color="warning"
                  onClick={() => handleViewClick(row.original.id)}
                  size="small"
                >
                  <MdOutlineRemoveRedEye size={16} />
                </IconButton>
              </Tooltip>
            )}
            {(hasPermission("purchase_order.update") && row.original.status === 0 || row.original.status === 1) && (
              <Tooltip title="Edit">
                <IconButton
                  color="warning"
                  onClick={() => handleViewClick(row.original.id)}
                  size="small"
                >
                  <MdOutlineRemoveRedEye size={16} />
                </IconButton>
              </Tooltip>
            )}
            {hasPermission("purchase_order.update") &&
              (row.original.status === 0 || row.original.status === 1) && (
                <Tooltip title="Edit">
                  <IconButton
                    color="primary"
                    onClick={() => handleEditClick(row.original.id)}
                    size="small"
                  >
                    <BiSolidEditAlt size={16} />
                  </IconButton>
                </Tooltip>
              )}
            <LinkGenerator
              id={row.original.id}
              customerId={row.original.vendor?.id}
              entity="purchase_order"
            />
            {hasPermission("purchase_order.delete") && (
              <Tooltip title="Delete">
                <IconButton
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
  }, [handleViewClick, handleEditClick, handleDeleteClick, hasPermission, hasAnyPermission]);

  // CSV export
  const downloadCSV = useCallback(() => {
    try {
      const headers = [
        "Po No.",
        "Vendor Name",
        "Credit Days",
        "Order Total",
        "Items Ordered",
        "Order Date",
        "Additional Amount",
        "Status",
      ];

      const rows = tableData.map((row) => [
        row.purchase_no || "",
        row.vendor?.name || "",
        row.credit_days || 0,
        row.grand_total || 0,
        getItemCount(row.material_items),
        row.order_date || "",
        row.cariage_amount || 0,
        STATUS_CONFIG[row.status]?.label || "Unknown",
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
        `PurchaseOrder_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showAlert("CSV downloaded successfully", "success");
    } catch (error) {
      console.error("CSV download error:", error);
      showAlert("Failed to download CSV", "error");
    }
  }, [tableData, showAlert]);

  // Print handler
  const handlePrint = useCallback(() => {
    if (!tableContainerRef.current) return;

    try {
      const printWindow = window.open("", "", "height=600,width=1200");
      if (!printWindow) {
        showAlert("Failed to open print window. Check popup blocker.", "error");
        return;
      }
      printWindow.document.write(tableContainerRef.current.innerHTML);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error("Print error:", error);
      showAlert("Failed to print", "error");
    }
  }, [showAlert]);

  // Mobile pagination handlers
  const handleMobilePageChange = (event, value) => {
    setPagination((prev) => ({ ...prev, pageIndex: value - 1 }));
  };

  return (
    <>
      {/* Alert Messages */}
      {alertMessage && (
        <Alert
          severity={alertSeverity}
          sx={{ mb: 2 }}
          onClose={() => setAlertMessage("")}
        >
          {alertMessage}
        </Alert>
      )}

      {/* Header Row */}
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid item>
          <Typography variant="h6" className="page-title">
            Purchase Order
          </Typography>
        </Grid>
        <Grid item>
          {hasPermission("purchase_order.create") && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              to="/vendor/purchase-order/create"
            >
              Create PO
            </Button>
          )}
        </Grid>
      </Grid>

      {/* Render Mobile or Desktop View */}
      {isMobile ? (
        // Mobile View - Cards
        <Box>
          {/* Mobile Search */}
          <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search purchase orders..."
              value={globalFilter}
              onChange={(e) => handleGlobalFilterChange(e.target.value)}
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
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            >
              <Typography variant="h6" className='page-title'>
                Purchase Order
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <MRT_GlobalFilterTextField table={table} />
                <MRT_ToolbarInternalButtons table={table} />
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

          {/* Cards */}
          {!loading && tableData.length > 0 && (
            <>
              {tableData.map((order) => (
                <PurchaseOrderCard
                  key={order.id}
                  order={order}
                  onView={handleViewClick}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  hasPermission={hasPermission}
                />
              ))}

              {/* Mobile Pagination */}
              <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                <Pagination
                  count={Math.ceil(totalRows / pagination.pageSize)}
                  page={pagination.pageIndex + 1}
                  onChange={handleMobilePageChange}
                  color="primary"
                />
              </Box>
            </>
          )}

          {/* Empty State */}
          {!loading && tableData.length === 0 && (
            <Paper elevation={0} sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary">
                No purchase orders found
              </Typography>
            </Paper>
          )}
        </Box>
      ) : (
        // Desktop View - Table
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
            rowCount={totalRows}
            state={{
              pagination,
              isLoading: loading,
              globalFilter,
            }}
            onPaginationChange={setPagination}
            onGlobalFilterChange={handleGlobalFilterChange}
            enableTopToolbar
            enableColumnFilters={false}
            enableSorting={false}
            enableBottomToolbar
            enableGlobalFilter
            enableDensityToggle={false}
            enableColumnActions={false}
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
                }}
              >
                <Typography variant="h6" className="page-title">
                  Purchase Order
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <MRT_GlobalFilterTextField table={table} />
                  <MRT_ToolbarInternalButtons table={table} />
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
      )}

      {/* Delete Modal */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Delete Purchase Order?</DialogTitle>
        <DialogContent sx={{ width: "300px" }}>
          <DialogContentText>This action cannot be undone</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
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
};

export default PurchaseOrder;