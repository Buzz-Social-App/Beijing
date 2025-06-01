import ClientTagPage from "@/components/page/tags";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function TagsPage() {

    return (
        <div className="container mx-auto p-4 flex flex-col h-[calc(100vh-4rem)]">
            <h1 className="text-2xl font-bold mb-4">Tags Management</h1>

            <ClientTagPage />
        </div>
    );
}
