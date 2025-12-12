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
} from "@mui/material";

import CustomSwitch from "../../../components/CustomSwitch/CustomSwitch";
import CloseIcon from "@mui/icons-material/Close";
import { styled } from "@mui/material/styles";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import AddIcon from "@mui/icons-material/Add";
import { RiListOrdered } from "react-icons/ri";
import { BiSolidEditAlt } from "react-icons/bi";
import { RiDeleteBinLine } from "react-icons/ri";
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
  const tableContainerRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const [open, setOpen] = useState(false);

  // Redux State
  const { 
    data: vendorData = [], 
    total: totalRows = 0,
    loading = false 
  } = useSelector((state) => state.vendor);
console.log("vendorData", vendorData);
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
    }, 900); // 900ms debounce

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

  //  Table columns
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

    if(hasPermission("vendor_lists.read"))
    {
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
    []
  });

  //  CSV download
  const downloadCSV = useCallback(() => {
    try {
      const headers = ["Vendor Name", "Mobile", "Email", "Category", "GST"];
      const rows = (vendorData.data || []).map((row) => [
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

  //  Print
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

  return (
    <ErrorBoundary>
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
              boxShadow:
                "0px 1px 3px rgba(0,0,0,0.04), 0px 4px 10px rgba(0,0,0,0.06)",
            }}
            ref={tableContainerRef}
          >
            <MaterialReactTable
              columns={columns}
              data={vendorData.data || []}
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
                  <Typography variant="h6">Vendor</Typography>
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
    </ErrorBoundary>
  );
};

export default Vendor;