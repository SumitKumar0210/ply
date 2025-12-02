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
} from "@mui/material";
import CustomSwitch from "../../../components/CustomSwitch/CustomSwitch";
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

import { useDispatch, useSelector } from "react-redux";
import { fetchProducts, deleteProduct, statusUpdate } from "../slices/productSlice";
import { fetchActiveGroup } from "../slices/groupSlice";
import ImagePreviewDialog from "../../../components/ImagePreviewDialog/ImagePreviewDialog";
import Profile from "../../../assets/images/profile.jpg";
import ProductFormDialog from "../../../components/Product/ProductFormDialog";
import { fetchActiveProductTypes } from "../slices/productTypeSlice";

const Product = () => {
  const mediaUrl = import.meta.env.VITE_MEDIA_URL;
  const dispatch = useDispatch();
  const { data: data = [], loading } = useSelector((state) => state.product);

  const tableContainerRef = useRef(null);
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [editProductData, setEditProductData] = useState(null);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  // Load groups when dialog opens
  useEffect(() => {
    if (openProductDialog) {
      dispatch(fetchActiveGroup());
      dispatch(fetchActiveProductTypes());
    }
  }, [openProductDialog, dispatch]);

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

  const handleDelete = (id) => {
    dispatch(deleteProduct(id));
  };

  const columns = useMemo(
    () => [
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
      { accessorKey: "color", header: "Color", size: 100 },
      { accessorKey: "hsn_code", header: "HSN Code", size: 120 },
      { accessorKey: "rrp", header: "RRP", size: 100 },
      { accessorKey: "product_type", header: "Product Type", size: 150 },
      {
        accessorKey: "group_id",
        header: "Group",
        size: 100,
        Cell: ({ row }) => row.original.group?.name || "—",
      },
      {
        accessorKey: "status",
        header: "Status",
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) => (
          <CustomSwitch
            checked={!!row.original.status}
            onChange={(e) => {
              const newStatus = e.target.checked ? 1 : 0;
              dispatch(statusUpdate({ ...row.original, status: newStatus }));
            }}
          />
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        enableColumnFilter: false,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ row }) => (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Tooltip title="Edit">
              <IconButton
                color="primary"
                onClick={() => handleEditProduct(row.original)}
              >
                <BiSolidEditAlt size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                color="error"
                onClick={() => handleDelete(row.original.id)}
              >
                <RiDeleteBinLine size={16} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [dispatch, mediaUrl]
  );

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
      <Grid container spacing={1}>
        <Grid size={12}>
          <Paper
            elevation={0}
            sx={{ width: "100%", overflow: "hidden", backgroundColor: "#fff" }}
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
                  minWidth: "1200px",
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
                    Products
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
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddProduct}
                    >
                      Add Product
                    </Button>
                  </Box>
                </Box>
              )}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Product Form Dialog - Handles both Add and Edit */}
      <ProductFormDialog
        open={openProductDialog}
        onClose={handleCloseDialog}
        editData={editProductData}
      />
      
    </>
  );
};

export default Product;