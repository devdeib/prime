"use client";

import BaseContainer from "@/components/common/container/BaseContainer";
import React from "react";
import {
  Row,
  Col,
  Button,
  Form,
  InputGroup,
  FloatingLabel,
} from "react-bootstrap";
import { FaHome } from "react-icons/fa";
import { AiOutlineUser } from "react-icons/ai";
import {
  MdMailOutline,
  MdOutlineAddIcCall,
  MdOutlineMail,
} from "react-icons/md";
import { FaWhatsapp, FaGlobe } from "react-icons/fa";
import InputGroupField from "@/components/common/form/InputGroupField";
import {
  ContactUsFormFields,
  contactUsSchema,
} from "@/components/contact-us/contact-us.helper";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { getErrorMessage } from "@/data/utils/lib";
import TextAreaField from "@/components/common/form/TextAreaField";
import Meta from "@/components/meta/Meta";
import { useTranslation } from "react-i18next";

const ContactUs: React.FC = () => {
  const { t } = useTranslation("common");
  const methods = useForm<ContactUsFormFields>({
    resolver: yupResolver(contactUsSchema),
    mode: "onTouched",
  });

  const {
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  const onSubmit = async (_data: ContactUsFormFields) => {
    alert(t("contact.thanks"));
    reset();
  };

  const errorMessage = getErrorMessage(errors);

  return (
    <section>
      <BaseContainer>
        <Meta title={t("contact.metaTitle")} content={t("contact.metaDesc")} />
        <Row className="py-5 border-bottom">
          <Col md="6">
            <h1 className="ft-24 fw-bold text-dark">{t("contact.office")}</h1>
            <div className="py-2">
              {/* <h2 className="ft-16">
                <span className="text-color-b94" style={{ marginRight: "8px" }}>
                  <FaHome size={19} />
                </span>
                <span className="text-color-b94 fw-normal">
                  {t("contact.address")}
                </span>
              </h2> */}
            </div>
            <div className="py-2">
              <h2 className="ft-16">
                <span className="text-color-b94" style={{ marginRight: "8px" }}>
                  <FaWhatsapp size={19} style={{ color: "#d7a83e" }} />
                </span>
                <span className="text-color-b94 fw-normal">+966 56 668 4729</span>
              </h2>
            </div>
            <div className="py-2">
              <h2 className="ft-16">
                <span className="text-color-b94" style={{ marginRight: "8px" }}>
                  <MdMailOutline size={19} style={{ color: "#d7a83e" }}/>
                </span>
                <span className="text-color-b94 fw-normal">Info@ladolcecasa.net</span>
              </h2>
            </div>
            <div className="py-2">
              <h2 className="ft-16">
                <span className="text-color-b94" style={{ marginRight: "8px" }}>
                  <FaGlobe size={19} style={{ color: "#d7a83e" }}/>
                </span>
                <span className="text-color-b94 fw-normal">Ladolcecasa.net</span>
              </h2>
            </div>
            <Row className="py-2">
              <Col md="12">
                <h2 className="ft-24 fw-bold text-dark mt-2 mb-2">
                  {t("contact.openingTitle")}
                </h2>
                <h3 className="mt-2">
                  <span className="ft-16 fw-normal text-color-b94">
                    {t("contact.openingHours")}
                  </span>
                </h3>
              </Col>
            </Row>
          </Col>
          <Col md="6">
            <h1 className="ft-24 fw-bold text-dark mt-3 mb-3">
              {t("contact.getInTouch")}
            </h1>
            <div>
              <FormProvider {...methods}>
                <Form className="py-3" onSubmit={handleSubmit(onSubmit)}>
                  <InputGroupField
                    labelTextIcon={<AiOutlineUser size={19} />}
                    name="name"
                    inputType="text"
                    placeholder={t("contact.name")}
                    errorMessage={errorMessage("name")}
                  />

                  <InputGroupField
                    labelTextIcon={<MdOutlineAddIcCall size={19} />}
                    name="phone"
                    inputType="text"
                    placeholder={t("contact.phone")}
                    errorMessage={errorMessage("phone")}
                  />

                  <InputGroupField
                    labelTextIcon={<MdOutlineMail size={19} />}
                    name="email"
                    inputType="email"
                    placeholder={t("contact.email")}
                    errorMessage={errorMessage("email")}
                  />

                  <TextAreaField
                    labelText={`${t("contact.message")} : `}
                    name="message"
                    rows={3}
                    errorMessage={errorMessage("message")}
                  />

                  <Row className="py-4">
                    <Col>
                      <Form.Group className="mb-3" controlId="formBasicEmail">
                        <Button
                          variant="info"
                          type="submit"
                          className="w-100 rounded-0"
                        >
                          {t("contact.send")}
                        </Button>
                      </Form.Group>
                    </Col>
                  </Row>
                </Form>
              </FormProvider>
            </div>
          </Col>
        </Row>
      </BaseContainer>
    </section>
  );
};

export default ContactUs;
