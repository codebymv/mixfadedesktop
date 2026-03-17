interface HeaderProps {
  isEmpty?: boolean;
}

const Header = ({ isEmpty = false }: HeaderProps) => {
  return (
    <header
      className="sticky top-0 z-50 transition-all duration-[250ms] bg-transparent flex flex-col items-center justify-center pointer-events-none"
      style={{
        minHeight: isEmpty ? '240px' : '80px',
      }}>
      <div className={`w-full flex items-center justify-center transition-all duration-[250ms] ${isEmpty ? 'mt-8' : 'p-4'}`}>
        {/* Centered Logo */}
        <div className="relative pointer-events-auto">
          <img
            src="./mixfade_logo.png"
            alt="MixFade Logo"
            className={`transition-all duration-[250ms] transform origin-center ${
              isEmpty
                ? 'h-[120px] scale-110 drop-shadow-[0_0_45px_rgba(16,185,129,0.35)]'
                : 'h-[65px] drop-shadow-md'
            }`}
          />
        </div>
      </div>

      {/* Version badge — top-right corner */}
      <span className="absolute top-2 right-3 text-[10px] font-mono text-white/20 select-none pointer-events-none tracking-wide">
        v{__APP_VERSION__}
      </span>
    </header>
  );
};

export default Header;
