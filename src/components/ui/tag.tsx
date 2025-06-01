import { Trash2 } from "lucide-react";
import { Button } from "./button";

export const Tag = ({
    tag,
    deleteTag
}: {
    tag: string;
    deleteTag?: () => void;
}) => {
    return (
    <div
        className={`flex items-center justify-between ${deleteTag ? "pr-2" : ""} px-4 py-2 gap-2 bg-secondary rounded-full ${deleteTag ? "hover:cursor-pointer" : ""}`}>
        <span className="text-sm font-medium min-w-8">{tag}</span>
        {deleteTag && (
            <Button variant="ghost" size="icon" onClick={deleteTag} className="hover:text-red-500 hover:cursor-pointer">
                <Trash2 className="h-4 w-4" />
            </Button>
        )}
    </div>
    )
}