import React, { useRef, useState } from "react";
import { Grid, Button, Typography, Card, CardContent } from "@mui/material";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { AiOutlinePrinter } from "react-icons/ai";
import { useReactToPrint } from "react-to-print";

const InvoiceDetail = () => {
  const contentRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef, //  v3.2.0 requires contentRef instead of content()
    documentTitle: "Invoice Detail Report",
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
        <Grid item>
          <Typography variant="h6">Invoice Detail</Typography>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AiOutlinePrinter />}
            onClick={handlePrint}
          >
            Print
          </Button>
        </Grid>
      </Grid>

      <div ref={contentRef} style={{ background: "#fff", padding: "20px" }}>
        <Card>
          <CardContent>
            <Typography variant="body2" sx={{ lineHeight: 1.8, mb:2 }}>
              <strong>TECHIE SQUAD PRIVATE LIMITED</strong>
              <br />
              CIN: U72900BR2019PTC042431
              <br />
              RK NIWAS, GOLA ROAD MOR, BAILEY ROAD
              <br />
              DANAPUR, PATNA-801503, BIHAR, INDIA
              <br />
              GSTIN: 10AAHCT3899A1ZI
            </Typography>

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
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default InvoiceDetail;
