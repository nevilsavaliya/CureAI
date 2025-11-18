# How to Import .env File to Render

## 📁 Your .env Files Location

You have 3 .env files in your project:

1. **`backend/.env`** - Your current development environment (localhost)
2. **`backend/.env.example`** - Template file
3. **`backend/.env.production`** - NEW! Production template for Render

## 🚀 Option 1: Import from File (Easiest)

### Step 1: Prepare the File

1. Open `backend/.env.production`
2. Update these values:
   - `MONGODB_URI` - Your MongoDB Atlas connection string
   - `JWT_SECRET` - Generate a new secure key
   - `FRONTEND_URL` - Your frontend URL (after deployment)
   - `EMAIL_USER` and `EMAIL_PASSWORD` (if using email)

### Step 2: Import to Render

Render has a feature to import .env files:

1. Go to your Web Service in Render
2. Click "Environment" tab
3. Look for "Add from .env" or "Bulk Add" button
4. Copy the contents of `backend/.env.production`
5. Paste into the text area
6. Click "Save"

**OR** manually add each variable one by one.

---

## 📋 Option 2: Copy-Paste Individual Variables

### Minimum Required (4 variables):

```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/healthcare-platform
JWT_SECRET=your_generated_secret_key_here
```

### How to Add:

1. Click "Add Environment Variable"
2. Enter Name: `NODE_ENV`
3. Enter Value: `production`
4. Click "Add"
5. Repeat for each variable

---

## 🔑 Generate JWT Secret

Run this command in your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Example output:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

Use this as your `JWT_SECRET` value.

---

## 🗄️ Get MongoDB URI

### From MongoDB Atlas:

1. Go to https://cloud.mongodb.com
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your actual password
6. Replace `<dbname>` with `healthcare-platform`

Example:
```
mongodb+srv://admin:MyPassword123@cluster0.abc123.mongodb.net/healthcare-platform?retryWrites=true&w=majority
```

---

## 📧 Email Configuration (Optional)

### For Gmail:

1. Enable 2-factor authentication on your Google account
2. Go to: https://myaccount.google.com/apppasswords
3. Generate an "App Password"
4. Use that password (not your regular Gmail password)

```
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop  (16-character app password)
```

---

## 💳 Payment Gateway (Optional)

### If using Razorpay:

1. Sign up at https://razorpay.com
2. Go to Dashboard → Settings → API Keys
3. Copy Key ID and Key Secret

```
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

### If using Kotak:

Wait until you get approved and receive credentials from Kotak.

---

## ✅ Complete Environment Variables for Render

Here's what to add in Render (copy-paste format):

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASS@YOUR_CLUSTER.mongodb.net/healthcare-platform?retryWrites=true&w=majority
JWT_SECRET=YOUR_GENERATED_SECRET_KEY_HERE
JWT_EXPIRES_IN=24h
FRONTEND_URL=https://your-frontend-url.vercel.app
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
UPI_ID=your_upi_id@bank
PAYMENT_TIMEOUT_MINUTES=10
PAYMENT_POLL_INTERVAL_SECONDS=5
PAYMENT_MAX_RETRIES=3
```

---

## 🎯 Quick Start (Minimum Setup)

**Just add these 4 to get started:**

1. **NODE_ENV** = `production`
2. **PORT** = `3000`
3. **MONGODB_URI** = `your_mongodb_connection_string`
4. **JWT_SECRET** = `your_generated_secret`

You can add the rest later!

---

## 🔒 Security Notes

### ⚠️ NEVER commit .env files to Git!

Check your `.gitignore` includes:

```
backend/.env
backend/.env.production
backend/.env.local
.env
```

### ✅ Safe to commit:

- `backend/.env.example` ✅ (template only, no real values)

### ❌ Never commit:

- `backend/.env` ❌ (has real values)
- `backend/.env.production` ❌ (has real values)

---

## 📝 After Adding Variables

1. Click "Deploy" in Render
2. Wait 5-10 minutes for deployment
3. Check logs for any errors
4. Test your backend URL:
   ```bash
   curl https://your-app.onrender.com/api/auth/verify
   ```

---

## 🐛 Troubleshooting

### "Cannot connect to MongoDB"

- Check MONGODB_URI is correct
- Whitelist Render's IP in MongoDB Atlas (or allow 0.0.0.0/0)

### "JWT malformed"

- Make sure JWT_SECRET is set and is 32+ characters

### "CORS error"

- Add your frontend URL to CORS in `backend/server.js`
- Redeploy backend

---

## 🎉 You're Done!

Once you add the environment variables:

1. ✅ Backend will connect to MongoDB
2. ✅ JWT authentication will work
3. ✅ API will be accessible
4. ✅ Ready to connect frontend

**Next:** Update your frontend with the backend URL and deploy!
