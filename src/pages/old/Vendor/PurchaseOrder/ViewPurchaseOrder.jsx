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
  Stack
} from "@mui/material";
import { Link } from "react-router-dom";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { AiOutlinePrinter } from "react-icons/ai";
import { RiDeleteBinLine } from "react-icons/ri";
import AddIcon from "@mui/icons-material/Add";
import { BiSolidEditAlt } from "react-icons/bi";
import { MdOutlineCheckCircle } from "react-icons/md";

const ViewPurchaseOrder = () => {
  const [openDelete, setOpenDelete] = useState(false);
  const [items, setItems] = useState([
  {
    id: 1,
    name: "Item Name",
    code: "Item Code",
    qty: 10,
    size: "10x20x40",
    uom: "in",
    rate: 2000,
    total: 2000,
  },
  {
    id: 2,
    name: "Another Item",
    code: "IC-002",
    qty: 5,
    size: "20x30",
    uom: "cm",
    rate: 1500,
    total: 7500,
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
            Create PO
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
              <Grid size={{ xs: 12, md: 3 }}>
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
                        Edit PO
                    </Button>
                </Stack>
            </Grid>
           
              <Grid size={12} sx={{ mt: 3 }}>
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Item Name</Th>
                      <Th>Item Code</Th>
                      <Th>Qty</Th>
                      <Th>Size</Th>
                      <Th>UOM</Th>
                      <Th>Rate</Th>
                      <Th>Total</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                      {items.map((item) => (
                        <Tr key={item.id}>
                          <Td>{item.name}</Td>
                          <Td>{item.code}</Td>
                          <Td>{item.qty}</Td>
                          <Td>{item.size}</Td>
                          <Td>{item.uom}</Td>
                          <Td>{item.rate}</Td>
                          <Td>{item.total}</Td>
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

export default ViewPurchaseOrder;
