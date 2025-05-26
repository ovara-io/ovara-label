import { useLocation } from "wouter";
import { ModeToggle } from "@/components/ModeToggle";
import { BackButton } from "@/components/BackButton";

export const Navbar = () => {
  const [location] = useLocation();
  const isHome = location === "/";

  return (
    <div className="relative flex h-14 items-center justify-center border-b px-4">
      {/* Left-aligned back button or placeholder */}
      <div className="absolute left-2">
        {!isHome && <BackButton onClick={() => window.history.back()} />}
      </div>

      {/* Centered title */}
      <h1 className="font-oswald text-3xl font-light">
        <span className={"font-bold"}>OVARA</span>Label
      </h1>

      {/* Right-aligned theme toggle */}
      <div className="absolute right-2">
        <ModeToggle />
      </div>
    </div>
  );
};
