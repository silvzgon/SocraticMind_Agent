import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export function Avatar({
  username = "U",
}: {
  username?: string;
  onLogout?: () => void;
}) {

  const firstLetter =
    username.trim().length > 0 ? username.trim()[0].toUpperCase() : "U";

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        open &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        display: "inline-block",
        verticalAlign: "middle",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "#1f94ac",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: 18,
          marginBottom: 5,
          userSelect: "none",
          border: "2px solid #e6f7fe",
          boxShadow: "0 2px 8px rgba(31,148,172,0.12)",
          cursor: "pointer",
        }}
        title={username}
        onClick={() => setOpen((v) => !v)}
      >
        {firstLetter}
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            bottom: 5,
            left: 48,
            background: "#fff",
            boxShadow: "0 2px 8px rgba(31,148,172,0.14)",
            borderRadius: 6,
            border: "1px solid #e6f7fe",
            zIndex: 100,
            padding: "6px 0",
            display: "flex",
            alignItems: "center",
            height: 25,
          }}
        >
          <div
            style={{
              padding: "0 16px",
              cursor: "pointer",
              color: "#121211",
              textAlign: "center",
              fontSize: 12,
              height: "100%",
              display: "flex",
              alignItems: "center",
              whiteSpace: "nowrap",
            }}
            onClick={() => {
              setOpen(false);
              router.push("login")
            }}
          >
            退出登录
          </div>
        </div>
      )}
    </div>
  );
}
