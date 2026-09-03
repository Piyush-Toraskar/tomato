import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL;

if (!BASE_URL) {
    throw new Error(
        "BASE_URL is required. Example: " +
        "BASE_URL=https://your-app.up.railway.app"
    );
}

export const options = {
    stages: [
        {
            duration: "30s",
            target: 1,
        },
        {
            duration: "1m",
            target: 5,
        },
        {
            duration: "1m",
            target: 10,
        },
        {
            duration: "1m",
            target: 10,
        },
        {
            duration: "30s",
            target: 0,
        },
    ],

    thresholds: {
        http_req_failed: [
            "rate<0.01",
        ],

        http_req_duration: [
            "p(95)<800",
            "p(99)<1500",
        ],

        "http_req_duration{name:GET /health}": [
            "p(95)<300",
        ],

        "http_req_duration{name:GET /database-health}": [
            "p(95)<600",
        ],

        "http_req_duration{name:GET /restaurants}": [
            "p(95)<800",
        ],
    },
};

function testHealth() {
    const response = http.get(
        `${BASE_URL}/health`,
        {
            tags: {
                name: "GET /health",
            },
        }
    );

    check(response, {
        "health returns 200": (r) =>
            r.status === 200,

        "health reports ok": (r) => {
            try {
                return r.json("status") === "ok";
            } catch {
                return false;
            }
        },
    });
}

function testDatabaseHealth() {
    const response = http.get(
        `${BASE_URL}/database-health`,
        {
            tags: {
                name: "GET /database-health",
            },
        }
    );

    check(response, {
        "database health returns 200": (r) =>
            r.status === 200,

        "database is connected": (r) => {
            try {
                return (
                    r.json("database")
                    === "connected"
                );
            } catch {
                return false;
            }
        },
    });
}

function testRestaurants() {
    const response = http.get(
        `${BASE_URL}/restaurants?limit=20&offset=0`,
        {
            tags: {
                name: "GET /restaurants",
            },
        }
    );

    check(response, {
        "restaurants returns 200": (r) =>
            r.status === 200,
    });
}

export default function () {
    const random = Math.random();

    if (random < 0.50) {
        testRestaurants();
    } else if (random < 0.80) {
        testDatabaseHealth();
    } else {
        testHealth();
    }

    sleep(1);
}
