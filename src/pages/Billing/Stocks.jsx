import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Typography,
  Paper,
  Box,
  IconButton,
  Tooltip,
  Skeleton,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import { IoMdRefresh } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { fetchStock } from "./slice/stockSlice";

// Error Boundary
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

const StockInOut = () => {
  const dispatch = useDispatch();
  const tableContainerRef = useRef(null);
  const searchTimerRef = useRef(null);

  const { 
    data: stockData = [], 
    loading, 
    error,
    pagination: reduxPagination,
  } = useSelector((state) => state.stock);

  // Initialize state (no URL params)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  
  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounced search effect
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(globalFilter);
      // Reset to first page when search changes
      if (globalFilter !== debouncedSearch) {
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
      }
    }, 300); // Reduced to 300ms for snappier feel

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [globalFilter]);

  // Fetch data when pagination or debounced search changes
  useEffect(() => {
    const params = {
      page: pagination.pageIndex + 1,
      perPage: pagination.pageSize,
      searchQuery: debouncedSearch,
    };

    console.log('Fetching data with params:', params);
    dispatch(fetchStock(params));
  }, [dispatch, pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  // Handle pagination change
  const handlePaginationChange = useCallback((updater) => {
    setPagination((prev) => {
      const newPagination = typeof updater === 'function' ? updater(prev) : updater;
      return newPagination;
    });
  }, []);

  // Handle search change (immediate UI update, debounced fetch)
  const handleGlobalFilterChange = useCallback((value) => {
    setGlobalFilter(value || "");
  }, []);

  // Refresh data
  const handleRefresh = useCallback(() => {
    dispatch(fetchStock({
      page: pagination.pageIndex + 1,
      perPage: pagination.pageSize,
      searchQuery: debouncedSearch,
    }));
  }, [dispatch, pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        size: 80,
        Cell: ({ cell }) => loading ? <Skeleton variant="text" width="80%" /> : cell.getValue(),
      },
      {
        accessorKey: "product.name",
        header: "Product Name",
        Cell: ({ row }) => {
          if (loading) return <Skeleton variant="text" width="80%" />;
          return row.original.product?.name || "-";
        },
      },
      {
        accessorKey: "in_stock",
        header: "Stock In",
        Cell: ({ cell }) => {
          if (loading) return <Skeleton variant="text" width="80%" />;
          const value = cell.getValue();
          return value !== null && value !== undefined ? (
            <Typography color="success.main" fontWeight="600">
              +{value}
            </Typography>
          ) : (
            <Typography color="text.secondary">-</Typography>
          );
        },
      },
      {
        accessorKey: "out_stock",
        header: "Stock Out",
        Cell: ({ cell }) => {
          if (loading) return <Skeleton variant="text" width="80%" />;
          const value = cell.getValue();
          return value !== null && value !== undefined ? (
            <Typography color="error.main" fontWeight="600">
              -{value}
            </Typography>
          ) : (
            <Typography color="text.secondary">-</Typography>
          );
        },
      },
      {
        accessorKey: "available_qty",
        header: "Available Qty",
        Cell: ({ cell, row }) => {
          if (loading) return <Skeleton variant="text" width="80%" />;

          const value = cell.getValue();
          const inStock = row.original.in_stock;
          const outStock = row.original.out_stock;

          let color = "text.primary";
          if (inStock !== null && inStock !== undefined && inStock > 0) {
            color = "success.main";
          } else if (outStock !== null && outStock !== undefined && outStock > 0) {
            color = "error.main";
          }

          return value !== null && value !== undefined ? (
            <Typography color={color} fontWeight="600">
              {value}
            </Typography>
          ) : (
            <Typography color="text.secondary">-</Typography>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: "Added on",
        Cell: ({ cell }) => {
          if (loading) return <Skeleton variant="text" width="80%" />;
          const date = cell.getValue();
          if (!date) return "-";
          return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        },
      },
    ],
    [loading]
  );

  const downloadCSV = useCallback(() => {
    try {
      const headers = [
        "ID",
        "Product Name",
        "Stock In",
        "Stock Out",
        "Available Qty",
        "Created"
      ];

      const rows = stockData.map((row) => [
        row.id || "",
        row.product?.name || "",
        row.in_stock !== null ? row.in_stock : "",
        row.out_stock !== null ? row.out_stock : "",
        row.available_qty !== null ? row.available_qty : "",
        row.created_at || ""
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
        `Stock_InOut_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV download error:", error);
    }
  }, [stockData]);

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

  // Calculate total records from Redux state
  const totalRecords = reduxPagination?.total || 0;

  return (
    <ErrorBoundary>
      <Grid container spacing={2}>
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
              data={stockData}
              getRowId={(row) => row.id}
              manualPagination
              manualFiltering
              rowCount={totalRecords}
              state={{
                isLoading: loading,
                pagination: pagination,
                globalFilter,
                showProgressBars: loading,
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
                  minWidth: "800px",
                },
              }}
              muiTablePaperProps={{
                sx: { backgroundColor: "#fff", boxShadow: "none" },
              }}
              muiPaginationProps={{
                rowsPerPageOptions: [5, 10, 20, 50, 100],
                showFirstButton: true,
                showLastButton: true,
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
                    Stock Movement In/Out
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <MRT_GlobalFilterTextField table={table} />
                    <MRT_ToolbarInternalButtons table={table} />
                    <Tooltip title="Refresh">
                      <IconButton onClick={handleRefresh} size="small" disabled={loading}>
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

export default StockInOut;