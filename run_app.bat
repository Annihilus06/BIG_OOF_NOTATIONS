@echo off
echo ===================================================
echo   Starting GridWise AI Platform (FastAPI + React)
echo ===================================================

start cmd /k "echo Starting FastAPI OR-Tools Backend... && cd backend && py -m uvicorn main:app --reload --port 8000"
start cmd /k "echo Starting React Vite Frontend... && cd frontend && npm run dev"

echo.
echo GridWise AI is starting!
echo - Backend:  http://localhost:8000 (API Docs: http://localhost:8000/docs)
echo - Frontend: http://localhost:5173
echo ===================================================
