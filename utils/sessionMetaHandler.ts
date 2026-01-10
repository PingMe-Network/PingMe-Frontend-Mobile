import * as Device from "expo-device";
import { Platform } from "react-native";
import type { SubmitSessionMetaRequest } from "@/types/authentication";

export const getSessionMetaRequest =
  async (): Promise<SubmitSessionMetaRequest> => {
    const browser = Device.modelName || "Unknown Device";

    const osName = Platform.OS === "ios" ? "iOS" : "Android";
    const osVersion = Device.osVersion || Platform.Version.toString();
    const osInfo = `${osName} ${osVersion}`;

    const deviceTypeEnum = await Device.getDeviceTypeAsync();

    let deviceTypeString = "mobile";
    if (deviceTypeEnum === Device.DeviceType.TABLET)
      deviceTypeString = "tablet";
    if (deviceTypeEnum === Device.DeviceType.DESKTOP)
      deviceTypeString = "desktop";
    if (deviceTypeEnum === Device.DeviceType.TV) deviceTypeString = "tv";

    return {
      deviceType: deviceTypeString,
      browser,
      os: osInfo,
    };
  };

export const normalizeDeviceType = (type?: string): string => {
  if (!type) return "Thiết bị di động";
  switch (type.toLowerCase()) {
    case "mobile":
      return "Điện thoại";
    case "tablet":
      return "Máy tính bảng";
    case "desktop":
      return "Máy tính";
    default:
      return type;
  }
};
