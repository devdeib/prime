"use client";

import React, { useState } from "react";
import { Form } from "react-bootstrap";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import SubmitButton from "@/components/common/form/SubmitButton";
import { SignInFormFields, signInSchema } from "@/components/auth/helpers";
import { FormProvider, useForm } from "react-hook-form";
import { getErrorMessage } from "@/data/utils/lib";
import { yupResolver } from "@hookform/resolvers/yup";
import { InputField } from "@/components/common/form/InputField";
import { useTranslation } from "react-i18next";
import BrandMark from "@/components/brand/BrandMark";
import styles from "./signin.module.css";

const SignIn = () => {
  const { t } = useTranslation("common");
  const [submitLoading, setSubmitLoading] = useState(false);
  const router = useRouter();

  const reactHookFormMethods = useForm<SignInFormFields>({
    resolver: yupResolver(signInSchema),
    mode: "onTouched",
  });

  const {
    handleSubmit,
    formState: { errors },
  } = reactHookFormMethods;

  const errorMessage = getErrorMessage(errors);

  const onSubmit = async (data: SignInFormFields) => {
    const { email, password } = data;
    setSubmitLoading(true);
    console.log({
      email, password
    })
    setSubmitLoading(false);
    try {
      setSubmitLoading(true);
      const res = await signIn("credentials", {
        email: email,
        password: password,
        redirect: false,
      });
      if (res?.ok && res.error == null) {
        const url = new URL(res?.url as string);
        const callBackUrl = url.searchParams.get("callbackUrl");
        if (callBackUrl) {
          //router.push(callBackUrl as string);
          console.log("login success full");
          router.push("/");
        } else {
          console.log("login success full");
          router.push("/");
        }
      } else {
        setSubmitLoading((prev) => !prev);
        alert(t("auth.wrongCreds"));
      }
    } catch (error) {
      setSubmitLoading(false);
      console.log("login error", error);
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.intro}>
          <BrandMark
            href="/"
            stacked={false}
            text="Prime"
            className={styles.brand}
            logoWidth={58}
          />
          <p className={styles.eyebrow}>Private access</p>
          <h1 className={styles.title}>{t("auth.login")}</h1>
          <p className={styles.subtitle}>
            Access the Prime workspace with a calmer, cleaner sign-in
            experience that matches the store’s visual identity.
          </p>
          <div className={styles.highlights}>
            <div className={styles.highlight}>
              Refined furniture collections, showroom management, and content tools in one place.
            </div>
            <div className={styles.highlight}>
              Designed to feel lighter and more elegant than the previous form layout.
            </div>
          </div>
        </div>

        <div className={styles.formWrap}>
          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>{t("auth.submit")}</h2>
            <p className={styles.formText}>
              Enter your email and password to continue.
            </p>

            <FormProvider {...reactHookFormMethods}>
              <Form onSubmit={handleSubmit(onSubmit)}>
                <InputField
                  labelText={t("auth.email")}
                  name="email"
                  inputType="email"
                  errorMessage={errorMessage("email")}
                />

                <InputField
                  labelText={t("auth.password")}
                  name="password"
                  inputType="password"
                  errorMessage={errorMessage("password")}
                />

                <SubmitButton
                  title={t("auth.submit")}
                  isLoading={submitLoading}
                  loadingTitle={t("auth.checking")}
                  buttonCls={styles.submit}
                  variant="dark"
                />
              </Form>
            </FormProvider>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SignIn;
