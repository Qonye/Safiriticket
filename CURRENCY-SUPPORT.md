# Currency Support Enhancements

## Overview

This update adds comprehensive multi-currency support to the Safiriticket invoice system. It allows for:

1. Creating invoices and quotations in different currencies
2. Selecting payment methods with appropriate bank details for each currency
3. Displaying financial data grouped by currency
4. Visualizing revenue in different currencies

## Features Implemented

### Models

- Added `currency` field to Invoice and Quotation models
- Added `paymentDetails` object to Invoice model with all necessary bank details

### Frontend

- Enhanced invoice/quotation creation forms with currency selection
- Added payment method selection dropdown with predefined bank accounts
- Implemented dynamic currency symbol display based on selected currency
- Updated invoice and quotation templates to use proper currency symbols
- Enhanced financial views to display data grouped by currency

### Backend

- Updated financial endpoint to provide currency-specific breakdowns
- Created migration script for existing data

### Financial Reporting

- Added currency breakdown in financial overview
- Enhanced dashboard charts to show revenue by currency
- Added currency-specific totals for better financial reporting

## Migration

A migration script has been created to update existing invoices and quotations:

```
cd src
npm run migrate-currency
```

This will:

1. Add a default currency (USD) to all invoices and quotations that don't have one
2. Add default payment details to invoices that don't have them

## Default Payment Methods

The system includes four predefined payment methods:

- USD Account (Diamond Trust Bank)
- KES Account (Diamond Trust Bank)
- GBP Account (Santander UK)
- EUR Account (Wise Transfer)

## Supported Currencies

The following currencies are supported with appropriate symbols:

- USD - $
- EUR - €
- GBP - £
- KES - KSh
- CAD - C$
- AUD - A$

## Note on Financial Aggregation

For reporting purposes, the financial overview provides both:

1. Currency-specific breakdowns without conversion
2. An aggregated total (currently using USD as the base currency)

Future enhancements could include currency conversion based on real-time exchange rates.
