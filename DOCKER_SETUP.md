# 🐳 Wavelength - Docker Setup Guide

## Current Status

Your Supabase is **already running on Docker**! When you run `supabase start`, it automatically uses Docker containers.

### Running Containers

You currently have these Supabase containers running:
- `supabase_db_wavelength` - PostgreSQL database (port 54322)
- `supabase_studio_wavelength` - Supabase Studio UI (port 54323)
- `supabase_kong_wavelength` - API Gateway (port 54321)
- `supabase_auth_wavelength` - Authentication service
- `supabase_realtime_wavelength` - Realtime subscriptions
- `supabase_storage_wavelength` - File storage
- `supabase_rest_wavelength` - PostgREST API
- `supabase_pg_meta_wavelength` - Database metadata
- `supabase_edge_runtime_wavelength` - Edge functions
- `supabase_vector_wavelength` - Vector search
- `supabase_analytics_wavelength` - Analytics
- `supabase_inbucket_wavelength` - Email testing

## 🚀 Docker Setup Commands

### Check Status

```bash
# Check if Supabase containers are running
docker ps | grep supabase

# Check all containers (including stopped)
docker ps -a | grep supabase

# View container logs
docker logs supabase_db_wavelength
docker logs supabase_kong_wavelength

# Check Supabase CLI status
supabase status
```

### Start/Stop Supabase

```bash
# Start Supabase (uses Docker automatically)
supabase start

# Stop Supabase (stops all containers)
supabase stop

# Restart Supabase
supabase stop && supabase start
```

### Database Management

```bash
# Apply migrations
supabase db reset

# Check database is accessible
docker exec -it supabase_db_wavelength psql -U postgres -d postgres

# Direct PostgreSQL access
psql postgresql://postgres:postgres@localhost:54322/postgres
```

## 🔧 Docker Compose Alternative

If you prefer using Docker Compose directly (instead of Supabase CLI), you can, but **it's not recommended** as the CLI handles everything automatically.

However, if you want to customize the setup:

### Option 1: Use Supabase CLI (Recommended ✅)

```bash
# This is what you're currently using - it's the best option
supabase start
```

**Benefits:**
- Automatic container orchestration
- Pre-configured services
- Easy migration management
- Built-in health checks
- Simple commands

### Option 2: Manual Docker Compose (Advanced)

If you really want manual control:

```bash
# Export Supabase config to docker-compose
supabase start

# Find the generated docker-compose file
ls -la ~/.supabase/docker/

# You can inspect the generated docker-compose.yml
cat ~/.supabase/docker/docker-compose.yml
```

## 📊 Monitor Docker Resources

```bash
# View resource usage
docker stats $(docker ps -q -f name=supabase)

# View disk usage
docker system df

# Clean up unused resources
docker system prune
```

## 🗄️ Database Access Methods

### Method 1: Supabase Studio (Easiest)
```bash
open http://localhost:54323
```

### Method 2: Direct PostgreSQL Connection
```bash
# Using psql
psql postgresql://postgres:postgres@localhost:54322/postgres

# Using pgAdmin or any PostgreSQL client
Host: localhost
Port: 54322
Database: postgres
Username: postgres
Password: postgres
```

### Method 3: Docker Exec
```bash
# Execute SQL directly
docker exec -it supabase_db_wavelength psql -U postgres -d postgres -c "SELECT * FROM game_rooms;"

# Interactive psql session
docker exec -it supabase_db_wavelength psql -U postgres
```

## 🔍 Troubleshooting Docker Issues

### Containers Not Starting

```bash
# Check Docker daemon is running
docker info

# Check if ports are available
lsof -i :54321  # API port
lsof -i :54322  # Database port
lsof -i :54323  # Studio port

# If ports are in use, stop Supabase first
supabase stop

# Or kill specific processes
lsof -ti :54321 | xargs kill -9
```

### Container Health Issues

```bash
# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}"

# View logs for unhealthy container
docker logs supabase_db_wavelength --tail 100

# Restart specific container
docker restart supabase_db_wavelength

# Force recreate all containers
supabase stop
supabase start
```

### Disk Space Issues

```bash
# Check disk usage
docker system df

# Remove unused volumes
docker volume prune

# Remove unused images
docker image prune -a

# Nuclear option: remove everything (careful!)
supabase stop
docker system prune -a --volumes
supabase start
```

### Network Issues

```bash
# Check Supabase network
docker network ls | grep supabase

# Inspect network
docker network inspect supabase_network_wavelength

# Recreate network (if needed)
supabase stop
docker network prune
supabase start
```

## 🔐 Environment Variables

Supabase CLI uses these environment variables (set in `supabase/config.toml`):

```bash
# View current config
cat supabase/config.toml

# Override specific values (optional)
export SUPABASE_DB_PORT=54322
export SUPABASE_API_PORT=54321
export SUPABASE_STUDIO_PORT=54323
```

## 📦 Volume Management

Supabase stores data in Docker volumes:

