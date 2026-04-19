import type { MetaFunction } from '@vercel/remix';
import { SettingsContent } from '~/components/SettingsContent.client';
import { ClientOnly } from 'remix-utils/client-only';

export const meta: MetaFunction = () => {
  return [{ title: 'Settings | Chef' }];
};

export default function Settings() {
  return (
    <ClientOnly>{() => <SettingsContent />}</ClientOnly>
  );
}
