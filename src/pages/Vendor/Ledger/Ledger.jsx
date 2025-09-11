import React from 'react'
import Grid from "@mui/material/Grid";
import {
  Button,
  Paper,
  TextField,
  Typography,
  IconButton,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { AiOutlinePrinter } from "react-icons/ai";


const Ledger = () => {
  return (
    <>
    <Grid container spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Grid>
          <Typography variant="h6">Ledger</Typography>
        </Grid>
        <Grid>
          <Button variant="contained" color="secondary" startIcon={<AiOutlinePrinter />}>
            Print
          </Button>
        </Grid>
    </Grid>
    <Grid container spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Grid size={3}>
            <Typography variant="p">
                TECHIE SQUAD PRIVATE LIMITED<br></br>CIN: U72900BR2019PTC042431<br></br>RK NIWAS, GOLA ROAD MOR, BAILEY ROAD<br></br>DANAPUR, PATNA-801503, BIHAR, INDIA<br></br>GSTIN: 10AAHCT3899A1ZI
            </Typography>
        </Grid>
      </Grid>
    </>
  )
}

export default Ledger