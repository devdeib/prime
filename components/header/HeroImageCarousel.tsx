"use client";

import Carousel from "react-bootstrap/Carousel";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import type { HomeCarouselSlide } from "@/data/mock/home-carousel";
import styles from "./hero-image-carousel.module.css";

type HeroImageCarouselProps = {
  slides: HomeCarouselSlide[];
};

function inferMediaType(
  slide: HomeCarouselSlide
): "image" | "video" {
  if (slide.mediaType) return slide.mediaType;
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(slide.imageUrl)
    ? "video"
    : "image";
}

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
              <Col className={`py-0 ${styles.slideCol}`}>
                {inferMediaType(item) === "video" ? (
                  <video
                    className={styles.video}
                    src={item.imageUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <div
                    className={styles.imageFill}
                    style={{
                      backgroundImage: `url(${item.imageUrl})`,
                    }}
                  />
                )}
              </Col>
            </Row>
            <Carousel.Caption className={styles.caption} />
          </Carousel.Item>
        ))}
      </Carousel>
    </div>
  );
}
