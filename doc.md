# Quotation and Invoicing System: Document Lifecycle and Email Templates

## Document Lifecycle

### 1. Quotation

- **Creation**:
  - Admin creates a new quotation with client details, services, and prices.
- **Statuses**:
  - **Pending**: Newly created, awaiting client action.
  - **Accepted**: Client agrees to the quotation terms.
  - **Declined**: Client rejects the quotation.
  - **Expired**: Quotation validity period lapses without a response.
- **Transitions**:
  - Pending → Accepted
  - Pending → Declined
  - Pending → Expired (auto after set expiration date)

- **Actions**:
  - Send quotation to client as PDF email attachment.
  - Reminder email before expiry (optional).
  - Conversion to Invoice upon acceptance.

---

### 2. Invoice

- **Creation**:
  - Generated directly or converted from an accepted quotation.
- **Statuses**:
  - **Unpaid**: Invoice sent, payment pending.
  - **Paid**: Payment received and recorded.
  - **Overdue**: Payment not received by due date.
- **Transitions**:
  - Unpaid → Paid
  - Unpaid → Overdue (auto after due date)

- **Actions**:
  - Send invoice to client with payment instructions.
  - Send reminder emails for overdue invoices (optional).
  - Mark payment manually or automatically via payment gateway integration.

---

## Email Templates

### 1. Quotation Sent

- **Subject**: Your Quotation from [Company Name]
- **Body**:

---

# Summary

| Document | Status | Next Actions |
|:---------|:--------|:-------------|
| Quotation | Pending, Accepted, Declined, Expired | Send, Convert to Invoice |
| Invoice | Unpaid, Paid, Overdue | Send, Payment Follow-up |

| Email Type | Trigger |
|:-----------|:--------|
| Quotation Sent | After quotation creation |
| Quotation Reminder | Few days before expiry |
| Invoice Sent | After invoice creation |
| Payment Reminder | Before or after due date |

# Where should the `.env` file be?

The `.env` file should be placed in the **root of your project**, at:

# Can I safely delete the React frontend?

Yes, if you are now fully using the vanilla frontend and have confirmed all required features work as expected, you can safely delete the `client` (React frontend) folder.

**Checklist before deleting:**
- All features you need are available and working in the vanilla frontend.
- You have no custom logic, assets, or data in the React frontend that you still need.
- You have backups or version control in case you want to restore it later.

**How to delete:**
- Delete the `c:\projects\Safiriticket\client` folder.

> Once deleted, only the vanilla frontend and backend will remain in your project.
