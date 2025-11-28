import React, { useState } from 'react';

interface UserProfileProps {
    user: {
        name: string;
        email: string;
        picture: string;
    };
    onLogout: () => void;
    onSync?: () => Promise<void>;
    isPremium?: boolean; // Add premium status prop
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout, onSync, isPremium = false }) => {
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = async () => {
        if (onSync) {
            setIsSyncing(true);
            await onSync();
            setIsSyncing(false);
        }
    };

    return (
        <div className="flex items-center gap-3 bg-slate-800/50 p-1 pr-3 rounded-full border border-slate-700 hover:bg-slate-800 transition-colors">
            {/* Avatar with conditional golden border */}
            <img
                src={user.picture}
                alt={user.name}
                className={`w-8 h-8 rounded-full border-2 transition-all ${isPremium
                        ? 'border-yellow-500 shadow-lg shadow-yellow-500/30'
                        : 'border-slate-600'
                    }`}
            />
            <div className="hidden md:block text-sm">
                <div className="flex items-center gap-1.5">
                    <p className="text-slate-200 font-medium leading-none">{user.name}</p>
                    {/* Premium/Free Badge */}
                    {isPremium ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-900 rounded leading-none">
                            ⭐ PRO
                        </span>
                    ) : (
                        <span className="text-[9px] font-medium px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded leading-none">
                            🆓 FREE
                        </span>
                    )}
                </div>
                <p className="text-slate-400 text-[10px] leading-none mt-1">{user.email}</p>
            </div>

            {onSync && (
                <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className={`ml-2 p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-700/50 rounded-full transition-all ${isSyncing ? 'animate-spin text-indigo-400' : ''}`}
                    title="Sync to Cloud"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.433l-.31-.31a7 7 0 00-11.712 3.138.75.75 0 001.449.39 5.5 5.5 0 019.201-2.466l.312.312H11.75a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                    </svg>
                </button>
            )}

            <button
                onClick={onLogout}
                className="ml-1 p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-full transition-all"
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
