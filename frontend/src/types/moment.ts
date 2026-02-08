export interface LikeSchema {
  user_id: number;
  username: string;
  avatar?: string;
}

export interface CommentSchema {
  user_id: number;
  username: string;
  avatar?: string;
  content: string;
  created_at: string;
  cid?: string;
}

export interface MomentResponse {
  id: number;
  user_id: number;
  username: string;
  avatar: string | undefined;
  content: string | null;
  images: string[];
  likes: LikeSchema[];
  comments: CommentSchema[];
  created_at: string;
}

export interface MomentCreateData {
  content: string;
  images: string[];
}
