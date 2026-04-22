"use client";

import Carousel from "react-bootstrap/Carousel";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import type { HomeCarouselSlide } from "@/data/mock/home-carousel";
import styles from "./hero-image-carousel.module.css";

type HeroImageCarouselProps = {
  slides: HomeCarouselSlide[];
};

/**
 * Image-only hero carousel (legacy HomeCarousel behaviour): only the background
 * image changes per slide; no captions.
 */
export default function HeroImageCarousel({ slides }: HeroImageCarouselProps) {
  if (!slides.length) return null;

  const sorted = [...slides].sort((a, b) => a.id - b.id);

  return (
    <div className={styles.wrap}>
      <Carousel
        className={styles.carousel}
        indicators
        controls
        interval={6000}
        pause="hover"
      >
        {sorted.map((item) => (
          <Carousel.Item
            key={item.id}
            interval={6000}
            className={styles.item}
          >
            <Row className="g-0">
              <Col
                className={`py-0 ${styles.slideCol}`}
                style={{
                  backgroundImage: `url(${item.imageUrl})`,
                }}
              />
            </Row>
            <Carousel.Caption className={styles.caption} />
          </Carousel.Item>
        ))}
      </Carousel>
    </div>
  );
}
