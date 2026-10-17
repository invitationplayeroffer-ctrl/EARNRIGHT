# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## External hosting on Vercel

Use the existing framework configuration and set Vercel's Build Command to
`NITRO_PRESET=vercel bun run build`. Nitro generates the Vercel deployment output;
do not add SPA rewrites. This external build has not been deployed or verified.

The ZIP contains application source, not accounts, balances, uploaded images, or
a standalone database. Those remain in Lovable Cloud. Browser-facing configuration
must point to a supported backend. On another host, authentication server functions
also need private server-side configuration. User bans and password resets need
privileged credentials managed by Lovable Cloud, which cannot be exported from
Lovable Cloud. Do not copy credentials from logs or put private keys in VITE_ variables.

Therefore this ZIP is **not a fully working standalone Vercel deployment**. Use
Lovable publishing for the currently integrated app, or migrate to a separately
owned supported backend and configure authentication, storage, migrations and
server credentials before external deployment. Payment approvals are manual status
updates; they do not transfer money. Ad timing measures elapsed time, not verified
provider engagement or payout eligibility.
