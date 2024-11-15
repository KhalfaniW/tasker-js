import app from "./app.js";
const PORT = process.env.PORT;

const { shutdown } = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
const gracefulShutdown = async () => {
  console.log("Performing graceful shutdown...");
  try {
    await shutdown();
    console.log("Server closed");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown", error);
    process.exit(1);
  }
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
export { app };
