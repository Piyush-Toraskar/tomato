import asyncio
import json
import logging
from aiokafka import AIOKafkaConsumer
from app.config import settings
from app.redis_client import redis_client

logger = logging.getLogger("order_consumer")


async def run_order_consumer():
    consumer = None
    while consumer is None:
        try:
            consumer = AIOKafkaConsumer(
                settings.kafka_order_topic,
                bootstrap_servers=settings.kafka_bootstrap_servers,
                group_id=settings.kafka_consumer_group,
                auto_offset_reset="earliest",
                value_deserializer=lambda raw: json.loads(raw.decode("utf-8")),
            )
            await consumer.start()
        except asyncio.CancelledError:
            return
        except Exception as exc:
            logger.warning("Kafka consumer retrying in 5s: %s", exc)
            consumer = None
            await asyncio.sleep(5)

    logger.info("Kafka order event consumer started.")
    try:
        async for message in consumer:
            event = message.value
            order_id = event.get("order_id")
            if order_id is not None:
                await redis_client.set_last_order_event(int(order_id), event)
    except asyncio.CancelledError:
        pass
    finally:
        await consumer.stop()
