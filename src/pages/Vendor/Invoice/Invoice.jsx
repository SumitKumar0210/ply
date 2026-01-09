import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  Button,
  Paper,
  TextField,
  Typography,
  IconButton,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Tooltip,
  Chip,
  Grid,
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Divider,
  Pagination,
  InputAdornment,
  CircularProgress,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import * as Yup from "yup";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import { MdOutlineRemoveRedEye, MdCheckCircle } from "react-icons/md";
import { GrCurrency } from "react-icons/gr";
import { FiUser, FiCalendar, FiPackage, FiCreditCard, FiPlus } from 'react-icons/fi';
import SearchIcon from "@mui/icons-material/Search";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import { IoMdRefresh } from "react-icons/io";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { PiCurrencyInr } from "react-icons/pi";
import { RiDeleteBinLine } from "react-icons/ri";
import { Formik, Form } from "formik";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchVendorInvoices,
  recordPayment,
  fetchPaymentRecord,
  clearPayments,
} from "../slice/vendorInvoiceSlice";
import { useAuth } from "../../../context/AuthContext";

// Validation Schema
const validationSchema = Yup.object().shape({
  paymentMode: Yup.string().required("Please select a payment mode"),
  amount: Yup.number()
    .typeError("Amount must be a number")
    .positive("Amount must be greater than zero")
    .required("Please enter the amount"),
  referenceNo: Yup.string().when("paymentMode", {
    is: (val) => val === "upi" || val === "cheque",
    then: (schema) =>
      schema.required("Reference number is required for this payment mode"),
    otherwise: (schema) => schema.notRequired(),
  }),
});

// Status Configuration
const STATUS_CONFIG = {
  0: { label: "Pending", color: "warning" },
  1: { label: "Partially Paid", color: "info" },
  2: { label: "Paid", color: "success" },
};

// Helper Functions
const getStatusChip = (status) => {
  const config = STATUS_CONFIG[status] || {
    label: "Unknown",
    color: "default",
  };
  return <Chip label={config.label} color={config.color} size="small" />;
};

