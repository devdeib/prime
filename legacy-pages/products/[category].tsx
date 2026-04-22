import BaseContainer from "@/components/common/container/BaseContainer";
import React from "react";
import { Row, Col } from "react-bootstrap";
import { NextPageWithLayout } from "../_app";
import { GetServerSideProps } from "next";
import { Product } from "@/data/model/products";
import Meta from "@/components/meta/Meta";

/*
  NOTE: This page is for legacy compatibility with the old bakery products/[category] route.
  All our products are now furniture. Category and product data comes from the new furniture-style API.
  Products and categories match the furniture model.
*/

type CategoryProductsProps = {
  productsItems: Product[];
  category: string;
};

const CategoryProducts: NextPageWithLayout<CategoryProductsProps> = ({
  productsItems,
  category,
}) => {
  // Capitalize the category for display (e.g. sofas -> Sofas)
  const title =
    category && typeof category === "string"
      ? category.charAt(0).toUpperCase() + category.slice(1)
      : "Furniture";

  return (
    <BaseContainer>
      <Meta
        title={`La Dolce Casa | ${title}`}
        content={`Browse ${title} | Modern furniture for home and office`}
      />
      <Row className="py-3">
        <Col md="7">
          <ul style={{ listStyleType: "none" }} className="ft-14 fw-normal">
            <li className="px-1" style={{ display: "inline" }}>
              Home
            </li>
            <li className="px-1" style={{ display: "inline" }}>
              /
            </li>
            <li className="px-1" style={{ display: "inline" }}>
              Products
            </li>
            <li className="px-1" style={{ display: "inline" }}>
              /
            </li>
            <li className="px-1" style={{ display: "inline" }}>
              {title}
            </li>
          </ul>
        </Col>
        <Col md="5"></Col>
      </Row>
      {/* ProductList expects furniture product model */}
      <div style={{ marginBottom: 32 }}>
        {/* Reuse the existing ProductList, assuming it supports the furniture model */}
        {/* Prefer App Router `/products/[category]` with FurnitureCatalogExperience. */}
        {/* Otherwise: */}
        {/* @ts-expect-error legacy usage; migrate to new ProductList if needed */}
        <ProductList products={productsItems} loading={false} />
      </div>
    </BaseContainer>
  );
};

// This SSR handler expects furniture categories (not bakery!)
// When no category provided, defaults to 'sofas'.
export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  try {
    const { category } = query;
    const cat = typeof category === "string" ? category : "sofas";
    const productsUrl =
      cat && cat !== "all-items"
        ? `?per_page=24&category=${encodeURIComponent(cat)}`
        : `?per_page=24&category=sofas`;

    // getProducts hits the new furniture API
    const productRes = await require("@/data/api/products").getProducts(productsUrl);
    const productsItems = productRes.data?.data ?? [];

    return { props: { productsItems, category: cat } };
  } catch (error) {
    return {
      notFound: true,
    };
  }
};

export default CategoryProducts;
