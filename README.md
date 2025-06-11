# 🌐 MedAssist+ Backend API

![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green?logo=node.js)
![Express](https://img.shields.io/badge/Express-5.x-lightgrey?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)
![Railway](https://img.shields.io/badge/Deploy-Railway-purple?logo=railway)
![License](https://img.shields.io/badge/License-MIT-blue)

> **MedAssist+** is a next-gen tele-health & emergency-response platform.  
> This repository houses the **RESTful Backend** that powers the Flutter mobile app, AI services and public emergency QR/NFC endpoints.

---

## ✨ Key Capabilities

| Area | Highlights |
| --- | --- |
| **Auth** | JWT-based login / registration, Google OAuth 2.0 sign-in |
| **Profile** | Secure storage of face embeddings, fingerprint hashes, medical records & AI summaries |
| **Emergency Module** | Priority contacts, real-time alerts (SMS/Twilio), QR code generation & scan-first API |
| **Family & Sharing** | Add dependent profiles, granular permission flags (`shareMedicalSummary`) |
| **File Handling** | Multer uploads for PDFs/Images – stored on disk or S3-compatible bucket |
| **Security** | Rate-limiting stubs, helmet presets (roadmap) and strict schema validation |

---

## 🏗️ Tech Stack

- **Node.js 18+** & **Express 5** (Router-centric architecture)
- **MongoDB Atlas** with **Mongoose 8** schemas & transactions
- **Passport.js** (JWT & Google OAuth strategies)
- **Twilio** for SMS alerts (optional)
- **qrcode** for server-side QR generation
- **Railway**: zero-config CI/CD, auto-provisioned DB addon

---

## ⚙️ Local Development

```bash
# 1.  Clone & install
$ git clone https://github.com/yasuo72/medassist_backend.git
$ cd medassist_backend
$ npm install

# 2.  Configure environment
$ cp .env.example .env  # fill in secrets

# 3.  Start dev server (auto-reload)
$ npm run dev
```

The API will be live on `http://localhost:5000`.  Nodemon watches for file changes.

### Required Environment Vars

| Key | Description |
| --- | --- |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Symmetric key for JWT signing |
| `SESSION_SECRET` | Express-session secret (Google OAuth) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | *Optional* – Enable social login |
| `TWILIO_*` | *Optional* – SMS alerts |

---

## ☁️ 1-Click Railway Deploy

1. **Fork** ➡️ your GitHub account (or push directly).
2. Sign in to **[Railway.app](https://railway.app/)**.
3. Click **New Project → Deploy from GitHub** and select *medassist_backend*.
4. Add Environment variables in the **Variables** tab (same as above).
5. Railway detects the `start` script and Node version automatically.  Hit **Deploy**.

> 💡 Every push to `main` triggers an auto-deploy. Logs & metrics are available in the Railway dashboard.

---

## 🧩 API Endpoints (v1)

```
GET    /api/auth/google           # OAuth redirect
POST   /api/auth/register         # { name, email, password }
POST   /api/auth/login            # { email, password }

GET    /api/user/contacts         # List emergency contacts
POST   /api/user/contacts         # Add contact
PUT    /api/user/contacts/:id     # Update contact (priority / sharing flags)
DELETE /api/user/contacts/:id     # Remove contact

POST   /api/records               # Create medical record
POST   /api/records/upload        # Upload report file (multipart)

# ...more routes in /routes/*.js
```

> Full Swagger / Redoc documentation incoming (roadmap).

---

## 🚀 Roadmap

- [ ] **AI Summaries** – OpenAI function calls for on-device summarization
- [ ] **Socket.IO** – Real-time crash-detection alerts
- [ ] **Rate Limiting & Helmet** – Harden production security
- [ ] **GraphQL Gateway** – Optional flexible querying layer
- [ ] **Kubernetes Helm Chart** – For multi-tenant hospital deployments

---

## 🤝 Contributing

1.  Fork the repo & create your branch (`git checkout -b feature/awesome`).
2.  Commit your changes (`git commit -m 'Add some awesome'`).
3.  Push to the branch (`git push origin feature/awesome`).
4.  Open a **Pull Request**.

Please adhere to the existing code style and include tests where applicable.

---

## 📝 License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

---

> **MedAssist+** – *Your Health, One Scan Away.*
