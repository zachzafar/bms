module.exports = {
    apps: [
      {
        name: 'nestjs-api', // Name of your NestJS app
        script: 'pnpm', // Use pnpm
        args: '--filter=api start', // Run the start script for the API workspace
        cwd: __dirname, // Set the current working directory to the repo root
        env: {
          NODE_ENV: 'production',
          DATABASE_HOST:"localhost",
          DATABASE_PORT:"3306",
          DATABASE_USER:"root",
          DATABASE_PASSWORD:"rootpassword",
          DATABASE_NAME:"mydatabase",
          DATABASE_URL:"mysql://root:rootpassword@localhost:3306/mydatabase",
          CORS_ORIGIN:"https://www.bookos.xyz",
          REFRESH_JWT_SECRET:"3fb3b3c67fb2b966540d4f0033cdc6035dda30cd41083f176625008d7f2a2768382bc888aeb1a88ed95f2e90b0c9e0c8cdf2b7b872db95376d7c0ee472a25f61",
          REFRESH_JWT_EXPIRES_IN:"1d",
          JWT_EXPIRES_IN:"5m",
          SPACES_ENDPOINT:"https://nyc3.digitaloceanspaces.com",
          SPACES_KEY:"DO801XR9LCLCALDM8PGT", 
          SPACES_SECRET:"RGgk9lSeGiCkG4jrFEiB5qW8sgmbz3YxDbYsc58gXhM",
          SPACES_REGION:"nyc3",
          FRONTEND_URL:"https://bookos.xyz",
          RESEND: "re_WDpqRKN1_Lq3RrVzL6Mp72S6HoDKeFSdH",
          JWT_SECRET:"ce726e971a40f3f5b419ae61ab6ff9285564f465608b2a01d113c6b01eaf87749376ca7c887f2e8638e8b1996a6c7d0472e982d1412375fedbd7d14a684c56d6"
        },
      },
      {
        name: 'nextjs-web', // Name of your Next.js app
        script: 'pnpm', // Use pnpm
        args: '--filter=web start', // Run the start script for the Web workspace
        cwd: __dirname, // Set the current working directory to the repo root
        env: {
          NODE_ENV: 'production',
          SESSION_SECRET_KEY:'8ac41fcacd17dac40d0240c2198519c29e3a07c6ee846d93b37d9a755beabbb9db26d2e7eeb15c6eeb401e193cca0e6c38c07a0cedfdfbead7c90d47eea977cb',
          SECURE: 'true',
          DOMAIN: 'bookos.xyz'
        },
      },
    ],
  };