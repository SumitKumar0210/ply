import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import {
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  InputAdornment,
  Chip,
  Card,
  CardContent,
  Divider,
  Pagination,
  CircularProgress,
  useMediaQuery,
  useTheme

} from "@mui/material";
import dayjs from "dayjs";
import { MdOutlineRemoveRedEye, MdDescription, MdLocalShipping } from "react-icons/md";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
} from "material-react-table";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import { BiSolidEditAlt } from "react-icons/bi";
import { RiDeleteBinLine } from "react-icons/ri";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import { FiUser, FiCalendar } from 'react-icons/fi';
import { useDispatch, useSelector } from "react-redux";
import { deleteBill, fetchBills, markAsDelivered } from "./slice/billsSlice";
import { useAuth } from "../../context/AuthContext";
import { MdOutlinePhone } from "react-icons/md";

const Bills = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { hasPermission, hasAnyPermission } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const tableContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const { data: bills, loading, totalRecords } = useSelector((state) => state.bill);

  const [openDelete, setOpenDelete] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [markingDelivered, setMarkingDelivered] = useState(null);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [mobileSearchFilter, setMobileSearchFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const normalizedBills = Array.isArray(bills) ? bills : [];
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

  // Fetch bills
  useEffect(() => {
    const params = {
      pageIndex: pagination.pageIndex,
      pageLimit: pagination.pageSize,
      search: debouncedSearch,
      dispatch: false,
    };

    dispatch(fetchBills(params));
  }, [dispatch, pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  // Navigation handlers
  const handleAddBill = useCallback(() => {
    navigate("/bill/generate-bill");
  }, [navigate]);

  const handleEditBill = useCallback((id) => {
    navigate(`/bill/edit-bill/${id}`);
  }, [navigate]);

  const handleViewBill = useCallback((id) => {
    navigate(`/bill/view/${id}`);
  }, [navigate]);

  const handleChallan = useCallback((id) => {
    navigate(`/bill/challan/${id}`);
  }, [navigate]);

  // Mark as delivered
  const handleMarkDeliveredBill = useCallback(async (id) => {
    setMarkingDelivered(id);
    try {
      await dispatch(markAsDelivered(id)).unwrap();

      // Refresh the bills list
      await dispatch(fetchBills({
        pageIndex: pagination.pageIndex,
        pageLimit: pagination.pageSize,
        search: debouncedSearch,
        dispatch: false,
      }));
    } catch (error) {
      console.error("Mark as delivered failed:", error);
    } finally {
      setMarkingDelivered(null);
    }
  }, [dispatch, pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  // Delete handler
  const handleDelete = useCallback(async (id) => {
    try {
      await dispatch(deleteBill(id)).unwrap();
      setOpenDelete(false);
      setDeleteRow(null);

      dispatch(fetchBills({
        pageIndex: pagination.pageIndex,
        pageLimit: pagination.pageSize,
        search: debouncedSearch,
        dispatch: false,
      }));
    } catch (error) {
      console.error("Delete failed:", error);
      setOpenDelete(false);
    }
  }, [dispatch, pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  // Search toggle
  const handleSearchToggle = useCallback(() => {
    if (showSearch && globalFilter) {
      setGlobalFilter("");
    }
    setShowSearch(!showSearch);
  }, [showSearch, globalFilter]);

  // Mobile search change
  const handleMobileSearchChange = useCallback((value) => {
    setMobileSearchFilter(value);
  }, []);

  // Mobile pagination
  const handleMobilePageChange = useCallback((event, value) => {
    setPagination((prev) => ({ ...prev, pageIndex: value - 1 }));
  }, []);

  // Get status config
  const getStatusConfig = useCallback((status) => {
    const configs = {
      0: { text: "Draft", bgColor: "#f5f5f5", textColor: "#666666" },
      1: { text: "Not Dispatch", bgColor: "#ffe2e2", textColor: "#d23434" },
      2: { text: "Dispatched", bgColor: "#fff4e5", textColor: "#ff9800" },
      3: { text: "Delivered", bgColor: "#d4f8e8", textColor: "#008f5a" },
    };
    return configs[status] || configs[0];
  }, []);

  // Table columns
  const columns = useMemo(() => {
    const baseColumns = [
      {
        accessorKey: "invoice_no",
        header: "Invoice No",
        size: 120
      },
      {
        accessorKey: "customer_name",
        header: "Customer Name",
        size: 160,
        Cell: ({ row }) => row.original?.customer?.name || "N/A",
      },
      {
        accessorKey: "customer_mobile",
        header: "Mobile",
        size: 120,
        Cell: ({ row }) => row.original?.customer?.mobile || "N/A",
      },
      {
        accessorKey: "created_at",
        header: "Bill Date / Time",
        Cell: ({ cell }) =>
          cell.getValue()
            ? dayjs(cell.getValue()).format("YYYY-MM-DD hh:mm A")
            : "-",
      },
      {
        accessorKey: "grand_total",
        header: "Total",
        size: 120,
        Cell: ({ cell }) => {
          const value = cell.getValue();
          if (!value) return "₹ 0.00";
          const numValue = Number(value);
          return `₹ ${numValue.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`;
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 100,
        Cell: ({ row }) => {
          const config = getStatusConfig(row.original.status);
          return (
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                background: config.bgColor,
                color: config.textColor,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {config.text}
            </span>
          );
        },
      },
    ];

    if (hasAnyPermission(["bills.update", "bills.delete", "bills.create_challan", "bills.read", "bills.mark_delivered"])) {
      baseColumns.push({
        id: "actions",
        header: "Actions",
        enableSorting: false,
        enableColumnFilter: false,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ row }) => (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            {hasPermission("bills.read") && (
              <Tooltip title="View Bill">
                <IconButton
                  color="primary"
                  onClick={() => handleViewBill(row.original.id)}
                  size="small"
                >
                  <MdOutlineRemoveRedEye size={16} />
                </IconButton>
              </Tooltip>
            )}
            {hasPermission("bills.create_challan") && (
              <Tooltip title="Create Challan">
                <IconButton
                  color="primary"
                  onClick={() => handleChallan(row.original.id)}
                  size="small"
                >
                  <MdDescription size={18} />
                </IconButton>
              </Tooltip>
            )}
            {hasPermission("bills.mark_delivered") && row.original.status === 2 && (
              <Tooltip title="Mark as Delivered">
                <IconButton
                  color="success"
                  onClick={() => handleMarkDeliveredBill(row.original.id)}
                  disabled={markingDelivered === row.original.id}
                  size="small"
                >
                  {markingDelivered === row.original.id ? (
                    <CircularProgress size={18} />
                  ) : (
                    <MdLocalShipping size={18} />
                  )}
                </IconButton>
              </Tooltip>
            )}

            {(row.original.status !== 2 && row.original.status !== 3) && (
              <>
                {hasPermission("bills.update") && (
                  <Tooltip title="Edit">
                    <IconButton
                      color="primary"
                      onClick={() => handleEditBill(row.original.id)}
                      size="small"
                    >
                      <BiSolidEditAlt size={16} />
                    </IconButton>
                  </Tooltip>
                )}

                {hasPermission("bills.delete") && (
                  <Tooltip title="Delete">
                    <IconButton
                      color="error"
                      onClick={() => {
                        setOpenDelete(true);
                        setDeleteRow(row.original.id);
                      }}
                      size="small"
                    >
                      <RiDeleteBinLine size={16} />
                    </IconButton>
                  </Tooltip>
                )}
              </>
            )}
          </Box>
        ),
      });
    }

    return baseColumns;
  }, [
    getStatusConfig,
    hasAnyPermission,
    hasPermission,
    handleViewBill,
    handleChallan,
    handleMarkDeliveredBill,
    handleEditBill,
    markingDelivered,
  ]);

  // Download CSV
  const downloadCSV = useCallback(() => {
    if (!normalizedBills || normalizedBills.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = ["Invoice No", "Customer Name", "Mobile", "Bill Date", "Total", "Status"];

    const rows = normalizedBills.map((row) => {
      const customerName = row.customer?.name || "N/A";
      const customerMobile = row.customer?.mobile || "N/A";
      const date = row.created_at ? dayjs(row.created_at).format("YYYY-MM-DD") : "N/A";
      const total = row.grand_total ? `₹ ${Number(row.grand_total).toLocaleString("en-IN")}` : "₹ 0.00";
      const config = getStatusConfig(row.status);

      return [
        `"${row.invoice_no || ""}"`,
        `"${customerName}"`,
        `"${customerMobile}"`,
        `"${date}"`,
        `"${total}"`,
        `"${config.text}"`
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `Bills_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [normalizedBills, getStatusConfig]);

  // Print
  const handlePrint = useCallback(() => {
    if (!tableContainerRef.current) return;

    const printWindow = window.open('', '_blank');
    const tableHTML = tableContainerRef.current.innerHTML;

    printWindow.document.write(`
      <html>
        <head>
          <title>Bills</title>
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
          <h2>Bills</h2>
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
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid item>
          <Typography variant="h6" className="page-title">
            Bills
          </Typography>
        </Grid>
        <Grid item>
          {hasPermission("bills.create") && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddBill}
            >
              Add Bill
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
                placeholder="Search bills..."
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
            ) : normalizedBills.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No bills found
                </Typography>
              </Paper>
            ) : (
              normalizedBills.map((bill) => {
                const statusConfig = getStatusConfig(bill.status);
                const canEditDelete = bill.status !== 2 && bill.status !== 3;
                
                return (
                  <Card key={bill.id} sx={{ mb: 2, boxShadow: 2, overflow: "hidden", borderRadius: 2 }}>
                    {/* Header Section - Blue Background */}
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
                            {bill.invoice_no || "N/A"}
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <FiUser size={14} />
                            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
                              {bill.customer?.name || "N/A"}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={statusConfig.text}
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
                      {/* Details Grid */}
                      <Grid container spacing={1} sx={{ mb: 1 }}>
                        <Grid size={12}>
                          <Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
                            <Box sx={{ color: "text.secondary", mt: 0.4 }}>
                              <FiCalendar size={16} />
                            </Box>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 400, fontSize: "0.875rem" }}>
                                {bill.created_at ? dayjs(bill.created_at).format("DD-MM-YYYY hh:mm A") : "N/A"}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid size={12}>
                          <Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
                            <Box sx={{ color: "text.secondary" }}>
                              <MdOutlinePhone size={16} />
                            </Box>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 400, fontSize: "0.875rem" }}>
                                {bill.customer?.mobile || "N/A"}
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
                          px: 1,
                          py: 1,
                          borderRadius: 1,
                          mb: 1,
                          border: "1px solid #e3f2fd",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
                            Total
                          </Typography>
                        </Box>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 500, color: "primary.main", fontSize: "1rem" }}
                        >
                          ₹{Number(bill.grand_total || 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Typography>
                      </Box>

                      <Divider sx={{ mb: 2 }} />

                      {/* Action Buttons */}
                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, flexWrap: "wrap" }}>
                        {hasPermission("bills.read") && (
                          <IconButton
                            size="medium"
                            onClick={() => handleViewBill(bill.id)}
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

                        {hasPermission("bills.create_challan") && (
                          <IconButton
                            size="medium"
                            onClick={() => handleChallan(bill.id)}
                            sx={{
                              width: "36px",
                              height: "36px",
                              bgcolor: "#e3f2fd",
                              color: "#1976d2",
                              "&:hover": { bgcolor: "#bbdefb" },
                            }}
                          >
                            <MdDescription size={20} />
                          </IconButton>
                        )}

                        {hasPermission("bills.mark_delivered") && bill.status === 2 && (
                          <IconButton
                            size="medium"
                            onClick={() => handleMarkDeliveredBill(bill.id)}
                            disabled={markingDelivered === bill.id}
                            sx={{
                              width: "36px",
                              height: "36px",
                              bgcolor: "#e8f5e9",
                              color: "#2e7d32",
                              "&:hover": { bgcolor: "#c8e6c9" },
                            }}
                          >
                            {markingDelivered === bill.id ? (
                              <CircularProgress size={18} />
                            ) : (
                              <MdLocalShipping size={20} />
                            )}
                          </IconButton>
                        )}

                        {canEditDelete && hasPermission("bills.update") && (
                          <IconButton
                            size="medium"
                            onClick={() => handleEditBill(bill.id)}
                            sx={{
                              width: "36px",
                              height: "36px",
                              bgcolor: "#e8eaf6",
                              color: "#3f51b5",
                              "&:hover": { bgcolor: "#c5cae9" },
                            }}
                          >
                            <BiSolidEditAlt size={20} />
                          </IconButton>
                        )}

                        {canEditDelete && hasPermission("bills.delete") && (
                          <IconButton
                            size="medium"
                            onClick={() => {
                              setOpenDelete(true);
                              setDeleteRow(bill.id);
                            }}
                            sx={{
                              width: "36px",
                              height: "36px",
                              bgcolor: "#ffebee",
                              color: "#d32f2f",
                              "&:hover": { bgcolor: "#ffcdd2" },
                            }}
                          >
                            <RiDeleteBinLine size={20} />
                          </IconButton>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                );
              })
            )}

            {/* Mobile Pagination */}
            {!loading && normalizedBills.length > 0 && (
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
        <Grid container spacing={1}>
          <Grid size={12}>
            <Paper
              elevation={0}
              sx={{ width: "100%", backgroundColor: "#fff", px: 2 }}
              ref={tableContainerRef}
            >
              <MaterialReactTable
                columns={columns}
                data={normalizedBills}
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
                    minWidth: "1100px",
                  },
                }}
                muiTableBodyCellProps={{
                  sx: { whiteSpace: "wrap" },
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
                      display: normalizedBills.length === 0 ? 'none' : 'table-row'
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
                    <Typography variant="h6" className="page-title">
                      Bills
                    </Typography>

                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
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
        </Grid>
      )}

      {/* Delete Modal */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Delete this bill?</DialogTitle>
        <DialogContent style={{ minWidth: "300px" }}>
          <DialogContentText>This action cannot be undone</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button
            onClick={() => handleDelete(deleteRow)}
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

export default Bills;