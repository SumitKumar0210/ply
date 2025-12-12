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
  DialogTitle,
  TextField,
  InputAdornment,
  CircularProgress,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { GrCurrency } from "react-icons/gr";
import { MdOutlineRemoveRedEye, MdDescription, MdLocalShipping } from "react-icons/md";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
} from "material-react-table";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import { useDispatch, useSelector } from "react-redux";
import { fetchBills, markAsDelivered } from "./slice/billsSlice";
import { fetchPaymentRecord, storePayment, clearPayments } from "./slice/paymentSlice";
import { useAuth } from "../../context/AuthContext";

// Payment validation schema
const validationSchema = Yup.object().shape({
  paymentMode: Yup.string().required("Please select a payment mode"),
  amount: Yup.number()
    .typeError("Amount must be a number")
    .positive("Amount must be greater than zero")
    .required("Please enter the amount")
    .test("not-exceed-due", "Amount cannot exceed due amount", function (value) {
      const { amountToPay } = this.parent;
      return value <= amountToPay;
    }),
  referenceNo: Yup.string().when("paymentMode", {
    is: (val) => val === "upi" || val === "cheque",
    then: (schema) =>
      schema.required("Reference number is required for this payment mode"),
    otherwise: (schema) => schema.notRequired(),
  }),
});

const DispatchProduct = () => {
  const { hasPermission, hasAnyPermission } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const tableContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const { data: bills, loading, totalRecords } = useSelector((state) => state.bill);
  const { payments = [], paymentLoading = false } = useSelector((state) => state.payment);

  // State management
  const [showSearch, setShowSearch] = useState(false);
  const [markingDelivered, setMarkingDelivered] = useState(null);
  const [openPayment, setOpenPayment] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [dueAmount, setDueAmount] = useState(0);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const normalizedBills = Array.isArray(bills) ? bills : [];
  const normalizedTotal = typeof totalRecords === "number" ? totalRecords : 0;
  const tableKey = `${normalizedBills.length}-${normalizedTotal}-${debouncedSearch}`;

  // Focus search input when shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Debounce search
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

  // Fetch bills data
  const fetchData = useCallback(() => {
    const params = {
      pageIndex: pagination.pageIndex,
      pageLimit: pagination.pageSize,
      search: debouncedSearch,
      dispatch: true,
    };
    dispatch(fetchBills(params));
  }, [dispatch, pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Navigation handlers
  const handleAddBill = useCallback(() => {
    navigate("/bill/generate-bill");
  }, [navigate]);

  const handleViewBill = useCallback(
    (id) => {
      navigate(`/bill/view/${id}`);
    },
    [navigate]
  );

  const handleChallan = useCallback(
    (id) => {
      navigate(`/bill/challan/${id}`);
    },
    [navigate]
  );

  // Mark as delivered handler
  const handleMarkDeliverdBill = useCallback(
    async (id) => {
      setMarkingDelivered(id);
      try {
        await dispatch(markAsDelivered(id)).unwrap();
        await fetchData();
      } catch (error) {
        console.error("Mark as delivered failed:", error);
      } finally {
        setMarkingDelivered(null);
      }
    },
    [dispatch, fetchData]
  );

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

  // Payment modal handlers
  const handleOpenPayment = useCallback(
    async (row) => {
      setSelectedInvoice(row);
      const calculatedDueAmount =
        row.due_amount !== null && row.due_amount !== undefined
          ? row.due_amount
          : row.grand_total;

      setDueAmount(calculatedDueAmount);

      dispatch(clearPayments());

      await dispatch(fetchPaymentRecord({ id: row.id }));

      setOpenPayment(true);
    },
    [dispatch]
  );


  const handleClosePayment = useCallback(() => {
    setOpenPayment(false);
    setSelectedInvoice(null);
    setDueAmount(0);
  }, []);

  // Payment submission
  const handlePaymentSubmit = useCallback(
    async (values, { setSubmitting, resetForm }) => {
      try {
        const result = await dispatch(
          storePayment({
            id: selectedInvoice?.id,
            payment_mode: values.paymentMode,
            amount: values.amount,
            reference_no: values.referenceNo,
          })
        ).unwrap();

        // Update due amount
        const newDueAmount = result?.due_amount ?? dueAmount - values.amount;
        setDueAmount(newDueAmount);

        // Refresh payment records
        await dispatch(fetchPaymentRecord({ id: selectedInvoice?.id }));

        // Update selected invoice
        if (result?.due_amount !== undefined) {
          setSelectedInvoice((prev) => ({
            ...prev,
            due_amount: result.due_amount,
            paid_amount: result.total_paid || prev.paid_amount,
          }));
        }

        // Refresh bills list
        fetchData();
        resetForm();
      } catch (error) {
        console.error("Payment error:", error);
      } finally {
        setSubmitting(false);
      }
    },
    [dispatch, selectedInvoice, dueAmount, fetchData]
  );

  // Search toggle
  const handleSearchToggle = useCallback(() => {
    if (showSearch && globalFilter) {
      setGlobalFilter("");
    }
    setShowSearch(!showSearch);
  }, [showSearch, globalFilter]);

  // Format status
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
        size: 120,
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
        accessorKey: "date",
        header: "Bill Date",
        size: 120,
        Cell: ({ cell }) => {
          const value = cell.getValue();
          if (!value) return "N/A";
          try {
            return new Date(value).toLocaleDateString("en-IN");
          } catch {
            return value;
          }
        },
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
            maximumFractionDigits: 2,
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

    if(hasAnyPermission(["dispatch_product.collect_payment","dispatch_product.view_challan","dispatch_product.read","dispatch_product.mark_delivered"])){
      baseColumns.push({
        id: "actions",
        header: "Actions",
        enableSorting: false,
        enableColumnFilter: false,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ row }) => (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            {hasPermission("dispatch_product.read") && (
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

            {hasPermission("dispatch_product.view_challan") && (
              <Tooltip title="View Challan">
              <IconButton
                color="primary"
                onClick={() => handleChallan(row.original.id)}
                size="small"
              >
                <MdDescription size={18} />
              </IconButton>
            </Tooltip>
            )}

            {(hasPermission("dispatch_product.mark_delivered") && row.original.status === 2) && (
              <Tooltip title="Mark as Delivered">
                <IconButton
                  color="success"
                  onClick={() => handleMarkDeliverdBill(row.original.id)}
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

            {hasPermission("dispatch_product.collect_payment") && (
              <Tooltip title="Make Payment">
              <IconButton
                color="success"
                onClick={() => handleOpenPayment(row.original)}
                size="small"
              >
                <GrCurrency size={16} />
              </IconButton>
            </Tooltip>
            )}
          </Box>
        ),
      })
    }

    return baseColumns ;
    [
      getStatusConfig,
      handleViewBill,
      handleChallan,
      handleMarkDeliverdBill,
      handleOpenPayment,
      markingDelivered,
    ]
  }
  );

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
      const date = row.date
        ? new Date(row.date).toLocaleDateString("en-IN")
        : "N/A";
      const total = row.grand_total
        ? `₹ ${Number(row.grand_total).toLocaleString("en-IN")}`
        : "₹ 0.00";
      const config = getStatusConfig(row.status);

      return [
        `"${row.invoice_no || ""}"`,
        `"${customerName}"`,
        `"${customerMobile}"`,
        `"${date}"`,
        `"${total}"`,
        `"${config.text}"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `Bills_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [normalizedBills, getStatusConfig]);

  // Print
  const handlePrint = useCallback(() => {
    if (!tableContainerRef.current) return;

    const printContents = tableContainerRef.current.innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;

    window.location.reload();
  }, []);

  return (
    <>
      <Grid container spacing={1}>
        <Grid size={12}>
          <Paper
            elevation={0}
            sx={{ width: "100%", backgroundColor: "#fff", px: 2 }}
            ref={tableContainerRef}
          >
            <MaterialReactTable
              key={tableKey}
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
                  "& tr": {
                    display: normalizedBills.length === 0 ? "none" : "table-row",
                  },
                },
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
                    Dispatched Product
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

                    {hasPermission("bills.create") && (
                      <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddBill}
                    >
                      Add Bill
                    </Button>
                    )}
                  </Box>
                </Box>
              )}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Payment Modal */}
      <Dialog
        onClose={handleClosePayment}
        open={openPayment}
        fullWidth
        maxWidth={dialogMaxWidth}
      >
        <DialogTitle sx={{ m: 0, p: 1.5 }}>Collect Payment</DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleClosePayment}
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
                  onClick={handleClosePayment}
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

export default DispatchProduct;