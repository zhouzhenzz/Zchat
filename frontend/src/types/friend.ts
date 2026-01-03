export interface FriendInfo {
  id: number;
  username: string;
  avatar_url?: string;
}

export interface Friendship {
  id: number;
  user_id: number;
  friend_id: number;
  status: boolean;
  created_at: string;
  // 为了 UI 展示，我们需要后端最好能返回 friend_info (根据你的 FriendshipDetailOut)
  // 如果后端暂未返回，前端暂时用 id 代替
  friend_info?: FriendInfo; 
}