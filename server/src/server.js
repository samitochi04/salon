const http = require("http");
const { env } = require("./config/env");
const app = require("./app");

const server = http.createServer(app);

const port = env.port;

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Server listening on http://localhost:${port}`);
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});

