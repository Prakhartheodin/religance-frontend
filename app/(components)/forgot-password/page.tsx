"use client";

import { forgotPassword } from "@/shared/auth/auth-client";
import BrandLogo from "@/shared/layout-components/brand-logo/brand-logo";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleReset = async () => {
    setBusy(true);
    try {
      await forgotPassword(email);
    } catch {
      // ponytail: swallow — never reveal whether the email exists.
    } finally {
      setBusy(false);
      setSent(true);
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
                <p className="h5 font-semibold mb-2 text-center">Reset Password</p>

                {sent ? (
                  <div className="p-4 text-sm border-t-4 border-success text-success rounded-lg bg-green-50 dark:bg-gray-800">
                    If an account exists for that email, a reset link is on its way.{" "}
                    <Link href="/" className="underline font-medium">
                      Back to sign in
                    </Link>
                    .
                  </div>
                ) : (
                  <>
                    <p className="mb-4 text-[#8c9097] dark:text-white/50 opacity-[0.7] font-normal text-center">
                      Enter your email and we&apos;ll send you a reset link.
                    </p>
                    <div className="grid grid-cols-12 gap-y-4">
                      <div className="xl:col-span-12 col-span-12">
                        <label htmlFor="fp-email" className="form-label text-default">
                          Email
                        </label>
                        <input
                          type="text"
                          name="email"
                          className="form-control form-control-lg w-full !rounded-md"
                          id="fp-email"
                          onChange={(e) => setEmail(e.target.value)}
                          value={email}
                        />
                      </div>
                      <div className="xl:col-span-12 col-span-12 grid mt-0">
                        <button
                          onClick={handleReset}
                          disabled={busy}
                          className="ti-btn ti-btn-primary !bg-primary !text-white !font-medium disabled:opacity-60"
                        >
                          {busy ? "Sending…" : "Send Reset Link"}
                        </button>
                      </div>
                    </div>
                    <div className="text-center mt-4">
                      <Link href="/" className="text-primary text-sm font-medium">
                        Back to sign in
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="xxl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-3 sm:col-span-2"></div>
        </div>
      </div>
    </div>
  );
}
