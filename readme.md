
# 📄 Smart Docs

**Smart Docs** is an intelligent document automation system designed to streamline document creation, management, and retrieval. It empowers admins to create templates and staff to generate documents dynamically using smart forms and AI-assisted content generation.

---

## 🚀 Features

### 🧠 Core Objectives
- Automate document creation using backend APIs and template engines.
- Generate dynamic content using OpenAI or Mistral-7B-Instruct models.
- Enable fast content-based document search with MongoDB/Mongoose.
- Provide a seamless web interface with React.
- Manage user profiles and settings effortlessly.

---

## 🛠️ Admin Features
- **Admin Dashboard**: Central panel for managing templates and users.
- **Template Creator**: Create templates with placeholders like `{{student_name}}`.
- **Template Manager**: View, edit, and delete templates.
- **User Management**: List and manage all registered staff.

---

## 👩‍💼 Staff Features
- **Staff Dashboard**: View available templates and previously created documents.
- **Template Selection**: Browse templates created by the admin.
- **Dynamic Form Generation**: Auto-generate forms based on template placeholders.
- **Document Generator**: Create and download filled documents in PDF format.
- **My Documents**: View history of generated documents by the logged-in user.

---

## 🔐 Common Features
- **Role-Based Login**: Single login system redirects users based on role (Admin/Staff).
- **Content-Based Search**: Search through documents with full-text or field-specific queries.

---

## ⚙️ Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | React, Material UI / Tailwind CSS |
| Backend     | Node.js, Express.js               |
| Database    | MongoDB with Mongoose             |
| AI Services | OpenAI API / Mistral Instruct     |
| Auth        | JWT, Bcrypt, Role-based Routing   |
| PDF Gen     | PDFKit / pdf-lib / Puppeteer      |

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/your-username/smart-docs.git
cd smart-docs

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
````

---

## 🧪 Run the App Locally

```bash
# Start backend server
cd backend
npm run dev

# In a new terminal, start frontend
cd ../frontend
npm start
```

---

## 🤖 AI Integration

> AI models like OpenAI's GPT or Mistral-7B are used to:

* Autocomplete document text.
* Suggest contextual content while filling templates.
* Enhance productivity and personalization.

---

## 🔒 Security

* Role-based access control (Admin, Staff)
* Password hashing with Bcrypt
* JWT-based session management

---

## ✨ Future Enhancements

* Document versioning
* Rich text editor for template creation
* Email and notification integration
* Document sharing via unique links

---

## 📬 Contact

For queries or contributions, feel free to open an issue or pull request.

