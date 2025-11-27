import React from 'react';
import { googleLogout } from '@react-oauth/google';

interface UserProfileProps {
    user: {
        name: string;
        email: string;
        picture: string;
    };
    onLogout: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout }) => {
    const handleLogout = () => {
        googleLogout();
        onLogout();
    };

    return (
        <div className="flex items-center gap-3 bg-slate-800/50 p-1 pr-3 rounded-full border border-slate-700 hover:bg-slate-800 transition-colors">
            <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-slate-600" />
            <div className="hidden md:block text-sm">
                <p className="text-slate-200 font-medium leading-none mb-0.5">{user.name}</p>
                <p className="text-slate-400 text-[10px] leading-none">{user.email}</p>
            </div>
            <button
                onClick={handleLogout}
                className="ml-2 p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-full transition-all"
                title="Logout"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-1.047a.75.75 0 00-1.06-1.06l-2.328 2.328a.75.75 0 000 1.06l2.328 2.328a.75.75 0 101.06-1.06L8.704 10.75h9.546c.414 0 .75-.336.75-.75z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
    );
};
