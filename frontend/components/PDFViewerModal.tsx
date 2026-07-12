import { useEffect } from "react";
import { Asset } from "expo-asset";

interface Props {
  visible: boolean;
  title: string;
  asset: number;
  webPath: string;
  onClose: () => void;
}

// On web, open the PDF in a new browser tab — mobile Safari/Chrome render it
// natively there, whereas iframes don't work reliably on mobile devices.
export function PDFViewerModal({ visible, asset, onClose }: Props) {
  useEffect(() => {
    if (!visible) return;
    Asset.fromModule(asset)
      .downloadAsync()
      .then((a) => {
        window.open(a.uri, "_blank", "noopener,noreferrer");
        onClose();
      });
  }, [visible, asset]);

  return null;
}
