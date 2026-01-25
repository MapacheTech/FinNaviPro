import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Loader2, Check, Users } from 'lucide-react';
import { socialService, FriendRequest } from '../services/socialService';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

interface SearchResult {
  id: string;
  name: string;
  requestSent?: boolean;
}

export const AddFriendModal: React.FC<AddFriendModalProps> = ({ isOpen, onClose, onUpdate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPendingRequests();
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen]);

  const loadPendingRequests = async () => {
    setLoadingRequests(true);
    try {
      const requests = await socialService.getPendingRequests();
      setPendingRequests(requests);
    } catch (error) {
      console.error('Error loading pending requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const results = await socialService.searchUsers(searchQuery);
      setSearchResults(results.map(r => ({ ...r, requestSent: false })));
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    setSendingTo(userId);
    try {
      const success = await socialService.sendFriendRequest(userId);
      if (success) {
        setSearchResults(prev =>
          prev.map(r => r.id === userId ? { ...r, requestSent: true } : r)
        );
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
    } finally {
      setSendingTo(null);
    }
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    setAcceptingId(friendshipId);
    try {
      const success = await socialService.acceptFriendRequest(friendshipId);
      if (success) {
        setPendingRequests(prev => prev.filter(r => r.id !== friendshipId));
        onUpdate();
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleRejectRequest = async (friendshipId: string) => {
    setRejectingId(friendshipId);
    try {
      const success = await socialService.removeFriendship(friendshipId);
      if (success) {
        setPendingRequests(prev => prev.filter(r => r.id !== friendshipId));
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    } finally {
      setRejectingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface border border-white/10 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UserPlus size={24} className="text-primary" />
            Add Friends
          </h2>
          <button onClick={onClose}>
            <X size={20} className="text-textMuted hover:text-white" />
          </button>
        </div>

        {/* Search Section */}
        <div className="space-y-4 mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-3 text-textMuted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name..."
                className="w-full bg-surfaceHighlight border border-white/10 rounded-xl p-3 pl-10 text-sm text-white focus:outline-none focus:border-primary placeholder-white/20"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="px-4 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {searching ? <Loader2 size={18} className="animate-spin" /> : 'Search'}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-surfaceHighlight/50 rounded-2xl overflow-hidden border border-white/5">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 border-b border-white/5 last:border-0"
                >
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                    alt={user.name}
                    className="w-10 h-10 rounded-full bg-surface"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-sm">{user.name}</p>
                  </div>
                  {user.requestSent ? (
                    <div className="flex items-center gap-1 text-primary text-xs font-bold">
                      <Check size={14} /> Sent
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(user.id)}
                      disabled={sendingTo === user.id}
                      className="px-3 py-1.5 bg-primary/20 text-primary text-xs font-bold rounded-lg hover:bg-primary/30 transition-colors disabled:opacity-50"
                    >
                      {sendingTo === user.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        'Add'
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Requests Section */}
        <div className="flex-1 overflow-y-auto">
          <h3 className="text-sm font-bold text-textMuted uppercase tracking-wider mb-3 flex items-center gap-2">
            <Users size={14} />
            Pending Requests ({pendingRequests.length})
          </h3>

          {loadingRequests ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-textMuted">
              <Users size={40} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center gap-3 p-3 bg-surfaceHighlight/50 rounded-2xl border border-white/5"
                >
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${request.friendAvatar}`}
                    alt={request.friendName}
                    className="w-10 h-10 rounded-full bg-surface"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-sm">{request.friendName}</p>
                    <p className="text-[10px] text-textMuted">Wants to be friends</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      disabled={rejectingId === request.id}
                      className="px-3 py-1.5 bg-white/5 text-textMuted text-xs font-bold rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                      {rejectingId === request.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        'Decline'
                      )}
                    </button>
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                      disabled={acceptingId === request.id}
                      className="px-3 py-1.5 bg-primary text-black text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {acceptingId === request.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        'Accept'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
