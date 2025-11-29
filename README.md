# Safiriticket

This is an invoicing and quotation management system for Safiri Ticket Ltd.

## Features

*   **Invoice Management:** Create, manage, and track invoices.
*   **Quotation Management:** Create, manage, and track quotations.
*   **Client Management:** Manage client information.
*   **Service Management:** Manage a list of services and their prices.
*   **Financials:** View a dashboard with financial summaries.
*   **PDF Generation:** Generate PDF versions of invoices and quotations.
*   **User Authentication:** Secure access to the application with JWT-based authentication.
*   **Email Notifications:** Send email notifications (requires configuration).
*   **Cloudinary Integration:** (Legacy) Support for storing and serving PDF files from Cloudinary.
*   **Railway Deployment:** Configuration for deploying the application on Railway.

## Technologies Used

*   **Backend:**
    *   Node.js
    *   Express.js
    *   MongoDB (with Mongoose)
    *   JSON Web Token (JWT) for authentication
    *   Bcrypt.js for password hashing
    *   Nodemailer for sending emails
    *   Multer for file uploads
    *   Cloudinary for legacy file storage
*   **Frontend:**
    *   HTML
    *   CSS
    *   Vanilla JavaScript
    *   html2pdf.js for PDF generation

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   Node.js and npm installed on your machine. You can download them from [https://nodejs.org/](https://nodejs.org/).
*   A running MongoDB instance. You can use a local installation or a cloud-based service like MongoDB Atlas.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    ```
2.  **Install backend dependencies:**
    ```bash
    cd src
    npm install
    ```
3.  **Configure environment variables:**
    Create a `.env` file in the root of the project and add the following environment variables. You can use the hardcoded values in `src/server.js` as a starting point, but it is highly recommended to use a secure MongoDB connection string and a strong JWT secret.

    ```
    MONGODB_URI=<your-mongodb-connection-string>
    JWT_SECRET=<your-jwt-secret>
    CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
    CLOUDINARY_API_KEY=<your-cloudinary-api-key>
    CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
    ```

### Running the Application

1.  **Start the backend server:**
    ```bash
    cd src
    npm start
    ```
    The server will start on port 5000 by default.

2.  **Open the frontend:**
    Open the `vanilla-frontend/index.html` file in your browser.

## Project Structure

```
.
├── .git/
├── src/
│   ├── cache/
│   ├── middleware/
│   ├── models/
│   ├── node_modules/
│   ├── routes/
│   ├── scripts/
│   ├── package.json
│   ├── server.js
│   └── ...
├── vanilla-frontend/
│   ├── modules/
│   ├── public/
│   ├── templates/
│   ├── config.js
│   ├── index.html
│   └── ...
├── uploads/
│   └── quotations/
├── .gitignore
├── README.md
└── ...
```

*   **`src/`**: Contains the backend Node.js application.
    *   **`models/`**: Mongoose models for the database schema.
    *   **`routes/`**: API routes for the application.
    *   **`middleware/`**: Custom middleware for the Express application.
    *   **`scripts/`**: Helper scripts for tasks like database migration.
    *   **`server.js`**: The main entry point for the backend application.
*   **`vanilla-frontend/`**: Contains the frontend application.
    *   **`modules/`**: JavaScript modules for different parts of the frontend application.
    *   **`templates/`**: HTML templates for invoices and quotations.
*   **`uploads/`**: Directory for storing uploaded files.

## API Documentation

The backend provides a RESTful API for managing resources. Here are some of the main endpoints:

*   **Authentication:**
    *   `POST /api/auth/login`: Login a user.
    *   `POST /api/auth/register`: Register a new user.
*   **Clients:**
    *   `GET /api/clients`: Get all clients.
    *   `POST /api/clients`: Create a new client.
    *   `GET /api/clients/:id`: Get a client by ID.
    *   `PUT /api/clients/:id`: Update a client by ID.
    *   `DELETE /api/clients/:id`: Delete a client by ID.
*   **Quotations:**
    *   `GET /api/quotations`: Get all quotations.
    *   `POST /api/quotations`: Create a new quotation.
    *   ...
*   **Invoices:**
    *   `GET /api/invoices`: Get all invoices.
    *   `POST /api/invoices`: Create a new invoice.
    *   ...

For more details on the API, please refer to the code in the `src/routes/` directory.

## Deployment

This project is configured for deployment on [Railway](https://railway.app/). The `railway.toml` file contains the deployment configuration.

To deploy the application on Railway, you will need to:

1.  Create a new project on Railway.
2.  Link your GitHub repository to the Railway project.
3.  Configure the environment variables in the Railway project settings.
4.  Deploy the application.
