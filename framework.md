# Quotation and Invoicing System: Conceptual Framework

## Purpose

Create a system that allows users to generate quotations for clients, send them via email as PDFs, track quotation statuses, and convert accepted quotations into invoices.

## Key Entities

- **Client**: The person or company receiving quotations and invoices.
- **Quotation**: An offer detailing services/products and pricing, with expiration date.
- **Invoice**: A billing document generated when a quotation is accepted.

## Main Features

- Create and manage quotations.
- Auto-generate PDFs for quotations.
- Email quotations with PDF attachment to client.
- Status tracking (Pending, Accepted, Declined, Expired).
- Convert accepted quotations to invoices.
- Generate PDF invoices.
- Email invoices with payment instructions.
- Dashboard for administration:
  - View, filter, and manage quotations and invoices.
  - Search clients and documents.
- (Optional future expansion): Payment integration (Stripe, PayPal).
- (Optional): Activity tracking (e.g., when client opens email).

> **See also:** [Document Lifecycle and Email Templates](doc.md) for detailed status transitions and communication flows.

## User Roles

- **Admin** (Internal team member):
  - Create/edit quotations.
  - View/manage all quotations and invoices.
  - Send documents to clients.
  - Mark payments received.
- **Client**:
  - Receive quotations and invoices by email.
  - (Optional Future Feature) Accept or decline quotations online.

## Workflow Diagram

```plaintext
[Create Quotation]
    ↓
[Save Quotation in Database]
    ↓
[Generate Quotation PDF]
    ↓
[Send PDF to Client via Email]
    ↓
[Client Reviews]
    ↓
[Client Accepts or Declines]
    ↓
[If Accepted → Create Invoice]
    ↓
[Generate Invoice PDF]
    ↓
[Send Invoice to Client via Email]
    ↓
[Receive Payment (Optional)]
    ↓
[Mark Invoice as Paid]
```

## Frontend Usage

You do **not** need to stop your React frontend to use the vanilla frontend, but:

- Only one frontend (React or vanilla) should be open in your browser at a time to avoid confusion.
- Both frontends can run simultaneously as long as they are served from different folders and ports (or opened as local files).
- The backend server (`http://localhost:5000`) must be running for either frontend to work.

**Summary:**  
- You can keep your React frontend running, but close its browser tab if you want to test the vanilla frontend.
- Make sure your backend is running and accessible.
