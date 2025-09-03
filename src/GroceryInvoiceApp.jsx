
import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "./GroceryInvoiceApp.css";

const GroceryInvoiceApp = () => {
  const [groceryList, setGroceryList] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    stock: "",
  });
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now()}`);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGroceryItems();
  }, []);

  const fetchGroceryItems = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/grocery-items');
      if (!response.ok) throw new Error('Failed to fetch grocery items');
      const data = await response.json();
      setGroceryList(data);
      setError(null);
    } catch (error) {
      setError('Error fetching grocery items. Please try again.');
      console.error('Error fetching grocery items:', error);
    }
  };

  const addGroceryItem = async () => {
    try {
      // Convert price and stock to numbers
      const payload = {
        name: newItem.name.trim(),
        price: parseFloat(newItem.price),
        stock: parseInt(newItem.stock, 10),
      };

      // Client-side validation
      if (!payload.name) {
        throw new Error('Name is required');
      }
      if (isNaN(payload.price) || payload.price <= 0) {
        throw new Error('Price must be a positive number');
      }
      if (isNaN(payload.stock) || payload.stock < 0) {
        throw new Error('Stock must be a non-negative integer');
      }

      const response = await fetch('http://localhost:5000/api/add-grocery-items-in-store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add grocery item');
      }

      const data = await response.json();
      setGroceryList([...groceryList, data.item]);
      setNewItem({ name: "", price: "", stock: "" });
      setError(null);
    } catch (error) {
      setError(`Error: ${error.message}`);
      console.error('Error adding grocery item:', error);
    }
  };

  const addItem = () => {
    if (!selectedItem) {
      alert("Please select an item!");
      return;
    }
    if (quantity < 1 || quantity > selectedItem.stock) {
      alert(`Please enter valid quantity (Available: ${selectedItem.stock})`);
      return;
    }

    const existingItem = items.find((i) => i.id === selectedItem.id);

    if (existingItem) {
      const updatedItems = items.map((i) =>
        i.id === selectedItem.id
          ? {
              ...i,
              quantity: i.quantity + quantity,
              total: (i.quantity + quantity) * i.price,
            }
          : i
      );
      setItems(updatedItems);
    } else {
      const newItem = {
        id: selectedItem.id,
        name: selectedItem.name,
        price: selectedItem.price,
        quantity,
        total: quantity * selectedItem.price,
      };
      setItems([...items, newItem]);
    }

    setGroceryList(
      groceryList.map((g) =>
        g.id === selectedItem.id ? { ...g, stock: g.stock - quantity } : g
      )
    );

    setSelectedItem(null);
    setQuantity(1);
  };

  const removeItem = (id) => {
    const itemToRemove = items.find((i) => i.id === id);
    if (!itemToRemove) return;

    setGroceryList(
      groceryList.map((g) =>
        g.id === id ? { ...g, stock: g.stock + itemToRemove.quantity } : g
      )
    );

    setItems(items.filter((i) => i.id !== id));
  };

  const updateItemQuantity = (id, newQty) => {
    if (newQty < 1) return;

    const itemToUpdate = items.find((i) => i.id === id);
    if (!itemToUpdate) return;

    const stockItem = groceryList.find((g) => g.id === id);
    const availableStock = stockItem
      ? stockItem.stock + itemToUpdate.quantity
      : 0;

    if (newQty > availableStock) {
      alert(`Only ${availableStock} units available in stock`);
      return;
    }

    setGroceryList(
      groceryList.map((g) =>
        g.id === id ? { ...g, stock: availableStock - newQty } : g
      )
    );

    setItems(
      items.map((i) =>
        i.id === id ? { ...i, quantity: newQty, total: newQty * i.price } : i
      )
    );
  };

  const calculateSubtotal = () =>
    items.reduce((sum, item) => sum + item.total, 0);
  const calculateTax = () => calculateSubtotal() * 0.18;
  const calculateTotal = () => calculateSubtotal() + calculateTax();

  const resetInvoice = () => {
    fetchGroceryItems();
    setItems([]);
    setCustomerInfo({ name: "", phone: "", address: "" });
    setInvoiceNumber(`INV-${Date.now()}`);
    setError(null);
  };

  const saveAndDownloadInvoice = async () => {
    if (items.length === 0) {
      alert("No items to generate invoice");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: customerInfo,
          items,
          invoiceNumber,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create invoice');
      }

      generatePdf();
      resetInvoice();
    } catch (error) {
      setError(`Error: ${error.message}`);
      console.error('Error creating invoice:', error);
    }
  };

  const generatePdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("FreshMart Grocery", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text("TAX INVOICE", 105, 30, { align: "center" });

    doc.setFontSize(10);
    doc.text(`Invoice No: ${invoiceNumber}`, 14, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 57);
    doc.text(`Customer: ${customerInfo.name}`, 14, 70);
    doc.text(`Phone: ${customerInfo.phone}`, 14, 77);
    doc.text(`Address: ${customerInfo.address}`, 14, 84);

    const tableColumn = [
      "Item",
      "Quantity",
      "Unit Price (₹)",
      "Tax (18%)",
      "Total (₹)",
    ];
    const tableRows = items.map((item) => [
      item.name,
      item.quantity,
      item.price.toFixed(2),
      (item.total * 0.18).toFixed(2),
      item.total.toFixed(2),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 100,
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Subtotal: ₹${calculateSubtotal().toFixed(2)}`, 14, finalY);
    doc.text(`Tax (18% GST): ₹${calculateTax().toFixed(2)}`, 14, finalY + 7);
    doc.setFontSize(12);
    doc.text(`Total: ₹${calculateTotal().toFixed(2)}`, 14, finalY + 15);

    doc.save(`Invoice-${invoiceNumber}.pdf`);
  };

  return (
    <div className="app-container">
      {error && <div className="error-message text-red-500 text-center mb-4">{error}</div>}
      <div className="main-wrapper">
        <div className="header-card">
          <div className="header-content">
            <div className="brand-section">
              <div className="brand-icon">
                <div className="icon">🛒</div>
              </div>
              <div className="brand-info">
                <h1 className="brand-title">FreshMart Grocery</h1>
                <p className="brand-subtitle">Invoice Management System</p>
              </div>
            </div>
            <div className="invoice-info">
              <div className="invoice-label">Invoice #</div>
              <div className="invoice-number">{invoiceNumber}</div>
              <div className="date-info">
                <span className="date-icon">📅</span>
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        <div className="content-grid">
          <div className="left-panel">
            <div className="customer-card">
              <div className="section-header">
                <span className="section-icon">👤</span>
                <h2 className="section-title">Customer Details</h2>
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={customerInfo.name}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, name: e.target.value })
                  }
                  className="form-input"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={customerInfo.phone}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, phone: e.target.value })
                  }
                  className="form-input"
                />
                <textarea
                  placeholder="Address"
                  value={customerInfo.address}
                  onChange={(e) =>
                    setCustomerInfo({
                      ...customerInfo,
                      address: e.target.value,
                    })
                  }
                  className="form-textarea"
                />
              </div>
            </div>

            <div className="add-item-card">
              <h2 className="section-title">Add New Grocery Item</h2>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Item Name"
                  value={newItem.name}
                  onChange={(e) =>
                    setNewItem({ ...newItem, name: e.target.value })
                  }
                  className="form-input"
                />
                <input
                  type="number"
                  placeholder="Price (₹)"
                  value={newItem.price}
                  onChange={(e) =>
                    setNewItem({ ...newItem, price: e.target.value })
                  }
                  className="form-input"
                  min="0.01"
                  step="0.01"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={newItem.stock}
                  onChange={(e) =>
                    setNewItem({ ...newItem, stock: e.target.value })
                  }
                  className="form-input"
                  min="0"
                  step="1"
                />
                <button onClick={addGroceryItem} className="add-btn">
                  <span className="btn-icon">➕</span>
                  <span>Add Item to Inventory</span>
                </button>
              </div>
            </div>

            <div className="add-item-card">
              <h2 className="section-title">Select Item</h2>
              <div className="form-group">
                <select
                  className="form-input"
                  value={selectedItem ? selectedItem.id : ""}
                  onChange={(e) =>
                    setSelectedItem(
                      groceryList.find((g) => g.id === parseInt(e.target.value))
                    )
                  }
                >
                  <option value="">-- Select Grocery Item --</option>
                  {groceryList.map((g) => (
                    <option key={g.id} value={g.id} disabled={g.stock === 0}>
                      {g.name} - ₹{g.price} ({g.stock} in stock)
                    </option>
                  ))}
                </select>

                <div className="input-row">
                  <input
                    type="number"
                    placeholder="Quantity"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="form-input half-width"
                  />
                  <input
                    type="number"
                    placeholder="Price (₹)"
                    value={selectedItem ? selectedItem.price : ""}
                    readOnly
                    className="form-input half-width"
                  />
                </div>
                <button onClick={addItem} className="add-btn">
                  <span className="btn-icon">➕</span>
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          </div>

          <div className="right-panel">
            <div className="invoice-card">
              <div className="invoice-header">
                <div className="invoice-title-section">
                  <div className="invoice-title-wrapper">
                    <span className="title-icon">🧾</span>
                    <h2 className="invoice-title">Invoice Preview</h2>
                  </div>
                  <div className="action-buttons">
                    <button onClick={resetInvoice} className="reset-btn">
                      Reset
                    </button>
                    <button onClick={saveAndDownloadInvoice} className="generate-btn">
                      Save & Download Invoice
                    </button>
                  </div>
                </div>
                {customerInfo.name && (
                  <div className="customer-details">
                    <h3 className="details-title">Bill To:</h3>
                    <p className="customer-name">{customerInfo.name}</p>
                    {customerInfo.phone && (
                      <p className="customer-phone">{customerInfo.phone}</p>
                    )}
                    {customerInfo.address && (
                      <p className="customer-address">{customerInfo.address}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="invoice-body">
                {items.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🛒</div>
                    <p className="empty-title">No items added yet</p>
                    <p className="empty-subtitle">
                      Select items to start creating your invoice
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="table-container">
                      <table className="items-table">
                        <thead>
                          <tr className="table-header">
                            <th className="th-item">Item</th>
                            <th className="th-qty">Qty</th>
                            <th className="th-price">Price</th>
                            <th className="th-total">Total</th>
                            <th className="th-action"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item) => (
                            <tr key={item.id} className="table-row">
                              <td className="td-item">
                                <div className="item-name">{item.name}</div>
                              </td>
                              <td className="td-qty">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateItemQuantity(
                                      item.id,
                                      parseInt(e.target.value) || 1
                                    )
                                  }
                                  className="qty-input"
                                />
                              </td>
                              <td className="td-price">
                                ₹{item.price.toFixed(2)}
                              </td>
                              <td className="td-total">
                                ₹{item.total.toFixed(2)}
                              </td>
                              <td className="td-action">
                                <button
                                  onClick={() => removeItem(item.id)}
                                  className="delete-btn"
                                  title="Remove item"
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="invoice-summary p-6 bg-gray-50 border-t border-gray-200">
                      <div className="summary-container max-w-2xl mx-auto">
                        <div className="summary-row flex justify-between py-2">
                          <span className="text-gray-600 font-medium">
                            Subtotal:
                          </span>
                          <span className="text-gray-800">
                            ₹{calculateSubtotal().toFixed(2)}
                          </span>
                        </div>
                        <div className="summary-row flex justify-between py-2">
                          <span className="text-gray-600 font-medium">
                            Tax (18% GST):
                          </span>
                          <span className="text-gray-800">
                            ₹{calculateTax().toFixed(2)}
                          </span>
                        </div>
                        <div className="summary-total mt-4 pt-2 border-t border-gray-300">
                          <div className="total-row flex justify-between py-2">
                            <span className="text-lg font-semibold text-gray-800">
                              Total:
                            </span>
                            <span className="text-lg font-semibold text-gray-800">
                              ₹{calculateTotal().toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroceryInvoiceApp;