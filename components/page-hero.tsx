import Image from 'next/image';

export function PageHero({ eyebrow, title, description, image, alt }: { eyebrow: string; title: string; description: string; image: string; alt: string }) {
  return (
    <section className="page-hero">
      <Image src={image} alt={alt} fill priority sizes="100vw" className="page-hero-image" />
      <div className="page-hero-shade" />
      <div className="circuit-grid" aria-hidden="true" />
      <div className="page-hero-copy"><p className="eyebrow"><span /> {eyebrow}</p><h1>{title}</h1><p>{description}</p></div>
    </section>
  );
}
