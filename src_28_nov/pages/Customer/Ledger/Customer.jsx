import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Typography,
  Grid,
  Paper,
  Box,
  IconButton,
  Tooltip,
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
import { fetchActiveCustomers } from "../../Users/slices/customerSlice";

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
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const tableContainerRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Redux State
  const {
    data: customerData = [],
    total: totalRows = 0,
    loading = false,
  } = useSelector((state) => state.customer);
  console.log(customerData)

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
    };

    if (globalFilter) {
      params.search = globalFilter;
    }

    dispatch(fetchActiveCustomers(params));
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
  const columns = useMemo(
    () => [
      { accessorKey: "name", header: "Customer Name" },
      { accessorKey: "mobile", header: "Mobile" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "city", header: "City" },
      { accessorKey: "gst_no", header: "GST" },
      {
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
      },
    ],
    [handleLedger]
  );

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
                  <Typography variant="h6">Customer</Typography>
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

export default Customer;