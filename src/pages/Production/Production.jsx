import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
    Container,
    Card,
    CardContent,
    Chip,
    Typography,
    Box,
    Grid,
    useTheme,
    useMediaQuery,
    IconButton,
    Tooltip,
    AvatarGroup,
    Avatar,
    Dialog,
    DialogContent,
    DialogContentText,
    DialogTitle,
    DialogActions,
    TextareaAutosize,
    Button,
    Menu,
    MenuItem,
    Divider,
    Drawer,
    TextField,
    Checkbox,
    Autocomplete,
    Radio,
} from "@mui/material";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";
import { Link } from "react-router-dom";
import { IoMdAdd } from "react-icons/io";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { FiMoreVertical } from "react-icons/fi";
import CloseIcon from "@mui/icons-material/Close";
import { TbTruckDelivery } from "react-icons/tb";
import { ImAttachment } from "react-icons/im";
import Profile from "../../assets/images/profile.jpg";
import { styled } from "@mui/material/styles";
import MessageTimeline from "../../components/TimelineHistory/Timeline";
import { AiOutlineFilePdf } from "react-icons/ai";
import { RiDeleteBinLine } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import NavigationMenu from "../../components/Production/Navigation";
import DepartmentFormDialog from "../../components/Department/DepartmentFormDialog";
import { addDepartment } from "../settings/slices/departmentSlice";
import { fetchActiveDepartments } from "../settings/slices/departmentSlice";

// ---------- Styled Dialog ----------
const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    "& .MuiDialogContent-root": { padding: theme.spacing(2), paddingBottom: theme.spacing(4) },
    "& .MuiDialogActions-root": { padding: theme.spacing(1) },
}));

