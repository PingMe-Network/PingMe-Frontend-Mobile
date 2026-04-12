import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { reelsApi } from "@/services/reels";
import type { Reel, ReelComment } from "@/types/reels";

/**
 * ======================================
 * REELS REDUX STATE
 * ======================================
 */

interface ReelsState {
  // Feed
  feed: Reel[];
  feedPage: number;
  feedHasMore: boolean;
  feedLoading: boolean;
  feedError: string | null;

  // Search
  searchQuery: string;
  isSearching: boolean;

  // My Reels (for management)
  myReels: Reel[];
  myReelsLoading: boolean;
  myReelsPage: number;
  myReelsHasMore: boolean;

  // Active reel
  activeReelIndex: number;

  // Comments
  comments: Record<number, ReelComment[]>;
  commentPages: Record<number, number>;
  commentHasMore: Record<number, boolean>;
  commentsLoading: boolean;

  // UI state
  isCommentSheetOpen: boolean;
  activeCommentReelId: number | null;

  // Like/Save optimistic updates
  likingIds: number[];
  savingIds: number[];
}

const initialState: ReelsState = {
  feed: [],
  feedPage: 0,
  feedHasMore: true,
  feedLoading: false,
  feedError: null,

  activeReelIndex: 0,

  comments: {},
  commentPages: {},
  commentHasMore: {},
  commentsLoading: false,

  isCommentSheetOpen: false,
  activeCommentReelId: null,

  likingIds: [],
  savingIds: [],

  searchQuery: "",
  isSearching: false,

  myReels: [],
  myReelsLoading: false,
  myReelsPage: 0,
  myReelsHasMore: true,
};

/**
 * ======================================
 * ASYNC THUNKS
 * ======================================
 */

export const fetchReelFeed = createAsyncThunk(
  "reels/fetchFeed",
  async ({ page, size }: { page: number; size?: number }, { rejectWithValue }) => {
    try {
      return await reelsApi.getReelFeed(page, size ?? 10);
    } catch (err: any) {
      return rejectWithValue(err?.message ?? "Lỗi tải feed reels");
    }
  }
);

export const fetchComments = createAsyncThunk(
  "reels/fetchComments",
  async (
    { reelId, page }: { reelId: number; page: number },
    { rejectWithValue }
  ) => {
    try {
      const data = await reelsApi.getComments(reelId, page);
      return { reelId, data };
    } catch (err: any) {
      return rejectWithValue(err?.message ?? "Lỗi tải bình luận");
    }
  }
);

export const submitComment = createAsyncThunk(
  "reels/submitComment",
  async (
    { reelId, content, parentId }: { reelId: number; content: string; parentId?: number },
    { rejectWithValue }
  ) => {
    try {
      const comment = await reelsApi.createComment(reelId, { content, parentId });
      return { reelId, comment };
    } catch (err: any) {
      return rejectWithValue(err?.message ?? "Lỗi gửi bình luận");
    }
  }
);

export const toggleReelLike = createAsyncThunk(
  "reels/toggleLike",
  async (reelId: number, { rejectWithValue }) => {
    try {
      const updated = await reelsApi.toggleLike(reelId);
      return updated;
    } catch (err: any) {
      return rejectWithValue(err?.message ?? "Lỗi like reel");
    }
  }
);

export const toggleReelSave = createAsyncThunk(
  "reels/toggleSave",
  async (reelId: number, { rejectWithValue }) => {
    try {
      const updated = await reelsApi.toggleSave(reelId);
      return updated;
    } catch (err: any) {
      return rejectWithValue(err?.message ?? "Lỗi lưu reel");
    }
  }
);

export const recordView = createAsyncThunk(
  "reels/recordView",
  async (reelId: number) => {
    await reelsApi.incrementViewCount(reelId);
    return reelId;
  }
);

export const searchReelsThunk = createAsyncThunk(
  "reels/search",
  async ({ query, page }: { query: string; page: number }, { rejectWithValue }) => {
    try {
      return await reelsApi.searchReels(query, page);
    } catch (err: any) {
      return rejectWithValue(err?.message ?? "Lỗi tìm kiếm reels");
    }
  }
);

export const fetchMyReelsThunk = createAsyncThunk(
  "reels/fetchMyReels",
  async (page: number, { rejectWithValue }) => {
    try {
      return await reelsApi.getMyCreatedReels(page);
    } catch (err: any) {
      return rejectWithValue(err?.message ?? "Lỗi tải reels của tôi");
    }
  }
);

