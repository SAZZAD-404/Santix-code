import { json } from '@vercel/remix';

export async function action({ request }: { request: Request }) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }
  return json({
    projectId: process.env.VERCEL_PROJECT_ID ?? '',
    teamId: process.env.VERCEL_TEAM_ID ?? '',
    productionBranchUrl: process.env.VERCEL_PRODUCTION_BRANCH_URL ?? '',
  });
}
