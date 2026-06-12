import { useState, useEffect } from "react";
import { usePWAInstall } from "@/hook/usePWAInstall";

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem("pwa-banner-dismissed");
    if (wasDismissed) return;

    if (isInstallable && !isInstalled) {
      const t = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(t);
    }
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    await promptInstall();
    setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem("pwa-banner-dismissed", "1");
  };

  if (!show || dismissed) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        padding: "16px",
        background: "#fff",
        borderTop: "1px solid #e5e7eb",
        boxShadow: "0 -4px 16px rgba(0,0,0,0.10)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        animation: "slideUp 0.3s ease",
      }}
    >
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

      <img
        src="/icon-192.png"
        alt="Belton Mold"
        style={{ width: 48, height: 48, borderRadius: 10, flexShrink: 0 }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#111827" }}>
          ติดตั้งแอพ Belton Mold
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
          เพิ่มลงหน้าจอหลักเพื่อเปิดได้เร็วขึ้น
        </p>
      </div>

      <button
        onClick={handleDismiss}
        style={{
          background: "none",
          border: "none",
          color: "#9ca3af",
          fontSize: 20,
          cursor: "pointer",
          padding: "4px 8px",
          lineHeight: 1,
          flexShrink: 0,
        }}
        aria-label="ปิด"
      >
        ✕
      </button>

      <button
        onClick={handleInstall}
        style={{
          background: "#cc0000",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "10px 18px",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
      >
        ติดตั้ง
      </button>
    </div>
  );
}
