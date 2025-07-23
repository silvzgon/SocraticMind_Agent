"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== password2) {
      setError("两次输入的密码不一致");
      return;
    }
    setSubmitting(true);

    try {
      const res = await fetch("http://localhost:8000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: account, password }),
      });
      if (!res.ok) {
        setError("注册失败");
        setSubmitting(false);
        return;
      }
      setSuccess("注册成功，正在跳转到登录页...");
      setTimeout(() => {
        router.push("/login");
      }, 1400);
    } catch (err) {
      setError("错误，请稍后重试");
      setSubmitting(false);
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

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = "#1f94ac");
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = "#e5e7eb");

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
        onSubmit={handleRegister}
        style={{
          background: "#fff",
          padding: "38px 30px 32px",
          borderRadius: 18,
          boxShadow: "0 8px 32px rgba(31,148,172,0.09)",
          minWidth: 320,
          width: "100%",
          maxWidth: 370,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ marginBottom: 24, textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              color: "#1f94ac",
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: 1,
              marginBottom: 2,
              userSelect: "none",
            }}
          >
            Chat4Math
          </div>
        </div>
        <div style={{ width: "100%", marginBottom: 17 }}>
          <label
            htmlFor="register_account"
            style={{
              fontSize: 15,
              color: "#546173",
              marginBottom: 5,
              fontWeight: 500,
              display: "block",
            }}
          >
            账户
          </label>
          <input
            id="register_account"
            type="text"
            placeholder="请输入账户名"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            style={{
              minWidth: "100%",
              maxWidth: "100%",
              padding: "11px 12px",
              borderRadius: 8,
              border: "1.5px solid #e5e7eb",
              fontSize: 16,
              background: "#fcfdff",
              boxSizing: "border-box",
              outline: "none",
              marginBottom: 0,
              transition: ".18s border-color",
              boxShadow: "0 3px 14px 0 rgba(180,227,247,0.07)",
            }}
            onFocus={onFocus}
            onBlur={onBlur}
            autoComplete="username"
            required
          />
        </div>
        <div style={{ width: "100%", marginBottom: 14 }}>
          <label
            htmlFor="register_password"
            style={{
              fontSize: 15,
              color: "#546173",
              marginBottom: 5,
              fontWeight: 500,
              display: "block",
            }}
          >
            密码
          </label>
          <input
            id="register_password"
            type="password"
            placeholder="请输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              minWidth: "100%",
              maxWidth: "100%",
              padding: "11px 12px",
              borderRadius: 8,
              border: "1.5px solid #e5e7eb",
              fontSize: 16,
              background: "#fcfdff",
              boxSizing: "border-box",
              outline: "none",
              marginBottom: 0,
              transition: ".18s border-color",
              boxShadow: "0 2px 10px 0 rgba(180,227,247,0.045)",
            }}
            onFocus={onFocus}
            onBlur={onBlur}
            autoComplete="new-password"
            required
          />
        </div>
        <div style={{ width: "100%", marginBottom: 14 }}>
          <label
            htmlFor="register_password2"
            style={{
              fontSize: 15,
              color: "#546173",
              marginBottom: 5,
              fontWeight: 500,
              display: "block",
            }}
          >
            重复密码
          </label>
          <input
            id="register_password2"
            type="password"
            placeholder="请再次输入密码"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            style={{
              minWidth: "100%",
              maxWidth: "100%",
              padding: "11px 12px",
              borderRadius: 8,
              border: "1.5px solid #e5e7eb",
              fontSize: 16,
              background: "#fcfdff",
              boxSizing: "border-box",
              outline: "none",
              marginBottom: 0,
              transition: ".18s border-color",
              boxShadow: "0 2px 10px 0 rgba(180,227,247,0.045)",
            }}
            onFocus={onFocus}
            onBlur={onBlur}
            autoComplete="new-password"
            required
          />
        </div>
        {error && (
          <div
            style={{
              color: "#a7232a",
              background: "#fbebee",
              border: "1px solid #f3ccd1",
              borderRadius: 5,
              padding: "5px 0",
              margin: "0 0 0 0",
              fontSize: 14.3,
              textAlign: "center",
              width: "100%",
              letterSpacing: ".03em",
            }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            style={{
              color: "#227b15",
              background: "#f0fbee",
              border: "1px solid #b2e4b9",
              borderRadius: 5,
              padding: "6px 0",
              margin: "0 0 0 0",
              fontSize: 14.3,
              textAlign: "center",
              width: "100%",
              letterSpacing: ".03em",
            }}
          >
            {success}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          style={{
            width: "100%",
            padding: "12px 0",
            borderRadius: 8,
            border: "none",
            background: submitting ? "#b5d3db" : "#1f94ac",
            color: "#fff",
            fontWeight: 600,
            fontSize: 17,
            cursor: submitting ? "not-allowed" : "pointer",
            boxShadow: "0 1.5px 6px rgba(31,148,172,0.08)",
            margin: "13px 0 0 0",
            transition: "background .17s",
            lineHeight: "normal",
            minHeight: 44,
            letterSpacing: ".02em",
          }}
          onMouseOver={(e) => {
            if (!submitting) e.currentTarget.style.background = "#156a7a";
          }}
          onMouseOut={(e) => {
            if (!submitting) e.currentTarget.style.background = "#1f94ac";
          }}
        >
          {submitting ? "注册中..." : "注册"}
        </button>
        <div style={{ margin: "10px 0 0 0", width: "100%" }}>
          <div
            style={{
              borderTop: "1px solid #ebf1f3",
              margin: "10px 0 12px 0",
            }}
          ></div>
          <div style={{ textAlign: "center", margin: "0 0 8px 0", color: "#74899e", fontSize: 14 }}>
            已有账号？
          </div>
          <button
            type="button"
            onClick={() => {
                setTimeout(() => {
                router.push("/login");
              }, 1400);
            }}
            style={{
              width: "100%",
              padding: "11px 0",
              borderRadius: 8,
              border: "1.4px solid #c7e8f1",
              background: "#fafeff",
              color: "#1789a7",
              fontWeight: 600,
              fontSize: 16,
              cursor: "pointer",
              boxShadow: "0 1px 5px 0 rgba(180,227,247,0.05)",
              transition: "background .20s, border-color .15s, color .13s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#ebf9fa";
              e.currentTarget.style.borderColor = "#84d7eb";
              e.currentTarget.style.color = "#156a7a";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#fafeff";
              e.currentTarget.style.borderColor = "#c7e8f1";
              e.currentTarget.style.color = "#1789a7";
            }}
          >
            去登录
          </button>
        </div>
      </form>
    </div>
  );
}
