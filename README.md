# Telkom Revenue Backend

FastAPI backend for the Telkom Revenue Workspace.

## Deploy ke Railway

1. Push repo ini ke GitHub
2. Buat project baru di Railway (https://railway.app)
3. Connect ke repo GitHub ini
4. Tambahkan Volume di Railway dan mount ke /app/data
5. Set environment variables:
   - DB_PATH=/app/data/revenue_workspace.db
   - FRONTEND_ORIGINS=https://telkom-intern-project.vercel.app
6. Railway otomatis detect railway.toml dan deploy

## Local Development

    pip install -r requirements.txt
    python -m uvicorn backend.main:app --reload
