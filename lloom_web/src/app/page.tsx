import Header from "@/components/Header";
import ProjectActions from "@/components/ProjectActions";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1 px-10 pt-10">
        <ProjectActions />
      </main>
    </>
  );
}
