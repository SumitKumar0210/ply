import React, { useState, useRef } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  Typography,
  Card,
  CardContent,
  TextareaAutosize,
  Box,
} from "@mui/material";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { useNavigate } from 'react-router-dom';
import { AiOutlinePrinter } from "react-icons/ai";
import { useReactToPrint } from "react-to-print";

const QuoteDetailsView = () => {
    const contentRef = useRef(null);
    
      const handlePrint = useReactToPrint({
        contentRef, // ✅ v3.2.0 requires contentRef instead of content()
        documentTitle: "Invoice Detail Report",
        pageStyle: `
          @page {
            size: A4 landscape;
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
    // 🔹 Area 1
        {
            id: 1,
            area: "Area 1",
            name: "Cement Bags",
            itemCode: "CEM-001",
            qty: 50,
            size: "50kg",
            documents: "Invoice #1001",
            cost: 25000,
            naration: "Delivered on site",
        },
        {
            id: 2,
            area: "Area 1",
            name: "Steel Rods",
            itemCode: "STL-010",
            qty: 100,
            size: "12mm",
            documents: "Challan #2345",
            cost: 50000,
            naration: "Used for foundation",
        },

        // 🔹 Area 2
        {
            id: 3,
            area: "Area 2",
            name: "Bricks",
            itemCode: "BRK-020",
            qty: 1000,
            size: "9x4x3",
            documents: "Invoice #1010",
            cost: 15000,
            naration: "For wall construction",
        },
        {
            id: 4,
            area: "Area 2",
            name: "Sand",
            itemCode: "SND-005",
            qty: 200,
            size: "Ton",
            documents: "Gate Pass #567",
            cost: 12000,
            naration: "Delivered by local vendor",
        },

        // 🔹 Area 3
        {
            id: 5,
            area: "Area 3",
            name: "Paint",
            itemCode: "PNT-030",
            qty: 25,
            size: "20L",
            documents: "Invoice #1122",
            cost: 18000,
            naration: "For interior finishing",
        },
        {
            id: 6,
            area: "Area 3",
            name: "Brush Set",
            itemCode: "BRH-011",
            qty: 40,
            size: "Standard",
            documents: "Receipt #778",
            cost: 4000,
            naration: "For paint work",
        },
        ]);

    const uniqueAreas = [...new Set(items.map((item) => item.area))];

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
          <Typography variant="h6">Quotation</Typography>
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
                            justifyContent: 'space-between',
                            gap: 2,
                            flexWrap: 'wrap', // optional for responsiveness
                        }}
                        >
                            <Typography variant="body1" sx={{ m: 0 }}>
                            Quote No. : <Box component="span" sx={{ fontWeight: 600 }}>TEX6789</Box>
                            </Typography>
                            <Typography variant="body1" sx={{ m: 0 }}>
                            Quote Date: <Box component="span" sx={{ fontWeight: 600 }}>14/10/2025</Box>
                            </Typography>
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
                    {uniqueAreas.map((area) => (
                        <React.Fragment key={area}>
                            <Grid size={12} sx={{ pt: 2 }}>
                            <Box
                                sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 2,
                                flexWrap: "nowrap",
                                }}
                            >
                                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                                <Typography variant="body1" sx={{ m: 0 }}>
                                    <Box component="span" sx={{ fontWeight: 600 }}>
                                    {area}
                                    </Box>
                                </Typography>
                                </Box>
                            </Box>
                            </Grid>

                            <Grid size={12} sx={{ mt: 2 }}>
                            <Table>
                                <Thead>
                                <Tr>
                                    <Th>Item Name</Th>
                                    <Th>Item Code</Th>
                                    <Th>Qty</Th>
                                    <Th>Size</Th>
                                    <Th>Documents</Th>
                                    <Th>Item Cost</Th>
                                    <Th className="w-300">Naration</Th>
                                </Tr>
                                </Thead>
                                <Tbody>
                                {items
                                    .filter((item) => item.area === area)
                                    .map((item) => (
                                    <Tr key={item.id}>
                                        <Td>{item.name}</Td>
                                        <Td>{item.itemCode}</Td>
                                        <Td>{item.qty}</Td>
                                        <Td>{item.size}</Td>
                                        <Td>{item.documents}</Td>
                                        <Td>{item.cost}</Td>
                                        <Td className="w-300">{item.naration}</Td>
                                    </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                            </Grid>
                        </React.Fragment>
                    ))}

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
                    </CardContent>
                </Card>
            </div>
        </Grid>
      </Grid>
    </>
  );
};

export default QuoteDetailsView;
