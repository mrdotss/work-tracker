import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Feature } from "@/components/landing/feature";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  return (
      <>
        <Navbar />
        <Hero/>
        <Feature />
        <Footer />
      </>
  );
}