import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  Typography,
  Card,
  CardContent,
  Box,
  TextField,
  IconButton,
} from "@mui/material";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { Autocomplete } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { editPO, updatePO } from "../slice/purchaseOrderSlice";
import { fetchActiveMaterials } from "../../settings/slices/materialSlice";
import DeleteIcon from "@mui/icons-material/Delete";
import { Formik, Form, FieldArray } from "formik";
import * as Yup from "yup";

const PurchaseOrderQC = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { selected: po = {}, loading = true } = useSelector(
    (state) => state.purchaseOrder
  );
  const { data: materials = [] } = useSelector((state) => state.material);

  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (id) dispatch(editPO(id));
    dispatch(fetchActiveMaterials());
  }, [dispatch, id]);

  const initialItems = po.material_items
    ? Array.isArray(po.material_items)
      ? po.material_items
      : JSON.parse(po.material_items)
    : [];

  const validationSchema = Yup.object().shape({
    invoice_no: Yup.string().required("Invoice number is required"),
    invoice_date: Yup.date().required("Invoice date is required"),
    items: Yup.array()
      .of(
        Yup.object().shape({
          name: Yup.string().required("Item name is required"),
          qty: Yup.number().positive().required("Qty required"),
          rate: Yup.number().positive().required("Rate required"),
        })
      )
      .min(1, "At least one item is required"),
  });

  // <-- FIX: make sure all totals are numeric (fallback 0)
  const calculateTotals = (items) => {
    const subtotal = items.reduce((acc, item) => {
      // coerce item.total (or computed qty*rate) to Number safely
      const t =
        item && item.total != null
          ? Number(item.total)
          : Number((Number(item.qty) || 0) * (Number(item.rate) || 0));
      return acc + (isNaN(t) ? 0 : t);
    }, 0);

    const gstPer = Number(po.gst_per || 0);
    const discount = Number(po.discount || 0);
    const additional = Number(po.cariage_amount || 0);

    const gstAmount = Number(((subtotal - discount) * gstPer) / 100) || 0;
    const grandTotal = Number(subtotal - discount + additional + gstAmount) || 0;

    return {
      subtotal: Number(isNaN(subtotal) ? 0 : subtotal),
      gstAmount: Number(isNaN(gstAmount) ? 0 : gstAmount),
      grandTotal: Number(isNaN(grandTotal) ? 0 : grandTotal),
    };
  };
  // -->

  const handlePrintClick = () => {
    navigate("/vendor/purchase-order/print/" + id);
  };

  return (
    <>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid>
          <Typography variant="h6">Purchase Order QC</Typography>
        </Grid>
      </Grid>

      <Grid container spacing={1} sx={{ mb: 2 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Formik
                enableReinitialize
                initialValues={{
                  invoice_no: po.invoice_no || "",
                  invoice_date: po.invoice_date || "",
                  items: initialItems || [],
                }}
                validationSchema={validationSchema}
                onSubmit={async (values, { setSubmitting }) => {
                  const totals = calculateTotals(values.items || []);
                  const payload = {
                    ...po,
                    invoice_no: values.invoice_no,
                    invoice_date: values.invoice_date,
                    material_items: JSON.stringify(values.items || []),
                    subtotal: totals.subtotal,
                    gst_amount: totals.gstAmount,
                    grand_total: totals.grandTotal,
                  };

                  await dispatch(updatePO(payload));
                  setSubmitting(false);
                }}
              >
                {({
                  values,
                  errors,
                  touched,
                  handleChange,
                  handleSubmit,
                  setFieldValue,
                  isSubmitting,
                }) => {
                  const totals = calculateTotals(values.items || []);

                  return (
                    <Form onSubmit={handleSubmit}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 2,
                        }}
                      >
                        <Typography variant="h6">
                          Purchase Order: {po.purchase_no}
                        </Typography>
                        <Button
                          variant="contained"
                          color="warning"
                          onClick={handlePrintClick}
                        >
                          Mark QC Done & Print QC Report
                        </Button>
                      </Box>

                      <Typography variant="body2" sx={{ mb: 2 }}>
                        <b>{po.vendor?.name}</b>
                        <br />
                        {po.vendor?.address}
                        <br />
                        GSTIN: {po.vendor?.gst}
                        <br />
                        Date: {po.order_date}
                      </Typography>

                      {/* Invoice Fields */}
                      <Box
                        sx={{
                          display: "flex",
                          gap: 3,
                          alignItems: "center",
                          mb: 3,
                          flexWrap: "wrap",
                        }}
                      >
                        <TextField
                          label="Invoice No"
                          name="invoice_no"
                          size="small"
                          value={values.invoice_no}
                          onChange={handleChange}
                          error={
                            touched.invoice_no && Boolean(errors.invoice_no)
                          }
                          helperText={touched.invoice_no && errors.invoice_no}
                        />

                        <TextField
                          label="Invoice Date"
                          name="invoice_date"
                          type="date"
                          size="small"
                          value={values.invoice_date}
                          onChange={handleChange}
                          InputLabelProps={{ shrink: true }}
                          error={
                            touched.invoice_date && Boolean(errors.invoice_date)
                          }
                          helperText={
                            touched.invoice_date && errors.invoice_date
                          }
                        />
                      </Box>

                      {/* Item Table with FieldArray */}
                      <FieldArray name="items">
                        {({ remove, push }) => (
                          <>
                            {/* Add Item Row */}
                            <Box
                              sx={{
                                display: "flex",
                                gap: 2,
                                alignItems: "flex-end",
                                mb: 3,
                              }}
                            >
                              <Autocomplete
                                options={materials}
                                value={selectedItem}
                                onChange={(e, val) => setSelectedItem(val)}
                                size="small"
                                getOptionLabel={(option) => option?.name || ""}
                                renderInput={(params) => (
                                  <TextField {...params} label="Select Material" />
                                )}
                                sx={{ width: 300 }}
                              />
                              <TextField label="Qty" size="small" type="number" id="newQty" />
                              <Button
                                variant="contained"
                                onClick={() => {
                                  const qty = Number(
                                    document.getElementById("newQty").value
                                  );
                                  if (!selectedItem || !qty || qty <= 0) return;

                                  push({
                                    id: Date.now(),
                                    name: selectedItem.name,
                                    size: selectedItem.size || "-",
                                    uom: selectedItem.uom || "-",
                                    rate: Number(selectedItem.rate || 0),
                                    qty: qty,
                                    total: Number(qty) * Number(selectedItem.rate || 0),
                                  });
                                  setSelectedItem(null);
                                  document.getElementById("newQty").value = "";
                                }}
                              >
                                Add Item
                              </Button>
                            </Box>

                            {/* Items Table */}
                            <Table>
                              <Thead>
                                <Tr>
                                  <Th>Item</Th>
                                  <Th>Qty</Th>
                                  <Th>Rate</Th>
                                  <Th>Total</Th>
                                  <Th style={{ textAlign: "center" }}>Action</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {values.items.map((item, index) => (
                                  <Tr key={item.id ?? index}>
                                    <Td>{item.name}</Td>
                                    <Td>
                                      <TextField
                                        type="number"
                                        size="small"
                                        value={item.qty}
                                        onChange={(e) => {
                                          const qty = Number(e.target.value) || 0;
                                          const total = Number(qty) * Number(item.rate || 0);
                                          setFieldValue(`items.${index}.qty`, qty);
                                          setFieldValue(`items.${index}.total`, total);
                                        }}
                                        sx={{ width: 80 }}
                                      />
                                    </Td>
                                    <Td>
                                      <TextField
                                        type="number"
                                        size="small"
                                        value={item.rate}
                                        onChange={(e) => {
                                          const rate = Number(e.target.value) || 0;
                                          const total = Number(item.qty || 0) * rate;
                                          setFieldValue(`items.${index}.rate`, rate);
                                          setFieldValue(`items.${index}.total`, total);
                                        }}
                                        sx={{ width: 100 }}
                                      />
                                    </Td>
                                    <Td>{(Number(item.total) || 0).toFixed(2)}</Td>
                                    <Td align="center">
                                      <IconButton color="error" onClick={() => remove(index)}>
                                        <DeleteIcon />
                                      </IconButton>
                                    </Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                          </>
                        )}
                      </FieldArray>

                      {/* Totals - defensive formatting */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                          width: "300px",
                          ml: "auto",
                          mt: 3,
                        }}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <span>Sub Total</span>
                          <span>{(Number(totals.subtotal) || 0).toFixed(2)}</span>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <span>GST ({po.gst_per || 0}%)</span>
                          <span>{(Number(totals.gstAmount) || 0).toFixed(2)}</span>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontWeight: 600,
                            borderTop: "1px solid #222",
                            pt: 1,
                          }}
                        >
                          <span>Grand Total</span>
                          <span>{(Number(totals.grandTotal) || 0).toFixed(2)}</span>
                        </Box>
                      </Box>

                      <Box sx={{ textAlign: "right", mt: 3 }}>
                        <Button variant="contained" color="primary" type="submit" disabled={isSubmitting}>
                          Save QC Update
                        </Button>
                      </Box>
                    </Form>
                  );
                }}
              </Formik>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default PurchaseOrderQC;
