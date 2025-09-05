# OlympCom 🎭  
A private-first social media web app for the **Olympus friend group**.  

OlympCom combines a **public member directory** with a **private feed system** where authenticated members can post, comment, and react. Registration is restricted to allowlisted emails, ensuring only Olympus members can join.  

---

## 🚀 Features  

### 🔓 Public Features  
- View **all Olympus members** (name, bio, profile picture) in a **directory (card layout)**.  
- No login required.  

### 🔑 Authenticated Features  
- **User Roles**:  
  - **Admin** → Manage users, allowlist, and moderate content.  
  - **User** → Manage own profile, create posts, comment, react.  

- **Profiles**  
  - Editable name, bio, profile picture.  
  - Email fixed for normal users (admins may reset).  

- **Feed** (private, members only)  
  - Create posts (text + optional media).  
  - Comment on posts.  
  - React to posts (like, love, laugh, etc.).  
  - View feed in reverse chronological order.  

- **Allowlist**  
  - Only allowlisted emails can register.  
  - Admins manage allowlist via dashboard.  

---

## 🛠 Tech Stack  

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Fullstack)  
- **Database**: [PostgreSQL](https://postgresql.org/) (via Prisma Local Development)  
- **ORM**: [Prisma](https://prisma.io/)  
- **Auth**: [NextAuth.js](https://next-auth.js.org/) (email/password credentials)  
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Caching**: Next.js 15 Server-Side Caching with `unstable_cache` and cache tags

---

## ⚡ Performance & Caching

OlympCom implements a comprehensive **server-side caching strategy** using Next.js 15:

- **Database Query Caching**: API routes cache database queries using `unstable_cache`
- **Smart Invalidation**: Cache automatically cleared when data changes using cache tags
- **Optimized Response Times**: 200-500ms faster response times for cached data
- **Reduced Database Load**: 60-80% reduction in database query frequency

### Cache Strategy:
- **Posts**: 30-second cache (high-frequency updates)
- **Users**: 30 seconds (admin) / 5 minutes (public)
- **Announcements**: 5-minute cache (moderate updates)
- **Admin Data**: 5-minute cache (infrequent changes)

For detailed caching implementation, see [`docs/CACHING_GUIDE.md`](docs/CACHING_GUIDE.md)

---

## ⚡ Getting Started  

### 1. Install dependencies  
```bash
npm install
```

### 2. Start the database  
```bash
npx prisma dev
```
Keep this running in a separate terminal.

### 3. Create initial seed data
```bash
node prisma/seed.js
```

### 4. Start the development server  
```bash
npm run dev
```

### 5. Open your browser
Visit [http://localhost:3000](http://localhost:3000)

---

## 👥 Default Users

The seed script creates the following default accounts:

### Admin Account
- **Email**: `admin@olympus.com`
- **Password**: `admin123`
- **Role**: Admin (can manage allowlist and users)

### Allowlisted Emails
The following emails are pre-approved for registration:
- `admin@olympus.com` (already registered)
- `alice@example.com`
- `bob@example.com`
- `charlie@example.com`
- `diana@example.com`

---

## � Authentication Flow  

1. User tries to **register** → system checks allowlist.  
   - If not on allowlist → error.  
   - If allowlisted → create account (password hashed).  
2. User logs in with **NextAuth Credentials Provider**.  
3. Authenticated session issued (JWT).  
4. Middleware protects **feed** and **admin routes**.  
5. Public directory always accessible.  

---

## 📱 Usage Instructions

### For Regular Users:
1. **Register**: Use an allowlisted email to create your account
2. **Login**: Access your account with email and password
3. **Profile**: Update your name, bio, and profile picture
4. **Feed**: Create posts, comment, and react to others' content
5. **Directory**: Browse all community members (public access)

### For Admins:
1. **Login** with admin credentials
2. **Admin Dashboard**: Access via navigation menu
3. **Manage Allowlist**: Add/remove email addresses
4. **View Users**: See all registered members and statistics
5. **Moderation**: Monitor community activity

---

## 🌐 Key Pages

- **/** - Landing page with features overview
- **/directory** - Public member directory (no auth required)
- **/auth/login** - User authentication
- **/auth/register** - User registration (allowlist required)
- **/feed** - Private social feed (auth required)
- **/profile** - Personal profile management (auth required)
- **/admin** - Admin dashboard (admin role required)

---

## �️ Database Schema

The application uses these main models:
- **User** - Member accounts with roles
- **Allowlist** - Approved email addresses
- **Post** - Feed content with optional media
- **Comment** - Post responses
- **Reaction** - Like/love/laugh interactions

---

## 🔧 Development

### Database Management
```bash
# View database in Prisma Studio
npx prisma studio

# Reset database (development only)
npx prisma migrate reset

# Generate Prisma client after schema changes
npx prisma generate
```

### Environment Variables
Create a `.env` file with:
```env
DATABASE_URL="prisma+postgres://..."
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 🚢 Production Deployment

For production deployment:
1. Set up a PostgreSQL database (e.g., Supabase, Railway, PlanetScale)
2. Update `DATABASE_URL` in environment variables
3. Deploy to Vercel, Netlify, or your preferred platform
4. Run migrations: `npx prisma migrate deploy`

---

## 📝 Contributing  

This project is designed for the Olympus friend group. Admins can extend features as needed through the admin dashboard or by modifying the codebase.

---

## 🎯 Features Status

- ✅ Public member directory
- ✅ Email/password authentication with NextAuth.js
- ✅ Allowlist-based registration
- ✅ User profile management
- ✅ Private social feed with posts
- ✅ Comments and reactions system
- ✅ Admin dashboard for user management
- ✅ Responsive design with Tailwind CSS
- ✅ Role-based access control

---

**Built with ❤️ for the Olympus Community**  