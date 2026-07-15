"use client";

import { login, resendVerification } from "@/shared/auth/auth-client";
import BrandLogo from "@/shared/layout-components/brand-logo/brand-logo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const [passwordshow1, setpasswordshow1] = useState(false);
  const [err, setError] = useState("");
  const [unverified, setUnverified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState({ email: "", password: "" });
  const { email, password } = data;

  const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
    setError("");
    setUnverified(false);
  };

  const router = useRouter();

  const handleSignIn = async () => {
    setBusy(true);
    setError("");
    setUnverified(false);
    try {
      await login(email, password);
      router.push("/active-leads/");
    } catch (e: any) {
      // Backend returns 403 "verify your email…" for unverified accounts.
      if (typeof e?.message === "string" && /verify your email/i.test(e.message)) {
        setUnverified(true);
        setError("Please verify your email before signing in.");
      } else {
        setError("Invalid email or password");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendVerification(email);
      setError("Verification email sent. Check your inbox.");
      setUnverified(false);
    } catch {
      setError("Could not resend verification email.");
    }
  };

  return (
    <div className="container">
      <div className="flex justify-center authentication authentication-basic items-center h-full text-defaultsize text-defaulttextcolor">
        <div className="grid grid-cols-12">
          <div className="xxl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-3 sm:col-span-2"></div>
          <div className="xxl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6 sm:col-span-8 col-span-12">
            <div className="box !p-[3rem]">
              <div className="flex justify-center mb-6">
                <Link href="/" aria-label="Religence home">
                  <BrandLogo auth />
                </Link>
              </div>

              <div className="box-body !p-0">
                <p className="h5 font-semibold mb-2 text-center">Sign In</p>
                {err && (
                  <div
                    className="p-4 mb-4 bg-danger/40 text-sm border-t-4 border-danger text-danger/60 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
                    role="alert"
                  >
                    {err}
                    {unverified && (
                      <button
                        type="button"
                        onClick={handleResend}
                        className="ms-1 underline font-medium"
                      >
                        Resend verification email
                      </button>
                    )}
                  </div>
                )}

                <p className="mb-4 text-[#8c9097] dark:text-white/50 opacity-[0.7] font-normal text-center">
                  Sign in to your Religence CRM account
                </p>
                <div className="grid grid-cols-12 gap-y-4">
                  <div className="xl:col-span-12 col-span-12">
                    <label htmlFor="signin-email" className="form-label text-default">
                      Email
                    </label>
                    <input
                      type="text"
                      name="email"
                      className="form-control form-control-lg w-full !rounded-md"
                      id="signin-email"
                      onChange={changeHandler}
                      value={email}
                    />
                  </div>
                  <div className="xl:col-span-12 col-span-12 mb-2">
                    <label htmlFor="signin-password" className="form-label text-default block">
                      Password
                    </label>
                    <div className="input-group">
                      <input
                        name="password"
                        type={passwordshow1 ? "text" : "password"}
                        value={password}
                        onChange={changeHandler}
                        className="form-control !border-s form-control-lg !rounded-s-md"
                        id="signin-password"
                        placeholder="password"
                      />
                      <button
                        onClick={() => setpasswordshow1(!passwordshow1)}
                        aria-label="Toggle password visibility"
                        className="ti-btn ti-btn-light !rounded-s-none !mb-0"
                        type="button"
                      >
                        <i
                          className={`${passwordshow1 ? "ri-eye-line" : "ri-eye-off-line"} align-middle`}
                        ></i>
                      </button>
                    </div>
                    <div className="mt-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="form-check !ps-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          defaultValue=""
                          id="defaultCheck1"
                        />
                        <label
                          className="form-check-label text-[#8c9097] dark:text-white/50 font-normal"
                          htmlFor="defaultCheck1"
                        >
                          Remember password
                        </label>
                      </div>
                      <Link
                        href="/forgot-password/"
                        className="text-primary text-sm font-medium"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  </div>
                  <div className="xl:col-span-12 col-span-12 grid mt-0">
                    <button
                      onClick={handleSignIn}
                      disabled={busy}
                      className="ti-btn ti-btn-primary !bg-primary !text-white !font-medium disabled:opacity-60"
                    >
                      {busy ? "Signing in…" : "Sign In"}
                    </button>
                  </div>
                </div>
                <div className="text-center mt-4">
                  <p className="text-[#8c9097] dark:text-white/50 text-sm">
                    Don&apos;t have an account?{" "}
                    <Link href="/register/" className="text-primary font-medium">
                      Create one
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="xxl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-3 sm:col-span-2"></div>
        </div>
      </div>
    </div>
  );
}
