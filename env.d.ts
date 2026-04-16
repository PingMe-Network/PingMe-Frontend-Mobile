declare namespace NodeJS {
  interface ProcessEnv {
    readonly EXPO_PUBLIC_BACKEND_BASE_URL: string;
    readonly EXPO_PUBLIC_ZEGO_TOKEN_ENDPOINT?: string;
    readonly VITE_ZEGO_TOKEN_ENDPOINT?: string;
  }
}

declare module "text-encoding" {
  export const TextEncoder: typeof globalThis.TextEncoder;
  export const TextDecoder: typeof globalThis.TextDecoder;
}
