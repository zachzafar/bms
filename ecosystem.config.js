module.exports = {
  apps: [
    {
      name: "nestjs-api",
      script: "pnpm",
      args: "--filter=api start:prod",
      cwd: __dirname,
    },
    {
      name: "nextjs-web",
      script: "pnpm",
      args: "--filter=web start",
      cwd: __dirname,
    },
  ],
};
