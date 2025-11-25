import React, { useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  Typography,
  Card,
  Box,
  Tooltip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CardContent,
  Stack
} from "@mui/material";
import { Link } from "react-router-dom";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { AiOutlinePrinter } from "react-icons/ai";
import { RiDeleteBinLine } from "react-icons/ri";
import AddIcon from "@mui/icons-material/Add";
import { BiSolidEditAlt } from "react-icons/bi";
import { MdOutlineCheckCircle } from "react-icons/md";
import { AiOutlineSetting } from "react-icons/ai";


const OrderDetailsView = () => {
  const [openDelete, setOpenDelete] = useState(false);
  const [items, setItems] = useState([
  {
    id: 1,
    name: "Item A",
    qty: 10,
    size: "10x20x40",
    documents: "https://placehold.co/400",
    area: 2000,
    grade: "A",
    priority: "High",
    startDate: "2025-10-01",
    endDate: "2025-10-10",
  },
  {
    id: 2,
    name: "Item B",
    qty: 15,
    size: "15x25x35",
    documents: "https://placehold.co/400",
    area: 1800,
    grade: "B",
    priority: "Medium",
    startDate: "2025-10-05",
    endDate: "2025-10-15",
  },
  {
    id: 3,
    name: "Item C",
    qty: 8,
    size: "12x18x30",
    documents: "https://placehold.co/400",
    area: 2200,
    grade: "A",
    priority: "Low",
    startDate: "2025-10-08",
    endDate: "2025-10-18",
  },
  {
    id: 4,
    name: "Item D",
    qty: 20,
    size: "20x30x40",
    documents: "https://placehold.co/400",
    area: 2500,
    grade: "C",
    priority: "High",
    startDate: "2025-10-12",
    endDate: "2025-10-22",
  },
  {
    id: 5,
    name: "Item E",
    qty: 12,
    size: "14x28x32",
    documents: "https://placehold.co/400",
    area: 1950,
    grade: "B",
    priority: "Medium",
    startDate: "2025-10-15",
    endDate: "2025-10-25",
  },
  {
    id: 6,
    name: "Item E",
    qty: 12,
    size: "14x28x32",
    documents: "https://placehold.co/400",
    area: 1950,
    grade: "B",
    priority: "Medium",
    startDate: "2025-10-15",
    endDate: "2025-10-25",
  },
]);


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
          <Typography variant="h6">Order Details</Typography>
        </Grid>
        <Grid>
          {/* <Button
            variant="contained"
            color="secondary"
            startIcon={<AiOutlinePrinter />}
          >
            Print
          </Button> */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            to="/vendor/purchase-order/create" // your route path
          >
            Create Order
          </Button>
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
              <Grid size={12} sx={{ pt: 2, mb:3 }}>
                <Box
                  sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      flexWrap: 'wrap', // optional for responsiveness
                  }}
                >
                  <Typography variant="body1" sx={{ m: 0 }}>
                    Order No. : <Box component="span" sx={{ fontWeight: 600 }}>TEX6789</Box>
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="p">
                  From
                   <br />
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
            <Grid size={12} sx={{ mt: 3 }}>
                <Stack
                    direction="row"
                    spacing={2}
                    sx={{
                        justifyContent: "flex-end",
                        alignItems: "flex-end",
                    }}
                >
                    <Button 
                        variant="contained" 
                        color="success"
                        startIcon={<MdOutlineCheckCircle />}
                    >
                        Approve
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<BiSolidEditAlt />}
                        component={Link}
                        to="#" // your route path
                    >
                        Edit
                    </Button>
                </Stack>
            </Grid>
           
              <Grid size={12} sx={{ mt: 3 }}>
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Item Name</Th>
                      <Th>Qty</Th>
                      <Th>Size</Th>
                      <Th>Documents</Th>
                      <Th>Area</Th>
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
                          <Td>{item.qty}</Td>
                          <Td>{item.size}</Td>
                          <Td>
                            <img
                              src={item.documents}
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
                          <Td>{item.area}</Td>
                          <Td>{item.grade}</Td>
                          <Td>{item.priority}</Td>
                          <Td>{item.startDate}</Td>
                          <Td>{item.endDate}</Td>
                          <Td>
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Tooltip title="Start Production">
                                <IconButton
                                  color="warning"
                                  // onClick={() => setOpenDelete(true)}
                                >
                                  <AiOutlineSetting size={16} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit">
                                <IconButton
                                  color="primary"
                                  // onClick={handleEditClick}
                                >
                                  <BiSolidEditAlt size={16} />
                                </IconButton>
                              </Tooltip>
                              
                            </Box>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>

                </Table>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {/* Delete Modal */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Delete Customer?</DialogTitle>
        <DialogContent style={{ width: "300px" }}>
          <DialogContentText>This action cannot be undone</DialogContentText>
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

export default OrderDetailsView;
