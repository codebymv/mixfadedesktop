const Header = () => {
  return (
    <header
      className="sticky top-0 z-50 transition-all duration-300 bg-transparent"
      style={{
        minHeight: '60px',
        backgroundColor: 'transparent',
        background: 'none'
      }}>
      <div className="flex items-center justify-center p-4">
        {/* Centered Logo */}
        <img src="./mixfade_logo.png" alt="MixFade Logo" className="h-10" />
      </div>
    </header>
  );
};

export default Header;
