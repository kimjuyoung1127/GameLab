"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AudioLines } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import styles from "./styles/page.module.css";

const WAVEFORM_BARS = [
  12, 28, 18, 36, 24, 42, 30, 20, 38, 14, 32, 26, 44, 16, 34, 22, 40, 10,
  28, 36, 18, 46, 24, 32, 20, 38, 14, 30, 42, 22, 34, 26, 48, 16, 28, 40,
  12, 36, 20, 44, 18, 30, 24, 38, 14, 32, 46, 22, 26, 34,
];

type OAuthProvider = "google" | "kakao";

export default function LoginPage() {
  const t = useTranslations("login");
  const [isLoading, setIsLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleOAuthLogin(provider: OAuthProvider) {
    try {
      setError(null);
      setIsLoading(provider);

      const supabase = createClient();
      const origin =
        process.env.NEXT_PUBLIC_APP_URL ||
        (typeof window !== "undefined" ? window.location.origin : "");

      const redirectTo = `${origin}/auth/callback`;

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });

      if (oauthError) {
        setError(oauthError.message);
        setIsLoading(null);
      }
    } catch {
      setError(t("oauthFailed"));
      setIsLoading(null);
    }
  }

  return (
    <div className={styles.c003}>
      <div className={styles.c004}>
        <div className={styles.c005}>
          <div className={styles.c006}>
            <span className={styles.c007}>
              <span className={styles.c008}>
                <span className={styles.c009} />
                <span className={styles.c010} />
              </span>
              {t("systemStatus")}
            </span>
          </div>

          <div className={styles.c011}>
            <h1 className={styles.c012}>
              <span className={styles.c013}>{t("heroLine1")}</span>
              <br />
              <span className={styles.c014}>{t("heroLine2")}</span>
            </h1>

            <p className={styles.c015}>{t("heroDescription")}</p>
          </div>
        </div>

        <div className={styles.c016}>
          <div className={styles.c017}>
            <div className={styles.c018}>
              <AudioLines className={styles.c019} />
              <span className={styles.c020}>{t("liveStream")}</span>
            </div>
            <span className={styles.c021}>{t("sectorInfo")}</span>
          </div>

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

          <div className={styles.c024}>
            <span>{t("elapsed")}</span>
            <span className={styles.c025}>
              <span className={styles.c026} />
              {t("recording")}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.c027}>
        <div className={styles.c028}>
          <div className={styles.c029}>
            <div className={styles.c030}>
              <div className={styles.c031}>
                <AudioLines className={styles.c032} />
              </div>
            </div>

            <div className={styles.c033}>
              <h2 className={styles.c034}>{t("welcomeBack")}</h2>
              <p className={styles.c035}>{t("oauthOnlySubtitle")}</p>
            </div>

            {error && <div className={styles.c037}>{error}</div>}

            <div className={styles.c056}>
              <button
                type="button"
                className={styles.c057}
                disabled={isLoading !== null}
                onClick={() => void handleOAuthLogin("google")}
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
                {isLoading === "google" ? t("redirecting") : t("google")}
              </button>

              <button
                type="button"
                className={styles.c057}
                disabled={isLoading !== null}
                onClick={() => void handleOAuthLogin("kakao")}
              >
                <svg className={styles.c058} viewBox="0 0 24 24" fill="none">
                  <path d="M12 3C6.477 3 2 6.58 2 11c0 2.77 1.76 5.2 4.43 6.63L5.6 21l3.77-2.06c.84.15 1.72.23 2.63.23 5.523 0 10-3.58 10-8.17S17.523 3 12 3z" fill="#FEE500"/>
                  <path d="M9.2 9.1h1.5v5.4H9.2V9.1zm4.1 0h1.5v2h2v1.3h-2v2.1h-1.5V9.1z" fill="#191919"/>
                </svg>
                {isLoading === "kakao" ? t("redirecting") : t("kakao")}
              </button>
            </div>

            <div className={styles.c061}>
              <button type="button" className={styles.c062}>
                {t("privacyPolicy")}
              </button>
              <span>&middot;</span>
              <button type="button" className={styles.c062}>
                {t("termsOfService")}
              </button>
            </div>
          </div>
        </div>
      </div>

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
