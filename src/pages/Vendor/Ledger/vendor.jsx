import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  IconButton,
  TextField,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Chip,
  Card,
  CardContent,
  Divider,
  Pagination,
  InputAdornment,
  CircularProgress,
  useMediaQuery,
  useTheme
} from "@mui/material";

import CustomSwitch from "../../../components/CustomSwitch/CustomSwitch";
import CloseIcon from "@mui/icons-material/Close";
import { styled } from "@mui/material/styles";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import { RiListOrdered } from "react-icons/ri";
import SearchIcon from "@mui/icons-material/Search";
import { GrCurrency } from "react-icons/gr";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import { IoMdRefresh } from "react-icons/io";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  fetchVendors,
} from "../../settings/slices/vendorSlice";
import { useAuth } from "../../../context/AuthContext";
import { BsTelephone } from "react-icons/bs";
import { MdAlternateEmail } from "react-icons/md";
import { HiOutlineReceiptTax } from "react-icons/hi";

import { fetchActiveCategories } from "../../settings/slices/categorySlice";

//  Error Boundary
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

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": { padding: theme.spacing(2) },
  "& .MuiDialogActions-root": { padding: theme.spacing(1) },
}));

const Vendor = () => {
  const { hasPermission, hasAnyPermission } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const tableContainerRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const [open, setOpen] = useState(false);

  // Redux State
  const {
    data: vendorData = [],
    total: totalRows = 0,
    loading = false
  } = useSelector((state) => state.vendor);
  

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

  // Local State for pagination and search
  const [pagination, setPagination] = useState({
    pageIndex: getInitialPage(),
    pageSize: getInitialPageSize(),
  });
  const [globalFilter, setGlobalFilter] = useState(getInitialSearch());

  // Update URL params
  const updateURLParams = useCallback((page, pageSize, search) => {
    const params = new URLSearchParams();
    params.set("page", (page + 1).toString());
    params.set("per_page", pageSize.toString());
    if (search) {
      params.set("search", search);
    }
    setSearchParams(params);
  }, [setSearchParams]);

  // Fetch Data
  const fetchData = useCallback(() => {
    const params = {
      page: pagination.pageIndex + 1,
      per_page: pagination.pageSize,
    };

    if (globalFilter) {
      params.search = globalFilter;
    }

    dispatch(fetchVendors(params));
    updateURLParams(pagination.pageIndex, pagination.pageSize, globalFilter);
  }, [dispatch, pagination.pageIndex, pagination.pageSize, globalFilter, updateURLParams]);

  // Debounced fetch on pagination or search change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [pagination, globalFilter]);

  // Handle pagination change
  const handlePaginationChange = useCallback((updater) => {
    setPagination((prev) => {
      const newPagination = typeof updater === 'function' ? updater(prev) : updater;
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

  const handleLedger = (id) => {
    navigate('/vendor/ledger/' + id);
  };

  // Render mobile card - FIXED: Added return statement
  const renderMobileCard = (row) => {
    return (
      <Card key={row.id} sx={{ mb: 2, boxShadow: 2, overflow: "hidden", borderRadius: 2 }}>
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
                {row.name || "N/A"}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <HiOutlineReceiptTax size={14} />
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
                  {row.gst || "N/A"}
                </Typography>
              </Box>
            </Box>
            {row.category?.name && (
              <Chip
                label={row.category.name}
                size="small"
                sx={{
                  bgcolor: "white",
                  color: "primary.main",
                  fontWeight: 500,
                  fontSize: "0.75rem",
                }}
              />
            )}
          </Box>
        </Box>

        {/* Body Section */}
        <CardContent sx={{ p: 1.5 }}>
          {/* Details Grid */}
          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid item xs={12}>
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
                    {row.mobile || "N/A"}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12}>
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
                    {row.email || "N/A"}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
          <Divider sx={{ mb: 1 }} />
          {/* Action Buttons */}
          {hasPermission("vendor_lists.read") && (
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
              <Tooltip title="Ledger">
                <IconButton
                  size="small"
                  onClick={() => handleLedger(row.id)}
                  sx={{
                    width: "36px",
                    height: "36px",
                    bgcolor: "#e3f2fd",
                    color: "#1976d2",
                    "&:hover": { bgcolor: "#bbdefb" },
                  }}
                >
                  <RiListOrdered size={18} />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  //  Table columns - FIXED: Added dependency array
  const columns = useMemo(() => {
    const baseColumns = [
      { accessorKey: "name", header: "Vendor Name" },
      { accessorKey: "mobile", header: "Mobile" },
      { accessorKey: "email", header: "Email" },
      {
        accessorKey: "category_id",
        header: "Category",
        Cell: ({ row }) => row.original.category?.name || "—"
      },
      { accessorKey: "gst", header: "GST" },
    ];

    if (hasPermission("vendor_lists.read")) {
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
              <IconButton color="primary" onClick={() => handleLedger(row.original.id)} size="small">
                <RiListOrdered size={16} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      });
    }

    return baseColumns;
  }, [hasPermission]);

  //  CSV download
  const downloadCSV = useCallback(() => {
    try {
      const headers = ["Vendor Name", "Mobile", "Email", "Category", "GST"];
      const rows = (vendorData || []).map((row) => [
        row.name || "",
        row.mobile || "",
        row.email || "",
        row.category?.name || "",
        row.gst || "",
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
        `Vendors_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV download error:", error);
    }
  }, [vendorData]);

  //  Print - FIXED: Added proper HTML structure
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

  return (
    <>
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid item xs={12}>
          <Typography variant="h6" className="page-title">Vendor</Typography>
        </Grid>
      </Grid>
      <ErrorBoundary>

        {isMobile ? (
          // 🔹 MOBILE VIEW (Cards)
          <Box>
            {/* Mobile Search - FIXED: Connected value and onChange */}
            <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search vendors..."
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
            ) : vendorData.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">No vendors found</Typography>
              </Paper>
            ) : (
              <>
                {/* Render Cards */}
                {vendorData.map((row) => renderMobileCard(row))}

                {/* Mobile Pagination - FIXED: Use totalRows instead of hardcoded 10 */}
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
              sx={{
                width: "100%",
                overflow: "hidden",
                backgroundColor: "#fff",
                borderRadius: "12px",
                px: 2,
                py: 2,
                boxShadow:
                  "0px 1px 3px rgba(0,0,0,0.04), 0px 4px 10px rgba(0,0,0,0.06)",
              }}
              ref={tableContainerRef}
            >
              <MaterialReactTable
                columns={columns}
                data={vendorData || []}
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
                enableFullScreenToggle={false}
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
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    <Typography variant="h6" className="page-title">Vendor</Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
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
      </ErrorBoundary>
    </>
  );
};

export default Vendor;