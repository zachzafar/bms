module.exports = {
    apps: [
      {
        name: 'nestjs-api', // Name of your NestJS app
        script: 'pnpm', // Use pnpm
        args: '--filter=api start', // Run the start script for the API workspace
        cwd: __dirname, // Set the current working directory to the repo root
        env: {
          NODE_ENV: 'production',
        },
      },
      {
        name: 'nextjs-web', // Name of your Next.js app
        script: 'pnpm', // Use pnpm
        args: '--filter=web start', // Run the start script for the Web workspace
        cwd: __dirname, // Set the current working directory to the repo root
        env: {
          NODE_ENV: 'production',
        },
      },
    ],
  };