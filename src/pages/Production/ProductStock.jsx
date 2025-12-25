import * as React from "react";
import { useMemo, useRef, useState, useEffect } from "react";
import {
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogContentText,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  TextField,
  Pagination,
  InputAdornment,
  useMediaQuery,
  useTheme
} from "@mui/material";
import CustomSwitch from "../../components/CustomSwitch/CustomSwitch";
import {
  MaterialReactTable,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextField,
} from "material-react-table";
import AddIcon from "@mui/icons-material/Add";
import { BiSolidEditAlt } from "react-icons/bi";
import { RiDeleteBinLine } from "react-icons/ri";
import { FiPrinter } from "react-icons/fi";
import { BsCloudDownload } from "react-icons/bs";
import SearchIcon from "@mui/icons-material/Search";
import { HiOutlineReceiptTax } from "react-icons/hi";
import { BsTelephone } from "react-icons/bs";
import { MdAlternateEmail } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts, deleteProduct, statusUpdate } from "../settings/slices/productSlice";
import ImagePreviewDialog from "../../components/ImagePreviewDialog/ImagePreviewDialog";
import Profile from "../../assets/images/profile.jpg";
import ProductFormDialog from "../../components/Product/ProductFormDialog";
import { useAuth } from "../../context/AuthContext";
import { MdOutlineQrCode2, MdStraighten } from "react-icons/md";

const ProductStocks = () => {
  const { hasPermission, hasAnyPermission } = useAuth();
  const mediaUrl = import.meta.env.VITE_MEDIA_URL;
  const dispatch = useDispatch();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { data: data = [], loading } = useSelector((state) => state.product);

  const tableContainerRef = useRef(null);
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [editProductData, setEditProductData] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  // Load groups when dialog opens
  // useEffect(() => {
  //   if (openProductDialog) {
  //     dispatch(fetchActiveGroup());
  //     dispatch(fetchActiveProductTypes());
  //   }
  // }, [openProductDialog, dispatch]);

  const handleAddProduct = () => {
    setEditProductData(null);
    setOpenProductDialog(true);
  };

  const handleEditProduct = (row) => {
    setEditProductData(row);
    setOpenProductDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenProductDialog(false);
    setEditProductData(null);
  };

  // Delete
  const handleDelete = async (id) => {
    setIsDeleting(true);
    await dispatch(deleteProduct(id));
    setIsDeleting(false);
    setOpenDelete(false);
    setDeleteRow(null);
  };
  const canUpdate = useMemo(() => hasPermission("product.update"), [hasPermission]);

  const columns = useMemo(() => {
    const baseColumns = [
      {
        accessorKey: "image",
        header: "Image",
        size: 80,
        Cell: ({ row }) => (
          <ImagePreviewDialog
            imageUrl={row.original.image ? mediaUrl + row.original.image : Profile}
            alt={row.original.name}
          />
        ),
      },
      { accessorKey: "name", header: "Name", size: 150 },
      { accessorKey: "model", header: "Model", size: 120 },
      { accessorKey: "size", header: "Size", size: 100 },
      { accessorKey: "product_type", header: "Product Type", size: 150 },
      { accessorKey: "available_qty", header: "Available Qty", size: 150 },

    ];


    return baseColumns;
  }, [
    dispatch,
    mediaUrl,
    hasPermission,
    hasAnyPermission,
    canUpdate,
    handleEditProduct,
    setOpenDelete,
    setDeleteRow,
    statusUpdate,
    Profile,
  ]);


  // Function to download CSV from data
  const downloadCSV = () => {
    const headers = columns
      .filter((col) => col.accessorKey)
      .map((col) => col.header);
    const rows = data.map((row) =>
      columns
        .filter((col) => col.accessorKey)
        .map((col) => `"${row[col.accessorKey] ?? ""}"`)
        .join(",")
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Product_data.csv");
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
            Product Stocks
          </Typography>
        </Grid>
        <Grid item>
           {hasPermission('product.create') && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddProduct}
                sx={{mt: 0}}
              >
                Add Product
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
                      Decorative Laminate Sheet
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      
                      <Chip
                    label="Hardware"
                    size="small"
                    sx={{
                      bgcolor: "white",
                      color: "primary.main",
                      fontWeight: 500,
                      fontSize: "0.75rem",
                    }}
                  />
                  <Chip
                        label="Qty: 45"
                        size="small"
                        sx={{
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          bgcolor: "success.light",
                          color: "success.contrastText"
                        }}
                      />
                    </Box>
                  </Box>
                  
                </Box>
              </Box>

              {/* Body Section */}
              <CardContent sx={{ px: 1.5 }}>
                {/* Details Grid */}
                <Grid container spacing={0} sx={{ mb: 0 }}>
                  <Grid size={12}>
                    {/* Products Section */}
                    <Box sx={{ mt: 0 }}>
                      {/* Single Product Item */}
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1.5,
                        }}
                      >
                        {/* Product Image */}
                        <Box
                          component="img"
                          src="https://pihpl.com/wp-content/uploads/Plywood-core.jpg"
                          alt="Decorative Laminate Sheet"
                          sx={{
                            width: 46,
                            height: 46,
                            borderRadius: 1,
                            objectFit: "cover",
                            border: "1px solid #eee",
                          }}
                        />
                        {/* Product Details */}
                        

<Box sx={{ flex: 1 }}>
  {/* Model */}
  <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
    <MdOutlineQrCode2 size={14} color="#666" />
    <Typography
      variant="body2"
      sx={{ fontWeight: 500, lineHeight: 1.2 }}
    >
      DL-503
    </Typography>
  </Box>

  {/* Size / Dimension */}
  <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mt: 0.5 }}>
    <MdStraighten size={14} color="#666" />
    <Typography
      variant="caption"
      sx={{ color: "text.secondary" }}
    >
      8×4 ft
    </Typography>
  </Box>
