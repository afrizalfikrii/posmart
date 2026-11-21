import productSheet from "@/assets/posymart-umkm-products.png";

export function ProductPhoto({
  pos,
  imageUrl,
  alt = "",
  className = "",
}: {
  pos: string;
  imageUrl?: string;
  alt?: string;
  className?: string;
}) {
  if (imageUrl) {
    return <img src={imageUrl} alt={alt} className={`bg-[#F7F3EC] object-cover ${className}`} />;
  }

  return (
    <div
      className={`bg-[#F7F3EC] bg-no-repeat ${className}`}
      style={{
        backgroundImage: `url(${productSheet})`,
        backgroundPosition: pos,
        backgroundSize: "400% 200%",
      }}
    />
  );
}
