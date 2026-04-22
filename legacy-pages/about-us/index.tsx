"use client";

import BaseContainer from "@/components/common/container/BaseContainer";
import Meta from "@/components/meta/Meta";
import { StorageFile } from "@/data/model/storage-file";
import React from "react";
import { Row, Col, Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";

type AboutUsProps = {
  productBanner: StorageFile[];
};

const AboutUs: React.FC<AboutUsProps> = ({ productBanner }) => {
  const { t } = useTranslation("common");

  return (
    <section>
      <Meta title={t("about.metaTitle")} content={t("about.metaDesc")} />
      <BaseContainer>
        <Row className="py-5">
          <Col md="6">
            <Row>
              <Col md="12">
                <Card className="rounded-0">
                  <Card.Body className="py-0 px-0">
                    {/*eslint-disable-next-line @next/next/no-img-element*/}
                    <img
                      src={
                        productBanner.length > 0
                          ? productBanner[0].image_url
                          : ""
                      }
                      alt="La Dolce Casa"
                      className="img-fluid"
                      style={{
                        width: "100%",
                        height: "min(760px, 72vh)",
                        objectFit: "cover",
                      }}
                    />
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Col>
          <Col md="6">
            <h1
              className="ft-8 fw-bold text-uppercase text-left mb-2"
              style={{ color: "#b8942f" }}
            >
              {t("about.who")}
            </h1>
            <h1 className="ft-18 fw-bold text-muted text-left mt-3 mb-3">
              {t("about.title")}
            </h1>
              <hr />
            <div>
              <p className="text-justify ft-14 fw-normal text-color-b94 mt-2 mb-3">
                {t("about.p1")}
              </p>
              <p className="text-justify ft-14 fw-normal text-color-b94 mt-2 mb-3">
                {t("about.p2")}
              </p>
              <p className="text-justify ft-14 fw-normal text-color-b94 mt-2 mb-3">
                {t("about.p3")}
              </p>
              <p className="text-justify ft-14 fw-normal text-color-b94 mt-2 mb-3">
                {t("about.p4")}
              </p>
            </div>
          </Col>
        </Row>
        <Row>
          <Col md="6">
            <h1
              className="ft-20 mt-3 mb-3 text-center "
              style={{ color: "#b8942f" }}
            >
              {t("about.brand")}
            </h1>
            <h2 className="ft-30 text-dark mt-3 mb-3 text-center ">
              {t("about.tagline")}
            </h2>
          </Col>
          <Col md="6">
            <Row>
              <Col md="6" sm="6" xs="6">
                <h1
                  className="ft-18 fw-normal text-center mt-2 mb-3"
                  style={{ color: "#b8942f" }}
                >
                  {t("about.showrooms")}
                </h1>
                <p className="text-center ft-14 fw-normal text-color-b94 min-height-150">
                  {t("about.showroomsText")}
                </p>
              </Col>
              <Col md="6" sm="6" xs="6">
                <h1
                  className="ft-18 fw-normal text-center mt-2 mb-3"
                  style={{ color: "#b8942f" }}
                >
                  {t("about.ourProducts")}
                </h1>
                <p className="text-center ft-14 fw-normal text-color-b94 min-height-150">
                  {t("about.productsText")}
                </p>
              </Col>
            </Row>
          </Col>
        </Row>
        <Row className="py-5 border-bottom">
          <Col md="6">
            <h1
              className="ft-17 mt-3 mb-3 text-center "
              style={{ color: "#b8942f" }}
            >
              {t("about.mission")}
            </h1>
            <h2 className="ft-22 text-dark mt-2 mb-2 text-center ">
              {t("about.tagline")}
            </h2>
            <p className="ft-16 fw-normal text-color-b94 mb-3 text-center ">
              {t("about.missionText")}
            </p>
          </Col>
          <Col md="6">
            <Row>
              <Col md="6" sm="6" xs="6">
                <h1
                  className="ft-30 fw-bold text-center mt-2 mb-2"
                  style={{ color: "#b8942f" }}
                >
                  2001
                </h1>
                <p className="text-center ft-18 fw-normal text-color-b94 text-uppercase">
                  {t("about.founding")}
                </p>
              </Col>
              <Col md="6" sm="6" xs="6">
                <h1
                  className="ft-30 fw-bold text-center mt-2 mb-2"
                  style={{ color: "#b8942f" }}
                >
                  30
                </h1>
                <p className="text-center ft-18 fw-normal text-color-b94 text-uppercase">
                  {t("about.showroomsCount")}
                </p>
              </Col>
            </Row>
            <Row>
              <Col md="6" sm="6" xs="6">
                <h1
                  className="ft-30 fw-bold text-center mt-2 mb-2"
                  style={{ color: "#b8942f" }}
                >
                  20
                </h1>
                <p className="text-center ft-18 fw-normal text-color-b94 text-uppercase">
                  {t("about.categories")}
                </p>
              </Col>
              <Col md="6" sm="6" xs="6">
                <h1
                  className="ft-30 fw-bold text-center mt-2 mb-2"
                  style={{ color: "#b8942f" }}
                >
                  100000
                </h1>
                <p className="text-center ft-18 fw-normal text-color-b94 text-uppercase">
                  {t("about.customers")}
                </p>
              </Col>
            </Row>
          </Col>
        </Row>
      </BaseContainer>
    </section>
  );
};

export default AboutUs;
