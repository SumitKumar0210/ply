import React, { useEffect, useMemo, useRef } from "react";
import {
  Typography,
  Grid,
  Paper,
  Box,
  IconButton,
  Tooltip,
  Skeleton,
} from "@mui/material";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
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

  const { data: stockData = [], loading, error } = useSelector(
    (state) => state.stock
  );

  useEffect(() => {
    dispatch(fetchStock());
  }, [dispatch]);

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

          // Determine color based on stock movement
          let color = "text.primary";
          if (inStock !== null && inStock !== undefined && inStock > 0) {
            color = "success.main"; // Green if stock came in
          } else if (outStock !== null && outStock !== undefined && outStock > 0) {
            color = "error.main"; // Red if stock went out
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
          // Format date to readable format
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

  // Function to download CSV from data
  const downloadCSV = () => {
    const headers = [
      "ID",
      "Product Name",
      "Stock In",
      "Stock Out",
      "Available Qty",
      "Created"
    ];

    const rows = stockData.map((row) => {
      const inStock = row.in_stock || 0;
      const outStock = row.out_stock || 0;

      return [
        row.id,
        row.product?.name || "-",
        row.in_stock !== null ? row.in_stock : "-",
        row.out_stock !== null ? row.out_stock : "-",
        row.available_qty !== null ? row.available_qty : "-",
        row.created_at
      ].map(val => `"${val}"`).join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "stock_inout_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print handler
  const handlePrint = () => {
    if (!tableContainerRef.current) return;
    const printContents = tableContainerRef.current.innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  return (
    <ErrorBoundary>
      <Grid container spacing={2}>
        <Grid size={12}>
          <Paper
            elevation={0}
            sx={{ width: "100%", overflowX: "auto", backgroundColor: "#fff" }}
            ref={tableContainerRef}
          >
            <MaterialReactTable
              columns={columns}
              data={stockData}
              getRowId={(row) => row.id}
              state={{
                isLoading: loading,
                showLoadingOverlay: loading,
              }}
              enableTopToolbar
              enableColumnFilters
              enableSorting
              enablePagination
              enableBottomToolbar
              enableGlobalFilter
              enableDensityToggle={false}
              enableColumnActions={false}
              enableColumnVisibilityToggle={false}
              initialState={{ density: "compact" }}
              muiTableContainerProps={{
                sx: { width: "100%", backgroundColor: "#fff", px: 3 },
              }}
              muiTablePaperProps={{
                sx: { backgroundColor: "#fff" },
              }}
              renderTopToolbar={({ table }) => (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    p: 1,
                    px: 3
                  }}
                >
                  <Typography variant="h6" className='page-title'>
                    Stock In/Out
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <MRT_GlobalFilterTextField table={table} />
                    <MRT_ToolbarInternalButtons table={table} />

                    <Tooltip title="Print">
                      <IconButton color="default" onClick={handlePrint}>
                        <FiPrinter size={20} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Download CSV">
                      <IconButton color="default" onClick={downloadCSV}>
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