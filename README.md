# 📝 NOTIVA – Your Personal Notes Space

**Capture your thoughts. Organize your ideas. Stay productive.**

NOTIVA is a simple and modern notes application that helps users create, edit, organize, and manage their notes in one place. It provides a clean interface and an easy way to keep track of important information.

---

## 🌐 Explore NOTIVA

- **Live Application:** https://notiva-frontend.onrender.com/
- **Source Code:** https://github.com/Meet-Savani/NOTIVA

---

## ✨ What You Can Do

- Create and save personal notes
- Edit existing notes whenever needed
- Delete notes you no longer need
- Organize and manage your notes
- Access a clean and user-friendly interface
- Use the application through a responsive web interface

---

## 🛡️ Admin Panel

NOTIVA includes an admin panel that allows administrators to manage and monitor the application.

- Access a dedicated admin dashboard
- Manage registered users
- View and manage application data
- Maintain better control over the platform

## 🖼️ A Look Inside NOTIVA


| Application View | Screenshot |
|---|---|
| Home Page | `screenshots/homepage.png` |
| Notes Dashboard | `screenshots/dashboard.png` |
| Create Note Page | `screenshots/create-note.png` |

---

## 🧰 Built With

| Part | Technologies |
|---|---|
| Frontend | React.js, Vite, JavaScript |
| Styling | Tailwind CSS |
| Navigation | React Router DOM |
| HTTP Requests | Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcryptjs |
| Security | Helmet |
| Deployment | Render |
| Version Control | Git & GitHub |

---

## 🏗️ How the Project Is Organized

The project is divided into two main parts:

```text
NOTIVA/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── backend/
│   ├── models/
│   ├── index.js
│   ├── utilities.js
│   └── package.json
│
└── README.md
```

---

## ⚙️ Run NOTIVA Locally

Want to try NOTIVA on your computer? Follow these steps.

**1. Clone the repository**

```bash
git clone https://github.com/Meet-Savani/NOTIVA.git
cd NOTIVA
```

**2. Set up the backend**

```bash
cd backend
npm install
```

Create a `.env` file in the backend folder and add the required environment variables.

Start the backend:

```bash
npm run dev
```

**3. Set up the frontend**

Open another terminal:

```bash
cd NOTIVA/frontend
npm install
npm run dev
```

Open the local URL shown in your terminal to use the application.

---

## 🔐 Environment Configuration

The backend uses environment variables for configuration.

Example:

```env
PORT=your_port_number
MONGODB_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_secret_key
```

---

## 🔌 API Overview

NOTIVA uses a REST API built with Express.js to handle communication between the frontend and backend.

The backend is responsible for:

- User authentication
- Notes management
- Database operations

Refer to the backend source code for the available API routes and request details.

---

## 🚀 Ideas for the Future

- Support rich-text editing
- Add reminders for important notes
- Enable note sharing with other users
- Add automatic cloud backup and note synchronization

---

## 👨‍💻 Author

**Meet Savani**

B.Sc. Information Technology Graduate | Aspiring AI & Machine Learning Enthusiast



I enjoy building web applications and learning new technologies through practical projects.

- **GitHub:** https://github.com/Meet-Savani

---

## © Copyright

Copyright © 2026 Meet Savani. All rights reserved.

This project is made available for viewing and educational reference only. Any copying, modification, redistribution, or other use of the source code requires prior permission.

--- 
*Built with curiosity, creativity, and a passion for learning.*