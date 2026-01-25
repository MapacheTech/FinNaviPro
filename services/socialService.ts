import { supabase } from './supabaseClient';
import { Friend, Challenge } from '../types';

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';
export type ChallengeType = 'savings' | 'no_spend' | 'debt_payoff' | 'custom';
export type ChallengeStatus = 'active' | 'completed' | 'cancelled';

export interface FriendRequest {
  id: string;
  friendId: string;
  friendName: string;
  friendAvatar: string;
  status: FriendshipStatus;
  createdAt: string;
}

export interface ChallengeInput {
  title: string;
  description?: string;
  target: string;
  challengeType?: ChallengeType;
  endDate: string;
  participantIds?: string[];
}

export const socialService = {
  // ==================== FRIENDS ====================

  /**
   * Get all accepted friends for the current user
   */
  async getFriends(): Promise<Friend[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get friendships where current user is either user_id or friend_id
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        user_id,
        friend_id,
        status,
        created_at
      `)
      .eq('status', 'accepted')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (error) {
      console.error('Error fetching friends:', error);
      return [];
    }

    // Get the friend IDs (the other person in each friendship)
    const friendIds = (data || []).map(f =>
      f.user_id === user.id ? f.friend_id : f.user_id
    );

    if (friendIds.length === 0) return [];

    // Fetch friend profiles
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, name, level, points')
      .in('id', friendIds);

    return (profiles || []).map(p => ({
      id: p.id,
      name: p.name,
      avatarSeed: p.name, // Use name as seed for DiceBear avatar
      points: p.points || 0,
      level: p.level || 1,
      status: 'offline' as const // Would need presence system for real status
    }));
  },

  /**
   * Get pending friend requests (received)
   */
  async getPendingRequests(): Promise<FriendRequest[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('friendships')
      .select('id, user_id, created_at')
      .eq('friend_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching friend requests:', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    // Get requester profiles
    const requesterIds = data.map(r => r.user_id);
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, name')
      .in('id', requesterIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    return data.map(r => ({
      id: r.id,
      friendId: r.user_id,
      friendName: profileMap.get(r.user_id)?.name || 'Unknown',
      friendAvatar: profileMap.get(r.user_id)?.name || 'Unknown',
      status: 'pending' as FriendshipStatus,
      createdAt: r.created_at
    }));
  },

  /**
   * Send a friend request
   */
  async sendFriendRequest(friendId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check if request already exists
    const { data: existing } = await supabase
      .from('friendships')
      .select('id')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
      .single();

    if (existing) {
      console.log('Friendship already exists');
      return false;
    }

    const { error } = await supabase
      .from('friendships')
      .insert({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending'
      });

    if (error) {
      console.error('Error sending friend request:', error);
      return false;
    }

    return true;
  },

  /**
   * Accept a friend request
   */
  async acceptFriendRequest(friendshipId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('friendships')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', friendshipId)
      .eq('friend_id', user.id); // Only the receiver can accept

    if (error) {
      console.error('Error accepting friend request:', error);
      return false;
    }

    return true;
  },

  /**
   * Reject/delete a friend request or friendship
   */
  async removeFriendship(friendshipId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (error) {
      console.error('Error removing friendship:', error);
      return false;
    }

    return true;
  },

  /**
   * Search for users by name (for adding friends)
   */
  async searchUsers(query: string): Promise<Array<{ id: string; name: string }>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !query.trim()) return [];

    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, name')
      .ilike('name', `%${query}%`)
      .neq('id', user.id)
      .limit(10);

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }

    return data || [];
  },

  // ==================== CHALLENGES ====================

  /**
   * Get active challenges for the current user
   */
  async getChallenges(): Promise<Challenge[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get challenges where user is a participant
    const { data: participations, error: partError } = await supabase
      .from('challenge_participants')
      .select('challenge_id, progress')
      .eq('user_id', user.id);

    if (partError) {
      console.error('Error fetching challenge participations:', partError);
      return [];
    }

    if (!participations || participations.length === 0) return [];

    const challengeIds = participations.map(p => p.challenge_id);

    // Get challenge details
    const { data: challenges, error: chalError } = await supabase
      .from('challenges')
      .select('*')
      .in('id', challengeIds)
      .eq('status', 'active');

    if (chalError) {
      console.error('Error fetching challenges:', chalError);
      return [];
    }

    // Get all participants for these challenges
    const { data: allParticipants } = await supabase
      .from('challenge_participants')
      .select('challenge_id, user_id, progress')
      .in('challenge_id', challengeIds);

    // Get participant profiles
    const participantIds = [...new Set((allParticipants || []).map(p => p.user_id))];
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, name, level, points')
      .in('id', participantIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));
    const progressMap = new Map(participations.map(p => [p.challenge_id, p.progress]));

    return (challenges || []).map(c => {
      const challengeParticipants = (allParticipants || [])
        .filter(p => p.challenge_id === c.id)
        .map(p => {
          const profile = profileMap.get(p.user_id);
          return {
            id: p.user_id,
            name: profile?.name || 'Unknown',
            avatarSeed: profile?.name || 'Unknown',
            points: profile?.points || 0,
            level: profile?.level || 1,
            status: 'offline' as const
          };
        });

      const endDate = new Date(c.end_date);
      const today = new Date();
      const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

      return {
        id: c.id,
        title: c.title,
        participants: challengeParticipants,
        daysLeft,
        myProgress: progressMap.get(c.id) || 0,
        target: c.target
      };
    });
  },

  /**
   * Create a new challenge
   */
  async createChallenge(input: ChallengeInput): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Create the challenge
    const { data: challenge, error } = await supabase
      .from('challenges')
      .insert({
        creator_id: user.id,
        title: input.title,
        description: input.description || null,
        target: input.target,
        challenge_type: input.challengeType || 'custom',
        start_date: new Date().toISOString().split('T')[0],
        end_date: input.endDate,
        status: 'active'
      })
      .select()
      .single();

    if (error || !challenge) {
      console.error('Error creating challenge:', error);
      return null;
    }

    // Add creator as participant
    await supabase
      .from('challenge_participants')
      .insert({
        challenge_id: challenge.id,
        user_id: user.id,
        progress: 0
      });

    // Add other participants if specified
    if (input.participantIds && input.participantIds.length > 0) {
      const participantInserts = input.participantIds.map(pId => ({
        challenge_id: challenge.id,
        user_id: pId,
        progress: 0
      }));

      await supabase
        .from('challenge_participants')
        .insert(participantInserts);
    }

    return challenge.id;
  },

  /**
   * Join an existing challenge
   */
  async joinChallenge(challengeId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('challenge_participants')
      .insert({
        challenge_id: challengeId,
        user_id: user.id,
        progress: 0
      });

    if (error) {
      console.error('Error joining challenge:', error);
      return false;
    }

    return true;
  },

  /**
   * Update progress on a challenge
   */
  async updateChallengeProgress(challengeId: string, progress: number): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const clampedProgress = Math.min(100, Math.max(0, progress));

    const { error } = await supabase
      .from('challenge_participants')
      .update({
        progress: clampedProgress,
        completed_at: clampedProgress >= 100 ? new Date().toISOString() : null
      })
      .eq('challenge_id', challengeId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating challenge progress:', error);
      return false;
    }

    return true;
  },

  /**
   * Get leaderboard (friends sorted by points)
   */
  async getLeaderboard(): Promise<Friend[]> {
    const friends = await this.getFriends();

    // Get current user to include in leaderboard
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: myProfile } = await supabase
        .from('user_profiles')
        .select('id, name, level, points')
        .eq('id', user.id)
        .single();

      if (myProfile) {
        friends.push({
          id: myProfile.id,
          name: myProfile.name + ' (You)',
          avatarSeed: myProfile.name,
          points: myProfile.points || 0,
          level: myProfile.level || 1,
          status: 'online'
        });
      }
    }

    // Sort by points descending
    return friends.sort((a, b) => b.points - a.points);
  }
};
