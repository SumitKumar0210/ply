// components/ActionMenu.jsx
import React, { useState, useCallback, useMemo } from "react";
import {
  Menu,
  MenuItem,
  Typography,
  Box,
  Chip,
  Divider,
  Radio,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
  changeProductDepartment,
  setNewSupervisor,
  setNewPriority,
} from "../../pages/Production/slice/productionChainSlice";

function useSubmenu() {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const openAt = useCallback((target) => setAnchorEl(target), []);
  const close = useCallback(() => setAnchorEl(null), []);
  return { anchorEl, open, openAt, close };
}

/* ----------------------- SWITCH DEPARTMENT SUBMENU ------------------------ */
const SwitchSubmenu = React.memo(function SwitchSubmenu({
  submenu,
  onSelect,
  departments,
  currentDepartment,
}) {
  const options = useMemo(() => departments || [], [departments]);

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
      {options.map((opt) => (
        <MenuItem key={opt.id} disableRipple>
          <Radio
            checked={currentDepartment === opt.id}
            onChange={() => {
              onSelect(opt);
              submenu.close();
            }}
            sx={{ p: 0, pr: 1 }}
          />
          {opt.name}
        </MenuItem>
      ))}
    </Menu>
  );
});

/* ----------------------- SUPERVISOR SUBMENU ------------------------ */
const SupervisorSubmenu = React.memo(function SupervisorSubmenu({
  submenu,
  supervisors,
  selected,
  onSelect,
}) {
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
      {supervisors.length === 0 ? (
        <MenuItem disabled>None</MenuItem>
      ) : (
        supervisors.map((s) => (
          <MenuItem key={s.id} disableRipple>
            <Radio
              checked={selected === s.id}
              onChange={() => {
                onSelect(s.id);
                submenu.close();
              }}
              sx={{ padding: 0, paddingRight: 1 }}
            />
            {s.name}
          </MenuItem>
        ))
      )}
    </Menu>
  );
});

/* ----------------------- PRIORITY SUBMENU ------------------------ */
const PrioritySubmenu = React.memo(function PrioritySubmenu({
  submenu,
  value,
  onChange,
}) {
  const levels = ["High", "Medium", "Low"];

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
        <MenuItem key={lvl} disableRipple>
          <Radio
            checked={value === lvl}
            onChange={() => {
              onChange(lvl);
              submenu.close();
            }}
            sx={{ padding: 0, paddingRight: 1 }}
          />
          {lvl}
        </MenuItem>
      ))}
    </Menu>
  );
});

