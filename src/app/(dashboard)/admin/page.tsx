import ClientAdminPage from "@/components/page/admin";

export default function AdminPage() {
    return (
        <div className="container mx-auto p-4 flex flex-col h-[calc(100vh-4rem)]">
            <h1 className="text-2xl font-bold mb-4">Admin Management</h1>
            <ClientAdminPage />
        </div>
    );
}