```bash
# List Supabase volumes
docker volume ls | grep supabase

# Backup database volume
docker run --rm -v supabase_db_wavelength:/source -v $(pwd):/backup alpine tar czf /backup/db-backup.tar.gz -C /source .

# Restore database volume (careful!)
docker run --rm -v supabase_db_wavelength:/target -v $(pwd):/backup alpine tar xzf /backup/db-backup.tar.gz -C /target

# Remove all volumes (nuclear option - deletes all data!)
supabase stop
docker volume rm $(docker volume ls -q | grep supabase)
```

## 🚦 Port Mapping

Your Supabase instance uses these ports:

| Service | Container Port | Host Port | Purpose |
|---------|---------------|-----------|---------|
| Kong (API Gateway) | 8000 | 54321 | Main API endpoint |
| PostgreSQL | 5432 | 54322 | Direct DB access |
| Studio | 3000 | 54323 | Web UI |
| InBucket | 8025 | 54324 | Email testing |
| Analytics | 4000 | 54327 | Analytics API |

If you need to change ports, edit `supabase/config.toml`:

```toml
[api]
port = 54321  # Change this if port conflict

[db]
port = 54322  # Change this if port conflict
```

## 🔄 Migration Workflow with Docker

```bash
# 1. Create migration
supabase migration new my_migration

# 2. Edit migration file
code supabase/migrations/YYYYMMDDHHMMSS_my_migration.sql

# 3. Apply migration
supabase db reset

# 4. Verify in database
docker exec -it supabase_db_wavelength psql -U postgres -c "\dt"

# 5. Check in Studio
open http://localhost:54323
```

## 🧪 Testing with Docker

```bash
# Run full test suite
npm test

# Test database connection
docker exec -it supabase_db_wavelength pg_isready -U postgres

# Test API endpoint
curl http://localhost:54321/rest/v1/

# Test Studio
curl http://localhost:54323/api/health
```

## 🛠️ Advanced Docker Commands

### View Container Details

```bash
# Inspect container
docker inspect supabase_db_wavelength

# View container processes
docker top supabase_db_wavelength

# View container changes
docker diff supabase_db_wavelength
```

### Performance Monitoring

```bash
# Real-time stats
docker stats supabase_db_wavelength

# Container events
docker events --filter container=supabase_db_wavelength

# Resource limits
docker inspect supabase_db_wavelength | grep -A 10 "HostConfig"
```

### Execute Commands in Containers

```bash
# Run shell in database container
docker exec -it supabase_db_wavelength sh

# Run SQL file
docker exec -i supabase_db_wavelength psql -U postgres < my-script.sql

# Create database backup
docker exec -it supabase_db_wavelength pg_dump -U postgres postgres > backup.sql

# Restore from backup
docker exec -i supabase_db_wavelength psql -U postgres postgres < backup.sql
```

## 🚀 Production Docker Setup

For production, you'd use a different approach:

```bash
# Deploy to Supabase Cloud (recommended)
supabase link --project-ref your-project-id
supabase db push

# Or self-host with production docker-compose
# (Download official Supabase docker-compose.yml)
wget https://raw.githubusercontent.com/supabase/supabase/master/docker/docker-compose.yml
docker-compose -f docker-compose.yml up -d
```

## 📝 Quick Reference

```bash
# Start everything
supabase start

# Stop everything
supabase stop

# View logs
docker logs -f supabase_db_wavelength

# Execute SQL
docker exec -it supabase_db_wavelength psql -U postgres

# Open Studio
open http://localhost:54323

# Check status
docker ps | grep supabase

# Clean restart
supabase stop && supabase start
```

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] `docker ps | grep supabase` shows running containers
- [ ] `supabase status` shows all services running
- [ ] Can access Studio at http://localhost:54323
- [ ] Can query database: `docker exec -it supabase_db_wavelength psql -U postgres`
- [ ] Migrations applied: Check tables in Studio
- [ ] API responds: `curl http://localhost:54321/rest/v1/`
- [ ] Dev server works: `npm run dev`

## 🆘 Common Docker Issues

### "Port already in use"
```bash
# Find what's using the port
lsof -i :54321

# Stop Supabase first
supabase stop

# Or change port in config.toml
```

### "Cannot connect to Docker daemon"
```bash
# Start Docker Desktop
open -a Docker

# Or start Docker service (Linux)
sudo systemctl start docker
```

### "Container unhealthy"
```bash
# View logs
docker logs supabase_db_wavelength

# Restart container
docker restart supabase_db_wavelength

# Or full restart
supabase stop && supabase start
```

### "Out of disk space"
```bash
# Clean Docker
docker system prune -a

# Remove old volumes
docker volume prune

# Check space
docker system df
```

---

## 🎯 Bottom Line

You're **already set up correctly**! The Supabase CLI automatically manages Docker for you. Just use:

```bash
# Start
supabase start

# Stop  
supabase stop

# That's it! 🎉
```

No need to manually manage Docker Compose or containers. The CLI handles everything.
