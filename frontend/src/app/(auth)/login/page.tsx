/** 로그인 페이지: Supabase Auth 이메일/비밀번호 + 회원가입, bypass 모드 지원. */
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Mail, Lock, LogIn, AudioLines, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "./styles/page.module.css";

/* ------------------------------------------------------------------ */
/*  Mock waveform bar heights for the left-side visualization          */
/* ------------------------------------------------------------------ */
const WAVEFORM_BARS = [
  12, 28, 18, 36, 24, 42, 30, 20, 38, 14, 32, 26, 44, 16, 34, 22, 40, 10,
  28, 36, 18, 46, 24, 32, 20, 38, 14, 30, 42, 22, 34, 26, 48, 16, 28, 40,
  12, 36, 20, 44, 18, 30, 24, 38, 14, 32, 46, 22, 26, 34,
];

type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [error, setError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSignupSuccess(false);

    const supabase = createClient();

    if (mode === "signin") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
        return;
      }

      router.push("/sessions");
    } else {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      setSignupSuccess(true);
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.c003}>
      {/* ============================================================ */}
      {/*  LEFT COLUMN - Branding & Visualization                      */}
      {/* ============================================================ */}
      <div className={styles.c004}>
        {/* Top section */}
        <div className={styles.c005}>
          {/* System operational badge */}
          <div className={styles.c006}>
            <span className={styles.c007}>
              <span className={styles.c008}>
                <span className={styles.c009} />
                <span className={styles.c010} />
              </span>
              {t("systemStatus")}
            </span>
          </div>

          {/* Hero heading */}
          <div className={styles.c011}>
            <h1 className={styles.c012}>
              <span className={styles.c013}>{t("heroLine1")}</span>
              <br />
              <span className={styles.c014}>{t("heroLine2")}</span>
            </h1>

            <p className={styles.c015}>
              {t("heroDescription")}
            </p>
          </div>
        </div>

        {/* Waveform visualization card */}
        <div className={styles.c016}>
          {/* Header row */}
          <div className={styles.c017}>
            <div className={styles.c018}>
              <AudioLines className={styles.c019} />
              <span className={styles.c020}>
                {t("liveStream")}
              </span>
            </div>
            <span className={styles.c021}>
              {t("sectorInfo")}
            </span>
          </div>

          {/* Waveform bars */}
          <div className={styles.c022}>
            {WAVEFORM_BARS.map((h, i) => (
              <div
                key={i}
                className={styles.c023}
                style={{
                  height: `${h}%`,
                  animationName: "waveformPulse",
                  animationDuration: `${1.2 + (i % 5) * 0.3}s`,
                  animationTimingFunction: "ease-in-out",
                  animationIterationCount: "infinite",
                  animationDirection: "alternate",
                }}
              />
            ))}
          </div>

          {/* Bottom metadata */}
          <div className={styles.c024}>
            <span>{t("elapsed")}</span>
            <span className={styles.c025}>
              <span className={styles.c026} />
              {t("recording")}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  RIGHT COLUMN - Login Form                                   */}
      {/* ============================================================ */}
      <div className={styles.c027}>
        <div className={styles.c028}>
          {/* Card */}
          <div className={styles.c029}>
            {/* Waveform icon circle */}
            <div className={styles.c030}>
              <div className={styles.c031}>
                <AudioLines className={styles.c032} />
              </div>
            </div>

            {/* Heading */}
            <div className={styles.c033}>
              <h2 className={styles.c034}>
                {mode === "signin" ? t("welcomeBack") : t("createAccount")}
              </h2>
              <p className={styles.c035}>
                {mode === "signin"
                  ? t("signInSubtitle")
                  : t("signUpSubtitle")}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className={styles.c036}>
              {/* Error message */}
              {error && (
                <div className={styles.c037}>
                  {error}
                </div>
              )}

              {/* Signup success message */}
              {signupSuccess && (
                <div className={styles.c038}>
                  {t("signUpSuccess")}
                </div>
              )}

              {/* Email field */}
              <div className={styles.c039}>
                <label
                  htmlFor="email"
                  className={styles.c040}
                >
                  {t("workEmail")}
                </label>
                <div className={styles.c041}>
                  <Mail className={styles.c042} />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("emailPlaceholder")}
                    className={styles.c043}
                  />
                </div>
              </div>

              {/* Password field */}
              <div className={styles.c039}>
                <div className={styles.c044}>
                  <label
                    htmlFor="password"
                    className={styles.c040}
                  >
                    {t("password")}
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      className={styles.c045}
                    >
                      {t("forgotPassword")}
                    </button>
                  )}
                </div>
                <div className={styles.c041}>
                  <Lock className={styles.c042} />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("passwordPlaceholder")}
                    className={styles.c043}
                  />
                </div>
              </div>

              {/* Remember checkbox (signin only) */}
              {mode === "signin" && (
                <label className={styles.c046}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className={styles.c047}
                  />
                  <span className={styles.c002}>
                    {t("rememberDevice")}
                  </span>
                </label>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className={styles.c048}
              >
                {isLoading ? (
                  <span className={styles.c018}>
                    <svg
                      className={styles.c049}
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className={styles.c050}
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className={styles.c051}
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    {mode === "signin" ? t("signingIn") : t("creatingAccount")}
                  </span>
                ) : (
                  <>
                    {mode === "signin" ? (
                      <LogIn className={styles.c052} />
                    ) : (
                      <UserPlus className={styles.c052} />
                    )}
                    {mode === "signin" ? t("signIn") : t("signUp")}
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className={styles.c053}>
              <div className={styles.c054} />
              <span className={styles.c055}>{t("orContinueWith")}</span>
              <div className={styles.c054} />
            </div>

            {/* SSO buttons */}
            <div className={styles.c056}>
              {/* Google */}
              <button
                type="button"
                className={styles.c057}
              >
                <svg className={styles.c058} viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {t("google")}
              </button>

              {/* Microsoft */}
              <button
                type="button"
                className={styles.c057}
              >
                <svg className={styles.c058} viewBox="0 0 24 24" fill="none">
                  <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                  <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
                  <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
                  <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
                </svg>
                {t("microsoft")}
              </button>
            </div>

            {/* Footer text — Sign In / Sign Up toggle */}
            <p className={styles.c059}>
              {mode === "signin"
                ? t("noAccount")
                : t("hasAccount")}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setError(null);
                  setSignupSuccess(false);
                }}
                className={styles.c060}
              >
                {mode === "signin" ? t("signUp") : t("signIn")}
              </button>
            </p>
          </div>

          {/* Legal links */}
          <div className={styles.c061}>
            <button
              type="button"
              className={styles.c062}
            >
              {t("privacyPolicy")}
            </button>
            <span>&middot;</span>
            <button
              type="button"
              className={styles.c062}
            >
              {t("termsOfService")}
            </button>
          </div>
        </div>
      </div>

      {/* Keyframe animation for waveform bars */}
      <style jsx global>{`
        @keyframes waveformPulse {
          0% {
            opacity: 0.4;
            transform: scaleY(0.7);
          }
          100% {
            opacity: 1;
            transform: scaleY(1);
          }
        }
      `}</style>
    </div>
  );
}
