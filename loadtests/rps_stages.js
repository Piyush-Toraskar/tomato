import http from "k6/http";
import { check } from "k6";
import { Rate } from "k6/metrics";

const errors = new Rate("errors");

export const options = {
  scenarios: {
    rps_250: {
      executor: "constant-arrival-rate",
      rate: 250,
      timeUnit: "1s",
      duration: "30s",
      preAllocatedVUs: 100,
      maxVUs: 1000,
      exec: "health",
      startTime: "0s",
      tags: { target: "250" },
    },

    rps_500: {
      executor: "constant-arrival-rate",
      rate: 500,
      timeUnit: "1s",
      duration: "30s",
      preAllocatedVUs: 200,
      maxVUs: 1500,
      exec: "health",
      startTime: "40s",
      tags: { target: "500" },
    },

    rps_750: {
      executor: "constant-arrival-rate",
      rate: 750,
      timeUnit: "1s",
      duration: "30s",
      preAllocatedVUs: 300,
      maxVUs: 2000,
      exec: "health",
      startTime: "1m20s",
      tags: { target: "750" },
    },

    rps_1000: {
      executor: "constant-arrival-rate",
      rate: 1000,
      timeUnit: "1s",
      duration: "30s",
      preAllocatedVUs: 400,
      maxVUs: 2500,
      exec: "health",
      startTime: "2m",
      tags: { target: "1000" },
    },

    rps_1250: {
      executor: "constant-arrival-rate",
      rate: 1250,
      timeUnit: "1s",
      duration: "30s",
      preAllocatedVUs: 500,
      maxVUs: 3000,
      exec: "health",
      startTime: "2m40s",
      tags: { target: "1250" },
    },

    rps_1500: {
      executor: "constant-arrival-rate",
      rate: 1500,
      timeUnit: "1s",
      duration: "30s",
      preAllocatedVUs: 600,
      maxVUs: 3500,
      exec: "health",
      startTime: "3m20s",
      tags: { target: "1500" },
    },
  },

  thresholds: {
    "http_req_failed": ["rate<0.01"],
  },
};

export function health() {
  const res = http.get("http://localhost:8000/health");

  const ok = check(res, {
    "HTTP 200": (r) => r.status === 200,
  });

  errors.add(!ok);
}
