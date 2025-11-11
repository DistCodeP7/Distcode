This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

1. Start PostgreSQL database from the docker-compose repo:

```bash
git clone https://github.com/DistCodeP7/docker-compose.git docker-compose
cd docker-compose
docker-compose up -d
```

2. Run the development server:

```bash
pnpm dev
```

3. Push database schemas to docker:

```bash
npx drizzle-kit push
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Migrate schema

```bash
npx drizzle-kit generate
# If in local docker environment
npx drizzle-kit push
# if not
docker-compose exec app npx drizzle-kit push
```
