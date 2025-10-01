# 🎬 TMDB NestJS REST API

> A complete end-to-end RESTful backend built with **NestJS**, **TypeORM**, and **PostgreSQL**, designed to sync movie data from [TMDB](https://www.themoviedb.org/) and provide features like listing, filtering, rating, watchlists, caching, and authentication.  
>
> 🧑‍💻 **GitHub:** [FEKRY7/TMDB-Nest](https://github.com/FEKRY7/TMDB-Nest)  
> 🐳 **Docker Hub:** [fekry77/tmdb-nest](https://hub.docker.com/r/fekry77/tmdb-nest)

---

## 📌 Table of Contents
- [Overview](#-overview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Environment Variables](#-environment-variables)
- [Running the App](#-running-the-app)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Caching](#-caching)
- [Authentication & Security](#-authentication--security)
- [Testing](#-testing)
- [Production Notes](#-production-notes)
- [Project Links](#-project-links)

---

## 🌟 Overview

This project is a **CRUD application** that consumes TMDB APIs and keeps data synced in a local database. It exposes REST endpoints for:

- Listing, searching, filtering, and paginating movies.
- Allowing users to **rate movies** and showing average ratings.
- **Adding movies to watchlists** or favorites.
- Syncing data from TMDB into a scalable local database.
- Caching frequently accessed data to reduce DB and TMDB calls.
- User authentication & role-based authorization.

The app runs in **Docker containers** (NodeJS, PostgreSQL, Nginx) and is ready for production use.

---

## 🏗 Architecture



+-------------------+
| NGINX (8080) |
+---------+---------+
|
v
+---------+---------+
| NestJS API |
| (Movies, Users, |
| Ratings, TMDB) |
+---------+---------+
|
v
+---------+---------+
| PostgreSQL DB |
+-------------------+


**Main Modules:**
- **Movies** – CRUD, filtering, file uploads.
- **TMDB** – Sync service to import data.
- **Ratings** – User ratings + average aggregation.
- **UserMovieList** – Favorites & Watchlist.
- **Auth** – JWT-based authentication, roles.
- **Cloudinary** – Media uploads for movie posters/backdrops.
- **Cache** – In-memory caching layer with TTL.

---

## 🧰 Tech Stack

- **Backend Framework:** NestJS (Node.js + TypeScript)  
- **Database:** PostgreSQL + TypeORM  
- **Caching:** NestJS CacheModule (TTL 1h)  
- **Auth:** JWT, role-based guards  
- **File Storage:** Cloudinary  
- **Testing:** Jest (Unit tests ≥ 85%)  
- **Deployment:** Docker + docker-compose + Nginx reverse proxy

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
NODE_ENV=production
PORT=3000

DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=your_db_name

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=2h

TMDB_API_KEY=your_tmdb_api_key

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

MAIL_USER=...
MAIL_PASSWORD=...
MAIL_HOST=...
MAIL_PORT=...

MAXOTPSMS=3
OTPNUMBERS=6

🐳 Running the App
▶ Using Docker (Recommended)
docker-compose up --build


Once containers are up, visit:

👉 http://localhost:8080

▶ Local Development
npm install
npm run start:dev


Make sure PostgreSQL is running locally and .env is configured.

📡 API Endpoints

🎥 Movies
Method	Endpoint	Description
GET	/api/movies	List all movies (cached, paginated)
GET	/api/movies/Filter	Filter by title, popularity, year, genre, sort
GET	/api/movies/:id	Get single movie details
POST	/api/movies	Create or update movie (Admin only)
PUT	/api/movies/:id	Update movie (Admin only)

🌐 TMDB
Method	Endpoint	Description
GET	/tmdb/sync?page=1	Import movies from TMDB popular list

⭐ Ratings
Method	Endpoint	Description
POST	/api/rating/:userId/:movieId	Add/update rating
GET	/api/rating/mo/:movieId	Get average rating & count
GET	/api/rating/us/:userId	Get user’s ratings
DELETE	/api/rating/:userId/:movieId	Remove rating

📝 Watchlist / Favorites
Method	Endpoint	Description
POST	/api/movielist/:movieId	Add movie to user list
GET	/api/movielist	Get user’s list
DELETE	/api/movielist/:movieId	Remove from list

👤 Users & Auth
Method	Endpoint	Description
POST	/api/users/auth/signUp	Register new user
POST	/api/users/auth/login	Login & get JWT
PUT	/api/users/confirmEmail	Verify email with OTP
GET	/api/users/current-user	Get current logged-in user
PUT	/api/users/change-password	Change password
POST	/api/users/forgot-password	Send reset email
POST	/api/users/reset-password	Reset password

🧠 Caching
Implemented using NestJS CacheModule with TTL = 3600s.
Common cache keys:
movies:all
movie:{id}
movies:{filters}
popular_movies_page_{page} (TMDB)
For production, Redis can be used as the cache store.

🗄 Database Schema
Main Entities
User — user accounts, roles, OTP codes
Token — active JWT tokens
Movie — movie data, rating, genres, media links
Rating — user–movie rating link (many-to-one)
UserMovieList — favorites & watchlist

🔐 Authentication & Security
JWT authentication (Authorization: Bearer <token>).
Role-based authorization (Admin & User).
Email OTP verification for sign-up and password reset.
Tokens stored in the database for validation and logout.

🧪 Testing
The project uses Jest for unit tests.
npm run test
npm run test:coverage
✅ Coverage goal: ≥ 85% for services and controllers.

🚀 Production Notes
Disable synchronize: true in TypeORM for production → use migrations.
Store secrets in a secure secret manager.
Use Redis for caching in multi-instance environments.
Add proper rate-limiting & CORS rules.
Add centralized logging & monitoring.

🔗 Project Links
📁 GitHub Repo: https://github.com/FEKRY7/TMDB-Nest
🐳 Docker Hub: https://hub.docker.com/r/fekry77/tmdb-nest

✨ Author
Fekry Bahaa
GitHub: @FEKRY7
Docker Hub: @fekry77


