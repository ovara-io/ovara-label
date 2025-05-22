import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      className={"cursor-pointer"}
    >
      <ArrowLeft className="h-[1.2rem] w-[1.2rem] scale-125" />
    </Button>
  );
}
