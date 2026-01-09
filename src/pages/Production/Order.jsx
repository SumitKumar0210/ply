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
  Chip,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Divider,
  Pagination,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import dayjs from "dayjs";
import { styled } from "@mui/material/styles";
import { Link } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import { BiSolidEditAlt } from "react-icons/bi";
import { RiDeleteBinLine } from "react-icons/ri";
import AddIcon from "@mui/icons-material/Add";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import SearchIcon from "@mui/icons-material/Search";
import { FiUser, FiCalendar, FiPackage } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
} from "material-react-table";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import { fetchOwnProductionOrder } from "./slice/orderSlice";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../../context/AuthContext";

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

// Status colors
const getStatusChip = (status, count = 0) => {
  switch (status) {
    case 0:
      return { label: "Pending", color: "warning", bgColor: "#fff4e5", textColor: "#ff9800" };
    case 3:
      return { label: "Completed", color: "success", bgColor: "#d4f8e8", textColor: "#008f5a" };
    default:
      return { 
        label: `In Production (${count})`, 
        color: "info", 
        bgColor: "#e3f2fd", 
        textColor: "#1976d2" 
      };
  }
};

const Order = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { hasPermission, hasAnyPermission } = useAuth();
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [mobileSearchFilter, setMobileSearchFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const tableContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data: orders, loading, error, totalRecords } = useSelector((state) => state.productionOrder);

  // Normalize orders data
  const normalizedOrders = Array.isArray(orders) ? orders : [];
  const normalizedTotal = typeof totalRecords === 'number' ? totalRecords : 0;

  // Focus search input when shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Debounce desktop search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(globalFilter);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [globalFilter]);

  // Debounce mobile search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(mobileSearchFilter);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [mobileSearchFilter]);

  // Fetch orders
  useEffect(() => {
    const params = {
      pageIndex: pagination.pageIndex,
      pageLimit: pagination.pageSize,
      search: debouncedSearch,
    };

    dispatch(fetchOwnProductionOrder(params));
  }, [dispatch, pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  // Navigation handlers
  const handleViewClick = useCallback((id) => {
    navigate('/customer/order/view/' + id);
  }, [navigate]);

  const handleEditClick = useCallback((id) => {
    navigate('/customer/order/edit/' + id);
  }, [navigate]);

  const handleDelete = useCallback((row) => {
    setDeleteRow(row);
    setOpenDelete(true);
  }, []);

  const deleteData = useCallback(async (id) => {
    try {
      await dispatch(deleteOrder(id)).unwrap();
      setOpenDelete(false);
      setDeleteRow(null);

      // Refresh data after deletion
      dispatch(fetchOwnProductionOrder({
        pageIndex: pagination.pageIndex,
        pageLimit: pagination.pageSize,
        search: debouncedSearch,
      }));
    } catch (error) {
      console.error("Delete failed:", error);
      setOpenDelete(false);
    }
  }, [dispatch, pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  const handleSearchToggle = useCallback(() => {
    if (showSearch && globalFilter) {
      setGlobalFilter("");
    }
    setShowSearch(!showSearch);
  }, [showSearch, globalFilter]);

  const handleMobileSearchChange = useCallback((value) => {
    setMobileSearchFilter(value);
  }, []);

  const handleMobilePageChange = useCallback((event, value) => {
    setPagination((prev) => ({ ...prev, pageIndex: value - 1 }));
  }, []);

  const handleDateFormate = useCallback((date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }, []);

  const handleIQtyCount = useCallback((items) => {
    try {
      const parsed = JSON.parse(items);
      if (!Array.isArray(parsed)) return 0;
      return parsed.length ?? 0;
    } catch (e) {
      console.error("Invalid product_ids format:", e);
      return 0;
    }
  }, []);

  const calculateQCPassed = useCallback((items) => {
    try {
      const parsed = JSON.parse(items);
      if (!Array.isArray(parsed)) return 0;
      return parsed.reduce((total, item) => total + Number(item.qc_passed || 0), 0);
    } catch (e) {
      console.error("Invalid product_ids format:", e);
      return 0;
    }
  }, []);

  const calculateDelivered = useCallback((items) => {
    try {
      const parsed = JSON.parse(items);
      if (!Array.isArray(parsed)) return 0;
      return parsed.reduce((total, item) => total + Number(item.delivered || 0), 0);
    } catch (e) {
      console.error("Invalid product_ids format:", e);
      return 0;
    }
  }, []);

  // Table columns
  const columns = useMemo(() => {
    const baseColumns = [
      {
        accessorKey: "orderNumber",
        header: "Order No.",
        Cell: ({ row }) => row.original?.batch_no ?? "",
      },
      {
        accessorKey: "customerName",
        header: "Customer Name",
        Cell: ({ row }) => row.original?.customer?.name ?? "",
      },
      { 
        accessorKey: "created_at", 
        header: "Date / Time", 
        Cell: ({ row }) => row.original?.created_at ? 
          dayjs(row.original?.created_at).format("YYYY-MM-DD hh:mm A") 
          : "-", 
      },
      {
        accessorKey: "itemOrdered",
        header: "Item Ordered",
        Cell: ({ row }) => handleIQtyCount(row.original?.product_ids),
      },
      {
        accessorKey: "commencement_date",
        header: "Commencement Date",
        Cell: ({ row }) => handleDateFormate(row.original.commencement_date),
      },
      {
        accessorKey: "delivered_date",
        header: "Delivered Date",
        Cell: ({ row }) => handleDateFormate(row.original.delivery_date),
      },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ row }) => {
          const statusConfig = getStatusChip(row.original?.status, row.original?.production_product_count);
          return <Chip label={statusConfig.label} color={statusConfig.color} size="small" />;
        },
      },
    ];

    if (hasAnyPermission?.(["company_orders.read", "company_orders.update"])) {
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
            {hasPermission("company_orders.read") && (
              <Tooltip title="View">
                <IconButton
                  color="warning"
                  onClick={() => handleViewClick(row.original.id)}
                  size="small"
                >
                  <MdOutlineRemoveRedEye size={16} />
                </IconButton>
              </Tooltip>
            )}

            {hasPermission("company_orders.update") && row.original.status === 0 && (
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
          </Box>
        ),
      });
    }

    return baseColumns;
  }, [
    hasAnyPermission,
    hasPermission,
    handleViewClick,
    handleEditClick,
    handleDateFormate,
    handleIQtyCount,
  ]);

  // CSV export
  const downloadCSV = useCallback(() => {
    if (!normalizedOrders || normalizedOrders.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = ["Order No.", "Customer Name", "Dated", "Item Ordered", "Commencement Date", "Delivered Date", "Status"];

    const rows = normalizedOrders.map((row) => {
      const orderNo = row.batch_no || "";
      const customerName = row.customer?.name || "N/A";
      const dated = handleDateFormate(row.created_at);
      const itemOrdered = handleIQtyCount(row.product_ids);
      const commencementDate = handleDateFormate(row.commencement_date);
      const deliveredDate = handleDateFormate(row.delivery_date);
      const statusConfig = getStatusChip(row.status, row.production_product_count);

      return [
        `"${orderNo}"`,
        `"${customerName}"`,
        `"${dated}"`,
        `"${itemOrdered}"`,
        `"${commencementDate}"`,
        `"${deliveredDate}"`,
        `"${statusConfig.label}"`
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `Orders_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [normalizedOrders, handleDateFormate, handleIQtyCount]);

  // Print handler
  const handlePrint = useCallback(() => {
    if (!tableContainerRef.current) return;

    const printWindow = window.open('', '_blank');
    const tableHTML = tableContainerRef.current.innerHTML;

    printWindow.document.write(`
      <html>
        <head>
          <title>Orders</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            @media print {
              button, .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h2>Orders</h2>
          ${tableHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }, []);

  return (
    <>
      {/* Header Row */}
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid>
          <Typography variant="h6" className="page-title">Order</Typography>
        </Grid>
        <Grid>
          {hasPermission("company_orders.create") && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              to="/production/create-order"
            >
              Create Order
            </Button>
          )}
        </Grid>
      </Grid>

      {isMobile ? (
        // 🔹 MOBILE VIEW (Cards)
        <>
          <Box sx={{ minHeight: '100vh' }}>
            {/* Mobile Search */}
            <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search orders..."
                value={mobileSearchFilter}
                onChange={(e) => handleMobileSearchChange(e.target.value)}
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
            ) : normalizedOrders.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No orders found
                </Typography>
              </Paper>
            ) : (
              normalizedOrders.map((order) => {
                const statusConfig = getStatusChip(order.status, order.production_product_count);
                
                return (
                  <Card key={order.id} sx={{ mb: 2, boxShadow: 2, overflow: "hidden", borderRadius: 2 }}>
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
                            {order.batch_no || "N/A"}
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <FiUser size={14} />
                            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
                              {order.customer?.name || "N/A"}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={statusConfig.label}
                          size="small"
                          sx={{
                            bgcolor: statusConfig.bgColor,
                            color: statusConfig.textColor,
                            fontWeight: 500,
                            fontSize: "0.75rem",
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Body Section */}
                    <CardContent sx={{ p: 1.5 }}>
                      <Grid container spacing={1} sx={{ mb: 1 }}>
                        <Grid size={12}>
                          <Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
                            <Box sx={{ color: "text.secondary", mt: 0.4 }}>
                              <FiCalendar size={16} />
                            </Box>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 400, fontSize: "0.875rem" }}>
                                {order.created_at ? dayjs(order.created_at).format("DD-MM-YYYY hh:mm A") : "N/A"}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid size={12}>
                          <Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
                            <Box sx={{ color: "text.secondary", mt: 0.4 }}>
                              <FiPackage size={16} />
                            </Box>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 400, fontSize: "0.875rem" }}>
                                Items: {handleIQtyCount(order.product_ids)}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>

                        {order.commencement_date && (
                          <Grid size={12}>
                            <Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
                              <Box sx={{ color: "text.secondary" }}>
                                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                  Start:
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: 400, fontSize: "0.875rem" }}>
                                {handleDateFormate(order.commencement_date)}
                              </Typography>
                            </Box>
                          </Grid>
                        )}

                        {order.delivery_date && (
                          <Grid size={12}>
                            <Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
                              <Box sx={{ color: "text.secondary" }}>
                                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                  Delivery:
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: 400, fontSize: "0.875rem" }}>
                                {handleDateFormate(order.delivery_date)}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                      </Grid>

                      <Divider sx={{ mb: 2 }} />

                      {/* Action Buttons */}
                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
                        {hasPermission("company_orders.read") && (
                          <IconButton
                            size="medium"
                            onClick={() => handleViewClick(order.id)}
                            sx={{
                              width: "36px",
                              height: "36px",
                              bgcolor: "#fff3e0",
                              color: "#ff9800",
                              "&:hover": { bgcolor: "#ffe0b2" },
                            }}
                          >
                            <MdOutlineRemoveRedEye size={20} />
                          </IconButton>
                        )}

                        {hasPermission("company_orders.update") && order.status === 0 && (
                          <IconButton
                            size="medium"
                            onClick={() => handleEditClick(order.id)}
                            sx={{
                              width: "36px",
                              height: "36px",
                              bgcolor: "#e3f2fd",
                              color: "#1976d2",
                              "&:hover": { bgcolor: "#bbdefb" },
                            }}
                          >
                            <BiSolidEditAlt size={20} />
                          </IconButton>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                );
              })
            )}

            {/* Mobile Pagination */}
            {!loading && normalizedOrders.length > 0 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 3, pb: 3 }}>
                <Pagination
                  count={Math.ceil(normalizedTotal / pagination.pageSize)}
                  page={pagination.pageIndex + 1}
                  onChange={handleMobilePageChange}
                  color="primary"
                />
              </Box>
            )}
          </Box>
        </>
      ) : (
        // 🔹 DESKTOP VIEW (Table)
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
              data={normalizedOrders}
              manualPagination
              manualFiltering
              rowCount={normalizedTotal}
              state={{
                isLoading: loading,
                showLoadingOverlay: loading,
                pagination: pagination,
                globalFilter: globalFilter,
              }}
              onPaginationChange={setPagination}
              onGlobalFilterChange={setGlobalFilter}
              enableTopToolbar
              enableColumnFilters={false}
              enableSorting={false}
              enablePagination
              enableBottomToolbar
              enableGlobalFilter={false}
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
              muiTableBodyRowProps={{
                hover: false,
              }}
              muiTableBodyProps={{
                sx: {
                  '& tr': {
                    display: normalizedOrders.length === 0 ? 'none' : 'table-row'
                  }
                }
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
                  <Typography variant="h6" className='page-title'>
                    Order List
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {showSearch && (
                      <TextField
                        inputRef={searchInputRef}
                        size="small"
                        placeholder="Search..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        InputProps={{
                          endAdornment: globalFilter && (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={() => setGlobalFilter("")}
                                edge="end"
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{ width: 250 }}
                      />
                    )}

                    <Tooltip title={showSearch ? "Close Search" : "Search"}>
                      <IconButton onClick={handleSearchToggle}>
                        <SearchIcon size={20} />
                      </IconButton>
                    </Tooltip>

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
      )}

      {/* Delete Modal */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>{"Delete this order?"}</DialogTitle>
        <DialogContent style={{ width: "300px" }}>
          <DialogContentText>This action cannot be undone</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button
            onClick={() => deleteData(deleteRow?.id)}
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

export default Order;