</Box>

                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            {/* Mobile Pagination */}
            {/* <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                    <Pagination
                      count={Math.ceil(10 / pagination.pageSize)}
                      page={pagination.pageIndex + 1}
                      onChange={handleMobilePageChange}
                      color="primary"
                    />
                  </Box> */}
          </Box>
        </>
      ) : (
        // 🔹 DESKTOP VIEW (Table)
        <Grid size={12}>
          <Paper
            elevation={0}
            sx={{ width: "100%", overflowX: "auto", backgroundColor: "#fff", px: 3 }}
            ref={tableContainerRef}
          >
            <MaterialReactTable
              columns={columns}
              data={data}
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
              state={{ isLoading: loading }}
              muiTableContainerProps={{
                sx: {
                  width: "100%",
                  backgroundColor: "#fff",
                  overflowX: "auto",
                },
              }}
              muiTableBodyCellProps={{
                sx: { whiteSpace: "wrap", width: "100px" },
              }}
              muiTablePaperProps={{
                sx: { backgroundColor: "#fff", boxShadow: "none" },
              }}
              muiTableBodyRowProps={() => ({
                hover: false,
              })}
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
                    Product Stocks
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <MRT_GlobalFilterTextField table={table} />
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
      )}


      {/* Product Form Dialog - Handles both Add and Edit */}
      <ProductFormDialog
        open={openProductDialog}
        onClose={handleCloseDialog}
        editData={editProductData}
      />

      {/* Delete Modal */}
      <Dialog open={openDelete} onClose={() => !isDeleting && setOpenDelete(false)}>
        <DialogTitle>{"Delete this Product?"}</DialogTitle>
        <DialogContent style={{ width: "300px" }}>
          <DialogContentText>This action cannot be undone</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={() => handleDelete(deleteRow?.id)}
            variant="contained"
            color="error"
            autoFocus
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

    </>
  );
};

export default ProductStocks;