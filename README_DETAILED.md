# MedAssist Backend (Node.js REST API)

> NOTE: Superseded by the lightweight FastAPI Space, but still maintained for full-stack deployments (MongoDB + JWT auth + file uploads).

## 1. Tech Stack

| Layer | Tech |
|-------|------|
| Runtime | **Node.js 20**, `express` |
| DB | MongoDB Atlas (dev) / Railway postgres alt config |
| Auth | `jsonwebtoken`, `bcryptjs`, refresh tokens |
| File Upload | `multer` (store medical reports in S3/minio) |
| Validation | `express-validator` |
| Container | Dockerfile (multi-stage) |

## 2. Structure

```
medassist-backend/
 ├─ controllers/     # Business logic per resource (user, record, contact)
 ├─ routes/          # Express routers mapping HTTP → controller
 ├─ models/          # Mongoose schemas
 ├─ services/        # External integrations (s3Service, emailService)
 ├─ middleware/      # Auth, errorHandler, rateLimiter
 ├─ utils/           # helpers (asyncWrapper, logger)
 ├─ config/          # env + db connection
 └─ server.js        # Entry point
```

## 3. Key Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/auth/register` | Email OTP or social login placeholder |
| `POST` | `/api/upload/report` | PDF/Image upload, triggers AI summarizer webhook |
| `GET` | `/api/user/profile` | Returns medical data for dashboard |
| `GET` | `/api/qr/:token` | Decrypts & returns public emergency subset |

Full docs in `routes/*.js` swagger comments.

## 4. Dev Setup

```bash
cp .env.example .env
npm i
npm run dev   # nodemon + ts-node (if TS path chosen)
```

Docker:
```bash
docker build -t medassist-backend .
docker run -p 4000:4000 --env-file .env medassist-backend
```

## 5. Why Keep It?

* Provides **full CRUD** & secure storage when app scales beyond demo.
* Shows back-end skills (auth, file handling, clean architecture).
* Can be deployed to Railway / Render easily (`railway.toml` included).
