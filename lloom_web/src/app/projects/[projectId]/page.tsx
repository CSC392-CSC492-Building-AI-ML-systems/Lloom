import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { getProjectFixture } from "@/fixtures/projects";
import ProjectWorkspace from "./ProjectWorkspace";

type Props = { params: Promise<{ projectId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const project = getProjectFixture((await params).projectId);
    return { title: `${project?.name ?? "Project not found"} | LLooM Web` };
}

export default async function ProjectPage({ params }: Props) {
    const project = getProjectFixture((await params).projectId);
    if (!project) notFound();
    return (
        <div className="flex min-h-dvh flex-col">
            <Header showSearch={false} />
            <main className="min-w-0 flex-1 px-4 py-6 md:px-10">
                <nav aria-label="Breadcrumb" className="text-[15px]">
                    <ol className="flex flex-wrap gap-x-3 gap-y-1">
                        <li>
                            <Link
                                href="/"
                                className="rounded text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                            >
                                Projects
                            </Link>
                        </li>
                        <li
                            aria-current="page"
                            className="min-w-0 break-words text-content-secondary"
                        >
                            <span aria-hidden="true" className="mr-3">
                                /
                            </span>
                            {project.name}
                        </li>
                    </ol>
                </nav>
                <ProjectWorkspace project={project} />
            </main>
        </div>
    );
}
