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

import {
  fetchVendors,
  deleteVendor,
  statusUpdate,
} from "../slices/vendorSlice";
import VendorFormModal from "../../../components/Vendor/VendorFormModal";

const Vendor = () => {
  const dispatch = useDispatch();
  const tableContainerRef = useRef(null);

  const [openVendorDialog, setOpenVendorDialog] = useState(false);
  const [editVendorData, setEditVendorData] = useState(null);

  const { data: vendorData = [], loading } = useSelector((state) => state.vendor);

  useEffect(() => {
    dispatch(fetchVendors());
  }, [dispatch]);

  const handleAddVendor = () => {
    setEditVendorData(null);
    setOpenVendorDialog(true);
  };

  const handleEditVendor = (row) => {
    setEditVendorData(row);
    setOpenVendorDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenVendorDialog(false);
    setEditVendorData(null);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this vendor?")) {
      dispatch(deleteVendor(id));
    }
  };

  const handleStatusToggle = (row, newStatus) => {
    dispatch(statusUpdate({ ...row, status: newStatus }));
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Vendor Name",
        size: 150,
      },
      {
        accessorKey: "mobile",
        header: "Mobile",
        size: 120,
      },
      {
        accessorKey: "email",
        header: "Email",
        size: 200,
      },
      {
        accessorKey: "category_id",
        header: "Category",
        size: 130,
        Cell: ({ row }) => row.original.category?.name || "—",
      },
      {
        accessorKey: "gst",
        header: "GST",
        size: 150,
      },
      {
        accessorKey: "city",
        header: "City",
        size: 120,
      },
      {
        accessorKey: "state_id",
        header: "State",
        size: 120,
        Cell: ({ row }) => row.original.state?.name || "—",
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 100,
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) => (
          <CustomSwitch
            checked={!!row.original.status}
            onChange={(e) =>
              handleStatusToggle(row.original, e.target.checked ? 1 : 0)
            }
          />
        ),
      },
      {
        id: "actions",
        header: "Actions",
        size: 100,
        enableSorting: false,
        enableColumnFilter: false,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ row }) => (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Tooltip title="Edit">
              <IconButton
                color="primary"
                onClick={() => handleEditVendor(row.original)}
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
    [dispatch]
  );

  // Download CSV
  const downloadCSV = () => {
    const headers = [
      "Vendor Name",
      "Mobile",
      "Email",
      "Category",
      "GST",
      "City",
      "State",
    ];
    const rows = vendorData.map((row) =>
      [
        row.name || "",
        row.mobile || "",
        row.email || "",
        row.category?.name || "",
        row.gst || "",
        row.city || "",
        row.state?.name || "",
      ]
        .map((val) => `"${val}"`)
        .join(",")
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Vendor_data_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
              data={vendorData}
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
                    Vendors
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
                      onClick={handleAddVendor}
                    >
                      Add Vendor
                    </Button>
                  </Box>
                </Box>
              )}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Vendor Form Dialog - Handles both Add and Edit */}
      <VendorFormModal
        open={openVendorDialog}
        onClose={handleCloseDialog}
        editData={editVendorData}
      />
    </>
  );
};

export default Vendor;