import { useCallback, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/features/store";
import {
  fetchReelFeed,
  setActiveReelIndex,
  optimisticLike,
  optimisticSave,
  toggleReelLike,
  toggleReelSave,
  openCommentSheet,
  closeCommentSheet,
  fetchComments,
  submitComment,
  recordView,
  resetFeed,
  searchReelsThunk,
} from "@/features/reels/reelsSlice";

/**
 * ======================================
 * useReelFeed — Main hook for Reel screen
 * ======================================
 */
export function useReelFeed() {
  const dispatch = useAppDispatch();
  const {
    feed,
    feedPage,
    feedHasMore,
    feedLoading,
    feedError,
    activeReelIndex,
    comments,
    commentHasMore,
    commentsLoading,
    isCommentSheetOpen,
    activeCommentReelId,
    likingIds,
    savingIds,
    searchQuery,
    isSearching,
  } = useAppSelector((state) => state.reels);

  const viewedIds = useRef<Set<number>>(new Set());

  // Initial load
  useEffect(() => {
    dispatch(resetFeed());
    dispatch(fetchReelFeed({ page: 0 }));
  }, [dispatch]);

  // Load more when near the end
  const handleLoadMore = useCallback(() => {
    if (!feedHasMore || feedLoading) return;
    if (isSearching && searchQuery) {
      dispatch(searchReelsThunk({ query: searchQuery, page: feedPage + 1 }));
    } else {
      dispatch(fetchReelFeed({ page: feedPage + 1 }));
    }
  }, [feedHasMore, feedLoading, feedPage, dispatch, isSearching, searchQuery]);

  // Handle viewable item change (TikTok-style auto-play tracking)
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        const idx = viewableItems[0].index;
        dispatch(setActiveReelIndex(idx));

        const reel = feed[idx];
        if (reel && !viewedIds.current.has(reel.id)) {
          viewedIds.current.add(reel.id);
          dispatch(recordView(reel.id));
        }

        // Preload next batch
        if (idx >= feed.length - 3) {
          handleLoadMore();
        }
      }
    },
    [feed, dispatch, handleLoadMore]
  );

  // Like handler with optimistic update
  const handleLike = useCallback(
    (reelId: number) => {
      if (likingIds.includes(reelId)) return;
      dispatch(optimisticLike(reelId));
      dispatch(toggleReelLike(reelId));
    },
    [dispatch, likingIds]
  );

  // Save handler with optimistic update
  const handleSave = useCallback(
    (reelId: number) => {
      if (savingIds.includes(reelId)) return;
      dispatch(optimisticSave(reelId));
      dispatch(toggleReelSave(reelId));
    },
    [dispatch, savingIds]
  );

  // Open comment sheet
  const handleOpenComments = useCallback(
    (reelId: number) => {
      dispatch(openCommentSheet(reelId));
      dispatch(fetchComments({ reelId, page: 0 }));
    },
    [dispatch]
  );

  const handleCloseComments = useCallback(() => {
    dispatch(closeCommentSheet());
  }, [dispatch]);

  // Load more comments
  const handleLoadMoreComments = useCallback(
    (reelId: number, currentPage: number) => {
      if (!commentHasMore[reelId]) return;
      dispatch(fetchComments({ reelId, page: currentPage + 1 }));
    },
    [dispatch, commentHasMore]
  );

  // Submit comment
  const handleSubmitComment = useCallback(
    async (reelId: number, content: string, parentId?: number) => {
      if (!content.trim()) return;
      await dispatch(submitComment({ reelId, content, parentId }));
    },
    [dispatch]
  );

  // Pull to refresh
  const handleRefresh = useCallback(() => {
    viewedIds.current.clear();
    dispatch(resetFeed());
    dispatch(fetchReelFeed({ page: 0 }));
  }, [dispatch]);

  return {
    feed,
    feedLoading,
    feedError,
    activeReelIndex,
    comments,
    commentHasMore,
    commentsLoading,
    isCommentSheetOpen,
    activeCommentReelId,
    likingIds,
    savingIds,

    handleLoadMore,
    handleViewableItemsChanged,
    handleLike,
    handleSave,
    handleOpenComments,
    handleCloseComments,
    handleLoadMoreComments,
    handleSubmitComment,
    handleRefresh,
  };
}
