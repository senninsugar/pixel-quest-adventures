import { createFileRoute } from "@tanstack/react-router";
import { GameCanvas } from "@/components/GameCanvas";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "翠星の旅人 リオ — 2Dドット絵アクション冒険" },
      {
        name: "description",
        content:
          "オリジナル主人公リオと4つのエリアを冒険する2D見下ろし型ドット絵アクションゲーム。",
      },
      { property: "og:title", content: "翠星の旅人 リオ" },
      {
        property: "og:description",
        content: "3つの星のかけらを集めて翠光の神殿の番人ゴルダに挑むドット絵冒険ゲーム。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <GameCanvas />;
}
