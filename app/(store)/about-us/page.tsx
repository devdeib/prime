"use client";

import { useEffect, useState } from "react";
import AboutUs from "@/legacy-pages/about-us";
import Loader from "@/components/common/loader/Loader";
import { getStorageFiles } from "@/data/api/storage-files";
import { StorageFile } from "@/data/model/storage-file";

export default function AboutUsPage() {
  const [productBanner, setProductBanner] = useState<StorageFile[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setError(null);
        const res = await getStorageFiles("?type=home_banner");
        if (!mounted) return;
        setProductBanner(Array.isArray(res.data.data) ? res.data.data : []);
      } catch {
        if (!mounted) return;
        setError("Unable to load page data");
        setProductBanner([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <Loader />;
  if (error) return <p className="p-4 text-center text-muted">{error}</p>;
  if (!productBanner) return null;

  return <AboutUs productBanner={productBanner} />;
}
