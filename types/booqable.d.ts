
export {};

declare global {
  interface Window {
    Booqable?: {
      init?: () => void;
      widgets?: {
        scan?: () => void;
      };
      refresh?: () => void;
      cart?: {
        open?: () => void;
        itemCount?: () => number;
      };
    };
  }
}
