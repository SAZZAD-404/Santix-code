import { redirect } from '@vercel/remix';
import type { LoaderFunctionArgs, MetaFunction } from '@vercel/remix';

export const meta: MetaFunction = () => {
  return [{ title: 'CodeAgent' }];
};

export async function loader(_args: LoaderFunctionArgs) {
  // Share/clone feature requires Convex — redirect to home
  return redirect('/');
}

export default function ShareProject() {
  return null;
}
