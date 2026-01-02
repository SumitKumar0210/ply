import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    TextField,
    Button,
    Paper,
    Chip,
    MenuItem,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    CircularProgress,
    Typography,
    InputAdornment,
    Skeleton
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { getCustomerPaymentLog } from "../../../pages/Logs/slice/logSlice";

const CustomerPaymentLogTab = () => {
    const dispatch = useDispatch();
    const { data, loading, totalRecords } = useSelector((state) => state.log);

    const [filters, setFilters] = useState({
        search: '',
        paymentMode: '',
        startDate: null,
        endDate: null,
        page: 0,
        rowsPerPage: 10,
    });

    const [searchText, setSearchText] = useState('');

    // Fetch data whenever filters change
    useEffect(() => {
        fetchData();
    }, [filters]);

    const fetchData = () => {
        const payload = {
            search: filters.search || undefined,
            payment_mode: filters.paymentMode || undefined,
            start_date: filters.startDate ? dayjs(filters.startDate).format('YYYY-MM-DD') : undefined,
            end_date: filters.endDate ? dayjs(filters.endDate).format('YYYY-MM-DD') : undefined,
            page: filters.page + 1,
            per_page: filters.rowsPerPage,
        };

        dispatch(getCustomerPaymentLog(payload));
    };

    const handleSearch = () => {
        setFilters(prev => ({ ...prev, search: searchText, page: 0 }));
    };

    const handleReset = () => {
        setSearchText('');
        setFilters({
            search: '',
            paymentMode: '',
            startDate: null,
            endDate: null,
            page: 0,
            rowsPerPage: 10,
        });
    };

    const handleChangePage = (event, newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const handleChangeRowsPerPage = (event) => {
        setFilters(prev => ({ 
            ...prev, 
            rowsPerPage: parseInt(event.target.value, 10), 
            page: 0 
        }));
    };

    const getPaymentModeChip = (mode) => {
        const modeConfig = {
            cash: { color: 'success', label: 'Cash' },
            upi: { color: 'secondary', label: 'UPI' },
            cheque: { color: 'warning', label: 'Cheque' },
        };

        const config = modeConfig[mode?.toLowerCase()] || {
            color: 'default',
            label: mode || 'Unknown'
        };
        return <Chip label={config.label} color={config.color} size="small" />;
    };

    const formatCurrency = (amount) => {
        return `₹${parseFloat(amount || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const SkeletonRow = () => (
            <TableRow>
                <TableCell><Skeleton variant="text" width={60} /></TableCell>
                <TableCell>
                    <Skeleton variant="text" width={120} />
                    <Skeleton variant="text" width={100} />
                </TableCell>
                <TableCell><Skeleton variant="text" width={80} /></TableCell>
                <TableCell><Skeleton variant="text" width={80} /></TableCell>
                <TableCell><Skeleton variant="rounded" width={70} height={24} /></TableCell>
                <TableCell><Skeleton variant="text" width={100} /></TableCell>
                <TableCell><Skeleton variant="text" width={100} /></TableCell>
                <TableCell><Skeleton variant="text" width={100} /></TableCell>
                <TableCell><Skeleton variant="text" width={90} /></TableCell>
                <TableCell><Skeleton variant="text" width={120} /></TableCell>
            </TableRow>
        );

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box>
                {/* Filters Section */}
                <Paper elevation={0} sx={{ p: 2, mb: 0, bgcolor: 'grey.50' }}>
                    <Stack spacing={2}>
                        <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                            flexWrap="nowrap"
                        >
                            <TextField
                                size="small"
                                placeholder="Search by ID, Bill ID, Reference..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                sx={{ width: 320 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <TextField
                                select
                                size="small"
                                label="Payment Mode"
                                value={filters.paymentMode}
                                onChange={(e) => setFilters(prev => ({
                                    ...prev,
                                    paymentMode: e.target.value,
                                    page: 0
                                }))}
                                sx={{ width: 160 }}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="cash">Cash</MenuItem>
                                <MenuItem value="upi">UPI</MenuItem>
                                <MenuItem value="cheque">Cheque</MenuItem>
                            </TextField>

                            <DatePicker
                                label="Start Date"
                                value={filters.startDate}
                                onChange={(date) =>
                                    setFilters(prev => ({ ...prev, startDate: date, page: 0 }))
                                }
                                slotProps={{
                                    textField: {
                                        size: "small",
                                        sx: { width: 160 },
                                    },
                                }}
                            />

                            <DatePicker
                                label="End Date"
                                value={filters.endDate}
                                onChange={(date) =>
                                    setFilters(prev => ({ ...prev, endDate: date, page: 0 }))
                                }
                                slotProps={{
                                    textField: {
                                        size: "small",
                                        sx: { width: 160 },
                                    },
                                }}
                            />

                            <Button
                                variant="contained"
                                startIcon={<SearchIcon />}
                                sx={{ whiteSpace: "nowrap" }}
                                onClick={handleSearch}
                            >
                                Search
                            </Button>

                            <Button
                                variant="outlined"
                                startIcon={<RefreshIcon />}
                                sx={{ whiteSpace: "nowrap" }}
                                onClick={handleReset}
                            >
                                Reset
                            </Button>
                        </Stack>
                    </Stack>
                </Paper>

                {/* Table Section */}
                <TableContainer component={Paper} sx={{ px: 2 }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Invoice No.</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Customer Name</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Payment Mode</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Paid Amount</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Due Amount</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Reference No</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Added By</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Created At</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                // <TableRow>
                                //     <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                                //         <CircularProgress />
                                //     </TableCell>
                                // </TableRow>
                                 Array.from(new Array(filters.rowsPerPage)).map((_, index) => (
                                    <SkeletonRow key={index} />
                                ))
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">No data found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((row) => (
                                    <TableRow key={row.id} hover>
                                        <TableCell>{row.id}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>
                                            {row.bill?.invoice_no || '-'}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>
                                            {row.bill?.customer?.name || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {getPaymentModeChip(row.payment_mode)}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: 'success.main' }}>
                                            {formatCurrency(row.paid_amount)}
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                fontWeight: 600,
                                                color: parseFloat(row.due || 0) > 0 ? 'error.main' : 'success.main'
                                            }}
                                        >
                                            {formatCurrency(row.due)}
                                        </TableCell>
                                        <TableCell>
                                            {row.date ? dayjs(row.date).format('DD MMM YYYY') : '-'}
                                        </TableCell>
                                        <TableCell>{row.reference_no || '-'}</TableCell>
                                        <TableCell>{row.added_by || '-'}</TableCell>
                                        <TableCell>
                                            {row.created_at
                                                ? dayjs(row.created_at).format('DD MMM YYYY, HH:mm')
                                                : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    <TablePagination
                        component="div"
                        count={totalRecords}
                        page={filters.page}
                        onPageChange={handleChangePage}
                        rowsPerPage={filters.rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={[10, 20, 50, 100]}
                    />
                </TableContainer>
            </Box>
        </LocalizationProvider>
    );
};

export default CustomerPaymentLogTab;