export const deleteReelThunk = createAsyncThunk(
  "reels/delete",
  async (reelId: number, { rejectWithValue }) => {
    try {
      await reelsApi.deleteReel(reelId);
      return reelId;
    } catch (err: any) {
      return rejectWithValue(err?.message ?? "Lỗi khi xóa thước phim");
    }
  }
);

export const createReelThunk = createAsyncThunk(
  "reels/create",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      return await reelsApi.createReel(formData as any);
    } catch (err: any) {
      return rejectWithValue(err?.message ?? "Lỗi khi đăng thước phim");
    }
  }
);

/**
 * ======================================
 * SLICE
 * ======================================
 */

const reelsSlice = createSlice({
  name: "reels",
  initialState,
  reducers: {
    setActiveReelIndex(state, action: PayloadAction<number>) {
      state.activeReelIndex = action.payload;
    },
    openCommentSheet(state, action: PayloadAction<number>) {
      state.isCommentSheetOpen = true;
      state.activeCommentReelId = action.payload;
    },
    closeCommentSheet(state) {
      state.isCommentSheetOpen = false;
      state.activeCommentReelId = null;
    },
    optimisticLike(state, action: PayloadAction<number>) {
      const reel = state.feed.find((r) => r.id === action.payload);
      if (reel) {
        reel.isLikedByMe = !reel.isLikedByMe;
        reel.likeCount = reel.isLikedByMe
          ? reel.likeCount + 1
          : reel.likeCount - 1;
      }
    },
    optimisticSave(state, action: PayloadAction<number>) {
      const reel = state.feed.find((r) => r.id === action.payload);
      if (reel) {
        reel.isSavedByMe = !reel.isSavedByMe;
      }
    },
    resetFeed(state) {
      state.feed = [];
      state.feedPage = 0;
      state.feedHasMore = true;
      state.feedError = null;
    },
    incrementCommentCount(state, action: PayloadAction<number>) {
      const reel = state.feed.find((r) => r.id === action.payload);
      if (reel) {
        reel.commentCount += 1;
      }
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setIsSearching(state, action: PayloadAction<boolean>) {
      state.isSearching = action.payload;
    },
    resetMyReels(state) {
      state.myReels = [];
      state.myReelsPage = 0;
      state.myReelsHasMore = true;
    },
  },
  extraReducers: (builder) => {
    // Fetch feed
    builder
      .addCase(fetchReelFeed.pending, (state) => {
        state.feedLoading = true;
        state.feedError = null;
      })
      .addCase(fetchReelFeed.fulfilled, (state, action) => {
        state.feedLoading = false;
        if (action.meta.arg.page === 0) {
          state.feed = action.payload.content;
        } else {
          // Deduplicate
          const existingIds = new Set(state.feed.map((r) => r.id));
          const newReels = action.payload.content.filter((r) => !existingIds.has(r.id));
          state.feed.push(...newReels);
        }
        state.feedPage = action.payload.page;
        state.feedHasMore = action.payload.hasMore;
      })
      .addCase(fetchReelFeed.rejected, (state, action) => {
        state.feedLoading = false;
        state.feedError = action.payload as string;
      });

    // Fetch comments
    builder
      .addCase(fetchComments.pending, (state) => {
        state.commentsLoading = true;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.commentsLoading = false;
        const { reelId, data } = action.payload;
        if (action.meta.arg.page === 0) {
          state.comments[reelId] = data.content;
        } else {
          state.comments[reelId] = [
            ...(state.comments[reelId] ?? []),
            ...data.content,
          ];
        }
        state.commentPages[reelId] = data.page;
        state.commentHasMore[reelId] = data.hasMore;
      })
      .addCase(fetchComments.rejected, (state) => {
        state.commentsLoading = false;
      });

    // Submit comment
    builder.addCase(submitComment.fulfilled, (state, action) => {
      const { reelId, comment } = action.payload;
      if (!state.comments[reelId]) {
        state.comments[reelId] = [];
      }
      state.comments[reelId].unshift(comment);
      const reel = state.feed.find((r) => r.id === reelId);
      if (reel) {
        reel.commentCount += 1;
      }
    });

    // Toggle like (sync back from server)
    builder
      .addCase(toggleReelLike.pending, (state, action) => {
        state.likingIds.push(action.meta.arg);
      })
      .addCase(toggleReelLike.fulfilled, (state, action) => {
        state.likingIds = state.likingIds.filter((id) => id !== action.payload.id);
        const reel = state.feed.find((r) => r.id === action.payload.id);
        if (reel) {
          reel.isLikedByMe = action.payload.isLikedByMe;
          reel.likeCount = action.payload.likeCount;
        }
      })
      .addCase(toggleReelLike.rejected, (state, action) => {
        state.likingIds = state.likingIds.filter((id) => id !== action.meta.arg);
        // Revert optimistic update
        const reel = state.feed.find((r) => r.id === action.meta.arg);
        if (reel) {
          reel.isLikedByMe = !reel.isLikedByMe;
          reel.likeCount = reel.isLikedByMe
            ? reel.likeCount + 1
            : reel.likeCount - 1;
        }
      });

    // Toggle save
    builder
      .addCase(toggleReelSave.pending, (state, action) => {
        state.savingIds.push(action.meta.arg);
      })
      .addCase(toggleReelSave.fulfilled, (state, action) => {
        state.savingIds = state.savingIds.filter((id) => id !== action.payload.id);
        const reel = state.feed.find((r) => r.id === action.payload.id);
        if (reel) {
          reel.isSavedByMe = action.payload.isSavedByMe;
        }
      })
      .addCase(toggleReelSave.rejected, (state, action) => {
        state.savingIds = state.savingIds.filter((id) => id !== action.meta.arg);
        // Revert
        const reel = state.feed.find((r) => r.id === action.meta.arg);
        if (reel) {
          reel.isSavedByMe = !reel.isSavedByMe;
        }
      });

    // Record view - increment viewCount locally
    builder.addCase(recordView.fulfilled, (state, action) => {
      const reel = state.feed.find((r) => r.id === action.payload);
      if (reel) {
        reel.viewCount += 1;
      }
    });

    // Search
    builder
      .addCase(searchReelsThunk.pending, (state) => {
        state.feedLoading = true;
      })
      .addCase(searchReelsThunk.fulfilled, (state, action) => {
        state.feedLoading = false;
        if (action.meta.arg.page === 0) {
          state.feed = action.payload.content;
        } else {
          const existingIds = new Set(state.feed.map((r) => r.id));
          const newReels = action.payload.content.filter((r) => !existingIds.has(r.id));
          state.feed.push(...newReels);
        }
        state.feedPage = action.payload.page;
        state.feedHasMore = action.payload.hasMore;
      })
      .addCase(searchReelsThunk.rejected, (state, action) => {
        state.feedLoading = false;
        state.feedError = action.payload as string;
      });

    // My Reels
    builder
      .addCase(fetchMyReelsThunk.pending, (state) => {
        state.myReelsLoading = true;
      })
      .addCase(fetchMyReelsThunk.fulfilled, (state, action) => {
        state.myReelsLoading = false;
        if (action.meta.arg === 0) {
          state.myReels = action.payload.content;
        } else {
          const existingIds = new Set(state.myReels.map((r) => r.id));
          const newReels = action.payload.content.filter((r) => !existingIds.has(r.id));
          state.myReels.push(...newReels);
        }
        state.myReelsPage = action.payload.page;
        state.myReelsHasMore = action.payload.hasMore;
      })
      .addCase(fetchMyReelsThunk.rejected, (state) => {
        state.myReelsLoading = false;
      });

    // Delete Reel
    builder.addCase(deleteReelThunk.fulfilled, (state, action) => {
      state.myReels = state.myReels.filter((r) => r.id !== action.payload);
      state.feed = state.feed.filter((r) => r.id !== action.payload);
    });

    // Create Reel
    builder
      .addCase(createReelThunk.pending, (state) => {
        state.myReelsLoading = true;
      })
      .addCase(createReelThunk.fulfilled, (state, action) => {
        state.myReelsLoading = false;
        state.myReels.unshift(action.payload);
        state.feed.unshift(action.payload);
      })
      .addCase(createReelThunk.rejected, (state, action) => {
        state.myReelsLoading = false;
        state.feedError = action.payload as string;
      });
  },
});

export const {
  setActiveReelIndex,
  openCommentSheet,
  closeCommentSheet,
  optimisticLike,
  optimisticSave,
  resetFeed,
  incrementCommentCount,
  setSearchQuery,
  setIsSearching,
  resetMyReels,
} = reelsSlice.actions;

export default reelsSlice.reducer;
