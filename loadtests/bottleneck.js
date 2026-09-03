import http from "k6/http";
import { check, sleep } from "k6";
import { Counter } from "k6/metrics";


const BASE_URL = __ENV.BASE_URL;

if (!BASE_URL) {
    throw new Error("BASE_URL is required");
}


const serverErrors = new Counter("server_errors");
const rateLimited = new Counter("rate_limited");


export const options = {
    stages: [
        // Warm-up
        { duration: "30s", target: 40 },

        // Progressive increase
        { duration: "1m", target: 80 },

        { duration: "1m", target: 120 },

        { duration: "1m", target: 160 },

        { duration: "1m", target: 200 },

        // Hold peak
        { duration: "1m", target: 200 },

        // Cool down
        { duration: "30s", target: 0 },
    ],

    thresholds: {
        http_req_failed: [
            {
                threshold: "rate<0.05",
                abortOnFail: true,
                delayAbortEval: "30s",
            },
        ],

        http_req_duration: [
            {
                threshold: "p(95)<2000",
                abortOnFail: true,
                delayAbortEval: "30s",
            },
        ],
    },
};


function record(response) {
    if (response.status === 429) {
        rateLimited.add(1);
    }

    if (response.status >= 500) {
        serverErrors.add(1);
    }

    check(response, {
        "request successful": (r) =>
            r.status >= 200 &&
            r.status < 300,
    });
}


function getRestaurants() {
    const response = http.get(
        `${BASE_URL}/restaurants?limit=20&offset=0`,
        {
            tags: {
                name: "GET /restaurants",
            },
        }
    );

    record(response);
}


function getDatabaseHealth() {
    const response = http.get(
        `${BASE_URL}/database-health`,
        {
            tags: {
                name: "GET /database-health",
            },
        }
    );

    record(response);
}


function getHealth() {
    const response = http.get(
        `${BASE_URL}/health`,
        {
            tags: {
                name: "GET /health",
            },
        }
    );

    record(response);
}


export default function () {
    const random = Math.random();

    if (random < 0.60) {
        getRestaurants();
    }

    else if (random < 0.90) {
        getDatabaseHealth();
    }

    else {
        getHealth();
    }

    sleep(1);
}