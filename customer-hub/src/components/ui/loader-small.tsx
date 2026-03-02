import { Loader2Icon } from "lucide-react";

interface LoaderSmallProps {
    className?: string; // Optional className prop
}

const LoaderSmall: React.FC<LoaderSmallProps> = ({ className }) => {
    return (
        <>
            <Loader2Icon className={`animate-spin ${className || ""}`} style={{ animationDuration: '1000ms'}} />
        </>

    );
}

export default LoaderSmall;