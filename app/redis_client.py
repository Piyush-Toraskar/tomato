import logging
from typing import Optional
import redis.asyncio as aioredis
from app.config import settings

logger = logging.getLogger("redis_client")


class RedisClient:
    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None

    async def connect(self):
        try:
            self.redis = aioredis.from_url(settings.redis_url, decode_responses=True, max_connections=20)
            await self.redis.ping()
            logger.info("Connected to Redis successfully.")
        except Exception as exc:
            logger.warning("Redis unavailable; continuing without Redis: %s", exc)
            self.redis = None

    async def disconnect(self):
        if self.redis:
            await self.redis.aclose()
            self.redis = None

    async def update_driver_geo(self, driver_id: int, lat: float, lng: float):
        if not self.redis:
            return
        await self.redis.execute_command("GEOADD", "drivers:geo", lng, lat, str(driver_id))
        await self.redis.set(f"driver:{driver_id}:location", f"{lat},{lng}", ex=300)

    async def set_last_order_event(self, order_id: int, event: dict):
        if self.redis:
            import json
            await self.redis.set(f"order:{order_id}:last_event", json.dumps(event), ex=86400)


redis_client = RedisClient()
