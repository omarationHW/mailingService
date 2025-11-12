# Database Setup Guide

## Problem

The application requires a PostgreSQL database to be running at `localhost:5432`. If you see this error:

```
Error: P1001: Can't reach database server at `localhost:5432`
```

It means PostgreSQL is not running or not accessible.

## Solutions

Choose one of the following options:

### Option 1: Using Docker (Recommended)

This is the easiest way to get PostgreSQL running on Windows without a full installation.

#### Prerequisites
- Docker Desktop for Windows ([Download here](https://www.docker.com/products/docker-desktop/))

#### Steps

1. **Install Docker Desktop** (if not already installed)

2. **Start PostgreSQL using Docker Compose**
   ```bash
   # From the root of the project (mailingService directory)
   docker-compose up -d
   ```

3. **Verify PostgreSQL is running**
   ```bash
   docker ps
   ```
   You should see a container named `email_marketing_db`

4. **Run migrations**
   ```bash
   cd backend
   npm run prisma:migrate
   ```

5. **Start the application**
   ```bash
   npm run dev
   ```

#### Useful Docker Commands

```bash
# Stop the database
docker-compose down

# Stop and remove all data
docker-compose down -v

# View logs
docker-compose logs -f postgres

# Restart the database
docker-compose restart
```

---

### Option 2: Installing PostgreSQL on Windows

#### Download and Install

1. **Download PostgreSQL**
   - Go to [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
   - Download the installer (version 14 or higher)

2. **Run the installer**
   - Set password for the `postgres` user (remember this!)
   - Keep the default port: `5432`
   - Complete the installation

3. **Update the .env file**

   Edit `backend/.env` and update the DATABASE_URL with your password:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/email_marketing?schema=public"
   ```

4. **Create the database**

   Open SQL Shell (psql) or pgAdmin and run:
   ```sql
   CREATE DATABASE email_marketing;
   ```

5. **Run migrations**
   ```bash
   cd backend
   npm run prisma:migrate
   ```

6. **Start the application**
   ```bash
   npm run dev
   ```

#### Verify PostgreSQL Service is Running

1. Open **Services** (press `Win + R`, type `services.msc`)
2. Look for **postgresql-x64-XX** service
3. Make sure it's **Running**
4. If not, right-click and select **Start**

---

### Option 3: Using a Cloud Database

Use a hosted PostgreSQL service (good for production or if you don't want to run it locally).

#### Free Options:
- **Neon** ([https://neon.tech](https://neon.tech)) - Free tier available
- **Supabase** ([https://supabase.com](https://supabase.com)) - Free tier available
- **Railway** ([https://railway.app](https://railway.app)) - Free trial
- **ElephantSQL** ([https://www.elephantsql.com](https://www.elephantsql.com)) - Free tier available

#### Steps:

1. **Sign up** for one of the services above
2. **Create a new PostgreSQL database**
3. **Copy the connection string** (it will look like: `postgresql://user:pass@host:port/dbname`)
4. **Update backend/.env**:
   ```env
   DATABASE_URL="your-connection-string-here"
   ```
5. **Run migrations**:
   ```bash
   cd backend
   npm run prisma:migrate
   ```
6. **Start the application**:
   ```bash
   npm run dev
   ```

---

## Testing the Connection

After setting up PostgreSQL, test the connection:

```bash
cd backend

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Start the server
npm run dev
```

If successful, you should see:
```
🚀 Email Marketing Platform API is running!
📍 Server: http://localhost:3000
```

Without database errors.

---

## Troubleshooting

### "Port 5432 is already in use"

Another PostgreSQL instance is running. Either:
- Use that instance (update .env with correct credentials)
- Stop the other instance
- Change the port in docker-compose.yml (e.g., `5433:5432`)

### "Password authentication failed"

Your password in the .env file is incorrect. Update:
```env
DATABASE_URL="postgresql://postgres:CORRECT_PASSWORD@localhost:5432/email_marketing?schema=public"
```

### "Database does not exist"

Create the database:
```bash
# Using Docker
docker exec -it email_marketing_db psql -U postgres -c "CREATE DATABASE email_marketing;"

# Or using psql directly
psql -U postgres -c "CREATE DATABASE email_marketing;"
```

### "Connection timeout"

- Check if PostgreSQL is running (docker ps or Services on Windows)
- Check if firewall is blocking port 5432
- Try `localhost` vs `127.0.0.1` in DATABASE_URL

---

## Next Steps

After the database is running:

1. **Open Prisma Studio** (optional, to view/edit data):
   ```bash
   npm run prisma:studio
   ```
   Opens at `http://localhost:5555`

2. **Create your first user** by using the register endpoint or the frontend

3. **Import contacts** and start creating campaigns!

---

## Need Help?

If you're still having issues:

1. Check the error messages in the terminal
2. Verify PostgreSQL is running: `docker ps` or check Windows Services
3. Test the connection string using a tool like pgAdmin or DBeaver
4. Make sure the `.env` file exists in the `backend` directory
