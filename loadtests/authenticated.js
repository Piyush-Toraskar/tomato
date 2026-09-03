import http from "k6/http";
import { check, sleep } from "k6";


const BASE_URL = __ENV.BASE_URL;
const EMAIL = __ENV.LOADTEST_EMAIL;
const PASSWORD = __ENV.LOADTEST_PASSWORD;


if (!BASE_URL) {
    throw new Error("BASE_URL is required");
}

if (!EMAIL) {
    throw new Error("LOADTEST_EMAIL is required");
}

if (!PASSWORD) {
    throw new Error("LOADTEST_PASSWORD is required");
}


export const options = {
    stages: [
        {
            duration: "30s",
            target: 2,
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
            target: 20,
        },
        {
            duration: "1m",
            target: 20,
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

        "http_req_duration{name:GET /auth/me}": [
            "p(95)<800",
        ],

        "http_req_duration{name:GET /orders}": [
            "p(95)<800",
        ],

        "http_req_duration{name:GET /restaurants}": [
            "p(95)<800",
        ],
    },
};


export function setup() {
    const deviceId = `k6-load-test-${Date.now()}`;

    const loginResponse = http.post(
        `${BASE_URL}/auth/login`,
        JSON.stringify({
            email: EMAIL,
            password: PASSWORD,
            device_id: deviceId,
        }),
        {
            headers: {
                "Content-Type": "application/json",
            },

            tags: {
                name: "POST /auth/login",
            },
        }
    );


    const loginOk = check(loginResponse, {
        "login returns success": (r) =>
            r.status >= 200 && r.status < 300,
    });


    if (!loginOk) {
        console.error(
            `Login failed. Status=${loginResponse.status}`
        );

        throw new Error(
            "Load-test login failed. Check the dedicated test account."
        );
    }


    let body;

    try {
        body = loginResponse.json();
    } catch {
        throw new Error(
            "Login succeeded but response was not valid JSON."
        );
    }


    const accessToken =
        body.access_token ??
        body.token ??
        body.accessToken;


    if (!accessToken) {
        console.error(
            `Login response keys: ${Object.keys(body).join(", ")}`
        );

        throw new Error(
            "Could not find access token in login response."
        );
    }


    return {
        accessToken,
    };
}


function authHeaders(token) {
    return {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
    };
}


function testMe(token) {
    const response = http.get(
        `${BASE_URL}/auth/me`,
        {
            headers: authHeaders(token),

            tags: {
                name: "GET /auth/me",
            },
        }
    );


    check(response, {
        "auth me returns 200": (r) =>
            r.status === 200,
    });
}


function testOrders(token) {
    const response = http.get(
        `${BASE_URL}/orders?limit=20&offset=0`,
        {
            headers: authHeaders(token),

            tags: {
                name: "GET /orders",
            },
        }
    );


    check(response, {
        "orders returns 200": (r) =>
            r.status === 200,
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


export default function (data) {
    const random = Math.random();


    /*
        Traffic mix:

        40% /auth/me
        40% /orders
        20% /restaurants
    */

    if (random < 0.40) {
        testMe(data.accessToken);
    }

    else if (random < 0.80) {
        testOrders(data.accessToken);
    }

    else {
        testRestaurants();
    }


    sleep(1);
}