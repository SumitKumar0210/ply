import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Typography,
    Grid,
    Paper,
    Box,
    Button,
    IconButton,
    TextField,
    Tooltip,
} from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import CloseIcon from "@mui/icons-material/Close";
import { styled } from "@mui/material/styles";
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
import { Formik, Form } from "formik";
import * as Yup from "yup";
import CustomSwitch from "../../../components/CustomSwitch/CustomSwitch";

import { addTaxSlab, updateTaxSlab, deleteTaxSlab, statusUpdate } from "../slices/taxSlabSlice";
import { useDispatch } from "react-redux";
import api from "../../../api";

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

const TaxSlab = () => {
    const dispatch = useDispatch();

    //  Validation Schema
    const validationSchema = Yup.object({
        percentage: Yup.number()
            .moreThan(0, "Percentage must be greater than 0")
            .max(100, "Percentage cannot be more than 100")
            .required("Percentage is required"),
    });

    const tableContainerRef = useRef(null);
    const [open, setOpen] = useState(false);

    const handleClickOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const [tableData, setTableData] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });
    const [loading, setLoading] = useState(false);

    //  Fetch data function that uses current pagination state
    const fetchData = async (customPagination = null) => {
        setLoading(true);
        const currentPagination = customPagination || pagination;
        const { pageIndex, pageSize } = currentPagination;
        
        try {
            const res = await api.get(
                `admin/tax-slab/get-data?page=${pageIndex + 1}&per_page=${pageSize}`
            );
            setTableData(res.data.data || []);
            setTotalRows(res.data.total || 0);
        } catch (err) {
            console.error("Fetch error:", err);
            setTableData([]);
            setTotalRows(0);
        } finally {
            setLoading(false);
        }
    };

    //  Fetch when pagination changes
    useEffect(() => {
        fetchData();
    }, [pagination.pageIndex, pagination.pageSize]);

    //  Add handler - goes to first page after adding
    const handleAdd = async (value, resetForm) => {
        const res = await dispatch(addTaxSlab(value));
        if (res.error) return;
        
        // Reset to first page after adding
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
        resetForm();
        handleClose();
    };

    //  Delete handler - stays on current page
    const handleDelete = async (id) => {
        await dispatch(deleteTaxSlab(id));
        
        // Check if we need to go back a page (if we deleted the last item on current page)
        const itemsOnCurrentPage = tableData.length;
        if (itemsOnCurrentPage === 1 && pagination.pageIndex > 0) {
            // If this is the last item on the page and not the first page, go back one page
            setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex - 1 }));
        } else {
            // Otherwise, refresh current page
            await fetchData(pagination);
        }
    };

    const [editOpen, setEditOpen] = useState(false);
    const [editData, setEditData] = useState(null);

    // open modal with row data
    const handleUpdate = (row) => {
        setEditData(row);
        setEditOpen(true);
    };

    // close modal
    const handleEditClose = () => {
        setEditOpen(false);
        setEditData(null);
    };

    //  Update handler - stays on current page after update
    const handleEditSubmit = async (values, resetForm) => {
        try {
            const res = await dispatch(updateTaxSlab({ id: editData.id, ...values }));
            if (res.error) {
                console.log("Update failed:", res.payload);
                return;
            }
            
            // Stay on current page after update
            await fetchData(pagination);
            resetForm();
            handleEditClose();
        } catch (err) {
            console.error("Update failed:", err);
        }
    };

    //  Status update handler - stays on current page
    const handleStatusChange = async (row, newStatus) => {
        await dispatch(statusUpdate({ ...row, status: newStatus }));
        
        // Stay on current page after status change
        await fetchData(pagination);
    };

    const columns = useMemo(
        () => [
            { accessorKey: "percentage", header: "Percentage (%)" },
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
                            handleStatusChange(row.original, newStatus);
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
                            <IconButton color="primary" onClick={() => handleUpdate(row.original)}>
                                <BiSolidEditAlt size={16} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton color="error" onClick={() => handleDelete(row.original.id)}>
                                <RiDeleteBinLine size={16} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                ),
            },
        ],
        [pagination] // Add pagination as dependency
    );

    //  Tell MRT which field is the unique row id
    const getRowId = (originalRow) => originalRow.id;

    //  Download CSV
    const downloadCSV = () => {
        if (!tableData.length) return;
        const headers = columns
            .filter((col) => col.accessorKey)
            .map((col) => col.header);
        const rows = tableData.map((row) =>
            columns
                .filter((col) => col.accessorKey)
                .map((col) => `"${row[col.accessorKey] ?? ""}"`)
                .join(",")
        );
        const csvContent = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "tax_slab_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    //  Better Print
    const handlePrint = () => {
        if (!tableContainerRef.current) return;
        const printContents = tableContainerRef.current.innerHTML;
        const win = window.open("", "", "width=900,height=650");
        win.document.write(printContents);
        win.document.close();
        win.print();
    };

    return (
        <ErrorBoundary>
            <Grid container spacing={2}>
                <Grid size={12}>
                    <Paper
                        elevation={0}
                        sx={{ width: "100%", overflow: "hidden", backgroundColor: "#fff" }}
                        ref={tableContainerRef}
                    >
                        <MaterialReactTable
                            columns={columns}
                            data={tableData}
                            getRowId={getRowId}
                            manualPagination
                            rowCount={totalRows}
                            state={{
                                pagination: pagination,
                                isLoading: loading,
                            }}
                            onPaginationChange={setPagination}
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
                                sx: { width: "100%", backgroundColor: "#fff" },
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
                                    }}
                                >
                                    <Typography variant="h6" fontWeight={400}>
                                        Tax Slab
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

                                        <Button
                                            variant="contained"
                                            startIcon={<AddIcon />}
                                            onClick={handleClickOpen}
                                        >
                                            Add Tax Slab
                                        </Button>
                                    </Box>
                                </Box>
                            )}
                        />
                    </Paper>
                </Grid>
            </Grid>

            {/* Add Modal */}
            <BootstrapDialog onClose={handleClose} open={open} fullWidth maxWidth="xs">
                <DialogTitle sx={{ m: 0, p: 1.5 }}>Add Tax Slab</DialogTitle>
                <IconButton
                    aria-label="close"
                    onClick={handleClose}
                    sx={(theme) => ({
                        position: "absolute",
                        right: 8,
                        top: 8,
                        color: theme.palette.grey[500],
                    })}
                >
                    <CloseIcon />
                </IconButton>

                <Formik
                    initialValues={{ percentage: "" }}
                    validationSchema={validationSchema}
                    onSubmit={async (values, { resetForm }) => {
                        await handleAdd(values, resetForm);
                    }}
                >
                    {({ values, errors, touched, handleChange }) => (
                        <Form>
                            <DialogContent dividers>
                                <TextField
                                    fullWidth
                                    id="percentage"
                                    name="percentage"
                                    type="number"
                                    label="Percentage"
                                    variant="standard"
                                    value={values.percentage}
                                    onChange={handleChange}
                                    error={touched.percentage && Boolean(errors.percentage)}
                                    helperText={touched.percentage && errors.percentage}
                                    sx={{ mb: 3 }}
                                    inputProps={{ min: 0, max: 100 }}
                                />
                            </DialogContent>
                            <DialogActions sx={{ gap: 1, mb: 1 }}>
                                <Button variant="outlined" color="error" onClick={handleClose}>
                                    Close
                                </Button>
                                <Button type="submit" variant="contained" color="primary">
                                    Submit
                                </Button>
                            </DialogActions>
                        </Form>
                    )}
                </Formik>
            </BootstrapDialog>

            {/* Edit Modal */}
            <BootstrapDialog onClose={handleEditClose} open={editOpen} fullWidth maxWidth="xs">
                <DialogTitle sx={{ m: 0, p: 1.5 }}>Edit Tax Slab</DialogTitle>
                <IconButton
                    aria-label="close"
                    onClick={handleEditClose}
                    sx={(theme) => ({
                        position: "absolute",
                        right: 8,
                        top: 8,
                        color: theme.palette.grey[500],
                    })}
                >
                    <CloseIcon />
                </IconButton>

                <Formik
                    key={editData?.id}
                    initialValues={{ percentage: editData?.percentage || "" }}
                    validationSchema={validationSchema}
                    onSubmit={(values, { resetForm }) => handleEditSubmit(values, resetForm)}
                    enableReinitialize
                >
                    {({ values, errors, touched, handleChange }) => (
                        <Form>
                            <DialogContent dividers>
                                <TextField
                                    fullWidth
                                    id="percentage"
                                    name="percentage"
                                    type="number"
                                    label="Percentage"
                                    variant="standard"
                                    value={values.percentage}
                                    onChange={handleChange}
                                    error={touched.percentage && Boolean(errors.percentage)}
                                    helperText={touched.percentage && errors.percentage}
                                    sx={{ mb: 3 }}
                                    inputProps={{ min: 0, max: 100 }}
                                />
                            </DialogContent>
                            <DialogActions sx={{ gap: 1, mb: 1 }}>
                                <Button variant="outlined" color="error" onClick={handleEditClose}>
                                    Close
                                </Button>
                                <Button type="submit" variant="contained">
                                    Save Changes
                                </Button>
                            </DialogActions>
                        </Form>
                    )}
                </Formik>
            </BootstrapDialog>
        </ErrorBoundary>
    );
};

export default TaxSlab;