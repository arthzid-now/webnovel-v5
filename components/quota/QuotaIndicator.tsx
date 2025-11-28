import React, { useEffect, useState } from 'react';
import { auth, db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useLanguage } from '../../contexts/LanguageContext';

const WHATSAPP_NUMBER = "628128838384"; // Nomor Admin Inkvora
const WHATSAPP_MESSAGE = "Halo Admin Inkvora, saya mau upgrade ke akun Premium. Email saya: ";

export const QuotaIndicator: React.FC = () => {
    const { t } = useLanguage();
    const [quota, setQuota] = useState<{ used: number, limit: number } | null>(null);
    const [isPremium, setIsPremium] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
            const data = doc.data();
            if (data) {
                setIsPremium(data.subscription === 'premium');
                setQuota(data.quota || { used: 0, limit: 50 });
            }
            setLoading(false);
        });

        return () => unsub();
    }, []);

    const handleUpgrade = () => {
        const email = auth.currentUser?.email || "";
        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE + email)}`;
        window.open(url, '_blank');
    };

    if (loading) return <div className="text-xs text-gray-500">Loading quota...</div>;

    if (isPremium) {
        return (
            <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-full">
                <span className="text-amber-400 text-xs font-bold">👑 PREMIUM</span>
                <span className="text-gray-400 text-xs">| Unlimited</span>
            </div>
        );
    }

    const used = quota?.used || 0;
    const limit = quota?.limit || 50;
    const percentage = Math.min((used / limit) * 100, 100);
    const isCritical = percentage > 80;

    return (
        <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400">Free Tier:</span>
                    <span className={`${isCritical ? 'text-red-400' : 'text-emerald-400'} font-mono`}>
                        {used}/{limit}
                    </span>
                </div>
                <div className="w-24 h-1.5 bg-gray-800 rounded-full mt-1 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${isCritical ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>

            <button
                onClick={handleUpgrade}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors shadow-lg shadow-indigo-900/20"
            >
                Upgrade
            </button>
        </div>
    );
};
