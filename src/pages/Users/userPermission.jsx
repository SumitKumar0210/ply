import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Button,
  Paper,
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Chip,
  Alert,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useDispatch, useSelector } from "react-redux";
import { getDataByModule, getModulePermission } from "./slices/userPermissionsSlice";
import { successMessage, errorMessage } from "../../toast";
import { capitalize } from "lodash";
import { assignPermission } from "../settings/slices/roleSlice";
import { useParams } from "react-router-dom";

const PermissionGroupManager = () => {
  const { id } = useParams();
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [expandedModules, setExpandedModules] = useState({});

  const {
    permissions = {},
    rolePermissions = null,
    loading = false
  } = useSelector((state) => state.userPermissions);
  const dispatch = useDispatch();

  // Store initial permissions for comparison
  const [initialPermissions, setInitialPermissions] = useState([]);

  // Fetch permissions on mount
  useEffect(() => {
    dispatch(getDataByModule());
    if (id) {
      dispatch(getModulePermission(id));
    }
  }, [dispatch, id]);

  // Pre-populate selected permissions when role permissions are loaded
  useEffect(() => {
    if (rolePermissions?.permissions && Array.isArray(rolePermissions.permissions)) {
      const existingPermissionIds = rolePermissions.permissions.map(p => p.id);
      setSelectedPermissions(existingPermissionIds);
      setInitialPermissions(existingPermissionIds);
      // console.log("Pre-populated permissions:", existingPermissionIds);
      // console.log("Permission names:", rolePermissions.permissions.map(p => p.name));
    }
  }, [rolePermissions]);

  // Group permissions by module (data is already grouped from server)
  const groupedPermissions = useMemo(() => {
    // If permissions is already an object with modules as keys
    if (permissions && typeof permissions === 'object' && !Array.isArray(permissions)) {
      const sorted = {};
      Object.keys(permissions).forEach((module) => {
        sorted[module] = [...permissions[module]].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      });
      return sorted;
    }

    // Fallback: if permissions is an array, group it manually
    if (Array.isArray(permissions)) {
      const grouped = {};
      permissions.forEach((permission) => {
        const module = permission.module || "other";
        if (!grouped[module]) {
          grouped[module] = [];
        }
        grouped[module].push(permission);
      });

      Object.keys(grouped).forEach((module) => {
        grouped[module].sort((a, b) => a.name.localeCompare(b.name));
      });

      return grouped;
    }

    return {};
  }, [permissions]);

  // Get sorted module names
  const sortedModules = useMemo(() => {
    return Object.keys(groupedPermissions).sort();
  }, [groupedPermissions]);

  // Get all permission IDs from permissions object
  const allPermissionIds = useMemo(() => {
    const ids = [];
    Object.values(groupedPermissions).forEach(modulePerms => {
      modulePerms.forEach(p => ids.push(p.id));
    });
    return ids;
  }, [groupedPermissions]);

  // Handle individual permission checkbox change
  const handlePermissionToggle = useCallback((permissionId) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  }, []);

  // Handle module "Select All" checkbox
  const handleModuleSelectAll = useCallback((module, isChecked) => {
    const modulePermissionIds = groupedPermissions[module]?.map((p) => p.id) || [];

    setSelectedPermissions((prev) => {
      if (isChecked) {
        const newIds = modulePermissionIds.filter((id) => !prev.includes(id));
        return [...prev, ...newIds];
      } else {
        return prev.filter((id) => !modulePermissionIds.includes(id));
      }
    });
  }, [groupedPermissions]);

  // Check if all permissions in a module are selected
  const isModuleFullySelected = useCallback((module) => {
    const modulePermissions = groupedPermissions[module];
    if (!modulePermissions?.length) return false;
    return modulePermissions.every((p) => selectedPermissions.includes(p.id));
  }, [groupedPermissions, selectedPermissions]);

  // Check if some (but not all) permissions in a module are selected
  const isModulePartiallySelected = useCallback((module) => {
    const modulePermissions = groupedPermissions[module];
    if (!modulePermissions?.length) return false;

    const selectedCount = modulePermissions.filter((p) =>
      selectedPermissions.includes(p.id)
    ).length;

    return selectedCount > 0 && selectedCount < modulePermissions.length;
  }, [groupedPermissions, selectedPermissions]);

  // Handle accordion expansion
  const handleAccordionChange = useCallback((module) => (event, isExpanded) => {
    setExpandedModules((prev) => ({
      ...prev,
      [module]: isExpanded,
    }));
  }, []);

  // Expand all modules
  const handleExpandAll = useCallback(() => {
    const allExpanded = {};
    sortedModules.forEach((module) => {
      allExpanded[module] = true;
    });
    setExpandedModules(allExpanded);
  }, [sortedModules]);

  // Collapse all modules
  const handleCollapseAll = useCallback(() => {
    setExpandedModules({});
  }, []);

  // Select all permissions
  const handleSelectAll = useCallback(() => {
    setSelectedPermissions(allPermissionIds);
  }, [allPermissionIds]);

  // Deselect all permissions
  const handleDeselectAll = useCallback(() => {
    setSelectedPermissions([]);
  }, []);

  // Check if permission was initially assigned
  const isInitiallyAssigned = useCallback((permissionId) => {
    return initialPermissions.includes(permissionId);
  }, [initialPermissions]);

  // Get changes summary
  const getChangesSummary = useMemo(() => {
    const added = selectedPermissions.filter(id => !initialPermissions.includes(id));
    const removed = initialPermissions.filter(id => !selectedPermissions.includes(id));
    return { added, removed, hasChanges: added.length > 0 || removed.length > 0 };
  }, [selectedPermissions, initialPermissions]);
  const getPermissionAction = useCallback((permissionName) => {
    if (!permissionName) return "";
    const parts = permissionName.split(".");
    return parts[1] ? capitalize(parts[1].replace(/_/g, " ")) : "";
  }, []);

  // Get selected permission names
  const getSelectedPermissionNames = useCallback(() => {
    const names = [];
    Object.values(groupedPermissions).forEach(modulePerms => {
      modulePerms.forEach(p => {
        if (selectedPermissions.includes(p.id)) {
          names.push(p.name);
        }
      });
    });
    return names;
  }, [groupedPermissions, selectedPermissions]);

  // Handle update permissions
  const handleUpdatePermissions = useCallback(() => {
    if (selectedPermissions.length === 0) {
      errorMessage("Please select at least one permission");
      return;
    }

    const run = async () => {
      const selectedPermissionNames = getSelectedPermissionNames();

      // Send both IDs and names to server
      await dispatch(assignPermission({
        id: id,
        permissionIds: selectedPermissions,
        permissionNames: selectedPermissionNames,
      }));

      await dispatch(getModulePermission(id));

      successMessage(`${selectedPermissions.length} permission(s) assigned`);
    };

    run();
  }, [selectedPermissions, id, dispatch, getSelectedPermissionNames]);


  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography>Loading permissions...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Permission Management
          {rolePermissions && (
            <Chip
              label={rolePermissions.name}
              color="primary"
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select permissions and click update to assign them
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button variant="outlined" size="small" onClick={handleExpandAll}>
                Expand All
              </Button>
              <Button variant="outlined" size="small" onClick={handleCollapseAll}>
                Collapse All
              </Button>
              <Button variant="outlined" size="small" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button variant="outlined" size="small" onClick={handleDeselectAll}>
                Deselect All
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{
              display: "flex",
              gap: 2,
              justifyContent: { xs: "flex-start", md: "flex-end" },
              alignItems: "center"
            }}>
              <Chip
                label={`${selectedPermissions.length} selected`}
                color={selectedPermissions.length > 0 ? "primary" : "default"}
                size="small"
              />
              <Button
                variant="contained"
                onClick={handleUpdatePermissions}
                disabled={selectedPermissions.length === 0 || !getChangesSummary.hasChanges}
              >
                Update Permissions
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Info Alert */}
      {getChangesSummary.hasChanges && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight={500}>Changes detected:</Typography>
          {getChangesSummary.added.length > 0 && (
            <Typography variant="body2" color="success.main">
              + {getChangesSummary.added.length} permission(s) will be added
            </Typography>
          )}
          {getChangesSummary.removed.length > 0 && (
            <Typography variant="body2" color="error.main">
              - {getChangesSummary.removed.length} permission(s) will be removed
            </Typography>
          )}
        </Alert>
      )}

      {selectedPermissions.length > 0 && !getChangesSummary.hasChanges && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Currently {selectedPermissions.length} permission(s) assigned. Make changes and click Update to save.
        </Alert>
      )}

      {/* Permissions List */}
      {sortedModules.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography color="text.secondary">
            No permissions available
          </Typography>
        </Paper>
      ) : (
        <Box>
          {sortedModules.map((module) => {
            const modulePermissions = groupedPermissions[module];
            const isFullySelected = isModuleFullySelected(module);
            const isPartiallySelected = isModulePartiallySelected(module);

            return (
              <Accordion
                key={module}
                expanded={expandedModules[module] || false}
                onChange={handleAccordionChange(module)}
                sx={{ mb: 1 }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    backgroundColor: "grey.50",
                    "&:hover": { backgroundColor: "grey.100" },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                    <Checkbox
                      checked={isFullySelected}
                      indeterminate={isPartiallySelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleModuleSelectAll(module, e.target.checked);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Typography variant="h6" sx={{ flex: 1 }}>
                      {capitalize(module.replace(/_/g, " "))}
                    </Typography>
                    <Chip
                      label={`${modulePermissions.length} permission${modulePermissions.length !== 1 ? 's' : ''}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 2 }}>
                  <FormGroup>
                    <Grid container spacing={1}>
                      {modulePermissions.map((permission) => {
                        const isChecked = selectedPermissions.includes(permission.id);
                        const wasInitial = isInitiallyAssigned(permission.id);
                        const isNewlyAdded = isChecked && !wasInitial;
                        const isRemoved = !isChecked && wasInitial;

                        return (
                          <Grid item xs={12} sm={6} md={4} key={permission.id}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={isChecked}
                                  onChange={() => handlePermissionToggle(permission.id)}
                                  sx={{
                                    color: isNewlyAdded ? 'success.main' : isRemoved ? 'error.main' : undefined
                                  }}
                                />
                              }
                              label={
                                <Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Typography variant="body2" fontWeight={500}>
                                      {getPermissionAction(permission.name)}
                                    </Typography>
                                    {wasInitial && (
                                      <Chip
                                        label="Current"
                                        size="small"
                                        color="default"
                                        variant="outlined"
                                        sx={{ height: 16, fontSize: '0.65rem' }}
                                      />
                                    )}
                                    {isNewlyAdded && (
                                      <Chip
                                        label="New"
                                        size="small"
                                        color="success"
                                        sx={{ height: 16, fontSize: '0.65rem' }}
                                      />
                                    )}
                                  </Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {permission.name}
                                  </Typography>
                                </Box>
                              }
                            />
                          </Grid>
                        );
                      })}
                    </Grid>
                  </FormGroup>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}

      {/* Summary Footer */}
      {selectedPermissions.length > 0 && (
        <Paper sx={{ p: 2, mt: 3, backgroundColor: "primary.50" }}>
          <Typography variant="body2" fontWeight={500}>
            Summary: {selectedPermissions.length} permission(s) selected across{" "}
            {sortedModules.filter((module) =>
              groupedPermissions[module].some((p) => selectedPermissions.includes(p.id))
            ).length} module(s)
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default PermissionGroupManager;