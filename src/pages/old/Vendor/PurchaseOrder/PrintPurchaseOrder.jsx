import React, { useState, useRef } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  Typography,
  Card,
  CardContent,
  Box,
} from "@mui/material";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { AiOutlinePrinter } from "react-icons/ai";
import { useReactToPrint } from "react-to-print";

const PrintPurchaseOrder = () => {

  const contentRef = useRef(null);

    const handlePrint = useReactToPrint({
      contentRef, //  v3.2.0 requires contentRef instead of content()
      documentTitle: "Ledger Report",
      pageStyle: `
        @page {
          size: A4;
          margin: 5mm;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `,
    });
  
  const [items, setItems] = useState([
  {
    id: 1,
    name: "Item Name",
    qty: 10,
    size: "10x20x40",
    uom: "in",
    rate: 2000,
    total: 2000,
    qcqty: 10,
    receivingtotal: 2000
  },
  {
    id: 2,
    name: "Another Item",
    qty: 5,
    size: "20x30",
    uom: "cm",
    rate: 1500,
    total: 7500,
    qcqty: 10,
    receivingtotal: 2000
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
          <Typography variant="h6">Purchase Order</Typography>
        </Grid>
        <Grid>
          <Button
            variant="contained"
            startIcon={<AiOutlinePrinter />}
            color="warning"
            onClick={handlePrint}
          >
           Print
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
          <div ref={contentRef} style={{ background: "#fff", padding: "20px" }}>
            <Card>
              <CardContent>
                <Grid size={12} sx={{ pt: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      flexWrap: 'wrap', // optional for responsiveness
                    }}
                  >
                    <Typography variant="h6" className="fs-15">Purchase Order</Typography>
                  </Box>
                </Grid>
                <Grid size={12} sx={{ pb:2}} borderBottom={1}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center', // vertical centering
                      justifyContent: 'space-between', // text left, button right
                      gap: 2,
                      flexWrap: 'nowrap', // keep everything on one line
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ m: 0 }}>
                      <Box component="span" sx={{ fontWeight: 600 }}>14-10-2025</Box>
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ m: 0 }}>
                      <Box component="span" sx={{ fontWeight: 600 }}>DIM/PO/7449</Box>
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={12} sx={{pt:2, pb:2}} borderBottom={1}>
                  <Box
                  sx={{
                    display: 'flex',
                    flexWrap: { xs: 'wrap', md: 'nowrap' }, // wrap on small screens
                    gap: 2, // space between items
                    pt: 2
                  }}
                >
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body1" sx={{ mb: 1 }} style={{fontWeight: 600}}>Company Detail</Typography>
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
                      <br />
                      Dated: 14/10/2025
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body1" sx={{ mb: 1 }} style={{fontWeight: 600}}>Vendor Detail</Typography>
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
                      <br />
                      Dated: 14/10/2025
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }} style={{fontWeight: 600}}>Dispatch Date: 15-10-2025</Typography>
                  </Grid>
                </Box>
                </Grid>
                <Grid size={12} sx={{ mt: 3 }}>
                  <Typography variant="body1" sx={{ mb: 2 }} style={{fontWeight: 600}}>Material Detail</Typography>
                  <Table>
                    <Thead>
                      <Tr>
                        <Th>Item Name</Th>
                        <Th>Qty</Th>
                        <Th>Size</Th>
                        <Th>UOM</Th>
                        <Th>Rate</Th>
                        <Th>Total</Th>
                        <Th>QC Qty</Th>
                        <Th style={{ textAlign: "right" }}>Receiving Total</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                        {items.map((item) => (
                          <Tr key={item.id}>
                            <Td>{item.name}</Td>
                            <Td>{item.qty}</Td>
                            <Td>{item.size}</Td>
                            <Td>{item.uom}</Td>
                            <Td>{item.rate}</Td>
                            <Td>{item.total}</Td>
                            <Td>{item.qcqty}</Td>
                            <Td align="right">{item.receivingtotal}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                  </Table>
                </Grid>
                <Grid size={12} sx={{ mt: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      width: '300px', // width of the content box
                      marginLeft: 'auto', // pushes the box to the right
                    }}
                  >
                    <Box
                      className="fs-15"
                      sx={{
                        display: 'flex',
                        borderBottom: '1px solid #ccc',
                        pb: 0.5,
                      }}
                    >
                      <span>Sub Total</span>
                      <span style={{ marginLeft: 'auto' }}>8000</span>
                    </Box>

                    <Box className="fs-15" sx={{ display: 'flex' }}>
                      <span>Discount</span>
                      <span style={{ marginLeft: 'auto' }}>1000</span>
                    </Box>

                    <Box className="fs-15" sx={{ display: 'flex' }}>
                      <span>Additional Charges</span>
                      <span style={{ marginLeft: 'auto' }}>2000</span>
                    </Box>

                    <Box className="fs-15" sx={{ display: 'flex' }}>
                      <span>GST (18%)</span>
                      <span style={{ marginLeft: 'auto' }}>800</span>
                    </Box>

                    <Box
                      className="fs-15"
                      sx={{
                        display: 'flex',
                        borderTop: '1px solid #222',
                        mt: 1,
                        pt: 0.5,
                        fontWeight: 600,
                      }}
                    >
                      <span>Grand Total</span>
                      <span style={{ marginLeft: 'auto' }}>10000</span>
                    </Box>
                  </Box>
                </Grid>
                <Grid size={12} style={{marginTop:"150px"}} sx={{px:5, mb: 3}}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center', // vertical centering
                      justifyContent: 'space-between', // text left, button right
                      gap: 2,
                      flexWrap: 'nowrap', // keep everything on one line
                    }}
                  >
                    <Typography 
                      variant="p" 
                      sx={{
                        m: 0,
                        width: "150px",
                        textAlign: "center",
                        lineHeight: "2 !important",       // works correctly
                        borderTop: 1,         // 1px top border
                        borderColor: "grey.500" // optional: set border color
                      }}
                    > 
                      Approved By
                    </Typography>
                    <Typography 
                      variant="p" 
                      sx={{
                        m: 0,
                        width: "150px",
                        textAlign: "center",
                        lineHeight: "2 !important",       // works correctly
                        borderTop: 1,         // 1px top border
                        borderColor: "grey.500" // optional: set border color
                      }}
                    > 
                      Prepared By
                    </Typography>
                    <Typography 
                      variant="p" 
                      sx={{
                        m: 0,
                        width: "150px",
                        textAlign: "center",
                        lineHeight: "2 !important",       // works correctly
                        borderTop: 1,         // 1px top border
                        borderColor: "grey.500" // optional: set border color
                      }}
                    > 
                      QC Done By
                    </Typography>
                  </Box>
                </Grid>
              </CardContent>
            </Card>
          </div>
        </Grid>
      </Grid>
    </>
  );
};

export default PrintPurchaseOrder;
