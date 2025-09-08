import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "./GroceryInvoiceApp.css";

// Custom Popup Component
const CustomPopup = ({ isOpen, onClose, type, title, message, onConfirm, showConfirm = false }) => {
  if (!isOpen) return null;

  const getPopupIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  const getPopupClass = () => {
    switch (type) {
      case 'success':
        return 'popup-success';
      case 'error':
        return 'popup-error';
      case 'warning':
        return 'popup-warning';
      case 'info':
        return 'popup-info';
      default:
        return 'popup-info';
    }
  };

  return (
    <div className="popup-overlay">
      <div className={`popup-container ${getPopupClass()}`}>
        <div className="popup-header">
          <div className="popup-icon">{getPopupIcon()}</div>
          <h3 className="popup-title">{title}</h3>
        </div>
        <div className="popup-content">
          <p className="popup-message">{message}</p>
        </div>
        <div className="popup-actions">
          {showConfirm ? (
            <>
              <button className="popup-btn popup-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button className="popup-btn popup-btn-confirm" onClick={onConfirm}>
                OK
              </button>
            </>
          ) : (
            <button className="popup-btn popup-btn-primary" onClick={onClose}>
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

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
  const [selectItemError, setSelectItemError] = useState(null);
  const [addItemError, setAddItemError] = useState(null);
  const [addItemSuccess, setAddItemSuccess] = useState(null);
  
  // Popup states
  const [popup, setPopup] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
    showConfirm: false
  });
  
  // Validation states
  const [validationErrors, setValidationErrors] = useState({
    name: "",
    phone: "",
    address: "",
  });

  // New item validation states
  const [newItemValidationErrors, setNewItemValidationErrors] = useState({
    name: "",
    price: "",
    stock: "",
  });

  useEffect(() => {
    fetchGroceryItems();
  }, []);

  // Custom popup functions
  const showPopup = (type, title, message, onConfirm = null, showConfirm = false) => {
    setPopup({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      showConfirm
    });
  };

  const closePopup = () => {
    setPopup({
      isOpen: false,
      type: 'info',
      title: '',
      message: '',
      onConfirm: null,
      showConfirm: false
    });
  };

  const fetchGroceryItems = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/grocery-items');
      if (!response.ok) throw new Error('Failed to fetch grocery items');
      const data = await response.json();
      setGroceryList(data);
      setError(null);
      setSelectItemError(null);
    } catch (error) {
      setSelectItemError('Unable to load grocery items. Please check your connection and try again.');
      showPopup('error', 'Connection Error', 'Unable to load grocery items. Please check your connection and try again.');
      console.error('Error fetching grocery items:', error);
    }
  };

  // Validation functions
  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!name.trim()) {
      return "Name is required";
    }
    if (name.trim().length < 2) {
      return "Name must be at least 2 characters long";
    }
    if (name.trim().length > 50) {
      return "Name must not exceed 50 characters";
    }
    if (!nameRegex.test(name.trim())) {
      return "Name should only contain letters and spaces";
    }
    return "";
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phone.trim()) {
      return "Phone number is required";
    }
    if (!phoneRegex.test(phone.trim())) {
      return "Please enter a valid 10-digit mobile number (starting with 6-9)";
    }
    return "";
  };

  const validateAddress = (address) => {
    if (!address.trim()) {
      return "Address is required";
    }
    if (address.trim().length < 10) {
      return "Address must be at least 10 characters long";
    }
    if (address.trim().length > 200) {
      return "Address must not exceed 200 characters";
    }
    return "";
  };

  // New item validation functions
  // const validateItemName = (name) => {
  //   const itemNameRegex = /^[a-zA-Z0-9\s\-\.]+$/;
  //   if (!name.trim()) {
  //     return "Item name is required";
  //   }
  //   if (name.trim().length < 2) {
  //     return "Item name must be at least 2 characters long";
  //   }
  //   if (name.trim().length > 100) {
  //     return "Item name must not exceed 100 characters";
  //   }
  //   if (!itemNameRegex.test(name.trim())) {
  //     return "Item name can only contain letters, numbers, spaces, hyphens, and dots";
  //   }
  //   return "";
  // };
  const validateItemName = (name) => {
  const trimmedName = name.trim();

  // 1. Required
  if (!trimmedName) {
    return "Item name is required";
  }

  // 2. Min length
  if (trimmedName.length < 2) {
    return "Item name must be at least 2 characters long";
  }

  // 3. Max length
  if (trimmedName.length > 45) {
    return "Item name must not exceed 45 characters";
  }

  // 4. First 5 characters should be alphabets only
  const firstFive = trimmedName.substring(0, 5);
  if (!/^[A-Za-z]+$/.test(firstFive)) {
    return "First 5 characters must be alphabets only";
  }

  // 5. From 6th character onwards, allow letters, numbers, spaces, hyphens, and dots
  const remaining = trimmedName.substring(5);
  if (remaining && !/^[A-Za-z0-9\s\-\.]+$/.test(remaining)) {
    return "After the first 5 characters, only letters, numbers, spaces, hyphens, and dots are allowed";
  }

  return "";
};


  const validatePrice = (price) => {
    if (!price || price === "") {
      return "Price is required";
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return "Price must be a positive number";
    }
    if (priceNum > 99999.99) {
      return "Price cannot exceed ₹99,999.99";
    }
    return "";
  };

  const validateStock = (stock) => {
    if (!stock || stock === "") {
      return "Stock is required";
    }
    const stockNum = parseInt(stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      return "Stock must be a non-negative integer";
    }
    if (stockNum > 99999) {
      return "Stock cannot exceed 99,999 units";
    }
    return "";
  };

  // Handle customer info changes with validation
  const handleNameChange = (e) => {
    const value = e.target.value;
    setCustomerInfo({ ...customerInfo, name: value });
    
    const nameError = validateName(value);
    setValidationErrors(prev => ({ ...prev, name: nameError }));
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setCustomerInfo({ ...customerInfo, phone: value });
      
      const phoneError = validatePhone(value);
      setValidationErrors(prev => ({ ...prev, phone: phoneError }));
    }
  };

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setCustomerInfo({ ...customerInfo, address: value });
    
    const addressError = validateAddress(value);
    setValidationErrors(prev => ({ ...prev, address: addressError }));
  };

  // Handle new item changes with validation
  const handleNewItemNameChange = (e) => {
    const value = e.target.value;
    setNewItem({ ...newItem, name: value });
    
    const nameError = validateItemName(value);
    setNewItemValidationErrors(prev => ({ ...prev, name: nameError }));
  };

  const handleNewItemPriceChange = (e) => {
    const value = e.target.value;
    setNewItem({ ...newItem, price: value });
    
    const priceError = validatePrice(value);
    setNewItemValidationErrors(prev => ({ ...prev, price: priceError }));
  };

  const handleNewItemStockChange = (e) => {
    const value = e.target.value;
    setNewItem({ ...newItem, stock: value });
    
    const stockError = validateStock(value);
    setNewItemValidationErrors(prev => ({ ...prev, stock: stockError }));
  };

  const addGroceryItem = async () => {
    // Clear previous messages
    setAddItemError(null);
    setAddItemSuccess(null);

    // Validate all fields
    const nameError = validateItemName(newItem.name);
    const priceError = validatePrice(newItem.price);
    const stockError = validateStock(newItem.stock);

    setNewItemValidationErrors({
      name: nameError,
      price: priceError,
      stock: stockError,
    });

    if (nameError || priceError || stockError) {
      setAddItemError('Please fix the validation errors before adding the item');
      showPopup('error', 'Validation Error', 'Please fix the validation errors before adding the item');
      return;
    }

    try {
      // Convert price and stock to numbers
      const payload = {
        name: newItem.name.trim(),
        price: parseFloat(newItem.price),
        stock: parseInt(newItem.stock, 10),
      };

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
      
      // Show success popup with confirmation
      showPopup('success', 'Item Added Successfully', `Item "${payload.name}" has been added successfully to the inventory! Click OK to proceed.`, () => {
        setGroceryList([...groceryList, data.item]);
        setNewItem({ name: "", price: "", stock: "" });
        setAddItemError(null);
        setNewItemValidationErrors({ name: "", price: "", stock: "" });
        setAddItemSuccess(`Item "${payload.name}" added successfully to inventory!`);
        closePopup();
      }, true);
      
    } catch (error) {
      setAddItemError(`Error: ${error.message}`);
      showPopup('error', 'Error Adding Item', `Error: ${error.message}`);
      console.error('Error adding grocery item:', error);
    }
  };

  const addItem = () => {
    if (!selectedItem) {
      showPopup('warning', 'No Item Selected', 'Please select an item from the dropdown list!');
      return;
    }
    if (quantity < 1 || quantity > selectedItem.stock) {
      showPopup('warning', 'Invalid Quantity', `Please enter valid quantity (Available: ${selectedItem.stock})`);
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
    showPopup('success', 'Item Added', 'Item has been successfully added to cart!');
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
      showPopup('warning', 'Insufficient Stock', `Only ${availableStock} units available in stock`);
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
    setSelectItemError(null);
    setAddItemError(null);
    setAddItemSuccess(null);
    setValidationErrors({ name: "", phone: "", address: "" });
    setNewItemValidationErrors({ name: "", price: "", stock: "" });
  };

  const saveAndDownloadInvoice = async () => {
    if (items.length === 0) {
      showPopup('warning', 'No Items', 'No items to generate invoice. Please add items to the cart first.');
      return;
    }

    // Validate customer info before saving
    const nameError = validateName(customerInfo.name);
    const phoneError = validatePhone(customerInfo.phone);
    const addressError = validateAddress(customerInfo.address);

    if (nameError || phoneError || addressError) {
      setValidationErrors({ name: nameError, phone: phoneError, address: addressError });
      showPopup('error', 'Validation Error', 'Please fix the validation errors before generating the invoice');
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
      showPopup('success', 'Invoice Downloaded Successfully', `Invoice ${invoiceNumber} has been saved and downloaded successfully!`, () => {
        closePopup();
        resetInvoice();
      }, true);
      
    } catch (error) {
      setError(`Error: ${error.message}`);
      showPopup('error', 'Invoice Creation Error', `Error: ${error.message}`);
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
      
      {/* Custom Popup */}
      <CustomPopup
        isOpen={popup.isOpen}
        onClose={closePopup}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onConfirm={popup.onConfirm}
        showConfirm={popup.showConfirm}
      />
      
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
                <div className="input-container">
                  <input
                    type="text"
                    placeholder="Customer Name *"
                    value={customerInfo.name}
                    onChange={handleNameChange}
                    className={`form-input ${validationErrors.name ? 'error' : ''}`}
                    required
                  />
                  {validationErrors.name && (
                    <div className="validation-error">{validationErrors.name}</div>
                  )}
                </div>
                <div className="input-container">
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    value={customerInfo.phone}
                    onChange={handlePhoneChange}
                    maxLength="10"
                    className={`form-input ${validationErrors.phone ? 'error' : ''}`}
                    required
                  />
                  {validationErrors.phone && (
                    <div className="validation-error">{validationErrors.phone}</div>
                  )}
                </div>
                <div className="input-container">
                  <textarea
                    placeholder="Address *"
                    value={customerInfo.address}
                    onChange={handleAddressChange}
                    className={`form-textarea ${validationErrors.address ? 'error' : ''}`}
                    required
                  />
                  {validationErrors.address && (
                    <div className="validation-error">{validationErrors.address}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="add-item-card">
              <h2 className="section-title">Add New Grocery Item</h2>
              {addItemError && <div className="component-error-message">{addItemError}</div>}
              {addItemSuccess && <div className="component-success-message">{addItemSuccess}</div>}
              <div className="form-group">
                <div className="input-container">
                  <input
                    type="text"
                    placeholder="Item Name *"
                    value={newItem.name}
                    onChange={handleNewItemNameChange}
                    className={`form-input ${newItemValidationErrors.name ? 'error' : ''}`}
                    required
                  />
                  {newItemValidationErrors.name && (
                    <div className="validation-error">{newItemValidationErrors.name}</div>
                  )}
                </div>
                <div className="input-container">
                  <input
                    type="number"
                    placeholder="Price (₹) *"
                    value={newItem.price}
                    onChange={handleNewItemPriceChange}
                    className={`form-input ${newItemValidationErrors.price ? 'error' : ''}`}
                    min="0.01"
                    step="0.01"
                    required
                  />
                  {newItemValidationErrors.price && (
                    <div className="validation-error">{newItemValidationErrors.price}</div>
                  )}
                </div>
                <div className="input-container">
                  <input
                    type="number"
                    placeholder="Stock *"
                    value={newItem.stock}
                    onChange={handleNewItemStockChange}
                    className={`form-input ${newItemValidationErrors.stock ? 'error' : ''}`}
                    min="0"
                    step="1"
                    required
                  />
                  {newItemValidationErrors.stock && (
                    <div className="validation-error">{newItemValidationErrors.stock}</div>
                  )}
                </div>
                <button onClick={addGroceryItem} className="add-btn">
                  <span className="btn-icon">➕</span>
                  <span>Add Item to Inventory</span>
                </button>
              </div>
            </div>

            <div className="add-item-card">
              <h2 className="section-title">Select Item</h2>
              {selectItemError && <div className="component-error-message">{selectItemError}</div>}
              <div className="form-group">
                <select
                  className="form-input"
                  value={selectedItem ? selectedItem.id : ""}
                  onChange={(e) =>
                    setSelectedItem(
                      groceryList.find((g) => g.id === parseInt(e.target.value))
                    )
                  }
                  disabled={selectItemError}
                >
                  <option value="">
                    {selectItemError ? "Unable to load items" : "-- Select Grocery Item --"}
                  </option>
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
                    disabled={selectItemError}
                  />
                  <input
                    type="number"
                    placeholder="Price (₹)"
                    value={selectedItem ? selectedItem.price : ""}
                    readOnly
                    className="form-input half-width"
                  />
                </div>
                <button 
                  onClick={addItem} 
                  className="add-btn"
                  disabled={selectItemError}
                >
                  <span className="btn-icon">➕</span>
                  <span>Add to Cart</span>
                </button>
                {selectItemError && (
                  <button onClick={fetchGroceryItems} className="retry-btn">
                    <span className="btn-icon">🔄</span>
                    <span>Retry Loading Items</span>
                  </button>
                )}
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
                           