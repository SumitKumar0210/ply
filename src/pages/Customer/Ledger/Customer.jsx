import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Typography,
  Grid,
  Paper,
  Box,
  IconButton,
  Tooltip,
  TextField,

  Chip,
  Card,
  CardContent,
  Divider,
  Pagination,
  InputAdornment,
  useMediaQuery,
  useTheme
} from "@mui/material";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import { RiListOrdered } from "react-icons/ri";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import { IoMdRefresh } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchAllCustomersWithSearch } from "../../Users/slices/customerSlice";
import { useAuth } from "../../../context/AuthContext";
import { BsTelephone } from "react-icons/bs";
import { MdAlternateEmail } from "react-icons/md";
import { HiOutlineReceiptTax } from "react-icons/hi";
import SearchIcon from "@mui/icons-material/Search";
import { IoLocationOutline } from "react-icons/io5";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: "center", color: "red" }}>
          <Typography variant="h6">Something went wrong.</Typography>
          <Typography variant="body2">{this.state.error?.message}</Typography>
        </Box>
      );
    }
    return this.props.children;
  }
}

const Customer = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const tableContainerRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Redux State
  const {
    data: customerData = [],
    totalCount: totalRows = 0,
    loading = false,
  } = useSelector((state) => state.customer);

  console.log(totalRows, customerData)
  // Initialize state from URL params
  const getInitialPage = useCallback(() => {
    const page = searchParams.get("page");
    return page ? parseInt(page) - 1 : 0;
  }, [searchParams]);

  const getInitialPageSize = useCallback(() => {
    const pageSize = searchParams.get("limit");
    return pageSize ? parseInt(pageSize) : 10;
  }, [searchParams]);

  const getInitialSearch = useCallback(() => {
    return searchParams.get("search") || "";
  }, [searchParams]);

  // Local State
  const [pagination, setPagination] = useState({
    pageIndex: getInitialPage(),
    pageSize: getInitialPageSize(),
  });
  const [globalFilter, setGlobalFilter] = useState(getInitialSearch());

  // Update URL params
  const updateURLParams = useCallback(
    (page, pageSize, search) => {
      const params = new URLSearchParams();
      params.set("page", (page + 1).toString());
      params.set("limit", pageSize.toString());
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
      limit: pagination.pageSize,
      active: true,
    };

    if (globalFilter) {
      params.search = globalFilter;
    }

    dispatch(fetchAllCustomersWithSearch(params));
    updateURLParams(pagination.pageIndex, pagination.pageSize, globalFilter);
  }, [dispatch, pagination.pageIndex, pagination.pageSize, globalFilter, updateURLParams]);

  // Debounced fetch on pagination or search change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 900);

    return () => clearTimeout(timer);
  }, [pagination, globalFilter]);

  // Handlers
  const handlePaginationChange = useCallback((updater) => {
    setPagination((prev) => (typeof updater === "function" ? updater(prev) : updater));
  }, []);

  const handleGlobalFilterChange = useCallback((value) => {
    setGlobalFilter(value || "");
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const handleLedger = useCallback(
    (id) => {
      navigate(`/customer/ledger/${id}`);
    },
    [navigate]
  );

  // Table columns
  const columns = useMemo(() => {
    const baseColumns = [
      { accessorKey: "name", header: "Customer Name" },
      { accessorKey: "mobile", header: "Mobile" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "city", header: "City" },
      { accessorKey: "gst_no", header: "GST" },
    ];

    if (hasPermission("customer_lists.view_ledger")) {
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
            <Tooltip title="Ledger">
              <IconButton color="primary" onClick={() => handleLedger(row.original.id)}>
                <RiListOrdered size={16} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      })
    }

    return baseColumns;
    [handleLedger]
  });

  // CSV Export
  const downloadCSV = useCallback(() => {
    try {
      const headers = ["Customer Name", "Mobile", "Email", "City", "GST"];
      const rows = (customerData).map((row) => [
        row.name || "",
        row.mobile || "",
        row.email || "",
        row.city || "",
        row.gst_no || "",
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
      link.setAttribute("download", `Customers_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV download error:", error);
    }
  }, [customerData]);

  // Print Handler
  const handlePrint = useCallback(() => {
    if (!tableContainerRef.current) return;
    try {
      const printWindow = window.open("", "", "height=600,width=1200");
      if (!printWindow) return;
      printWindow.document.write(tableContainerRef.current.innerHTML);
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
  return (
    <>
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid size="12">
          <Typography variant="h6" className="page-title">Customer List</Typography>
        </Grid>
      </Grid>
      <ErrorBoundary>
        {isMobile ? (
          // 🔹 MOBILE VIEW (Cards)
          <>
            <Box sx={{ minHeight: '100vh' }}>
              {/* Mobile Search */}
              <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search purchase orders..."
                  value=""
                  // onChange={(e) => handleGlobalFilterChange(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Paper>
              <Card sx={{ mb: 2, boxShadow: 2, overflow: "hidden", borderRadius: 2, maxWidth: 600 }}>
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
                      <Typography variant="h6" sx={{ fontWeight: 500, color: "white", mb: 0.5 }}>
                        Rohit Sharma
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <HiOutlineReceiptTax size={14} />
                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
                          29AACCS9876K1Z9
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Body Section */}
                <CardContent sx={{ p: 1.5 }}>
                  {/* Details Grid */}
                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid size={12}>
                      <Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
                        <Box
                          sx={{
                            color: "text.secondary",
                            mt: 0.2,
                          }}
                        >
                          <BsTelephone size={16} />
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 400, fontSize: "0.875rem" }}>
                            9988776655
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid size={12}>
                      <Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
                        <Box
                          sx={{
                            color: "text.secondary",
                            mt: 0.2,
                          }}
                        >
                          <MdAlternateEmail size={16} />
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 400, fontSize: "0.875rem" }}>
                            info@steelmart.co.in
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid size={12}>
                      <Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
                        <Box
                          sx={{
                            color: "text.secondary",
                            mt: 0.2,
                          }}
                        >
                          <IoLocationOutline size={16} />
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 400, fontSize: "0.875rem" }}>
                            Patna, Bihar
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                  </Grid>
                  <Divider sx={{ mb: 1 }} />
                  {/* Action Buttons */}
                  <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>

                    <IconButton
                      size="medium"
                      sx={{
                        bgcolor: "#e3f2fd",      // light green
                        color: "#1976d2",       // success dark
                        "&:hover": { bgcolor: "#bbdefb" },
                      }}
                    >
                      <RiListOrdered size={20} />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
              {/* Mobile Pagination */}
              <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                <Pagination
                  count={Math.ceil(10 / pagination.pageSize)}
                  page={pagination.pageIndex + 1}
                  onChange={handleMobilePageChange}
                  color="primary"
                />
              </Box>
            </Box>
          </>
        ) : (
          // 🔹 DESKTOP VIEW (Table)
          <Grid container spacing={2}>
            <Grid size={12}>
              <Paper
                elevation={0}
                sx={{
                  width: "100%",
                  overflow: "hidden",
                  backgroundColor: "#fff",
                  borderRadius: "12px",
                  px: 2,
                  py: 2,
                  boxShadow: "0px 1px 3px rgba(0,0,0,0.04), 0px 4px 10px rgba(0,0,0,0.06)",
                }}
                ref={tableContainerRef}
              >
                <MaterialReactTable
                  columns={columns}
                  data={customerData || []}
                  getRowId={(row) => row.id}
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
                  enablePagination
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
                      <Typography variant="h6" className="page-title">Customer</Typography>
                      <Box sx={{ display: "flex", gap: 1 }}>
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
          </Grid>
        )}
      </ErrorBoundary>
    </>
  );
};

export default Customer;