import { Trophy, Target, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Leaderboard() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-8 animate-fade-in">
            <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6">
                <Trophy size={48} className="text-yellow-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Global Leaderboard</h1>
            <p className="text-iq-text-secondary max-w-md mb-8">
                Rankings are currently being compiled by the High Council.
                Check back soon to see where you stand among the elite hunters.
            </p>
            <Link
                to="/hunter/dashboard"
                className="flex items-center gap-2 px-6 py-3 bg-iq-surface border border-white/10 rounded-xl hover:bg-white/5 transition-colors text-white font-medium"
            >
                <ArrowLeft size={18} />
                Return to Base
            </Link>
        </div>
    );
}
