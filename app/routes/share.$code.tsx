import type { MetaFunction } from '@vercel/remix';
import { redirect } from '@vercel/remix';
import { json } from '@vercel/remix';
import { useLoaderData } from '@remix-run/react';
import type { LoaderFunctionArgs } from '@vercel/remix';

export const meta: MetaFunction = () => {
  return [{ title: 'Shared Project | Chef' }];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const { code } = params;
  if (!code) {
    throw new Response('Not Found', { status: 404 });
  }
  // Share feature requires Convex — redirect to home
  return redirect('/');
}

export default function ShowRoute() {
  return null;
}
