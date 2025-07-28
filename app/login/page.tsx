"use client";

import React, { useState, useEffect } from "react";
import { safeLocalStorage } from "../utils";
import { useChatStore } from "../store";

export default function LoginPage() {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const chatStore = useChatStore();
  const sessions = chatStore.sessions;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    setSubmitting(true);

    try {
      const res = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: account, password }),
      });
      if (!res.ok) {
        setError("用户名或密码错误");
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      const localStorage = safeLocalStorage();
      localStorage.setItem("isLogin", "1");
      localStorage.setItem("userId", data.user_id.toString());
      localStorage.setItem("userName", data.user_name);
      setSuccess("登录成功，正在跳转...");
      sessions.forEach((session) => {
        if (!session.userId) {
          chatStore.updateTargetSession(
            session,
            (session) => (session.userId = data.user_id.toString()),
          );
        }
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1400);
    } catch (err) {
      setError("错误，请稍后重试");
      setSubmitting(false);
    }
  };

  useEffect(() => {
    document.body.style.background =
      "linear-gradient(120deg, #f4efe0 0%, #f9f5ec 100%)" +
      ", url('data:image/svg+xml;utf8,\
      <svg width=\"440\" height=\"440\" xmlns=\"http://www.w3.org/2000/svg\">\
      <circle cx=\"340\" cy=\"130\" r=\"110\" fill=\"%23efe2c1\" fill-opacity=\"0.25\"/>\
      <circle cx=\"60\" cy=\"350\" r=\"84\" fill=\"%23cab68e\" fill-opacity=\"0.13\"/>\
      <ellipse cx=\"340\" cy=\"410\" rx=\"80\" ry=\"34\" fill=\"%23ffe7ae\" fill-opacity=\"0.19\"/>\
      </svg>') no-repeat right top / 440px, \
      url('data:image/svg+xml;utf8,\
      <svg width=\"190\" height=\"190\" xmlns=\"http://www.w3.org/2000/svg\">\
      <rect width=\"190\" height=\"190\" fill=\"%23fff3df\" fill-opacity=\"0.16\"/>\
      <circle cx=\"120\" cy=\"75\" r=\"45\" fill=\"%23fdecc7\" fill-opacity=\"0.18\"/>\
      </svg>') no-repeat left bottom / 190px";
    return () => {
      document.body.style.background = "";
    };
  }, []);

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = "#b69d6a");
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = "#ece3d7");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          "'Helvetica Neue',Helvetica,Arial,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          background: "#fdfaf3",
          padding: "40px 32px 34px",
          borderRadius: 20,
          boxShadow: "0 8px 32px 0 rgba(180, 163, 103, 0.10), 0 1.5px 0px 0 #efe3cd",
          minWidth: 330,
          width: "100%",
          maxWidth: 390,
          display: "flex",
          flexDirection: "column",
          border: "1.5px solid #ece1c8",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ marginBottom: 24, textAlign: "center", position: "relative" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 9,
            fontWeight: 700,
            fontSize: 28,
            letterSpacing: 1,
            marginBottom: 2,
            userSelect: "none",
            color: "#3e5464",
            textShadow: "0 2px 6px #cab68e22"
          }}>
            SocraticMind
          </div>
          <div style={{
            fontSize: 14,
            color: "#3e5464",
            fontWeight: 400,
            marginTop: 2,
            letterSpacing: ".09em"
          }}>
            以问促学，以答促思
          </div>
        </div>
        <div style={{ width: "100%", marginBottom: 18 }}>
          <label
            htmlFor="login_account"
            style={{
              fontSize: 15,
              color: "#7a6b39",
              marginBottom: 5,
              fontWeight: 500,
              display: "block",
            }}
          >账户</label>
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 11, top: 11, color: "#d8ceb3", pointerEvents: "none"
            }}>
              <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="4.5" stroke="#cab68e" strokeWidth="1.2"/><ellipse cx="10" cy="14.6" rx="6" ry="3.2" stroke="#cab68e" strokeWidth="1.1"/></svg>
            </span>
            <input
              id="login_account"
              type="text"
              placeholder="请输入账户名"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              style={{
                minWidth: "100%",
                maxWidth: "100%",
                padding: "11px 12px 11px 37px",
                borderRadius: 9,
                border: "1.6px solid #ece3d7",
                fontSize: 16,
                background: "#fdfaf3",
                boxSizing: "border-box",
                outline: "none",
                marginBottom: 0,
                transition: ".18s border-color",
                boxShadow: "0 2.5px 12px 0 rgba(202,182,142,0.04)",
                color: "#564c2d",
                textAlign: "left"
              }}
              onFocus={onFocus}
              onBlur={onBlur}
              autoComplete="username"
              required
            />
          </div>
        </div>
        <div style={{ width: "100%", marginBottom: 14 }}>
          <label
            htmlFor="login_password"
            style={{
              fontSize: 15,
              color: "#7a6b39",
              marginBottom: 5,
              fontWeight: 500,
              display: "block",
            }}
          >密码</label>
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 12, top: 11, color: "#e4d8b7", pointerEvents: "none"
            }}>
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                <rect x="3.2" y="8.8" width="13.6" height="7.7" rx="2.3" stroke="#cab68e" strokeWidth="1.1"/>
                <ellipse cx="10" cy="13.9" rx="1.5" ry="1.45" fill="#fdecc7" stroke="#cab68e" strokeWidth="1"/>
                <rect x="6.2" y="6.2" width="7.7" height="4.1" rx="2" stroke="#cab68e" strokeWidth="1"/>
              </svg>
            </span>
            <input
              id="login_password"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                minWidth: "100%",
                maxWidth: "100%",
                padding: "11px 12px 11px 36px",
                borderRadius: 9,
                border: "1.6px solid #ece3d7",
                fontSize: 16,
                background: "#fdfaf3",
                boxSizing: "border-box",
                outline: "none",
                marginBottom: 0,
                transition: ".18s border-color",
                boxShadow: "0 1.5px 8px 0 rgba(202,182,142,0.032)",
                color: "#564c2d",
                textAlign: "left"
              }}
              onFocus={onFocus}
              onBlur={onBlur}
              autoComplete="current-password"
              required
            />
          </div>
        </div>
        {error && (
          <div style={{
            color: "#c66a4d",
            background: "#fff5ee",
            border: "1px solid #efd6c5",
            borderRadius: 5,
            padding: "7px 0 6px",
            margin: "0 0 0 0",
            fontSize: 14.6,
            textAlign: "center",
            width: "100%",
            letterSpacing: ".03em"
          }}>{error}</div>
        )}
        {success && (
          <div style={{
            color: "#5f9352",
            background: "#f5fbee",
            border: "1px solid #ddefdb",
            borderRadius: 5,
            padding: "6.7px 0 6.7px",
            margin: "0 0 0 0",
            fontSize: 14.6,
            textAlign: "center",
            width: "100%",
            letterSpacing: ".03em",
          }}>{success}</div>
        )}
        <button
          type="submit"
          disabled={submitting}
          style={{
            width: "100%",
            padding: "12px 0",
            borderRadius: 8,
            border: "none",
            background: submitting ? "#efe2c2" : "#cab68e",
            color: "#fff",
            fontWeight: 600,
            fontSize: 17,
            cursor: submitting ? "not-allowed" : "pointer",
            boxShadow: "0 1.5px 6px rgba(202,182,142,0.17)",
            margin: "15px 0 0 0",
            transition: "background .22s",
            lineHeight: "normal",
            minHeight: 44,
            letterSpacing: ".03em",
          }}
          onMouseOver={e => {
            if (!submitting) e.currentTarget.style.background = "#b69d6a";
          }}
          onMouseOut={e => {
            if (!submitting) e.currentTarget.style.background = "#cab68e";
          }}
        >
          {submitting ? "登录中..." : "登录"}
        </button>
        <div style={{ margin: "16px 0 0 0", width: "100%",  }}>
          <div
            style={{
              borderTop: "1.5px dashed #e8ddc8",
              margin: "4px 0 8px 0",
            }}
          ></div>
          <div style={{ textAlign: "center", margin: "0 0 8px 0", color: "#ad9b69", fontSize: 14, letterSpacing: 0.2 }}>
            还没有账号？
          </div>
          <button
            type="button"
            onClick={() => {
              setTimeout(() => {
                window.location.href = "/register";
              }, 1400);
            }}
            style={{
              width: "100%",
              padding: "11px 0",
              borderRadius: 8,
              border: "1.5px solid #e4d8b7",
              background: "#f9f5ec",
              color: "#cab68e",
              fontWeight: 600,
              fontSize: 16,
              cursor: "pointer",
              boxShadow: "0 1.1px 2.5px 0 rgba(202,182,142,0.10)",
              transition: "background .20s, border-color .15s, color .13s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#f4efe0";
              e.currentTarget.style.borderColor = "#cab68e";
              e.currentTarget.style.color = "#b69d6a";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#f9f5ec";
              e.currentTarget.style.borderColor = "#e4d8b7";
              e.currentTarget.style.color = "#cab68e";
            }}
          >
            注册
          </button>
        </div>
      </form>
    </div>
  );
}
