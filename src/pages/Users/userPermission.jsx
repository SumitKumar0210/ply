import React, { useState, useEffect, useCallback } from "react";
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
  Divider,
  Chip,
  Alert,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useDispatch, useSelector } from "react-redux";
import { getDataByModule } from "./slices/userPermissionsSlice";
import { successMessage, errorMessage } from "../../toast";
import { capitalize } from "lodash";

const PermissionGroupManager = () => {
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [expandedModules, setExpandedModules] = useState({});
  
  const { permissions = {}, loading = false } = useSelector(
    (state) => state.userPermissions
  );
  const dispatch = useDispatch();

  // Fetch permissions on mount
  useEffect(() => {
    dispatch(getDataByModule());
  }, [dispatch]);

  // Group permissions by module (data is already grouped from server)
  const groupedPermissions = React.useMemo(() => {
    // If permissions is already an object with modules as keys
    if (permissions && typeof permissions === 'object' && !Array.isArray(permissions)) {
      // Sort permissions within each module
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
  const sortedModules = React.useMemo(() => {
    return Object.keys(groupedPermissions).sort();
  }, [groupedPermissions]);

  // Handle individual permission checkbox change
  const handlePermissionToggle = useCallback((permissionId) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((id) => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  }, []);

  // Handle module "Select All" checkbox
  const handleModuleSelectAll = useCallback((module, isChecked) => {
    const modulePermissions = groupedPermissions[module];
    const modulePermissionIds = modulePermissions.map((p) => p.id);

    setSelectedPermissions((prev) => {
      if (isChecked) {
        // Add all module permissions (avoid duplicates)
        const newIds = modulePermissionIds.filter((id) => !prev.includes(id));
        return [...prev, ...newIds];
      } else {
        // Remove all module permissions
        return prev.filter((id) => !modulePermissionIds.includes(id));
      }
    });
  }, [groupedPermissions]);

  // Check if all permissions in a module are selected
  const isModuleFullySelected = useCallback((module) => {
    const modulePermissions = groupedPermissions[module];
    if (!modulePermissions || modulePermissions.length === 0) return false;
    
    return modulePermissions.every((p) => selectedPermissions.includes(p.id));
  }, [groupedPermissions, selectedPermissions]);

  // Check if some (but not all) permissions in a module are selected
  const isModulePartiallySelected = useCallback((module) => {
    const modulePermissions = groupedPermissions[module];
    if (!modulePermissions || modulePermissions.length === 0) return false;
    
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
    const allPermissionIds = permissions.map((p) => p.id);
    setSelectedPermissions(allPermissionIds);
  }, [permissions]);

  // Deselect all permissions
  const handleDeselectAll = useCallback(() => {
    setSelectedPermissions([]);
  }, []);

  // Get permission action name from full permission string
  const getPermissionAction = (permissionName) => {
    if (!permissionName) return "";
    const parts = permissionName.split(".");
    return parts[1] ? capitalize(parts[1].replace(/_/g, " ")) : "";
  };

  // Handle update permissions
  const handleUpdatePermissions = useCallback(() => {
    if (selectedPermissions.length === 0) {
      errorMessage("Please select at least one permission");
      return;
    }

    console.log("Selected Permission IDs:", selectedPermissions);
    
    // Here you would typically dispatch an action to update permissions
    // Example:
    // dispatch(updateRolePermissions({ permissionIds: selectedPermissions }));
    
    successMessage(`${selectedPermissions.length} permission(s) selected`);
    
    // You can also log the actual permission objects if needed
    const selectedPermissionObjects = permissions.filter((p) => 
      selectedPermissions.includes(p.id)
    );
    console.log("Selected Permission Objects:", selectedPermissionObjects);
  }, [selectedPermissions, permissions]);

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
              <Button
                variant="outlined"
                size="small"
                onClick={handleExpandAll}
              >
                Expand All
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={handleCollapseAll}
              >
                Collapse All
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={handleSelectAll}
              >
                Select All
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={handleDeselectAll}
              >
                Deselect All
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", gap: 2, justifyContent: { xs: "flex-start", md: "flex-end" }, alignItems: "center" }}>
              <Chip
                label={`${selectedPermissions.length} selected`}
                color={selectedPermissions.length > 0 ? "primary" : "default"}
                size="small"
              />
              <Button
                variant="contained"
                onClick={handleUpdatePermissions}
                disabled={selectedPermissions.length === 0}
              >
                Update Permissions
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Info Alert */}
      {selectedPermissions.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Selected {selectedPermissions.length} permission(s). Check console for permission IDs.
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
                      {modulePermissions.map((permission) => (
                        <Grid item xs={12} sm={6} md={4} key={permission.id}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={selectedPermissions.includes(permission.id)}
                                onChange={() => handlePermissionToggle(permission.id)}
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {getPermissionAction(permission.name)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {permission.name}
                                </Typography>
                              </Box>
                            }
                          />
                        </Grid>
                      ))}
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