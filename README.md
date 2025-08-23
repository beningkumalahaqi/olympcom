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
- **Database**: [PostgreSQL](https://supabase.com/) (via Supabase)  
- **ORM**: [Prisma](https://prisma.io/)  
- **Auth**: [NextAuth.js](https://next-auth.js.org/) (email/password credentials)  
- **File Storage**: Supabase Storage (for profile pictures & media uploads)  
- **Deployment**: Vercel (frontend/backend) + Supabase (DB & storage)  

---

## 📂 Project Structure  

```bash
olympcom/
├── prisma/              # Prisma schema + migrations
├── src/
│   ├── app/             # Next.js App Router pages
│   │   ├── (public)/    # Public pages (home, directory, login, register)
│   │   ├── (auth)/      # Authenticated pages (feed, profile)
│   │   └── (admin)/     # Admin dashboard
│   ├── components/      # UI components (cards, feed, forms)
│   ├── lib/             # Utility functions (auth, db, validations)
│   └── styles/          # Tailwind styles
├── .env                 # Environment variables
├── package.json
└── README.md
```

---

## 🗄 Database Schema (Prisma)  

### User  
```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  password    String
  name        String
  bio         String?
  profilePic  String?  // Supabase CDN URL
  role        Role     @default(USER)
  posts       Post[]
  comments    Comment[]
  reactions   Reaction[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Role Enum  
```prisma
enum Role {
  USER
  ADMIN
}
```

### Allowlist  
```prisma
model Allowlist {
  id        String   @id @default(cuid())
  email     String   @unique
  addedBy   String
  createdAt DateTime @default(now())
}
```

### Post  
```prisma
model Post {
  id        String    @id @default(cuid())
  author    User      @relation(fields: [authorId], references: [id])
  authorId  String
  content   String
  mediaUrl  String?
  comments  Comment[]
  reactions Reaction[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

### Comment  
```prisma
model Comment {
  id        String    @id @default(cuid())
  post      Post      @relation(fields: [postId], references: [id])
  postId    String
  author    User      @relation(fields: [authorId], references: [id])
  authorId  String
  content   String
  createdAt DateTime  @default(now())
}
```

### Reaction  
```prisma
model Reaction {
  id        String   @id @default(cuid())
  post      Post     @relation(fields: [postId], references: [id])
  postId    String
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  type      String   // e.g. "like", "love", "laugh"
  createdAt DateTime @default(now())
}
```

---

## 🔐 Auth Flow  

1. User tries to **register** → system checks allowlist.  
   - If not on allowlist → error.  
   - If allowlisted → create account (password hashed).  
2. User logs in with **NextAuth Credentials Provider**.  
3. Authenticated session issued (JWT or database session).  
4. Middleware protects **feed** and **admin routes**.  
5. Public directory always accessible.  

---

## ⚡ Getting Started  

### 1. Clone the repo  
```bash
git clone https://github.com/yourusername/olympcom.git
cd olympcom
```

### 2. Install dependencies  
```bash
npm install
```

### 3. Setup environment variables (`.env`)  
```env
DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Push database schema  
```bash
npx prisma migrate dev --name init
```

### 5. Run dev server  
```bash
npm run dev
```

---

## ✅ Roadmap  

- [x] Member directory (public)  
- [x] Authentication with NextAuth.js  
- [x] Profile editing  
- [x] Feed system (posts, comments, reactions)  
- [ ] Notifications (likes, comments, follows)  
- [ ] Mobile app (React Native + Supabase SDK)  

---

## 👨‍💻 Contributing  

This project is closed-source for Olympus members only.  
Admins can extend features as needed.  