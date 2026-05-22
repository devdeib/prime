"use client";

import Image from "next/image";
import Carousel from "react-bootstrap/Carousel";
import { projectImageNeedsUnoptimized } from "@/lib/projects";
import styles from "./project-gallery-carousel.module.css";

type Props = {
  images: string[];
  alt: string;
};

export default function ProjectGalleryCarousel({ images, alt }: Props) {
  if (images.length === 0) return null;

  return (
    <div className={styles.wrap}>
      <Carousel
        className={styles.carousel}
        indicators={images.length > 1}
        controls={images.length > 1}
        interval={null}
        pause="hover"
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
