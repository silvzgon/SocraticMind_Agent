import React, { useState, useRef, useEffect } from "react";
import { safeLocalStorage } from "../utils";
import { useAppConfig } from "../store/config";
import LogBoxIcon from "../icons/log-box.svg";

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
  const config = useAppConfig();

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
          background: "#cab68e",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: 18,
          marginTop: 3,
          userSelect: "none",
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
            top: 0,
            left: 40,
            background: config.theme === "dark" ? "#1f1f1f" : "#fff",
            boxShadow: "0 2px 8px rgba(31,148,172,0.14)",
            borderRadius: 6,
            zIndex: 100,
            padding: "5px 0",
            display: "flex",
            alignItems: "center",
            height: 30,
          }}
        >
          <div
            style={{
              padding: "0 16px",
              cursor: "pointer",
              color: config.theme === "dark" ? "#a6a6a6" : "#353535",
              textAlign: "center",
              fontSize: 12,
              height: "100%",
              display: "flex",
              alignItems: "center",
              whiteSpace: "nowrap",
              userSelect: "none",
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
            <LogBoxIcon style={{ marginLeft: -2, marginRight: 4 }} />
            {username.trim() === "" ? "登录" : "退出登录"}
          </div>
        </div>
      )}
    </div>
  );
}
