import React from 'react';

export const BrainCircuitIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2a10 10 0 0 0-3.54 19.54" />
    <path d="M12 22a10 10 0 0 1-3.54-19.54" />
    <path d="M4 12H2" />
    <path d="M22 12h-2" />
    <path d="M12 4V2" />
    <path d="M12 22v-2" />
    <path d="M17 15.26a8 8 0 0 0-10 0" />
    <path d="M7 8.74a8 8 0 0 1 10 0" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);