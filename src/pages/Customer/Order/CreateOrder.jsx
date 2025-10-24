import React, { useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  Typography,
  Card,
  Tooltip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CardContent,
  Stack,
  Box,
  TextareaAutosize
} from "@mui/material";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { RiDeleteBinLine } from "react-icons/ri";
import { Autocomplete, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';


const CreateOrder = () => {

  const [creationDate, setCreationDate] = useState(null);
  const [eddDate, setEddDate] = useState(null);

  const [openDelete, setOpenDelete] = useState(false);
  const [items, setItems] = useState([
  {
    id: 1,
    name: "Item A",
    code: "ITM-001",
    qty: 10,
    size: "10x20x40",
    document: "https://placehold.co/400",
    grade: "A",
    priority: 1,
    startDate: "2025-10-01",
    endDate: "2025-10-10",
  },
  {
    id: 2,
    name: "Item B",
    code: "ITM-002",
    qty: 25,
    size: "12x24x36",
    document: "https://placehold.co/400",
    grade: "B",
    priority: 2,
    startDate: "2025-10-05",
    endDate: "2025-10-15",
  },
  {
    id: 3,
    name: "Item C",
    code: "ITM-003",
    qty: 15,
    size: "8x18x30",
    document: "https://placehold.co/400",
    grade: "C",
    priority: 3,
    startDate: "2025-10-07",
    endDate: "2025-10-17",
  },
  {
    id: 4,
    name: "Item D",
    code: "ITM-004",
    qty: 40,
    size: "20x40x60",
    document: "https://placehold.co/400",
    grade: "A",
    priority: 4,
    startDate: "2025-10-10",
    endDate: "2025-10-20",
  },
]);


const quoteList = [
  { id: 1, label: 'Quote 1' },
  { id: 2, label: 'Quote 3' },
  { id: 3, label: 'Quote 2' },
];
const itemCode = [
  { id: 1, label: 'Item_001' },
  { id: 2, label: 'Item_002' },
  { id: 3, label: 'Item_003' },
];
const itemquantity = [
  { id: 1, label: '1' },
  { id: 2, label: '2' },
  { id: 3, label: '3' },
];
  return (
    <>
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid>
          <Typography variant="h6">Create Order</Typography>
        </Grid>
      </Grid>
      <Grid
        container
        spacing={1}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid size={12}>
          <Card>
            <CardContent>
              <Grid size={12} sx={{ pt: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    flexWrap: 'wrap', // optional for responsiveness
                  }}
                >
                  {/* Left: Vendor */}
                  <Autocomplete
                    options={quoteList}
                    size="small"
                    getOptionLabel={(option) => option.label}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Quote"
                        variant="outlined"
                        sx={{ width: 300, height: 40 }}
                      />
                    )}
                    sx={{ width: 300 }}
                  />

                  {/* Right: Date inputs */}
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <DatePicker
                        label="Project Start Date"
                        value={creationDate}
                        onChange={(newValue) => setCreationDate(newValue)}
                        slotProps={{
                          textField: {
                            size: 'small',
                            sx: { width: 300, height: 40 },
                          },
                        }}
                      />
                      <DatePicker
                        label="EDD"
                        value={eddDate}
                        onChange={(newValue) => setEddDate(newValue)}
                        slotProps={{
                          textField: {
                            size: 'small',
                            sx: { width: 300, height: 40 },
                          },
                        }}
                      />
                    </Box>
                  </LocalizationProvider>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }} sx={{pt:2}}>
                <Typography variant="p">
                  TECHIE SQUAD PRIVATE LIMITED
                  <br />
                  CIN: U72900BR2019PTC042431
                  <br />
                  RK NIWAS, GOLA ROAD MOR, BAILEY ROAD
                  <br />
                  DANAPUR, PATNA-801503, BIHAR, INDIA
                  <br />
                  GSTIN: 10AAHCT3899A1ZI
                </Typography>
              </Grid>
              <Grid size={12} sx={{pt:2}}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Autocomplete
                    options={itemCode}
                    size="small"
                    getOptionLabel={(option) => option.label}
                    renderInput={(params) => (
                      <TextField {...params} label="Item Code" variant="outlined" />
                    )}
                    sx={{ width: 300 }}
                  />
                  <Autocomplete
                    options={itemquantity}
                    size="small"
                    getOptionLabel={(option) => option.label}
                    renderInput={(params) => (
                      <TextField {...params} label="Qty" variant="outlined" />
                    )}
                    sx={{ width: 300 }}
                  />
                  <Button variant="contained" color="primary" sx={{mt:0}}> Add</Button>
                </Box>
              </Grid>
              <Grid size={12} sx={{ mt: 3 }}>
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Item Name</Th>
                      <Th>Item Code</Th>
                      <Th>Qty</Th>
                      <Th>Size</Th>
                      <Th>Document</Th>
                      <Th>Grade</Th>
                      <Th>Priority</Th>
                      <Th>Start Date</Th>
                      <Th>End Date</Th>
                      <Th>Action</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                      {items.map((item) => (
                        <Tr key={item.id}>
                          <Td>{item.name}</Td>
                          <Td>{item.code}</Td>
                          <Td>{item.qty}</Td>
                          <Td>{item.size}</Td>
                          <Td>
                            <img
                              src={item.document}
                              // alt={row.original.name}
                              style={{
                                  width: "40px",
                                  height: "40px",
                                  objectFit: "cover",
                                  borderRadius: "4px",
                                  border: "1px solid #ddd",
                              }}
                            />
                          </Td>
                          <Td>{item.grade}</Td>
                          <Td>{item.priority}</Td>
                          <Td>{item.startDate}</Td>
                          <Td>{item.endDate}</Td>
                          <Td>
                            <Tooltip title="Delete">
                              <IconButton
                                color="error"
                                onClick={() => setOpenDelete(true)}
                              >
                                <RiDeleteBinLine size={16} />
                              </IconButton>
                            </Tooltip>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                </Table>
              </Grid>
              <Grid size={12} sx={{ mt: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    // alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    gap: 2 // Adds spacing between both textareas
                  }}
                >
                  <TextareaAutosize
                    aria-label="minimum height"
                    minRows={3}
                    placeholder="Order Terms"
                    style={{ width: '50%', padding: '8px' }}
                  />
                  <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    width: '20%',
                  }}
                >
                  <Box
                    className="fs-15"
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #ccc', // Add bottom border
                      pb: 0.5, // Add small padding for spacing
                    }}
                  >
                    <span>Sub Total</span>
                    <span>8000</span>
                  </Box>

                  <Box className="fs-15" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Discount</span>
                    <span>1000</span>
                  </Box>

                  <Box className="fs-15" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Additional Charges</span>
                    <span>2000</span>
                  </Box>

                  <Box className="fs-15" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>GST (18%)</span>
                    <span>800</span>
                  </Box>

                  <Box
                    className="fs-15"
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderTop: '1px solid #222', // Add separator for total if desired
                      mt: 1,
                      pt: 0.5,
                      fontWeight: '600',
                    }}
                  >
                    <span>Grand Total</span>
                    <span>10000</span>
                  </Box>
                </Box>

                </Box>
              </Grid>
              <Grid size={12} sx={{ mt: 4 }}>
                <Stack
                    direction="row"
                    spacing={2}
                    sx={{
                        justifyContent: "flex-end",
                        alignItems: "flex-end",
                    }}
                >
                    <Button variant="contained" color="secondary">Save as Draft </Button>
                    <Button variant="contained" color="primary"> Save</Button>
                </Stack>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Delete Modal */}
      <Dialog maxWidth="xs" fullWidth open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this item?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => setOpenDelete(false)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CreateOrder;
