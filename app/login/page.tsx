"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { safeLocalStorage } from "../utils";

export default function LoginPage() {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: account, password }),
      });

      if (!res.ok) {
        setError("用户名或密码错误");
        return;
      }

      const data = await res.json();
      const localStorage = safeLocalStorage();
      localStorage.setItem("isLogin", "1");
      localStorage.setItem("userId", data.user_id.toString());
      router.push("/");
    } catch (err) {
      setError("网络错误，请稍后重试");
    }
  };

  useEffect(() => {
    const originalStyle = document.body.style.background;
    document.body.style.background = `
      linear-gradient(120deg, #e2f6fc 0%, #f7fafc 100%),
      url("data:image/svg+xml;utf8,<svg width='180' height='180' xmlns='http://www.w3.org/2000/svg'><circle cx='90' cy='90' r='80' fill='%23b6e0f9' fill-opacity='0.19'/></svg>") no-repeat bottom left/180px 180px,
      url("data:image/svg+xml;utf8,<svg width='160' height='160' xmlns='http://www.w3.org/2000/svg'><ellipse cx='80' cy='120' rx='70' ry='30' fill='%23b8ead7' fill-opacity='0.14'/></svg>") no-repeat top right/180px 130px
    `;
    return () => {
      document.body.style.background = originalStyle;
    };
  }, []);

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.style.borderColor = '#1f94ac';
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.style.borderColor = '#e5e7eb';

  return (
    <div style={{
      minHeight: "100vh",
      background: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Helvetica Neue',Helvetica,Arial,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif"
    }}>
      <form
        onSubmit={handleLogin}
        style={{
          background: "#fff",
          padding: "40px 32px",
          borderRadius: 14,
          boxShadow: "0 8px 32px rgba(31,148,172,0.10)",
          minWidth: 300,
          width: "100%",
          maxWidth: 360,
          display: "flex",
          flexDirection: "column",
          gap: 0
        }}
      >
        <h2 style={{
          textAlign: "center",
          marginBottom: 15,
          color: "#223",
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: 0.5
        }}>用户登录</h2>

        <div style={{ width: "100%", marginBottom: 18 }}>
          <label
            htmlFor="login_account"
            style={{
              fontSize: 15,
              color: "#495057",
              marginBottom: 6,
              fontWeight: 500,
              display: "block"
            }}
          >账户</label>
          <input
            id="login_account"
            type="text"
            placeholder="请输入账户"
            value={account}
            onChange={e => setAccount(e.target.value)}
            style={{
              display: "block",
              minWidth: "100%",
              maxWidth: "100%",
              padding: "11px 12px",
              borderRadius: 8,
              border: "1.5px solid #e5e7eb",
              fontSize: 16,
              background: "#fcfdff",
              boxSizing: "border-box",
              outline: "none",
              transition: ".2s border-color",
              marginBottom: 0
            }}
            onFocus={onFocus}
            onBlur={onBlur}
            autoComplete="username"
            required
          />
        </div>

        <div style={{ width: "100%", marginBottom: 18 }}>
          <label
            htmlFor="login_password"
            style={{
              fontSize: 15,
              color: "#495057",
              marginBottom: 6,
              fontWeight: 500,
              display: "block"
            }}
          >密码</label>
          <input
            id="login_password"
            type="password"
            placeholder="请输入密码"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{
              display: "block",
              minWidth: "100%",
              maxWidth: "100%",
              padding: "11px 12px",
              borderRadius: 8,
              border: "1.5px solid #e5e7eb",
              fontSize: 16,
              background: "#fcfdff",
              boxSizing: "border-box",
              outline: "none",
              transition: ".2s border-color",
              marginBottom: 0
            }}
            onFocus={onFocus}
            onBlur={onBlur}
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <div style={{
            color: "#a7232a",
            background: "#fbebee",
            minWidth: "100%",
            maxWidth: "100%",
            border: "1px solid #f3ccd1",
            borderRadius: 5,
            padding: "7px 0",
            marginTop: 10,
            marginBottom: 18,
            fontSize: 14,
            textAlign: "center"
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "11px 0",
            borderRadius: 8,
            border: "none",
            background: "#1f94ac",
            color: "#fff",
            fontWeight: 600,
            fontSize: 17,
            cursor: "pointer",
            boxShadow: "0 1.5px 6px rgba(31,148,172,0.07)",
            marginTop: 15,
            transition: "background .22s",
            lineHeight: 'normal',
            minHeight: 44
          }}
          onMouseOver={e => e.currentTarget.style.background="#156a7a"}
          onMouseOut={e => e.currentTarget.style.background="#1f94ac"}
        >
          登录
        </button>
      </form>
    </div>
  );
}
