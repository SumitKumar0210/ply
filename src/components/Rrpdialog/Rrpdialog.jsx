import * as React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  CircularProgress,
} from "@mui/material";

const RRPDialog = ({ open, onClose, productData, onSave }) => {
  const [formData, setFormData] = useState({
    miscellaneous_cost: "",
    gross_profit: "",
  });
  const [calculatedRRP, setCalculatedRRP] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (productData) {
      setFormData({
        miscellaneous_cost: productData.miscellaneous_cost || "",
        gross_profit: productData.gross_profit || "",
      });
    }
  }, [productData]);

  // Calculate RRP whenever form data changes
  useEffect(() => {
    const misc = parseFloat(formData.miscellaneous_cost) || 0;
    const profit = parseFloat(formData.gross_profit) || 0;
    
    // RRP = Miscellaneous Cost + Gross Profit
    const rrp = misc + profit;
    setCalculatedRRP(rrp);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error for this field
    setErrors((prev) => ({ ...prev, [name]: "" }));
    
    // Allow only numbers and decimals
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      // Validate gross_profit range (1-100)
      if (name === "gross_profit") {
        const numValue = parseFloat(value);
        if (value !== "" && (numValue < 1 || numValue > 100)) {
          setErrors((prev) => ({ ...prev, [name]: "Must be between 1 and 100" }));
        }
      }
      
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSave = async () => {
    // Validate before saving
    const grossProfit = parseFloat(formData.gross_profit);
    
    if (!formData.gross_profit || grossProfit < 1 || grossProfit > 100) {
      setErrors({ gross_profit: "Gross profit must be between 1 and 100" });
      return;
    }
    
    setIsSaving(true);
    try {
      const dataToSave = {
        id: productData.id,
        miscellaneous_cost: parseFloat(formData.miscellaneous_cost) || 0,
        gross_profit: grossProfit,
        rrp_price: calculatedRRP,
      };
      
      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error("Error saving RRP:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setFormData({
        miscellaneous_cost: "",
        gross_profit: "",
      });
      setCalculatedRRP(0);
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Calculate RRP - {productData?.name}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid size={6}>
              <TextField
                fullWidth
                label="Miscellaneous Cost"
                name="miscellaneous_cost"
                value={formData.miscellaneous_cost}
                onChange={handleChange}
                type="text"
                inputProps={{ inputMode: "decimal" }}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                fullWidth
                label="Gross Profit (%)"
                name="gross_profit"
                value={formData.gross_profit}
                onChange={handleChange}
                type="text"
                inputProps={{ inputMode: "decimal" }}
                error={!!errors.gross_profit}
                helperText={errors.gross_profit}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isSaving}
          startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {isSaving ? "Saving..." : "Save RRP"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RRPDialog;