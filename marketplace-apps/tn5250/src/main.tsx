import { defineApp } from "@termloop/react";
import { createApp } from "./App";

defineApp("tn5250", (sdk) => ({ default: createApp(sdk) }));
