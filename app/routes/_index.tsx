import type { MetaFunction } from '@vercel/remix';
import { ClientOnly } from 'remix-utils/client-only';
import { Header } from '~/components/header/Header';
import { Homepage } from '~/components/Homepage.client';

export const meta: MetaFunction = () => {
  return [
    { title: 'CodeAgent | AI Coding Assistant' },
    { name: 'description', content: 'AI coding agent — describe what you want to build, get a working app instantly.' },
  ];
};

export default function Index() {
  return (
    <div className="flex size-full flex-col bg-bolt-elements-background-depth-1">
      <Header />
      <ClientOnly>{() => <Homepage />}</ClientOnly>
    </div>
  );
}
