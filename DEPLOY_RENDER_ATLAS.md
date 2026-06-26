# Deploy Chatify on Render with MongoDB Atlas

This project deploys as two Render services:

- `chatify-backend`: Node.js/Express API and Socket.IO web service.
- `chatify-frontend`: React/Vite static site.

## 1. Create MongoDB Atlas

1. Create a free Atlas cluster.
2. Create a database user with a strong password.
3. In Network Access, add an IP access list entry.
   - For Render free hosting, use `0.0.0.0/0` unless you later move to fixed outbound IPs.
4. Copy the driver connection string.
5. Replace `<password>` and add the database name:

```env
mongodb+srv://<username>:<password>@<cluster-url>/chatify?retryWrites=true&w=majority
```

If the password contains special characters like `@`, `/`, or `#`, URL-encode them before using the URI.

## 2. Push This Repo To GitHub

Render deploys from GitHub/GitLab/Bitbucket or a public Git URL. Push the project before creating the Render services.

## 3. Create Render Blueprint

1. Open Render Dashboard.
2. Click New > Blueprint.
3. Select this repository.
4. Render reads `render.yaml` and creates the backend and frontend services.

## 4. Backend Environment Variables

Set these on the `chatify-backend` service:

```env
MONGO_URI=mongodb+srv://...
CLIENT_URL=https://chatify-frontend.onrender.com
CLOUDINARY_CLOUD_NAME=dummy
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RESEND_API_KEY=
EMAIL_FROM=
EMAIL_FROM_NAME=Chatify
ARCJET_KEY=
ARCJET_ENV=production
```

Atlas may download this value as `MONGODB_URI`, but this backend expects the key name
`MONGO_URI` in Render.

`JWT_SECRET` is generated automatically by `render.yaml`. If you set it manually, use a long random value.

If your local machine cannot resolve `mongodb+srv` records, you can still use the generated
standard seed-list URI now saved in `walter-backend/.env` for local testing. Render usually
works fine with the Atlas `mongodb+srv` URI.

## 5. Frontend Environment Variables

Set this on the `chatify-frontend` static site:

```env
VITE_API_URL=https://chatify-backend.onrender.com/api
VITE_TRULY_PDF_URL=https://truly-pdf.onrender.com
```

After setting or changing any `VITE_*` value, rebuild the frontend service.

## 6. Final Checks

- Backend health check: `https://chatify-backend.onrender.com/api/health`
- Frontend app: `https://chatify-frontend.onrender.com`
- In Atlas, confirm collections appear after signing up.

## Notes For Free Hosting

- Render free web services can sleep when idle, so the first request after inactivity may be slow.
- Keep secrets only in Render environment variables, not in Git.
- If login works locally but not on Render, recheck `CLIENT_URL` and `VITE_API_URL`; they must use the exact deployed HTTPS URLs.
