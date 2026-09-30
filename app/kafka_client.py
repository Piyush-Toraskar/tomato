import json
import logging
from typing import Optional
from aiokafka import AIOKafkaProducer
from app.config import settings

logger = logging.getLogger("kafka_client")


class KafkaProducerClient:
    def __init__(self):
        self.producer: Optional[AIOKafkaProducer] = None

    async def start(self):
        try:
            self.producer = AIOKafkaProducer(
                bootstrap_servers=settings.kafka_bootstrap_servers,
                value_serializer=lambda value: json.dumps(value, default=str).encode("utf-8"),
                key_serializer=lambda key: str(key).encode("utf-8") if key is not None else None,
                acks="all",
            )
            await self.producer.start()
            logger.info("Kafka producer started successfully.")
        except Exception as exc:
            logger.warning("Kafka unavailable; continuing without events: %s", exc)
            self.producer = None

    async def stop(self):
        if self.producer:
            await self.producer.stop()
            self.producer = None

    async def send_order_event(self, event_type: str, order_id: int, **payload):
        if not self.producer:
            return
        event = {"event_type": event_type, "order_id": order_id, **payload}
        await self.producer.send_and_wait(settings.kafka_order_topic, event, key=str(order_id))


kafka_producer = KafkaProducerClient()
