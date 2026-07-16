import Image from "next/image";

export default function NewsHeader() {
  return (
    <header className="sticky top-0 z-40 bg-ngen-copper shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
        <Image
          src="/ngen-logo-white.png"
          alt="NGen"
          width={72}
          height={24}
          className="h-6 w-auto object-contain"
        />
        <div className="w-px h-4 bg-white/25" />
        <div>
          <p className="text-white font-semibold leading-none tracking-tight">Manufacturing News</p>
        </div>
      </div>
    </header>
  );
}
