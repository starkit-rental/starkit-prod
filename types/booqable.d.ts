
export {};

declare global {
  interface Window {
    Booqable?: {
      widgets?: {
        scan?: () => void;
      };
      refresh?: () => void;
    };
  }
}
