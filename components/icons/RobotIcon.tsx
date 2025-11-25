
import React from 'react';

export const RobotIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <rect width="18" height="12" x="3" y="6" rx="2" />
    <path d="M9 14v1" />
    <path d="M15 14v1" />
    <path d="M9 10v.01" />
    <path d="M15 10v.01" />
    <path d="M12 2v4" />
    <path d="M12 18v4" />
    <path d="M8 22h8" />
  </svg>
);
