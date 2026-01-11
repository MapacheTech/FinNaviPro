import React from 'react';
import { MOCK_FRIENDS, MOCK_CHALLENGES, MOCK_USER } from '../constants';
import { Trophy, Flame, Plus, Users } from 'lucide-react';

export const Social: React.FC = () => {
  // Sort friends including self
  const leaderboard = [
    { ...MOCK_USER, id: 'self', avatarSeed: MOCK_USER.name, status: 'online' },
    ...MOCK_FRIENDS
  ].sort((a, b) => b.points - a.points);

  return (
    <div className="space-y-6 pt-2">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-white">Community</h1>
           <p className="text-sm text-textMuted">Compete & Grow Together</p>
        </div>
        <button className="w-10 h-10 rounded-full bg-surfaceHighlight border border-white/10 flex items-center justify-center text-primary hover:bg-primary hover:text-black transition-colors">
            <Plus size={20} strokeWidth={3} />
        </button>
      </div>

      {/* Active Challenge */}
      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Flame size={18} className="text-orange-500" fill="currentColor" />
            Active Challenges
        </h2>
        {MOCK_CHALLENGES.map(challenge => (
            <div key={challenge.id} className="bg-gradient-to-br from-surfaceHighlight to-surface border border-white/5 rounded-3xl p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Trophy size={80} />
                </div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-xl">{challenge.title}</h3>
                        <span className="text-xs font-bold bg-orange-500/20 text-orange-500 px-2 py-1 rounded-lg border border-orange-500/20">
                            {challenge.daysLeft} days left
                        </span>
                    </div>
                    <p className="text-sm text-textMuted mb-4">{challenge.target}</p>
                    
                    {/* Progress */}
                    <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-textMuted">Group Goal</span>
                            <span className="text-primary font-bold">{challenge.myProgress}%</span>
                        </div>
                        <div className="w-full bg-black h-2 rounded-full overflow-hidden">
                            <div className="bg-primary h-full rounded-full" style={{ width: `${challenge.myProgress}%` }}></div>
                        </div>
                    </div>

                    <div className="flex -space-x-2">
                        {challenge.participants.map(p => (
                            <img 
                                key={p.id}
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.avatarSeed}`} 
                                alt={p.name}
                                className="w-8 h-8 rounded-full border-2 border-surface"
                            />
                        ))}
                         <div className="w-8 h-8 rounded-full border-2 border-surface bg-surfaceHighlight flex items-center justify-center text-[10px] font-bold">
                            +2
                        </div>
                    </div>
                </div>
            </div>
        ))}
      </section>

      {/* Leaderboard */}
      <section>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Users size={18} className="text-secondary" />
            Leaderboard
          </h2>
          <div className="bg-surface/50 rounded-3xl border border-white/5 overflow-hidden">
              {leaderboard.map((user, index) => {
                  const isMe = user.id === 'self';
                  return (
                      <div 
                        key={user.id} 
                        className={`flex items-center gap-4 p-4 border-b border-white/5 last:border-0 ${isMe ? 'bg-primary/5' : ''}`}
                      >
                          <div className="font-bold text-sm w-4 text-center text-textMuted">
                              {index + 1}
                          </div>
                          <div className="relative">
                              <img 
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${isMe ? MOCK_USER.name : (user as any).avatarSeed}`} 
                                alt={user.name} 
                                className="w-10 h-10 rounded-full bg-surface"
                              />
                              {index === 0 && (
                                  <div className="absolute -top-1 -right-1 text-yellow-400 drop-shadow-lg">
                                      <CrownIcon />
                                  </div>
                              )}
                          </div>
                          <div className="flex-1">
                              <p className={`font-bold text-sm ${isMe ? 'text-primary' : 'text-white'}`}>
                                  {user.name} {isMe && '(You)'}
                              </p>
                              <p className="text-xs text-textMuted">Level {user.level}</p>
                          </div>
                          <div className="text-right">
                              <p className="font-bold text-sm">{user.points}</p>
                              <p className="text-[10px] text-textMuted">PTS</p>
                          </div>
                      </div>
                  );
              })}
          </div>
      </section>

      <div className="h-8"></div>
    </div>
  );
};

const CrownIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 20H22M12 2L5 12L2 20H22L19 12L12 2Z" stroke="none" />
    </svg>
);