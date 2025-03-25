import { cn } from "@/lib/utils";
import DynamicIcon, { IconName } from "./dynamic-icon";

interface TagProps {
    icon: IconName;
    title: string;
    className?: string;
    onClick?: () => void;
}

export function Tag({ icon, title, className, onClick }: TagProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "bg-neutral-800 rounded-2xl aspect-square flex flex-col w-fit items-center justify-center text-center p-2 space-y-1",
                onClick && "cursor-pointer",
                className
            )}>
            <DynamicIcon name={icon} className="h-8 w-8 text-neutral-100" />
            <span className="text-neutral-100 text-xs font-normal">{title}</span>
        </div>
    );
}
