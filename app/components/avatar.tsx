import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { safeLocalStorage } from "../utils";

export function Avatar({
  username = "",
}: {
  username?: string;
  onLogout?: () => void;
}) {

  const firstLetter =
    username.trim().length > 0 ? username.trim()[0].toUpperCase() : "";

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
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "#1f94ac",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: 18,
          marginTop: 10,
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
            top: 10,
            left: 40,
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
              const localStorage = safeLocalStorage();
              localStorage.setItem("isLogin", "0");
              localStorage.removeItem("userId");
              localStorage.removeItem("userName");
              setTimeout(() => {
                window.location.href = "/login";
              }, 1400);
            }}
          >
            退出登录
          </div>
        </div>
      )}
    </div>
  );
}
