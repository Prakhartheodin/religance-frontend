"use client";

import BrandLogo from "@/shared/layout-components/brand-logo/brand-logo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const [passwordshow1, setpasswordshow1] = useState(false);
  const [err, setError] = useState("");
  const [data, setData] = useState({
    email: "adminnextjs@gmail.com",
    password: "1234567890",
  });
  const { email, password } = data;

  const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
    setError("");
  };

  const router = useRouter();
  const RouteChange = () => {
    router.push("/active-leads/");
  };

  const handleSignIn = () => {
    if (data.email === "adminnextjs@gmail.com" && data.password === "1234567890") {
      RouteChange();
    } else {
      setError("Invalid email or password");
      setData({
        email: "adminnextjs@gmail.com",
        password: "1234567890",
      });
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
                <Link href="/active-leads/" aria-label="Religence home">
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
                    <div className="mt-2">
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
                          Remember password ?
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="xl:col-span-12 col-span-12 grid mt-0">
                    <button
                      onClick={handleSignIn}
                      className="ti-btn ti-btn-primary !bg-primary !text-white !font-medium"
                    >
                      Sign In
                    </button>
                  </div>
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
