const { execSync } = require("child_process");

if (process.env.RENDER) {
  console.log("Render build detected — running next build...");
  execSync("npm run build", { stdio: "inherit" });
}
