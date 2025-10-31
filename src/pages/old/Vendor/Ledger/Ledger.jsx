import React, { useRef } from "react";
import { Grid, Button, Typography, Card, CardContent } from "@mui/material";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { AiOutlinePrinter } from "react-icons/ai";
import { useReactToPrint } from "react-to-print";

const Ledger = () => {
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
          <Typography variant="h6">Ledger</Typography>
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
            <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
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

            <Table style={{ width: "100%", marginTop: "20px" }}>
              <Thead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Transaction Type</Th>
                  <Th>Reference</Th>
                  <Th>Vendor</Th>
                  <Th>Debit</Th>
                  <Th>Credit</Th>
                  <Th>Balance</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td>15/09/2025</Td>
                  <Td>Purchase Order</Td>
                  <Td>PO-1234</Td>
                  <Td>Techiesquad PVT LTD</Td>
                  <Td>125000</Td>
                  <Td>0</Td>
                  <Td>125000</Td>
                </Tr>
                <Tr>
                  <Td>15/09/2025</Td>
                  <Td>Payment</Td>
                  <Td>PAY098</Td>
                  <Td>Techiesquad PVT LTD</Td>
                  <Td>0</Td>
                  <Td>125000</Td>
                  <Td>0</Td>
                </Tr>
              </Tbody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Ledger;
