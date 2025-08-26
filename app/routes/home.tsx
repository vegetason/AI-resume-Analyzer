import type { Route } from "./+types/home";


export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback on your resumes!" },
  ];
}

export default function Home() {
  return <main>

  </main>
}
