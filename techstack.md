# 📄 2. **tech_stack.md**

```markdown
# Quotation and Invoicing System: Tech Stack

## Frontend
- **React.js** (for building a modern, component-based admin dashboard UI)
- **HTML5**, **CSS3**, **JavaScript**
- **Bootstrap 5** (for quick, responsive UI components)

## Backend
- **Node.js** (Server-side JavaScript runtime)
- **Express.js** (Minimalist web framework)

## Database
- **MongoDB** (Flexible NoSQL database)
- **Mongoose** (MongoDB object modeling for Node.js)

## PDF Generation
- **html-pdf**: Generate PDF from HTML templates
  - OR
- **puppeteer**: Use headless Chrome for pixel-perfect PDF rendering
  - OR
- **pdf-lib**: Manipulate existing PDFs, inject dynamic content

## Email Service
- **Nodemailer** (Popular email client for Node.js)
- (Optional) **SendGrid** or **Mailgun** for scalable email delivery (especially if you scale up)

## File Storage
- **Local filesystem** (for development)
- (Optional) **AWS S3** or **Cloudinary** (for production scalability)

## Authentication (Admin dashboard login)
- **Passport.js** (Node.js authentication middleware)
- (Optional) **JWT** (JSON Web Tokens) for secure sessions

## Deployment (Hosting)
- **VPS (DigitalOcean, Hetzner, Linode)** — Recommended for flexibility
- **Node.js server (PM2)** for process management
- **NGINX** as a reverse proxy

## Payment Integration (Optional Future)
- **Stripe API** (for online card payments)
- **PayPal API** (alternative method)

## Development Tools
- **Postman** (API testing)
- **VS Code** (coding)
- **Git + GitHub** (version control)

## Monitoring and Analytics (Optional)
- **Sentry** (error monitoring)
- **Google Analytics** (if client portal goes live)

