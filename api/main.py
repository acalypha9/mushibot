import os
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from routes import auth, users, chat, knowledge, providers, tools, mcp, dashboard, reminders, notifications

logger = logging.getLogger(__name__)


async def _cron_reminder_scheduler_loop():

    """Background task running periodically to evaluate and dispatch due cron reminders."""
    from config import SessionLocal
    from models import CronReminder
    from routes.reminders import execute_reminder_delivery, calculate_next_run
    import datetime

    while True:
        try:
            await asyncio.sleep(2)
            now_utc = datetime.datetime.now(datetime.timezone.utc)
            db = SessionLocal()
            try:
                due_reminders = db.query(CronReminder).filter(
                    CronReminder.is_active == True,
                    CronReminder.next_run_at != None,
                    CronReminder.next_run_at <= now_utc,
                ).all()

                for reminder in due_reminders:
                    try:
                        print(f"[Cron Scheduler] Triggering due reminder: '{reminder.title}' ({reminder.cron_expression})", flush=True)
                        res = await execute_reminder_delivery(reminder)
                        reminder.last_run_at = now_utc
                        reminder.run_count = (reminder.run_count or 0) + 1
                        if res.get("success"):
                            reminder.last_status = "SUCCESS"
                            reminder.last_error = None
                        else:
                            reminder.last_status = "FAILED"
                            reminder.last_error = str(res.get("detail", "Delivery failed"))

                        # Track runs in current day/cycle
                        meta = dict(reminder.cmetadata) if isinstance(reminder.cmetadata, dict) else {}
                        tz_name = reminder.timezone or "Asia/Jakarta"
                        try:
                            import zoneinfo
                            tz = zoneinfo.ZoneInfo(tz_name)
                        except Exception:
                            tz = datetime.timezone.utc

                        now_in_tz = now_utc.astimezone(tz)
                        today_str = now_in_tz.strftime("%Y-%m-%d")

                        daily_runs_data = meta.get("_daily_runs", {}) if isinstance(meta.get("_daily_runs"), dict) else {}
                        if daily_runs_data.get("date") == today_str:
                            runs_today = (daily_runs_data.get("count") or 0) + 1
                        else:
                            runs_today = 1

                        meta["_daily_runs"] = {"date": today_str, "count": runs_today}
                        reminder.cmetadata = meta

                        # Determine message limit per scheduled cycle (default 1)
                        sched = meta.get("_schedule", {}) if isinstance(meta.get("_schedule"), dict) else {}
                        limit_val = sched.get("max_runs") or meta.get("max_runs") or 1
                        try:
                            limit_num = max(1, int(limit_val))
                        except (ValueError, TypeError):
                            limit_num = 1

                        is_cycle_complete = (runs_today >= limit_num)

                        # If it is a one-time reminder, deactivate it once delivered
                        if sched.get("type") == "once" or meta.get("is_recurring") is False:
                            reminder.is_active = False
                            reminder.next_run_at = None
                        else:
                            # If cycle is complete, advance to next day/period (after_execution=True)
                            # If cycle still has remaining runs today, schedule next run within remaining window (after_execution=False)
                            reminder.next_run_at = calculate_next_run(
                                reminder.cron_expression,
                                reminder.timezone,
                                base_time=now_utc,
                                cmetadata=reminder.cmetadata,
                                after_execution=is_cycle_complete,
                            )
                        db.commit()
                    except Exception as loop_err:
                        db.rollback()
                        print(f"[Cron Scheduler Error during reminder execution]: {loop_err}", flush=True)
            finally:
                db.close()
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"[Cron Scheduler Worker Error]: {e}", flush=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        from config import engine
        from models import Base
        from sqlalchemy import text
        Base.metadata.create_all(bind=engine)
        try:
            with engine.connect() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                conn.commit()
            from langchain_postgres.vectorstores import _get_embedding_collection_store, Base as PGVectorBase
            _get_embedding_collection_store()
            PGVectorBase.metadata.create_all(bind=engine)
        except Exception as pg_err:
            logger.warning("Startup PGVector table init notice: %s", pg_err)
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;"))
            conn.execute(text("ALTER TABLE conversations ADD COLUMN IF NOT EXISTS title VARCHAR;"))
            conn.execute(text("ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;"))
            conn.execute(text("ALTER TABLE conversations ADD COLUMN IF NOT EXISTS customer_phone VARCHAR;"))
            conn.execute(text("ALTER TABLE conversations ADD COLUMN IF NOT EXISTS customer_name VARCHAR;"))
            conn.execute(text("ALTER TABLE conversations ADD COLUMN IF NOT EXISTS participant_phone VARCHAR;"))
            conn.execute(text("ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSON;"))
            conn.execute(text("ALTER TABLE messages ADD COLUMN IF NOT EXISTS prompt_tokens INTEGER DEFAULT 0;"))
            conn.execute(text("ALTER TABLE messages ADD COLUMN IF NOT EXISTS completion_tokens INTEGER DEFAULT 0;"))
            conn.execute(text("ALTER TABLE messages ADD COLUMN IF NOT EXISTS reasoning_tokens INTEGER DEFAULT 0;"))
            conn.execute(text("ALTER TABLE messages ADD COLUMN IF NOT EXISTS total_tokens INTEGER DEFAULT 0;"))
            conn.execute(text("ALTER TABLE messages ADD COLUMN IF NOT EXISTS model_name VARCHAR;"))
            conn.execute(text("UPDATE messages SET model_name = 'default' WHERE sender_type = 'AI' AND (model_name IS NULL OR model_name = '');"))
    except Exception as err:
        logger.warning("Startup DB migration notice: %s", err)
    
    # Start Cron Scheduler Background Task
    scheduler_task = asyncio.create_task(_cron_reminder_scheduler_loop())
    yield
    scheduler_task.cancel()



app = FastAPI(title="Chat API", version="1.0.0", lifespan=lifespan)

_allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "content-disposition"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(chat.router)
app.include_router(knowledge.router)
app.include_router(providers.router)
app.include_router(tools.router)
app.include_router(mcp.router)
app.include_router(dashboard.router)
app.include_router(reminders.router)
app.include_router(notifications.router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=getattr(exc, "headers", None),
        )
    logger.error("Global unhandled exception on %s: %s", request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )


@app.get("/health")
def health():
    from config import engine
    from sqlalchemy import text

    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {"status": "ok"}

