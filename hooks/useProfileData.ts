import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { useAppDispatch, useAppSelector } from "@/features/store";
import { getCurrentUserInfoApi, updateCurrentUserProfileApi } from "@/services/user/currentUserProfileApi";
import { getCurrentUserSession } from "@/features/auth/authThunk";
import { getErrorMessage } from "@/utils/errorMessageHandler";
import { CurrentUserProfileResponse } from "@/types/auth";

export const useProfileData = () => {
  const dispatch = useAppDispatch();
  const { userSession: user } = useAppSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState<CurrentUserProfileResponse | null>(null);

  const [name, setName] = useState(user?.name || "");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [dob, setDob] = useState<Date | null>(null);
  const [address, setAddress] = useState("");

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const res = await getCurrentUserInfoApi();
      const data = res.data.data;
      setUserInfo(data);
      setName(data.name || user?.name || "");
      if (data.gender) setGender(data.gender);
      setAddress(data.address || "");
      if (data.dob) {
        const d = new Date(data.dob);
        if (!isNaN(d.getTime())) setDob(d);
      }
    } catch (error) {
      Alert.alert("Lỗi tải thông tin", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name) {
      Alert.alert("Lỗi", "Vui lòng nhập họ và tên");
      return;
    }
    try {
      setSubmitting(true);
      const finalDob = dob ? `${dob.getFullYear()}-${(dob.getMonth() + 1).toString().padStart(2, "0")}-${dob.getDate().toString().padStart(2, "0")}` : undefined;

      await updateCurrentUserProfileApi({ name, gender, address, dob: finalDob });
      await dispatch(getCurrentUserSession());
      Alert.alert("Thành công", "Cập nhật thông tin thành công");
    } catch (error) {
      Alert.alert("Lỗi cập nhật", getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return {
    loading,
    submitting,
    userInfo,
    name, setName,
    gender, setGender,
    dob, setDob,
    address, setAddress,
    handleSave,
    user,
  };
};
