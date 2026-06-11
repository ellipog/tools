import Link from "next/link";
import ScrambleText from "@/components/ScrambleText";
import PinStar from "@/components/PinStar";
import { useMemo } from "react";
import { jpcharlist } from "@/public/data/charlists";

export type HeaderProps = {
  title: string;
  jp: string;
  category: string;
  href?: string;
};

export default function Navbar({ title, jp, category, href }: HeaderProps) {
  const jpchars = useMemo(() => jpcharlist, []);

  return (
    <div className="text-white pt-8 pl-11 absolute">
      <div className="text-xs text-white/40 tracking-widest uppercase flex items-center gap-1">
        {title !== "home" && (
          <Link
            href="/"
            className="hover:text-white transition-colors cursor-pointer"
          >
            / home / {category}
          </Link>
        )}
        <span>/</span>
      </div>
      <div className="flex items-baseline gap-3 flex-wrap">
        <ScrambleText text={title} className="text-3xl tracking-tight" />
        <ScrambleText
          text={jp}
          chars={jpchars}
          timeOffset={100}
          autoPlay={true}
          className="text-xl text-white/35 transition-colors"
        />
        {href && <PinStar href={href} />}
      </div>
    </div>
  );
}
