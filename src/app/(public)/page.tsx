import { supabasePublic } from "@/lib/supabase-public";
import { Hero } from "./sections/Hero";
import { ComoFunciona } from "./sections/ComoFunciona";
import { ReviewsCarousel } from "./sections/ReviewsCarousel";
import { RedesSociais } from "./sections/RedesSociais";
import { Contato } from "./sections/Contato";
import { Sobre } from "./sections/Sobre";

export const revalidate = 60;

export default async function PublicHomePage() {
  const { data: reviews } = await supabasePublic
    .from("avaliacoes")
    .select("id,nome,estrelas,comentario,created_at")
    .eq("publicada", true)
    .order("created_at", { ascending: false });

  return (
    <>
      <Hero />
      <Sobre />
      <ComoFunciona />
      <ReviewsCarousel reviews={reviews ?? []} />
      <RedesSociais />
      <Contato />
    </>
  );
}
