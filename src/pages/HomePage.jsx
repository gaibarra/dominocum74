import React from "react";
import Hero from "@/components/home/Hero";
import Services from "@/components/home/Services";
import About from "@/components/home/About";
import Testimonials from "@/components/home/Testimonials";
import LatestPosts from "@/components/home/LatestPosts";
import CTA from "@/components/home/CTA";

const HomePage = () => {
  return (
    <main>
      <Hero />
      <Services />
      <About />
      <Testimonials />
      <LatestPosts />
      <CTA />
    </main>
  );
};

export default HomePage;