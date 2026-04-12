import { useCallback, useEffect } from "react";
import { Alert } from "react-native";
import { useAppDispatch, useAppSelector } from "@/features/store";
import { fetchMyReelsThunk, deleteReelThunk, resetMyReels } from "@/features/reels/reelsSlice";

export const useMyReels = () => {
  const dispatch = useAppDispatch();
  const { 
    myReels, 
    myReelsLoading, 
    myReelsPage, 
    myReelsHasMore 
  } = useAppSelector((state) => state.reels);

  const loadMyReels = useCallback((page: number) => {
    dispatch(fetchMyReelsThunk(page));
  }, [dispatch]);

  const refreshMyReels = useCallback(() => {
    dispatch(resetMyReels());
    loadMyReels(0);
  }, [dispatch, loadMyReels]);

  const loadMore = useCallback(() => {
    if (myReelsHasMore && !myReelsLoading) {
      loadMyReels(myReelsPage + 1);
    }
  }, [myReelsHasMore, myReelsLoading, myReelsPage, loadMyReels]);

  const handleDelete = useCallback((reelId: number) => {
    Alert.alert(
      "Xóa Thước Phim",
      "Bạn có chắc chắn muốn xóa bài đăng này không? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive",
          onPress: () => dispatch(deleteReelThunk(reelId))
        }
      ]
    );
  }, [dispatch]);

  useEffect(() => {
    if (myReels.length === 0) {
      loadMyReels(0);
    }
  }, []);

  return {
    myReels,
    myReelsLoading,
    refreshMyReels,
    loadMore,
    handleDelete
  };
};
