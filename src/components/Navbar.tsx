import { useLocation } from "wouter";
import { ModeToggle } from "@/components/ModeToggle";
import { BackButton } from "@/components/BackButton";

export const Navbar = () => {
  const [location] = useLocation();
  const isHome = location === "/";

  return (
    <div className="relative flex h-14 items-center justify-center border-b px-4">
      <div className="absolute left-2">
        {!isHome && <BackButton onClick={() => window.history.back()} />}
      </div>

      <h1 className="font-oswald pointer-events-none text-3xl font-light select-none">
        <span className={"font-bold"}>OVARA</span>Label
      </h1>

      <div className="absolute right-2">
        <ModeToggle />
      </div>
    </div>
  );
};
