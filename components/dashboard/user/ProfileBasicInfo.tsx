import { EditUserFormFields, userEditSchema } from "@/components/auth/helpers";
import { InputField } from "@/components/common/form/InputField";
import SubmitButton from "@/components/common/form/SubmitButton";
import { User } from "@/data/model/user";
import { getErrorMessage } from "@/data/utils/lib";
import { updateUser } from "@/data/api/user";
import { yupResolver } from "@hookform/resolvers/yup";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import React, { useState } from "react";
import { Row, Col, Card, Form, Container, Alert } from "react-bootstrap";
import { FormProvider, useForm } from "react-hook-form";
import { setProfileFormValue } from "./user.helpers";

type ProfileBasicInfoProps = {
  user: User;
};

type SessionWithToken = {
  access_token?: string;
  user?: { id?: number };
};

const ProfileBasicInfo: React.FC<ProfileBasicInfoProps> = ({ user }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const reactHookFormMethods = useForm({
    resolver: yupResolver(userEditSchema),
    mode: "onTouched",
  });
  const {
    handleSubmit,
    formState: { errors },
    setValue,
  } = reactHookFormMethods;

  setProfileFormValue(setValue, user);
  const errorMessage = getErrorMessage(errors);

  const onSubmit = async (data: Record<string, unknown>) => {
    if (!session) return;
    const typed = session as SessionWithToken;
    const id = Number(typed.user?.id);
    const token = typed.access_token ?? "";
    if (!id || !token) {
      setBanner("Missing session; sign in again.");
      return;
    }

    const payload: Partial<EditUserFormFields> = {
      first_name: data.first_name as string,
      last_name: data.last_name as string,
      email: data.email as string,
      phone: data.phone as string,
    };
    const pwd = data.password as string | undefined;
    if (pwd && String(pwd).trim() !== "") {
      payload.password = pwd;
    }

    setLoading(true);
    setBanner(null);
    try {
      await updateUser(id, payload, token);
      setBanner("Profile saved successfully.");
      router.refresh();
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const msg =
          (error.response?.data as { message?: string })?.message ??
          error.message;
        setBanner(msg ?? "Update failed.");
      } else {
        setBanner("Update failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="px-2" fluid>
      {banner && (
        <Alert
          variant={
            banner.toLowerCase().includes("success") ? "success" : "danger"
          }
          className="mt-3"
          dismissible
          onClose={() => setBanner(null)}
        >
          {banner}
        </Alert>
      )}
      <Row className="py-5">
        <Col md={8}>
          <Card className="border-0">
            <Card.Body>
              <Row className="py-2">
                <Col md="12">
                  <h3 className="text-center ft-24 fw-bold mb-3">
                    Update Profile Information
                  </h3>
                </Col>
              </Row>

              <Row>
                <Col md="12">
                  <FormProvider {...reactHookFormMethods}>
                    <Form className="py-2" onSubmit={handleSubmit(onSubmit)}>
                      <Row className="mb-3">
                        <Col md="6">
                          <InputField
                            labelText="First name"
                            name="first_name"
                            inputType="text"
                            errorMessage={errorMessage("first_name")}
                          />
                        </Col>
                        <Col md="6">
                          <InputField
                            labelText="Last name"
                            name="last_name"
                            inputType="text"
                            errorMessage={errorMessage("last_name")}
                          />
                        </Col>
                      </Row>

                      <Row className="mb-3">
                        <Col md="12">
                          <InputField
                            labelText="Email"
                            name="email"
                            inputType="text"
                            errorMessage={errorMessage("email")}
                          />
                        </Col>
                      </Row>
                      <Row className="mb-3">
                        <Col md="12">
                          <InputField
                            labelText="Phone"
                            name="phone"
                            inputType="text"
                            errorMessage={errorMessage("phone")}
                          />
                        </Col>
                      </Row>
                      <Row>
                        <Col md="12">
                          <InputField
                            labelText="New password (optional)"
                            name="password"
                            inputType="password"
                            errorMessage={errorMessage("password")}
                          />
                        </Col>
                      </Row>
                      <Row className="py-3">
                        <Col md="12" className="mt-2">
                          <SubmitButton
                            title="Save"
                            variant="warning"
                            isLoading={loading}
                          />
                        </Col>
                      </Row>
                    </Form>
                  </FormProvider>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProfileBasicInfo;
