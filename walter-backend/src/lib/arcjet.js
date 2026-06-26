import arcjet, { shield, detectBot, slidingWindow } from "@arcjet/node";

import { ENV } from "./env.js";

const aj = ENV.ARCJET_KEY
  ? arcjet({
      key: ENV.ARCJET_KEY,
      rules: [
        shield({ mode: "LIVE" }),
        detectBot({
          mode: "LIVE",
          allow: ["CATEGORY:SEARCH_ENGINE"],
        }),
        slidingWindow({
          mode: "LIVE",
          max: 100,
          interval: 60,
        }),
      ],
    })
  : null;

export default aj;