const getItemCount = (materialItems) => {
  if (!materialItems) return 0;
  try {
    const items = JSON.parse(materialItems);
    return Array.isArray(items) ? items.length : 0;
  } catch {
    return 0;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return `${String(date.getDate()).padStart(2, "0")}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${date.getFullYear()}`;
};

const VendorInvoice = () => {

  const { hasPermission, hasAnyPermission } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const tableContainerRef = useRef(null);
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // Redux State
  const {
    data: tableData = [],
    total: totalRows = 0,
    loading = false,
  } = useSelector((state) => state.vendorInvoice);
  const { payments = [], paymentLoading = false } = useSelector(
    (state) => state.vendorInvoice
  );

  // Get initial values from URL
  const getInitialPage = () => {
    const page = searchParams.get("page");
    return page ? parseInt(page) - 1 : 0;
  };

  const getInitialPageSize = () => {
    const pageSize = searchParams.get("per_page");
    return pageSize ? parseInt(pageSize) : 10;
  };

  const getInitialSearch = () => {
    return searchParams.get("search") || "";
  };

  // Local State
  const [pagination, setPagination] = useState({
    pageIndex: getInitialPage(),
    pageSize: getInitialPageSize(),
  });
  const [globalFilter, setGlobalFilter] = useState(getInitialSearch());
  const [open, setOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [dueAmount, setDueAmount] = useState(null);

  // Calculate display conditions
  const shouldShowForm = useMemo(() => {
    return dueAmount === null || dueAmount > 0;
  }, [dueAmount]);

  const shouldShowHistory = useMemo(() => {
    return dueAmount !== null;
  }, [dueAmount]);

  const dialogMaxWidth = useMemo(() => {
    return shouldShowForm && shouldShowHistory ? "lg" : "md";
  }, [shouldShowForm, shouldShowHistory]);

  // Update URL params
  const updateURLParams = useCallback(
    (page, pageSize, search) => {
      const params = new URLSearchParams();
      params.set("page", (page + 1).toString());
      params.set("per_page", pageSize.toString());
      if (search) {
        params.set("search", search);
      }
      setSearchParams(params);
    },
    [setSearchParams]
  );

  // Fetch Data
  const fetchData = useCallback(() => {
    const params = {
      page: pagination.pageIndex + 1,
      per_page: pagination.pageSize,
    };

    if (globalFilter) {
      params.search = globalFilter;
    }

    dispatch(fetchVendorInvoices(params));
    updateURLParams(pagination.pageIndex, pagination.pageSize, globalFilter);
  }, [
    dispatch,
    pagination.pageIndex,
    pagination.pageSize,
    globalFilter,
    updateURLParams,
  ]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [pagination, globalFilter]);

  // Handle pagination change
  const handlePaginationChange = useCallback((updater) => {
    setPagination((prev) => {
      const newPagination =
        typeof updater === "function" ? updater(prev) : updater;
      return newPagination;
    });
  }, []);

  // Handle search change
  const handleGlobalFilterChange = useCallback((value) => {
    setGlobalFilter(value || "");
    // Reset to first page when searching
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  // Refresh data
  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Modal Handlers
  const handleClickOpen = useCallback(
    (invoice) => {
      setSelectedInvoice(invoice);
      setDueAmount(invoice.due_amount ?? invoice.grand_total);
      dispatch(fetchPaymentRecord({ id: invoice?.id }));
      setOpen(true);
    },
    [dispatch]
  );

  const handleClose = useCallback(() => {
    setOpen(false);
    setSelectedInvoice(null);
    setDueAmount(null);
    dispatch(clearPayments());
  }, [dispatch]);

  // Navigation Handler
  const handleViewClick = useCallback(
    (id) => {
      navigate(`/vendor/invoice/view/${id}`);
    },
    [navigate]
  );

  // Payment Submission
  const handlePaymentSubmit = useCallback(
    async (values, { setSubmitting, resetForm }) => {
      try {
        const result = await dispatch(
          recordPayment({
            invoice_id: selectedInvoice?.id,
            payment_mode: values.paymentMode,
            amount: values.amount,
            reference_no: values.referenceNo,
          })
        ).unwrap();

        setDueAmount(result?.due_amount);
        await dispatch(fetchPaymentRecord({ id: selectedInvoice?.id }));

        if (result?.due_amount !== undefined) {
          setSelectedInvoice((prev) => ({
            ...prev,
            due_amount: result.due_amount,
            paid_amount: result.total_paid || prev.paid_amount,
          }));
        }

        fetchData();
        resetForm();
      } catch (error) {
        console.error("Payment error:", error);
      } finally {
        setSubmitting(false);
      }
    },
    [dispatch, selectedInvoice, fetchData]
  );

  // Table Columns
  const columns = useMemo(() => {
    const baseColumns = [
      {
        accessorKey: "poNumber",
        header: "PO NO.",
        Cell: ({ row }) => row.original.purchase_order?.purchase_no || "-",
      },
      {
        accessorKey: "vendorInvoice",
        header: "Vendor Invoice",
        Cell: ({ row }) => row.original.vendor_invoice_no || "-",
      },
      {
        accessorKey: "date",
        header: "Date",
        Cell: ({ row }) => formatDate(row.original.vendor_invoice_date),
      },
      {
        accessorKey: "vendorName",
        header: "Vendor Name",
        Cell: ({ row }) => row.original.purchase_order?.vendor?.name || "-",
      },
      {
        accessorKey: "orderDated",
        header: "Order Dated",
        Cell: ({ row }) => formatDate(row.original.purchase_order?.order_date),
      },
      {
        accessorKey: "qcPassed",
        header: "QC",
        Cell: ({ row }) => getItemCount(row.original.material_items),
      },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ row }) => getStatusChip(row.original.status),
      },
    ];

    if (hasAnyPermission(["vendor_invoices.collect_payment", "vendor_invoices.read"])) {
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
            {hasPermission("vendor_invoices.read") && (
              <Tooltip title="View Invoice">
                <IconButton
                  color="warning"
                  onClick={() => handleViewClick(row.original.purchase_order?.id)}
                  size="small"
                >
                  <MdOutlineRemoveRedEye size={16} />
                </IconButton>
              </Tooltip>
            )}

            {hasPermission("vendor_invoices.collect_payment") && (
              <Tooltip title="Make Payment">
                <IconButton
                  color="success"
                  onClick={() => handleClickOpen(row.original)}
                  size="small"
                >
                  <GrCurrency size={16} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ),
      });
    }

    return baseColumns;
  }, [handleViewClick, handleClickOpen, hasPermission, hasAnyPermission]);

  // CSV Export
  const downloadCSV = useCallback(() => {
    try {
      const headers = [
        "PO NO.",
        "Vendor Invoice",
        "Date",
        "Vendor Name",
        "Order Dated",
        "QC",
        "Status",
      ];
      const rows = tableData.map((row) => [
        row.purchase_order?.purchase_no || "",
        row.vendor_invoice_no || "",
        formatDate(row.vendor_invoice_date),
        row.purchase_order?.vendor?.name || "",
        formatDate(row.purchase_order?.order_date),
        getItemCount(row.material_items),
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
        `VendorInvoices_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV download error:", error);
    }
  }, [tableData]);

  // Print Handler
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

  // Render mobile card
  const renderMobileCard = (row) => (
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
              {row.purchase_order?.purchase_no || "N/A"}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <FiUser size={14} />
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
                {row.purchase_order?.vendor?.name || "Unknown Vendor"}
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
                  {formatDate(row.purchase_order?.order_date)}
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
                  QC Items
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.875rem" }}>
                  {getItemCount(row.material_items)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
              <Box sx={{ color: "text.secondary", mt: 0.2 }}>
                <PiCurrencyInr size={16} />
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
                  Vendor Invoice
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.875rem" }}>
                  {row.vendor_invoice_no || "N/A"}
                </Typography>
              </Box>
            </Box>
          </Grid>

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
                  Invoice Date
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.875rem" }}>
                  {formatDate(row.vendor_invoice_date)}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 2 }} />

        {/* Action Buttons */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          {hasPermission("vendor_invoices.read") && (
            <Tooltip title="View Invoice">
              <IconButton
                size="small"
                onClick={() => handleViewClick(row.purchase_order?.id)}
                sx={{
                  width: "36px",
                  height: "36px",
                  bgcolor: "#fff3e0",
                  color: "#ff9800",
                  "&:hover": { bgcolor: "#ffe0b2" },
                }}
              >
                <MdOutlineRemoveRedEye size={18} />
              </IconButton>
            </Tooltip>
          )}

          {hasPermission("vendor_invoices.collect_payment") && (
            <Tooltip title="Make Payment">
              <IconButton
                size="small"
                onClick={() => handleClickOpen(row)}
                sx={{
                  width: "36px",
                  height: "36px",
                  bgcolor: "#e8f5e9",
                  color: "#48c24eff",
                  "&:hover": { bgcolor: "#c8e6c9" },
                }}
              >
                <GrCurrency size={18} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <>
      {/* Header */}
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid item>
          <Typography variant="h6" className="page-title">Vendor Invoices</Typography>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            to="/vendor/purchase-order/create"
            size={isMobile ? "small" : "medium"}
          >
            Create PO
          </Button>
        </Grid>
      </Grid>

      {isMobile ? (
        // 🔹 MOBILE VIEW (Cards)
        <Box sx={{ minHeight: '100vh' }}>
          {/* Mobile Search */}
          <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search vendor invoices..."
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
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : tableData.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">No vendor invoices found</Typography>
            </Paper>
          ) : (
            <>
              {/* Render Cards */}
              {tableData.map((row) => renderMobileCard(row))}

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
              rowCount={totalRows}
              state={{
                pagination,
                isLoading: loading,
                globalFilter,
              }}
              onPaginationChange={handlePaginationChange}
              onGlobalFilterChange={handleGlobalFilterChange}
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
                  <Typography variant="h6" className='page-title'>
                    Vendor Invoices/Payments
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

      {/* Payment Modal */}
      <Dialog
        onClose={handleClose}
        open={open}
        fullWidth
        maxWidth={dialogMaxWidth}
      >
        <DialogTitle sx={{ m: 0, p: 1.5 }}>Collect Payment</DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>

        <Formik
          initialValues={{
            amountToPay: dueAmount ?? 0,
            paymentMode: "",
            amount: "",
            referenceNo: "",
          }}
          validationSchema={validationSchema}
          onSubmit={handlePaymentSubmit}
          enableReinitialize
        >
          {({ values, errors, touched, handleChange, isSubmitting }) => (
            <Form>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  {/* Payment Form - Show when due_amount is null OR > 0 */}
                  {shouldShowForm && (
                    <Grid item xs={12} md={shouldShowHistory ? 6 : 12}>
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 2, fontWeight: 600 }}
                      >
                        Payment Details
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        margin="dense"
                        label="Amount to Pay"
                        name="amountToPay"
                        value={`₹${Number(
                          values.amountToPay || 0
                        ).toLocaleString("en-IN")}`}
                        InputProps={{ readOnly: true }}
                        sx={{ mb: 1 }}
                      />
                      <TextField
                        fullWidth
                        select
                        margin="dense"
                        label="Payment Mode"
                        name="paymentMode"
                        size="small"
                        value={values.paymentMode}
                        onChange={handleChange}
                        error={
                          touched.paymentMode && Boolean(errors.paymentMode)
                        }
                        helperText={touched.paymentMode && errors.paymentMode}
                        sx={{ mb: 1 }}
                      >
                        <MenuItem value="cash">Cash</MenuItem>
                        <MenuItem value="upi">UPI</MenuItem>
                        <MenuItem value="cheque">Cheque</MenuItem>
                      </TextField>
                      {(values.paymentMode === "upi" ||
                        values.paymentMode === "cheque") && (
                          <TextField
                            fullWidth
                            size="small"
                            margin="dense"
                            label="Reference Number"
                            name="referenceNo"
                            value={values.referenceNo}
                            onChange={handleChange}
                            error={
                              touched.referenceNo && Boolean(errors.referenceNo)
                            }
                            helperText={touched.referenceNo && errors.referenceNo}
                            sx={{ mb: 1 }}
                          />
                        )}
                      <TextField
                        fullWidth
                        size="small"
                        margin="dense"
                        label="Amount"
                        name="amount"
                        type="number"
                        value={values.amount}
                        onChange={handleChange}
                        error={touched.amount && Boolean(errors.amount)}
                        helperText={touched.amount && errors.amount}
                        sx={{ mb: 1 }}
                      />
                    </Grid>
                  )}

                  {/* Payment History - Show when due_amount is NOT null */}
                  {shouldShowHistory && (
                    <Grid item xs={12} md={shouldShowForm ? 6 : 12}>
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 2, fontWeight: 600 }}
                      >
                        Payment History
                      </Typography>
                      <Box
                        sx={{
                          border: "1px solid #e0e0e0",
                          borderRadius: 1,
                          overflow: "hidden",
                          maxHeight: 320,
                          bgcolor: "background.paper",
                        }}
                      >
                        {paymentLoading ? (
                          <Box sx={{ p: 4, textAlign: "center" }}>
                            <CircularProgress size={32} />
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 2 }}
                            >
                              Loading payment history...
                            </Typography>
                          </Box>
                        ) : payments && payments.length > 0 ? (
                          <TableContainer sx={{ maxHeight: 300 }}>
                            <Table stickyHeader size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell
                                    sx={{
                                      fontWeight: 600,
                                      fontSize: "13px",
                                      bgcolor: "grey.100",
                                    }}
                                  >
                                    Date
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontWeight: 600,
                                      fontSize: "13px",
                                      bgcolor: "grey.100",
                                    }}
                                  >
                                    Paid (₹)
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontWeight: 600,
                                      fontSize: "13px",
                                      bgcolor: "grey.100",
                                    }}
                                  >
                                    Mode
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontWeight: 600,
                                      fontSize: "13px",
                                      bgcolor: "grey.100",
                                    }}
                                  >
                                    Reference No
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontWeight: 600,
                                      fontSize: "13px",
                                      textAlign: "right",
                                      bgcolor: "grey.100",
                                    }}
                                  >
                                    Due (₹)
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {payments.map((payment, index) => (
                                  <TableRow
                                    key={payment.id || index}
                                    hover
                                    sx={{
                                      "&:nth-of-type(even)": {
                                        backgroundColor: "grey.50",
                                      },
                                    }}
                                  >
                                    <TableCell sx={{ fontSize: "13px" }}>
                                      {payment.date
                                        ? new Date(
                                          payment.date
                                        ).toLocaleDateString("en-IN")
                                        : "-"}
                                    </TableCell>
                                    <TableCell
                                      sx={{ fontSize: "13px", fontWeight: 500 }}
                                    >
                                      ₹
                                      {Number(
                                        payment.paid_amount || 0
                                      ).toLocaleString("en-IN")}
                                    </TableCell>
                                    <TableCell
                                      sx={{
                                        fontSize: "13px",
                                        textTransform: "capitalize",
                                      }}
                                    >
                                      {payment.payment_mode || "-"}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: "13px" }}>
                                      {payment.reference_no || "-"}
                                    </TableCell>
                                    <TableCell
                                      sx={{
                                        fontSize: "13px",
                                        textAlign: "right",
                                        fontWeight: 600,
                                        color:
                                          Number(payment.due || 0) === 0
                                            ? "success.main"
                                            : "warning.main",
                                      }}
                                    >
                                      ₹
                                      {Number(payment.due || 0).toLocaleString(
                                        "en-IN"
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Box sx={{ p: 3, textAlign: "center" }}>
                            <Typography variant="body2" color="text.secondary">
                              No payment history available
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions sx={{ gap: 1, mb: 1 }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Close
                </Button>
                {shouldShowForm && (
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </Button>
                )}
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </>
  );
};

export default VendorInvoice;