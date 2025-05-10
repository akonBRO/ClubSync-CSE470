import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
// Import desired icons (example using Font Awesome)
import { FaPlus, FaTrash, FaSave, FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaHourglassHalf, FaLock, FaTasks } from 'react-icons/fa';
import './BudgetPage.css'; // We will heavily modify this file

const BudgetPage = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // --- useEffect hook (NO CHANGES) ---
  useEffect(() => {
    const fetchEventAndBudget = async () => {
      setIsLoading(true);
      setError('');
      setSuccess('');
      try {
        const eventRes = await axios.get(`http://localhost:3001/api/events/booking/${eventId}`);
        setEvent(eventRes.data.event);
        try {
          const budgetRes = await axios.get(`http://localhost:3001/api/budgets/by-booking/${eventId}`);
          if (budgetRes.data.budget) {
            setItems(budgetRes.data.budget.items || []);
            setStatus(budgetRes.data.budget.status);
          } else {
            setItems([]);
            setStatus('pending');
          }
        } catch (budgetErr) {
          console.error('Error fetching budget details:', budgetErr);
          if (!budgetErr.response || budgetErr.response.status !== 404) {
            setError('Failed to load budget details. Please try refreshing.');
          } else {
            if (isLoading) {
              setItems([]);
              setStatus('pending');
            } else {
              console.log("Budget fetch returned 404 after initial load.");
              setError("Couldn't re-fetch budget details (Not Found).");
            }
          }
        }
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError('Failed to load event data.');
        setEvent(null);
        setItems([]);
        setStatus('pending');
      } finally {
        setIsLoading(false);
      }
    };
    if (eventId) {
      fetchEventAndBudget();
    } else {
      setIsLoading(false);
      setError("Event ID is missing.");
    }
  }, [eventId, isLoading]); // Added isLoading to dependency array for the error handling logic inside catch

  // --- Handlers (NO CHANGES) ---
  const handleAddItem = () => {
    setItems([
      ...items,
      { category: 'Food', item_name: '', quantity: 1, unit_price: 0, total_price: 0 },
    ]);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    let safeValue = value;
    // Ensure numeric fields don't get invalid values temporarily
    if (field === 'quantity' || field === 'unit_price') {
        safeValue = Number(value) || 0; // Default to 0 if NaN
        if (field === 'quantity' && safeValue < 1) safeValue = 1; // Enforce min 1 for quantity
        if (field === 'unit_price' && safeValue < 0) safeValue = 0; // Enforce min 0 for price
    }
    updatedItems[index][field] = safeValue;

    // Recalculate total_price immediately
    const quantity = Number(updatedItems[index].quantity) || 0;
    const unit_price = Number(updatedItems[index].unit_price) || 0;
    updatedItems[index].total_price = quantity * unit_price;

    setItems(updatedItems);
  };


  const handleRemoveItem = (index) => {
    const updatedItems = items.filter((_, idx) => idx !== index);
    setItems(updatedItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    for (let item of items) {
      const quantity = Number(item.quantity);
      const unit_price = Number(item.unit_price);
      if (!item.category || !item.item_name || isNaN(quantity) || quantity <= 0 || isNaN(unit_price) || unit_price < 0) {
        setError('Please fill out all item fields correctly (quantity > 0, unit price >= 0).');
        return;
      }
    }
    if (!event?._id) {
      setError('Cannot submit budget: Event ID is missing.');
      return;
    }
    // Add loading indicator for submission
    setIsLoading(true);
    try {
      const res = await axios.post(`http://localhost:3001/api/budgets/${event._id}`, { items });
      setSuccess('Budget submitted successfully.');
      setItems(res.data.budget.items || []);
      setStatus(res.data.budget.status);
    } catch (err) {
      console.error('Error submitting budget:', err);
      setError(err.response?.data?.message || 'Failed to submit budget.');
    } finally {
        setIsLoading(false); // Stop loading after submission attempt
    }
  };

  // --- Calculations (NO CHANGES) ---
  const totalBudget = items.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);

  // --- Render Logic ---
  if (isLoading && !event) { // Show initial loading state
    return <div className="loading-container"><FaHourglassHalf className="spinner" /> Loading Event & Budget...</div>;
  }

  // Helper function for status badge
  const renderStatusBadge = () => {
    let icon = <FaInfoCircle />;
    let text = status.charAt(0).toUpperCase() + status.slice(1); // Capitalize
    let className = 'status-badge ';

    switch (status) {
      case 'pending':
        icon = <FaTasks />;
        className += 'pending';
        text = 'Pending Input';
        break;
      case 'hold':
        icon = <FaHourglassHalf />;
        className += 'hold';
        text = 'Submitted / In Review';
        break;
      case 'approved':
        icon = <FaCheckCircle />;
        className += 'approved';
        text = 'Budget Accepted';
        break;
      case 'rejected':
        icon = <FaExclamationTriangle />;
        className += 'rejected';
        text = 'Budget Rejected';
        break;
      default:
        className += 'unknown';
    }

    return (
      <span className={className}>
        {icon} {text}
      </span>
    );
  };

  return (
    <div className="budget-container">
      <header className="budget-header">
        <h1>Budget for: <span className="event-name">{event?.event_name || '...'}</span></h1>
        <div className="status-section">
          Status: {renderStatusBadge()}
        </div>
      </header>

      {/* Alerts Area */}
      {error && <div className="alert alert-error"><FaExclamationTriangle /> {error}</div>}
      {success && <div className="alert alert-success"><FaCheckCircle /> {success}</div>}

      {/* Loading overlay during submit */}
      {isLoading && status !== 'pending' && <div className="loading-overlay"><FaHourglassHalf className="spinner" /> Processing...</div>}

      {/* Main Content Area */}
      <div className="budget-content">
        {status === 'pending' ? (
          // --- Editable Form ---
          <form onSubmit={handleSubmit} className="budget-form">
            <div className="table-responsive">
              <table className="budget-table editable">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Item Name</th>
                    <th className="col-quantity">Quantity</th>
                    <th className="col-price">Unit Price (৳)</th>
                    <th className="col-price">Total Price (৳)</th>
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td data-label="Category">
                        <select
                          value={item.category}
                          onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                          required
                          className="form-input form-select"
                        >
                          <option value="" disabled>Choose...</option>
                          <option value="Food">Food</option>
                          <option value="Logistic">Logistic</option>
                          <option value="Transport">Transport</option>
                          <option value="Other">Other</option>
                        </select>
                      </td>
                      <td data-label="Item Name">
                        <input
                          type="text"
                          value={item.item_name}
                          placeholder="e.g., Venue Rent"
                          onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                          required
                          className="form-input"
                        />
                      </td>
                      <td data-label="Quantity">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          min="1"
                          required
                          className="form-input"
                          step="any"
                        />
                      </td>
                      <td data-label="Unit Price ($)">
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                          min="0"
                          required
                          className="form-input"
                          step="0.01"
                        />
                      </td>
                      <td data-label="Total Price ($)">
                        <span className="price-display">
                          {(Number(item.quantity || 0) * Number(item.unit_price || 0)).toFixed(2)}
                        </span>
                      </td>
                      <td data-label="Actions">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="btn btn-danger btn-icon"
                          title="Remove Item" // Tooltip for icon button
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                   {/* Show message if no items */}
                   {items.length === 0 && (
                      <tr>
                          <td colSpan="6" className="no-items-row">
                              No items added yet. Click "Add Item" to start.
                          </td>
                      </tr>
                   )}
                </tbody>
              </table>
            </div>

            {/* Form Actions & Summary */}
            <div className="budget-form-footer">
                <button
                    type="button"
                    onClick={handleAddItem}
                    className="btn btn-secondary btn-add-item"
                    disabled={isLoading} // Disable while submitting
                >
                    <FaPlus /> Add Item
                </button>
                <div className="budget-summary">
                    <h3>Grand Total:</h3>
                    <span className="total-amount">৳{totalBudget.toFixed(2)}</span>
                </div>
                <button
                    type="submit"
                    className="btn btn-primary btn-submit"
                    disabled={items.length === 0 || isLoading} // Disable if no items or submitting
                >
                    <FaSave /> Submit Budget
                </button>
            </div>
          </form>
        ) : (
          // --- Read-Only View ---
          <div className="budget-readonly">
            <p className="readonly-info">
              <FaLock /> Budget has been submitted and is currently <strong>{status}</strong>. Editing is disabled.
            </p>
            <h4>Submitted Items:</h4>
            {items.length > 0 ? (
              <div className="table-responsive">
                  <table className="budget-table readonly">
                      <thead>
                          <tr>
                              <th>Category</th>
                              <th>Item</th>
                              <th className="col-quantity">Qty</th>
                              <th className="col-price">Unit Price (৳)</th>
                              <th className="col-price">Total (৳)</th>
                          </tr>
                      </thead>
                      <tbody>
                          {items.map((item, idx) => (
                              <tr key={`display-${idx}`}>
                                  <td data-label="Category">{item.category}</td>
                                  <td data-label="Item">{item.item_name}</td>
                                  <td data-label="Qty">{item.quantity}</td>
                                  <td data-label="Unit Price ($)">{(Number(item.unit_price) || 0).toFixed(2)}</td>
                                  <td data-label="Total ($)">{(Number(item.total_price) || 0).toFixed(2)}</td>
                              </tr>
                          ))}
                      </tbody>
                      <tfoot>
                          <tr>
                              <td colSpan="4" className="total-label"><strong>Grand Total:</strong></td>
                              <td data-label="Grand Total ($)"><strong>৳{totalBudget.toFixed(2)}</strong></td>
                          </tr>
                      </tfoot>
                  </table>
              </div>
            ) : (
              <p>No items were submitted in this budget.</p>
            )}
          </div>
        )}
      </div> {/* End budget-content */}
    </div> // End budget-container
  );
};

export default BudgetPage;