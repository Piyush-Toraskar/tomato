import http from "k6/http";
import { check } from "k6";
import { Rate } from "k6/metrics";

const errors = new Rate("errors");

export const options = {
  scenarios: {
    rps_test: {
      executor: "ramping-arrival-rate",
      startRate: 100,
      timeUnit: "1s",

      preAllocatedVUs: 300,
      maxVUs: 2000,

      stages: [
        { target: 100,  duration: "20s" },
        { target: 250,  duration: "30s" },
        { target: 500,  duration: "30s" },
        { target: 750,  duration: "30s" },
        { target: 1000, duration: "30s" },
        { target: 1250, duration: "30s" },
        { target: 1500, duration: "60s" },
        { target: 0,    duration: "20s" },
      ],
    },
  },

  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: [
      "p(95)<500",
      "p(99)<1000",
    ],
  },
};

export default function () {
  const response = http.get("http://localhost:8000/health");

  const success = check(response, {
    "HTTP 200": (r) => r.status === 200,
  });

  errors.add(!success);
}
