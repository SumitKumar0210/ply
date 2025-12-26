import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Typography,
  Paper,
  Box,
  IconButton,
  Tooltip,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
} from "material-react-table";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import { IoMdRefresh } from "react-icons/io";
import { MdFilterList, MdClear } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { fetchInventory, setMaterialFilter, setDateRange, clearFilters } from "./slice/inventorySlice";
import { fetchActiveMaterials } from "../../settings/slices/materialSlice";

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

const Inventory = () => {
  const dispatch = useDispatch();
  const tableContainerRef = useRef(null);

  const { 
    data: inventoryData = [],
    loading, 
    error,
    filters,
    pagination: reduxPagination,
  } = useSelector((state) => state.inventory);

  const { data:materials = [] }  = useSelector((state) => state.material);
  
  console.log("Inventory Data:", inventoryData);

  // Local state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Initial fetch
  useEffect(() => {
    dispatch(fetchActiveMaterials()); // Fetch materials for dropdown
    dispatch(fetchInventory({
      page: 1,
      perPage: 10,
    }));
  }, [dispatch]);

  // Handle filter changes
  const handleApplyFilters = useCallback(() => {
    const params = {
      page: 1,
      perPage: pagination.pageSize,
    };

    if (selectedMaterial) params.materialId = selectedMaterial;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    dispatch(setMaterialFilter(selectedMaterial));
    dispatch(setDateRange({ startDate, endDate }));
    dispatch(fetchInventory(params));
    
    // Reset to first page
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [dispatch, selectedMaterial, startDate, endDate, pagination.pageSize]);

  // Handle pagination change
  const handlePaginationChange = useCallback((updater) => {
    setPagination((prev) => {
      const newPagination = typeof updater === 'function' ? updater(prev) : updater;
      
      // Fetch new page data
      const params = {
        page: newPagination.pageIndex + 1,
        perPage: newPagination.pageSize,
      };

      if (selectedMaterial) params.materialId = selectedMaterial;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      dispatch(fetchInventory(params));
      
      return newPagination;
    });
  }, [dispatch, selectedMaterial, startDate, endDate]);

  // Refresh data
  const handleRefresh = useCallback(() => {
    const params = {
      page: pagination.pageIndex + 1,
      perPage: pagination.pageSize,
    };

    if (selectedMaterial) params.materialId = selectedMaterial;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    dispatch(fetchInventory(params));
  }, [dispatch, pagination.pageIndex, pagination.pageSize, selectedMaterial, startDate, endDate]);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setSelectedMaterial("");
    setStartDate("");
    setEndDate("");
    dispatch(clearFilters());
    dispatch(fetchInventory({
      page: 1,
      perPage: pagination.pageSize,
    }));
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [dispatch, pagination.pageSize]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "material_name",
        header: "Material Name",
        size: 200,
        Cell: ({ cell }) => loading ? <Skeleton variant="text" width="80%" /> : (
          <Typography fontWeight="600">{cell.getValue() || "-"}</Typography>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        size: 100,
        Cell: ({ cell }) => {
          if (loading) return <Skeleton variant="text" width="80%" />;
          const value = cell.getValue();
          return (
            <Box
              sx={{
                display: "inline-block",
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                bgcolor: value === "IN" ? "success.light" : "error.light",
                color: value === "IN" ? "success.dark" : "error.dark",
                fontWeight: 600,
                fontSize: "0.875rem",
              }}
            >
              {value || "-"}
            </Box>
          );
        },
      },
      {
        accessorKey: "qty",
        header: "Quantity",
        size: 120,
        Cell: ({ cell, row }) => {
          if (loading) return <Skeleton variant="text" width="80%" />;
          const value = cell.getValue();
          const type = row.original.type;
          return (
            <Typography 
              color={type === "IN" ? "success.main" : "error.main"} 
              fontWeight="600"
            >
              {type === "IN" ? "+" : "-"}{value || 0}
            </Typography>
          );
        },
      },
    //   {
    //     accessorKey: "previous_qty",
    //     header: "Previous Stock",
    //     size: 130,
    //     Cell: ({ cell }) => {
    //       if (loading) return <Skeleton variant="text" width="80%" />;
    //       const value = cell.getValue();
    //       return (
    //         <Typography color="text.secondary">
    //           {value !== null && value !== undefined ? value : 0}
    //         </Typography>
    //       );
    //     },
    //   },
    //   {
    //     accessorKey: "new_qty",
    //     header: "New Stock",
    //     size: 130,
    //     Cell: ({ cell }) => {
    //       if (loading) return <Skeleton variant="text" width="80%" />;
    //       const value = cell.getValue();
    //       return (
    //         <Typography color="primary.main" fontWeight="700" fontSize="1.1rem">
    //           {value !== null && value !== undefined ? value : 0}
    //         </Typography>
    //       );
    //     },
    //   },
    //   {
    //     accessorKey: "reference_type",
    //     header: "Reference",
    //     size: 150,
    //     Cell: ({ cell, row }) => {
    //       if (loading) return <Skeleton variant="text" width="80%" />;
    //       const refType = cell.getValue();
    //       const refId = row.original.reference_id;
    //       return (
    //         <Typography variant="body2">
    //           {refType ? `${refType} #${refId}` : "-"}
    //         </Typography>
    //       );
    //     },
    //   },
      {
        accessorKey: "created_at",
        header: "Date",
        size: 180,
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

  // Download CSV
  const downloadCSV = useCallback(() => {
    try {
      const headers = [
        "Material Name",
        "Type",
        "Quantity",
        "Previous Stock",
        "New Stock",
        "Reference",
        "Remarks",
        "Date"
      ];

      const rows = inventoryData.map((row) => [
        row.material_name || "",
        row.type || "",
        row.qty !== null ? row.qty : 0,
        row.previous_qty !== null ? row.previous_qty : 0,
        row.new_qty !== null ? row.new_qty : 0,
        row.reference_type ? `${row.reference_type} #${row.reference_id}` : "",
        row.remarks || "",
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
        `Material_Logs_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV download error:", error);
    }
  }, [inventoryData]);

  // Print handler
  const handlePrint = useCallback(() => {
    if (!tableContainerRef.current) return;
    try {
      const printWindow = window.open("", "", "height=600,width=1200");
      if (!printWindow) return;
      
      const printContent = `
        <html>
          <head>
            <title>Material Logs Report</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { text-align: center; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; font-weight: bold; }
              .success { color: green; }
              .error { color: red; }
            </style>
          </head>
          <body>
            <h1>Material Logs Report</h1>
            <p>Date: ${new Date().toLocaleDateString()}</p>
            ${tableContainerRef.current.innerHTML}
          </body>
        </html>
      `;
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error("Print error:", error);
    }
  }, []);

  const totalRecords = reduxPagination?.total || 0;
  const hasActiveFilters = selectedMaterial || startDate || endDate;

  return (
    <ErrorBoundary>
      <Grid container spacing={2}>
        {/* Filters Section */}
        <Grid size={12}>
          <Paper
            elevation={0}
            sx={{
              width: "100%",
              backgroundColor: "#fff",
              p: 2,
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <MdFilterList size={24} style={{ marginRight: 8 }} />
              <Typography variant="h6">Filters</Typography>
              {hasActiveFilters && (
                <Box
                  sx={{
                    ml: 2,
                    px: 1,
                    py: 0.5,
                    bgcolor: "primary.light",
                    color: "primary.dark",
                    borderRadius: 1,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  Active
                </Box>
              )}
            </Box>
            
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Select Material</InputLabel>
                  <Select
                    value={selectedMaterial}
                    onChange={(e) => setSelectedMaterial(e.target.value)}
                    label="Select Material"
                  >
                    <MenuItem value="">
                      <em>All Materials</em>
                    </MenuItem>
                    {materials.map((material) => (
                      <MenuItem key={material.id} value={material.id}>
                        {material.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: startDate }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ display: "flex", gap: 1, height: "100%" }}>
                  <Button
                    variant="contained"
                    onClick={handleApplyFilters}
                    startIcon={<MdFilterList />}
                    fullWidth
                    disabled={loading}
                  >
                    Apply
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleClearFilters}
                    startIcon={<MdClear />}
                    fullWidth
                    disabled={!hasActiveFilters || loading}
                  >
                    Clear
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Table Section */}
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
              data={inventoryData}
              getRowId={(row) => row.id}
              manualPagination
              rowCount={totalRecords}
              state={{
                isLoading: loading,
                pagination: pagination,
                showProgressBars: loading,
              }}
              onPaginationChange={handlePaginationChange}
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
                  minWidth: "1000px",
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
                  <Box>
                    <Typography variant="h6" className='page-title'>
                      Material Transaction Logs
                    </Typography>
                    {hasActiveFilters && (
                      <Typography variant="caption" color="text.secondary">
                        Filtered results
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
              renderBottomToolbarCustomActions={() => (
                <Box sx={{ px: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Records: {totalRecords}
                  </Typography>
                </Box>
              )}
            />
          </Paper>
        </Grid>
      </Grid>
    </ErrorBoundary>
  );
};

export default Inventory;