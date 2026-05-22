"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Carousel from "react-bootstrap/Carousel";
import { projectImageNeedsUnoptimized } from "@/lib/projects";
import styles from "./project-gallery-carousel.module.css";

const SLIDE_INTERVAL_MS = 6500;

type Props = {
  images: string[];
  alt: string;
};

export default function ProjectGalleryCarousel({ images, alt }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [images]);

  useEffect(() => {
    if (images.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <div className={styles.wrap}>
      <Carousel
        className={styles.carousel}
        activeIndex={activeIndex}
        onSelect={setActiveIndex}
        indicators={images.length > 1}
        controls={images.length > 1}
        interval={null}
        pause={false}
        wrap
      >
        {images.map((src, index) => (
          <Carousel.Item key={`${src}-${index}`} className={styles.item}>
            <div className={styles.slide}>
              <Image
                src={src}
                alt={`${alt} — ${index + 1}`}
                fill
                sizes="100vw"
                className={styles.image}
                priority={index === 0}
                unoptimized={projectImageNeedsUnoptimized(src)}
              />
            </div>
          </Carousel.Item>
        ))}
      </Carousel>
    </div>
  );
}