function BootstrapDialogTitle({ children, onClose, ...other }) {
    return (
        <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
            {children}
            {onClose && (
                <IconButton aria-label="close" onClick={onClose} sx={{ position: "absolute", right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}>
                    <CloseIcon />
                </IconButton>
            )}
        </DialogTitle>
    );
}

const VisuallyHiddenInput = styled("input")({
    clip: "rect(0 0 0 0)",
    clipPath: "inset(50%)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    bottom: 0,
    left: 0,
    whiteSpace: "nowrap",
    width: 1,
});

// ---------- Reusable hook for submenu ----------
function useSubmenu() {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const openAt = useCallback((target) => setAnchorEl(target), []);
    const close = useCallback(() => setAnchorEl(null), []);
    return { anchorEl, open, openAt, close, setAnchorEl };
}

// ---------- Smaller components (memoized) ----------
const SwitchSubmenu = React.memo(function SwitchSubmenu({ submenu, onSelect }) {
    const options = useMemo(() => ["Open", "Under Process", "Done"], []);
    return (
        <Menu
            anchorEl={submenu.anchorEl}
            open={submenu.open}
            onClose={submenu.close}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            disableAutoFocusItem
            MenuListProps={{ onClick: (e) => e.stopPropagation() }}
            sx={{ zIndex: 1400, marginLeft: "2px" }}>
            {options.map((opt) => (
                <MenuItem
                    key={opt}
                    onClick={() => {
                        onSelect(opt);
                        setTimeout(() => submenu.close(), 80);
                    }}
                >
                    {opt}
                </MenuItem>
            ))}
        </Menu>
    );
});

const SupervisorSubmenu = React.memo(function SupervisorSubmenu({ submenu, supervisors, selected, toggle }) {
    return (
        <Menu
            anchorEl={submenu.anchorEl}
            open={submenu.open}
            onClose={submenu.close}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            disableAutoFocusItem
            MenuListProps={{ onClick: (e) => e.stopPropagation() }}
            sx={{ zIndex: 1400, marginLeft: "2px" }}
        >
            {supervisors.map((s) => (
                <MenuItem key={s} disableRipple onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                        checked={selected.includes(s)}
                        onChange={() => {
                            toggle(s);
                            setTimeout(() => submenu.close(), 90);
                        }}
                        inputProps={{ "aria-label": `${s}-checkbox` }}
                        sx={{
                            padding: 0,
                            paddingRight: 1,
                        }}
                    />
                    {s}
                </MenuItem>
            ))}
        </Menu>
    );
});

const PrioritySubmenu = React.memo(function PrioritySubmenu({ submenu, value, setValue }) {
    const levels = useMemo(() => ["High", "Medium", "Low"], []);
    return (
        <Menu
            anchorEl={submenu.anchorEl}
            open={submenu.open}
            onClose={submenu.close}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            disableAutoFocusItem
            MenuListProps={{ onClick: (e) => e.stopPropagation() }}
            sx={{ zIndex: 1400, marginLeft: "2px" }}
        >
            {levels.map((lvl) => (
                <MenuItem key={lvl} disableRipple onClick={(e) => e.stopPropagation()}>
                    <Radio
                        checked={value === lvl}
                        onChange={() => {
                            setValue(lvl);
                            setTimeout(() => submenu.close(), 100);
                        }}
                        inputProps={{ "aria-label": `${lvl}-radio` }}
                        sx={{
                            padding: 0,
                            paddingRight: 1,
                        }}
                    />
                    {lvl}
                </MenuItem>
            ))}
        </Menu>
    );
});

const itemCodes = [
    { code: "Code35", name: "Sample Item Name" },
    { code: "Code12", name: "Blue Marker" },
    { code: "Code88", name: "White Board" },
    { code: "Code50", name: "Packing Tape" },
];

const empCodes = [
    { code: "Emp35", name: "Ramesh" },
    { code: "Emp12", name: "Suresh" },
    { code: "Emp88", name: "Vishal" },
    { code: "Emp50", name: "Vinay" },
];

// ---------- Main optimized component ----------
export default function Production() {
    const dispatch = useDispatch();
    const { activeBatch } = useSelector((state) => state.productionChain);
    const { data: departments = [] } = useSelector((state) => state.department);
    // console.log("Active Batch:", activeBatch);
    // console.log("Department:", departments);

    useEffect(() => {
        fetchDepartments();
    }, [])

    const fetchDepartments = () => {
        dispatch(fetchActiveDepartments());
    }

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const [selectedItem, setSelectedItem] = useState(null);
    const [openAdd, setOpenAdd] = useState(false);
    const [open, setOpen] = useState(false); // Fixed: Added missing open state

    // Main menu anchor
    const [anchorEl, setAnchorEl] = useState(null);
    const menuOpen = Boolean(anchorEl);
    const openMenu = useCallback((e) => setAnchorEl(e.currentTarget), []);
    const closeMenu = useCallback(() => setAnchorEl(null), []);

    // Submenus using hook
    const switchSub = useSubmenu();
    const supSub = useSubmenu();
    const prioSub = useSubmenu();

    // Data & selections
    const supervisors = useMemo(() => ["Satyam", "Amit", "Vikash", "Pawan"], []);
    const [selectedSupervisors, setSelectedSupervisors] = useState(["Satyam"]);
    const [priority, setPriority] = useState("High");

    // Handlers
    const closeAllSubmenus = useCallback(() => {
        switchSub.close();
        supSub.close();
        prioSub.close();
    }, [switchSub, supSub, prioSub]);

    const handleSupervisorToggle = useCallback((name) => {
        setSelectedSupervisors((prev) => (prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]));
    }, []);

    const handleSwitchSelect = useCallback((value) => {
        // implement selection logic if needed
    }, []);

    const handlePrioritySet = useCallback((lvl) => setPriority(lvl), []);

    const messages = useMemo(() => [
        { time: "10:00 AM", text: "User submitted the form", sender: "System" },
        { time: "10:02 AM", text: "Email sent to customer", sender: "System" },
        { time: "10:05 AM", text: "Admin approved the request", sender: "Admin" },
    ], []);

    const avatars = useMemo(() => (
        <AvatarGroup spacing={15}>
            <Avatar src={Profile} sx={{ width: 26, height: 26 }} />
            <Avatar src={Profile} sx={{ width: 26, height: 26 }} />
        </AvatarGroup>
    ), []);

    const [openDrawer, setOpenDrawer] = useState(false);
    const handleOpenDrawer = () => setOpenDrawer(true);
    const handleCloseDrawer = () => setOpenDrawer(false);

    const [openLogTimeDrawer, setOpenLogTimeDrawer] = useState(false);
    const handleOpenLogTimeDrawer = () => setOpenLogTimeDrawer(true);
    const handleCloseLogTimeDrawer = () => setOpenLogTimeDrawer(false);

    const [openDelete, setOpenDelete] = useState(false);
    const [date, setDate] = useState(null);
    const [time, setTime] = useState(null);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleAdd = async (values, resetForm) => {
        const res = await dispatch(addDepartment(values));
        if (!res.error) {
            resetForm();
            handleClose();
            fetchDepartments();
        }
    };

    return (
        <>
            <Container disableGutters sx={{ maxWidth: "100% !important", overflowX: "hidden", marginBottom: 3 }}>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="h6">Production</Typography>
                </Box>

                <Box
                    sx={{
                        display: "flex",
                        flexDirection: isMobile ? "column" : "row",
                        height: isMobile ? "auto !important" : "calc(100vh - 220px)",
                        gap: 2,
                        boxSizing: "border-box",
                        overflow: "hidden",
                    }}
                >
                    <Box
                        sx={{
                            flex: isMobile ? "0 0 auto" : "0 0 240px",
                            height: isMobile ? "auto !important" : "100%",
                            boxSizing: "border-box",
                        }}
                    >
                        <Card
                            variant="outlined"
                            sx={{
                                height: isMobile ? "auto !important" : "100%",
                                overflowY: isMobile ? "visible !important" : "auto",
                            }}
                        >
                            <CardContent sx={{ p: 2 }}>
                                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                                    Navigation
                                </Typography>
                                <NavigationMenu />
                            </CardContent>
                        </Card>
                    </Box>

                    <Box
                        sx={{
                            flex: 1,
                            height: isMobile ? "auto !important" : "100%",
                            boxSizing: "border-box",
                        }}
                    >
                        {activeBatch ? (
                            <Card variant="outlined" sx={{ backgroundColor: "transparent !important", boxShadow: "none", border: "none" }}>
                                <CardContent sx={{ p: 1 }}>
                                    {/* Display Batch Info */}
                                    <Box sx={{ mb: 2, p: 2, backgroundColor: "white", borderRadius: 1 }}>
                                        <Typography variant="h6" fontWeight={600}>
                                            Batch: {activeBatch.batch_no}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Quotation ID: {activeBatch.quotation_id}
                                        </Typography>
                                        {activeBatch.priority && (
                                            <Chip
                                                label={`Priority: ${activeBatch.priority}`}
                                                size="small"
                                                sx={{ mt: 1 }}
                                                color={
                                                    activeBatch.priority === "High" ? "error" :
                                                        activeBatch.priority === "Medium" ? "warning" :
                                                            "success"
                                                }
                                            />
                                        )}
                                    </Box>

                                    <Grid size={12}>
                                        <Box sx={{ display: "flex", gap: 3 }}>

                                            {Array.isArray(departments) && departments.length > 0 && (
                                                [...departments]
                                                    .sort((a, b) => a.sequence - b.sequence)
                                                    .map((dept, index) => (
                                                        <Box
                                                            key={dept.id}
                                                            sx={{
                                                                flex: 1,
                                                                backgroundColor: "white",
                                                                p: 2,
                                                                borderRadius: 1,
                                                                mb: 2
                                                            }}
                                                            className="production-card-wrapper"
                                                        >
                                                            {/* Department Badge With Color */}
                                                            <Chip
                                                                size="small"
                                                                label={dept.name}
                                                                sx={{
                                                                    borderRadius: 1,
                                                                    backgroundColor: dept.color || "grey.500",
                                                                    color: "#fff"
                                                                }}
                                                            />

                                                            <Card
                                                                sx={{
                                                                    border: "1px solid #ddd !important",
                                                                    borderRadius: 1,
                                                                    padding: "5px 8px",
                                                                    marginTop: 1
                                                                }}
                                                            >
                                                                <CardContent
                                                                    sx={{ padding: 0, paddingBottom: "0 !important" }}
                                                                    onClick={() => setOpenAdd(true)}
                                                                >
                                                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                        <h5 style={{ margin: 0 }}>{dept.item_code || "Item Code"}</h5>

                                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                                            <Box component="h5" sx={{ m: 0 }}>
                                                                                {dept.group || "Group"}
                                                                            </Box>

                                                                            <Tooltip title="Action" arrow>
                                                                                <IconButton
                                                                                    color="primary"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        openMenu(e);
                                                                                        closeAllSubmenus();
                                                                                    }}
                                                                                    size="small"
                                                                                    aria-controls={menuOpen ? "production-menu" : undefined}
                                                                                    aria-haspopup="true"
                                                                                    aria-expanded={menuOpen ? "true" : undefined}
                                                                                    sx={{ ml: 2, zIndex: 999 }}
                                                                                >
                                                                                    <FiMoreVertical size={16} />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        </Box>
                                                                    </Box>

                                                                    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                                                                        {avatars}
                                                                    </Box>
                                                                </CardContent>
                                                            </Card>
                                                        </Box>
                                                    ))
                                            )}


                                            {/* <Box sx={{ flex: 1, backgroundColor: "white", p: 2, borderRadius: 1 }} className="production-card-wrapper">
                                                <Chip size="small" label="Under Production" sx={{ borderRadius: 1, backgroundColor: "warning.light", color: "#fff" }} />
                                            </Box>

                                            <Box sx={{ flex: 1, backgroundColor: "white", p: 2, borderRadius: 1 }} className="production-card-wrapper">
                                                <Chip size="small" label="Done" sx={{ borderRadius: 1, backgroundColor: "success.light", color: "#fff" }} />
                                            </Box> */}

                                            <Box>
                                                <Tooltip title="Add Card" arrow>
                                                    <IconButton
                                                        onClick={() => handleOpen()}
                                                        sx={{ backgroundColor: "grey.300", color: "grey.700", borderRadius: 1, p: 1 }}
                                                    >
                                                        <IoMdAdd size={24} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Box>
                                    </Grid>
                                </CardContent>
                            </Card>
                        ) : (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    height: "100%",
                                    backgroundColor: "white",
                                    borderRadius: 1,
                                    p: 3
                                }}
                            >
                                <Typography variant="h6" color="text.secondary">
                                    Please select a batch from the navigation menu
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Container>

            {/* Rest of your modals and drawers remain the same */}
            {/* Details Modal */}
            <BootstrapDialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="md">
                <BootstrapDialogTitle onClose={() => setOpenAdd(false)}>
                    Order
                </BootstrapDialogTitle>
                <DialogContent dividers>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Box component="h4" sx={{ fontWeight: 500, m: 0 }}>Item Code</Box>
                        <Box component="h4" sx={{ fontWeight: 500, m: 0 }}>Group</Box>
                        <Button
                            variant="outlined"
                            startIcon={<TbTruckDelivery />}
                            color="warning"
                            component={Link}
                            to="#" // your route path
                        >
                            Ready For Delivery
                        </Button>
                    </Box>
                    <Grid container spacing={2} sx={{ marginTop: 2 }}>
                        <Grid size={6} className="production-status-details">
                            <table className="">
                                <tbody>
                                    <tr>
                                        <td className="title"><strong>Switch To:</strong></td>
                                        <td>Done</td>
                                    </tr>
                                    <tr>
                                        <td className="title"><strong>Supervisor:</strong></td>
                                        <td>Shatyam</td>
                                    </tr>
                                    <tr>
                                        <td className="title"><strong>Priority:</strong></td>
                                        <td>High</td>
                                    </tr>
                                    <tr>
                                        <td className="title"><strong>Log Time:</strong></td>
                                        <td>8 hrs 17/11/2025</td>
                                    </tr>
                                    <tr>
                                        <td className="title"><strong>Naration:</strong></td>
                                        <td>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. </td>
                                    </tr>
                                </tbody>
                            </table>
                        </Grid>

                        <Grid size={6} style={{ textAlign: "right" }}>
                            <img
                                src={Profile}
                                alt="profile"
                                style={{ width: 300, height: "auto", borderRadius: 3 }}
                            />
                        </Grid>
                    </Grid>
                    <Grid container spacing={2} sx={{ marginTop: 2 }}>
                        <Grid size={12} className="production-status-details">
                            <table className="">
                                <tbody>
                                    <tr>
                                        <td className="title"><strong>Tentative:</strong></td>
                                        <td>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    // justifyContent: "space-between",
                                                    flexWrap: "wrap",
                                                    columnGap: 2,
                                                    border: "1px solid #ddd",
                                                    padding: 1,
                                                    borderRadius: "4px"
                                                }}
                                            >
                                                <Typography>Sample 1</Typography>
                                                <Typography>Sample 1</Typography>
                                                <Typography>Sample 1</Typography>
                                                <Typography>Sample 1</Typography>
                                                <Typography>Sample 1</Typography>
                                                <Typography>Sample 1</Typography>
                                                <Typography>Sample 1</Typography>
                                                <Typography>Sample 1</Typography>
                                                <Typography>Sample 1</Typography>
                                                <Typography>Sample 1</Typography>
                                                <Typography>Sample 1</Typography>
                                                <Typography>Sample 1</Typography>
                                                <Typography>Sample 1</Typography>
                                                <Typography>Sample 1</Typography>
                                                <Typography>Sample 1</Typography>
                                            </Box>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="title"><strong>Files:</strong></td>
                                        <td>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    // justifyContent: "space-between",
                                                    flexWrap: "wrap",
                                                    columnGap: 2,
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        border: "1px solid #ccc",
                                                        padding: "2px 8px",
                                                        fontSize: "14px",
                                                        borderRadius: "4px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        height: "36px"
                                                    }}
                                                >
                                                    <AiOutlineFilePdf size={16} style={{ marginRight: 5 }} /> Sample 1
                                                </Typography>
                                                <Typography
                                                    sx={{
                                                        border: "1px solid #ccc",
                                                        padding: "2px 8px",
                                                        fontSize: "14px",
                                                        borderRadius: "4px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        height: "36px"
                                                    }}
                                                >
                                                    <AiOutlineFilePdf size={16} style={{ marginRight: 5 }} /> Sample 1
                                                </Typography>
                                                <Typography
                                                    sx={{
                                                        border: "1px solid #ccc",
                                                        padding: "2px 8px",
                                                        fontSize: "14px",
                                                        borderRadius: "4px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        height: "36px"
                                                    }}
                                                >
                                                    <AiOutlineFilePdf size={16} style={{ marginRight: 5 }} /> Sample 1 Sample 1Sample 1
                                                </Typography>
                                                <Typography
                                                    sx={{
                                                        border: "1px solid #ccc",
                                                        padding: "2px 8px",
                                                        fontSize: "14px",
                                                        borderRadius: "4px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        height: "36px"
                                                    }}
                                                >
                                                    <AiOutlineFilePdf size={16} style={{ marginRight: 5 }} /> Sample 1
                                                </Typography>
                                                {/* <Typography 
                                                             sx={{
                                                                border: "1px solid #ccc",
                                                                padding: "2px 8px",
                                                                fontSize: "14px",
                                                                borderRadius: "4px",
                                                                display: "flex",
                                                                alignItems:"center",
                                                                height:"36px"
                                                            }}
                                                        >
                                                           <AiOutlineFilePdf size={16} style={{ marginRight: 5 }} /> Sample 1
                                                        </Typography> */}
                                                <Button
                                                    component="label"
                                                    role={undefined}
                                                    variant="outlined"
                                                    tabIndex={-1}
                                                    startIcon={<ImAttachment />}
                                                    sx={{
                                                        mt: 0,
                                                        fontWeight: 500,
                                                        color: "grey.600",
                                                        borderColor: "grey.400",
                                                        "&:hover": {
                                                            borderColor: "grey.500",
                                                            backgroundColor: "grey.500",
                                                            color: "#fff"
                                                        }
                                                    }}
                                                >
                                                    Upload files
                                                    <VisuallyHiddenInput
                                                        type="file"
                                                        onChange={(event) => console.log(event.target.files)}
                                                        multiple
                                                    />
                                                </Button>
                                            </Box>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="title"><strong>Message:</strong></td>
                                        <td>
                                            <TextareaAutosize
                                                maxRows={4}
                                                aria-label="maximum height"
                                                placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                                                style={{
                                                    width: "100%",
                                                    border: "1px solid #ddd",    // Custom border color
                                                    borderRadius: "4px",            // Optional rounded corners
                                                    padding: "10px",                // Inner padding
                                                    outline: "none",
                                                }}
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </Grid>
                        <Grid size={12}>
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "end",
                                    marginTop: 0
                                }}
                            >
                                <Button type="submit" variant="contained" color="primary" sx={{ marginTop: 0 }}>Send</Button>
                            </Box>
                        </Grid>
                        <Grid size={12}>
                            <Typography>Messages:</Typography>
                            <MessageTimeline messages={messages} />
                        </Grid>
                    </Grid>
                </DialogContent>

            </BootstrapDialog>

            {/* Main Action Menu */}
            {/* Main Action Menu */}
            <Menu
                id="production-menu"
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={() => {
                    closeMenu();
                    closeAllSubmenus();
                }}
                slotProps={{
                    paper: {
                        elevation: 0,
                        sx: {
                            overflow: "visible",
                            filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                            mt: 1.5,
                            "&::before": {
                                content: '""',
                                display: "block",
                                position: "absolute",
                                top: 0,
                                right: 14,
                                width: 10,
                                height: 10,
                                bgcolor: "background.paper",
                                transform: "translateY(-50%) rotate(45deg)",
                                zIndex: 0,
                            },
                        },
                    },
                }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            >
                {/* Switch To - opens switchSub */}
                <MenuItem
                    onClick={(e) => {
                        e.stopPropagation();
                        closeAllSubmenus();
                        switchSub.openAt(e.currentTarget);
                    }}
                >
                    <Box display="flex">
                        <Typography minWidth={90}>Switch To:</Typography>
                        <Typography fontWeight={600}>Done</Typography>
                    </Box>
                </MenuItem>

                <SwitchSubmenu submenu={switchSub} onSelect={handleSwitchSelect} />

                {/* Supervisor */}
                <MenuItem onClick={(e) => { e.stopPropagation(); closeAllSubmenus(); supSub.openAt(e.currentTarget); }}>
                    <Box display="flex" alignItems="center">
                        <Typography minWidth={90}>Supervisor:</Typography>
                        <Typography fontWeight={500}>{selectedSupervisors.join(", ")}</Typography>
                    </Box>
                </MenuItem>

                <SupervisorSubmenu submenu={supSub} supervisors={supervisors} selected={selectedSupervisors} toggle={handleSupervisorToggle} />

                {/* Priority */}
                <MenuItem onClick={(e) => { e.stopPropagation(); closeAllSubmenus(); prioSub.openAt(e.currentTarget); }}>
                    <Box display="flex" alignItems="center">
                        <Typography minWidth={90}>Priority:</Typography>
                        <Typography fontWeight={500}>{priority}</Typography>
                    </Box>
                </MenuItem>

                <PrioritySubmenu submenu={prioSub} value={priority} setValue={handlePrioritySet} />

                <MenuItem
                    onClick={() => {
                        closeAllSubmenus();  // close submenus
                        closeMenu();         // close main menu  ✅ REQUIRED
                        handleOpenLogTimeDrawer();  // open the drawer
                    }}
                >
                    <Box display="flex" alignItems="center">
                        <Typography minWidth={90}>Log Time:</Typography>
                        <Typography fontWeight={500}>8 hrs</Typography>
                    </Box>
                </MenuItem>

                <Divider />

                <MenuItem
                    onClick={() => {
                        closeAllSubmenus();  // close submenus
                        closeMenu();         // close main menu  ✅ REQUIRED
                        handleOpenDrawer();  // open the drawer
                    }}
                >
                    <Typography textAlign="center" marginLeft="auto" marginRight="auto" fontWeight={500}>Request Stock</Typography>
                </MenuItem>
            </Menu>
            {/* Log Time drawer start */}
            <Drawer
                anchor="right"
                open={openLogTimeDrawer}
                onClose={handleCloseLogTimeDrawer}
                sx={{
                    zIndex: 9999,
                }}
            >
                <Box sx={{ width: 600, p: 2 }}>
                    <Typography variant="h6" fontWeight={500} fontSize={"18px"} marginBottom={"6px"}>
                        Log Time
                    </Typography>
                    <Divider />

                    {/* Add form elements here */}
                    <Box
                        mt={2}
                        display={"flex"}
                        justifyContent={"space-between"}
                        alignItems={"center"}
                    >
                        <Typography variant="h6" >Item Code</Typography>
                        <Typography variant="h6" >Group</Typography>
                    </Box>

                    <Box
                        display={"flex"}
                        justifyContent={"space-between"}
                        alignItems={"center"}
                        paddingTop={"15px"}
                        paddingBottom={"10px"}
                        gap={"10px"}
                    >
                        <Autocomplete
                            options={empCodes}
                            getOptionLabel={(option) => `${option.code} (${option.name})`}
                            onChange={(event, newValue) => setSelectedItem(newValue)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Emp Code"
                                    placeholder="Search Emp code"
                                    size="small"
                                />
                            )}
                            sx={{ width: 300 }}
                        />
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="Date"
                                value={date}
                                onChange={setDate}
                                slotProps={{
                                    textField: {

                                        size: "small",
                                    },
                                    popper: {
                                        sx: {
                                            zIndex: 999999,
                                        },
                                    },
                                }}
                            />

                            <TimePicker
                                label="Time"
                                value={time}
                                onChange={setTime}
                                slotProps={{
                                    textField: {

                                        size: "small",
                                    },
                                    popper: {
                                        sx: {
                                            zIndex: 999999,
                                        },
                                    },
                                }}
                            />
                        </LocalizationProvider>
                        <Button variant="contained" sx={{ mt: 0 }}>Add</Button>
                    </Box>
                    <Box>
                        <TableContainer sx={{ mt: 4 }}>
                            <Table sx={{ minWidth: "100%", overflow: "hidden" }} dense table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>
                                            Emp ID <br />(Emp Name)
                                        </TableCell>

                                        <TableCell>
                                            Date <br />(Hrs)
                                        </TableCell>

                                        <TableCell>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow>
                                        <TableCell>
                                            Emp35 <br />(Sample Name)
                                        </TableCell>
                                        <TableCell>
                                            12/04/2026 <br />(4h)
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title="Delete" arrow>
                                                <IconButton
                                                    aria-label="delete"
                                                    color="error"
                                                    onClick={() => setOpenDelete(true)}
                                                >
                                                    <RiDeleteBinLine size={16} />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>
                                            Emp35 <br />(Sample Name)
                                        </TableCell>
                                        <TableCell>
                                            12/04/2026 <br />(4h)
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title="Delete" arrow>
                                                <IconButton
                                                    aria-label="delete"
                                                    color="error"
                                                    onClick={() => setOpenDelete(true)}
                                                >
                                                    <RiDeleteBinLine size={16} />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>

                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

                    <Box mt={2} sx={{ display: "flex", justifyContent: "end" }}>
                        <Button variant="contained">
                            Update
                        </Button>
                    </Box>
                </Box>
            </Drawer>
            {/* Log Time drawer end */}
            {/* Request stock drawer start */}
            <Drawer
                anchor="right"
                open={openDrawer}
                onClose={handleCloseDrawer}
                sx={{
                    zIndex: 9999,
                }}
            >
                <Box sx={{ width: 450, p: 2 }}>
                    <Typography variant="h6" fontWeight={500} fontSize={"18px"} marginBottom={"6px"}>
                        Request Stock
                    </Typography>
                    <Divider />

                    {/* Add form elements here */}
                    <Box
                        mt={2}
                        display={"flex"}
                        justifyContent={"space-between"}
                        alignItems={"center"}
                    >
                        <Typography variant="h6" >Item Code</Typography>
                        <Typography variant="h6" >Group</Typography>
                    </Box>

                    <Box
                        display={"flex"}
                        justifyContent={"space-between"}
                        alignItems={"center"}
                        paddingTop={"15px"}
                        paddingBottom={"10px"}
                    >
                        <Autocomplete
                            options={itemCodes}
                            getOptionLabel={(option) => `${option.code} (${option.name})`}
                            onChange={(event, newValue) => setSelectedItem(newValue)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Item Code"
                                    placeholder="Search item code"
                                    size="small"
                                />
                            )}
                            sx={{ width: 300 }}
                        />
                        <TextField
                            label="Qty"
                            variant="outlined"
                            size="small"
                            name="Qty"
                            sx={{ mx: 2 }}
                        />
                        <Button variant="contained" sx={{ mt: 0 }}>Add</Button>
                    </Box>
                    <Box>
                        <TableContainer sx={{ mt: 4 }}>
                            <Table sx={{ minWidth: "100%", overflow: "hidden" }} dense table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>
                                            Item Code <br />(Item Name)
                                        </TableCell>

                                        <TableCell>
                                            Avg.Qty <br />(Rq. Qty)
                                        </TableCell>

                                        <TableCell>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow>
                                        <TableCell>
                                            Code35 <br />(Sample Item Name)
                                        </TableCell>
                                        <TableCell>
                                            400 <br />(40)
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title="Delete" arrow>
                                                <IconButton
                                                    aria-label="delete"
                                                    color="error"
                                                    onClick={() => setOpenDelete(true)}
                                                >
                                                    <RiDeleteBinLine size={16} />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>
                                            Code35 <br />(Sample Item Name)
                                        </TableCell>
                                        <TableCell>
                                            400 <br />(40)
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title="Delete" arrow>
                                                <IconButton
                                                    aria-label="delete"
                                                    color="error"
                                                    onClick={() => setOpenDelete(true)}
                                                >
                                                    <RiDeleteBinLine size={16} />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

                    <Box mt={2} sx={{ display: "flex", justifyContent: "end" }}>
                        <Button variant="contained">
                            Request
                        </Button>
                    </Box>
                </Box>
            </Drawer>
            {/* Request stock drawer end */}
            {/* Delete Modal */}
            <Dialog open={openDelete} onClose={() => setOpenDelete(false)} sx={{ zIndex: 999999 }}>
                <DialogTitle>{"Delete the Item 'Item Name' ?"}</DialogTitle>
                <DialogContent style={{ width: "300px" }}>
                    <DialogContentText>This action cannot be undone</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
                    <Button onClick={() => setOpenDelete(false)} variant="contained" color="error" autoFocus>Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Add Modal */}
            {/* Add Modal */}
            <DepartmentFormDialog
                open={open}
                onClose={handleClose}
                onSubmit={async (values, { resetForm }) => handleAdd(values, resetForm)}
                initialValues={{ name: "", color: "" }}
                title="Add Department"
                submitButtonText="Submit"
            />
        </>
    );
}