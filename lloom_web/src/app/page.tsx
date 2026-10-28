import Header from "@/components/Header";
import ProjectActions from "@/components/ProjectActions";
import RecentProjects from "@/components/RecentProjects";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col md:h-dvh md:overflow-hidden">
      <Header />

      <main className="flex min-h-0 flex-1 flex-col px-4 pt-6 pb-6 md:px-10 md:pt-10">
        <ProjectActions />
        <RecentProjects />
      </main>
    </div>
  );
}