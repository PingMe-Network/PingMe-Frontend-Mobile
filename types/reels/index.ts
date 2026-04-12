export interface Reel {
  id: number
  videoUrl: string
  caption: string
  hashtags?: string[]
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  isLikedByMe: boolean
  isSavedByMe?: boolean
  userId: number
  userName: string
  userAvatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface ReelResponse {
  id: number
  videoUrl: string
  caption: string
  hashtags?: string[]
  viewCount: number
  likeCount: number
  commentCount: number
  isLikedByMe: boolean
  isSavedByMe?: boolean
  userId: number
  userName: string
  userAvatarUrl: string | null
  createdAt: string
}

export interface ReelComment {
  id: number
  content: string
  reelId: number
  userId: number
  userName: string
  userAvatarUrl: string | null
  createdAt: string
  reactionCount: number
  reactionSummary: Record<string, number>
  myReaction: ReactionType | null
  isPinned: boolean
  parentId: number | null
  isReelOwner?: boolean
}

export interface ReelCommentResponse {
  content: ReelComment[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasMore: boolean
}

export type ReactionType = "LIKE" | "LOVE" | "HAHA" | "WOW" | "SAD" | "ANGRY"

export interface CreateReelRequest {
  caption: string
  hashtags: string[]
  video: File
}

export interface UpsertReelRequest {
  caption: string
  hashtags?: string[]
}

export interface ReelFeedResponse {
  content: Reel[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasMore: boolean
}

export interface CreateCommentRequest {
  content: string
  parentId?: number
}

export interface UpdateCommentRequest {
  content: string
  parentId: number | null
}

export interface LikeResponse {
  id: number
  isLikedByMe: boolean
  likeCount: number
}

export interface SaveResponse {
  id: number
  isSavedByMe: boolean
  saveCount?: number
}

export interface ReelDetailResponse extends Reel {
  comments: ReelComment[]
  userFollowed: boolean
}

export interface SearchHistoryItem {
  id: number
  query: string
  searchedAt: string
  userId: number
}

export interface SearchHistoryResponse {
  content: SearchHistoryItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasMore: boolean
}

// Admin Reel types
export interface AdminReel {
  id: number
  videoUrl: string
  caption: string
  viewCount: number
  likeCount: number
  commentCount: number
  saveCount: number
  userId: number
  userName: string
  userAvatarUrl: string | null
  status: string | null
  adminNote: string | null
  createdAt: string
}

export interface AdminReelResponse {
  content: AdminReel[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasMore: boolean
}

export interface AdminReelDetail {
  id: number
  videoUrl: string
  caption: string
  viewCount: number
  likeCount: number
  commentCount: number
  saveCount: number
  userId: number
  userName: string
  userAvatarUrl: string | null
  status: string | null
  adminNote: string | null
  createdAt: string
}

export type ReelStatus = "ACTIVE" | "HIDDEN"

export interface HideReelRequest {
  reason?: string
}

export interface HideReelResponse {
  id: number
  status: ReelStatus
  adminNote: string | null
  updatedAt: string
}
