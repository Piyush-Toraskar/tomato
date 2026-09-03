import http from "k6/http";
import { check } from "k6";
import { Counter } from "k6/metrics";


const BASE_URL = __ENV.BASE_URL;

if (!BASE_URL) {
    throw new Error("BASE_URL is required");
}


const serverErrors = new Counter("server_errors");
const rateLimited = new Counter("rate_limited");


export const options = {
    discardResponseBodies: true,

    scenarios: {
        rps_400: {
            executor: "constant-arrival-rate",
            exec: "readRestaurants",

            rate: 400,
            timeUnit: "1s",
            duration: "30s",

            preAllocatedVUs: 200,
            maxVUs: 600,

            tags: {
                load: "400rps",
            },
        },

        rps_600: {
            executor: "constant-arrival-rate",
            exec: "readRestaurants",

            startTime: "40s",

            rate: 600,
            timeUnit: "1s",
            duration: "30s",

            preAllocatedVUs: 300,
            maxVUs: 800,

            tags: {
                load: "600rps",
            },
        },

        rps_800: {
            executor: "constant-arrival-rate",
            exec: "readRestaurants",

            startTime: "1m20s",

            rate: 800,
            timeUnit: "1s",
            duration: "30s",

            preAllocatedVUs: 400,
            maxVUs: 1000,

            tags: {
                load: "800rps",
            },
        },

        rps_1000: {
            executor: "constant-arrival-rate",
            exec: "readRestaurants",

            startTime: "2m",

            rate: 1000,
            timeUnit: "1s",
            duration: "30s",

            preAllocatedVUs: 500,
            maxVUs: 1200,

            tags: {
                load: "1000rps",
            },
        },
    },


    thresholds: {
        http_req_failed: [
            {
                threshold: "rate<0.05",
                abortOnFail: true,
                delayAbortEval: "15s",
            },
        ],

        http_req_duration: [
            {
                threshold: "p(95)<2000",
                abortOnFail: true,
                delayAbortEval: "15s",
            },
        ],
    },


    summaryTrendStats: [
        "avg",
        "med",
        "p(90)",
        "p(95)",
        "p(99)",
        "max",
    ],
};


export function readRestaurants() {
    const response = http.get(
        `${BASE_URL}/restaurants?limit=20&offset=0`,
        {
            tags: {
                name: "GET /restaurants",
            },
        }
    );


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