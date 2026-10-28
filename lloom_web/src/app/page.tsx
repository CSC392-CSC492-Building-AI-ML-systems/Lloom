import Header from "@/components/Header";
import ProjectActions from "@/components/ProjectActions";
import RecentProjects from "@/components/RecentProjects";

export default function Home() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header />

      <main className="flex min-h-0 flex-1 flex-col px-10 pt-10 pb-6">
        <ProjectActions />
        <RecentProjects />
      </main>
    </div>
  );
}