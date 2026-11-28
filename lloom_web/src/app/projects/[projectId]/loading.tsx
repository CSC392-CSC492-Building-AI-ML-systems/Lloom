import Header from "@/components/Header";

export default function LoadingProject() {
    return (
        <>
            <Header showSearch={false} />
            <main className="px-4 py-6 md:px-10">
                <p role="status" className="text-content-secondary">
                    Loading project…
                </p>
            </main>
        </>
    );
}
