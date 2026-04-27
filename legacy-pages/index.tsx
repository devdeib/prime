import BaseContainer from "@/components/common/container/BaseContainer";
import HomeCarousel from "@/components/header/HomeCarousel";
import Meta from "@/components/meta/Meta";
import { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button, Card, Col, Row } from "react-bootstrap";
import { NextPageWithLayout } from "./_app";
import { Product } from "@/data/model/products";
import { getProducts } from "@/data/api/products";
import { StorageFile } from "@/data/model/storage-file";
import { getStorageFiles } from "@/data/api/storage-files";
import { getCategories } from "@/data/api/category";
import { Category } from "@/data/model/category";
import CategoryList from "@/components/home/CategoryList";
import ProductList from "@/components/home/ProductList";

/**
 * لاحظ أن الموديلات ومخرجاتها أصبحت أثاث
 * categories: Sofas, Corner Sets, Beds, Dining Tables, Chairs, Wardrobes, Others
 * المنتجات ستأتي بناءً على هذه الفئات
 */

type ProductListPageProps = {
  response: {
    productsItems: Product[];
    bannerFiles: StorageFile[];
    categories: Category[];
    homeBanner: StorageFile[];
  };
};

// كل شيء يتحول هنا إلى سياق الأثاث Furniture
const Home: NextPageWithLayout<ProductListPageProps> = ({
  response: { productsItems, bannerFiles, categories, homeBanner },
}) => {
  const { data: session } = useSession();
  // Default category is now the first furniture category's alias (example: 'sofas')
  const [products, setProducts] = useState<Product[]>(productsItems);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categories.length > 0 ? categories[0].alias : "all-items"
  );

  const handleCategory = async (categoryAlias: string) => {
    try {
      setProducts([]);
      const productFilterUrl = `?per_page=16&category=${categoryAlias}`;
      setLoading(true);
      const result = await getProducts(productFilterUrl);
      setSelectedCategory(categoryAlias);
      setLoading(false);
      setProducts(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.log("error : ", error);
      setLoading(false);
    }
  };

  return (
    <>
      <Meta
        title="La Dolce Casa | Best furniture selection ever"
        content="Find the best sofas, sets, beds, and more. Discover stylish, affordable furniture for every home and occasion."
      />
      <header>
        <HomeCarousel carouselItems={bannerFiles} />
      </header>
      <BaseContainer>
        <Row className="py-3 mt-2 mb-2 border-bottom">
          <Col md="12">
            <h1 className="text-center text-color-d12 ft-30 fw-bold mb-2 ">
              Furniture Products & Categories
            </h1>
          </Col>
        </Row>
        <CategoryList
          categoryItems={categories}
          handleCategory={handleCategory}
          selectedCategory={selectedCategory}
        />
        <ProductList products={products} loading={loading} />

        {homeBanner.length > 0 && (
          <Row className="py-5 border-bottom mt-4">
            <Col md="6">
              <Card className="rounded-0">
                <Card.Body className="py-0 px-0">
                  {/*eslint-disable-next-line @next/next/no-img-element*/}
                  <img
                    src={homeBanner.length > 0 ? homeBanner[0].image_url : ""}
                    alt="furniture banner"
                    className="mx-auto d-block mt-3 mb-3 img-fluid"
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col md="6" className="py-3">
              <Row>
                <Col
                  md={{ span: 8, offset: 2 }}
                  sm={{ span: 8, offset: 2 }}
                  xs={{ span: 8, offset: 2 }}
                >
                  <h2 className="text-center ft-30 fw-bold mb-3 mt-5 text-danger">
                    Refresh Your Home With VG Furniture!
                  </h2>
                  <h6 className="text-justify ft-16 fw-normal mb-3 mt-4 text-color-b94">
                    Get inspired with our modern sofas, beds, wardrobes, and premium furniture. Choose your favorite category and discover quality items for every space.
                  </h6>
                </Col>
              </Row>
              <Row className="py-3">
                <Col
                  md={{ span: 6, offset: 3 }}
                  sm={{ span: 6, offset: 3 }}
                  xs={{ span: 12, offset: 1 }}
                  className="justify-content-center"
                >
                  <Row>
                    <Col md="6" sm="6" xs="6">
                      <Button
                        href={
                          categories.length > 0
                            ? `/products/${categories[0].alias}`
                            : "/products/sofas"
                        }
                        variant="danger"
                        className="rounded-0"
                      >
                        <span className="ft-16 ft-normal">View More</span>
                      </Button>
                    </Col>
                    <Col md="6" sm="6" xs="6">
                      <Button
                        href="/"
                        variant="outline-dark"
                        className="rounded-0"
                      >
                        <span className="ft-16 ft-normal">Go to Shop</span>
                      </Button>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Col>
          </Row>
        )}
      </BaseContainer>
    </>
  );
};

// التحميل الافتراضي سيأخذ فئة أثاث أولى
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  try {
    // استخدم أول فئة إن وجدت أو all-items
    let defaultCategoryAlias = "all-items";
    const categoriesRes = await getCategories();
    const categoriesArr = Array.isArray(categoriesRes.data) ? categoriesRes.data : [];
    if (categoriesArr.length > 0) {
      defaultCategoryAlias = categoriesArr[0].alias;
    }

    const productsUrl = `?per_page=12&category=${defaultCategoryAlias}`;
    const bannerImageUrl = `?type=banner`;
    const homeBannerUrl = `?type=home_banner`;

    const [productRes, bannerFileRes, categoryRes, homeBannerRes] =
      await Promise.all([
        getProducts(productsUrl),
        getStorageFiles(bannerImageUrl),
        getCategories(),
        getStorageFiles(homeBannerUrl),
      ]);
    const response = {
      productsItems: Array.isArray(productRes.data) ? productRes.data : [],
      bannerFiles: Array.isArray(bannerFileRes.data) ? bannerFileRes.data : [],
      categories: Array.isArray(categoryRes.data) ? categoryRes.data : [],
      homeBanner: Array.isArray(homeBannerRes.data) ? homeBannerRes.data : [],
    };

    return { props: { response } };
  } catch (error) {
    return {
      notFound: true,
    };
  }
};

export default Home;
