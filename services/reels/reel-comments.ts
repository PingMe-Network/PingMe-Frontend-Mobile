import axiosClient from "@/lib/axiosClient";
import type {
  ReelComment,
  ReelCommentResponse,
  CreateCommentRequest,
  ReactionType,
} from "@/types/reels";
import type { ApiResponse } from "@/types/base/apiResponse";

/**
 * ======================================
 * TƯƠNG TÁC VỚI REELS (COMMENTS & REACTIONS)
 * ======================================
 */

export const getComments = async (reelId: number, page = 0, size = 20) => {
  const response = await axiosClient.get<ApiResponse<ReelCommentResponse>>(
    `/reel-service/comments/reels/${reelId}?page=${page}&size=${size}`
  );
  return response.data.data;
};

export const createComment = async (reelId: number, data: CreateCommentRequest) => {
  const response = await axiosClient.post<ApiResponse<ReelComment>>(
    `/reel-service/comments/reels/${reelId}`,
    data
  );
  return response.data.data;
};

export const deleteComment = async (commentId: number) => {
  const response = await axiosClient.delete<ApiResponse<void>>(
    `/reel-service/comments/${commentId}`
  );
  return response.data;
};

export const updateComment = async (commentId: number, content: string) => {
  const response = await axiosClient.put<ApiResponse<ReelComment>>(
    `/reel-service/comments/${commentId}`,
    { content }
  );
  return response.data.data;
};

export const getCommentReplies = async (commentId: number, page = 0, size = 10) => {
  const response = await axiosClient.get<ApiResponse<ReelCommentResponse>>(
    `/reel-service/comments/${commentId}/replies?page=${page}&size=${size}`
  );
  return response.data.data;
};

export const addCommentReaction = async (commentId: number, reactionType: ReactionType) => {
  const response = await axiosClient.post<ApiResponse<ReelComment>>(
    `/reel-service/comments/${commentId}/reactions?type=${reactionType}`
  );
  return response.data.data;
};

export const removeCommentReaction = async (commentId: number) => {
  const response = await axiosClient.delete<ApiResponse<ReelComment>>(
    `/reel-service/comments/${commentId}/reactions`
  );
  return response.data.data;
};

export const pinComment = async (commentId: number) => {
  const response = await axiosClient.post<ApiResponse<ReelComment>>(
    `/reel-service/comments/${commentId}/pin`
  );
  return response.data.data;
};

export const unpinComment = async (commentId: number) => {
  const response = await axiosClient.post<ApiResponse<ReelComment>>(
    `/reel-service/comments/${commentId}/unpin`
  );
  return response.data.data;
};
