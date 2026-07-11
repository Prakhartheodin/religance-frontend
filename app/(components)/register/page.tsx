"use client";

import { register } from "@/shared/auth/auth-client";
import BrandLogo from "@/shared/layout-components/brand-logo/brand-logo";
import Link from "next/link";
import { useState } from "react";

// ponytail: policy mirrors the reference plan — >=8 chars, a letter and a number.
const isStrong = (pw: string) =>
  pw.length >= 8 && /[A-Za-z]/.test(pw) && /\d/.test(pw);

export default function Register() {
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [err, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const { name, email, password, confirmPassword } = data;

  const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
    setError("");
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }
    if (!confirmPassword) {
      setError("Confirm password is required.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Password and confirm password must match.");
      return;
    }
    if (!isStrong(password)) {
      setError("Password must be at least 8 characters with a letter and a number.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await register(name.trim(), email, password, confirmPassword);
      setDone(true);
    } catch (e: any) {
      setError(e?.message ?? "Registration failed.");
    } finally {
      setBusy(false);
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
                <p className="h5 font-semibold mb-2 text-center">Create Account</p>

                {err && (
                  <div
                    className="p-4 mb-4 bg-danger/40 text-sm border-t-4 border-danger text-danger/60 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
                    role="alert"
                  >
                    {err}
                  </div>
                )}

                {done ? (
                  <div className="p-4 mb-2 text-sm border-t-4 border-success text-success rounded-lg bg-green-50 dark:bg-gray-800">
                    Account created. We sent a verification link to{" "}
                    <strong>{email}</strong>. Verify your email, then{" "}
                    <Link href="/" className="underline font-medium">
                      sign in
                    </Link>
                    .
                  </div>
                ) : (
                  <>
                    <p className="mb-4 text-[#8c9097] dark:text-white/50 opacity-[0.7] font-normal text-center">
                      Register for a Religence CRM account
                    </p>
                    <div className="grid grid-cols-12 gap-y-4">
                      <div className="xl:col-span-12 col-span-12">
                        <label htmlFor="reg-name" className="form-label text-default">
                          Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          className="form-control form-control-lg w-full !rounded-md"
                          id="reg-name"
                          onChange={changeHandler}
                          value={name}
                        />
                      </div>
                      <div className="xl:col-span-12 col-span-12">
                        <label htmlFor="reg-email" className="form-label text-default">
                          Email
                        </label>
                        <input
                          type="text"
                          name="email"
                          className="form-control form-control-lg w-full !rounded-md"
                          id="reg-email"
                          onChange={changeHandler}
                          value={email}
                        />
                      </div>
                      <div className="xl:col-span-12 col-span-12">
                        <label htmlFor="reg-password" className="form-label text-default block">
                          Password
                        </label>
                        <div className="input-group">
                          <input
                            name="password"
                            type={show ? "text" : "password"}
                            value={password}
                            onChange={changeHandler}
                            className="form-control !border-s form-control-lg !rounded-s-md"
                            id="reg-password"
                            placeholder="password"
                          />
                          <button
                            onClick={() => setShow(!show)}
                            aria-label="Toggle password visibility"
                            className="ti-btn ti-btn-light !rounded-s-none !mb-0"
                            type="button"
                          >
                            <i className={`${show ? "ri-eye-line" : "ri-eye-off-line"} align-middle`}></i>
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-[#8c9097] dark:text-white/50">
                          At least 8 characters, with a letter and a number.
                        </p>
                      </div>
                      <div className="xl:col-span-12 col-span-12">
                        <label htmlFor="reg-confirm-password" className="form-label text-default block">
                          Confirm Password
                        </label>
                        <div className="input-group">
                          <input
                            name="confirmPassword"
                            type={showConfirm ? "text" : "password"}
                            value={confirmPassword}
                            onChange={changeHandler}
                            className="form-control !border-s form-control-lg !rounded-s-md"
                            id="reg-confirm-password"
                            placeholder="confirm password"
                          />
                          <button
                            onClick={() => setShowConfirm(!showConfirm)}
                            aria-label="Toggle confirm password visibility"
                            className="ti-btn ti-btn-light !rounded-s-none !mb-0"
                            type="button"
                          >
                            <i
                              className={`${showConfirm ? "ri-eye-line" : "ri-eye-off-line"} align-middle`}
                            ></i>
                          </button>
                        </div>
                      </div>
                      <div className="xl:col-span-12 col-span-12 grid mt-0">
                        <button
                          onClick={handleRegister}
                          disabled={busy}
                          className="ti-btn ti-btn-primary !bg-primary !text-white !font-medium disabled:opacity-60"
                        >
                          {busy ? "Creating…" : "Create Account"}
                        </button>
                      </div>
                    </div>
                    <div className="text-center mt-4">
                      <p className="text-[#8c9097] dark:text-white/50 text-sm">
                        Already have an account?{" "}
                        <Link href="/" className="text-primary font-medium">
                          Sign in
                        </Link>
                      </p>
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
