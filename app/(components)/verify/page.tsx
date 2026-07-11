"use client";

import { verifyEmail } from "@/shared/auth/auth-client";
import BrandLogo from "@/shared/layout-components/brand-logo/brand-logo";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Verify() {
  const [state, setState] = useState<"working" | "ok" | "fail">("working");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token") ?? "";
    verifyEmail(token)
      .then(() => setState("ok"))
      .catch(() => setState("fail"));
  }, []);

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
              <div className="box-body !p-0 text-center">
                <p className="h5 font-semibold mb-4">Email Verification</p>
                {state === "working" && (
                  <p className="text-[#8c9097] dark:text-white/50">Verifying…</p>
                )}
                {state === "ok" && (
                  <div className="p-4 text-sm border-t-4 border-success text-success rounded-lg bg-green-50 dark:bg-gray-800">
                    Email verified.{" "}
                    <Link href="/" className="underline font-medium">
                      Sign in
                    </Link>
                    .
                  </div>
                )}
                {state === "fail" && (
                  <div className="p-4 text-sm border-t-4 border-danger text-danger rounded-lg bg-red-50 dark:bg-gray-800">
                    This verification link is invalid or expired.{" "}
                    <Link href="/" className="underline font-medium">
                      Back to sign in
                    </Link>
                    .
                  </div>
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
