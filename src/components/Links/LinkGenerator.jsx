import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import { AiOutlineLink } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import {
  generateLink,
  getLink,
  clearLinkData,
} from "./slice/linkManagementSlice";

const URL = import.meta.env.VITE_FRONTEND_BASE_URL;

const LinkGenerator = ({ id }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.link);

  const [openGenerate, setOpenGenerate] = useState(false);
  const [expiryDays, setExpiryDays] = useState(1);
  const [currentLink, setCurrentLink] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const prefix = URL + 'quotation/';

  // Check if link already exists
  const handleGenerateableId = async () => {
    setOpenGenerate(true);
    setCurrentLink(null);

    try {
      const result = await dispatch(getLink({ id })).unwrap();
      setCurrentLink(result.link);
    } catch (error) {
      setCurrentLink(null);
    }
  };

  // Generate link when form submitted
  const handleExpirySubmit = async () => {
    setIsGenerating(true);
    try {
      
      const result = await dispatch(
        generateLink({ id, expiry_days: expiryDays })
      ).unwrap();
      setCurrentLink(result.link);
    } catch (error) {
      console.error("Generate link failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Close modal
  const handleClose = () => {
    setOpenGenerate(false);
    setCurrentLink(null);
    setExpiryDays(1);
    dispatch(clearLinkData());
  };

  return (
    <>
      <Tooltip title="Generate Public Link">
        <IconButton color="info" onClick={handleGenerateableId}>
          <AiOutlineLink size={16} />
        </IconButton>
      </Tooltip>

      {/* Modal */}
      <Dialog open={openGenerate} onClose={handleClose}>
        <DialogTitle>Generate Public Link</DialogTitle>

        <DialogContent sx={{ minWidth: 350 }}>
          {loading ? (
            <Typography sx={{ mt: 2 }}>Checking existing link...</Typography>
          ) : currentLink ? (
            <Typography sx={{ mt: 2 }}>
              ✅ Public link available:
              <br />
              <a href={prefix + currentLink} target="_blank" rel="noopener noreferrer">
                {prefix + currentLink}
              </a>
            </Typography>
          ) : (
            <TextField
              label="Expiry (in days)"
              type="number"
              size="small"
              fullWidth
              margin="normal"
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              inputProps={{ min: 1, max: 365 }}
            />
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="error">
            Close
          </Button>

          {!currentLink && (
            <Button
              variant="contained"
              color="success"
              onClick={handleExpirySubmit}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LinkGenerator;