/* ----------------------- MAIN ACTION MENU ------------------------ */
export default function ActionMenu({
  anchorEl,
  open,
  onClose,
  product,
  onOpenRequestStock,
  onOpenLogTime,
  onRefresh,
}) {
  const dispatch = useDispatch();
  const { data: departments = [] } = useSelector((state) => state.department);
  const { supervisor: supervisorData = [] } = useSelector((state) => state.user);

  const switchSub = useSubmenu();
  const supSub = useSubmenu();
  const prioSub = useSubmenu();

  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [priority, setPriority] = useState("High");

  /* ------------ Sync initial state when PRODUCT loads ------------- */
  React.useEffect(() => {
    if (product) {
      setSelectedSupervisor(product.supervisor_id || null);
      setPriority(product.priority || "High");
    }
  }, [product]);

  const closeAllSubmenus = useCallback(() => {
    switchSub.close();
    supSub.close();
    prioSub.close();
  }, [switchSub, supSub, prioSub]);

  /* ----------------------- UPDATE HANDLERS ----------------------- */
  const handleSwitchDepartment = useCallback(
    (dept) => {
      if (!product) return;
      dispatch(
        changeProductDepartment({
          pp_id: product.id,
          department_id: dept.id,
        })
      );
      onRefresh && onRefresh();
      onClose();
      closeAllSubmenus();
    },
    [dispatch, product, onRefresh, onClose, closeAllSubmenus]
  );

  const handleSupervisorChange = useCallback(
    (id) => {
      setSelectedSupervisor(id);
      dispatch(
        setNewSupervisor({
          pp_id: product.id,
          supervisor_id: id,
        })
      );
      onRefresh && onRefresh();
      onClose();
      closeAllSubmenus();
    },
    [dispatch, product, onRefresh, onClose, closeAllSubmenus]
  );

  const handlePriorityChange = useCallback(
    (lvl) => {
      setPriority(lvl);
      dispatch(
        setNewPriority({
          pp_id: product.id,
          priority: lvl,
        })
      );
      onRefresh && onRefresh();
      onClose();
      closeAllSubmenus();
    },
    [dispatch, product, onRefresh, onClose, closeAllSubmenus]
  );

  const handleClose = useCallback(() => {
    onClose();
    closeAllSubmenus();
  }, [onClose, closeAllSubmenus]);

  const currentDeptName =
    departments.find((d) => d.id === product?.department_id)?.name || "-";

  const currentSupervisorName = 
    supervisorData.find((s) => s.id === selectedSupervisor)?.name || "None";

  return (
    <>
      <Menu
        id="production-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: "visible",
              filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
              mt: 1.5,
              minWidth: 280,
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {/* Switch Department */}
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            closeAllSubmenus();
            switchSub.openAt(e.currentTarget);
          }}
        >
          <Box display="flex" width="100%" justifyContent="space-between" alignItems="center">
            <Typography minWidth={90}>Switch To:</Typography>
            <Typography fontWeight={600} fontSize={14}>
              {currentDeptName}
            </Typography>
          </Box>
        </MenuItem>

        {/* Supervisor */}
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            closeAllSubmenus();
            supSub.openAt(e.currentTarget);
          }}
        >
          <Box display="flex" width="100%" justifyContent="space-between" alignItems="center">
            <Typography minWidth={90}>Supervisor:</Typography>
            <Typography fontWeight={500} noWrap sx={{ maxWidth: 180, fontSize: 14 }}>
              {currentSupervisorName}
            </Typography>
          </Box>
        </MenuItem>

        {/* Priority */}
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            closeAllSubmenus();
            prioSub.openAt(e.currentTarget);
          }}
        >
          <Box display="flex" width="100%" justifyContent="space-between" alignItems="center">
            <Typography minWidth={90}>Priority:</Typography>
            <Chip
              label={priority}
              size="small"
              color={
                priority === "High"
                  ? "error"
                  : priority === "Medium"
                  ? "warning"
                  : "success"
              }
              sx={{ height: 24, fontSize: 12 }}
            />
          </Box>
        </MenuItem>

        {/* Log Time */}
        <MenuItem onClick={onOpenLogTime}>
          <Box display="flex" width="100%" justifyContent="space-between" alignItems="center">
            <Typography minWidth={90}>Log Time:</Typography>
            <Typography fontWeight={500} color="primary" fontSize={14}>
              Manage
            </Typography>
          </Box>
        </MenuItem>

        <Divider sx={{ my: 1 }} />

        {/* Request Stock */}
        <MenuItem onClick={onOpenRequestStock}>
          <Box display="flex" width="100%" justifyContent="center" alignItems="center">
            <Typography fontWeight={500} color="primary">
              Request Stock
            </Typography>
            {product?.material_request?.length > 0 && (
              <Chip
                label={product.material_request.length}
                size="small"
                color="info"
                sx={{ ml: 1, height: 20, fontSize: 11 }}
              />
            )}
          </Box>
        </MenuItem>
      </Menu>

      {/* Submenus */}
      <SwitchSubmenu
        submenu={switchSub}
        onSelect={handleSwitchDepartment}
        departments={departments}
        currentDepartment={product?.department_id}
      />

      <SupervisorSubmenu
        submenu={supSub}
        supervisors={supervisorData}
        selected={selectedSupervisor}
        onSelect={handleSupervisorChange}
      />

      <PrioritySubmenu
        submenu={prioSub}
        value={priority}
        onChange={handlePriorityChange}
      />
    </>
  );
}