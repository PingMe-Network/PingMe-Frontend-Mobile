import axiosClient from "@/lib/axiosClient";
import type {
  Reel,
  ReelFeedResponse,
  CreateReelRequest,
  UpsertReelRequest,
  SaveResponse,
  SearchHistoryResponse,
  ReelDetailResponse,
} from "@/types/reels";
import type { ApiResponse } from "@/types/base/apiResponse";

/**
 * ======================================
 * THÊM, SỬA, XÓA REELS
 * ======================================
 */

export const createReel = async (data: CreateReelRequest) => {
  const formData = new FormData();
  formData.append(
    "data",
    JSON.stringify({
      caption: data.caption,
      hashtags: data.hashtags,
    })
  );
  formData.append("video", data.video);

  const response = await axiosClient.post<ApiResponse<Reel>>(
    "/reel-service/reels",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response.data.data;
};

export const updateReel = async (reelId: number, data: UpsertReelRequest) => {
  const formData = new FormData();

  const jsonData = {
    caption: data.caption,
    hashtags: data.hashtags,
  };

  formData.append(
    "data",
    new Blob([JSON.stringify(jsonData)], { type: "application/json" })
  );

  const response = await axiosClient.put<ApiResponse<Reel>>(
    `/reel-service/reels/${reelId}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response.data.data;
};

export const deleteReel = async (reelId: number) => {
  const response = await axiosClient.delete<ApiResponse<void>>(
    `/reel-service/reels/${reelId}`
  );
  return response.data;
};

/**
 * ======================================
 * TƯƠNG TÁC VỚI REELS (LIKE, SAVE, VIEW, HISTORY)
 * ======================================
 */

export const toggleLike = async (reelId: number) => {
  const response = await axiosClient.post<ApiResponse<Reel>>(
    `/reel-service/reels/${reelId}/likes/toggle`
  );
  return response.data.data;
};

export const toggleSave = async (reelId: number) => {
  const response = await axiosClient.post<ApiResponse<SaveResponse>>(
    `/reel-service/reels/${reelId}/saves/toggle`
  );
  return response.data.data;
};

export const incrementViewCount = async (reelId: number) => {
  const response = await axiosClient.post<ApiResponse<Reel>>(
    `/reel-service/reels/${reelId}/views`
  );
  return response.data.data;
};

export const getSearchHistory = async (page = 0, size = 20) => {
  const response = await axiosClient.get<ApiResponse<SearchHistoryResponse>>(
    `/reel-service/reels/me/search-history?page=${page}&size=${size}`
  );
  return response.data.data;
};

export const deleteSearchHistory = async (id: number) => {
  const response = await axiosClient.delete<ApiResponse<void>>(
    `/reel-service/reels/me/search-history/${id}`
  );
  return response.data;
};

export const deleteAllSearchHistory = async () => {
  const response = await axiosClient.delete<ApiResponse<void>>(
    `/reel-service/reels/me/search-history`
  );
  return response.data;
};

/**
 * ======================================
 * LẤY REELS
 * ======================================
 */

export const getReelFeed = async (page = 0, size = 10) => {
  const response = await axiosClient.get<ApiResponse<ReelFeedResponse>>(
    `/reel-service/reels/feed?page=${page}&size=${size}`
  );
  return response.data.data;
};

export const getReelById = async (reelId: number) => {
  const response = await axiosClient.get<ApiResponse<ReelDetailResponse>>(
    `/reel-service/reels/${reelId}`
  );
  return response.data.data;
};

export const getUserReels = async (userId: number, page = 0, size = 10) => {
  const response = await axiosClient.get<ApiResponse<ReelFeedResponse>>(
    `/reel-service/reels/user/${userId}?page=${page}&size=${size}`
  );
  return response.data.data;
};

export const searchReels = async (query: string, page = 0, size = 10) => {
  const response = await axiosClient.get<ApiResponse<ReelFeedResponse>>(
    `/reel-service/reels/search?query=${query}&page=${page}&size=${size}`
  );
  return response.data.data;
};

export const getMyCreatedReels = async (page = 0, size = 10) => {
  const response = await axiosClient.get<ApiResponse<ReelFeedResponse>>(
    `/reel-service/reels/me/created?page=${page}&size=${size}`
  );
  return response.data.data;
};

export const getUserLikedReels = async (page = 0, size = 20) => {
  const response = await axiosClient.get<ApiResponse<ReelFeedResponse>>(
    `/reel-service/reels/me/likes?page=${page}&size=${size}`
  );
  return response.data.data;
};

export const getUserSavedReels = async (page = 0, size = 20) => {
  const response = await axiosClient.get<ApiResponse<ReelFeedResponse>>(
    `/reel-service/reels/me/saved?page=${page}&size=${size}`
  );
  return response.data.data;
};

export const getUserViewedReels = async (page = 0, size = 20) => {
  const response = await axiosClient.get<ApiResponse<ReelFeedResponse>>(
    `/reel-service/reels/me/views?page=${page}&size=${size}`
  );
  return response.data.data;
};
