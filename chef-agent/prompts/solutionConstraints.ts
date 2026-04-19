import { stripIndents } from '../utils/stripIndent.js';
import type { SystemPromptOptions } from '../types.js';

export function solutionConstraints(_options: SystemPromptOptions) {
  return stripIndents`
  <solution_constraints>
    <template_info>
      The WebContainer environment starts with a React + Vite template at '/home/project'.
      Dependencies are in package.json and already installed in node_modules.
      You MUST use this template. Technologies available:
      - Vite + React for the frontend
      - TailwindCSS for styling
      - NO backend — use localStorage, in-memory state, or browser APIs for data persistence

      Key files:
      - src/App.tsx — main React component
      - src/main.tsx — entry point (DO NOT modify)
      - index.html — HTML entry point
      - package.json — dependencies (DO NOT modify unless adding a new npm package)
    </template_info>

    <tech_constraints>
      - Build FRONTEND-ONLY apps using React + Vite
      - Use localStorage for persistent data storage
      - Use React state (useState, useReducer, useContext) for in-memory state
      - Use TailwindCSS for all styling — do NOT use inline styles or external CSS frameworks
      - Do NOT use any backend, server, or database (no Convex, no Firebase, no Supabase)
      - Do NOT use any authentication libraries
      - Do NOT use Shadcn/UI or other component libraries — build UI components from scratch with Tailwind
      - You MAY install additional npm packages if needed (e.g. react-router-dom, date-fns, zustand)
      - Always make the UI look polished and professional
      - Always handle edge cases (empty states, loading states, error states)
    </tech_constraints>

    <data_persistence>
      For data that needs to persist across page reloads, use localStorage:
      \`\`\`ts
      // Save
      localStorage.setItem('key', JSON.stringify(data));
      // Load
      const data = JSON.parse(localStorage.getItem('key') || '[]');
      \`\`\`

      For real-time-like features (e.g. chat), simulate with React state and localStorage.
      Multiple browser tabs can share data via the 'storage' event:
      \`\`\`ts
      window.addEventListener('storage', (e) => {
        if (e.key === 'messages') setMessages(JSON.parse(e.newValue || '[]'));
      });
      \`\`\`
    </data_persistence>
  </solution_constraints>
  `;
}
